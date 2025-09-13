import React, { useState } from "react";
import {
  Eye,
  Download,
  ExternalLink,
  File,
  Image,
  FileText,
  X
} from "lucide-react";

const FileViewer = ({
  file,
  showPreview = true,
  showDownload = true,
  showExternalLink = true,
  className = ""
}) => {
  const [showModal, setShowModal] = useState(false);

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith("image/")) {
      return <Image className="w-6 h-6 text-blue-500" />;
    } else if (mimeType === "application/pdf") {
      return <FileText className="w-6 h-6 text-red-500" />;
    } else {
      return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const getFileType = (mimeType) => {
    if (mimeType?.startsWith("image/")) return "Image";
    if (mimeType === "application/pdf") return "PDF";
    if (mimeType === "text/plain") return "Text";
    if (mimeType?.includes("word")) return "Word Document";
    return "Document";
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDownload = () => {
    if (file.publicUrl) {
      const link = document.createElement("a");
      link.href = file.publicUrl;
      link.download = file.fileName || file.originalName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExternalLink = () => {
    if (file.publicUrl) {
      window.open(file.publicUrl, "_blank");
    }
  };

  const handlePreview = () => {
    setShowModal(true);
  };

  const renderPreview = () => {
    if (!file.publicUrl) return null;

    if (file.mimeType?.startsWith("image/")) {
      return (
        <img
          src={file.publicUrl}
          alt={file.fileName || file.originalName}
          className="max-w-full max-h-96 object-contain rounded-lg"
        />
      );
    } else if (file.mimeType === "application/pdf") {
      return (
        <iframe
          src={file.publicUrl}
          className="w-full h-96 rounded-lg border"
          title={file.fileName || file.originalName}
        />
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg">
          {getFileIcon(file.mimeType)}
          <p className="mt-2 text-gray-600">
            Preview not available for this file type
          </p>
          <button
            onClick={handleExternalLink}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Open in New Tab
          </button>
        </div>
      );
    }
  };

  return (
    <>
      <div
        className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-start space-x-3">
          {getFileIcon(file.mimeType)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {file.fileName || file.originalName || "Unknown file"}
              </h4>
              <div className="flex items-center space-x-1 ml-2">
                {showPreview && (
                  <button
                    onClick={handlePreview}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {showDownload && (
                  <button
                    onClick={handleDownload}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                {showExternalLink && (
                  <button
                    onClick={handleExternalLink}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {getFileType(file.mimeType)} • {formatFileSize(file.fileSize)}
            </div>
            {file.uploadedAt && (
              <div className="mt-1 text-xs text-gray-400">
                Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {file.fileName || file.originalName}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">{renderPreview()}</div>
            <div className="flex items-center justify-end space-x-2 p-4 border-t">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={handleExternalLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in New Tab</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileViewer;
