import React, { useState } from "react";
import { X, AlertTriangle, Calendar, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

const DoctorSuspensionModal = ({
  isOpen,
  onClose,
  doctor,
  onSuspend,
  isSuspending
}) => {
  const [suspensionType, setSuspensionType] = useState("temporary");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const suspensionData = {
        reason: data.reason,
        notes: data.notes,
        expiryDate: suspensionType === "temporary" ? data.expiryDate : null
      };

      await onSuspend(doctor._id, suspensionData);
      reset();
      onClose();
    } catch (error) {
      console.error("Suspension error:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            Suspend Doctor
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Doctor:</strong> {doctor?.user?.profile?.firstName}{" "}
            {doctor?.user?.profile?.lastName}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Specialization:</strong> {doctor?.specialization}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Email:</strong> {doctor?.user?.email}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Suspension Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suspension Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="temporary"
                  checked={suspensionType === "temporary"}
                  onChange={(e) => setSuspensionType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Temporary</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="indefinite"
                  checked={suspensionType === "indefinite"}
                  onChange={(e) => setSuspensionType(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Indefinite</span>
              </label>
            </div>
          </div>

          {/* Expiry Date */}
          {suspensionType === "temporary" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Suspension End Date
              </label>
              <input
                type="datetime-local"
                {...register("expiryDate", {
                  required: suspensionType === "temporary"
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.expiryDate && (
                <p className="text-red-500 text-xs mt-1">
                  Expiry date is required for temporary suspensions
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suspension Reason *
            </label>
            <textarea
              {...register("reason", { required: "Reason is required" })}
              rows={3}
              placeholder="Enter the reason for suspension..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.reason && (
              <p className="text-red-500 text-xs mt-1">
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Additional Notes
            </label>
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Optional additional notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Warning */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This action will immediately suspend the
              doctor's account. They will not be able to log in or access the
              system until unsuspended.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSuspending}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isSuspending ? "Suspending..." : "Suspend Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorSuspensionModal;
