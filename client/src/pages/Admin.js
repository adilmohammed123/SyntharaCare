import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "../utils/api";
import toast from "react-hot-toast";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Ban,
  RotateCcw
} from "lucide-react";
import DoctorSuspensionModal from "../components/DoctorSuspensionModal";

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);

  // Queries
  const { data: pendingUsers } = useQuery({
    queryKey: ["pendingUsers"],
    queryFn: () => adminAPI.getPendingUsers(),
    enabled: user?.role === "admin"
  });

  const { data: hospitalDoctors } = useQuery({
    queryKey: ["hospitalDoctors"],
    queryFn: () => adminAPI.getHospitalDoctors(),
    enabled: user?.role === "organization_admin"
  });

  const { data: suspendedDoctors } = useQuery({
    queryKey: ["suspendedDoctors"],
    queryFn: () => adminAPI.getSuspendedDoctors(),
    enabled: user?.role === "organization_admin"
  });

  // Mutations
  const approveUserMutation = useMutation({
    mutationFn: (userId) => adminAPI.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingUsers"]);
      toast.success("User approved successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to approve user");
    }
  });

  const rejectUserMutation = useMutation({
    mutationFn: (userId) => adminAPI.rejectUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingUsers"]);
      toast.success("User rejected successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to reject user");
    }
  });

  const suspendDoctorMutation = useMutation({
    mutationFn: ({ doctorId, suspensionData }) =>
      adminAPI.suspendDoctor(doctorId, suspensionData),
    onSuccess: () => {
      queryClient.invalidateQueries(["hospitalDoctors"]);
      queryClient.invalidateQueries(["suspendedDoctors"]);
      toast.success("Doctor suspended successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to suspend doctor");
    }
  });

  const unsuspendDoctorMutation = useMutation({
    mutationFn: (doctorId) => adminAPI.unsuspendDoctor(doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries(["hospitalDoctors"]);
      queryClient.invalidateQueries(["suspendedDoctors"]);
      toast.success("Doctor unsuspended successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to unsuspend doctor"
      );
    }
  });

  const handleSuspendDoctor = async (doctorId, suspensionData) => {
    await suspendDoctorMutation.mutateAsync({ doctorId, suspensionData });
  };

  const handleUnsuspendDoctor = async (doctorId) => {
    await unsuspendDoctorMutation.mutateAsync(doctorId);
  };

  const openSuspensionModal = (doctor) => {
    setSelectedDoctor(doctor);
    setShowSuspensionModal(true);
  };

  const closeSuspensionModal = () => {
    setShowSuspensionModal(false);
    setSelectedDoctor(null);
  };

  if (!user || (user.role !== "admin" && user.role !== "organization_admin")) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          {user.role === "admin" && (
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Approvals
            </button>
          )}
          {user.role === "organization_admin" && (
            <>
              <button
                onClick={() => setActiveTab("doctors")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "doctors"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Manage Doctors
              </button>
              <button
                onClick={() => setActiveTab("suspended")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "suspended"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Suspended Doctors
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {user.role === "admin" && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Users
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {pendingUsers?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
          {user.role === "organization_admin" && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Doctors
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {hospitalDoctors?.doctors?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Doctors
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(hospitalDoctors?.doctors?.length || 0) -
                        (suspendedDoctors?.count || 0)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <UserX className="h-8 w-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Suspended Doctors
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {suspendedDoctors?.count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "pending" && user.role === "admin" && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Pending User Approvals
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingUsers?.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveUserMutation.mutate(user._id)}
                          disabled={approveUserMutation.isLoading}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => rejectUserMutation.mutate(user._id)}
                          disabled={rejectUserMutation.isLoading}
                          className="text-red-600 hover:text-red-900"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "doctors" && user.role === "organization_admin" && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Hospital Doctors
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {hospitalDoctors?.doctors?.map((doctor) => (
                  <tr key={doctor._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.user?.profile?.firstName}{" "}
                        {doctor.user?.profile?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doctor.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.specialization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.licenseNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doctor.user?.accountStatus === "suspended"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {doctor.user?.accountStatus === "suspended"
                          ? "Suspended"
                          : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openSuspensionModal(doctor)}
                          className="text-red-600 hover:text-red-900"
                          title="Suspend Doctor"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "suspended" && user.role === "organization_admin" && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Suspended Doctors
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suspension Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suspended Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suspendedDoctors?.suspendedDoctors?.map((doctor) => (
                  <tr key={doctor._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doctor.user?.profile?.firstName}{" "}
                        {doctor.user?.profile?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doctor.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.specialization}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.user?.suspensionDetails?.suspensionReason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.user?.suspensionDetails?.suspensionExpiry
                        ? new Date(
                            doctor.user.suspensionDetails.suspensionExpiry
                          ).toLocaleDateString()
                        : "Indefinite"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUnsuspendDoctor(doctor._id)}
                          disabled={unsuspendDoctorMutation.isLoading}
                          className="text-green-600 hover:text-green-900"
                          title="Unsuspend Doctor"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      <DoctorSuspensionModal
        isOpen={showSuspensionModal}
        onClose={closeSuspensionModal}
        doctor={selectedDoctor}
        onSuspend={handleSuspendDoctor}
        isSuspending={suspendDoctorMutation.isLoading}
      />
    </div>
  );
};

export default Admin;
