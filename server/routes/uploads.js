const express = require("express");
const multer = require("multer");
const { auth } = require("../middleware/auth");
const gcsService = require("../services/gcsService");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only specific file types
    const allowedTypes = (
      process.env.ALLOWED_FILE_TYPES ||
      "application/pdf,image/jpeg,image/png,image/gif,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ).split(",");

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, images, and documents are allowed."
        ),
        false
      );
    }
  }
});

// @route   POST /api/uploads/general
// @desc    Upload a general file to GCS
// @access  Private
router.post(
  "/general",
  auth,
  upload.single("file"),
  [
    body("folder").optional().isString().withMessage("Folder must be a string"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const folder = req.body.folder || "general";
      const description = req.body.description || "";

      // Upload file to Google Cloud Storage
      const uploadResult = await gcsService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        folder,
        {
          mimeType: req.file.mimetype,
          uploadedBy: req.user._id.toString(),
          userRole: req.user.role,
          description: description
        }
      );

      res.status(201).json({
        message: "File uploaded successfully",
        file: {
          id: uploadResult.fileName,
          originalName: uploadResult.originalName,
          fileName: uploadResult.fileName,
          filePath: uploadResult.filePath,
          publicUrl: uploadResult.publicUrl,
          size: uploadResult.size,
          mimeType: uploadResult.mimeType,
          uploadedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("General upload error:", error);
      res.status(500).json({
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
);

// @route   POST /api/uploads/multiple
// @desc    Upload multiple files to GCS
// @access  Private
router.post(
  "/multiple",
  auth,
  upload.array("files", 10), // Maximum 10 files
  [
    body("folder").optional().isString().withMessage("Folder must be a string"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.files || req.files.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one file is required" });
      }

      const folder = req.body.folder || "general";
      const description = req.body.description || "";

      const uploadPromises = req.files.map(async (file) => {
        try {
          const uploadResult = await gcsService.uploadFile(
            file.buffer,
            file.originalname,
            folder,
            {
              mimeType: file.mimetype,
              uploadedBy: req.user._id.toString(),
              userRole: req.user.role,
              description: description
            }
          );

          return {
            success: true,
            file: {
              id: uploadResult.fileName,
              originalName: uploadResult.originalName,
              fileName: uploadResult.fileName,
              filePath: uploadResult.filePath,
              publicUrl: uploadResult.publicUrl,
              size: uploadResult.size,
              mimeType: uploadResult.mimeType,
              uploadedAt: new Date().toISOString()
            }
          };
        } catch (error) {
          return {
            success: false,
            originalName: file.originalname,
            error: error.message
          };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      res.status(201).json({
        message: `Uploaded ${successful.length} files successfully${
          failed.length > 0 ? `, ${failed.length} failed` : ""
        }`,
        successful: successful.map((r) => r.file),
        failed: failed,
        total: results.length
      });
    } catch (error) {
      console.error("Multiple upload error:", error);
      res.status(500).json({
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  }
);

// @route   DELETE /api/uploads/:filePath
// @desc    Delete a file from GCS
// @access  Private
router.delete("/:filePath(*)", auth, async (req, res) => {
  try {
    const filePath = req.params.filePath;

    if (!filePath) {
      return res.status(400).json({ message: "File path is required" });
    }

    const success = await gcsService.deleteFile(filePath);

    if (success) {
      res.json({ message: "File deleted successfully" });
    } else {
      res
        .status(404)
        .json({ message: "File not found or could not be deleted" });
    }
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// @route   GET /api/uploads/signed-url/:filePath
// @desc    Get a signed URL for private file access
// @access  Private
router.get("/signed-url/:filePath(*)", auth, async (req, res) => {
  try {
    const filePath = req.params.filePath;
    const expirationMinutes = parseInt(req.query.expires) || 60;

    if (!filePath) {
      return res.status(400).json({ message: "File path is required" });
    }

    const signedUrl = await gcsService.getSignedUrl(
      filePath,
      expirationMinutes
    );

    res.json({
      signedUrl: signedUrl,
      expiresIn: expirationMinutes * 60 // seconds
    });
  } catch (error) {
    console.error("Get signed URL error:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// @route   GET /api/uploads/health-check
// @desc    Check GCS connectivity
// @access  Private (Admin only)
router.get("/health-check", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "organization_admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const bucketAccess = await gcsService.checkBucketAccess();

    res.json({
      gcsConnected: bucketAccess,
      bucketName: process.env.GCS_BUCKET_NAME,
      projectId: process.env.GCS_PROJECT_ID,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("GCS health check error:", error);
    res.status(500).json({
      message: "GCS health check failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

module.exports = router;
