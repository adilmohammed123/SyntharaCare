const dotenv = require("dotenv");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

// Load environment variables
dotenv.config();

async function testGCSWithKeyFile() {
  console.log("🧪 Testing Google Cloud Storage with Key File...\n");

  try {
    // Initialize GCS client with key file
    const storage = new Storage({
      keyFilename: path.join(__dirname, "../config/gcs-key.json"),
      projectId: process.env.GCS_PROJECT_ID
    });

    const bucketName = process.env.GCS_BUCKET_NAME;
    console.log(`📋 Configuration:`);
    console.log(`   - Project ID: ${process.env.GCS_PROJECT_ID}`);
    console.log(`   - Bucket Name: ${bucketName}`);
    console.log(`   - Key File: config/gcs-key.json`);

    if (!bucketName) {
      console.log("❌ GCS_BUCKET_NAME environment variable is not set");
      return;
    }

    const bucket = storage.bucket(bucketName);

    // Test 1: Check bucket access
    console.log("\n1. Testing bucket access...");
    const [exists] = await bucket.exists();
    console.log(`   ✅ Bucket access: ${exists ? "SUCCESS" : "FAILED"}`);

    if (!exists) {
      console.log(
        "   ❌ Cannot access bucket. Please check your configuration."
      );
      return;
    }

    // Test 2: Upload a test file
    console.log("\n2. Testing file upload...");
    const testContent = Buffer.from(
      "This is a test file for SyntharaCare GCS integration."
    );
    const testFileName = "test-file.txt";
    const filePath = `test/${testFileName}`;

    const file = bucket.file(filePath);

    await file.save(testContent, {
      metadata: {
        contentType: "text/plain",
        metadata: {
          originalName: testFileName,
          uploadedAt: new Date().toISOString(),
          testUpload: true
        }
      }
    });

    console.log(`   ✅ File uploaded successfully:`);
    console.log(`      - File Name: ${testFileName}`);
    console.log(`      - File Path: ${filePath}`);

    // Test 3: Generate signed URL
    console.log("\n3. Testing signed URL generation...");
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });
    console.log(`   ✅ Signed URL generated:`);
    console.log(`      - URL: ${signedUrl.substring(0, 100)}...`);

    // Test 4: Get file metadata
    console.log("\n4. Testing file metadata retrieval...");
    const [metadata] = await file.getMetadata();
    console.log(`   ✅ Metadata retrieved:`);
    console.log(`      - Content Type: ${metadata.contentType}`);
    console.log(`      - Size: ${metadata.size} bytes`);
    console.log(`      - Created: ${metadata.timeCreated}`);

    // Test 5: Delete test file
    console.log("\n5. Testing file deletion...");
    await file.delete();
    console.log(`   ✅ File deletion: SUCCESS`);

    console.log(
      "\n🎉 All GCS tests passed! Your configuration is working correctly."
    );
    console.log(
      "\n📝 Your bucket is private, so files will use signed URLs for access."
    );
    console.log("   This is more secure than public access.");
  } catch (error) {
    console.error("\n❌ GCS test failed:", error.message);
    console.error("\n🔧 Troubleshooting tips:");
    console.error(
      "   1. Check that your service account key file exists at config/gcs-key.json"
    );
    console.error(
      "   2. Verify your service account has the correct permissions"
    );
    console.error("   3. Ensure your bucket exists and is accessible");
    console.error(
      "   4. Check that your GCS_BUCKET_NAME environment variable is set"
    );
    console.error("\n📖 See GCS_SETUP.md for detailed setup instructions.");
  }
}

// Run the test
testGCSWithKeyFile();
