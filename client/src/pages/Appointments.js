import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  appointmentsAPI,
  doctorsAPI,
  hospitalsAPI,
  healthHistoryAPI
} from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import KanbanBoard from "../components/KanbanBoard";
import AppointmentDetails from "../components/AppointmentDetails";
import HealthHistoryManager from "../components/HealthHistoryManager";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  GripVertical,
  Grid3X3,
  List,
  FileText,
  Share2
} from "lucide-react";

const Appointments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'kanban'
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedHealthHistory, setSelectedHealthHistory] = useState([]);
  const [showHealthHistoryModal, setShowHealthHistoryModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  // Fetch appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery(
    ["appointments", filterStatus],
    () =>
      appointmentsAPI.getAll({
        status: filterStatus !== "all" ? filterStatus : undefined
      }),
    {
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  // Fetch hospitals
  const { data: hospitalsData, isLoading: hospitalsLoading } = useQuery(
    "hospitals",
    () => hospitalsAPI.getAll(),
    {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Fetch doctors by hospital
  const {
    data: doctorsData,
    isLoading: doctorsLoading,
    error: doctorsError
  } = useQuery(
    ["doctors-by-hospital", selectedHospital],
    () =>
      selectedHospital ? doctorsAPI.getByHospital(selectedHospital) : null,
    {
      enabled: !!selectedHospital,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  // Debug logging
  console.log("doctorsData:", doctorsData);
  console.log("doctorsLoading:", doctorsLoading);
  console.log("doctorsError:", doctorsError);
  console.log("showBookingModal:", showBookingModal);
  console.log("doctorsData?.doctors:", doctorsData?.doctors);
  console.log("doctorsData?.doctors?.length:", doctorsData?.doctors?.length);
  if (doctorsData?.doctors?.length > 0) {
    console.log("First doctor:", doctorsData.doctors[0]);
  }

  // Fetch doctor availability
  const { data: availabilityData } = useQuery(
    ["doctor-availability", selectedDoctor, selectedDate],
    () => doctorsAPI.getAvailability(selectedDoctor, selectedDate),
    {
      enabled: !!selectedDoctor && !!selectedDate
    }
  );

  // Mutations
  const createAppointmentMutation = useMutation(
    (data) => {
      console.log("Mutation called with data:", data);
      return appointmentsAPI.create(data);
    },
    {
      onSuccess: (response) => {
        console.log("Appointment created successfully:", response);
        toast.success("Appointment booked successfully!");
        setShowBookingModal(false);
        setSelectedHospital(null);
        setSelectedDoctor(null);
        setSelectedDate("");
        reset();
        queryClient.invalidateQueries("appointments");

        // Handle health history sharing
        handleAppointmentCreated(response);
      },
      onError: (error) => {
        console.error("Appointment creation failed:", error);
        toast.error(
          error.response?.data?.message || "Failed to book appointment"
        );
      }
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status }) => appointmentsAPI.updateStatus(id, status),
    {
      onSuccess: () => {
        toast.success("Appointment status updated!");
        queryClient.invalidateQueries("appointments");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to update status");
      }
    }
  );

  const updateSessionPhaseMutation = useMutation(
    ({ id, sessionPhase }) =>
      appointmentsAPI.updateSessionPhase(id, sessionPhase),
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

  const moveUpMutation = useMutation((id) => appointmentsAPI.moveUp(id), {
    onSuccess: () => {
      toast.success("Appointment moved up in queue!");
      queryClient.invalidateQueries("appointments");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to move appointment"
      );
    }
  });

  const moveDownMutation = useMutation((id) => appointmentsAPI.moveDown(id), {
    onSuccess: () => {
      toast.success("Appointment moved down in queue!");
      queryClient.invalidateQueries("appointments");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to move appointment"
      );
    }
  });

  const reorderQueueMutation = useMutation(
    (data) => appointmentsAPI.reorderQueue(data),
    {
      onSuccess: () => {
        toast.success("Queue reordered successfully!");
        queryClient.invalidateQueries("appointments");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to reorder queue");
      }
    }
  );

  const cancelAppointmentMutation = useMutation(
    (id) => appointmentsAPI.cancel(id),
    {
      onSuccess: () => {
        toast.success("Appointment cancelled!");
        queryClient.invalidateQueries("appointments");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to cancel appointment"
        );
      }
    }
  );

  // Handle doctor selection
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      // Use availability data if available, otherwise use default slots
      const slots = availabilityData?.availableSlots || [
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30"
      ];
      setAvailableSlots(slots);
    }
  }, [selectedDoctor, selectedDate, availabilityData]);

  const onSubmit = (data) => {
    console.log("Form submitted with data:", data);
    console.log("selectedHospital:", selectedHospital);
    console.log("selectedDoctor:", selectedDoctor);
    console.log("selectedDate:", selectedDate);

    if (!selectedHospital || !selectedDoctor || !selectedDate || !data.time) {
      toast.error("Please select hospital, doctor, date, and time");
      return;
    }

    const appointmentData = {
      hospitalId: selectedHospital,
      doctorId: selectedDoctor,
      date: selectedDate,
      time: data.time,
      symptoms: data.symptoms,
      type: data.type
    };

    console.log("Calling createAppointmentMutation with:", appointmentData);
    createAppointmentMutation.mutate(appointmentData);
  };

  // Share health history with appointment after creation
  const shareHealthHistoryMutation = useMutation(
    (data) => healthHistoryAPI.shareWithAppointment(data),
    {
      onSuccess: () => {
        toast.success("Health history shared successfully!");
        setSelectedHealthHistory([]);
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to share health history"
        );
      }
    }
  );

  // Handle appointment creation success
  const handleAppointmentCreated = (appointment) => {
    if (selectedHealthHistory.length > 0) {
      shareHealthHistoryMutation.mutate({
        appointmentId: appointment._id,
        healthHistoryIds: selectedHealthHistory.map((doc) => doc._id)
      });
    }
  };

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

  const testDragAndDrop = () => {
    console.log("Testing drag and drop...");
    console.log("Appointments data:", appointmentsData);
    console.log("User role:", user?.role);
    toast.success("Drag and drop test - check console!");
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleStatusChange = (appointmentId, newStatus) => {
    console.log(`Status change requested: ${appointmentId} -> ${newStatus}`);
    updateStatusMutation.mutate({ id: appointmentId, status: newStatus });
  };

  const handleCloseAppointmentDetails = () => {
    setShowAppointmentDetails(false);
    setSelectedAppointment(null);
  };

  const handleDragEnd = (result) => {
    console.log("Drag end result:", result);
    console.log("Drag and drop is working!");

    if (!result.destination) {
      console.log("No destination, drag cancelled");
      return;
    }

    if (result.source.index === result.destination.index) {
      console.log("Same position, no change needed");
      return;
    }

    const appointments = Array.from(appointmentsData?.appointments || []);
    const [reorderedItem] = appointments.splice(result.source.index, 1);
    appointments.splice(result.destination.index, 0, reorderedItem);

    console.log("Reordered appointments:", appointments);

    // Update queue positions
    const updatedAppointments = appointments.map((appointment, index) => ({
      id: appointment._id,
      newPosition: index + 1
    }));

    console.log("Updated positions:", updatedAppointments);

    // Get doctor ID and current date
    const doctor = appointmentsData?.appointments?.[0]?.doctorId?._id;
    const date = appointmentsData?.appointments?.[0]?.date;

    console.log("Doctor ID:", doctor, "Date:", date);

    if (doctor && date) {
      console.log("Calling reorder mutation with:", {
        doctorId: doctor,
        date: date,
        appointments: updatedAppointments
      });

      reorderQueueMutation.mutate({
        doctorId: doctor,
        date: date,
        appointments: updatedAppointments
      });
    } else {
      console.error("Missing doctor ID or date");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-2">
              Manage your appointments and schedule new ones.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="h-4 w-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "kanban"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Kanban</span>
              </button>
            </div>

            {user?.role === "patient" && (
              <button
                onClick={() => setShowBookingModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Book Appointment</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointments View */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {appointmentsLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading appointments...</p>
          </div>
        ) : appointmentsData?.appointments?.length === 0 ? (
          <div className="p-6 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments found</p>
          </div>
        ) : viewMode === "kanban" ? (
          // Kanban Board View
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Kanban Board
              </h2>
              <p className="text-sm text-gray-600">
                Drag and drop appointments between columns to change their
                status. Click on any appointment to view details.
              </p>
            </div>
            <KanbanBoard
              appointments={appointmentsData.appointments}
              onViewDetails={handleViewAppointment}
              onStatusChange={handleStatusChange}
            />
          </div>
        ) : (
          // List View
          <div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-400 mb-4">
              <div className="flex justify-between items-center">
                <p className="text-blue-700">
                  <strong>Drag & Drop Instructions:</strong> For doctors, you
                  can drag appointments using the grip icon (⋮⋮) to reorder the
                  queue.
                </p>
                <button
                  onClick={testDragAndDrop}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Test Drag & Drop
                </button>
              </div>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="appointments">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`divide-y divide-gray-200 ${
                      snapshot.isDraggingOver ? "bg-blue-50" : ""
                    }`}
                  >
                    {appointmentsData?.appointments?.map(
                      (appointment, index) => (
                        <Draggable
                          key={appointment._id}
                          draggableId={appointment._id}
                          index={index}
                          isDragDisabled={
                            user?.role !== "doctor" ||
                            appointment.status === "completed" ||
                            appointment.status === "cancelled"
                          }
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-4 hover:bg-gray-50 transition-colors ${
                                snapshot.isDragging
                                  ? "bg-blue-50 shadow-lg"
                                  : "bg-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-1">
                                  {user?.role === "doctor" && (
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="h-5 w-5" />
                                      <span className="text-sm font-medium text-gray-900">
                                        #{appointment.queuePosition || "N/A"}
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex-1">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                          <User className="h-4 w-4 text-primary-600" />
                                        </div>
                                        <div className="ml-3">
                                          <div className="text-sm font-medium text-gray-900">
                                            {user?.role === "patient"
                                              ? `${appointment.doctorId?.userId?.profile?.firstName} ${appointment.doctorId?.userId?.profile?.lastName}`
                                              : `${appointment.patientId?.profile?.firstName} ${appointment.patientId?.profile?.lastName}`}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {user?.role === "patient"
                                              ? appointment.doctorId
                                                  ?.specialization
                                              : appointment.patientId?.email}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-sm text-gray-500">
                                        <div>
                                          {new Date(
                                            appointment.date
                                          ).toLocaleDateString()}
                                        </div>
                                        <div>{appointment.time}</div>
                                      </div>

                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {appointment.type}
                                      </span>

                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                          appointment.status
                                        )}`}
                                      >
                                        {getStatusIcon(appointment.status)}
                                        <span className="ml-1">
                                          {appointment.status}
                                        </span>
                                      </span>

                                      {user?.role === "doctor" && (
                                        <select
                                          value={
                                            appointment.sessionPhase ||
                                            "waiting"
                                          }
                                          onChange={(e) =>
                                            updateSessionPhaseMutation.mutate({
                                              id: appointment._id,
                                              sessionPhase: e.target.value
                                            })
                                          }
                                          className="text-xs border rounded px-2 py-1"
                                        >
                                          <option value="waiting">
                                            Waiting
                                          </option>
                                          <option value="data-collection">
                                            Data Collection
                                          </option>
                                          <option value="initial-assessment">
                                            Initial Assessment
                                          </option>
                                          <option value="examination">
                                            Examination
                                          </option>
                                          <option value="diagnosis">
                                            Diagnosis
                                          </option>
                                          <option value="treatment">
                                            Treatment
                                          </option>
                                          <option value="surgery">
                                            Surgery
                                          </option>
                                          <option value="recovery">
                                            Recovery
                                          </option>
                                          <option value="follow-up">
                                            Follow-up
                                          </option>
                                          <option value="discharge">
                                            Discharge
                                          </option>
                                        </select>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex space-x-2">
                                  {user?.role === "doctor" &&
                                    appointment.status !== "completed" &&
                                    appointment.status !== "cancelled" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            moveUpMutation.mutate(
                                              appointment._id
                                            )
                                          }
                                          className="text-blue-600 hover:text-blue-900"
                                          title="Move up in queue"
                                        >
                                          ↑
                                        </button>
                                        <button
                                          onClick={() =>
                                            moveDownMutation.mutate(
                                              appointment._id
                                            )
                                          }
                                          className="text-blue-600 hover:text-blue-900"
                                          title="Move down in queue"
                                        >
                                          ↓
                                        </button>
                                      </>
                                    )}
                                  {appointment.status === "scheduled" && (
                                    <>
                                      <button
                                        onClick={() =>
                                          updateStatusMutation.mutate({
                                            id: appointment._id,
                                            status: "confirmed"
                                          })
                                        }
                                        className="text-green-600 hover:text-green-900"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() =>
                                          cancelAppointmentMutation.mutate(
                                            appointment._id
                                          )
                                        }
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                  {appointment.status === "confirmed" && (
                                    <button
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          id: appointment._id,
                                          status: "in-progress"
                                        })
                                      }
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Start
                                    </button>
                                  )}
                                  {appointment.status === "in-progress" && (
                                    <button
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          id: appointment._id,
                                          status: "completed"
                                        })
                                      }
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Complete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      )
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      <AppointmentDetails
        appointment={selectedAppointment}
        isOpen={showAppointmentDetails}
        onClose={handleCloseAppointmentDetails}
        onStatusChange={() => queryClient.invalidateQueries("appointments")}
      />

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Book New Appointment
              </h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Hospital Selection */}
                <div>
                  <label className="form-label">Select Hospital</label>
                  <select
                    value={selectedHospital || ""}
                    onChange={(e) => {
                      setSelectedHospital(e.target.value);
                      setSelectedDoctor(null); // Reset doctor selection when hospital changes
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">Choose a hospital</option>
                    {hospitalsLoading ? (
                      <option value="" disabled>
                        Loading hospitals...
                      </option>
                    ) : hospitalsData?.hospitals?.length > 0 ? (
                      hospitalsData.hospitals.map((hospital) => (
                        <option key={hospital._id} value={hospital._id}>
                          {hospital.name} - {hospital.address.city}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No hospitals available
                      </option>
                    )}
                  </select>
                  {hospitalsLoading && (
                    <p className="text-sm text-gray-500">
                      Loading hospitals...
                    </p>
                  )}
                </div>

                {/* Doctor Selection */}
                <div>
                  <label className="form-label">Select Doctor</label>
                  <select
                    value={selectedDoctor || ""}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="input-field"
                    required
                    disabled={!selectedHospital}
                  >
                    <option value="">
                      {selectedHospital
                        ? "Choose a doctor"
                        : "Select hospital first"}
                    </option>
                    {doctorsLoading ? (
                      <option value="" disabled>
                        Loading doctors...
                      </option>
                    ) : doctorsData?.doctors?.length > 0 ? (
                      doctorsData.doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          Dr. {doctor.userId.profile.firstName}{" "}
                          {doctor.userId.profile.lastName} -{" "}
                          {doctor.specialization}
                        </option>
                      ))
                    ) : selectedHospital ? (
                      <option value="" disabled>
                        No doctors available in this hospital
                      </option>
                    ) : (
                      <option value="" disabled>
                        Select a hospital first
                      </option>
                    )}
                  </select>
                  {doctorsLoading && (
                    <p className="text-sm text-gray-500">Loading doctors...</p>
                  )}
                  {doctorsError && (
                    <p className="text-sm text-red-500">
                      Error loading doctors: {doctorsError.message}
                    </p>
                  )}
                  {!doctorsLoading &&
                    !doctorsError &&
                    selectedHospital &&
                    (!doctorsData?.doctors ||
                      doctorsData.doctors.length === 0) && (
                      <p className="text-sm text-red-500">
                        No doctors found in this hospital. Please try another
                        hospital.
                      </p>
                    )}
                </div>

                {/* Date Selection */}
                <div>
                  <label className="form-label">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="input-field"
                    required
                  />
                </div>

                {/* Time Selection */}
                <div>
                  <label className="form-label">Select Time</label>
                  <select
                    {...register("time", { required: "Time is required" })}
                    className="input-field"
                    disabled={!selectedDoctor || !selectedDate}
                  >
                    <option value="">Choose time</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  {errors.time && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.time.message}
                    </p>
                  )}
                </div>

                {/* Appointment Type */}
                <div>
                  <label className="form-label">Appointment Type</label>
                  <select
                    {...register("type", { required: "Type is required" })}
                    className="input-field"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>

                {/* Symptoms */}
                <div>
                  <label className="form-label">Symptoms (Optional)</label>
                  <textarea
                    {...register("symptoms")}
                    rows={3}
                    className="input-field"
                    placeholder="Describe your symptoms..."
                  />
                </div>

                {/* Health History Selection */}
                <div>
                  <label className="form-label">
                    Share Health History (Optional)
                  </label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowHealthHistoryModal(true)}
                      className="btn-secondary flex items-center space-x-2 w-full"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Select Health Documents</span>
                    </button>

                    {selectedHealthHistory.length > 0 && (
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Selected Documents ({selectedHealthHistory.length}):
                        </p>
                        <div className="space-y-2">
                          {selectedHealthHistory.map((doc) => (
                            <div
                              key={doc._id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center space-x-2">
                                <FileText className="h-3 w-3 text-gray-500" />
                                <span className="text-gray-600">
                                  {doc.title}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedHealthHistory((prev) =>
                                    prev.filter((d) => d._id !== doc._id)
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false);
                      setSelectedHospital(null);
                      setSelectedDoctor(null);
                      setSelectedDate("");
                      reset();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAppointmentMutation.isLoading}
                    className="btn-primary"
                  >
                    {createAppointmentMutation.isLoading
                      ? "Booking..."
                      : "Book Appointment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Health History Selection Modal */}
      {showHealthHistoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Select Health History Documents
              </h3>
              <button
                onClick={() => setShowHealthHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <HealthHistoryManager
              onSelectDocuments={setSelectedHealthHistory}
              selectedDocuments={selectedHealthHistory}
            />

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowHealthHistoryModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowHealthHistoryModal(false)}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
