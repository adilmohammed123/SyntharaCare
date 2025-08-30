import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { doctorsAPI, hospitalsAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Users,
  Search,
  Filter,
  Star,
  Clock,
  Calendar,
  Plus,
  X,
  Building2
} from "lucide-react";

const Doctors = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQuickSetupModal, setShowQuickSetupModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Handle URL parameters for hospital filter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hospitalId = urlParams.get("hospitalId");
    if (hospitalId) {
      setSelectedHospital(hospitalId);
    }
  }, []);

  // Fetch doctors
  const { data: doctorsData, isLoading: doctorsLoading } = useQuery(
    ["doctors", searchTerm, selectedSpecialization, selectedHospital],
    () =>
      doctorsAPI.getAll({
        search: searchTerm || undefined,
        specialization: selectedSpecialization || undefined,
        hospitalId: selectedHospital || undefined
      }),
    {
      refetchInterval: 60000 // Refetch every minute
    }
  );

  // Fetch hospitals for filter
  const { data: hospitalsData } = useQuery(
    ["hospitals"],
    () => hospitalsAPI.getAll({ limit: 100 }),
    {
      refetchInterval: 300000 // Refetch every 5 minutes
    }
  );

  // Fetch specializations
  const specializations = [
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Gastroenterology",
    "Neurology",
    "Oncology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Surgery",
    "Urology"
  ];

  // Quick setup mutation
  const quickSetupMutation = useMutation(
    (hospitalId) => doctorsAPI.quickSetup({ hospitalId }),
    {
      onSuccess: () => {
        toast.success(
          "Doctor profile created successfully and pending approval!"
        );
        setShowQuickSetupModal(false);
        queryClient.invalidateQueries("doctors");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to create doctor profile"
        );
      }
    }
  );

  const handleDoctorClick = (doctor) => {
    setSelectedDoctor(doctor);
    setShowProfileModal(true);
  };

  const getAvailabilityText = (availability) => {
    if (!availability || availability.length === 0) {
      return "Not available";
    }

    const days = availability
      .filter((avail) => avail.isAvailable)
      .map((avail) => avail.day.charAt(0).toUpperCase() + avail.day.slice(1))
      .slice(0, 3);

    if (days.length === 0) return "Not available";
    if (days.length === 1) return `Available on ${days[0]}`;
    if (days.length === 2) return `Available on ${days[0]} & ${days[1]}`;
    return `Available on ${days[0]}, ${days[1]} & ${days[2]}`;
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
            <p className="text-gray-600 mt-2">
              Browse available doctors and their specializations.
            </p>
          </div>
          {user?.role === "doctor" && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowQuickSetupModal(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Quick Setup</span>
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Full Profile</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Doctor Setup Notification */}
      {user?.role === "doctor" && doctorsData?.doctors?.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-yellow-900">
                Complete Your Doctor Profile
              </h3>
              <p className="text-yellow-800 mt-1">
                You need to create a doctor profile before patients can see and
                book appointments with you. Use the "Quick Setup" button above
                to get started immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Specialization Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">All Specializations</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Filter */}
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-gray-400" />
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">All Hospitals</option>
              {hospitalsData?.hospitals?.map((hospital) => (
                <option key={hospital._id} value={hospital._id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {doctorsLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
            >
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))
        ) : doctorsData?.doctors?.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No doctors found
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedSpecialization
                ? "Try adjusting your search criteria"
                : "No doctors are currently available"}
            </p>
          </div>
        ) : (
          doctorsData?.doctors?.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleDoctorClick(doctor)}
            >
              {/* Doctor Header */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-600">
                    {doctor.userId.profile.firstName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dr. {doctor.userId.profile.firstName}{" "}
                    {doctor.userId.profile.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {doctor.specialization}
                  </p>
                  {doctor.hospitalId && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-600 font-medium">
                        {doctor.hospitalId.name}
                      </p>
                      {doctor.hospitalId.address && (
                        <span className="text-xs text-gray-500">
                          • {doctor.hospitalId.address.city}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  {getRatingStars(doctor.rating.average)}
                </div>
                <span className="text-sm text-gray-600">
                  ({doctor.rating.count} reviews)
                </span>
              </div>

              {/* Experience */}
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {doctor.experience} years experience
                </span>
              </div>

              {/* Availability */}
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {getAvailabilityText(doctor.availability)}
                </span>
              </div>

              {/* Consultation Fee */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Consultation Fee:</span>
                <span className="text-lg font-semibold text-primary-600">
                  ${doctor.consultationFee}
                </span>
              </div>

              {/* Languages */}
              {doctor.languages && doctor.languages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Languages:</p>
                  <div className="flex flex-wrap gap-1">
                    {doctor.languages.slice(0, 3).map((lang, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {lang}
                      </span>
                    ))}
                    {doctor.languages.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{doctor.languages.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {doctor.hospitalId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to hospitals page with this hospital selected
                      window.location.href = `/hospitals?hospitalId=${doctor.hospitalId._id}`;
                    }}
                    className="flex-1 btn-secondary text-sm"
                  >
                    View Hospital
                  </button>
                )}
                {user?.role === "patient" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to appointments page with doctor pre-selected
                      window.location.href = `/appointments?doctor=${doctor._id}`;
                    }}
                    className="flex-1 btn-primary text-sm"
                  >
                    Book Appointment
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Doctor Profile Modal */}
      {showProfileModal && selectedDoctor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Dr. {selectedDoctor.userId.profile.firstName}{" "}
                  {selectedDoctor.userId.profile.lastName}
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Specialization
                    </h4>
                    <p className="text-gray-600">
                      {selectedDoctor.specialization}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Experience
                    </h4>
                    <p className="text-gray-600">
                      {selectedDoctor.experience} years
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      License Number
                    </h4>
                    <p className="text-gray-600">
                      {selectedDoctor.licenseNumber}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Consultation Fee
                    </h4>
                    <p className="text-gray-600">
                      ${selectedDoctor.consultationFee}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Rating</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {getRatingStars(selectedDoctor.rating.average)}
                    </div>
                    <span className="text-gray-600">
                      {selectedDoctor.rating.average.toFixed(1)} (
                      {selectedDoctor.rating.count} reviews)
                    </span>
                  </div>
                </div>

                {/* Bio */}
                {selectedDoctor.bio && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">About</h4>
                    <p className="text-gray-600">{selectedDoctor.bio}</p>
                  </div>
                )}

                {/* Education */}
                {selectedDoctor.education &&
                  selectedDoctor.education.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Education
                      </h4>
                      <div className="space-y-2">
                        {selectedDoctor.education.map((edu, index) => (
                          <div key={index} className="text-gray-600">
                            <p className="font-medium">{edu.degree}</p>
                            <p className="text-sm">
                              {edu.institution} ({edu.year})
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Languages */}
                {selectedDoctor.languages &&
                  selectedDoctor.languages.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Languages
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoctor.languages.map((lang, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Availability */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Availability
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDoctor.availability.map((avail, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="font-medium capitalize">
                          {avail.day}
                        </span>
                        <span className="text-sm text-gray-600">
                          {avail.isAvailable
                            ? `${avail.startTime} - ${avail.endTime}`
                            : "Not available"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {user?.role === "patient" && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        window.location.href = `/appointments?doctor=${selectedDoctor._id}`;
                      }}
                      className="flex-1 btn-primary"
                    >
                      Book Appointment
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Setup Modal */}
      {showQuickSetupModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Quick Doctor Profile Setup
                </h3>
                <button
                  onClick={() => setShowQuickSetupModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    What will be created:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Specialization: General Medicine</li>
                    <li>• Consultation Fee: $50</li>
                    <li>• Experience: 5 years</li>
                    <li>• Availability: Monday-Friday, 9 AM - 5 PM</li>
                    <li>• Languages: English</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Hospital
                  </label>
                  <select
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select a hospital</option>
                    {hospitalsData?.hospitals?.map((hospital) => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="text-sm text-gray-600">
                  This will create a basic doctor profile and associate you with
                  the selected hospital. Your profile will be pending approval
                  before patients can see you.
                </p>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowQuickSetupModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => quickSetupMutation.mutate(selectedHospital)}
                    disabled={quickSetupMutation.isLoading || !selectedHospital}
                    className="btn-primary"
                  >
                    {quickSetupMutation.isLoading
                      ? "Creating..."
                      : "Create Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
