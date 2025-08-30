const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
require("dotenv").config({ path: "./config.env" });

async function fixDoctorHospitalLinks() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/hospital_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // First, let's check if we have any hospitals
    const hospitals = await Hospital.find({
      isActive: true,
      approvalStatus: "approved"
    });

    if (hospitals.length === 0) {
      console.log(
        "❌ No approved hospitals found. Creating a default hospital..."
      );

      // Create a default hospital
      const defaultHospital = new Hospital({
        name: "General Hospital",
        description: "Default hospital for existing doctors",
        type: "public",
        address: {
          street: "123 Main Street",
          city: "Default City",
          state: "Default State",
          zipCode: "12345",
          country: "Default Country"
        },
        contact: {
          phone: "+1234567890",
          email: "info@generalhospital.com",
          website: "https://generalhospital.com"
        },
        facilities: ["emergency_room", "icu", "laboratory", "radiology"],
        specializations: [
          "General Medicine",
          "Emergency Medicine",
          "Internal Medicine"
        ],
        capacity: {
          beds: 100,
          icuBeds: 10,
          emergencyBeds: 20
        },
        emergencyServices: true,
        ambulanceServices: true,
        organizationAdmin: null, // Will be set to admin user
        approvalStatus: "approved",
        isActive: true,
        isVerified: true
      });

      // Find an admin user to assign as organization admin
      const adminUser = await User.findOne({ role: "admin" });
      if (adminUser) {
        defaultHospital.organizationAdmin = adminUser._id;
      }

      await defaultHospital.save();
      console.log("✅ Created default hospital:", defaultHospital.name);

      // Update hospitals array
      hospitals.push(defaultHospital);
    }

    console.log(`Found ${hospitals.length} approved hospitals`);

    // Get all doctors without hospitalId
    const doctorsWithoutHospital = await Doctor.find({
      hospitalId: { $exists: false }
    }).populate("userId");

    console.log(
      `Found ${doctorsWithoutHospital.length} doctors without hospital assignments`
    );

    // Get all doctors with null or invalid hospitalId
    const doctorsWithInvalidHospital = await Doctor.find({
      $or: [{ hospitalId: null }, { hospitalId: { $exists: false } }]
    }).populate("userId");

    console.log(
      `Found ${doctorsWithInvalidHospital.length} doctors with invalid hospital assignments`
    );

    // Combine both lists and remove duplicates
    const allDoctorsToFix = [
      ...doctorsWithoutHospital,
      ...doctorsWithInvalidHospital
    ];
    const uniqueDoctors = allDoctorsToFix.filter(
      (doctor, index, self) =>
        index ===
        self.findIndex((d) => d._id.toString() === doctor._id.toString())
    );

    console.log(`Total unique doctors to fix: ${uniqueDoctors.length}`);

    if (uniqueDoctors.length === 0) {
      console.log("✅ All doctors already have valid hospital assignments!");
      return;
    }

    // Assign hospitals to doctors
    let assignedCount = 0;
    for (const doctor of uniqueDoctors) {
      try {
        // Choose a hospital (round-robin if multiple hospitals)
        const hospitalIndex = assignedCount % hospitals.length;
        const selectedHospital = hospitals[hospitalIndex];

        // Update the doctor with hospital assignment
        doctor.hospitalId = selectedHospital._id;
        await doctor.save();

        console.log(
          `✅ Assigned doctor ${doctor.userId?.profile?.firstName} ${doctor.userId?.profile?.lastName} to hospital: ${selectedHospital.name}`
        );
        assignedCount++;
      } catch (error) {
        console.error(
          `❌ Error assigning hospital to doctor ${doctor._id}:`,
          error.message
        );
      }
    }

    // Also check for doctors with invalid hospital references
    const doctorsWithInvalidRefs = await Doctor.find({
      hospitalId: { $exists: true, $ne: null }
    }).populate("hospitalId");

    let fixedRefs = 0;
    for (const doctor of doctorsWithInvalidRefs) {
      if (!doctor.hospitalId || !doctor.hospitalId._id) {
        // This doctor has an invalid hospital reference
        const hospitalIndex = fixedRefs % hospitals.length;
        const selectedHospital = hospitals[hospitalIndex];

        doctor.hospitalId = selectedHospital._id;
        await doctor.save();

        console.log(
          `✅ Fixed invalid hospital reference for doctor ${doctor.userId?.profile?.firstName} ${doctor.userId?.profile?.lastName} - assigned to: ${selectedHospital.name}`
        );
        fixedRefs++;
      }
    }

    // Verify all doctors now have valid hospital assignments
    const finalCheck = await Doctor.find({}).populate("hospitalId");
    const doctorsWithoutValidHospital = finalCheck.filter(
      (d) => !d.hospitalId || !d.hospitalId._id
    );

    console.log(`\n📊 Summary:`);
    console.log(
      `- Total doctors processed: ${uniqueDoctors.length + fixedRefs}`
    );
    console.log(`- Doctors assigned to hospitals: ${assignedCount}`);
    console.log(`- Invalid references fixed: ${fixedRefs}`);
    console.log(
      `- Doctors still without valid hospital: ${doctorsWithoutValidHospital.length}`
    );

    if (doctorsWithoutValidHospital.length === 0) {
      console.log("✅ All doctors now have valid hospital assignments!");
    } else {
      console.log(
        "⚠️  Some doctors still don't have valid hospital assignments:"
      );
      doctorsWithoutValidHospital.forEach((d) => {
        console.log(
          `  - ${d.userId?.profile?.firstName} ${d.userId?.profile?.lastName} (ID: ${d._id})`
        );
      });
    }
  } catch (error) {
    console.error("Error fixing doctor-hospital links:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
fixDoctorHospitalLinks();
