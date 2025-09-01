import React from "react";
import { useAuth } from "../contexts/AuthContext";
import HealthHistoryManager from "../components/HealthHistoryManager";
import Layout from "../components/Layout";

const HealthHistory = () => {
  const { user } = useAuth();

  if (user?.role !== "patient") {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              Health history management is only available for patients.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <HealthHistoryManager />
      </div>
    </Layout>
  );
};

export default HealthHistory;
