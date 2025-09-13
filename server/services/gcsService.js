const { Storage } = require("@google-cloud/storage");
const path = require("path");

class GCSService {
  constructor() {
    // Validate required environment variables
    if (!process.env.GCS_PROJECT_ID) {
      throw new Error("GCS_PROJECT_ID environment variable is required");
    }
    if (!process.env.GCS_BUCKET_NAME) {
      throw new Error("GCS_BUCKET_NAME environment variable is required");
    }
    if (!process.env.GCS_CREDENTIALS) {
      throw new Error("GCS_CREDENTIALS environment variable is required");
    }

    // Parse credentials
    let credentials;
    try {
      credentials = JSON.parse(process.env.GCS_CREDENTIALS);
    } catch (error) {
      throw new Error("GCS_CREDENTIALS must be valid JSON: " + error.message);
    }

    // Initialize GCS client
    this.storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: credentials
    });

    // Get your bucket name from environment variable
    this.bucketName = process.env.GCS_BUCKET_NAME;
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * Upload a file to Google Cloud Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} folder - Folder path in bucket (e.g., 'health-history', 'prescriptions')
   * @param {Object} metadata - File metadata
   * @returns {Promise<Object>} Upload result with public URL
   */
  async uploadFile(fileBuffer, fileName, folder = "uploads", metadata = {}) {
    try {
      // Generate unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileExtension = path.extname(fileName);
      const baseName = path.basename(fileName, fileExtension);
      const uniqueFileName = `${baseName}-${uniqueSuffix}${fileExtension}`;

      // Create file path in bucket
      const filePath = `${folder}/${uniqueFileName}`;

      // Create file reference
      const file = this.bucket.file(filePath);

      // Upload options
      const uploadOptions = {
        metadata: {
          contentType: metadata.mimeType || "application/octet-stream",
          metadata: {
            originalName: fileName,
            uploadedAt: new Date().toISOString(),
            ...metadata
          }
        },
        validation: "crc32c"
      };

      // Upload file
      await file.save(fileBuffer, uploadOptions);

      // Generate signed URL for private access (valid for 1 year)
      const signedUrl = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
      });

      // Get the signed URL
      const publicUrl = signedUrl[0];

      return {
        success: true,
        fileName: uniqueFileName,
        originalName: fileName,
        filePath: filePath,
        publicUrl: publicUrl,
        size: fileBuffer.length,
        mimeType: metadata.mimeType || "application/octet-stream"
      };
    } catch (error) {
      console.error("GCS Upload Error:", error);
      throw new Error(`Failed to upload file to GCS: ${error.message}`);
    }
  }

  /**
   * Delete a file from Google Cloud Storage
   * @param {string} filePath - File path in bucket
   * @returns {Promise<boolean>} Success status
   */
  async deleteFile(filePath) {
    try {
      const file = this.bucket.file(filePath);
      await file.delete();
      return true;
    } catch (error) {
      console.error("GCS Delete Error:", error);
      return false;
    }
  }

  /**
   * Get file metadata from Google Cloud Storage
   * @param {string} filePath - File path in bucket
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(filePath) {
    try {
      const file = this.bucket.file(filePath);
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error("GCS Get Metadata Error:", error);
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for private file access
   * @param {string} filePath - File path in bucket
   * @param {number} expirationMinutes - URL expiration time in minutes (default: 60)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(filePath, expirationMinutes = 60) {
    try {
      const file = this.bucket.file(filePath);
      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + expirationMinutes * 60 * 1000
      });
      return signedUrl;
    } catch (error) {
      console.error("GCS Signed URL Error:", error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Check if bucket exists and is accessible
   * @returns {Promise<boolean>} Bucket accessibility status
   */
  async checkBucketAccess() {
    try {
      const [exists] = await this.bucket.exists();
      return exists;
    } catch (error) {
      console.error("GCS Bucket Check Error:", error);
      return false;
    }
  }
}

module.exports = new GCSService();
