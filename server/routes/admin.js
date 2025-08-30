const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/admin/pending-users
// @desc    Get pending user approvals (admin only)
// @access  Private (Admin)
router.get("/pending-users", auth, authorize("admin"), async (req, res) => {
  try {
    const pendingUsers = await User.find({
      approvalStatus: "pending",
      role: { $in: ["organization_admin", "admin"] }
    })
      .select("-password")
      .sort({ createdAt: 1 });

    res.json(pendingUsers);
  } catch (error) {
    console.error("Get pending users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/admin/users/:id/approve
// @desc    Approve or reject user (admin only)
// @access  Private (Admin)
router.put(
  "/users/:id/approve",
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

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.approvalStatus !== "pending") {
        return res
          .status(400)
          .json({ message: "User is not pending approval" });
      }

      const updateData = {
        approvalStatus: req.body.approvalStatus,
        approvedBy: req.user._id,
        approvedAt: new Date()
      };

      if (req.body.approvalNotes) {
        updateData.approvalNotes = req.body.approvalNotes;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .select("-password")
        .populate("approvedBy", "profile.firstName profile.lastName");

      res.json({
        message: `User ${req.body.approvalStatus} successfully`,
        user: updatedUser
      });
    } catch (error) {
      console.error("Approve user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/admin/pending-doctors
// @desc    Get pending doctor approvals (admin only)
// @access  Private (Admin)
router.get("/pending-doctors", auth, authorize("admin"), async (req, res) => {
  try {
    const pendingDoctors = await Doctor.find({ approvalStatus: "pending" })
      .populate("userId", "profile.firstName profile.lastName email")
      .populate("hospitalId", "name")
      .sort({ createdAt: 1 });

    res.json(pendingDoctors);
  } catch (error) {
    console.error("Get pending doctors error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/admin/doctors/:id/approve
// @desc    Approve or reject doctor (admin only)
// @access  Private (Admin)
router.put(
  "/doctors/:id/approve",
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

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      if (doctor.approvalStatus !== "pending") {
        return res
          .status(400)
          .json({ message: "Doctor is not pending approval" });
      }

      const updateData = {
        approvalStatus: req.body.approvalStatus,
        approvedBy: req.user._id,
        approvedAt: new Date()
      };

      if (req.body.approvalNotes) {
        updateData.approvalNotes = req.body.approvalNotes;
      }

      const updatedDoctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate("userId", "profile.firstName profile.lastName email")
        .populate("hospitalId", "name")
        .populate("approvedBy", "profile.firstName profile.lastName");

      res.json({
        message: `Doctor ${req.body.approvalStatus} successfully`,
        doctor: updatedDoctor
      });
    } catch (error) {
      console.error("Approve doctor error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin)
router.get("/dashboard", auth, authorize("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      totalHospitals,
      pendingHospitals,
      totalDoctors,
      pendingDoctors,
      totalAppointments
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        approvalStatus: "pending",
        role: { $in: ["organization_admin", "admin"] }
      }),
      Hospital.countDocuments(),
      Hospital.countDocuments({ approvalStatus: "pending" }),
      Doctor.countDocuments(),
      Doctor.countDocuments({ approvalStatus: "pending" }),
      require("../models/Appointment").countDocuments()
    ]);

    res.json({
      stats: {
        totalUsers,
        pendingUsers,
        totalHospitals,
        pendingHospitals,
        totalDoctors,
        pendingDoctors,
        totalAppointments
      }
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get("/users", auth, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, approvalStatus } = req.query;

    const query = {};
    if (role) query.role = role;
    if (approvalStatus) query.approvalStatus = approvalStatus;

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
