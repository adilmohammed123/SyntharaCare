const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config({ path: "./config.env" });

async function fixUserApproval() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/hospital_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Find all admin users and patients
    const adminUsers = await User.find({ role: "admin" });
    const patientUsers = await User.find({ role: "patient" });
    console.log(
      `Found ${adminUsers.length} admin users and ${patientUsers.length} patients`
    );

    // Update admin users to have approved status
    for (const admin of adminUsers) {
      if (admin.approvalStatus !== "approved") {
        console.log(`Fixing approval status for admin: ${admin.email}`);
        admin.approvalStatus = "approved";
        await admin.save();
        console.log(`✅ Updated admin ${admin.email} to approved status`);
      } else {
        console.log(`✅ Admin ${admin.email} already has approved status`);
      }
    }

    // Update patients to have approved status
    for (const patient of patientUsers) {
      if (patient.approvalStatus !== "approved") {
        console.log(`Fixing approval status for patient: ${patient.email}`);
        patient.approvalStatus = "approved";
        await patient.save();
        console.log(`✅ Updated patient ${patient.email} to approved status`);
      } else {
        console.log(`✅ Patient ${patient.email} already has approved status`);
      }
    }

    console.log("✅ All admin users and patients have been updated!");
  } catch (error) {
    console.error("Error fixing user approval:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
fixUserApproval();
