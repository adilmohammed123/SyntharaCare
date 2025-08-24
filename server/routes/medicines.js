const express = require('express');
const { body, validationResult } = require('express-validator');
const Medicine = require('../models/Medicine');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/medicines
// @desc    Get all medicines
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search = '', inStock } = req.query;
    
    const query = { isActive: true };
    if (category) {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }
    if (inStock === 'true') {
      query.stockQuantity = { $gt: 0 };
    }

    const medicines = await Medicine.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Medicine.countDocuments(query);

    res.json({
      medicines,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/medicines/low-stock
// @desc    Get medicines with low stock (Admin only)
// @access  Private (Admin)
router.get('/low-stock', auth, authorize('admin'), async (req, res) => {
  try {
    const medicines = await Medicine.find({
      isActive: true,
      $expr: { $lte: ['$stockQuantity', '$reorderLevel'] }
    }).sort({ stockQuantity: 1 });

    res.json(medicines);
  } catch (error) {
    console.error('Get low stock medicines error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/medicines/:id
// @desc    Get medicine by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine || !medicine.isActive) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json(medicine);
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/medicines
// @desc    Add new medicine (Admin only)
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().trim(),
  body('category').isIn(['antibiotic', 'painkiller', 'vitamin', 'supplement', 'prescription', 'otc']),
  body('dosageForm').isIn(['tablet', 'capsule', 'liquid', 'injection', 'cream', 'drops', 'inhaler']),
  body('strength').notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stockQuantity').isInt({ min: 0 }),
  body('expiryDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const medicine = new Medicine(req.body);
    await medicine.save();

    res.status(201).json({
      message: 'Medicine added successfully',
      medicine
    });
  } catch (error) {
    console.error('Add medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/medicines/:id
// @desc    Update medicine (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), [
  body('name').optional().notEmpty().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('stockQuantity').optional().isInt({ min: 0 }),
  body('description').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({
      message: 'Medicine updated successfully',
      medicine
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/medicines/:id
// @desc    Delete medicine (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/medicines/categories
// @desc    Get medicine categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
