import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hospitalsAPI } from "../utils/api";
import { Eye, EyeOff, Mail, Lock, User, Phone, Building2 } from "lucide-react";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const selectedRole = watch("role");

  // Fetch approved hospitals for doctor and hospital admin registration
  const { data: hospitalsData, isLoading: hospitalsLoading } = useQuery(
    ["approved-hospitals"],
    () => hospitalsAPI.getAll({ approvalStatus: "approved", limit: 100 }),
    {
      enabled:
        selectedRole === "doctor" || selectedRole === "organization_admin" // Enable when doctor or hospital admin role is selected
    }
  );

  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const userData = {
        email: data.email,
        password: data.password,
        role: data.role,
        profile: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender
        }
      };

      // Add hospital information for doctors
      if (data.role === "doctor" && data.hospitalId) {
        userData.hospitalId = data.hospitalId;
        userData.specialization = data.specialization || "General Medicine";
        userData.licenseNumber = data.licenseNumber;
        userData.experience = parseInt(data.experience) || 0;
        userData.consultationFee = parseFloat(data.consultationFee) || 50;
      }

      // Add hospital information for hospital admins
      if (data.role === "organization_admin" && data.hospitalId) {
        userData.hospitalId = data.hospitalId;
      }

      await registerUser(userData);
      navigate("/");
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="form-label">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    className={`input-field pl-10 ${
                      errors.firstName ? "border-red-500" : ""
                    }`}
                    placeholder="First name"
                    {...register("firstName", {
                      required: "First name is required"
                    })}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="form-label">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  className={`input-field ${
                    errors.lastName ? "border-red-500" : ""
                  }`}
                  placeholder="Last name"
                  {...register("lastName", {
                    required: "Last name is required"
                  })}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`input-field pl-10 ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  className={`input-field pl-10 ${
                    errors.phone ? "border-red-500" : ""
                  }`}
                  placeholder="Phone number"
                  {...register("phone", {
                    required: "Phone number is required"
                  })}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dateOfBirth" className="form-label">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  className={`input-field ${
                    errors.dateOfBirth ? "border-red-500" : ""
                  }`}
                  {...register("dateOfBirth", {
                    required: "Date of birth is required"
                  })}
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="gender" className="form-label">
                  Gender
                </label>
                <select
                  id="gender"
                  className={`input-field ${
                    errors.gender ? "border-red-500" : ""
                  }`}
                  {...register("gender", {
                    required: "Gender is required"
                  })}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="role" className="form-label">
                I am a
              </label>
              <select
                id="role"
                className={`input-field ${errors.role ? "border-red-500" : ""}`}
                {...register("role", {
                  required: "Role is required"
                })}
                onChange={(e) => {
                  // The query will automatically enable/disable based on selectedRole
                }}
              >
                <option value="">Select your role</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="organization_admin">
                  Hospital Administrator
                </option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Doctor-specific fields */}
            {selectedRole === "doctor" && (
              <>
                <div>
                  <label htmlFor="hospitalId" className="form-label">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Hospital
                  </label>
                  <select
                    id="hospitalId"
                    className={`input-field ${
                      errors.hospitalId ? "border-red-500" : ""
                    }`}
                    disabled={hospitalsLoading}
                    {...register("hospitalId", {
                      required:
                        selectedRole === "doctor"
                          ? "Hospital is required"
                          : false
                    })}
                  >
                    <option value="">
                      {hospitalsLoading
                        ? "Loading hospitals..."
                        : "Select a hospital"}
                    </option>
                    {hospitalsData?.hospitals?.map((hospital) => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.name} - {hospital.address.city},{" "}
                        {hospital.address.state}
                      </option>
                    ))}
                  </select>
                  {hospitalsLoading && (
                    <p className="mt-1 text-sm text-gray-600">
                      Loading approved hospitals...
                    </p>
                  )}
                  {!hospitalsLoading &&
                    hospitalsData?.hospitals?.length === 0 && (
                      <p className="mt-1 text-sm text-yellow-600">
                        No approved hospitals available. Please contact an
                        administrator.
                      </p>
                    )}
                  {errors.hospitalId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.hospitalId.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="specialization" className="form-label">
                      Specialization
                    </label>
                    <select
                      id="specialization"
                      className={`input-field ${
                        errors.specialization ? "border-red-500" : ""
                      }`}
                      {...register("specialization")}
                    >
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Gastroenterology">Gastroenterology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Oncology">Oncology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Radiology">Radiology</option>
                      <option value="Surgery">Surgery</option>
                      <option value="Urology">Urology</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="licenseNumber" className="form-label">
                      License Number
                    </label>
                    <input
                      id="licenseNumber"
                      type="text"
                      className={`input-field ${
                        errors.licenseNumber ? "border-red-500" : ""
                      }`}
                      placeholder="Medical license number"
                      {...register("licenseNumber", {
                        required:
                          selectedRole === "doctor"
                            ? "License number is required"
                            : false
                      })}
                    />
                    {errors.licenseNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.licenseNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="experience" className="form-label">
                      Years of Experience
                    </label>
                    <input
                      id="experience"
                      type="number"
                      min="0"
                      className={`input-field ${
                        errors.experience ? "border-red-500" : ""
                      }`}
                      placeholder="5"
                      {...register("experience", {
                        required:
                          selectedRole === "doctor"
                            ? "Experience is required"
                            : false,
                        min: {
                          value: 0,
                          message: "Experience must be 0 or more"
                        }
                      })}
                    />
                    {errors.experience && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.experience.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="consultationFee" className="form-label">
                      Consultation Fee ($)
                    </label>
                    <input
                      id="consultationFee"
                      type="number"
                      min="0"
                      step="0.01"
                      className={`input-field ${
                        errors.consultationFee ? "border-red-500" : ""
                      }`}
                      placeholder="50.00"
                      {...register("consultationFee", {
                        required:
                          selectedRole === "doctor"
                            ? "Consultation fee is required"
                            : false,
                        min: { value: 0, message: "Fee must be 0 or more" }
                      })}
                    />
                    {errors.consultationFee && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.consultationFee.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Hospital Admin-specific fields */}
            {selectedRole === "organization_admin" && (
              <>
                <div>
                  <label htmlFor="hospitalId" className="form-label">
                    <Building2 className="inline h-4 w-4 mr-1" />
                    Hospital to Administer
                  </label>
                  <select
                    id="hospitalId"
                    className={`input-field ${
                      errors.hospitalId ? "border-red-500" : ""
                    }`}
                    disabled={hospitalsLoading}
                    {...register("hospitalId", {
                      required:
                        selectedRole === "organization_admin"
                          ? "Hospital is required"
                          : false
                    })}
                  >
                    <option value="">
                      {hospitalsLoading
                        ? "Loading hospitals..."
                        : "Select a hospital to administer"}
                    </option>
                    {hospitalsData?.hospitals?.map((hospital) => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.name} - {hospital.address.city},{" "}
                        {hospital.address.state}
                      </option>
                    ))}
                  </select>
                  {hospitalsLoading && (
                    <p className="mt-1 text-sm text-gray-600">
                      Loading approved hospitals...
                    </p>
                  )}
                  {!hospitalsLoading &&
                    hospitalsData?.hospitals?.length === 0 && (
                      <p className="mt-1 text-sm text-yellow-600">
                        No approved hospitals available. Please contact an
                        administrator.
                      </p>
                    )}
                  {errors.hospitalId && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.hospitalId.message}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`input-field pl-10 pr-10 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  placeholder="Create a password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`input-field ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
                placeholder="Confirm your password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match"
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
