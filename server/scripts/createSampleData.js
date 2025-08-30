const mongoose = require("mongoose");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "./config.env" });

async function createSampleData() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/hospital_management";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Find admin user
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log(
        "❌ No admin user found. Please run the createAdmin script first."
      );
      return;
    }

    // Create sample hospitals
    const sampleHospitals = [
      {
        name: "City General Hospital",
        description:
          "A comprehensive medical center serving the city with state-of-the-art facilities",
        type: "public",
        address: {
          street: "456 Medical Center Drive",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA"
        },
        contact: {
          phone: "+1-555-0123",
          email: "info@citygeneral.com",
          website: "https://citygeneral.com"
        },
        facilities: [
          "emergency_room",
          "icu",
          "operating_room",
          "laboratory",
          "radiology",
          "pharmacy"
        ],
        specializations: [
          "Cardiology",
          "Neurology",
          "Orthopedics",
          "Emergency Medicine",
          "Internal Medicine"
        ],
        capacity: {
          beds: 250,
          icuBeds: 25,
          emergencyBeds: 30
        },
        emergencyServices: true,
        ambulanceServices: true,
        organizationAdmin: adminUser._id,
        approvalStatus: "approved",
        isActive: true,
        isVerified: true
      },
      {
        name: "Mercy Medical Center",
        description:
          "Specialized care facility focusing on patient comfort and advanced treatments",
        type: "private",
        address: {
          street: "789 Healthcare Avenue",
          city: "Los Angeles",
          state: "CA",
          zipCode: "90210",
          country: "USA"
        },
        contact: {
          phone: "+1-555-0456",
          email: "contact@mercymedical.com",
          website: "https://mercymedical.com"
        },
        facilities: [
          "emergency_room",
          "icu",
          "operating_room",
          "laboratory",
          "radiology",
          "rehabilitation"
        ],
        specializations: [
          "Oncology",
          "Cardiology",
          "Pediatrics",
          "Surgery",
          "Dermatology"
        ],
        capacity: {
          beds: 180,
          icuBeds: 20,
          emergencyBeds: 25
        },
        emergencyServices: true,
        ambulanceServices: true,
        organizationAdmin: adminUser._id,
        approvalStatus: "approved",
        isActive: true,
        isVerified: true
      },
      {
        name: "Regional Specialty Hospital",
        description:
          "Focused on specialized medical procedures and advanced treatments",
        type: "specialty",
        address: {
          street: "321 Specialist Lane",
          city: "Chicago",
          state: "IL",
          zipCode: "60601",
          country: "USA"
        },
        contact: {
          phone: "+1-555-0789",
          email: "info@regionalspecialty.com",
          website: "https://regionalspecialty.com"
        },
        facilities: [
          "operating_room",
          "laboratory",
          "radiology",
          "rehabilitation",
          "cardiology_unit"
        ],
        specializations: [
          "Cardiology",
          "Neurology",
          "Orthopedics",
          "Surgery",
          "Radiology"
        ],
        capacity: {
          beds: 120,
          icuBeds: 15,
          emergencyBeds: 15
        },
        emergencyServices: false,
        ambulanceServices: false,
        organizationAdmin: adminUser._id,
        approvalStatus: "approved",
        isActive: true,
        isVerified: true
      }
    ];

    console.log("Creating sample hospitals...");
    const createdHospitals = [];
    for (const hospitalData of sampleHospitals) {
      const existingHospital = await Hospital.findOne({
        name: hospitalData.name
      });
      if (!existingHospital) {
        const hospital = new Hospital(hospitalData);
        await hospital.save();
        createdHospitals.push(hospital);
        console.log(`✅ Created hospital: ${hospital.name}`);
      } else {
        createdHospitals.push(existingHospital);
        console.log(`⚠️  Hospital already exists: ${existingHospital.name}`);
      }
    }

    // Create sample doctors
    const sampleDoctors = [
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@citygeneral.com",
        password: "doctor123456",
        specialization: "Cardiology",
        licenseNumber: "LIC-001",
        experience: 8,
        consultationFee: 150,
        hospitalIndex: 0 // City General Hospital
      },
      {
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@citygeneral.com",
        password: "doctor123456",
        specialization: "Neurology",
        licenseNumber: "LIC-002",
        experience: 12,
        consultationFee: 180,
        hospitalIndex: 0 // City General Hospital
      },
      {
        firstName: "Emily",
        lastName: "Rodriguez",
        email: "emily.rodriguez@mercymedical.com",
        password: "doctor123456",
        specialization: "Oncology",
        licenseNumber: "LIC-003",
        experience: 15,
        consultationFee: 200,
        hospitalIndex: 1 // Mercy Medical Center
      },
      {
        firstName: "David",
        lastName: "Thompson",
        email: "david.thompson@mercymedical.com",
        password: "doctor123456",
        specialization: "Pediatrics",
        licenseNumber: "LIC-004",
        experience: 10,
        consultationFee: 120,
        hospitalIndex: 1 // Mercy Medical Center
      },
      {
        firstName: "Lisa",
        lastName: "Wang",
        email: "lisa.wang@regionalspecialty.com",
        password: "doctor123456",
        specialization: "Orthopedics",
        licenseNumber: "LIC-005",
        experience: 14,
        consultationFee: 160,
        hospitalIndex: 2 // Regional Specialty Hospital
      },
      {
        firstName: "James",
        lastName: "Wilson",
        email: "james.wilson@regionalspecialty.com",
        password: "doctor123456",
        specialization: "Surgery",
        licenseNumber: "LIC-006",
        experience: 18,
        consultationFee: 220,
        hospitalIndex: 2 // Regional Specialty Hospital
      }
    ];

    console.log("\nCreating sample doctors...");
    let createdDoctors = 0;
    for (const doctorData of sampleDoctors) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: doctorData.email });
      if (existingUser) {
        console.log(`⚠️  Doctor user already exists: ${doctorData.email}`);
        continue;
      }

      // Create user account
      const hashedPassword = await bcrypt.hash(doctorData.password, 10);
      const user = new User({
        email: doctorData.email,
        password: hashedPassword,
        role: "doctor",
        profile: {
          firstName: doctorData.firstName,
          lastName: doctorData.lastName,
          phone: "+1-555-0000",
          dateOfBirth: new Date("1980-01-01"),
          gender: "other"
        },
        approvalStatus: "approved"
      });

      await user.save();

      // Create doctor profile
      const hospital = createdHospitals[doctorData.hospitalIndex];
      const doctor = new Doctor({
        userId: user._id,
        hospitalId: hospital._id,
        specialization: doctorData.specialization,
        licenseNumber: doctorData.licenseNumber,
        experience: doctorData.experience,
        consultationFee: doctorData.consultationFee,
        bio: `Experienced ${doctorData.specialization} specialist with ${doctorData.experience} years of practice.`,
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
      createdDoctors++;
      console.log(
        `✅ Created doctor: Dr. ${doctorData.firstName} ${doctorData.lastName} (${doctorData.specialization}) at ${hospital.name}`
      );
    }

    console.log(`\n📊 Summary:`);
    console.log(`- Hospitals created/verified: ${createdHospitals.length}`);
    console.log(`- Doctors created: ${createdDoctors}`);
    console.log(`\n🎉 Sample data creation completed!`);
    console.log(`\nYou can now test the doctor-hospital relationships with:`);
    console.log(`- Login as admin: admin@syntharacare.com / admin123456`);
    console.log(`- Login as any doctor: [email] / doctor123456`);
    console.log(
      `- Check the Hospitals and Doctors pages to see the relationships`
    );
  } catch (error) {
    console.error("Error creating sample data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the script
createSampleData();
