const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config({ path: "./config.env" });

// Get command line arguments
const args = process.argv.slice(2);
const email = args[0];
const password = args[1];
const firstName = args[2] || "System";
const lastName = args[3] || "Administrator";

if (!email || !password) {
  console.log(
    "Usage: node createCustomAdmin.js <email> <password> [firstName] [lastName]"
  );
  console.log(
    'Example: node createCustomAdmin.js admin@myhospital.com mySecurePassword123 "John" "Admin"'
  );
  process.exit(1);
}

async function createCustomAdminUser() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/hospital_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if admin with this email already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      console.log("User with this email already exists:", existingAdmin.email);
      console.log("Role:", existingAdmin.role);
      return;
    }

    // Create admin user
    const adminData = {
      email: email.toLowerCase(),
      password: password,
      role: "admin",
      profile: {
        firstName: firstName,
        lastName: lastName,
        phone: "+1234567890",
        dateOfBirth: new Date("1990-01-01"),
        gender: "other"
      },
      approvalStatus: "approved", // Admin is auto-approved
      isActive: true
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    const admin = new User(adminData);
    await admin.save();

    console.log("✅ Admin user created successfully!");
    console.log("Email:", adminData.email);
    console.log("Name:", `${firstName} ${lastName}`);
    console.log("Role: admin");
    console.log("Status: approved");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
createCustomAdminUser();
