import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Camera,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";
import { uploadsAPI } from "../utils/api";
import { toast } from "react-hot-toast";

const PrescriptionOCR = ({ onTextExtracted, onClose }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [manualText, setManualText] = useState("");
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const uploadImageToGCS = async (imageFile) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("folder", "prescriptions");
      formData.append("description", "Prescription image for OCR processing");

      const response = await uploadsAPI.uploadSingle(formData);

      setUploadedFile(response.data.file);
      toast.success("Image uploaded successfully!");
      return response.data.file;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to upload image";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const processImage = async (imageFile) => {
    setError("");

    try {
      // Upload the image to GCS
      const uploadedFileData = await uploadImageToGCS(imageFile);

      // Call the callback with just the file data (no OCR text)
      onTextExtracted("", uploadedFileData);
    } catch (err) {
      // Upload error already handled in uploadImageToGCS
      console.error("Upload Error:", err);
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

  const handleManualSubmit = () => {
    if (manualText.trim()) {
      onTextExtracted(manualText.trim(), null);
      setManualText("");
    } else {
      setError("Please enter prescription text.");
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
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
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
          {/* Manual Text Input */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Enter prescription details manually or upload an image for
                reference
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Prescription Text
              </label>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Enter prescription details, medications, dosages, instructions, etc..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={6}
              />
              <button
                onClick={handleManualSubmit}
                className="w-full btn-primary"
                disabled={!manualText.trim()}
              >
                Add Prescription
              </button>
            </div>
          </div>

          {/* Upload Options */}
          {!showCamera && !isUploading && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Or upload a prescription image for reference
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
                  <span className="text-xs text-gray-500 mt-1">Use camera</span>
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
                <button onClick={captureImage} className="btn-primary">
                  Capture
                </button>
                <button onClick={stopCamera} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload State */}
          {isUploading && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-yellow-600 animate-spin mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Uploading image...
                </p>
                <p className="text-sm text-gray-600">Saving to cloud storage</p>
              </div>
            </div>
          )}

          {/* Upload Success */}
          {uploadedFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Image uploaded successfully!
                </span>
              </div>
              <p className="text-green-700 text-sm">
                File: {uploadedFile.originalName} (
                {Math.round(uploadedFile.size / 1024)} KB)
              </p>
              <p className="text-green-600 text-xs mt-1">
                Image saved for reference. Please enter prescription details
                manually above.
              </p>
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
        </div>
      </div>
    </div>
  );
};

export default PrescriptionOCR;
