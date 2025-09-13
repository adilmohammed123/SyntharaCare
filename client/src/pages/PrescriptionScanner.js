import React, { useState } from "react";
import { Camera, FileText, Upload } from "lucide-react";
import PrescriptionOCR from "../components/PrescriptionOCR";

const PrescriptionScanner = () => {
  const [showOCR, setShowOCR] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleTextExtracted = (text, fileData = null) => {
    setExtractedText(text);
    if (fileData) {
      setUploadedFile(fileData);
    }
    setPrescriptionHistory((prev) => [
      {
        id: Date.now(),
        text: text,
        date: new Date().toLocaleString(),
        type: "OCR Scan",
        fileData: fileData
      },
      ...prev
    ]);
  };

  const handleManualEntry = () => {
    const text = prompt("Enter prescription text manually:");
    if (text) {
      setExtractedText(text);
      setPrescriptionHistory((prev) => [
        {
          id: Date.now(),
          text: text,
          date: new Date().toLocaleString(),
          type: "Manual Entry"
        },
        ...prev
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prescription Scanner
          </h1>
          <p className="text-gray-600">
            Upload prescription images or take photos to extract text using OCR
            technology
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* OCR Scanner */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Camera className="h-8 w-8 text-primary-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                OCR Scanner
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Use AI-powered OCR to extract text from prescription images
            </p>
            <button
              onClick={() => setShowOCR(true)}
              className="w-full btn-primary"
            >
              Scan Prescription
            </button>
          </div>

          {/* Manual Entry */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-primary-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Manual Entry
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Type prescription details manually
            </p>
            <button
              onClick={handleManualEntry}
              className="w-full btn-secondary"
            >
              Enter Manually
            </button>
          </div>

          {/* Upload Image */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <Upload className="h-8 w-8 text-primary-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Upload Image
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Upload a prescription image for reference
            </p>
            <button
              onClick={() => setShowOCR(true)}
              className="w-full btn-primary"
            >
              Upload Image
            </button>
          </div>
        </div>

        {/* Current Prescription */}
        {(extractedText || uploadedFile) && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Current Prescription
            </h3>

            {/* Prescription Text */}
            {extractedText && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Prescription Details:
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {extractedText}
                  </pre>
                </div>
              </div>
            )}

            {/* Uploaded File Info */}
            {uploadedFile && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  📁 Reference Image
                </h4>
                <div className="text-sm text-green-700">
                  <p>
                    <strong>File:</strong> {uploadedFile.originalName}
                  </p>
                  <p>
                    <strong>Size:</strong>{" "}
                    {Math.round(uploadedFile.size / 1024)} KB
                  </p>
                  <p>
                    <strong>Type:</strong> {uploadedFile.mimeType}
                  </p>
                  <p>
                    <strong>Uploaded:</strong>{" "}
                    {new Date(uploadedFile.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => {
                  setExtractedText("");
                  setUploadedFile(null);
                }}
                className="btn-secondary"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  // Here you could save to database or create a prescription record
                  alert("Prescription saved!");
                }}
                className="btn-primary"
              >
                Save Prescription
              </button>
            </div>
          </div>
        )}

        {/* Prescription History */}
        {prescriptionHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Scans
            </h3>
            <div className="space-y-4">
              {prescriptionHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-500">{item.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {item.text.substring(0, 200)}
                    {item.text.length > 200 && "..."}
                  </p>
                  <button
                    onClick={() => setExtractedText(item.text)}
                    className="text-xs text-primary-600 hover:text-primary-800 mt-2"
                  >
                    Load this text
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OCR Modal */}
        {showOCR && (
          <PrescriptionOCR
            onTextExtracted={handleTextExtracted}
            onClose={() => setShowOCR(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PrescriptionScanner;
