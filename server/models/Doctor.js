const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true
    },
    specialization: {
      type: String,
      required: true
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true
    },
    experience: {
      type: Number,
      required: true,
      min: 0
    },
    education: [
      {
        degree: String,
        institution: String,
        year: Number
      }
    ],
    availability: [
      {
        day: {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday"
          ]
        },
        startTime: String,
        endTime: String,
        isAvailable: {
          type: Boolean,
          default: true
        }
      }
    ],
    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },
    languages: [
      {
        type: String
      }
    ],
    bio: {
      type: String,
      maxlength: 1000
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    // Approval status for doctors
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
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for full name
doctorSchema.virtual("fullName").get(function () {
  return this.userId
    ? `${this.userId.profile.firstName} ${this.userId.profile.lastName}`
    : "";
});

// Method to check availability for a specific date and time
doctorSchema.methods.isAvailableAt = function (date, time) {
  const day = date.toLowerCase();
  const availability = this.availability.find((avail) => avail.day === day);

  if (!availability || !availability.isAvailable) return false;

  const requestedTime = new Date(`2000-01-01 ${time}`);
  const startTime = new Date(`2000-01-01 ${availability.startTime}`);
  const endTime = new Date(`2000-01-01 ${availability.endTime}`);

  return requestedTime >= startTime && requestedTime <= endTime;
};

module.exports = mongoose.model("Doctor", doctorSchema);
