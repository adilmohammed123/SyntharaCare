const express = require("express");
const { body, validationResult } = require("express-validator");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private
router.post(
  "/",
  auth,
  [
    body("hospitalId").isMongoId().withMessage("Hospital ID is required"),
    body("doctorId").isMongoId(),
    body("date").isISO8601(),
    body("time").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body("symptoms").optional().isLength({ max: 1000 }),
    body("type")
      .optional()
      .isIn(["consultation", "follow-up", "emergency", "routine"])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        hospitalId,
        doctorId,
        date,
        time,
        symptoms,
        type = "consultation"
      } = req.body;

      // Check if hospital exists and is approved
      const Hospital = require("../models/Hospital");
      const hospital = await Hospital.findById(hospitalId);
      if (
        !hospital ||
        hospital.approvalStatus !== "approved" ||
        !hospital.isActive
      ) {
        return res
          .status(404)
          .json({ message: "Hospital not found or not approved" });
      }

      // Check if doctor exists, is available, and belongs to the selected hospital
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || !doctor.isActive || doctor.approvalStatus !== "approved") {
        return res
          .status(404)
          .json({ message: "Doctor not found or not approved" });
      }

      // Verify doctor belongs to the selected hospital
      if (doctor.hospitalId.toString() !== hospitalId) {
        return res
          .status(400)
          .json({ message: "Doctor does not belong to the selected hospital" });
      }

      // Check if time slot is available
      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      const dayAvailability = doctor.availability.find(
        (avail) => avail.day === dayOfWeek
      );
      if (!dayAvailability || !dayAvailability.isAvailable) {
        return res
          .status(400)
          .json({ message: "Doctor not available on this day" });
      }

      // Check for conflicts
      const conflictingAppointment = await Appointment.findOne({
        doctorId,
        date: appointmentDate,
        time,
        status: { $in: ["scheduled", "confirmed"] }
      });

      if (conflictingAppointment) {
        return res.status(400).json({ message: "Time slot is already booked" });
      }

      const appointment = new Appointment({
        patientId: req.user._id,
        doctorId,
        hospitalId,
        date: appointmentDate,
        time,
        symptoms,
        type,
        consultationFee: doctor.consultationFee
      });

      await appointment.save();

      // Assign queue position
      try {
        const existingAppointments = await Appointment.find({
          doctorId,
          date: appointmentDate,
          status: { $in: ["scheduled", "confirmed", "in-progress"] }
        }).sort({ queuePosition: 1, createdAt: 1 });

        // Find the next available queue position
        let nextPosition = 1;
        for (const existingAppointment of existingAppointments) {
          if (existingAppointment.queuePosition >= nextPosition) {
            nextPosition = existingAppointment.queuePosition + 1;
          }
        }

        appointment.queuePosition = nextPosition;
        await appointment.save();
      } catch (error) {
        console.error("Error assigning queue position:", error);
        // Fallback: assign a default position
        appointment.queuePosition = 1;
        await appointment.save();
      }

      res.status(201).json({
        message: "Appointment scheduled successfully",
        appointment
      });
    } catch (error) {
      console.error("Create appointment error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/appointments
// @desc    Get appointments for current user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;

    let query = {};
    if (req.user.role === "patient") {
      query.patientId = req.user._id;
    } else if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) {
        query.doctorId = doctor._id;
      }
    } else if (req.user.role === "organization_admin") {
      // Hospital admins can see appointments for doctors in their hospitals
      const Hospital = require("../models/Hospital");
      const userHospitals = await Hospital.find({
        organizationAdmin: req.user._id,
        approvalStatus: "approved"
      });

      if (userHospitals.length > 0) {
        const hospitalIds = userHospitals.map((h) => h._id);
        const doctorsInHospitals = await Doctor.find({
          hospitalId: { $in: hospitalIds },
          approvalStatus: "approved"
        });

        if (doctorsInHospitals.length > 0) {
          const doctorIds = doctorsInHospitals.map((d) => d._id);
          query.doctorId = { $in: doctorIds };
        } else {
          // No doctors in hospitals, return empty result
          return res.json({
            appointments: [],
            totalPages: 0,
            currentPage: page,
            total: 0
          });
        }
      } else {
        // No approved hospitals, return empty result
        return res.json({
          appointments: [],
          totalPages: 0,
          currentPage: page,
          total: 0
        });
      }
    } else if (req.user.role === "admin") {
      // Admins can see all appointments
      // No additional query filters needed
    }

    if (status) {
      query.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate("doctorId", "userId specialization")
      .populate("doctorId.userId", "profile.firstName profile.lastName")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: 1, time: 1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "profile.firstName profile.lastName email")
      .populate("doctorId", "userId specialization")
      .populate("doctorId.userId", "profile.firstName profile.lastName");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check permissions
    if (
      req.user.role === "patient" &&
      appointment.patientId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (
        !doctor ||
        appointment.doctorId._id.toString() !== doctor._id.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (req.user.role === "organization_admin") {
      // Hospital admins can access appointments for doctors in their hospitals
      const Hospital = require("../models/Hospital");
      const userHospitals = await Hospital.find({
        organizationAdmin: req.user._id,
        approvalStatus: "approved"
      });

      if (userHospitals.length > 0) {
        const hospitalIds = userHospitals.map((h) => h._id);
        const doctor = await Doctor.findById(appointment.doctorId._id);

        if (!doctor || !hospitalIds.includes(doctor.hospitalId.toString())) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(appointment);
  } catch (error) {
    console.error("Get appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status
// @access  Private
router.put(
  "/:id/status",
  auth,
  [
    body("status").isIn([
      "scheduled",
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
      "no-show"
    ]),
    body("cancellationReason").optional().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, cancellationReason } = req.body;
      const appointment = await Appointment.findById(req.params.id);

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
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (
          !doctor ||
          appointment.doctorId.toString() !== doctor._id.toString()
        ) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      appointment.status = status;
      if (status === "cancelled" && cancellationReason) {
        appointment.cancellationReason = cancellationReason;
        appointment.cancelledBy = req.user.role;
      }

      await appointment.save();

      res.json({
        message: "Appointment status updated successfully",
        appointment
      });
    } catch (error) {
      console.error("Update appointment status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   DELETE /api/appointments/:id
// @desc    Cancel appointment
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

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
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (
        !doctor ||
        appointment.doctorId.toString() !== doctor._id.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    appointment.status = "cancelled";
    appointment.cancelledBy = req.user.role;
    await appointment.save();

    res.json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/appointments/:id/session-phase
// @desc    Update appointment session phase
// @access  Private (Doctors)
router.put(
  "/:id/session-phase",
  auth,
  authorize("doctor"),
  [
    body("sessionPhase").isIn([
      "waiting",
      "data-collection",
      "initial-assessment",
      "examination",
      "diagnosis",
      "treatment",
      "surgery",
      "recovery",
      "follow-up",
      "discharge"
    ])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Check if doctor owns this appointment
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (
        !doctor ||
        appointment.doctorId.toString() !== doctor._id.toString()
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      appointment.sessionPhase = req.body.sessionPhase;
      await appointment.save();

      res.json({
        message: "Session phase updated successfully",
        appointment
      });
    } catch (error) {
      console.error("Update session phase error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/appointments/:id/move-up
// @desc    Move appointment up in queue
// @access  Private (Doctors)
router.put("/:id/move-up", auth, authorize("doctor"), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if doctor owns this appointment
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find the appointment above in queue
    const previousAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      date: appointment.date,
      queuePosition: { $lt: appointment.queuePosition },
      status: { $in: ["scheduled", "confirmed", "in-progress"] }
    }).sort({ queuePosition: -1 });

    if (previousAppointment) {
      // Swap positions
      const tempPosition = appointment.queuePosition;
      appointment.queuePosition = previousAppointment.queuePosition;
      previousAppointment.queuePosition = tempPosition;

      await appointment.save();
      await previousAppointment.save();
    }

    res.json({
      message: "Appointment moved up in queue",
      appointment
    });
  } catch (error) {
    console.error("Move appointment up error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   PUT /api/appointments/:id/move-down
// @desc    Move appointment down in queue
// @access  Private (Doctors)
router.put("/:id/move-down", auth, authorize("doctor"), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if doctor owns this appointment
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find the appointment below in queue
    const nextAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      date: appointment.date,
      queuePosition: { $gt: appointment.queuePosition },
      status: { $in: ["scheduled", "confirmed", "in-progress"] }
    }).sort({ queuePosition: 1 });

    if (nextAppointment) {
      // Swap positions
      const tempPosition = appointment.queuePosition;
      appointment.queuePosition = nextAppointment.queuePosition;
      nextAppointment.queuePosition = tempPosition;

      await appointment.save();
      await nextAppointment.save();
    }

    res.json({
      message: "Appointment moved down in queue",
      appointment
    });
  } catch (error) {
    console.error("Move appointment down error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/appointments/queue/:doctorId/:date
// @desc    Get appointments queue for a doctor on a specific date
// @access  Private (Doctors)
router.get(
  "/queue/:doctorId/:date",
  auth,
  authorize("doctor"),
  async (req, res) => {
    try {
      const { doctorId, date } = req.params;

      // Check if doctor owns this queue
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || doctor._id.toString() !== doctorId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const appointments = await Appointment.find({
        doctorId,
        date: new Date(date),
        status: { $in: ["scheduled", "confirmed", "in-progress"] }
      })
        .populate("patientId", "profile.firstName profile.lastName")
        .sort({ queuePosition: 1, createdAt: 1 });

      res.json({
        appointments,
        total: appointments.length
      });
    } catch (error) {
      console.error("Get queue error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/appointments/reorder-queue
// @desc    Reorder appointments queue (drag and drop)
// @access  Private (Doctors)
router.put(
  "/reorder-queue",
  auth,
  authorize("doctor"),
  [
    body("doctorId").isMongoId(),
    body("date").isISO8601(),
    body("appointments").isArray(),
    body("appointments.*.id").isMongoId(),
    body("appointments.*.newPosition").isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId, date, appointments } = req.body;

      // Check if doctor owns this queue
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || doctor._id.toString() !== doctorId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update queue positions
      for (const item of appointments) {
        await Appointment.findByIdAndUpdate(item.id, {
          queuePosition: item.newPosition
        });
      }

      // Get updated queue
      const updatedAppointments = await Appointment.find({
        doctorId,
        date: new Date(date),
        status: { $in: ["scheduled", "confirmed", "in-progress"] }
      })
        .populate("patientId", "profile.firstName profile.lastName")
        .sort({ queuePosition: 1, createdAt: 1 });

      res.json({
        message: "Queue reordered successfully",
        appointments: updatedAppointments
      });
    } catch (error) {
      console.error("Reorder queue error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
