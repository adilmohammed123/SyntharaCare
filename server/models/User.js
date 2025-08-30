const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin", "organization_admin"],
      default: "patient"
    },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ["male", "female", "other"] },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String
      }
    },
    // Approval status for admin and organization admin users
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    approvalNotes: {
      type: String,
      maxlength: 1000
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
};

module.exports = mongoose.model("User", userSchema);
