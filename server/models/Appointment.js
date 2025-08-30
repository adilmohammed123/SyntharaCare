const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 30, // minutes
      min: 15,
      max: 120
    },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "no-show"
      ],
      default: "scheduled"
    },
    sessionPhase: {
      type: String,
      enum: [
        "waiting",
        "data-collection",
        "initial-assessment",
        "examination",
        "diagnosis",
        "treatment",
        "surgery",
        "recovery",
        "follow-up",
        "discharge"
      ],
      default: "waiting"
    },
    queuePosition: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ["consultation", "follow-up", "emergency", "routine"],
      default: "consultation"
    },
    symptoms: {
      type: String,
      maxlength: 1000
    },
    notes: {
      type: String,
      maxlength: 2000
    },
    consultationFee: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending"
    },
    meetingLink: {
      type: String
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    cancellationReason: {
      type: String
    },
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "admin"]
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
appointmentSchema.index({ doctorId: 1, date: 1, time: 1 });
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });

// Virtual for appointment date and time
appointmentSchema.virtual("appointmentDateTime").get(function () {
  const date = new Date(this.date);
  const [hours, minutes] = this.time.split(":");
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Method to check if appointment is in the past
appointmentSchema.methods.isPast = function () {
  return this.appointmentDateTime < new Date();
};

// Method to check if appointment is today
appointmentSchema.methods.isToday = function () {
  const today = new Date();
  const appointmentDate = new Date(this.date);
  return today.toDateString() === appointmentDate.toDateString();
};

// Method to get appointment status for display
appointmentSchema.methods.getStatusDisplay = function () {
  const statusMap = {
    scheduled: "Scheduled",
    confirmed: "Confirmed",
    "in-progress": "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    "no-show": "No Show"
  };
  return statusMap[this.status] || this.status;
};

// Method to get session phase for display
appointmentSchema.methods.getSessionPhaseDisplay = function () {
  const phaseMap = {
    waiting: "Waiting",
    "data-collection": "Data Collection",
    "initial-assessment": "Initial Assessment",
    examination: "Examination",
    diagnosis: "Diagnosis",
    treatment: "Treatment",
    surgery: "Surgery",
    recovery: "Recovery",
    "follow-up": "Follow-up",
    discharge: "Discharge"
  };
  return phaseMap[this.sessionPhase] || this.sessionPhase;
};

// Static method to reorder queue positions
appointmentSchema.statics.reorderQueue = async function (doctorId, date) {
  const appointments = await this.find({
    doctorId,
    date,
    status: { $in: ["scheduled", "confirmed", "in-progress"] }
  }).sort({ queuePosition: 1, createdAt: 1 });

  for (let i = 0; i < appointments.length; i++) {
    appointments[i].queuePosition = i + 1;
    await appointments[i].save();
  }

  return appointments;
};

module.exports = mongoose.model("Appointment", appointmentSchema);
