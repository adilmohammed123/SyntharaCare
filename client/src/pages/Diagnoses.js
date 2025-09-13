import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { diagnosesAPI, appointmentsAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  User,
  Mic,
  Play,
  Pause,
  Download,
  Edit,
  Eye,
  X
} from "lucide-react";

const Diagnoses = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  // Fetch diagnoses
  const {
    data: diagnosesData,
    isLoading: diagnosesLoading,
    error: diagnosesError
  } = useQuery({
    queryKey: ["diagnoses", searchTerm, filterSeverity],
    queryFn: () =>
      diagnosesAPI.getDiagnoses({
        search: searchTerm || undefined,
        severity: filterSeverity !== "all" ? filterSeverity : undefined
      }),
    refetchInterval: 60000,
    onError: (error) => {
      console.error("Failed to fetch diagnoses:", error);
    }
  });

  // Debug logging
  console.log("Diagnoses data:", diagnosesData);
  console.log("Diagnoses loading:", diagnosesLoading);
  console.log("Diagnoses error:", diagnosesError);

  // Fetch appointments for creating diagnoses
  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments-for-diagnosis"],
    queryFn: () => appointmentsAPI.getAll({ status: "completed" }),
    enabled: showCreateModal
  });

  // Mutations
  const createDiagnosisMutation = useMutation({
    mutationFn: (data) => diagnosesAPI.createDiagnosis(data),
    onSuccess: () => {
      toast.success("Diagnosis created successfully!");
      setShowCreateModal(false);
      reset();
      setAudioBlob(null);
      queryClient.invalidateQueries(["diagnoses"]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to create diagnosis"
      );
      queryClient.invalidateQueries(["diagnoses"]);
    }
  });

  const handleCreateDiagnosis = (data) => {
    console.log("Creating diagnosis with data:", data);
    console.log("Audio blob:", audioBlob);

    const formData = new FormData();

    // Add text data
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== "") {
        formData.append(key, data[key]);
        console.log(`Adding ${key}:`, data[key]);
      }
    });

    // Add audio file if recorded
    if (audioBlob) {
      formData.append("voiceRecording", audioBlob, "diagnosis-recording.webm");
      console.log("Added voice recording to form data");
    } else {
      console.log("No voice recording to add");
    }

    console.log("Submitting form data...");
    createDiagnosisMutation.mutate(formData);
  };

  const handleDetailsClick = (diagnosis) => {
    setSelectedDiagnosis(diagnosis);
    setShowDetailsModal(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      case "critical":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const startRecording = async () => {
    try {
      // Check if microphone is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("Microphone not supported in this browser");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Store mediaRecorder for stopping
      window.currentMediaRecorder = mediaRecorder;
      window.currentStream = stream;
    } catch (error) {
      console.error("Microphone access error:", error);
      if (error.name === "NotAllowedError") {
        toast.error(
          "Microphone access denied. Please allow microphone permissions."
        );
      } else if (error.name === "NotFoundError") {
        toast.error("No microphone found. Please connect a microphone.");
      } else {
        toast.error("Failed to access microphone: " + error.message);
        // Provide fallback - allow diagnosis creation without voice recording
        toast("You can still create the diagnosis without voice recording", {
          icon: "ℹ️",
          duration: 4000
        });
      }
    }
  };

  const stopRecording = () => {
    if (window.currentMediaRecorder) {
      window.currentMediaRecorder.stop();
      window.currentStream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const playRecording = (audioUrl) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Diagnoses</h1>
            <p className="text-gray-600 mt-2">
              View your medical diagnoses and treatment plans.
            </p>
          </div>
          {user?.role === "doctor" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Diagnosis</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search diagnoses by symptoms or diagnosis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diagnoses List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {diagnosesLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading diagnoses...</p>
          </div>
        ) : diagnosesData?.diagnoses?.length === 0 ? (
          <div className="p-6 text-center">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No diagnoses found</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {user?.role === "patient" ? "Doctor" : "Patient"}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symptoms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Diagnosis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {diagnosesData?.diagnoses?.map((diagnosis) => (
                    <tr key={diagnosis._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(diagnosis.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(diagnosis.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {user?.role === "patient"
                                ? `Dr. ${diagnosis.doctorId?.userId?.profile?.firstName} ${diagnosis.doctorId?.userId?.profile?.lastName}`
                                : `${diagnosis.patientId?.profile?.firstName} ${diagnosis.patientId?.profile?.lastName}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user?.role === "patient"
                                ? diagnosis.doctorId?.specialization
                                : diagnosis.patientId?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {diagnosis.symptoms}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {diagnosis.diagnosis}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                            diagnosis.severity
                          )}`}
                        >
                          {diagnosis.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDetailsClick(diagnosis)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {user?.role === "doctor" && (
                            <button
                              onClick={() => handleDetailsClick(diagnosis)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Diagnosis Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Create New Diagnosis
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(handleCreateDiagnosis)}
                className="space-y-4"
              >
                {/* Appointment Selection */}
                <div>
                  <label className="form-label">Select Appointment</label>
                  <select
                    {...register("appointmentId", {
                      required: "Appointment is required"
                    })}
                    className="input-field"
                  >
                    <option value="">Choose an appointment</option>
                    {appointmentsData?.appointments?.map((appointment) => (
                      <option key={appointment._id} value={appointment._id}>
                        {new Date(appointment.date).toLocaleDateString()} -{" "}
                        {appointment.time} -{" "}
                        {appointment.patientId?.profile?.firstName}{" "}
                        {appointment.patientId?.profile?.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.appointmentId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.appointmentId.message}
                    </p>
                  )}
                </div>

                {/* Symptoms */}
                <div>
                  <label className="form-label">Symptoms</label>
                  <textarea
                    {...register("symptoms", {
                      required: "Symptoms are required"
                    })}
                    rows={3}
                    className="input-field"
                    placeholder="Describe the patient's symptoms..."
                  />
                  {errors.symptoms && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.symptoms.message}
                    </p>
                  )}
                </div>

                {/* Diagnosis */}
                <div>
                  <label className="form-label">Diagnosis</label>
                  <textarea
                    {...register("diagnosis", {
                      required: "Diagnosis is required"
                    })}
                    rows={3}
                    className="input-field"
                    placeholder="Enter the diagnosis..."
                  />
                  {errors.diagnosis && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.diagnosis.message}
                    </p>
                  )}
                </div>

                {/* Treatment */}
                <div>
                  <label className="form-label">Treatment Plan</label>
                  <textarea
                    {...register("treatment")}
                    rows={3}
                    className="input-field"
                    placeholder="Describe the treatment plan..."
                  />
                </div>

                {/* Prescription */}
                <div>
                  <label className="form-label">Prescription</label>
                  <textarea
                    {...register("prescription")}
                    rows={3}
                    className="input-field"
                    placeholder="Enter prescription details..."
                  />
                </div>

                {/* Recommendations */}
                <div>
                  <label className="form-label">Recommendations</label>
                  <textarea
                    {...register("recommendations")}
                    rows={3}
                    className="input-field"
                    placeholder="Enter recommendations..."
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="form-label">Severity</label>
                  <select
                    {...register("severity", {
                      required: "Severity is required"
                    })}
                    className="input-field"
                  >
                    <option value="">Select severity</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  {errors.severity && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.severity.message}
                    </p>
                  )}
                </div>

                {/* Voice Recording */}
                <div>
                  <label className="form-label">
                    Voice Recording (Optional)
                  </label>
                  <p className="text-sm text-gray-500 mb-3">
                    You can record voice notes for the diagnosis. If microphone
                    access fails, you can skip this step.
                  </p>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        isRecording
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Pause className="h-4 w-4" />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          <span>Start Recording</span>
                        </>
                      )}
                    </button>
                    {audioBlob && (
                      <button
                        type="button"
                        onClick={() =>
                          playRecording(URL.createObjectURL(audioBlob))
                        }
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <Play className="h-4 w-4" />
                        <span>Play</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAudioBlob(null)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      <X className="h-4 w-4" />
                      <span>Clear</span>
                    </button>
                  </div>
                  {isRecording && (
                    <p className="mt-2 text-sm text-red-600">
                      Recording in progress...
                    </p>
                  )}
                  {audioBlob && (
                    <p className="mt-2 text-sm text-green-600">
                      Voice recording ready ✓
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createDiagnosisMutation.isLoading}
                    className="btn-primary"
                  >
                    {createDiagnosisMutation.isLoading
                      ? "Creating..."
                      : "Create Diagnosis"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Diagnosis Details Modal */}
      {showDetailsModal && selectedDiagnosis && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Diagnosis Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Date</h4>
                    <p className="text-gray-600">
                      {new Date(
                        selectedDiagnosis.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Severity</h4>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                        selectedDiagnosis.severity
                      )}`}
                    >
                      {selectedDiagnosis.severity}
                    </span>
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Symptoms</h4>
                  <p className="text-gray-600">{selectedDiagnosis.symptoms}</p>
                </div>

                {/* Diagnosis */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Diagnosis</h4>
                  <p className="text-gray-600">{selectedDiagnosis.diagnosis}</p>
                </div>

                {/* Treatment */}
                {selectedDiagnosis.treatment && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Treatment Plan
                    </h4>
                    <p className="text-gray-600">
                      {selectedDiagnosis.treatment}
                    </p>
                  </div>
                )}

                {/* Prescription */}
                {selectedDiagnosis.prescription && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Prescription
                    </h4>
                    {Array.isArray(selectedDiagnosis.prescription) ? (
                      <div className="space-y-3">
                        {selectedDiagnosis.prescription.map(
                          (medicine, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-lg"
                            >
                              <div className="font-medium text-gray-900">
                                {medicine.medicineName}
                              </div>
                              <div className="text-sm text-gray-600">
                                Dosage: {medicine.dosage} | Frequency:{" "}
                                {medicine.frequency}
                              </div>
                              {medicine.instructions && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Instructions: {medicine.instructions}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-600">
                        {selectedDiagnosis.prescription}
                      </p>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {selectedDiagnosis.recommendations && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Recommendations
                    </h4>
                    <p className="text-gray-600">
                      {selectedDiagnosis.recommendations}
                    </p>
                  </div>
                )}

                {/* Voice Recording */}
                {selectedDiagnosis.voiceRecording && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Voice Recording
                    </h4>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() =>
                          playRecording(selectedDiagnosis.voiceRecording)
                        }
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <Play className="h-4 w-4" />
                        <span>Play Recording</span>
                      </button>
                      <a
                        href={selectedDiagnosis.voiceRecording}
                        download="diagnosis-recording.webm"
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Follow-up Date */}
                {selectedDiagnosis.followUpDate && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Follow-up Date
                    </h4>
                    <p className="text-gray-600">
                      {new Date(
                        selectedDiagnosis.followUpDate
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Diagnoses;
