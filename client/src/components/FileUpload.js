import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadsAPI } from "../utils/api";
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

const FileUpload = ({
  onUploadSuccess,
  onUploadError,
  multiple = false,
  folder = "general",
  description = "",
  maxFiles = 10,
  className = "",
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const uploadMutation = useMutation({
    mutationFn: (formData) => {
      if (multiple) {
        return uploadsAPI.uploadMultiple(formData);
      } else {
        return uploadsAPI.uploadSingle(formData);
      }
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setSelectedFiles([]);
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || "Upload failed";
      toast.error(errorMessage);
      if (onUploadError) {
        onUploadError(error);
      }
    }
  });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (files.length === 0) return;

    // Validate file count
    if (!multiple && files.length > 1) {
      toast.error("Please select only one file");
      return;
    }

    if (files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file types and sizes
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name}: Invalid file type`);
      } else if (file.size > maxSize) {
        invalidFiles.push(`${file.name}: File too large (max 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files: ${invalidFiles.join(", ")}`);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    const formData = new FormData();

    if (multiple) {
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });
    } else {
      formData.append("file", selectedFiles[0]);
    }

    formData.append("folder", folder);
    formData.append("description", description);

    uploadMutation.mutate(formData);
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/")) {
      return <Image className="w-5 h-5 text-blue-500" />;
    } else if (file.type === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center space-y-2">
          <Upload
            className={`w-8 h-8 ${
              dragActive ? "text-blue-500" : "text-gray-400"
            }`}
          />
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Click to upload
            </span>{" "}
            or drag and drop
          </div>
          <div className="text-xs text-gray-500">
            {multiple ? `Up to ${maxFiles} files` : "Single file"} • Max 10MB
            each
          </div>
          <div className="text-xs text-gray-400">
            PDF, DOC, DOCX, TXT, JPG, PNG, GIF
          </div>
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Selected Files ({selectedFiles.length})
          </div>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file)}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                disabled={uploadMutation.isPending}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>
                  Upload {selectedFiles.length} file
                  {selectedFiles.length > 1 ? "s" : ""}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload Status */}
      {uploadMutation.isSuccess && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-700">
            {uploadMutation.data.message}
          </span>
        </div>
      )}

      {uploadMutation.isError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700">
            {uploadMutation.error?.response?.data?.message || "Upload failed"}
          </span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
