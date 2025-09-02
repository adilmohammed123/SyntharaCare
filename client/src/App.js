import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Doctors from "./pages/Doctors";
import Hospitals from "./pages/Hospitals";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Diagnoses from "./pages/Diagnoses";
import Reminders from "./pages/Reminders";
import Medicines from "./pages/Medicines";
import PrescriptionScanner from "./pages/PrescriptionScanner";
import PendingApproval from "./pages/PendingApproval";
import HealthHistory from "./pages/HealthHistory";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/diagnoses" element={<Diagnoses />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/medicines" element={<Medicines />} />
        <Route path="/prescription-scanner" element={<PrescriptionScanner />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/health-history" element={<HealthHistory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
