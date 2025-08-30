const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { connectToDatabase } = require("./lib/db");

// Define User schema inline since we can't import the model directly
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin", "organization_admin"],
      default: "patient"
    },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ["male", "female", "other"] },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      emergencyContact: {
        name: String,
        phone: String,
        relationship: String
      }
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    approvalNotes: {
      type: String,
      maxlength: 1000
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      return {
        success: true,
        message: "Admin user already exists",
        email: existingAdmin.email
      };
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

    const admin = new User(adminData);
    await admin.save();

    console.log("✅ Admin user created successfully!");
    console.log("Email:", adminData.email);
    console.log("Password:", "admin123456");

    return {
      success: true,
      message: "Admin user created successfully",
      email: adminData.email,
      password: "admin123456"
    };
  } catch (error) {
    console.error("Error creating admin user:", error);
    return {
      success: false,
      message: "Error creating admin user",
      error: error.message
    };
  }
}

// Export for use in API
module.exports = { createAdminUser };

// If run directly, execute the function
if (require.main === module) {
  createAdminUser()
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
