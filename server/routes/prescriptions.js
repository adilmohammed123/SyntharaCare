const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const { auth, authorize } = require("../middleware/auth");

// Get all prescriptions for a patient
router.get("/patient", auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "profile.firstName profile.lastName"
        }
      })
      .populate("hospitalId", "name")
      .populate("appointmentId", "date time status sessionPhase type")
      .sort({ prescriptionDate: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all prescriptions for a doctor
router.get("/doctor", auth, authorize("doctor"), async (req, res) => {
  try {
    // Find the doctor record for this user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" });
    }

    const prescriptions = await Prescription.find({
      doctorId: doctor._id
    })
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate("hospitalId", "name")
      .populate("appointmentId", "date time status sessionPhase type")
      .sort({ prescriptionDate: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get prescriptions for a specific appointment
router.get("/appointment/:appointmentId", auth, async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;

    // Check if user has access to this appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Check access permissions
    if (
      req.user.role === "patient" &&
      appointment.patientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (
        !doctor ||
        appointment.doctorId.toString() !== doctor._id.toString()
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    }

    const prescriptions = await Prescription.find({ appointmentId })
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "profile.firstName profile.lastName"
        }
      })
      .populate("hospitalId", "name")
      .populate("appointmentId", "date time status sessionPhase type")
      .sort({ prescriptionDate: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get prescription by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "profile.firstName profile.lastName"
        }
      })
      .populate("hospitalId", "name")
      .populate("appointmentId", "date time status sessionPhase type");

    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }

    // Check if user has access to this prescription
    if (
      req.user.role === "patient" &&
      prescription.patientId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (
        !doctor ||
        prescription.doctorId._id.toString() !== doctor._id.toString()
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    }

    res.json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new prescription
router.post("/", auth, authorize("doctor"), async (req, res) => {
  try {
    // Find the doctor record for this user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" });
    }

    const {
      patientId,
      appointmentId,
      originalText,
      extractedMedicines,
      diagnosis,
      symptoms,
      notes,
      nextVisitDate,
      scanMethod,
      imageUrl
    } = req.body;

    // Validate appointment exists and belongs to the doctor
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }
      if (appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this appointment"
        });
      }
      if (appointment.patientId.toString() !== patientId) {
        return res.status(400).json({
          success: false,
          message: "Patient ID does not match appointment"
        });
      }
    }

    const prescription = new Prescription({
      patientId,
      doctorId: doctor._id,
      hospitalId: doctor.hospitalId,
      appointmentId: appointmentId || null,
      originalText,
      extractedMedicines,
      diagnosis,
      symptoms,
      notes,
      nextVisitDate,
      scanMethod,
      imageUrl
    });

    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "profile.firstName profile.lastName"
        }
      })
      .populate("hospitalId", "name")
      .populate("appointmentId", "date time status sessionPhase type");

    res
      .status(201)
      .json({ success: true, prescription: populatedPrescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update prescription
router.put("/:id", auth, authorize("doctor"), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }

    // Find the doctor record for this user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" });
    }

    // Check if doctor owns this prescription
    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "profile.firstName profile.lastName"
        }
      })
      .populate("hospitalId", "name")
      .populate("appointmentId", "date time status sessionPhase type");

    res.json({ success: true, prescription: updatedPrescription });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete prescription
router.delete("/:id", auth, authorize("doctor"), async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }

    // Find the doctor record for this user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" });
    }

    // Check if doctor owns this prescription
    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await Prescription.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Prescription deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get prescription statistics
router.get("/stats/doctor", auth, authorize("doctor"), async (req, res) => {
  try {
    // Find the doctor record for this user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found" });
    }

    const totalPrescriptions = await Prescription.countDocuments({
      doctorId: doctor._id
    });
    const activePrescriptions = await Prescription.countDocuments({
      doctorId: doctor._id,
      status: "active"
    });
    const thisMonthPrescriptions = await Prescription.countDocuments({
      doctorId: doctor._id,
      prescriptionDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    res.json({
      success: true,
      stats: {
        total: totalPrescriptions,
        active: activePrescriptions,
        thisMonth: thisMonthPrescriptions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create prescription for a specific appointment
router.post(
  "/appointment/:appointmentId",
  auth,
  authorize(["doctor", "patient", "admin", "organization_admin"]),
  async (req, res) => {
    try {
      const { appointmentId } = req.params;

      // Find the appointment
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found" });
      }

      let doctor;

      if (req.user.role === "doctor") {
        // Find the doctor record for this user
        doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor) {
          return res
            .status(404)
            .json({ success: false, message: "Doctor profile not found" });
        }

        // Check if the doctor owns this appointment
        if (appointment.doctorId.toString() !== doctor._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Access denied. Doctor does not own this appointment."
          });
        }
      } else if (req.user.role === "patient") {
        // For patients, check if they own the appointment and get the doctor from the appointment
        if (appointment.patientId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Access denied. Patient does not own this appointment."
          });
        }

        // Get the doctor from the appointment
        doctor = await Doctor.findById(appointment.doctorId);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: "Doctor not found for this appointment."
          });
        }
      } else if (req.user.role === "admin") {
        // Admins can create prescriptions for any appointment
        // Get the doctor from the appointment
        doctor = await Doctor.findById(appointment.doctorId);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: "Doctor not found for this appointment."
          });
        }
      } else if (req.user.role === "organization_admin") {
        // Organization admins can create prescriptions for appointments in their hospital
        const Hospital = require("../models/Hospital");
        const hospital = await Hospital.findById(req.user.adminHospital);

        if (!hospital || hospital.approvalStatus !== "approved") {
          return res.status(403).json({
            success: false,
            message: "Access denied. No approved hospital found."
          });
        }

        // Get the doctor from the appointment
        doctor = await Doctor.findById(appointment.doctorId);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: "Doctor not found for this appointment."
          });
        }

        // Check if the doctor belongs to the admin's hospital
        if (doctor.hospitalId.toString() !== hospital._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Access denied. Doctor does not belong to your hospital."
          });
        }
      }

      // Check if appointment is completed
      if (appointment.status !== "completed") {
        return res.status(400).json({
          success: false,
          message:
            "Prescriptions can only be created for completed appointments."
        });
      }

      const {
        originalText,
        extractedMedicines,
        diagnosis,
        symptoms,
        notes,
        nextVisitDate,
        scanMethod,
        imageUrl
      } = req.body;

      console.log("Prescription creation request body:", req.body);
      console.log("User data:", {
        userId: req.user._id,
        userRole: req.user.role,
        userEmail: req.user.email
      });
      console.log("Appointment data:", {
        id: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        hospitalId: appointment.hospitalId,
        status: appointment.status
      });
      console.log("Doctor data:", {
        id: doctor._id,
        hospitalId: doctor.hospitalId
      });

      const prescription = new Prescription({
        patientId: appointment.patientId,
        doctorId: doctor._id,
        hospitalId: doctor.hospitalId,
        appointmentId: appointment._id,
        originalText,
        extractedMedicines,
        diagnosis,
        symptoms,
        notes,
        nextVisitDate,
        scanMethod,
        imageUrl
      });

      console.log("Creating prescription with data:", {
        patientId: appointment.patientId,
        doctorId: doctor._id,
        hospitalId: doctor.hospitalId,
        appointmentId: appointment._id,
        originalText,
        extractedMedicines,
        diagnosis,
        symptoms,
        notes,
        nextVisitDate,
        scanMethod,
        imageUrl
      });

      try {
        await prescription.save();
        console.log("Prescription saved successfully:", prescription._id);
      } catch (saveError) {
        console.error("Error saving prescription:", saveError);
        if (saveError.name === "ValidationError") {
          console.error("Validation errors:", saveError.errors);
        }
        throw saveError;
      }

      const populatedPrescription = await Prescription.findById(
        prescription._id
      )
        .populate("patientId", "profile.firstName profile.lastName email")
        .populate({
          path: "doctorId",
          populate: {
            path: "userId",
            select: "profile.firstName profile.lastName"
          }
        })
        .populate("hospitalId", "name")
        .populate({
          path: "appointmentId",
          populate: [
            { path: "patientId", select: "profile.firstName profile.lastName" },
            {
              path: "doctorId",
              populate: {
                path: "userId",
                select: "profile.firstName profile.lastName"
              }
            },
            { path: "hospitalId", select: "name" }
          ]
        });

      res
        .status(201)
        .json({ success: true, prescription: populatedPrescription });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Get prescriptions for a specific appointment
router.get("/appointment/:appointmentId", auth, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Authorization check
    if (
      req.user.role === "patient" &&
      appointment.patientId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (
        !doctor ||
        appointment.doctorId.toString() !== doctor._id.toString()
      ) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
    }

    const prescriptions = await Prescription.find({ appointmentId })
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "profile.firstName profile.lastName"
        }
      })
      .populate("hospitalId", "name")
      .populate({
        path: "appointmentId",
        populate: [
          { path: "patientId", select: "profile.firstName profile.lastName" },
          {
            path: "doctorId",
            populate: {
              path: "userId",
              select: "profile.firstName profile.lastName"
            }
          },
          { path: "hospitalId", select: "name" }
        ]
      })
      .sort({ prescriptionDate: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
