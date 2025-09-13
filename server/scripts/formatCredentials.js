const fs = require("fs");
const path = require("path");

/**
 * Script to help format GCS credentials for environment variables
 * Usage: node scripts/formatCredentials.js path/to/your/service-account-key.json
 */

function formatCredentials() {
  const keyFilePath = process.argv[2];

  if (!keyFilePath) {
    console.log("❌ Please provide the path to your service account key file");
    console.log(
      "Usage: node scripts/formatCredentials.js path/to/your/service-account-key.json"
    );
    console.log("\nExample:");
    console.log("node scripts/formatCredentials.js ./config/gcs-key.json");
    return;
  }

  try {
    // Check if file exists
    if (!fs.existsSync(keyFilePath)) {
      console.log(`❌ File not found: ${keyFilePath}`);
      return;
    }

    // Read the JSON file
    const keyFileContent = fs.readFileSync(keyFilePath, "utf8");

    // Parse to validate it's valid JSON
    const credentials = JSON.parse(keyFileContent);

    // Validate required fields
    const requiredFields = [
      "type",
      "project_id",
      "private_key",
      "client_email"
    ];
    const missingFields = requiredFields.filter((field) => !credentials[field]);

    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    // Format for environment variable (single line with escaped quotes)
    const formattedCredentials = JSON.stringify(credentials);

    console.log("✅ Credentials formatted successfully!");
    console.log("\n📋 Add this to your .env file:");
    console.log("=".repeat(80));
    console.log(`GCS_PROJECT_ID=${credentials.project_id}`);
    console.log(`GCS_BUCKET_NAME=your-bucket-name`);
    console.log(`GCS_CREDENTIALS=${formattedCredentials}`);
    console.log("=".repeat(80));

    console.log("\n📝 Complete .env example:");
    console.log("=".repeat(80));
    console.log("# Google Cloud Storage Configuration");
    console.log(`GCS_PROJECT_ID=${credentials.project_id}`);
    console.log("GCS_BUCKET_NAME=your-bucket-name");
    console.log(`GCS_CREDENTIALS=${formattedCredentials}`);
    console.log("");
    console.log("# File Upload Settings");
    console.log("MAX_FILE_SIZE=10485760");
    console.log(
      "ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png,image/gif,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    console.log("=".repeat(80));

    console.log("\n🔧 Next steps:");
    console.log("1. Copy the GCS_CREDENTIALS line above to your .env file");
    console.log('2. Replace "your-bucket-name" with your actual bucket name');
    console.log("3. Test your configuration: node scripts/testGCS.js");
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log(
        "❌ Invalid JSON file. Please check your service account key file."
      );
    } else {
      console.log(`❌ Error reading file: ${error.message}`);
    }
  }
}

// Run the formatter
formatCredentials();
