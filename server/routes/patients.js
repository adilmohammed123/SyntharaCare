const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Diagnosis = require('../models/Diagnosis');
const Reminder = require('../models/Reminder');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients (doctors only)
// @access  Private (Doctors)
router.get('/', auth, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = { role: 'patient' };
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await User.findById(req.params.id)
      .select('-password')
      .populate('profile');

    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Check if user has permission to view this patient
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id/appointments
// @desc    Get patient appointments
// @access  Private
router.get('/:id/appointments', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Check permissions
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { patientId: req.params.id };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'userId specialization')
      .populate('doctorId.userId', 'profile.firstName profile.lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1, time: -1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id/diagnoses
// @desc    Get patient diagnoses
// @access  Private
router.get('/:id/diagnoses', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Check permissions
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const diagnoses = await Diagnosis.find({ patientId: req.params.id })
      .populate('doctorId', 'userId specialization')
      .populate('doctorId.userId', 'profile.firstName profile.lastName')
      .populate('appointmentId', 'date time')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Diagnosis.countDocuments({ patientId: req.params.id });

    res.json({
      diagnoses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patient diagnoses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id/reminders
// @desc    Get patient medicine reminders
// @access  Private
router.get('/:id/reminders', auth, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    // Check permissions
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { patientId: req.params.id };
    if (status !== 'all') {
      query.status = status;
    }

    const reminders = await Reminder.find(query)
      .populate('diagnosisId', 'diagnosis treatment')
      .sort({ startDate: -1 });

    res.json(reminders);
  } catch (error) {
    console.error('Get patient reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient profile
// @access  Private
router.put('/:id', auth, [
  body('profile.firstName').optional().notEmpty().trim(),
  body('profile.lastName').optional().notEmpty().trim(),
  body('profile.phone').optional().isMobilePhone(),
  body('profile.dateOfBirth').optional().isISO8601(),
  body('profile.gender').optional().isIn(['male', 'female', 'other']),
  body('profile.address').optional().isObject(),
  body('profile.emergencyContact').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check permissions
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await User.findById(req.params.id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const { profile } = req.body;
    if (profile) {
      patient.profile = { ...patient.profile, ...profile };
    }

    await patient.save();

    res.json({
      message: 'Patient profile updated successfully',
      patient: {
        id: patient._id,
        email: patient.email,
        profile: patient.profile
      }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/patients/:id/stats
// @desc    Get patient statistics
// @access  Private
router.get('/:id/stats', auth, async (req, res) => {
  try {
    // Check permissions
    if (req.user.role === 'patient' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patientId = req.params.id;

    const [
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
      totalDiagnoses,
      activeReminders,
      adherenceRate
    ] = await Promise.all([
      Appointment.countDocuments({ patientId }),
      Appointment.countDocuments({ patientId, status: 'completed' }),
      Appointment.countDocuments({ 
        patientId, 
        status: { $in: ['scheduled', 'confirmed'] },
        date: { $gte: new Date() }
      }),
      Diagnosis.countDocuments({ patientId }),
      Reminder.countDocuments({ patientId, status: 'active' }),
      Reminder.aggregate([
        { $match: { patientId: mongoose.Types.ObjectId(patientId) } },
        { $group: { 
          _id: null, 
          avgAdherence: { $avg: { $divide: ['$takenDoses', { $max: ['$totalDoses', 1] }] } }
        }}
      ])
    ]);

    res.json({
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
      totalDiagnoses,
      activeReminders,
      adherenceRate: adherenceRate.length > 0 ? Math.round(adherenceRate[0].avgAdherence * 100) : 0
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
