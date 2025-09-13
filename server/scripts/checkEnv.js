const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

console.log("🔍 Checking Environment Variables...\n");

// Check required GCS environment variables
const requiredVars = ["GCS_PROJECT_ID", "GCS_BUCKET_NAME", "GCS_CREDENTIALS"];

let allPresent = true;

requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    console.log(
      `✅ ${varName}: ${value.substring(0, 50)}${
        value.length > 50 ? "..." : ""
      }`
    );
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allPresent = false;
  }
});

console.log("\n📋 Additional Variables:");
console.log(
  `MAX_FILE_SIZE: ${
    process.env.MAX_FILE_SIZE || "Not set (will use default 10MB)"
  }`
);
console.log(
  `ALLOWED_FILE_TYPES: ${
    process.env.ALLOWED_FILE_TYPES || "Not set (will use defaults)"
  }`
);

if (allPresent) {
  console.log("\n🎉 All required environment variables are set!");

  // Test if GCS_CREDENTIALS is valid JSON
  try {
    const credentials = JSON.parse(process.env.GCS_CREDENTIALS);
    console.log("✅ GCS_CREDENTIALS is valid JSON");
    console.log(`   Project ID: ${credentials.project_id}`);
    console.log(`   Client Email: ${credentials.client_email}`);
  } catch (error) {
    console.log("❌ GCS_CREDENTIALS is not valid JSON:", error.message);
  }
} else {
  console.log("\n❌ Some required environment variables are missing!");
  console.log(
    "\n🔧 Please check your .env file and make sure all variables are set correctly."
  );
}
