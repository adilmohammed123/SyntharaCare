import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const PendingApproval = () => {
  const { user, logout } = useAuth();

  const getStatusIcon = () => {
    switch (user?.approvalStatus) {
      case "approved":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "rejected":
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Clock className="h-12 w-12 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (user?.approvalStatus) {
      case "approved":
        return "Your account has been approved!";
      case "rejected":
        return "Your account has been rejected.";
      default:
        return "Your account is pending approval.";
    }
  };

  const getStatusDescription = () => {
    switch (user?.approvalStatus) {
      case "approved":
        return "You now have full access to the system.";
      case "rejected":
        return "Please contact the administrator for more information.";
      default:
        return "An administrator will review your account and approve it soon. You will be notified once your account is approved.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Status
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {getStatusMessage()}
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Welcome, {user?.profile?.firstName} {user?.profile?.lastName}!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {getStatusDescription()}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Role:</strong> {user?.role?.replace('_', ' ')}</p>
                <p><strong>Status:</strong> {user?.approvalStatus}</p>
              </div>
            </div>

            {user?.approvalStatus === "pending" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      You can still update your profile while waiting for approval.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {user?.approvalStatus === "pending" && (
                <button
                  onClick={() => window.location.href = "/profile"}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Update Profile
                </button>
              )}
              
              <button
                onClick={logout}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
