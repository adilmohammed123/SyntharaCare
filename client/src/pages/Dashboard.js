import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  appointmentsAPI,
  diagnosesAPI,
  remindersAPI,
  medicinesAPI,
  doctorsAPI
} from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Calendar,
  Stethoscope,
  Bell,
  Pill,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: appointmentsData } = useQuery({
    queryKey: ["dashboard-appointments"],
    queryFn: () => appointmentsAPI.getAll({ limit: 5 }),
    refetchInterval: 30000
  });

  const { data: diagnosesData } = useQuery({
    queryKey: ["dashboard-diagnoses"],
    queryFn: () => diagnosesAPI.getDiagnoses({ limit: 5 })
  });

  const { data: remindersData } = useQuery({
    queryKey: ["dashboard-reminders"],
    queryFn: () => remindersAPI.getAll({ limit: 5 })
  });

  const { data: medicinesData } = useQuery({
    queryKey: ["dashboard-medicines"],
    queryFn: () => medicinesAPI.getAll({ limit: 5 })
  });

  const { data: doctorsData } = useQuery({
    queryKey: ["dashboard-doctors"],
    queryFn: () => doctorsAPI.getAll({ limit: 5 })
  });

  // Calculate statistics
  const totalAppointments = appointmentsData?.appointments?.length || 0;
  const totalDiagnoses = diagnosesData?.diagnoses?.length || 0;
  const totalReminders = remindersData?.reminders?.length || 0;
  const totalMedicines = medicinesData?.medicines?.length || 0;
  const totalDoctors = doctorsData?.doctors?.length || 0;

  const stats = [
    {
      name: "Appointments",
      value: totalAppointments,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      name: "Diagnoses",
      value: totalDiagnoses,
      icon: Stethoscope,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      name: "Reminders",
      value: totalReminders,
      icon: Bell,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      name: "Medicines",
      value: totalMedicines,
      icon: Pill,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      name: "Doctors",
      value: totalDoctors,
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.profile?.firstName || "User"}! Here's your
            overview.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Appointments */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Recent Appointments
              </h3>
            </div>
            <div className="p-6">
              {appointmentsData?.appointments?.length > 0 ? (
                <div className="space-y-4">
                  {appointmentsData.appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.patientId?.profile?.firstName}{" "}
                          {appointment.patientId?.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(appointment.date).toLocaleDateString()} at{" "}
                          {appointment.time}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            appointment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent appointments
                </p>
              )}
            </div>
          </div>

          {/* Recent Diagnoses */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
                Recent Diagnoses
              </h3>
            </div>
            <div className="p-6">
              {diagnosesData?.diagnoses?.length > 0 ? (
                <div className="space-y-4">
                  {diagnosesData.diagnoses.map((diagnosis) => (
                    <div
                      key={diagnosis._id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="font-medium text-gray-900">
                        {diagnosis.condition}
                      </p>
                      <p className="text-sm text-gray-600">
                        {diagnosis.patientId?.profile?.firstName}{" "}
                        {diagnosis.patientId?.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(diagnosis.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No recent diagnoses
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    Schedule Appointment
                  </p>
                  <p className="text-sm text-gray-600">
                    Book a new appointment
                  </p>
                </div>
              </div>
            </button>
            <button className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <Stethoscope className="h-8 w-8 text-green-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Add Diagnosis</p>
                  <p className="text-sm text-gray-600">
                    Record a new diagnosis
                  </p>
                </div>
              </div>
            </button>
            <button className="p-4 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <Pill className="h-8 w-8 text-purple-600 mr-3" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">Manage Medicines</p>
                  <p className="text-sm text-gray-600">
                    Update medicine inventory
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
