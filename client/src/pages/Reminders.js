import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useForm } from "react-hook-form";
import { remindersAPI, medicinesAPI } from "../utils/api";
import toast from "react-hot-toast";
import {
  Bell,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pill,
  Edit,
  Trash2,
  Filter,
  Search
} from "lucide-react";

const Reminders = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm();

  // Fetch reminders
  const { data: remindersData, isLoading: remindersLoading } = useQuery(
    ["reminders", filterStatus, searchTerm],
    () =>
      remindersAPI.getAll({
        status: filterStatus !== "all" ? filterStatus : undefined,
        search: searchTerm || undefined
      }),
    {
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  // Fetch today's reminders
  const { data: todayRemindersData } = useQuery(
    "today-reminders",
    () => remindersAPI.getTodays(),
    {
      refetchInterval: 60000 // Refetch every minute
    }
  );

  // Fetch medicines for dropdown
  useQuery("medicines", () => medicinesAPI.getAll(), {
    enabled: showCreateModal || showEditModal
  });

  // Mutations
  const createReminderMutation = useMutation(
    (data) => remindersAPI.create(data),
    {
      onSuccess: () => {
        toast.success("Reminder created successfully!");
        setShowCreateModal(false);
        reset();
        queryClient.invalidateQueries("reminders");
        queryClient.invalidateQueries("today-reminders");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to create reminder"
        );
      }
    }
  );

  const updateReminderMutation = useMutation(
    ({ id, data }) => remindersAPI.update(id, data),
    {
      onSuccess: () => {
        toast.success("Reminder updated successfully!");
        setShowEditModal(false);
        setSelectedReminder(null);
        reset();
        queryClient.invalidateQueries("reminders");
        queryClient.invalidateQueries("today-reminders");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update reminder"
        );
      }
    }
  );

  const markDoseMutation = useMutation(
    ({ id, action }) => remindersAPI.markDose(id, action),
    {
      onSuccess: () => {
        toast.success("Dose status updated!");
        queryClient.invalidateQueries("reminders");
        queryClient.invalidateQueries("today-reminders");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update dose status"
        );
      }
    }
  );

  const deleteReminderMutation = useMutation((id) => remindersAPI.delete(id), {
    onSuccess: () => {
      toast.success("Reminder deleted!");
      queryClient.invalidateQueries("reminders");
      queryClient.invalidateQueries("today-reminders");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete reminder");
    }
  });

  const handleCreateReminder = (data) => {
    createReminderMutation.mutate({
      ...data,
      times: data.times.split(",").map((time) => time.trim()),
      startDate: data.startDate,
      endDate: data.endDate || null
    });
  };

  const handleEditReminder = (data) => {
    updateReminderMutation.mutate({
      id: selectedReminder._id,
      data: {
        ...data,
        times: data.times.split(",").map((time) => time.trim()),
        startDate: data.startDate,
        endDate: data.endDate || null
      }
    });
  };

  const handleEditClick = (reminder) => {
    setSelectedReminder(reminder);
    setValue("medicineName", reminder.medicineName);
    setValue("dosage", reminder.dosage);
    setValue("frequency", reminder.frequency);
    setValue("times", reminder.times.join(", "));
    setValue("startDate", reminder.startDate.split("T")[0]);
    setValue("endDate", reminder.endDate ? reminder.endDate.split("T")[0] : "");
    setValue("instructions", reminder.instructions);
    setShowEditModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "paused":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const isDoseOverdue = (reminder) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    return reminder.times.some((time) => {
      const reminderTime = new Date(`${today}T${time}`);
      const timeDiff = now - reminderTime;
      return timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000; // Within 24 hours
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Medicine Reminders
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your medicine reminders and track your doses.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Reminder</span>
          </button>
        </div>
      </div>

      {/* Today's Reminders */}
      {todayRemindersData?.reminders?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Today's Reminders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayRemindersData.reminders.map((reminder) => (
              <div
                key={reminder._id}
                className={`bg-white rounded-lg p-4 border ${
                  isDoseOverdue(reminder)
                    ? "border-red-200 bg-red-50"
                    : "border-blue-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">
                    {reminder.medicineName}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      isDoseOverdue(reminder)
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isDoseOverdue(reminder) ? "Overdue" : "Today"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{reminder.dosage}</p>
                <p className="text-sm text-gray-600 mb-3">
                  Times: {reminder.times.join(", ")}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      markDoseMutation.mutate({
                        id: reminder._id,
                        action: "taken"
                      })
                    }
                    className="flex-1 btn-primary text-sm py-1"
                  >
                    Taken
                  </button>
                  <button
                    onClick={() =>
                      markDoseMutation.mutate({
                        id: reminder._id,
                        action: "skipped"
                      })
                    }
                    className="flex-1 btn-secondary text-sm py-1"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reminders by medicine name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {remindersLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading reminders...</p>
          </div>
        ) : remindersData?.reminders?.length === 0 ? (
          <div className="p-6 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No reminders found</p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicine
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dosage & Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Times
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
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
                  {remindersData?.reminders?.map((reminder) => (
                    <tr key={reminder._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <Pill className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {reminder.medicineName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reminder.dosage}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reminder.dosage}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reminder.frequency}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {reminder.times.join(", ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(reminder.startDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reminder.endDate
                            ? `to ${new Date(
                                reminder.endDate
                              ).toLocaleDateString()}`
                            : "No end date"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            reminder.status
                          )}`}
                        >
                          {getStatusIcon(reminder.status)}
                          <span className="ml-1">{reminder.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(reminder)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              deleteReminderMutation.mutate(reminder._id)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Create Reminder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Reminder
              </h3>
              <form
                onSubmit={handleSubmit(handleCreateReminder)}
                className="space-y-4"
              >
                {/* Medicine Name */}
                <div>
                  <label className="form-label">Medicine Name</label>
                  <input
                    {...register("medicineName", {
                      required: "Medicine name is required"
                    })}
                    className="input-field"
                    placeholder="Enter medicine name"
                  />
                  {errors.medicineName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.medicineName.message}
                    </p>
                  )}
                </div>

                {/* Dosage */}
                <div>
                  <label className="form-label">Dosage</label>
                  <input
                    {...register("dosage", { required: "Dosage is required" })}
                    className="input-field"
                    placeholder="e.g., 1 tablet, 10ml"
                  />
                  {errors.dosage && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.dosage.message}
                    </p>
                  )}
                </div>

                {/* Frequency */}
                <div>
                  <label className="form-label">Frequency</label>
                  <select
                    {...register("frequency", {
                      required: "Frequency is required"
                    })}
                    className="input-field"
                  >
                    <option value="">Select frequency</option>
                    <option value="once daily">Once daily</option>
                    <option value="twice daily">Twice daily</option>
                    <option value="three times daily">Three times daily</option>
                    <option value="four times daily">Four times daily</option>
                    <option value="as needed">As needed</option>
                  </select>
                  {errors.frequency && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.frequency.message}
                    </p>
                  )}
                </div>

                {/* Times */}
                <div>
                  <label className="form-label">Times (comma-separated)</label>
                  <input
                    {...register("times", { required: "Times are required" })}
                    className="input-field"
                    placeholder="e.g., 08:00, 20:00"
                  />
                  {errors.times && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.times.message}
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    {...register("startDate", {
                      required: "Start date is required"
                    })}
                    className="input-field"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="form-label">End Date (Optional)</label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className="input-field"
                  />
                </div>

                {/* Instructions */}
                <div>
                  <label className="form-label">Instructions (Optional)</label>
                  <textarea
                    {...register("instructions")}
                    rows={3}
                    className="input-field"
                    placeholder="Special instructions..."
                  />
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
                    disabled={createReminderMutation.isLoading}
                    className="btn-primary"
                  >
                    {createReminderMutation.isLoading
                      ? "Creating..."
                      : "Create Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reminder Modal */}
      {showEditModal && selectedReminder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Reminder
              </h3>
              <form
                onSubmit={handleSubmit(handleEditReminder)}
                className="space-y-4"
              >
                {/* Same form fields as create modal */}
                <div>
                  <label className="form-label">Medicine Name</label>
                  <input
                    {...register("medicineName", {
                      required: "Medicine name is required"
                    })}
                    className="input-field"
                  />
                  {errors.medicineName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.medicineName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Dosage</label>
                  <input
                    {...register("dosage", { required: "Dosage is required" })}
                    className="input-field"
                  />
                  {errors.dosage && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.dosage.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Frequency</label>
                  <select
                    {...register("frequency", {
                      required: "Frequency is required"
                    })}
                    className="input-field"
                  >
                    <option value="">Select frequency</option>
                    <option value="once daily">Once daily</option>
                    <option value="twice daily">Twice daily</option>
                    <option value="three times daily">Three times daily</option>
                    <option value="four times daily">Four times daily</option>
                    <option value="as needed">As needed</option>
                  </select>
                  {errors.frequency && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.frequency.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Times (comma-separated)</label>
                  <input
                    {...register("times", { required: "Times are required" })}
                    className="input-field"
                  />
                  {errors.times && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.times.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    {...register("startDate", {
                      required: "Start date is required"
                    })}
                    className="input-field"
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">End Date (Optional)</label>
                  <input
                    type="date"
                    {...register("endDate")}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Instructions (Optional)</label>
                  <textarea
                    {...register("instructions")}
                    rows={3}
                    className="input-field"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateReminderMutation.isLoading}
                    className="btn-primary"
                  >
                    {updateReminderMutation.isLoading
                      ? "Updating..."
                      : "Update Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
