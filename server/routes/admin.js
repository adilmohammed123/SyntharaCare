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
      role: { $in: ["organization_admin", "admin", "doctor"] }
    })
      .select("-password")
      .sort({ createdAt: 1 });

    res.json(pendingUsers);
  } catch (error) {
    console.error("Get pending users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/admin/hospital/pending-doctors
// @desc    Get pending doctor approvals for hospital admin's hospital
// @access  Private (Hospital Admin)
router.get(
  "/hospital/pending-doctors",
  auth,
  authorize("organization_admin"),
  async (req, res) => {
    try {
      // Find the hospital where this admin works
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (!hospital) {
        return res
          .status(404)
          .json({ message: "Hospital not found for this admin" });
      }

      // Get pending doctors for this hospital
      const pendingDoctors = await Doctor.find({
        hospitalId: hospital._id,
        approvalStatus: "pending"
      })
        .populate("userId", "profile.firstName profile.lastName email")
        .populate("hospitalId", "name")
        .sort({ createdAt: 1 });

      res.json(pendingDoctors);
    } catch (error) {
      console.error("Get hospital pending doctors error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/admin/hospital/doctors/:id/approve
// @desc    Approve or reject doctor at hospital (hospital admin only)
// @access  Private (Hospital Admin)
router.put(
  "/hospital/doctors/:id/approve",
  auth,
  authorize("organization_admin"),
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

      // Find the hospital where this admin works
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (!hospital) {
        return res
          .status(404)
          .json({ message: "Hospital not found for this admin" });
      }

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Verify the doctor belongs to this hospital
      if (doctor.hospitalId.toString() !== hospital._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to approve this doctor" });
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

      // If approving the doctor profile, also approve the user
      if (req.body.approvalStatus === "approved") {
        await User.findByIdAndUpdate(doctor.userId, {
          approvalStatus: "approved",
          approvedBy: req.user._id,
          approvedAt: new Date()
        });
      }

      res.json({
        message: `Doctor ${req.body.approvalStatus} successfully`,
        doctor: updatedDoctor
      });
    } catch (error) {
      console.error("Approve hospital doctor error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/admin/hospital/dashboard
// @desc    Get hospital admin dashboard stats
// @access  Private (Hospital Admin)
router.get(
  "/hospital/dashboard",
  auth,
  authorize("organization_admin"),
  async (req, res) => {
    try {
      // Find the hospital where this admin works
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (!hospital) {
        return res
          .status(404)
          .json({ message: "Hospital not found for this admin" });
      }

      const [totalDoctors, pendingDoctors, totalAppointments] =
        await Promise.all([
          Doctor.countDocuments({ hospitalId: hospital._id }),
          Doctor.countDocuments({
            hospitalId: hospital._id,
            approvalStatus: "pending"
          }),
          require("../models/Appointment").countDocuments({
            hospitalId: hospital._id
          })
        ]);

      res.json({
        stats: {
          hospitalName: hospital.name,
          totalDoctors,
          pendingDoctors,
          totalAppointments
        }
      });
    } catch (error) {
      console.error("Get hospital dashboard error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

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

      // If approving a doctor, also approve their doctor profile
      if (user.role === "doctor" && req.body.approvalStatus === "approved") {
        const Doctor = require("../models/Doctor");
        const doctor = await Doctor.findOne({ userId: user._id });

        if (doctor) {
          await Doctor.findByIdAndUpdate(doctor._id, {
            approvalStatus: "approved",
            approvedBy: req.user._id,
            approvedAt: new Date()
          });
        }
      }

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
        role: { $in: ["organization_admin", "admin", "doctor"] }
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

// @route   GET /api/admin/hospital/doctors
// @desc    Get all doctors for hospital admin's hospital
// @access  Private (Hospital Admin)
router.get(
  "/hospital/doctors",
  auth,
  authorize("organization_admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status, specialization } = req.query;

      // Find the hospital where this admin works
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (!hospital) {
        return res
          .status(404)
          .json({ message: "Hospital not found for this admin" });
      }

      let query = { hospitalId: hospital._id };

      if (status) {
        query.approvalStatus = status;
      }

      if (specialization) {
        query.specialization = { $regex: specialization, $options: "i" };
      }

      const doctors = await Doctor.find(query)
        .populate(
          "userId",
          "profile.firstName profile.lastName email approvalStatus"
        )
        .populate("hospitalId", "name")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Doctor.countDocuments(query);

      res.json({
        doctors,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
    } catch (error) {
      console.error("Get hospital doctors error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/admin/hospital/doctors/:id
// @desc    Update doctor profile (hospital admin only)
// @access  Private (Hospital Admin)
router.put(
  "/hospital/doctors/:id",
  auth,
  authorize("organization_admin"),
  [
    body("specialization").optional().isLength({ max: 100 }),
    body("consultationFee").optional().isFloat({ min: 0 }),
    body("experience").optional().isInt({ min: 0 }),
    body("availability").optional().isArray(),
    body("languages").optional().isArray(),
    body("bio").optional().isLength({ max: 1000 }),
    body("isActive").optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Find the hospital where this admin works
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (!hospital) {
        return res
          .status(404)
          .json({ message: "Hospital not found for this admin" });
      }

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Verify the doctor belongs to this hospital
      if (doctor.hospitalId.toString() !== hospital._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this doctor" });
      }

      const updatedDoctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate("userId", "profile.firstName profile.lastName email")
        .populate("hospitalId", "name");

      res.json({
        message: "Doctor profile updated successfully",
        doctor: updatedDoctor
      });
    } catch (error) {
      console.error("Update hospital doctor error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/admin/hospital/doctors/:id
// @desc    Remove doctor from hospital (hospital admin only)
// @access  Private (Hospital Admin)
router.delete(
  "/hospital/doctors/:id",
  auth,
  authorize("organization_admin"),
  async (req, res) => {
    try {
      // Find the hospital where this admin works
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (!hospital) {
        return res
          .status(404)
          .json({ message: "Hospital not found for this admin" });
      }

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Verify the doctor belongs to this hospital
      if (doctor.hospitalId.toString() !== hospital._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to remove this doctor" });
      }

      // Check if doctor has any upcoming appointments
      const Appointment = require("../models/Appointment");
      const upcomingAppointments = await Appointment.find({
        doctorId: doctor._id,
        status: { $in: ["scheduled", "confirmed"] },
        date: { $gte: new Date() }
      });

      if (upcomingAppointments.length > 0) {
        return res.status(400).json({
          message:
            "Cannot remove doctor with upcoming appointments. Please reschedule or cancel appointments first."
        });
      }

      // Deactivate the doctor instead of deleting
      await Doctor.findByIdAndUpdate(doctor._id, {
        isActive: false,
        approvalStatus: "rejected"
      });

      res.json({
        message: "Doctor removed from hospital successfully"
      });
    } catch (error) {
      console.error("Remove hospital doctor error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/admin/hospital/doctors/:id/appointments
// @desc    Get appointments for a specific doctor in hospital (hospital admin only)
// @access  Private (Hospital Admin)
router.get(
  "/hospital/doctors/:id/appointments",
  auth,
  authorize("organization_admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status, date } = req.query;

      // Find the hospital where this admin works
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (!hospital) {
        return res
          .status(404)
          .json({ message: "Hospital not found for this admin" });
      }

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Verify the doctor belongs to this hospital
      if (doctor.hospitalId.toString() !== hospital._id.toString()) {
        return res.status(403).json({
          message: "Not authorized to view this doctor's appointments"
        });
      }

      let query = { doctorId: doctor._id };

      if (status) {
        query.status = status;
      }

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }

      const Appointment = require("../models/Appointment");
      const appointments = await Appointment.find(query)
        .populate("patientId", "profile.firstName profile.lastName email")
        .populate("doctorId", "specialization")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ date: 1, time: 1 });

      const total = await Appointment.countDocuments(query);

      res.json({
        appointments,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      });
    } catch (error) {
      console.error("Get hospital doctor appointments error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/admin/hospital/doctors/:id/appointments/:appointmentId
// @desc    Update appointment status (hospital admin only)
// @access  Private (Hospital Admin)
router.put(
  "/hospital/doctors/:id/appointments/:appointmentId",
  auth,
  authorize("organization_admin"),
  [
    body("status")
      .isIn(["scheduled", "confirmed", "completed", "cancelled", "no-show"])
      .withMessage("Invalid appointment status")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Find the hospital where this admin works
      const hospital = await Hospital.findById(req.user.adminHospital);
      if (!hospital) {
        return res
          .status(404)
          .json({ message: "Hospital not found for this admin" });
      }

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      // Verify the doctor belongs to this hospital
      if (doctor.hospitalId.toString() !== hospital._id.toString()) {
        return res.status(403).json({
          message: "Not authorized to manage this doctor's appointments"
        });
      }

      const Appointment = require("../models/Appointment");
      const appointment = await Appointment.findById(req.params.appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Verify the appointment belongs to this doctor
      if (appointment.doctorId.toString() !== doctor._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to manage this appointment" });
      }

      appointment.status = req.body.status;
      await appointment.save();

      res.json({
        message: "Appointment status updated successfully",
        appointment
      });
    } catch (error) {
      console.error("Update hospital appointment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
