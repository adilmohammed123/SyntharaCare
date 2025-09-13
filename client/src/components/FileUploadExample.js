import React, { useState } from "react";
import FileUpload from "./FileUpload";
import FileViewer from "./FileViewer";

const FileUploadExample = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleUploadSuccess = (data) => {
    console.log("Upload successful:", data);

    // Add uploaded files to the list
    if (data.successful) {
      setUploadedFiles((prev) => [...prev, ...data.successful]);
    } else if (data.file) {
      setUploadedFiles((prev) => [...prev, data.file]);
    }
  };

  const handleUploadError = (error) => {
    console.error("Upload failed:", error);
  };

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          File Upload Examples
        </h1>
        <p className="text-gray-600">
          Examples of using the FileUpload and FileViewer components with Google
          Cloud Storage
        </p>
      </div>

      {/* Single File Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Single File Upload
        </h2>
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          multiple={false}
          folder="examples"
          description="Example single file upload"
        />
      </div>

      {/* Multiple File Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Multiple File Upload
        </h2>
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          multiple={true}
          maxFiles={5}
          folder="examples"
          description="Example multiple file upload"
        />
      </div>

      {/* Health History Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Health History Upload
        </h2>
        <FileUpload
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          multiple={false}
          folder="health-history"
          description="Medical document upload"
        />
      </div>

      {/* Uploaded Files Display */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Uploaded Files ({uploadedFiles.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative">
                <FileViewer
                  file={file}
                  showPreview={true}
                  showDownload={true}
                  showExternalLink={true}
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Remove file"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          How to Use These Components
        </h3>
        <div className="text-blue-800 space-y-2">
          <p>
            <strong>FileUpload Component:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Supports both single and multiple file uploads</li>
            <li>Drag and drop functionality</li>
            <li>File type and size validation</li>
            <li>Progress indicators and error handling</li>
            <li>Configurable folder structure in GCS</li>
          </ul>

          <p className="mt-4">
            <strong>FileViewer Component:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Preview images and PDFs</li>
            <li>Download functionality</li>
            <li>External link opening</li>
            <li>File metadata display</li>
            <li>Modal preview for better viewing</li>
          </ul>

          <p className="mt-4">
            <strong>Integration:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Works with Google Cloud Storage</li>
            <li>Automatic file organization by folder</li>
            <li>Public URLs for direct access</li>
            <li>Signed URLs for private files</li>
            <li>Error handling and user feedback</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUploadExample;
