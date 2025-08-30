const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/doctors
// @desc    Get all approved doctors
// @access  Public
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      specialization,
      hospitalId,
      search = ""
    } = req.query;

    const query = {
      isActive: true,
      approvalStatus: "approved"
    };

    if (specialization) {
      query.specialization = { $regex: specialization, $options: "i" };
    }

    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    const doctors = await Doctor.find(query)
      .populate("userId", "profile.firstName profile.lastName email")
      .populate("hospitalId", "name address.city")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });

    // Filter by search if provided
    let filteredDoctors = doctors;
    if (search) {
      filteredDoctors = doctors.filter(
        (doctor) =>
          doctor.userId.profile.firstName
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          doctor.userId.profile.lastName
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          doctor.specialization.toLowerCase().includes(search.toLowerCase()) ||
          doctor.hospitalId.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Doctor.countDocuments(query);

    res.json({
      doctors: filteredDoctors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Get doctors error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("userId", "profile email")
      .populate("hospitalId", "name address contact")
      .populate("availability");

    if (!doctor || !doctor.isActive || doctor.approvalStatus !== "approved") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(doctor);
  } catch (error) {
    console.error("Get doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/doctors/:id/appointments
// @desc    Get doctor appointments
// @access  Private (Doctors)
router.get("/:id/appointments", auth, authorize("doctor"), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;

    // Check if doctor is accessing their own appointments
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const query = { doctorId: req.params.id };
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
    console.error("Get doctor appointments error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/doctors/:id/availability
// @desc    Get doctor availability
// @access  Public
router.get("/:id/availability", async (req, res) => {
  try {
    const { date } = req.query;
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor || !doctor.isActive) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!date) {
      return res.json({ availability: doctor.availability });
    }

    // Get appointments for the specific date
    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const dayAvailability = doctor.availability.find(
      (avail) => avail.day === dayOfWeek
    );
    if (!dayAvailability || !dayAvailability.isAvailable) {
      return res.json({
        available: false,
        message: "Doctor not available on this day"
      });
    }

    // Get booked appointments for this date
    const bookedAppointments = await Appointment.find({
      doctorId: req.params.id,
      date: appointmentDate,
      status: { $in: ["scheduled", "confirmed"] }
    }).select("time duration");

    // Calculate available time slots
    const availableSlots = [];
    const startTime = new Date(`2000-01-01 ${dayAvailability.startTime}`);
    const endTime = new Date(`2000-01-01 ${dayAvailability.endTime}`);
    const slotDuration = 30; // 30 minutes per slot

    for (
      let time = new Date(startTime);
      time < endTime;
      time.setMinutes(time.getMinutes() + slotDuration)
    ) {
      const timeString = time.toTimeString().slice(0, 5);
      const isBooked = bookedAppointments.some(
        (appointment) => appointment.time === timeString
      );

      if (!isBooked) {
        availableSlots.push(timeString);
      }
    }

    res.json({
      available: true,
      availableSlots,
      startTime: dayAvailability.startTime,
      endTime: dayAvailability.endTime
    });
  } catch (error) {
    console.error("Get doctor availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/doctors
// @desc    Create doctor profile
// @access  Private (Doctors)
router.post(
  "/",
  auth,
  authorize("doctor"),
  [
    body("hospitalId").notEmpty().withMessage("Hospital is required"),
    body("specialization").notEmpty().trim(),
    body("licenseNumber").notEmpty().trim(),
    body("experience").isInt({ min: 0 }),
    body("consultationFee").isFloat({ min: 0 }),
    body("availability").isArray(),
    body("availability.*.day").isIn([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ]),
    body("availability.*.startTime").matches(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    ),
    body("availability.*.endTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if doctor profile already exists
      const existingDoctor = await Doctor.findOne({ userId: req.user._id });
      if (existingDoctor) {
        return res
          .status(400)
          .json({ message: "Doctor profile already exists" });
      }

      // Verify hospital exists and is approved
      const Hospital = require("../models/Hospital");
      const hospital = await Hospital.findById(req.body.hospitalId);
      if (!hospital || hospital.approvalStatus !== "approved") {
        return res
          .status(400)
          .json({ message: "Invalid or unapproved hospital" });
      }

      const doctor = new Doctor({
        userId: req.user._id,
        ...req.body
      });

      await doctor.save();

      res.status(201).json({
        message: "Doctor profile created successfully and pending approval",
        doctor
      });
    } catch (error) {
      console.error("Create doctor error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   POST /api/doctors/quick-setup
// @desc    Create a basic doctor profile for newly registered doctors
// @access  Private (Doctors)
router.post(
  "/quick-setup",
  auth,
  authorize("doctor"),
  [body("hospitalId").notEmpty().withMessage("Hospital is required")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if doctor profile already exists
      const existingDoctor = await Doctor.findOne({ userId: req.user._id });
      if (existingDoctor) {
        return res
          .status(400)
          .json({ message: "Doctor profile already exists" });
      }

      // Verify hospital exists and is approved
      const Hospital = require("../models/Hospital");
      const hospital = await Hospital.findById(req.body.hospitalId);
      if (!hospital || hospital.approvalStatus !== "approved") {
        return res
          .status(400)
          .json({ message: "Invalid or unapproved hospital" });
      }

      // Create a basic doctor profile with default values
      const doctor = new Doctor({
        userId: req.user._id,
        hospitalId: req.body.hospitalId,
        specialization: "General Medicine",
        licenseNumber: "LIC-" + Date.now(),
        experience: 5,
        consultationFee: 50,
        bio: "Experienced medical professional",
        languages: ["English"],
        availability: [
          {
            day: "monday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true
          },
          {
            day: "tuesday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true
          },
          {
            day: "wednesday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true
          },
          {
            day: "thursday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true
          },
          {
            day: "friday",
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: true
          },
          {
            day: "saturday",
            startTime: "09:00",
            endTime: "13:00",
            isAvailable: false
          },
          {
            day: "sunday",
            startTime: "09:00",
            endTime: "13:00",
            isAvailable: false
          }
        ],
        rating: { average: 4.5, count: 0 },
        isActive: true
      });

      await doctor.save();

      res.status(201).json({
        message:
          "Basic doctor profile created successfully and pending approval!",
        doctor
      });
    } catch (error) {
      console.error("Quick setup doctor error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/doctors/:id
// @desc    Update doctor profile
// @access  Private (Doctors)
router.put(
  "/:id",
  auth,
  authorize("doctor"),
  [
    body("specialization").optional().notEmpty().trim(),
    body("experience").optional().isInt({ min: 0 }),
    body("consultationFee").optional().isFloat({ min: 0 }),
    body("bio").optional().isLength({ max: 1000 }),
    body("languages").optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if doctor is updating their own profile
      if (req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const doctor = await Doctor.findById(req.params.id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const updatedDoctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({
        message: "Doctor profile updated successfully",
        doctor: updatedDoctor
      });
    } catch (error) {
      console.error("Update doctor error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/doctors/:id/availability
// @desc    Update doctor availability
// @access  Private (Doctors)
router.put(
  "/:id/availability",
  auth,
  authorize("doctor"),
  [
    body("availability").isArray(),
    body("availability.*.day").isIn([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ]),
    body("availability.*.startTime").matches(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    ),
    body("availability.*.endTime").matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Check if doctor is updating their own availability
      if (req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const doctor = await Doctor.findByIdAndUpdate(
        req.params.id,
        { availability: req.body.availability },
        { new: true, runValidators: true }
      );

      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      res.json({
        message: "Availability updated successfully",
        availability: doctor.availability
      });
    } catch (error) {
      console.error("Update availability error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
