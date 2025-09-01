import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthHistoryAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Upload,
  FileText,
  Image,
  File,
  Calendar,
  User,
  Building2,
  Tag,
  Eye,
  Download,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Share2
} from "lucide-react";

const HealthHistoryManager = ({
  onSelectDocuments,
  selectedDocuments = []
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Fetch health history
  const { data: healthHistoryData, isLoading } = useQuery(
    ["health-history", searchTerm, selectedCategory],
    () =>
      healthHistoryAPI.getAll({
        search: searchTerm,
        category: selectedCategory
      }),
    {
      enabled: user?.role === "patient"
    }
  );

  // Upload mutation
  const uploadMutation = useMutation(
    (formData) => healthHistoryAPI.upload(formData),
    {
      onSuccess: () => {
        toast.success("Health history uploaded successfully!");
        queryClient.invalidateQueries("health-history");
        setShowUploadModal(false);
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to upload health history"
        );
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation((id) => healthHistoryAPI.delete(id), {
    onSuccess: () => {
      toast.success("Health history deleted successfully!");
      queryClient.invalidateQueries("health-history");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to delete health history"
      );
    }
  });

  const handleUpload = (formData) => {
    uploadMutation.mutate(formData);
  };

  const handleDelete = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this health history document?"
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectDocument = (document) => {
    if (onSelectDocuments) {
      const isSelected = selectedDocuments.some(
        (doc) => doc._id === document._id
      );
      if (isSelected) {
        onSelectDocuments(
          selectedDocuments.filter((doc) => doc._id !== document._id)
        );
      } else {
        onSelectDocuments([...selectedDocuments, document]);
      }
    }
  };

  const getFileIcon = (documentType) => {
    switch (documentType) {
      case "pdf":
        return <FileText className="h-6 w-6 text-red-500" />;
      case "image":
        return <Image className="h-6 w-6 text-blue-500" />;
      case "text":
        return <FileText className="h-6 w-6 text-green-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  const categories = [
    { value: "", label: "All Categories" },
    { value: "lab_report", label: "Lab Report" },
    { value: "imaging", label: "Imaging" },
    { value: "prescription", label: "Prescription" },
    { value: "medical_record", label: "Medical Record" },
    { value: "vaccination_record", label: "Vaccination Record" },
    { value: "allergy_test", label: "Allergy Test" },
    { value: "surgery_record", label: "Surgery Record" },
    { value: "discharge_summary", label: "Discharge Summary" },
    { value: "consultation_note", label: "Consultation Note" },
    { value: "other", label: "Other" }
  ];

  if (user?.role !== "patient") {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          Health history management is only available for patients.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health History</h2>
          <p className="text-gray-600">
            Manage your medical records and documents
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search health history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="input-field"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Health History List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading health history...</p>
        </div>
      ) : healthHistoryData?.healthHistory?.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No health history documents
          </h3>
          <p className="text-gray-600">
            Upload your first medical document to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {healthHistoryData?.healthHistory?.map((document) => (
            <div
              key={document._id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedDocuments.some((doc) => doc._id === document._id)
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleSelectDocument(document)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getFileIcon(document.documentType)}
                  <div>
                    <h3 className="font-medium text-gray-900 truncate">
                      {document.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {document.getCategoryDisplay()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDocument(document);
                      setShowViewModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(document._id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(document.dateOfRecord).toLocaleDateString()}
                  </span>
                </div>

                {document.doctorName && (
                  <div className="flex items-center space-x-2">
                    <User className="h-3 w-3" />
                    <span>{document.doctorName}</span>
                  </div>
                )}

                {document.hospitalName && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-3 w-3" />
                    <span>{document.hospitalName}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <File className="h-3 w-3" />
                  <span>{document.fileSizeMB} MB</span>
                </div>
              </div>

              {document.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {document.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{document.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          isLoading={uploadMutation.isLoading}
        />
      )}

      {/* View Modal */}
      {showViewModal && selectedDocument && (
        <ViewModal
          document={selectedDocument}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};

// Upload Modal Component
const UploadModal = ({ onClose, onUpload, isLoading }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    dateOfRecord: "",
    doctorName: "",
    hospitalName: "",
    tags: "",
    isPrivate: false
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    const data = new FormData();
    data.append("file", selectedFile);
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("category", formData.category);
    data.append("dateOfRecord", formData.dateOfRecord);
    data.append("doctorName", formData.doctorName);
    data.append("hospitalName", formData.hospitalName);
    data.append(
      "tags",
      JSON.stringify(
        formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)
      )
    );
    data.append("isPrivate", formData.isPrivate);

    onUpload(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Upload Health History</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">File</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.txt,.doc,.docx"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="form-label">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="form-label">Category</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="input-field"
              required
            >
              <option value="">Select category</option>
              <option value="lab_report">Lab Report</option>
              <option value="imaging">Imaging</option>
              <option value="prescription">Prescription</option>
              <option value="medical_record">Medical Record</option>
              <option value="vaccination_record">Vaccination Record</option>
              <option value="allergy_test">Allergy Test</option>
              <option value="surgery_record">Surgery Record</option>
              <option value="discharge_summary">Discharge Summary</option>
              <option value="consultation_note">Consultation Note</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="form-label">Date of Record</label>
            <input
              type="date"
              value={formData.dateOfRecord}
              onChange={(e) =>
                setFormData({ ...formData, dateOfRecord: e.target.value })
              }
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field"
              rows="3"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Doctor Name</label>
              <input
                type="text"
                value={formData.doctorName}
                onChange={(e) =>
                  setFormData({ ...formData, doctorName: e.target.value })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="form-label">Hospital Name</label>
              <input
                type="text"
                value={formData.hospitalName}
                onChange={(e) =>
                  setFormData({ ...formData, hospitalName: e.target.value })
                }
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="input-field"
              placeholder="diabetes, blood test, 2023"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) =>
                setFormData({ ...formData, isPrivate: e.target.checked })
              }
              className="mr-2"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-600">
              Mark as private
            </label>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Modal Component
const ViewModal = ({ document, onClose }) => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = document.fileUrl;
    link.download = document.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{document.title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            {document.documentType === "pdf" ? (
              <FileText className="h-8 w-8 text-red-500" />
            ) : document.documentType === "image" ? (
              <Image className="h-8 w-8 text-blue-500" />
            ) : (
              <File className="h-8 w-8 text-gray-500" />
            )}
            <div>
              <p className="font-medium">{document.fileName}</p>
              <p className="text-sm text-gray-500">{document.fileSizeMB} MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Category:</span>
              <p>{document.getCategoryDisplay()}</p>
            </div>
            <div>
              <span className="font-medium">Date of Record:</span>
              <p>{new Date(document.dateOfRecord).toLocaleDateString()}</p>
            </div>
            {document.doctorName && (
              <div>
                <span className="font-medium">Doctor:</span>
                <p>{document.doctorName}</p>
              </div>
            )}
            {document.hospitalName && (
              <div>
                <span className="font-medium">Hospital:</span>
                <p>{document.hospitalName}</p>
              </div>
            )}
          </div>

          {document.description && (
            <div>
              <span className="font-medium">Description:</span>
              <p className="text-sm text-gray-600 mt-1">
                {document.description}
              </p>
            </div>
          )}

          {document.tags?.length > 0 && (
            <div>
              <span className="font-medium">Tags:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {document.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleDownload}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthHistoryManager;
