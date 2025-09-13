const dotenv = require("dotenv");
const { Storage } = require("@google-cloud/storage");

// Load environment variables
dotenv.config();

async function testRenderGCS() {
  console.log("🔍 Testing GCS Configuration on Render...\n");

  try {
    // Check environment variables
    console.log("📋 Environment Variables:");
    console.log(
      `   - GCS_PROJECT_ID: ${
        process.env.GCS_PROJECT_ID ? "✅ Set" : "❌ Missing"
      }`
    );
    console.log(
      `   - GCS_BUCKET_NAME: ${
        process.env.GCS_BUCKET_NAME ? "✅ Set" : "❌ Missing"
      }`
    );
    console.log(
      `   - GCS_CREDENTIALS: ${
        process.env.GCS_CREDENTIALS ? "✅ Set" : "❌ Missing"
      }`
    );

    if (!process.env.GCS_PROJECT_ID) {
      throw new Error("GCS_PROJECT_ID is not set");
    }
    if (!process.env.GCS_BUCKET_NAME) {
      throw new Error("GCS_BUCKET_NAME is not set");
    }
    if (!process.env.GCS_CREDENTIALS) {
      throw new Error("GCS_CREDENTIALS is not set");
    }

    // Parse credentials - handle both file path and direct JSON
    let credentials;
    try {
      const credentialsValue = process.env.GCS_CREDENTIALS;

      // Check if it's a file path (starts with /)
      if (credentialsValue.startsWith("/")) {
        console.log(`   - GCS_CREDENTIALS: 📁 File path: ${credentialsValue}`);
        // It's a file path, read the file
        const fs = require("fs");
        const credentialsContent = fs.readFileSync(credentialsValue, "utf8");
        credentials = JSON.parse(credentialsContent);
        console.log(
          "   - GCS_CREDENTIALS: ✅ File read and parsed successfully"
        );
      } else {
        console.log("   - GCS_CREDENTIALS: 📄 Direct JSON content");
        // It's direct JSON content
        credentials = JSON.parse(credentialsValue);
        console.log("   - GCS_CREDENTIALS: ✅ Valid JSON");
      }
    } catch (error) {
      throw new Error(
        `GCS_CREDENTIALS must be valid JSON or file path: ${error.message}`
      );
    }

    // Initialize GCS client
    console.log("\n🚀 Initializing GCS Client...");
    const storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: credentials
    });

    const bucketName = process.env.GCS_BUCKET_NAME;
    const bucket = storage.bucket(bucketName);

    // Test bucket access
    console.log(`\n🔍 Testing bucket access: ${bucketName}`);
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(
        `Bucket ${bucketName} does not exist or is not accessible`
      );
    }
    console.log("✅ Bucket access confirmed");

    // Test file upload
    console.log("\n📤 Testing file upload...");
    const testContent = "Test file for Render deployment";
    const fileName = `test-${Date.now()}.txt`;
    const file = bucket.file(`test/${fileName}`);

    await file.save(testContent, {
      metadata: {
        contentType: "text/plain",
        metadata: {
          test: "true",
          uploadedAt: new Date().toISOString()
        }
      }
    });

    console.log("✅ Test file uploaded successfully");

    // Generate signed URL
    console.log("\n🔗 Testing signed URL generation...");
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    console.log("✅ Signed URL generated successfully");
    console.log(`   - URL: ${signedUrl.substring(0, 100)}...`);

    // Clean up test file
    console.log("\n🧹 Cleaning up test file...");
    await file.delete();
    console.log("✅ Test file deleted");

    console.log("\n🎉 All tests passed! GCS is properly configured on Render.");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("   1. Check your Render environment variables");
    console.error("   2. Verify GCS_CREDENTIALS is valid JSON");
    console.error("   3. Ensure your service account has proper permissions");
    console.error("   4. Check that your bucket exists and is accessible");
    process.exit(1);
  }
}

// Run the test
testRenderGCS();
