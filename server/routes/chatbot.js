const express = require("express");
const router = express.Router();
const { auth, authorize } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

// Conditionally require Gemini service
let geminiService;
try {
  geminiService = require("../services/geminiService");
} catch (error) {
  console.warn("Gemini service not available:", error.message);
  geminiService = null;
}

// Test endpoint to verify chatbot routes are working
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Chatbot routes are working",
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY
  });
});

// Chat with AI assistant
router.post(
  "/chat",
  auth,
  authorize(["doctor", "patient"]),
  [
    body("message").notEmpty().withMessage("Message is required"),
    body("context")
      .optional()
      .isObject()
      .withMessage("Context must be an object")
  ],
  async (req, res) => {
    try {
      console.log("Chatbot request received:", {
        user: req.user._id,
        role: req.user.role,
        message: req.body.message,
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const { message, context = {} } = req.body;

      // Add user role to context
      const contextWithRole = {
        ...context,
        userRole: req.user.role
      };

      if (!geminiService) {
        return res.status(503).json({
          success: false,
          message: "AI chatbot service is not available"
        });
      }

      console.log("Calling Gemini service with context:", contextWithRole);
      const response = await geminiService.generateResponse(
        message,
        contextWithRole
      );

      console.log("Gemini response received, length:", response.length);
      res.json({
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Chatbot error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate AI response",
        error: error.message
      });
    }
  }
);

// Search medical information
router.post(
  "/search",
  auth,
  authorize(["doctor", "patient"]),
  [
    body("query").notEmpty().withMessage("Search query is required"),
    body("searchType")
      .optional()
      .isIn(["treatments", "medications", "diagnosis", "procedures", "general"])
      .withMessage("Invalid search type")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const { query, searchType = "general" } = req.body;

      if (!geminiService) {
        return res.status(503).json({
          success: false,
          message: "AI chatbot service is not available"
        });
      }

      const response = await geminiService.searchMedicalInfo(query, searchType);

      res.json({
        success: true,
        query: query,
        searchType: searchType,
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Medical search error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search medical information",
        error: error.message
      });
    }
  }
);

// Check drug interactions
router.post(
  "/drug-interactions",
  auth,
  authorize(["doctor", "patient"]),
  [
    body("medications")
      .isArray({ min: 2 })
      .withMessage("At least 2 medications required")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const { medications } = req.body;

      if (!geminiService) {
        return res.status(503).json({
          success: false,
          message: "AI chatbot service is not available"
        });
      }

      const response = await geminiService.getDrugInteractions(medications);

      res.json({
        success: true,
        medications: medications,
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Drug interaction check error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check drug interactions",
        error: error.message
      });
    }
  }
);

// Suggest diagnostic tests
router.post(
  "/diagnostic-tests",
  auth,
  authorize(["doctor", "patient"]),
  [
    body("symptoms")
      .isArray({ min: 1 })
      .withMessage("At least one symptom required"),
    body("suspectedConditions").optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const { symptoms, suspectedConditions = [] } = req.body;

      if (!geminiService) {
        return res.status(503).json({
          success: false,
          message: "AI chatbot service is not available"
        });
      }

      const response = await geminiService.suggestDiagnosticTests(
        symptoms,
        suspectedConditions
      );

      res.json({
        success: true,
        symptoms: symptoms,
        suspectedConditions: suspectedConditions,
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Diagnostic test suggestion error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to suggest diagnostic tests",
        error: error.message
      });
    }
  }
);

// Get treatment protocol
router.post(
  "/treatment-protocol",
  auth,
  authorize(["doctor", "patient"]),
  [
    body("condition").notEmpty().withMessage("Condition is required"),
    body("severity")
      .optional()
      .isIn(["mild", "moderate", "severe"])
      .withMessage("Invalid severity level")
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array()
        });
      }

      const { condition, severity = "moderate" } = req.body;

      if (!geminiService) {
        return res.status(503).json({
          success: false,
          message: "AI chatbot service is not available"
        });
      }

      const response = await geminiService.getTreatmentProtocol(
        condition,
        severity
      );

      res.json({
        success: true,
        condition: condition,
        severity: severity,
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Treatment protocol error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get treatment protocol",
        error: error.message
      });
    }
  }
);

// Get quick medical facts
router.get(
  "/quick-facts/:topic",
  auth,
  authorize(["doctor", "patient"]),
  async (req, res) => {
    try {
      const { topic } = req.params;

      if (!geminiService) {
        return res.status(503).json({
          success: false,
          message: "AI chatbot service is not available"
        });
      }

      const response = await geminiService.searchMedicalInfo(topic, "general");

      res.json({
        success: true,
        topic: topic,
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Quick facts error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get quick facts",
        error: error.message
      });
    }
  }
);

// Debug endpoint to check Gemini configuration
router.get(
  "/debug/models",
  auth,
  authorize(["doctor", "patient"]),
  async (req, res) => {
    try {
      if (!geminiService) {
        return res.status(503).json({
          success: false,
          message: "AI chatbot service is not available",
          configured: false,
          development: true
        });
      }

      const models = await geminiService.listAvailableModels();

      res.json({
        success: true,
        configured: geminiService.isConfigured,
        development: geminiService.isDevelopment,
        models: models,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Debug models error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get model information",
        error: error.message
      });
    }
  }
);

module.exports = router;
