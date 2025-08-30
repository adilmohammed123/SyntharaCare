import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Home,
  Calendar,
  Users,
  Building2,
  FileText,
  Bell,
  Pill,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  Camera
} from "lucide-react";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Hospitals", href: "/hospitals", icon: Building2 },
    { name: "Doctors", href: "/doctors", icon: Users },
    { name: "Diagnoses", href: "/diagnoses", icon: FileText },
    { name: "Reminders", href: "/reminders", icon: Bell },
    { name: "Medicines", href: "/medicines", icon: Pill },
    {
      name: "Prescription Scanner",
      href: "/prescription-scanner",
      icon: Camera
    },
    ...(user?.role === "admin"
      ? [{ name: "Admin", href: "/admin", icon: Shield }]
      : []),
    { name: "Profile", href: "/profile", icon: User }
  ];

  // Filter navigation items based on approval status
  const filteredNavigation =
    user?.approvalStatus === "approved"
      ? navigation
      : [{ name: "Profile", href: "/profile", icon: User }];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-primary-600">Hospital MS</h1>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          {user?.approvalStatus !== "approved" && (
            <div className="px-4 py-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                <span className="text-sm text-yellow-800">
                  ⚠️ Account {user?.approvalStatus} - Limited access
                </span>
              </div>
            </div>
          )}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-primary-100 text-primary-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-primary-600">
              Hospital Management System
            </h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? "bg-primary-100 text-primary-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {user?.profile?.firstName?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                {user?.approvalStatus !== "approved" && (
                  <p className="text-xs text-yellow-600 capitalize">
                    {user?.approvalStatus}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1">
              {user?.approvalStatus !== "approved" && (
                <div className="flex items-center">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
                    <span className="text-sm text-yellow-800">
                      ⚠️ Account {user?.approvalStatus} - Limited access
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user?.profile?.firstName}!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
