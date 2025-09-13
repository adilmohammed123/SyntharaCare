const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Trust proxy for GCP Cloud Run
app.set("trust proxy", true);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "https://synthara-care-ua5k.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting - configured for Cloud Run with trust proxy
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests
  skipFailedRequests: false,
  // Trust proxy for Cloud Run
  trustProxy: true,
  // Use a custom key generator that works with Cloud Run
  keyGenerator: (req) => {
    // Use the real IP from Cloud Run's X-Forwarded-For header
    return req.ip || req.connection.remoteAddress || "unknown";
  }
});
app.use(limiter);

// Database connection function
async function connectToDatabase() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/hospital_management",
      {
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 45000, // 45 seconds
        connectTimeoutMS: 30000, // 30 seconds
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 5, // Maintain a minimum of 5 socket connections
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        bufferCommands: false // Disable mongoose buffering
      }
    );
    console.log("Connected to MongoDB");
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return false;
  }
}

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

// Graceful shutdown
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log("Mongoose connection closed through app termination");
    process.exit(0);
  });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/hospitals", require("./routes/hospitals"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/diagnoses", require("./routes/diagnoses"));
app.use("/api/medicines", require("./routes/medicines"));
app.use("/api/reminders", require("./routes/reminders"));
app.use("/api/prescriptions", require("./routes/prescriptions"));
app.use("/api/health-history", require("./routes/healthHistory"));
app.use("/api/uploads", require("./routes/uploads"));
app.use("/api/chatbot", require("./routes/chatbot"));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Socket.io for real-time features
io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    mongodb_uri_set: !!process.env.MONGODB_URI
  });
});

// Start server with database connection retry
async function startServer() {
  const PORT = process.env.PORT || 8080;

  // Start the server first
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });

  // Try to connect to database in background
  const dbConnected = await connectToDatabase();

  if (!dbConnected) {
    console.warn(
      "Failed to connect to database. Server will continue but database operations will fail."
    );
    console.warn("Please check your MONGODB_URI environment variable.");
  }
}

// Start the server
startServer();

module.exports = { app, io };
