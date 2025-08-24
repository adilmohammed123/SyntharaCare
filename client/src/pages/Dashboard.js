import React from 'react';
import { useQuery } from 'react-query';
import { appointmentsAPI, diagnosesAPI, remindersAPI, medicinesAPI, doctorsAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  Stethoscope,
  Bell,
  Pill,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: appointmentsData } = useQuery(
    'dashboard-appointments',
    () => appointmentsAPI.getAll({ limit: 5 }),
    {
      refetchInterval: 30000,
    }
  );

  const { data: diagnosesData } = useQuery(
    'dashboard-diagnoses',
    () => diagnosesAPI.getAll({ limit: 5 }),
    {
      refetchInterval: 60000,
    }
  );

  const { data: remindersData } = useQuery(
    'dashboard-reminders',
    () => remindersAPI.getTodays(),
    {
      refetchInterval: 60000,
    }
  );

  const { data: medicinesData } = useQuery(
    'dashboard-medicines',
    () => medicinesAPI.getLowStock(),
    {
      refetchInterval: 300000,
    }
  );

  // Fetch doctors (for doctor profile check)
  const { data: doctorsData } = useQuery(
    'dashboard-doctors',
    () => doctorsAPI.getAll({ limit: 1 }),
    {
      refetchInterval: 300000,
      enabled: user?.role === 'doctor',
    }
  );

  const getStats = () => {
    const appointments = appointmentsData?.appointments || [];
    const diagnoses = diagnosesData?.diagnoses || [];
    const reminders = remindersData?.reminders || [];
    const lowStockMedicines = medicinesData?.medicines || [];

    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => 
      apt.date === today && apt.status !== 'cancelled'
    );
    const upcomingAppointments = appointments.filter(apt => 
      apt.date > today && apt.status === 'scheduled'
    );
    const completedAppointments = appointments.filter(apt => 
      apt.status === 'completed'
    );

    return {
      todayAppointments: todayAppointments.length,
      upcomingAppointments: upcomingAppointments.length,
      totalAppointments: appointments.length,
      completedAppointments: completedAppointments.length,
      totalDiagnoses: diagnoses.length,
      todayReminders: reminders.length,
      lowStockMedicines: lowStockMedicines.length,
    };
  };

  const stats = getStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificContent = () => {
    if (user?.role === 'patient') {
      return {
        title: 'Patient Dashboard',
        description: 'Track your appointments, diagnoses, and medicine reminders.',
        quickActions: [
          { name: 'Book Appointment', href: '/appointments', icon: Calendar },
          { name: 'View Diagnoses', href: '/diagnoses', icon: Stethoscope },
          { name: 'Medicine Reminders', href: '/reminders', icon: Bell },
        ]
      };
    } else if (user?.role === 'doctor') {
      return {
        title: 'Doctor Dashboard',
        description: 'Manage your appointments, patient diagnoses, and schedule.',
        quickActions: [
          { name: 'View Appointments', href: '/appointments', icon: Calendar },
          { name: 'Create Diagnosis', href: '/diagnoses', icon: Stethoscope },
          { name: 'Patient Records', href: '/patients', icon: Users },
        ]
      };
    } else {
      return {
        title: 'Admin Dashboard',
        description: 'Monitor system statistics and manage hospital operations.',
        quickActions: [
          { name: 'Manage Medicines', href: '/medicines', icon: Pill },
          { name: 'View Statistics', href: '/appointments', icon: TrendingUp },
          { name: 'System Settings', href: '/profile', icon: AlertCircle },
        ]
      };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
            <p className="text-gray-600 mt-2">
              {getGreeting()}, {user?.profile?.firstName || 'User'}! {content.description}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Doctor Setup Notification */}
      {user?.role === 'doctor' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900">
                  Doctor Profile Setup
                </h3>
                <p className="text-blue-800 mt-1">
                  {doctorsData?.doctors?.length === 0 
                    ? "You need to create a doctor profile before patients can see and book appointments with you."
                    : "Your doctor profile is active and patients can book appointments with you."
                  }
                </p>
              </div>
            </div>
            {doctorsData?.doctors?.length === 0 && (
              <a
                href="/doctors"
                className="btn-primary"
              >
                Setup Profile
              </a>
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {stats.todayAppointments > 0 ? 'You have appointments today' : 'No appointments today'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Diagnoses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDiagnoses}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {user?.role === 'patient' ? 'Your medical records' : 'Patient diagnoses'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Bell className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Reminders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayReminders}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {stats.todayReminders > 0 ? 'Medicine reminders due' : 'No reminders today'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <Pill className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Medicines</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockMedicines}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {stats.lowStockMedicines > 0 ? 'Need reordering' : 'Stock levels good'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.href}
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary-600" />
                </div>
                <span className="ml-3 font-medium text-gray-900">{action.name}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h2>
          {appointmentsData?.appointments?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent appointments</p>
          ) : (
            <div className="space-y-3">
              {appointmentsData?.appointments?.slice(0, 5).map((appointment) => (
                <div key={appointment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user?.role === 'patient' 
                          ? `Dr. ${appointment.doctorId?.userId?.profile?.firstName} ${appointment.doctorId?.userId?.profile?.lastName}`
                          : `${appointment.patientId?.profile?.firstName} ${appointment.patientId?.profile?.lastName}`
                        }
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Reminders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Reminders</h2>
          {remindersData?.reminders?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No reminders for today</p>
          ) : (
            <div className="space-y-3">
              {remindersData?.reminders?.slice(0, 5).map((reminder) => (
                <div key={reminder._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Bell className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{reminder.medicineName}</p>
                      <p className="text-xs text-gray-500">{reminder.dosage} - {reminder.times.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button className="p-1 text-green-600 hover:text-green-800">
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:text-red-800">
                      <AlertCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedAppointments}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
