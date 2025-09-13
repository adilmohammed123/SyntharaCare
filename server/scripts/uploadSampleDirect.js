const dotenv = require("dotenv");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

// Load environment variables
dotenv.config();

async function uploadSampleFileDirect() {
  console.log("📄 Uploading Sample Medical Document (Direct Method)...\n");

  try {
    // Initialize GCS client directly
    const storage = new Storage({
      keyFilename: path.join(__dirname, "../config/gcs-key.json"),
      projectId: process.env.GCS_PROJECT_ID
    });

    const bucketName = process.env.GCS_BUCKET_NAME;
    console.log(`📋 Configuration:`);
    console.log(`   - Project ID: ${process.env.GCS_PROJECT_ID}`);
    console.log(`   - Bucket Name: ${bucketName}`);

    if (!bucketName) {
      console.log("❌ GCS_BUCKET_NAME environment variable is not set");
      return;
    }

    const bucket = storage.bucket(bucketName);

    // Create sample medical document content
    const sampleContent = `
MEDICAL CONSULTATION RECORD

Doctor: Reynaldo O. Joson, M.D.
Hospital: MANILA DOCTORS HOSPITAL
Address: Suite 301, Medical Arts Center, U.N. Avenue Ermita, Manila
Telephone: 524-30-11 Loc 4100; 522-47-13

Patient Information:
- Name: Ma. Theresa [Sample Patient]
- Patient ID: 561F
- Date: 12-6-2014

Chief Complaint: Neck mass - noted 2 weeks ago, no pain

Physical Examination:
- Right Lobe: Thyroid Mass Right Lobe (~2cm)
- Characteristics:
  * Moves with swallowing
  * Feels solid/firm
  * No tenderness
  * No redness

Assessment:
- Cancer probability: ~90%
- Not Cancer: 10%
- Need for diagnostic test

Diagnostic Options:
1. Biopsy, needle (90% accuracy)
   - Benefits: Direct diagnosis
   - Risks: Bleeding, Infection
   - Recovery time required

2. Ultrasound Thyroid Gland
   - Indirect assessment
   - Immediate results available

Thyroid Disorder Classification:
- Functional: Hormones (HCSPO - Normal, no symptoms)
- Structural: Masses (Cancer vs Not Cancer)

Signature: [M.D.]
License #: 44609

---
This is a sample medical document for testing SyntharaCare file upload functionality.
Uploaded on: ${new Date().toISOString()}
    `.trim();

    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileName = `sample-medical-consultation-${uniqueSuffix}.txt`;
    const filePath = `health-history/${fileName}`;

    console.log("📋 File Details:");
    console.log(`   - File Name: ${fileName}`);
    console.log(`   - File Path: ${filePath}`);
    console.log(
      `   - File Size: ${Buffer.byteLength(sampleContent, "utf8")} bytes`
    );
    console.log(`   - Content Type: Medical consultation record`);

    // Upload to GCS
    console.log("\n🚀 Uploading to Google Cloud Storage...");
    const file = bucket.file(filePath);

    await file.save(sampleContent, {
      metadata: {
        contentType: "text/plain",
        metadata: {
          originalName: "sample-medical-consultation.txt",
          uploadedAt: new Date().toISOString(),
          patientId: "sample-patient-id",
          category: "consultation_note",
          title: "Sample Medical Consultation - Thyroid Mass",
          description:
            "Sample medical consultation record for testing file upload functionality",
          doctorName: "Dr. Reynaldo O. Joson",
          hospitalName: "Manila Doctors Hospital"
        }
      }
    });

    console.log("\n✅ Upload Successful!");

    // Generate signed URL
    console.log("\n🔗 Generating Signed URL...");
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
    });

    // Get file metadata
    const [metadata] = await file.getMetadata();

    console.log("📋 Upload Results:");
    console.log(`   - File Name: ${fileName}`);
    console.log(`   - File Path: ${filePath}`);
    console.log(`   - Signed URL: ${signedUrl.substring(0, 100)}...`);
    console.log(`   - File Size: ${metadata.size} bytes`);
    console.log(`   - Content Type: ${metadata.contentType}`);
    console.log(`   - Created: ${metadata.timeCreated}`);

    console.log("\n🎉 Sample file upload test completed successfully!");
    console.log("\n📝 File Information:");
    console.log(`   - This file is now stored in your private GCS bucket`);
    console.log(`   - Accessible via signed URL (valid for 1 year)`);
    console.log(`   - Organized in the 'health-history' folder`);
    console.log(`   - Ready for use in your SyntharaCare application`);

    console.log("\n🔧 Next Steps:");
    console.log("   1. Test file uploads through your application UI");
    console.log("   2. Use the health history upload feature");
    console.log("   3. Test the FileUpload and FileViewer components");
    console.log(
      "   4. All files will be securely stored in your private GCS bucket"
    );
  } catch (error) {
    console.error("\n❌ Upload failed:", error.message);
    console.error("\n🔧 Troubleshooting:");
    console.error("   1. Make sure your server is running");
    console.error("   2. Check your GCS configuration");
    console.error("   3. Verify your service account permissions");
    console.error("   4. Ensure your bucket exists and is accessible");
  }
}

// Run the upload test
uploadSampleFileDirect();
