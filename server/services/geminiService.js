const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    // Check if we're in development mode and Gemini is not configured
    this.isDevelopment = process.env.NODE_ENV === "development";
    this.isConfigured = false;

    // Only initialize Gemini if API key is available
    if (process.env.GEMINI_API_KEY) {
      try {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
          model: "gemini-1.5-flash"
        });
        this.isConfigured = true;
      } catch (error) {
        if (this.isDevelopment) {
          console.warn(
            "Gemini AI not configured for development:",
            error.message
          );
          console.warn("AI chatbot will be disabled in development mode");
        } else {
          throw error;
        }
      }
    } else if (this.isDevelopment) {
      console.warn(
        "GEMINI_API_KEY not set. AI chatbot will be disabled in development mode"
      );
    } else {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
  }

  async generateResponse(prompt, context = {}) {
    // Check if Gemini is configured
    if (!this.isConfigured) {
      if (this.isDevelopment) {
        return "AI chatbot is not configured in development mode. Please set up GEMINI_API_KEY to enable AI features.";
      } else {
        throw new Error(
          "Gemini AI is not configured. Please set up GEMINI_API_KEY."
        );
      }
    }

    try {
      // Create a comprehensive medical context prompt
      const medicalContext = this.buildMedicalContext(context);
      const fullPrompt = `${medicalContext}\n\nUser Question: ${prompt}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);

      // Provide more specific error messages
      if (error.message.includes("404")) {
        throw new Error(
          "Gemini model not found. Please check the model name and API version."
        );
      } else if (
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        throw new Error(
          "Invalid Gemini API key. Please check your GEMINI_API_KEY."
        );
      } else if (error.message.includes("429")) {
        throw new Error(
          "Gemini API rate limit exceeded. Please try again later."
        );
      } else {
        throw new Error(`Failed to generate AI response: ${error.message}`);
      }
    }
  }

  buildMedicalContext(context) {
    const isDoctor = context.userRole === "doctor";

    const baseContext = isDoctor
      ? `You are a medical AI assistant designed to help doctors with medical information, treatments, and research. 
      
      Your role is to:
      1. Provide evidence-based medical information
      2. Suggest latest treatments and medications
      3. Help with differential diagnoses
      4. Provide drug interactions and contraindications
      5. Suggest diagnostic procedures
      6. Offer treatment protocols
      
      Important guidelines:
      - Always emphasize that your suggestions should be verified with current medical literature
      - Recommend consulting with specialists when appropriate
      - Provide evidence-based information when possible
      - Include dosage information when discussing medications
      - Mention potential side effects and contraindications
      - Suggest follow-up care and monitoring`
      : `You are a health AI assistant designed to help patients with general health information and education.
      
      Your role is to:
      1. Provide general health information and education
      2. Explain medical terms in simple language
      3. Offer general health tips and advice
      4. Help understand medications and their purposes
      5. Suggest when to consult healthcare providers
      6. Provide information about common health conditions
      
      Important guidelines:
      - Always emphasize that you provide general information only
      - Strongly recommend consulting healthcare providers for medical advice
      - Do not provide specific medical diagnoses or treatment recommendations
      - Use simple, easy-to-understand language
      - Encourage seeking professional medical care when appropriate
      - Focus on health education and general wellness`;

    let contextInfo = `Current context:`;

    if (context.patientAge) {
      contextInfo += `\n- Patient Age: ${context.patientAge}`;
    }
    if (context.patientGender) {
      contextInfo += `\n- Patient Gender: ${context.patientGender}`;
    }
    if (context.symptoms && context.symptoms.length > 0) {
      contextInfo += `\n- Symptoms: ${context.symptoms.join(", ")}`;
    }
    if (context.diagnosis) {
      contextInfo += `\n- Current Diagnosis: ${context.diagnosis}`;
    }
    if (context.medications && context.medications.length > 0) {
      contextInfo += `\n- Current Medications: ${context.medications.join(
        ", "
      )}`;
    }
    if (context.allergies && context.allergies.length > 0) {
      contextInfo += `\n- Known Allergies: ${context.allergies.join(", ")}`;
    }

    return baseContext + contextInfo;
  }

  async searchMedicalInfo(query, searchType = "general") {
    const searchPrompts = {
      treatments: `Search for the latest evidence-based treatments for: ${query}. Include:
      - First-line treatments
      - Alternative treatments
      - Latest research findings
      - Treatment protocols
      - Success rates and outcomes`,

      medications: `Search for information about medications related to: ${query}. Include:
      - Drug names and classifications
      - Dosage recommendations
      - Side effects and contraindications
      - Drug interactions
      - Latest FDA approvals or updates`,

      diagnosis: `Help with differential diagnosis for: ${query}. Include:
      - Possible conditions
      - Diagnostic criteria
      - Required tests and procedures
      - Red flags to watch for
      - When to refer to specialists`,

      procedures: `Search for medical procedures related to: ${query}. Include:
      - Procedure descriptions
      - Indications and contraindications
      - Preparation requirements
      - Potential complications
      - Recovery expectations`,

      general: `Provide comprehensive medical information about: ${query}. Include:
      - Overview and background
      - Latest research and developments
      - Clinical guidelines
      - Best practices
      - Resources for further reading`
    };

    const prompt = searchPrompts[searchType] || searchPrompts.general;
    return await this.generateResponse(prompt);
  }

  async getDrugInteractions(medications) {
    const prompt = `Analyze potential drug interactions between these medications: ${medications.join(
      ", "
    )}. 
    Include:
    - Major interactions and their clinical significance
    - Minor interactions to monitor
    - Contraindications
    - Recommended monitoring
    - Alternative medications if needed`;

    return await this.generateResponse(prompt);
  }

  async suggestDiagnosticTests(symptoms, suspectedConditions = []) {
    const prompt = `Based on these symptoms: ${symptoms.join(", ")} ${
      suspectedConditions.length > 0
        ? `and suspected conditions: ${suspectedConditions.join(", ")}`
        : ""
    }, 
    suggest appropriate diagnostic tests. Include:
    - Essential tests to confirm diagnosis
    - Additional tests for differential diagnosis
    - Test preparation requirements
    - Expected results and interpretation
    - Cost-effectiveness considerations`;

    return await this.generateResponse(prompt);
  }

  async getTreatmentProtocol(condition, severity = "moderate") {
    const prompt = `Provide a comprehensive treatment protocol for ${condition} with ${severity} severity. Include:
    - First-line treatment options
    - Dosage recommendations
    - Treatment duration
    - Monitoring requirements
    - When to escalate treatment
    - Patient education points
    - Follow-up schedule`;

    return await this.generateResponse(prompt);
  }

  // Debug method to list available models
  async listAvailableModels() {
    if (!this.isConfigured) {
      return "Gemini AI is not configured";
    }

    try {
      const models = await this.genAI.listModels();
      return models;
    } catch (error) {
      console.error("Error listing models:", error);
      return `Error listing models: ${error.message}`;
    }
  }
}

module.exports = new GeminiService();
