import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { adminAPI, hospitalsAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Users,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Activity,
  Calendar
} from "lucide-react";

const Admin = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Check if user is hospital admin
  const isHospitalAdmin = user?.role === "organization_admin";

  // Fetch admin dashboard stats
  const { data: dashboardData } = useQuery(
    ["admin-dashboard"],
    () =>
      isHospitalAdmin
        ? adminAPI.getHospitalDashboard()
        : adminAPI.getDashboard(),
    {
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  // Fetch pending users
  const { data: pendingUsers, isLoading: usersLoading } = useQuery(
    ["pending-users"],
    () => adminAPI.getPendingUsers(),
    {
      refetchInterval: 30000
    }
  );

  // Fetch pending hospitals
  const { data: pendingHospitals, isLoading: hospitalsLoading } = useQuery(
    ["pending-hospitals"],
    () => hospitalsAPI.getPendingApprovals(),
    {
      refetchInterval: 30000
    }
  );

  // Fetch pending doctors
  const { data: pendingDoctors, isLoading: doctorsLoading } = useQuery(
    ["pending-doctors"],
    () =>
      isHospitalAdmin
        ? adminAPI.getHospitalPendingDoctors()
        : adminAPI.getPendingDoctors(),
    {
      refetchInterval: 30000
    }
  );

  // Approve user mutation
  const approveUserMutation = useMutation(
    ({ userId, approvalStatus, approvalNotes }) =>
      adminAPI.approveUser(userId, { approvalStatus, approvalNotes }),
    {
      onSuccess: () => {
        toast.success("User approval updated successfully");
        queryClient.invalidateQueries("pending-users");
        queryClient.invalidateQueries("admin-dashboard");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update user approval"
        );
      }
    }
  );

  // Approve hospital mutation
  const approveHospitalMutation = useMutation(
    ({ hospitalId, approvalStatus, approvalNotes }) =>
      hospitalsAPI.approve(hospitalId, { approvalStatus, approvalNotes }),
    {
      onSuccess: () => {
        toast.success("Hospital approval updated successfully");
        queryClient.invalidateQueries("pending-hospitals");
        queryClient.invalidateQueries("admin-dashboard");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update hospital approval"
        );
      }
    }
  );

  // Approve doctor mutation
  const approveDoctorMutation = useMutation(
    ({ doctorId, approvalStatus, approvalNotes }) =>
      isHospitalAdmin
        ? adminAPI.approveHospitalDoctor(doctorId, {
            approvalStatus,
            approvalNotes
          })
        : adminAPI.approveDoctor(doctorId, { approvalStatus, approvalNotes }),
    {
      onSuccess: () => {
        toast.success("Doctor approval updated successfully");
        queryClient.invalidateQueries("pending-doctors");
        queryClient.invalidateQueries("admin-dashboard");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update doctor approval"
        );
      }
    }
  );

  const handleApproveUser = (userId, approvalStatus, approvalNotes = "") => {
    approveUserMutation.mutate({ userId, approvalStatus, approvalNotes });
  };

  const handleApproveHospital = (
    hospitalId,
    approvalStatus,
    approvalNotes = ""
  ) => {
    approveHospitalMutation.mutate({
      hospitalId,
      approvalStatus,
      approvalNotes
    });
  };

  const handleApproveDoctor = (
    doctorId,
    approvalStatus,
    approvalNotes = ""
  ) => {
    approveDoctorMutation.mutate({ doctorId, approvalStatus, approvalNotes });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const tabs = isHospitalAdmin
    ? [
        { id: "dashboard", name: "Dashboard", icon: Activity },
        { id: "doctors", name: "Pending Doctors", icon: User }
      ]
    : [
        { id: "dashboard", name: "Dashboard", icon: Activity },
        { id: "users", name: "Pending Users", icon: Users },
        { id: "hospitals", name: "Pending Hospitals", icon: Building2 },
        { id: "doctors", name: "Pending Doctors", icon: User }
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isHospitalAdmin ? "Hospital Admin Panel" : "Admin Panel"}
            </h1>
            <p className="text-gray-600 mt-2">
              {isHospitalAdmin
                ? "Manage doctor approvals and hospital administration."
                : "Manage user approvals, hospitals, and system administration."}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary-600" />
            <span className="text-sm font-medium text-gray-700">
              {isHospitalAdmin ? "Hospital Administrator" : "Administrator"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {isHospitalAdmin ? "Hospital Overview" : "System Overview"}
              </h2>

              {isHospitalAdmin ? (
                // Hospital Admin Dashboard
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <Building2 className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">
                          Hospital
                        </p>
                        <p className="text-lg font-bold text-blue-900">
                          {dashboardData?.stats?.hospitalName || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">
                          Total Doctors
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {dashboardData?.stats?.totalDoctors || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-600">
                          Pending Doctors
                        </p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {dashboardData?.stats?.pendingDoctors || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">
                          Total Appointments
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          {dashboardData?.stats?.totalAppointments || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // System Admin Dashboard
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">
                          Total Users
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {dashboardData?.stats?.totalUsers || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-yellow-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-600">
                          Pending Users
                        </p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {dashboardData?.stats?.pendingUsers || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <Building2 className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">
                          Total Hospitals
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {dashboardData?.stats?.totalHospitals || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">
                          Total Doctors
                        </p>
                        <p className="text-2xl font-bold text-purple-900">
                          {dashboardData?.stats?.totalDoctors || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!isHospitalAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <Building2 className="h-8 w-8 text-red-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-600">
                          Pending Hospitals
                        </p>
                        <p className="text-2xl font-bold text-red-900">
                          {dashboardData?.stats?.pendingHospitals || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <User className="h-8 w-8 text-orange-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">
                          Pending Doctors
                        </p>
                        <p className="text-2xl font-bold text-orange-900">
                          {dashboardData?.stats?.pendingDoctors || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending User Approvals
              </h2>

              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading pending users...</p>
                </div>
              ) : pendingUsers?.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pending users
                  </h3>
                  <p className="text-gray-600">
                    All user approvals are up to date.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers?.map((user) => (
                    <div
                      key={user._id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {user.profile.firstName} {user.profile.lastName}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {user.role}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <Mail className="inline h-4 w-4 mr-1" />
                              {user.email}
                            </p>
                            {user.profile.phone && (
                              <p>
                                <Phone className="inline h-4 w-4 mr-1" />
                                {user.profile.phone}
                              </p>
                            )}
                            <p>
                              <Clock className="inline h-4 w-4 mr-1" />
                              Joined{" "}
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleApproveUser(user._id, "approved")
                            }
                            disabled={approveUserMutation.isLoading}
                            className="btn-primary text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleApproveUser(user._id, "rejected")
                            }
                            disabled={approveUserMutation.isLoading}
                            className="btn-secondary text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Hospitals Tab */}
          {activeTab === "hospitals" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending Hospital Approvals
              </h2>

              {hospitalsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    Loading pending hospitals...
                  </p>
                </div>
              ) : pendingHospitals?.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pending hospitals
                  </h3>
                  <p className="text-gray-600">
                    All hospital approvals are up to date.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingHospitals?.map((hospital) => (
                    <div
                      key={hospital._id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {hospital.name}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {hospital.type}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <MapPin className="inline h-4 w-4 mr-1" />
                              {hospital.address.city}, {hospital.address.state}
                            </p>
                            <p>
                              <Phone className="inline h-4 w-4 mr-1" />
                              {hospital.contact.phone}
                            </p>
                            <p>
                              <Mail className="inline h-4 w-4 mr-1" />
                              {hospital.contact.email}
                            </p>
                            <p>
                              <Clock className="inline h-4 w-4 mr-1" />
                              Submitted{" "}
                              {new Date(
                                hospital.createdAt
                              ).toLocaleDateString()}
                            </p>
                            <p>
                              <User className="inline h-4 w-4 mr-1" />
                              By: {
                                hospital.organizationAdmin.profile.firstName
                              }{" "}
                              {hospital.organizationAdmin.profile.lastName}
                            </p>
                          </div>
                          {hospital.description && (
                            <p className="text-sm text-gray-600 mt-2">
                              {hospital.description}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleApproveHospital(hospital._id, "approved")
                            }
                            disabled={approveHospitalMutation.isLoading}
                            className="btn-primary text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleApproveHospital(hospital._id, "rejected")
                            }
                            disabled={approveHospitalMutation.isLoading}
                            className="btn-secondary text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Doctors Tab */}
          {activeTab === "doctors" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {isHospitalAdmin
                  ? "Pending Doctor Approvals (Your Hospital)"
                  : "Pending Doctor Approvals"}
              </h2>

              {doctorsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">
                    Loading pending doctors...
                  </p>
                </div>
              ) : pendingDoctors?.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pending doctors
                  </h3>
                  <p className="text-gray-600">
                    {isHospitalAdmin
                      ? "All doctor approvals for your hospital are up to date."
                      : "All doctor approvals are up to date."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingDoctors?.map((doctor) => (
                    <div
                      key={doctor._id}
                      className="border border-gray-200 rounded-lg p-6"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              Dr. {doctor.userId.profile.firstName}{" "}
                              {doctor.userId.profile.lastName}
                            </h3>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {doctor.specialization}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <Mail className="inline h-4 w-4 mr-1" />
                              {doctor.userId.email}
                            </p>
                            <p>
                              <Building2 className="inline h-4 w-4 mr-1" />
                              {doctor.hospitalId.name}
                            </p>
                            <p>
                              <Clock className="inline h-4 w-4 mr-1" />
                              {doctor.experience} years experience
                            </p>
                            <p>
                              <Star className="inline h-4 w-4 mr-1" />
                              License: {doctor.licenseNumber}
                            </p>
                            <p>
                              <Clock className="inline h-4 w-4 mr-1" />
                              Submitted{" "}
                              {new Date(doctor.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {doctor.bio && (
                            <p className="text-sm text-gray-600 mt-2">
                              {doctor.bio}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              handleApproveDoctor(doctor._id, "approved")
                            }
                            disabled={approveDoctorMutation.isLoading}
                            className="btn-primary text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleApproveDoctor(doctor._id, "rejected")
                            }
                            disabled={approveDoctorMutation.isLoading}
                            className="btn-secondary text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
