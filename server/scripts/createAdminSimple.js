const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config({ path: "./config.env" });

async function createAdminUser() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/hospital_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      return;
    }

    // Create admin user
    const adminData = {
      email: "admin@syntharacare.com",
      password: "admin123456", // Change this to a secure password
      role: "admin",
      profile: {
        firstName: "System",
        lastName: "Administrator",
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
    console.log("Password:", "admin123456"); // Show the original password
    console.log("\n⚠️  IMPORTANT: Change this password after first login!");
  } catch (error) {
    console.error("Error creating admin user:", error);
    console.log("\n💡 Make sure MongoDB is running locally on port 27017");
    console.log(
      "💡 Or update the mongoUri in this script to point to your MongoDB instance"
    );
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
createAdminUser();
