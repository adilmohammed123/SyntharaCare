const mongoose = require("mongoose");

const healthHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 1000
    },
    category: {
      type: String,
      enum: [
        "lab_report",
        "imaging",
        "prescription",
        "medical_record",
        "vaccination_record",
        "allergy_test",
        "surgery_record",
        "discharge_summary",
        "consultation_note",
        "other"
      ],
      required: true
    },
    documentType: {
      type: String,
      enum: ["pdf", "image", "document", "text"],
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number, // in bytes
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    dateOfRecord: {
      type: Date,
      required: true
    },
    doctorName: {
      type: String,
      trim: true
    },
    hospitalName: {
      type: String,
      trim: true
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    isPrivate: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Link to appointments where this health history was shared
    sharedWithAppointments: [
      {
        appointmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment"
        },
        sharedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
healthHistorySchema.index({ patientId: 1, category: 1 });
healthHistorySchema.index({ patientId: 1, dateOfRecord: -1 });
healthHistorySchema.index({ patientId: 1, isActive: 1 });

// Virtual for file size in MB
healthHistorySchema.virtual("fileSizeMB").get(function () {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Method to check if file is an image
healthHistorySchema.methods.isImage = function () {
  return this.mimeType.startsWith("image/");
};

// Method to check if file is a PDF
healthHistorySchema.methods.isPDF = function () {
  return this.mimeType === "application/pdf";
};

// Method to get category display name
healthHistorySchema.methods.getCategoryDisplay = function () {
  const categoryMap = {
    lab_report: "Lab Report",
    imaging: "Imaging",
    prescription: "Prescription",
    medical_record: "Medical Record",
    vaccination_record: "Vaccination Record",
    allergy_test: "Allergy Test",
    surgery_record: "Surgery Record",
    discharge_summary: "Discharge Summary",
    consultation_note: "Consultation Note",
    other: "Other"
  };
  return categoryMap[this.category] || this.category;
};

module.exports = mongoose.model("HealthHistory", healthHistorySchema);
