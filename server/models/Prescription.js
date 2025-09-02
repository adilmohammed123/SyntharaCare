const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema(
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
    originalText: {
      type: String,
      required: true
    },
    extractedMedicines: [
      {
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String
      }
    ],
    diagnosis: {
      type: String,
      required: true
    },
    symptoms: [String],
    notes: String,
    prescriptionDate: {
      type: Date,
      default: Date.now
    },
    nextVisitDate: Date,
    status: {
      type: String,
      enum: ["active", "completed", "discontinued"],
      default: "active"
    },
    imageUrl: String, // If you want to store the original image
    scanMethod: {
      type: String,
      enum: ["ocr", "manual", "upload"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for better query performance
prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ hospitalId: 1, prescriptionDate: -1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
