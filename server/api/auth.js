const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { connectToDatabase } = require("./lib/db");
const User = require("../models/User");

const router = express.Router();

// Connect to database middleware
const withDB = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  "/register",
  withDB,
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("role").isIn(["patient", "doctor", "admin", "organization_admin"]),
    body("profile.firstName").notEmpty().trim(),
    body("profile.lastName").notEmpty().trim(),
    body("profile.phone").optional().isMobilePhone(),
    body("profile.address").optional().isLength({ max: 500 }),
    // Doctor-specific validation
    body("hospitalId").optional().isMongoId(),
    body("specialization").optional().isLength({ max: 100 }),
    body("licenseNumber").optional().isLength({ max: 50 }),
    body("experience").optional().isInt({ min: 0 }),
    body("consultationFee").optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        email,
        password,
        role,
        profile,
        hospitalId,
        specialization,
        licenseNumber,
        experience,
        consultationFee
      } = req.body;

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Validate hospital exists for doctors
      if (role === "doctor" && hospitalId) {
        const Hospital = require("../models/Hospital");
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital || hospital.approvalStatus !== "approved") {
          return res
            .status(400)
            .json({ message: "Invalid or unapproved hospital" });
        }
      }

      // Validate hospital exists for hospital admins
      if (role === "organization_admin" && hospitalId) {
        const Hospital = require("../models/Hospital");
        const hospital = await Hospital.findById(hospitalId);
        if (!hospital || hospital.approvalStatus !== "approved") {
          return res
            .status(400)
            .json({ message: "Invalid or unapproved hospital" });
        }

        // Check if hospital already has an admin
        const existingAdmin = await User.findOne({
          role: "organization_admin",
          adminHospital: hospitalId
        });

        if (existingAdmin) {
          return res
            .status(400)
            .json({ message: "This hospital already has an administrator" });
        }
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      user = new User({
        email,
        password: hashedPassword,
        role,
        profile,
        // Auto-approve admin users and patients, but doctors need approval
        approvalStatus:
          role === "admin" || role === "patient" ? "approved" : "pending",
        // Add hospital association for hospital admins
        ...(role === "organization_admin" &&
          hospitalId && { adminHospital: hospitalId })
      });

      await user.save();

      // Create doctor profile if role is doctor
      if (role === "doctor" && hospitalId) {
        const Doctor = require("../models/Doctor");

        // Check if license number is unique
        const existingDoctor = await Doctor.findOne({ licenseNumber });
        if (existingDoctor) {
          // Delete the user we just created
          await User.findByIdAndDelete(user._id);
          return res
            .status(400)
            .json({ message: "License number already exists" });
        }

        const doctor = new Doctor({
          userId: user._id,
          hospitalId,
          specialization: specialization || "General Medicine",
          licenseNumber,
          experience: experience || 0,
          consultationFee: consultationFee || 50,
          availability: [
            {
              day: "monday",
              startTime: "09:00",
              endTime: "17:00",
              isAvailable: true
            },
            {
              day: "tuesday",
              startTime: "09:00",
              endTime: "17:00",
              isAvailable: true
            },
            {
              day: "wednesday",
              startTime: "09:00",
              endTime: "17:00",
              isAvailable: true
            },
            {
              day: "thursday",
              startTime: "09:00",
              endTime: "17:00",
              isAvailable: true
            },
            {
              day: "friday",
              startTime: "09:00",
              endTime: "17:00",
              isAvailable: true
            }
          ],
          languages: ["English"]
        });

        await doctor.save();
      }

      // Create JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
          accessLevel: user.accessLevel || "full"
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Ensure admin users and patients are always considered approved
      const effectiveApprovalStatus =
        user.role === "admin" || user.role === "patient"
          ? "approved"
          : user.approvalStatus;

      res.status(201).json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          approvalStatus: effectiveApprovalStatus
        }
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  "/login",
  withDB,
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      // Check if user is approved
      if (user.approvalStatus === "rejected") {
        return res.status(403).json({
          message: "Account has been rejected. Please contact support."
        });
      }

      // Check if user is suspended
      if (
        user.accountStatus === "suspended" ||
        user.suspensionDetails?.isSuspended
      ) {
        const suspensionInfo = user.suspensionDetails;
        const message = suspensionInfo?.suspensionExpiry
          ? `Account suspended until ${new Date(
              suspensionInfo.suspensionExpiry
            ).toLocaleDateString()}. Reason: ${
              suspensionInfo.suspensionReason || "No reason provided"
            }`
          : `Account suspended. Reason: ${
              suspensionInfo?.suspensionReason || "No reason provided"
            }`;

        return res.status(403).json({
          message,
          suspensionDetails: suspensionInfo
        });
      }

      // Allow doctors to log in with limited access until approved
      if (user.role === "doctor" && user.approvalStatus === "pending") {
        // Generate token but with limited permissions
        const token = jwt.sign(
          {
            userId: user._id,
            role: user.role,
            accessLevel: "basic"
          },
          process.env.JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.json({
          token,
          user: {
            _id: user._id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            approvalStatus: user.approvalStatus,
            accessLevel: "basic"
          },
          message:
            "Limited access granted. Complete profile and wait for hospital admin approval for full access."
        });
      }

      // Require full approval for other roles
      if (user.approvalStatus !== "approved") {
        return res.status(403).json({
          message: "Account pending approval. Please wait for admin approval."
        });
      }

      // Create JWT token for approved users
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
          accessLevel: "full"
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Ensure admin users and patients are always considered approved
      const effectiveApprovalStatus =
        user.role === "admin" || user.role === "patient"
          ? "approved"
          : user.approvalStatus;

      res.json({
        token,
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          approvalStatus: effectiveApprovalStatus,
          accessLevel: "full"
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", withDB, async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    // Ensure admin users and patients are always considered approved
    const effectiveApprovalStatus =
      user.role === "admin" || user.role === "patient"
        ? "approved"
        : user.approvalStatus;

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      approvalStatus: effectiveApprovalStatus
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put(
  "/profile",
  withDB,
  [
    body("profile.firstName").optional().notEmpty().trim(),
    body("profile.lastName").optional().notEmpty().trim(),
    body("profile.phone").optional().isMobilePhone(),
    body("profile.address").optional().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "Token is not valid" });
      }

      // Update profile
      if (req.body.profile) {
        user.profile = { ...user.profile, ...req.body.profile };
      }

      await user.save();

      // Ensure admin users and patients are always considered approved
      const effectiveApprovalStatus =
        user.role === "admin" || user.role === "patient"
          ? "approved"
          : user.approvalStatus;

      res.json({
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          profile: user.profile,
          approvalStatus: effectiveApprovalStatus
        }
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// @route   PUT /api/auth/password
// @desc    Update user password
// @access  Private
router.put(
  "/password",
  withDB,
  [body("currentPassword").exists(), body("newPassword").isLength({ min: 6 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res
          .status(401)
          .json({ message: "No token, authorization denied" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("+password");

      if (!user) {
        return res.status(401).json({ message: "Token is not valid" });
      }

      // Check current password
      const isMatch = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.newPassword, salt);

      await user.save();

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Update password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
