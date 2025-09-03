import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Don't check auth if we're in the middle of authentication
    if (isAuthenticating) return;

    console.log("checkAuth called, isAuthenticating:", isAuthenticating);

    try {
      const token = localStorage.getItem("token");
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await api.get("/api/auth/me");
        const userData = response.data || response;

        console.log("checkAuth response:", userData);
        setUser(userData);

        // Show welcome message for doctors
        if (userData.role === "doctor") {
          if (userData.approvalStatus === "approved") {
            toast.success("Welcome! You have full access to the system.", {
              duration: 4000
            });
          } else if (userData.approvalStatus === "pending") {
            toast.success(
              "Welcome! Complete your profile and wait for hospital admin approval.",
              {
                duration: 6000
              }
            );
          }
        }
      }
    } catch (error) {
      console.error("CheckAuth error:", error);
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log("Login started");
      setIsAuthenticating(true);
      const response = await api.post("/api/auth/login", { email, password });
      const { token, user } = response.data || response;

      console.log("Login response:", user);

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Set user state immediately and set loading to false
      setUser(user);
      setLoading(false);

      console.log("User state set:", user);

      toast.success("Login successful!");
      return user;
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setIsAuthenticating(false);
      console.log("Login completed, isAuthenticating set to false");
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post("/api/auth/register", userData);
      const { token, user } = response.data || response;

      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setUser(user);

      toast.success("Registration successful!");
      return user;
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    toast.success("Logged out successfully");
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put("/api/auth/profile", {
        profile: profileData
      });
      setUser(response.user || response.data?.user);
      toast.success("Profile updated successfully!");
      return response.user || response.data?.user;
    } catch (error) {
      const message = error.response?.data?.message || "Profile update failed";
      toast.error(message);
      throw error;
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
