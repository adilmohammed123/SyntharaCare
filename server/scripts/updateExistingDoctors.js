const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
require("dotenv").config({ path: "./config.env" });

async function updateExistingDoctors() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/hospital_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    console.log("🔧 Updating existing doctors...\n");

    // Get all approved hospitals
    const hospitals = await Hospital.find({
      isActive: true,
      approvalStatus: "approved"
    });

    if (hospitals.length === 0) {
      console.log(
        "❌ No approved hospitals found. Please create hospitals first."
      );
      return;
    }

    console.log(`Found ${hospitals.length} approved hospitals`);

    // Find all users with doctor role
    const doctorUsers = await User.find({
      role: "doctor",
      approvalStatus: "approved"
    });

    console.log(`Found ${doctorUsers.length} approved doctor users`);

    let updatedCount = 0;
    let createdCount = 0;

    for (const user of doctorUsers) {
      // Check if doctor profile exists
      let doctor = await Doctor.findOne({ userId: user._id });

      if (!doctor) {
        // Create doctor profile if it doesn't exist
        const hospitalIndex = createdCount % hospitals.length;
        const selectedHospital = hospitals[hospitalIndex];

        doctor = new Doctor({
          userId: user._id,
          hospitalId: selectedHospital._id,
          specialization: "General Medicine",
          licenseNumber: `LIC-${Date.now()}-${createdCount}`,
          experience: 5,
          consultationFee: 100,
          bio: `Experienced medical professional with expertise in general medicine.`,
          languages: ["English"],
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
          approvalStatus: "approved",
          isActive: true
        });

        await doctor.save();
        createdCount++;
        console.log(
          `✅ Created doctor profile for ${user.profile.firstName} ${user.profile.lastName} at ${selectedHospital.name}`
        );
      } else {
        // Check if doctor has valid hospital assignment
        if (!doctor.hospitalId || !doctor.hospitalId.toString()) {
          const hospitalIndex = updatedCount % hospitals.length;
          const selectedHospital = hospitals[hospitalIndex];

          doctor.hospitalId = selectedHospital._id;
          await doctor.save();
          updatedCount++;
          console.log(
            `✅ Updated hospital assignment for ${user.profile.firstName} ${user.profile.lastName} to ${selectedHospital.name}`
          );
        } else {
          console.log(
            `⚠️  Doctor ${user.profile.firstName} ${user.profile.lastName} already has valid hospital assignment`
          );
        }
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`- Doctor profiles created: ${createdCount}`);
    console.log(`- Hospital assignments updated: ${updatedCount}`);
    console.log(`- Total doctors processed: ${doctorUsers.length}`);

    // Final verification
    const finalDoctors = await Doctor.find({})
      .populate("userId")
      .populate("hospitalId");
    const doctorsWithoutHospital = finalDoctors.filter(
      (d) => !d.hospitalId || !d.hospitalId._id
    );

    if (doctorsWithoutHospital.length === 0) {
      console.log(`\n✅ All doctors now have valid hospital assignments!`);
    } else {
      console.log(
        `\n⚠️  ${doctorsWithoutHospital.length} doctors still need hospital assignments`
      );
    }
  } catch (error) {
    console.error("Error updating existing doctors:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
updateExistingDoctors();
