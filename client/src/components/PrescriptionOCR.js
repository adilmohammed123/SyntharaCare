import React, { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { Upload, FileText, Camera, Loader2, CheckCircle, XCircle } from "lucide-react";

const PrescriptionOCR = ({ onTextExtracted, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const processImage = async (imageFile) => {
    setIsProcessing(true);
    setProgress(0);
    setError("");
    setExtractedText("");

    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const { data: { text } } = await worker.recognize(imageFile);
      
      setExtractedText(text);
      onTextExtracted(text);
      await worker.terminate();
    } catch (err) {
      setError("Failed to process image. Please try again.");
      console.error("OCR Error:", err);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        processImage(file);
      } else {
        setError("Please select a valid image file.");
      }
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (err) {
      setError("Camera access denied. Please upload an image instead.");
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "prescription.jpg", { type: "image/jpeg" });
      processImage(file);
      stopCamera();
    }, "image/jpeg");
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Prescription OCR Scanner
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Options */}
          {!showCamera && !isProcessing && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Upload a prescription image or take a photo to extract text
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* File Upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Upload className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Upload Image
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    JPG, PNG, or PDF
                  </span>
                </button>

                {/* Camera Capture */}
                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <Camera className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Take Photo
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    Use camera
                  </span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Camera View */}
          {showCamera && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={captureImage}
                  className="btn-primary"
                >
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Processing prescription...
                </p>
                <p className="text-sm text-gray-600">
                  Extracting text from image
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{progress}% complete</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Extracted Text */}
          {extractedText && !isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Extracted Text
                </h3>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {extractedText}
                </pre>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setExtractedText("")}
                  className="btn-secondary"
                >
                  Clear
                </button>
                <button
                  onClick={handleClose}
                  className="btn-primary"
                >
                  Use This Text
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionOCR;
