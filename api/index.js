const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const { connectToDatabase } = require("./lib/db");

// Import routes
const authRoutes = require("../server/api/auth");
const patientsRoutes = require("../server/routes/patients");
const doctorsRoutes = require("../server/routes/doctors");
const appointmentsRoutes = require("../server/routes/appointments");
const diagnosesRoutes = require("../server/routes/diagnoses");
const medicinesRoutes = require("../server/routes/medicines");
const remindersRoutes = require("../server/routes/reminders");

const app = express();

// Trust proxy for Vercel (fixes rate limiting issue)
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration for Vercel
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-domain.vercel.app", "https://your-domain.com"]
        : ["http://localhost:3000"],
    credentials: true
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Database connection middleware for all routes
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Admin creation endpoint (for initial setup)
app.post("/api/setup-admin", async (req, res) => {
  try {
    const { createAdminUser } = require("./createAdmin");
    const result = await createAdminUser();

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        email: result.email,
        password: result.password
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error("Setup admin error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to setup admin user",
      error: error.message
    });
  }
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/doctors", doctorsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/diagnoses", diagnosesRoutes);
app.use("/api/medicines", medicinesRoutes);
app.use("/api/reminders", remindersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong"
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Export for Vercel
module.exports = app;
