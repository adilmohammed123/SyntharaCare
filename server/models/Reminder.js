const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  diagnosisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diagnosis'
  },
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
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  times: [{
    time: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  instructions: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  notifications: {
    push: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  takenHistory: [{
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    taken: {
      type: Boolean,
      default: false
    },
    skipped: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  totalDoses: {
    type: Number,
    default: 0
  },
  takenDoses: {
    type: Number,
    default: 0
  },
  skippedDoses: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
reminderSchema.index({ patientId: 1, status: 1 });
reminderSchema.index({ endDate: 1 });
reminderSchema.index({ 'times.time': 1 });

// Method to check if reminder is active
reminderSchema.methods.isReminderActive = function() {
  const now = new Date();
  return this.status === 'active' && 
         this.isActive && 
         now >= this.startDate && 
         now <= this.endDate;
};

// Method to get next dose time
reminderSchema.methods.getNextDoseTime = function() {
  if (!this.isReminderActive()) return null;
  
  const now = new Date();
  const today = now.toDateString();
  
  for (let time of this.times) {
    if (!time.isActive) continue;
    
    const doseTime = new Date(`${today} ${time.time}`);
    if (doseTime > now) {
      return doseTime;
    }
  }
  
  return null;
};

// Method to mark dose as taken
reminderSchema.methods.markDoseTaken = function(date, time, notes = '') {
  const doseRecord = {
    date: date,
    time: time,
    taken: true,
    skipped: false,
    notes: notes
  };
  
  this.takenHistory.push(doseRecord);
  this.takenDoses += 1;
  
  return this.save();
};

// Method to mark dose as skipped
reminderSchema.methods.markDoseSkipped = function(date, time, notes = '') {
  const doseRecord = {
    date: date,
    time: time,
    taken: false,
    skipped: true,
    notes: notes
  };
  
  this.takenHistory.push(doseRecord);
  this.skippedDoses += 1;
  
  return this.save();
};

// Method to get adherence rate
reminderSchema.methods.getAdherenceRate = function() {
  if (this.totalDoses === 0) return 0;
  return Math.round((this.takenDoses / this.totalDoses) * 100);
};

// Method to get today's doses
reminderSchema.methods.getTodayDoses = function() {
  const today = new Date().toDateString();
  return this.takenHistory.filter(dose => 
    new Date(dose.date).toDateString() === today
  );
};

module.exports = mongoose.model('Reminder', reminderSchema);
