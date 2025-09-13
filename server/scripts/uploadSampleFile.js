const dotenv = require("dotenv");
const gcsService = require("../services/gcsService");
const fs = require("fs");
const path = require("path");

// Load environment variables
dotenv.config();

async function uploadSampleFile() {
  console.log("📄 Uploading Sample Medical Document...\n");

  try {
    // Create a sample medical document content
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
    `.trim();

    // Convert to buffer
    const fileBuffer = Buffer.from(sampleContent, "utf8");
    const fileName = "sample-medical-consultation.txt";

    console.log("📋 File Details:");
    console.log(`   - File Name: ${fileName}`);
    console.log(`   - File Size: ${fileBuffer.length} bytes`);
    console.log(`   - Content Type: Medical consultation record`);
    console.log(`   - Category: consultation_note`);

    // Upload to GCS
    console.log("\n🚀 Uploading to Google Cloud Storage...");
    const uploadResult = await gcsService.uploadFile(
      fileBuffer,
      fileName,
      "health-history",
      {
        mimeType: "text/plain",
        patientId: "sample-patient-id",
        category: "consultation_note",
        title: "Sample Medical Consultation - Thyroid Mass",
        description:
          "Sample medical consultation record for testing file upload functionality",
        doctorName: "Dr. Reynaldo O. Joson",
        hospitalName: "Manila Doctors Hospital"
      }
    );

    console.log("\n✅ Upload Successful!");
    console.log("📋 Upload Results:");
    console.log(`   - File Name: ${uploadResult.fileName}`);
    console.log(`   - Original Name: ${uploadResult.originalName}`);
    console.log(`   - File Path: ${uploadResult.filePath}`);
    console.log(`   - Public URL: ${uploadResult.publicUrl}`);
    console.log(`   - File Size: ${uploadResult.size} bytes`);
    console.log(`   - MIME Type: ${uploadResult.mimeType}`);

    // Test file access
    console.log("\n🔍 Testing File Access...");
    try {
      const metadata = await gcsService.getFileMetadata(uploadResult.filePath);
      console.log("✅ File metadata retrieved successfully");
      console.log(`   - Content Type: ${metadata.contentType}`);
      console.log(`   - Created: ${metadata.timeCreated}`);
      console.log(`   - Size: ${metadata.size} bytes`);
    } catch (error) {
      console.log("❌ Error retrieving metadata:", error.message);
    }

    // Test signed URL generation
    console.log("\n🔗 Testing Signed URL Generation...");
    try {
      const signedUrl = await gcsService.getSignedUrl(
        uploadResult.filePath,
        60
      );
      console.log("✅ Signed URL generated successfully");
      console.log(`   - URL: ${signedUrl.substring(0, 100)}...`);
      console.log(`   - Expires: 60 minutes`);
    } catch (error) {
      console.log("❌ Error generating signed URL:", error.message);
    }

    console.log("\n🎉 Sample file upload test completed successfully!");
    console.log("\n📝 Next Steps:");
    console.log(
      "   1. You can now test file uploads through your application UI"
    );
    console.log(
      "   2. Use the health history upload feature to upload real medical documents"
    );
    console.log(
      "   3. Test the FileUpload and FileViewer components in your frontend"
    );
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
uploadSampleFile();
