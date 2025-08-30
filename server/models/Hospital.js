const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      maxlength: 2000
    },
    type: {
      type: String,
      enum: ["public", "private", "specialty", "research", "teaching"],
      required: true
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    contact: {
      phone: { type: String, required: true },
      email: { type: String, required: true },
      website: String
    },
    facilities: [
      {
        type: String,
        enum: [
          "emergency_room",
          "icu",
          "operating_room",
          "laboratory",
          "radiology",
          "pharmacy",
          "rehabilitation",
          "pediatric_ward",
          "maternity_ward",
          "cardiology_unit",
          "neurology_unit",
          "oncology_unit",
          "orthopedics_unit",
          "psychiatry_unit",
          "dental_clinic",
          "eye_clinic",
          "dermatology_clinic",
          "physiotherapy",
          "dialysis_center",
          "blood_bank"
        ]
      }
    ],
    specializations: [
      {
        type: String
      }
    ],
    capacity: {
      beds: { type: Number, min: 0 },
      icuBeds: { type: Number, min: 0 },
      emergencyBeds: { type: Number, min: 0 }
    },
    operatingHours: {
      monday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true }
      },
      tuesday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true }
      },
      wednesday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true }
      },
      thursday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true }
      },
      friday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true }
      },
      saturday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true }
      },
      sunday: {
        open: String,
        close: String,
        isOpen: { type: Boolean, default: true }
      }
    },
    emergencyServices: {
      type: Boolean,
      default: false
    },
    ambulanceServices: {
      type: Boolean,
      default: false
    },
    insuranceAccepted: [
      {
        type: String
      }
    ],
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
    images: [
      {
        type: String
      }
    ],
    // Organization admin who manages this hospital
    organizationAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Approval status for new hospitals
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
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
hospitalSchema.index({ name: 1 });
hospitalSchema.index({ "address.city": 1, "address.state": 1 });
hospitalSchema.index({ type: 1 });
hospitalSchema.index({ specializations: 1 });
hospitalSchema.index({ approvalStatus: 1 });
hospitalSchema.index({ isActive: 1 });

// Virtual for full address
hospitalSchema.virtual("fullAddress").get(function () {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
});

// Method to check if hospital is open on a specific day and time
hospitalSchema.methods.isOpenAt = function (day, time) {
  const daySchedule = this.operatingHours[day.toLowerCase()];
  if (!daySchedule || !daySchedule.isOpen) return false;

  const requestedTime = new Date(`2000-01-01 ${time}`);
  const openTime = new Date(`2000-01-01 ${daySchedule.open}`);
  const closeTime = new Date(`2000-01-01 ${daySchedule.close}`);

  return requestedTime >= openTime && requestedTime <= closeTime;
};

// Method to get operating hours for display
hospitalSchema.methods.getOperatingHoursDisplay = function () {
  const days = Object.keys(this.operatingHours);
  const openDays = days.filter((day) => this.operatingHours[day].isOpen);

  if (openDays.length === 0) return "Closed";
  if (openDays.length === 1) {
    const day = openDays[0];
    return `${day.charAt(0).toUpperCase() + day.slice(1)}: ${
      this.operatingHours[day].open
    } - ${this.operatingHours[day].close}`;
  }

  return `${openDays.length} days/week`;
};

// Method to get rating stars for display
hospitalSchema.methods.getRatingStars = function () {
  const stars = [];
  const fullStars = Math.floor(this.rating.average);
  const hasHalfStar = this.rating.average % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push("★");
  }

  if (hasHalfStar) {
    stars.push("☆");
  }

  const emptyStars = 5 - Math.ceil(this.rating.average);
  for (let i = 0; i < emptyStars; i++) {
    stars.push("☆");
  }

  return stars.join("");
};

module.exports = mongoose.model("Hospital", hospitalSchema);
