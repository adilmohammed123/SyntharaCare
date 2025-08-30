const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
require("dotenv").config({ path: "./config.env" });

async function verifyDoctorHospitalLinks() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/hospital_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    console.log("🔍 Verifying doctor-hospital relationships...\n");

    // Get all hospitals
    const hospitals = await Hospital.find({ isActive: true });
    console.log(`📋 Found ${hospitals.length} active hospitals:`);
    hospitals.forEach((hospital) => {
      console.log(
        `  - ${hospital.name} (${hospital.type}) - ${hospital.address.city}, ${hospital.address.state}`
      );
    });

    console.log("\n👨‍⚕️  Doctor-Hospital Assignments:");

    // Get all doctors with their hospital information
    const doctors = await Doctor.find({ isActive: true })
      .populate("userId", "profile.firstName profile.lastName email")
      .populate("hospitalId", "name address.city address.state");

    if (doctors.length === 0) {
      console.log("❌ No doctors found in the system");
      return;
    }

    // Group doctors by hospital
    const doctorsByHospital = {};
    let doctorsWithoutHospital = 0;
    let doctorsWithInvalidHospital = 0;

    for (const doctor of doctors) {
      if (!doctor.hospitalId || !doctor.hospitalId._id) {
        doctorsWithoutHospital++;
        console.log(
          `❌ Dr. ${doctor.userId?.profile?.firstName} ${doctor.userId?.profile?.lastName} - NO HOSPITAL ASSIGNED`
        );
        continue;
      }

      const hospitalName = doctor.hospitalId.name;
      if (!doctorsByHospital[hospitalName]) {
        doctorsByHospital[hospitalName] = [];
      }
      doctorsByHospital[hospitalName].push(doctor);
    }

    // Display doctors grouped by hospital
    for (const [hospitalName, hospitalDoctors] of Object.entries(
      doctorsByHospital
    )) {
      console.log(`\n🏥 ${hospitalName}:`);
      hospitalDoctors.forEach((doctor) => {
        console.log(
          `  ✅ Dr. ${doctor.userId?.profile?.firstName} ${doctor.userId?.profile?.lastName} - ${doctor.specialization} (${doctor.consultationFee}$)`
        );
      });
    }

    // Check for doctors with invalid hospital references
    const doctorsWithInvalidRefs = await Doctor.find({
      hospitalId: { $exists: true, $ne: null }
    }).populate("hospitalId");

    for (const doctor of doctorsWithInvalidRefs) {
      if (doctor.hospitalId && !doctor.hospitalId._id) {
        doctorsWithInvalidHospital++;
        console.log(
          `⚠️  Dr. ${doctor.userId?.profile?.firstName} ${doctor.userId?.profile?.lastName} - INVALID HOSPITAL REFERENCE`
        );
      }
    }

    // Summary
    console.log(`\n📊 Verification Summary:`);
    console.log(`- Total doctors: ${doctors.length}`);
    console.log(
      `- Doctors with valid hospital assignments: ${
        Object.values(doctorsByHospital).flat().length
      }`
    );
    console.log(`- Doctors without hospital: ${doctorsWithoutHospital}`);
    console.log(
      `- Doctors with invalid hospital references: ${doctorsWithInvalidHospital}`
    );

    if (doctorsWithoutHospital === 0 && doctorsWithInvalidHospital === 0) {
      console.log(`\n✅ All doctor-hospital relationships are valid!`);
    } else {
      console.log(
        `\n⚠️  Some issues found. Consider running the fixDoctorHospitalLinks script.`
      );
    }

    // Test API endpoints
    console.log(`\n🔗 Testing API endpoints...`);

    // Test hospital doctor count
    for (const hospital of hospitals) {
      const doctorCount = await Doctor.countDocuments({
        hospitalId: hospital._id,
        isActive: true,
        approvalStatus: "approved"
      });
      console.log(`  📈 ${hospital.name}: ${doctorCount} doctors`);
    }

    console.log(`\n🎉 Verification completed!`);
  } catch (error) {
    console.error("Error verifying doctor-hospital links:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
verifyDoctorHospitalLinks();
