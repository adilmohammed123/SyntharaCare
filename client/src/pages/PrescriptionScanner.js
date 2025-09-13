import React, { useState, useEffect } from "react";
import { FileText, Upload, Calendar } from "lucide-react";
import PrescriptionOCR from "../components/PrescriptionOCR";
import { prescriptionsAPI, appointmentsAPI } from "../utils/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

const PrescriptionScanner = () => {
  const { user } = useAuth();
  const [showOCR, setShowOCR] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [prescriptionHistory, setPrescriptionHistory] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // New form states
  const [diagnosis, setDiagnosis] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch prescriptions from database - use appropriate endpoint based on user role
  const {
    data: prescriptionsData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["prescriptions", user?.role],
    queryFn: () => {
      if (user?.role === "doctor") {
        return prescriptionsAPI.getDoctorPrescriptions();
      } else {
        return prescriptionsAPI.getPatientPrescriptions();
      }
    },
    enabled: !!user, // Only run query when user is available
    onError: (error) => {
      console.error("Failed to fetch prescriptions:", error);
    }
  });

  // Fetch patient's appointments - first try completed, then all if none found
  const { data: appointmentsData } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      try {
        // Use the main appointments endpoint which handles different roles properly
        // First try to get completed appointments
        const completedAppointments = await appointmentsAPI.getAll({
          status: "completed"
        });
        if (completedAppointments?.appointments?.length > 0) {
          return completedAppointments;
        }
        // If no completed appointments, get all appointments to show what's available
        return await appointmentsAPI.getAll({});
      } catch (error) {
        console.error("Failed to fetch appointments:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Failed to fetch appointments:", error);
    }
  });

  // Update prescription history when data is fetched
  useEffect(() => {
    console.log("Prescription data received:", prescriptionsData);
    console.log("User role:", user?.role);
    if (prescriptionsData?.prescriptions) {
      const formattedPrescriptions = prescriptionsData.prescriptions.map(
        (prescription) => {
          // Handle different data structures for doctor vs patient views
          let doctorName = "Unknown Doctor";
          let patientName = "Unknown Patient";

          if (user?.role === "doctor") {
            // For doctor view, prescription has patientId populated
            patientName = prescription.patientId?.profile
              ? `${prescription.patientId.profile.firstName} ${prescription.patientId.profile.lastName}`
              : "Unknown Patient";
            // Doctor name is the current user
            doctorName = user.profile
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : "You";
          } else {
            // For patient view, prescription has doctorId populated
            doctorName = prescription.doctorId?.userId?.profile
              ? `${prescription.doctorId.userId.profile.firstName} ${prescription.doctorId.userId.profile.lastName}`
              : "Unknown Doctor";
            // Patient name is the current user
            patientName = user.profile
              ? `${user.profile.firstName} ${user.profile.lastName}`
              : "You";
          }

          return {
            id: prescription._id,
            text: prescription.originalText,
            date: new Date(prescription.prescriptionDate).toLocaleString(),
            type: "Saved Prescription",
            diagnosis: prescription.diagnosis,
            symptoms: prescription.symptoms,
            notes: prescription.notes,
            doctor: doctorName,
            patient: patientName,
            hospital: prescription.hospitalId?.name || "Unknown Hospital",
            imageUrl: prescription.imageUrl,
            appointment: prescription.appointmentId
              ? {
                  date: prescription.appointmentId.date,
                  time: prescription.appointmentId.time,
                  status: prescription.appointmentId.status,
                  sessionPhase: prescription.appointmentId.sessionPhase,
                  type: prescription.appointmentId.type
                }
              : null
          };
        }
      );
      setPrescriptionHistory(formattedPrescriptions);
    }
  }, [prescriptionsData, user]);

  const handleTextExtracted = (text, fileData = null) => {
    setExtractedText(text);
    if (fileData) {
      setUploadedFile(fileData);
    }
    // Close the OCR modal after text is extracted or file is uploaded
    setShowOCR(false);
  };

  const handleManualEntry = () => {
    const text = prompt("Enter prescription text manually:");
    if (text) {
      setExtractedText(text);
    }
  };

  // Save prescription mutation
  const savePrescriptionMutation = useMutation({
    mutationFn: (prescriptionData) => {
      return prescriptionsAPI.createPrescriptionForAppointment(
        selectedAppointment._id,
        prescriptionData
      );
    },
    onSuccess: (data) => {
      toast.success("Prescription saved successfully!");
      setExtractedText("");
      setUploadedFile(null);
      setDiagnosis("");
      setSymptoms("");
      setNotes("");
      setSelectedAppointment(null);
      // Refetch prescriptions to update the list
      refetch();
    },
    onError: (error) => {
      console.error("Prescription save error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save prescription";
      toast.error(errorMessage);
    }
  });

  const handleSavePrescription = () => {
    if (!extractedText.trim()) {
      toast.error("Please enter prescription details");
      return;
    }
    if (!diagnosis.trim()) {
      toast.error("Please enter a diagnosis");
      return;
    }
    if (!selectedAppointment) {
      toast.error("Please select an appointment");
      return;
    }
    if (selectedAppointment.status !== "completed") {
      toast.error(
        "Prescriptions can only be created for completed appointments"
      );
      return;
    }

    const prescriptionData = {
      originalText: extractedText,
      extractedMedicines: [], // Empty array for now, can be populated later
      diagnosis: diagnosis,
      symptoms: symptoms
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
      notes: notes,
      nextVisitDate: null, // Can be set later if needed
      scanMethod: "manual",
      imageUrl: uploadedFile?.publicUrl || null
    };

    savePrescriptionMutation.mutate(prescriptionData);
  };

  const handleLoadPrescription = (prescription) => {
    setExtractedText(prescription.text);
    setDiagnosis(prescription.diagnosis || "");
    setSymptoms(prescription.symptoms ? prescription.symptoms.join(", ") : "");
    setNotes(prescription.notes || "");
    if (prescription.imageUrl) {
      setUploadedFile({
        publicUrl: prescription.imageUrl,
        originalName: "Previous prescription image",
        size: 0,
        mimeType: "image/jpeg",
        uploadedAt: prescription.date
      });
    }
  };

  const formatAppointmentDate = (date, time) => {
    const appointmentDate = new Date(date);
    return `${appointmentDate.toLocaleDateString()} at ${time}`;
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
            Upload prescription images or enter prescription details manually
          </p>
        </div>

        {/* Appointment Selection */}
        {appointmentsData?.appointments &&
        appointmentsData.appointments.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Appointment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointmentsData.appointments.map((appointment) => (
                <div
                  key={appointment._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedAppointment?._id === appointment._id
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatAppointmentDate(
                        appointment.date,
                        appointment.time
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p>
                      <strong>Doctor:</strong>{" "}
                      {appointment.doctorId?.userId?.profile
                        ? `${appointment.doctorId.userId.profile.firstName} ${appointment.doctorId.userId.profile.lastName}`
                        : "Unknown"}
                    </p>
                    <p>
                      <strong>Hospital:</strong>{" "}
                      {appointment.hospitalId?.name || "Unknown"}
                    </p>
                    <p>
                      <strong>Type:</strong> {appointment.type}
                    </p>
                    <p>
                      <strong>Status:</strong> {appointment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {selectedAppointment && (
              <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-primary-800">
                  <strong>Selected:</strong>{" "}
                  {formatAppointmentDate(
                    selectedAppointment.date,
                    selectedAppointment.time
                  )}
                  with{" "}
                  {selectedAppointment.doctorId?.userId?.profile
                    ? `${selectedAppointment.doctorId.userId.profile.firstName} ${selectedAppointment.doctorId.userId.profile.lastName}`
                    : "Unknown Doctor"}
                </p>
                {selectedAppointment.status !== "completed" && (
                  <p className="text-sm text-orange-600 mt-2">
                    ⚠️ This appointment is not completed yet. Prescriptions can
                    only be created for completed appointments.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              No Appointments Available
            </h3>
            <p className="text-gray-600">
              You need to have completed appointments to create prescriptions.
              Please complete an appointment first, then return here to add
              prescription details.
            </p>
          </div>
        )}

        {/* Action Cards */}
        {appointmentsData?.appointments &&
          appointmentsData.appointments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
          )}

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
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  📁 Reference Image
                </h4>
                <div className="text-sm text-green-700 mb-3">
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
                {/* Image Preview */}
                {uploadedFile.publicUrl && (
                  <div className="mt-3">
                    <img
                      src={uploadedFile.publicUrl}
                      alt="Prescription"
                      className="max-w-full h-auto max-h-64 rounded-lg border border-gray-200 shadow-sm"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                    <div className="hidden text-sm text-gray-500 mt-2">
                      Image failed to load. You can access it directly:
                      <a
                        href={uploadedFile.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        View Image
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prescription Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diagnosis *
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Enter diagnosis"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symptoms
                </label>
                <input
                  type="text"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Enter symptoms (comma separated)"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter any additional notes"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setExtractedText("");
                  setUploadedFile(null);
                  setDiagnosis("");
                  setSymptoms("");
                  setNotes("");
                }}
                className="btn-secondary"
              >
                Clear
              </button>

              <button
                onClick={handleSavePrescription}
                disabled={
                  savePrescriptionMutation.isPending ||
                  !extractedText.trim() ||
                  !diagnosis.trim() ||
                  !selectedAppointment ||
                  selectedAppointment?.status !== "completed"
                }
                className="btn-primary"
              >
                {savePrescriptionMutation.isPending
                  ? "Saving..."
                  : selectedAppointment?.status !== "completed"
                  ? "Select Completed Appointment"
                  : "Save Prescription"}
              </button>
            </div>
          </div>
        )}

        {/* Prescription History */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading prescriptions...</p>
            </div>
          </div>
        ) : prescriptionHistory.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Saved Prescriptions ({prescriptionHistory.length})
            </h3>
            <div className="space-y-4">
              {prescriptionHistory.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.type}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {user?.role === "doctor" ? (
                          <>
                            <p>
                              <strong>Patient:</strong> {item.patient}
                            </p>
                            <p>
                              <strong>Doctor:</strong> {item.doctor}
                            </p>
                          </>
                        ) : (
                          <p>
                            <strong>Doctor:</strong> {item.doctor}
                          </p>
                        )}
                        <p>
                          <strong>Hospital:</strong> {item.hospital}
                        </p>
                        <p>
                          <strong>Diagnosis:</strong> {item.diagnosis}
                        </p>
                        {item.appointment && (
                          <p>
                            <strong>Appointment:</strong>{" "}
                            {formatAppointmentDate(
                              item.appointment.date,
                              item.appointment.time
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{item.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-3 mb-2">
                    {item.text.substring(0, 200)}
                    {item.text.length > 200 && "..."}
                  </p>
                  {item.symptoms && item.symptoms.length > 0 && (
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>Symptoms:</strong> {item.symptoms.join(", ")}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-gray-600 mb-2">
                      <strong>Notes:</strong> {item.notes}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleLoadPrescription(item)}
                      className="text-xs text-primary-600 hover:text-primary-800"
                    >
                      Load this prescription
                    </button>
                    {item.imageUrl && (
                      <a
                        href={item.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        View Image
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-center text-gray-500">
              <p>No saved prescriptions found.</p>
              <p className="text-sm mt-1">
                Create your first prescription above!
              </p>
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
