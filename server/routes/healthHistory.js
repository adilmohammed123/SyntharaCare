const express = require("express");
const { body, validationResult } = require("express-validator");
const HealthHistory = require("../models/HealthHistory");
const Appointment = require("../models/Appointment");
const { auth, authorize } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const gcsService = require("../services/gcsService");

const router = express.Router();

// Configure multer for memory storage (we'll upload to GCS)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only specific file types
    const allowedTypes = (
      process.env.ALLOWED_FILE_TYPES ||
      "application/pdf,image/jpeg,image/png,image/gif,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ).split(",");

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, images, and documents are allowed."
        ),
        false
      );
    }
  }
});

// @route   POST /api/health-history/upload
// @desc    Upload health history document
// @access  Private (Patients)
router.post(
  "/upload",
  auth,
  authorize("patient"),
  upload.single("file"),
  [
    body("title").notEmpty().trim().withMessage("Title is required"),
    body("category")
      .isIn([
        "lab_report",
        "imaging",
        "prescription",
        "medical_record",
        "vaccination_record",
        "allergy_test",
        "surgery_record",
        "discharge_summary",
        "consultation_note",
        "other"
      ])
      .withMessage("Invalid category"),
    body("dateOfRecord").isISO8601().withMessage("Valid date is required"),
    body("description").optional().isLength({ max: 1000 }),
    body("doctorName").optional().trim(),
    body("hospitalName").optional().trim(),
    body("tags").optional().isArray(),
    body("isPrivate").optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      // Upload file to Google Cloud Storage
      const uploadResult = await gcsService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        "health-history",
        {
          mimeType: req.file.mimetype,
          patientId: req.user._id.toString(),
          category: req.body.category,
          title: req.body.title
        }
      );

      // Determine document type based on mime type
      let documentType = "document";
      if (req.file.mimetype === "application/pdf") {
        documentType = "pdf";
      } else if (req.file.mimetype.startsWith("image/")) {
        documentType = "image";
      } else if (req.file.mimetype === "text/plain") {
        documentType = "text";
      }

      const healthHistory = new HealthHistory({
        patientId: req.user._id,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        documentType: documentType,
        fileUrl: uploadResult.publicUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        dateOfRecord: new Date(req.body.dateOfRecord),
        doctorName: req.body.doctorName,
        hospitalName: req.body.hospitalName,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        isPrivate: req.body.isPrivate === "true"
      });

      await healthHistory.save();

      res.status(201).json({
        message: "Health history uploaded successfully",
        healthHistory
      });
    } catch (error) {
      console.error("Upload health history error:", error);
      res.status(500).json({
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
);

// @route   GET /api/health-history
// @desc    Get patient's health history
// @access  Private (Patients)
router.get("/", auth, authorize("patient"), async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search = "" } = req.query;

    let query = {
      patientId: req.user._id,
      isActive: true
    };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { doctorName: { $regex: search, $options: "i" } },
        { hospitalName: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const healthHistory = await HealthHistory.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dateOfRecord: -1, createdAt: -1 });

    const total = await HealthHistory.countDocuments(query);

    res.json({
      healthHistory,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Get health history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/health-history/:id
// @desc    Get specific health history document
// @access  Private (Patients, Doctors, Hospital Admins)
router.get("/:id", auth, async (req, res) => {
  try {
    const healthHistory = await HealthHistory.findById(req.params.id);

    if (!healthHistory) {
      return res.status(404).json({ message: "Health history not found" });
    }

    // Check permissions
    if (
      req.user.role === "patient" &&
      healthHistory.patientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // For doctors and hospital admins, check if they have access through appointments
    if (req.user.role === "doctor" || req.user.role === "organization_admin") {
      const Appointment = require("../models/Appointment");
      const Doctor = require("../models/Doctor");

      if (req.user.role === "doctor") {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
          return res.status(403).json({ message: "Access denied" });
        }

        const hasAccess = await Appointment.findOne({
          doctorId: doctor._id,
          "sharedHealthHistory.healthHistoryId": healthHistory._id
        });

        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      if (req.user.role === "organization_admin") {
        const Hospital = require("../models/Hospital");
        const hospital = await Hospital.findById(req.user.adminHospital);

        if (!hospital) {
          return res.status(403).json({ message: "Access denied" });
        }

        const hasAccess = await Appointment.findOne({
          hospitalId: hospital._id,
          "sharedHealthHistory.healthHistoryId": healthHistory._id
        });

        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
    }

    res.json(healthHistory);
  } catch (error) {
    console.error("Get health history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/health-history/:id
// @desc    Update health history document
// @access  Private (Patients)
router.put(
  "/:id",
  auth,
  authorize("patient"),
  [
    body("title").optional().notEmpty().trim(),
    body("description").optional().isLength({ max: 1000 }),
    body("category")
      .optional()
      .isIn([
        "lab_report",
        "imaging",
        "prescription",
        "medical_record",
        "vaccination_record",
        "allergy_test",
        "surgery_record",
        "discharge_summary",
        "consultation_note",
        "other"
      ]),
    body("dateOfRecord").optional().isISO8601(),
    body("doctorName").optional().trim(),
    body("hospitalName").optional().trim(),
    body("tags").optional().isArray(),
    body("isPrivate").optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const healthHistory = await HealthHistory.findById(req.params.id);

      if (!healthHistory) {
        return res.status(404).json({ message: "Health history not found" });
      }

      if (healthHistory.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedHealthHistory = await HealthHistory.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({
        message: "Health history updated successfully",
        healthHistory: updatedHealthHistory
      });
    } catch (error) {
      console.error("Update health history error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/health-history/:id
// @desc    Delete health history document (soft delete)
// @access  Private (Patients)
router.delete("/:id", auth, authorize("patient"), async (req, res) => {
  try {
    const healthHistory = await HealthHistory.findById(req.params.id);

    if (!healthHistory) {
      return res.status(404).json({ message: "Health history not found" });
    }

    if (healthHistory.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Extract file path from GCS URL for deletion
    if (
      healthHistory.fileUrl &&
      healthHistory.fileUrl.includes("storage.googleapis.com")
    ) {
      try {
        const urlParts = healthHistory.fileUrl.split("/");
        const bucketIndex = urlParts.findIndex(
          (part) => part === process.env.GCS_BUCKET_NAME
        );
        if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
          const filePath = urlParts.slice(bucketIndex + 1).join("/");
          await gcsService.deleteFile(filePath);
        }
      } catch (deleteError) {
        console.error("Error deleting file from GCS:", deleteError);
        // Continue with soft delete even if GCS deletion fails
      }
    }

    // Soft delete
    healthHistory.isActive = false;
    await healthHistory.save();

    res.json({ message: "Health history deleted successfully" });
  } catch (error) {
    console.error("Delete health history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/health-history/share-with-appointment
// @desc    Share health history with an appointment
// @access  Private (Patients)
router.post(
  "/share-with-appointment",
  auth,
  authorize("patient"),
  [
    body("appointmentId").isMongoId().withMessage("Appointment ID is required"),
    body("healthHistoryIds")
      .isArray()
      .withMessage("Health history IDs are required")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { appointmentId, healthHistoryIds } = req.body;

      // Verify appointment belongs to patient
      const appointment = await Appointment.findById(appointmentId);
      if (
        !appointment ||
        appointment.patientId.toString() !== req.user._id.toString()
      ) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Verify health history documents belong to patient
      const healthHistoryDocs = await HealthHistory.find({
        _id: { $in: healthHistoryIds },
        patientId: req.user._id,
        isActive: true
      });

      if (healthHistoryDocs.length !== healthHistoryIds.length) {
        return res.status(400).json({
          message: "Some health history documents not found or access denied"
        });
      }

      // Add health history to appointment
      const sharedHealthHistory = healthHistoryIds.map((healthHistoryId) => ({
        healthHistoryId,
        sharedAt: new Date()
      }));

      appointment.sharedHealthHistory = sharedHealthHistory;
      await appointment.save();

      // Update health history documents with appointment reference
      for (const healthHistoryId of healthHistoryIds) {
        await HealthHistory.findByIdAndUpdate(healthHistoryId, {
          $push: {
            sharedWithAppointments: {
              appointmentId,
              sharedAt: new Date()
            }
          }
        });
      }

      res.json({
        message: "Health history shared with appointment successfully",
        appointment
      });
    } catch (error) {
      console.error("Share health history error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/health-history/appointment/:appointmentId
// @desc    Get health history shared with specific appointment
// @access  Private (Patients, Doctors, Hospital Admins)
router.get("/appointment/:appointmentId", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(
      req.params.appointmentId
    ).populate("sharedHealthHistory.healthHistoryId");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check permissions
    if (
      req.user.role === "patient" &&
      appointment.patientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "doctor") {
      const Doctor = require("../models/Doctor");
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (
        !doctor ||
        appointment.doctorId.toString() !== doctor._id.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (req.user.role === "organization_admin") {
      const Hospital = require("../models/Hospital");
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (
        !hospital ||
        appointment.hospitalId.toString() !== hospital._id.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json({
      appointmentId: appointment._id,
      sharedHealthHistory: appointment.sharedHealthHistory
    });
  } catch (error) {
    console.error("Get appointment health history error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
