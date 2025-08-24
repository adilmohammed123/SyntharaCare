const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['antibiotic', 'painkiller', 'vitamin', 'supplement', 'prescription', 'otc'],
    required: true
  },
  dosageForm: {
    type: String,
    enum: ['tablet', 'capsule', 'liquid', 'injection', 'cream', 'drops', 'inhaler'],
    required: true
  },
  strength: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  sideEffects: [{
    type: String
  }],
  contraindications: [{
    type: String
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  manufacturer: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
medicineSchema.index({ name: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ isActive: 1 });

// Method to check if medicine is in stock
medicineSchema.methods.isInStock = function() {
  return this.stockQuantity > 0;
};

// Method to check if medicine needs reorder
medicineSchema.methods.needsReorder = function() {
  return this.stockQuantity <= this.reorderLevel;
};

// Method to check if medicine is expired
medicineSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to get stock status
medicineSchema.methods.getStockStatus = function() {
  if (this.stockQuantity === 0) return 'out-of-stock';
  if (this.stockQuantity <= this.reorderLevel) return 'low-stock';
  return 'in-stock';
};

module.exports = mongoose.model('Medicine', medicineSchema);
