const express = require('express');
const { body, validationResult } = require('express-validator');
const Reminder = require('../models/Reminder');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reminders
// @desc    Get reminders for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    
    const query = { patientId: req.user._id };
    if (status !== 'all') {
      query.status = status;
    }

    const reminders = await Reminder.find(query)
      .populate('diagnosisId', 'diagnosis treatment')
      .sort({ startDate: -1 });

    res.json(reminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reminders/:id
// @desc    Get reminder by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id)
      .populate('diagnosisId', 'diagnosis treatment');

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check if user owns this reminder
    if (reminder.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(reminder);
  } catch (error) {
    console.error('Get reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reminders
// @desc    Create new reminder
// @access  Private
router.post('/', auth, [
  body('medicineName').notEmpty().trim(),
  body('dosage').notEmpty().trim(),
  body('frequency').notEmpty().trim(),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('times').isArray({ min: 1 }),
  body('times.*.time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reminder = new Reminder({
      patientId: req.user._id,
      ...req.body
    });

    await reminder.save();

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder
    });
  } catch (error) {
    console.error('Create reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reminders/:id
// @desc    Update reminder
// @access  Private
router.put('/:id', auth, [
  body('medicineName').optional().notEmpty().trim(),
  body('dosage').optional().notEmpty().trim(),
  body('frequency').optional().notEmpty().trim(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('instructions').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check if user owns this reminder
    if (reminder.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedReminder = await Reminder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Reminder updated successfully',
      reminder: updatedReminder
    });
  } catch (error) {
    console.error('Update reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reminders/:id/status
// @desc    Update reminder status
// @access  Private
router.put('/:id/status', auth, [
  body('status').isIn(['active', 'paused', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check if user owns this reminder
    if (reminder.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    reminder.status = req.body.status;
    await reminder.save();

    res.json({
      message: 'Reminder status updated successfully',
      reminder
    });
  } catch (error) {
    console.error('Update reminder status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reminders/:id/mark-taken
// @desc    Mark medicine as taken
// @access  Private
router.post('/:id/mark-taken', auth, [
  body('date').optional().isISO8601(),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notes').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check if user owns this reminder
    if (reminder.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const date = req.body.date ? new Date(req.body.date) : new Date();
    const time = req.body.time || new Date().toTimeString().slice(0, 5);

    await reminder.markDoseTaken(date, time, req.body.notes);

    res.json({
      message: 'Medicine marked as taken',
      reminder
    });
  } catch (error) {
    console.error('Mark taken error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reminders/:id/mark-skipped
// @desc    Mark medicine as skipped
// @access  Private
router.post('/:id/mark-skipped', auth, [
  body('date').optional().isISO8601(),
  body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('notes').optional().isLength({ max: 200 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check if user owns this reminder
    if (reminder.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const date = req.body.date ? new Date(req.body.date) : new Date();
    const time = req.body.time || new Date().toTimeString().slice(0, 5);

    await reminder.markDoseSkipped(date, time, req.body.notes);

    res.json({
      message: 'Medicine marked as skipped',
      reminder
    });
  } catch (error) {
    console.error('Mark skipped error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reminders/today
// @desc    Get today's reminders
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({
      patientId: req.user._id,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).populate('diagnosisId', 'diagnosis treatment');

    const todayReminders = reminders.map(reminder => ({
      ...reminder.toObject(),
      todayDoses: reminder.getTodayDoses(),
      nextDoseTime: reminder.getNextDoseTime()
    }));

    res.json(todayReminders);
  } catch (error) {
    console.error('Get today reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reminders/:id
// @desc    Delete reminder
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check if user owns this reminder
    if (reminder.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Reminder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
