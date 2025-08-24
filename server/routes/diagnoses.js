const express = require('express');
const { body, validationResult } = require('express-validator');
const Diagnosis = require('../models/Diagnosis');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Reminder = require('../models/Reminder');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/diagnoses
// @desc    Create new diagnosis
// @access  Private (Doctors)
router.post('/', auth, authorize('doctor'), [
  body('appointmentId').isMongoId(),
  body('symptoms').notEmpty().isLength({ max: 2000 }),
  body('diagnosis').notEmpty().isLength({ max: 2000 }),
  body('treatment').notEmpty().isLength({ max: 2000 }),
  body('prescription').optional(),
  body('recommendations').optional().isLength({ max: 1000 }),
  body('followUpDate').optional().isISO8601(),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.body.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check if doctor is authorized for this appointment
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Handle prescription field - convert string to array if needed
    let prescriptionData = req.body.prescription;
    if (prescriptionData && typeof prescriptionData === 'string') {
      // Convert string prescription to a simple array format
      prescriptionData = [{
        medicineName: prescriptionData,
        dosage: 'As prescribed',
        frequency: 'As needed',
        duration: 'Until symptoms improve',
        instructions: prescriptionData
      }];
    }

    const diagnosis = new Diagnosis({
      appointmentId: req.body.appointmentId,
      patientId: appointment.patientId,
      doctorId: doctor._id,
      ...req.body,
      prescription: prescriptionData
    });

    await diagnosis.save();

    // Create reminders for prescriptions (if prescription is an array)
    if (req.body.prescription && Array.isArray(req.body.prescription) && req.body.prescription.length > 0) {
      for (const medicine of req.body.prescription) {
        const reminder = new Reminder({
          patientId: appointment.patientId,
          diagnosisId: diagnosis._id,
          medicineName: medicine.medicineName,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          times: [{ time: '09:00', isActive: true }], // Default time
          instructions: medicine.instructions
        });
        await reminder.save();
      }
    }

    res.status(201).json({
      message: 'Diagnosis created successfully',
      diagnosis
    });
  } catch (error) {
    console.error('Create diagnosis error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user._id
    });
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/diagnoses
// @desc    Get diagnoses for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) {
        query.doctorId = doctor._id;
      }
    }

    const diagnoses = await Diagnosis.find(query)
      .populate('patientId', 'profile.firstName profile.lastName')
      .populate('doctorId', 'userId specialization')
      .populate('doctorId.userId', 'profile.firstName profile.lastName')
      .populate('appointmentId', 'date time')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Diagnosis.countDocuments(query);

    res.json({
      diagnoses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get diagnoses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/diagnoses/:id
// @desc    Get diagnosis by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id)
      .populate('patientId', 'profile.firstName profile.lastName')
      .populate('doctorId', 'userId specialization')
      .populate('doctorId.userId', 'profile.firstName profile.lastName')
      .populate('appointmentId', 'date time');

    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found' });
    }

    // Check permissions
    if (req.user.role === 'patient' && diagnosis.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || diagnosis.doctorId._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(diagnosis);
  } catch (error) {
    console.error('Get diagnosis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/diagnoses/:id
// @desc    Update diagnosis
// @access  Private (Doctors)
router.put('/:id', auth, authorize('doctor'), [
  body('symptoms').optional().isLength({ max: 2000 }),
  body('diagnosis').optional().isLength({ max: 2000 }),
  body('treatment').optional().isLength({ max: 2000 }),
  body('recommendations').optional().isLength({ max: 1000 }),
  body('followUpDate').optional().isISO8601(),
  body('severity').optional().isIn(['low', 'medium', 'high', 'critical'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found' });
    }

    // Check if doctor is authorized
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || diagnosis.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedDiagnosis = await Diagnosis.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Diagnosis updated successfully',
      diagnosis: updatedDiagnosis
    });
  } catch (error) {
    console.error('Update diagnosis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/diagnoses/:id/voice-recording
// @desc    Add voice recording to diagnosis
// @access  Private (Doctors)
router.post('/:id/voice-recording', auth, authorize('doctor'), [
  body('url').notEmpty(),
  body('duration').isInt({ min: 1 }),
  body('transcription').optional().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) {
      return res.status(404).json({ message: 'Diagnosis not found' });
    }

    // Check if doctor is authorized
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || diagnosis.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    diagnosis.voiceRecording = {
      url: req.body.url,
      duration: req.body.duration,
      transcription: req.body.transcription
    };

    await diagnosis.save();

    res.json({
      message: 'Voice recording added successfully',
      voiceRecording: diagnosis.voiceRecording
    });
  } catch (error) {
    console.error('Add voice recording error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
