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

// Database connection function with retry logic
async function connectToDatabase() {
  const maxRetries = 2; // Reduced retries for faster startup
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`MongoDB connection attempt ${attempt}/${maxRetries}`);

      if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI environment variable is not set");
      }

      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // 5 seconds
        socketTimeoutMS: 30000, // 30 seconds
        connectTimeoutMS: 5000, // 5 seconds
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 1, // Maintain a minimum of 1 socket connection
        maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
        bufferCommands: false, // Disable mongoose buffering
        retryWrites: true,
        w: "majority"
      });

      console.log("✅ Connected to MongoDB successfully");
      return true;
    } catch (err) {
      console.error(
        `❌ MongoDB connection attempt ${attempt} failed:`,
        err.message
      );

      if (attempt === maxRetries) {
        console.error("❌ All MongoDB connection attempts failed");
        return false;
      }

      console.log(`⏳ Retrying in ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return false;
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

// Start server after database connection
async function startServer() {
  const PORT = process.env.PORT || 8080;

  console.log("🚀 Starting SyntharaCare server...");
  console.log(`📋 Environment variables check:`);
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV || "undefined"}`);
  console.log(`   - PORT: ${PORT}`);
  console.log(
    `   - MONGODB_URI: ${process.env.MONGODB_URI ? "SET" : "NOT SET"}`
  );
  console.log(
    `   - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "SET" : "NOT SET"}`
  );

  // Try to connect to database first
  console.log("🔌 Attempting to connect to MongoDB...");
  const dbConnected = await connectToDatabase();

  if (!dbConnected) {
    console.warn(
      "⚠️ Failed to connect to database initially. Server will start anyway and retry connection in background."
    );
    console.warn(
      "⚠️ Some features may not work until database connection is established."
    );
  }

  // Start the server regardless of database connection status
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    if (dbConnected) {
      console.log("✅ MongoDB connection established successfully");
    } else {
      console.log("⚠️ MongoDB connection will be retried in background");
      // Retry database connection in background
      setTimeout(async () => {
        console.log("🔄 Retrying database connection in background...");
        await connectToDatabase();
      }, 5000);
    }
  });
}

// Start the server
startServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});

module.exports = { app, io };
