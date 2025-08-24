const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
require('dotenv').config({ path: './config.env' });

async function initializeQueuePositions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get all appointments grouped by doctor and date
    const appointments = await Appointment.find({}).sort({ doctorId: 1, date: 1, createdAt: 1 });
    
    const doctorDateGroups = {};
    
    // Group appointments by doctor and date
    appointments.forEach(appointment => {
      const key = `${appointment.doctorId}_${appointment.date.toISOString().split('T')[0]}`;
      if (!doctorDateGroups[key]) {
        doctorDateGroups[key] = [];
      }
      doctorDateGroups[key].push(appointment);
    });

    let updatedCount = 0;

    // Process each group
    for (const [key, groupAppointments] of Object.entries(doctorDateGroups)) {
      // Sort by status priority and creation time
      const sortedAppointments = groupAppointments.sort((a, b) => {
        const statusPriority = {
          'in-progress': 1,
          'confirmed': 2,
          'scheduled': 3,
          'completed': 4,
          'cancelled': 5,
          'no-show': 6
        };
        
        const aPriority = statusPriority[a.status] || 999;
        const bPriority = statusPriority[b.status] || 999;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
        
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      // Assign queue positions
      for (let i = 0; i < sortedAppointments.length; i++) {
        const appointment = sortedAppointments[i];
        const newPosition = i + 1;
        
        if (appointment.queuePosition !== newPosition) {
          appointment.queuePosition = newPosition;
          await appointment.save();
          updatedCount++;
          console.log(`Updated appointment ${appointment._id}: position ${newPosition}`);
        }
      }
    }

    console.log(`\nQueue position initialization complete!`);
    console.log(`Updated ${updatedCount} appointments with queue positions.`);
    
  } catch (error) {
    console.error('Error initializing queue positions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
initializeQueuePositions();
