const dotenv = require("dotenv");
const gcsService = require("../services/gcsService");

// Load environment variables
dotenv.config();

async function testGCS() {
  console.log("🧪 Testing Google Cloud Storage Configuration...\n");

  try {
    // Test 1: Check bucket access
    console.log("1. Testing bucket access...");
    const bucketAccess = await gcsService.checkBucketAccess();
    console.log(`   ✅ Bucket access: ${bucketAccess ? "SUCCESS" : "FAILED"}`);

    if (!bucketAccess) {
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

    const uploadResult = await gcsService.uploadFile(
      testContent,
      testFileName,
      "test",
      {
        mimeType: "text/plain",
        testUpload: true,
        uploadedAt: new Date().toISOString()
      }
    );

    console.log(`   ✅ File uploaded successfully:`);
    console.log(`      - File Name: ${uploadResult.fileName}`);
    console.log(`      - Public URL: ${uploadResult.publicUrl}`);
    console.log(`      - File Size: ${uploadResult.size} bytes`);

    // Test 3: Get file metadata
    console.log("\n3. Testing file metadata retrieval...");
    const metadata = await gcsService.getFileMetadata(uploadResult.filePath);
    console.log(`   ✅ Metadata retrieved:`);
    console.log(`      - Content Type: ${metadata.contentType}`);
    console.log(`      - Size: ${metadata.size} bytes`);
    console.log(`      - Created: ${metadata.timeCreated}`);

    // Test 4: Generate signed URL
    console.log("\n4. Testing signed URL generation...");
    const signedUrl = await gcsService.getSignedUrl(uploadResult.filePath, 60);
    console.log(`   ✅ Signed URL generated:`);
    console.log(`      - URL: ${signedUrl.substring(0, 100)}...`);

    // Test 5: Delete test file
    console.log("\n5. Testing file deletion...");
    const deleteResult = await gcsService.deleteFile(uploadResult.filePath);
    console.log(`   ✅ File deletion: ${deleteResult ? "SUCCESS" : "FAILED"}`);

    console.log(
      "\n🎉 All GCS tests passed! Your configuration is working correctly."
    );
    console.log("\n📋 Configuration Summary:");
    console.log(`   - Project ID: ${process.env.GCS_PROJECT_ID || "Not set"}`);
    console.log(
      `   - Bucket Name: ${process.env.GCS_BUCKET_NAME || "Not set"}`
    );
    console.log(`   - Max File Size: ${process.env.MAX_FILE_SIZE || "10MB"}`);
    console.log(
      `   - Allowed Types: ${process.env.ALLOWED_FILE_TYPES || "Default types"}`
    );
  } catch (error) {
    console.error("\n❌ GCS test failed:", error.message);
    console.error("\n🔧 Troubleshooting tips:");
    console.error(
      "   1. Check your GCS_PROJECT_ID and GCS_BUCKET_NAME environment variables"
    );
    console.error("   2. Verify your GCS_CREDENTIALS are properly formatted");
    console.error(
      "   3. Ensure your service account has the correct permissions"
    );
    console.error("   4. Check that your bucket exists and is accessible");
    console.error("\n📖 See GCS_SETUP.md for detailed setup instructions.");
  }
}

// Run the test
testGCS();
