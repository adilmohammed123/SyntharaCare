const express = require("express");
const { body, validationResult } = require("express-validator");
const Hospital = require("../models/Hospital");
const User = require("../models/User");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/hospitals
// @desc    Get all approved hospitals (public) or all hospitals for admins
// @access  Public/Private (Admin)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, type, city, search = "" } = req.query;

    // Check if user is admin - admins can see all hospitals
    const isAdmin = req.user && req.user.role === "admin";

    const query = {
      isActive: true
    };

    // Only show approved hospitals to non-admin users
    if (!isAdmin) {
      query.approvalStatus = "approved";
    }

    if (type) {
      query.type = type;
    }

    if (city) {
      query["address.city"] = { $regex: city, $options: "i" };
    }

    let hospitals = await Hospital.find(query)
      .populate("organizationAdmin", "profile.firstName profile.lastName email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1, name: 1 });

    // Add doctor count to each hospital
    const Doctor = require("../models/Doctor");
    for (let hospital of hospitals) {
      const doctorCount = await Doctor.countDocuments({
        hospitalId: hospital._id,
        isActive: true,
        approvalStatus: "approved"
      });
      hospital = hospital.toObject();
      hospital.doctorCount = doctorCount;
    }

    // Filter by search if provided
    if (search) {
      hospitals = hospitals.filter(
        (hospital) =>
          hospital.name.toLowerCase().includes(search.toLowerCase()) ||
          hospital.specializations.some((spec) =>
            spec.toLowerCase().includes(search.toLowerCase())
          ) ||
          hospital.address.city.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Hospital.countDocuments(query);

    res.json({
      hospitals,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Get hospitals error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/hospitals/:id
// @desc    Get hospital by ID (only approved hospitals for public, all for admins)
// @access  Public/Private (Admin)
router.get("/:id", async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
      .populate("organizationAdmin", "profile.firstName profile.lastName email")
      .populate("approvedBy", "profile.firstName profile.lastName");

    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    // Check if user is admin - admins can see all hospitals
    const isAdmin = req.user && req.user.role === "admin";

    // Only show approved hospitals to non-admin users
    if (!isAdmin && hospital.approvalStatus !== "approved") {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json(hospital);
  } catch (error) {
    console.error("Get hospital error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/hospitals
// @desc    Create new hospital (requires organization admin role)
// @access  Private (Organization Admin)
router.post(
  "/",
  auth,
  authorize("organization_admin"),
  [
    body("name").notEmpty().trim().withMessage("Hospital name is required"),
    body("type")
      .isIn(["public", "private", "specialty", "research", "teaching"])
      .withMessage("Invalid hospital type"),
    body("address.street").notEmpty().withMessage("Street address is required"),
    body("address.city").notEmpty().withMessage("City is required"),
    body("address.state").notEmpty().withMessage("State is required"),
    body("address.zipCode").notEmpty().withMessage("Zip code is required"),
    body("address.country").notEmpty().withMessage("Country is required"),
    body("contact.phone").notEmpty().withMessage("Phone number is required"),
    body("contact.email").isEmail().withMessage("Valid email is required"),
    body("facilities").isArray().withMessage("Facilities must be an array"),
    body("specializations")
      .isArray()
      .withMessage("Specializations must be an array")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if user is approved
      if (req.user.approvalStatus !== "approved") {
        return res.status(403).json({
          message:
            "Your account needs to be approved before you can create hospitals"
        });
      }

      const hospital = new Hospital({
        ...req.body,
        organizationAdmin: req.user._id
      });

      await hospital.save();

      res.status(201).json({
        message: "Hospital created successfully and pending approval",
        hospital
      });
    } catch (error) {
      console.error("Create hospital error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/hospitals/:id
// @desc    Update hospital
// @access  Private (Organization Admin - owner only)
router.put(
  "/:id",
  auth,
  authorize("organization_admin"),
  [
    body("name").optional().notEmpty().trim(),
    body("type")
      .optional()
      .isIn(["public", "private", "specialty", "research", "teaching"]),
    body("contact.email").optional().isEmail(),
    body("facilities").optional().isArray(),
    body("specializations").optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const hospital = await Hospital.findById(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      // Check if user owns this hospital
      if (hospital.organizationAdmin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedHospital = await Hospital.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate(
        "organizationAdmin",
        "profile.firstName profile.lastName email"
      );

      res.json({
        message: "Hospital updated successfully",
        hospital: updatedHospital
      });
    } catch (error) {
      console.error("Update hospital error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/hospitals/pending/approvals
// @desc    Get pending hospital approvals (admin only)
// @access  Private (Admin)
router.get("/pending/approvals", auth, authorize("admin"), async (req, res) => {
  try {
    const pendingHospitals = await Hospital.find({ approvalStatus: "pending" })
      .populate("organizationAdmin", "profile.firstName profile.lastName email")
      .sort({ createdAt: 1 });

    res.json(pendingHospitals);
  } catch (error) {
    console.error("Get pending hospitals error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/hospitals/:id/approve
// @desc    Approve or reject hospital (admin only)
// @access  Private (Admin)
router.put(
  "/:id/approve",
  auth,
  authorize("admin"),
  [
    body("approvalStatus")
      .isIn(["approved", "rejected"])
      .withMessage("Invalid approval status"),
    body("approvalNotes").optional().isLength({ max: 1000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const hospital = await Hospital.findById(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      if (hospital.approvalStatus !== "pending") {
        return res
          .status(400)
          .json({ message: "Hospital is not pending approval" });
      }

      const updateData = {
        approvalStatus: req.body.approvalStatus,
        approvedBy: req.user._id,
        approvedAt: new Date()
      };

      if (req.body.approvalNotes) {
        updateData.approvalNotes = req.body.approvalNotes;
      }

      const updatedHospital = await Hospital.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate(
          "organizationAdmin",
          "profile.firstName profile.lastName email"
        )
        .populate("approvedBy", "profile.firstName profile.lastName");

      res.json({
        message: `Hospital ${req.body.approvalStatus} successfully`,
        hospital: updatedHospital
      });
    } catch (error) {
      console.error("Approve hospital error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/hospitals/my-hospitals
// @desc    Get hospitals managed by organization admin
// @access  Private (Organization Admin)
router.get(
  "/my-hospitals",
  auth,
  authorize("organization_admin"),
  async (req, res) => {
    try {
      const hospitals = await Hospital.find({
        organizationAdmin: req.user._id
      }).sort({ createdAt: -1 });

      res.json(hospitals);
    } catch (error) {
      console.error("Get my hospitals error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/hospitals/:id
// @desc    Delete hospital (soft delete)
// @access  Private (Organization Admin - owner only)
router.delete(
  "/:id",
  auth,
  authorize("organization_admin"),
  async (req, res) => {
    try {
      const hospital = await Hospital.findById(req.params.id);
      if (!hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      // Check if user owns this hospital
      if (hospital.organizationAdmin.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Soft delete
      hospital.isActive = false;
      await hospital.save();

      res.json({ message: "Hospital deleted successfully" });
    } catch (error) {
      console.error("Delete hospital error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
