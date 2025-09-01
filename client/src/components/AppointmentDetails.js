import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

function AppointmentDetails({ appointment, isOpen, onClose, onStatusChange }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation(
    (data) => appointmentsAPI.updateStatus(data.id, data.status),
    {
      onSuccess: () => {
        toast.success("Appointment status updated!");
        queryClient.invalidateQueries("appointments");
        onStatusChange && onStatusChange();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to update status");
      }
    }
  );

  const updateSessionPhaseMutation = useMutation(
    (data) => appointmentsAPI.updateSessionPhase(data.id, data.sessionPhase),
    {
      onSuccess: () => {
        toast.success("Session phase updated!");
        queryClient.invalidateQueries("appointments");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update session phase"
        );
      }
    }
  );

  const cancelAppointmentMutation = useMutation(
    (id) => appointmentsAPI.cancel(id),
    {
      onSuccess: () => {
        toast.success("Appointment cancelled!");
        queryClient.invalidateQueries("appointments");
        onClose();
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to cancel appointment"
        );
      }
    }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "in-progress":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getSessionPhaseColor = (phase) => {
    switch (phase) {
      case "waiting":
        return "bg-gray-100 text-gray-800";
      case "data-collection":
        return "bg-blue-100 text-blue-800";
      case "initial-assessment":
        return "bg-purple-100 text-purple-800";
      case "examination":
        return "bg-indigo-100 text-indigo-800";
      case "diagnosis":
        return "bg-orange-100 text-orange-800";
      case "treatment":
        return "bg-green-100 text-green-800";
      case "surgery":
        return "bg-red-100 text-red-800";
      case "recovery":
        return "bg-yellow-100 text-yellow-800";
      case "follow-up":
        return "bg-teal-100 text-teal-800";
      case "discharge":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSessionPhaseDisplay = (phase) => {
    const phaseMap = {
      waiting: "Waiting",
      "data-collection": "Data Collection",
      "initial-assessment": "Initial Assessment",
      examination: "Examination",
      diagnosis: "Diagnosis",
      treatment: "Treatment",
      surgery: "Surgery",
      recovery: "Recovery",
      "follow-up": "Follow-up",
      discharge: "Discharge"
    };
    return phaseMap[phase] || phase;
  };

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate({ id: appointment._id, status: newStatus });
  };

  const handleSessionPhaseChange = (newPhase) => {
    updateSessionPhaseMutation.mutate({
      id: appointment._id,
      sessionPhase: newPhase
    });
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      cancelAppointmentMutation.mutate(appointment._id);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Appointment Details
            </h2>
            <p className="text-sm text-gray-500">
              #{appointment.queuePosition || "N/A"} - {appointment.type}
              {appointment.queuePosition &&
                ` (Queue Position: ${appointment.queuePosition})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  appointment.status
                )}`}
              >
                {getStatusIcon(appointment.status)}
                <span className="ml-2">{appointment.status}</span>
              </span>

              {user?.role === "doctor" && (
                <select
                  value={appointment.sessionPhase || "waiting"}
                  onChange={(e) => handleSessionPhaseChange(e.target.value)}
                  className="text-sm border rounded px-3 py-1"
                >
                  <option value="waiting">Waiting</option>
                  <option value="data-collection">Data Collection</option>
                  <option value="initial-assessment">Initial Assessment</option>
                  <option value="examination">Examination</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="treatment">Treatment</option>
                  <option value="surgery">Surgery</option>
                  <option value="recovery">Recovery</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="discharge">Discharge</option>
                </select>
              )}
            </div>

            <div className="flex space-x-2">
              {appointment.status === "scheduled" && (
                <>
                  <button
                    onClick={() => handleStatusChange("confirmed")}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </>
              )}
              {appointment.status === "confirmed" && (
                <button
                  onClick={() => handleStatusChange("in-progress")}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Start
                </button>
              )}
              {appointment.status === "in-progress" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Complete
                </button>
              )}
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              Patient Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {appointment.patientId?.profile?.firstName}{" "}
                    {appointment.patientId?.profile?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Patient</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-900">
                    {appointment.patientId?.email}
                  </p>
                  <p className="text-xs text-gray-500">Email</p>
                </div>
              </div>

              {appointment.patientId?.profile?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">
                      {appointment.patientId.profile.phone}
                    </p>
                    <p className="text-xs text-gray-500">Phone</p>
                  </div>
                </div>
              )}

              {appointment.patientId?.profile?.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-900">
                      {appointment.patientId.profile.address}
                    </p>
                    <p className="text-xs text-gray-500">Address</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              Appointment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(appointment.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">Date</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {appointment.time}
                  </p>
                  <p className="text-xs text-gray-500">Time</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {appointment.type}
                </span>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                </div>
              </div>

              {appointment.symptoms && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-900">
                    <strong>Symptoms:</strong> {appointment.symptoms}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Session Phase (for doctors) */}
          {user?.role === "doctor" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Session Phase</h3>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSessionPhaseColor(
                  appointment.sessionPhase
                )}`}
              >
                {getSessionPhaseDisplay(appointment.sessionPhase)}
              </span>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
              <p className="text-sm text-gray-700">{appointment.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetails;
