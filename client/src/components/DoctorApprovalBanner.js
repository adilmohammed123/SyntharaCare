import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  UserCheck
} from "lucide-react";

const DoctorApprovalBanner = () => {
  const { user } = useAuth();

  if (user?.role !== "doctor") {
    return null;
  }

  const getApprovalInfo = () => {
    if (user.approvalStatus === "approved") {
      return {
        title: "Account Approved",
        message: "You have full access to all features.",
        icon: CheckCircle,
        color: "bg-green-50 border-green-200 text-green-800",
        status: "approved"
      };
    } else if (user.approvalStatus === "pending") {
      return {
        title: "Pending Hospital Admin Approval",
        message:
          "Your account is under review. You have limited access until approved.",
        icon: Clock,
        color: "bg-yellow-50 border-yellow-200 text-yellow-800",
        status: "pending"
      };
    } else if (user.approvalStatus === "rejected") {
      return {
        title: "Account Rejected",
        message: "Your account has been rejected. Please contact support.",
        icon: AlertCircle,
        color: "bg-red-50 border-red-200 text-red-800",
        status: "rejected"
      };
    }
  };

  const info = getApprovalInfo();
  if (!info) return null;

  const IconComponent = info.icon;

  return (
    <div className={`border rounded-lg p-4 mb-6 ${info.color}`}>
      <div className="flex items-start">
        <IconComponent className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-medium">{info.title}</h3>
          <p className="text-sm mt-1">{info.message}</p>

          {info.status === "pending" && (
            <div className="mt-3">
              <div className="text-xs font-medium mb-2">
                Current Access Level:
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>View and edit your profile</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>View hospital information</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-3 w-3 text-red-500 mr-2" />
                  <span className="text-red-600">Cannot view patient data</span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-3 w-3 text-red-500 mr-2" />
                  <span className="text-red-600">
                    Cannot manage appointments
                  </span>
                </div>
                <div className="flex items-center">
                  <Shield className="h-3 w-3 text-red-500 mr-2" />
                  <span className="text-red-600">
                    Cannot access admin features
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs font-medium text-blue-800 mb-1">
                  Next Steps:
                </div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Complete your professional profile</li>
                  <li>• Upload medical credentials</li>
                  <li>• Contact hospital admin for verification</li>
                  <li>• Wait for approval notification</li>
                </ul>
              </div>
            </div>
          )}

          {info.status === "approved" && (
            <div className="mt-3">
              <div className="text-xs font-medium mb-2">
                Full Access Granted:
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>View and manage appointments</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Access patient information</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Create diagnoses and prescriptions</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                  <span>Manage your schedule</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorApprovalBanner;
