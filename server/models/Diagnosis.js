const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  symptoms: {
    type: String,
    required: true,
    maxlength: 2000
  },
  diagnosis: {
    type: String,
    required: true,
    maxlength: 2000
  },
  treatment: {
    type: String,
    required: true,
    maxlength: 2000
  },
  prescription: [{
    medicineName: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    instructions: String,
    quantity: Number
  }],
  recommendations: {
    type: String,
    maxlength: 1000
  },
  followUpDate: {
    type: Date
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  voiceRecording: {
    url: String,
    duration: Number, // in seconds
    transcription: String
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'lab-report']
    },
    url: String,
    filename: String,
    description: String
  }],
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    oxygenSaturation: Number
  },
  labTests: [{
    testName: String,
    testDate: Date,
    results: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['pending', 'normal', 'abnormal', 'critical']
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
diagnosisSchema.index({ patientId: 1, createdAt: -1 });
diagnosisSchema.index({ doctorId: 1, createdAt: -1 });
diagnosisSchema.index({ appointmentId: 1 });

// Virtual for patient name
diagnosisSchema.virtual('patientName').get(function() {
  return this.populated('patientId') ? 
    `${this.patientId.profile.firstName} ${this.patientId.profile.lastName}` : '';
});

// Virtual for doctor name
diagnosisSchema.virtual('doctorName').get(function() {
  return this.populated('doctorId') ? 
    `${this.doctorId.userId.profile.firstName} ${this.doctorId.userId.profile.lastName}` : '';
});

// Method to get diagnosis summary
diagnosisSchema.methods.getSummary = function() {
  return {
    id: this._id,
    date: this.createdAt,
    symptoms: this.symptoms.substring(0, 100) + (this.symptoms.length > 100 ? '...' : ''),
    diagnosis: this.diagnosis.substring(0, 100) + (this.diagnosis.length > 100 ? '...' : ''),
    severity: this.severity,
    hasVoiceRecording: !!this.voiceRecording.url,
    hasAttachments: this.attachments.length > 0
  };
};

// Method to check if follow-up is needed
diagnosisSchema.methods.needsFollowUp = function() {
  return this.followUpDate && this.followUpDate > new Date();
};

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
