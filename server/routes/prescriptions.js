const express = require("express");
const router = express.Router();
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
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
      .populate("hospitalId", "name");

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
      originalText,
      extractedMedicines,
      diagnosis,
      symptoms,
      notes,
      nextVisitDate,
      scanMethod
    } = req.body;

    const prescription = new Prescription({
      patientId,
      doctorId: doctor._id,
      hospitalId: doctor.hospitalId,
      originalText,
      extractedMedicines,
      diagnosis,
      symptoms,
      notes,
      nextVisitDate,
      scanMethod
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
      .populate("hospitalId", "name");

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
      .populate("hospitalId", "name");

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

module.exports = router;
