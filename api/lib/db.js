const mongoose = require('mongoose');

// Global variable to cache the connection
let cachedConnection = null;

async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Connection options optimized for serverless (updated for newer MongoDB driver)
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
    };

    const connection = await mongoose.connect(process.env.MONGODB_URI, options);
    
    // Handle connection events
    connection.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    connection.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    connection.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Cache the connection
    cachedConnection = connection;
    
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Graceful shutdown
async function disconnectFromDatabase() {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
    console.log('MongoDB disconnected gracefully');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

module.exports = {
  connectToDatabase,
  disconnectFromDatabase
};
