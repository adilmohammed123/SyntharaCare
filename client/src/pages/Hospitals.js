import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hospitalsAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Building2,
  Search,
  Filter,
  Star,
  MapPin,
  Phone,
  Mail,
  Plus,
  X,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";

const Hospitals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Fetch hospitals
  const { data: hospitalsData, isLoading: hospitalsLoading } = useQuery(
    ["hospitals", searchTerm, selectedType, selectedCity],
    () =>
      hospitalsAPI.getAll({
        search: searchTerm || undefined,
        type: selectedType || undefined,
        city: selectedCity || undefined
      }),
    {
      refetchInterval: 60000 // Refetch every minute
    }
  );

  // Fetch my hospitals for organization admin
  const { data: myHospitals } = useQuery(
    ["my-hospitals"],
    () => hospitalsAPI.getMyHospitals(),
    {
      enabled: user?.role === "organization_admin",
      refetchInterval: 60000
    }
  );

  // Create hospital mutation
  const createHospitalMutation = useMutation(
    (hospitalData) => hospitalsAPI.create(hospitalData),
    {
      onSuccess: () => {
        toast.success("Hospital created successfully and pending approval");
        setShowCreateModal(false);
        queryClient.invalidateQueries("hospitals");
        queryClient.invalidateQueries("my-hospitals");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to create hospital"
        );
      }
    }
  );

  const hospitalTypes = [
    "public",
    "private",
    "specialty",
    "research",
    "teaching"
  ];

  const facilities = [
    "emergency_room",
    "icu",
    "operating_room",
    "laboratory",
    "radiology",
    "pharmacy",
    "rehabilitation",
    "pediatric_ward",
    "maternity_ward",
    "cardiology_unit",
    "neurology_unit",
    "oncology_unit",
    "orthopedics_unit",
    "psychiatry_unit",
    "dental_clinic",
    "eye_clinic",
    "dermatology_clinic",
    "physiotherapy",
    "dialysis_center",
    "blood_bank"
  ];

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
    "Urology",
    "Emergency Medicine",
    "Internal Medicine",
    "Family Medicine"
  ];

  const handleHospitalClick = (hospital) => {
    setSelectedHospital(hospital);
    setShowHospitalModal(true);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const handleCreateHospital = (formData) => {
    createHospitalMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
            <p className="text-gray-600 mt-2">
              Browse hospitals and their facilities.
            </p>
            {hospitalsData && (
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <Building2 className="h-4 w-4" />
                  <span>{hospitalsData.hospitals?.length || 0} Hospitals</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {hospitalsData.hospitals?.reduce(
                      (total, hospital) => total + (hospital.doctorCount || 0),
                      0
                    )}{" "}
                    Total Doctors
                  </span>
                </span>
              </div>
            )}
          </div>
          {user?.role === "organization_admin" &&
            user?.approvalStatus === "approved" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Hospital</span>
              </button>
            )}
        </div>
      </div>

      {/* Organization Admin Notification */}
      {user?.role === "organization_admin" &&
        user?.approvalStatus !== "approved" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-900">
                  Account Pending Approval
                </h3>
                <p className="text-yellow-800 mt-1">
                  Your organization admin account is pending approval. You'll be
                  able to add hospitals once approved.
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
                placeholder="Search hospitals by name, specialization, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">All Types</option>
              {hospitalTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="City"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="input-field w-32"
            />
          </div>
        </div>
      </div>

      {/* My Hospitals Section (for organization admin) */}
      {user?.role === "organization_admin" && myHospitals?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            My Hospitals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myHospitals.map((hospital) => (
              <div
                key={hospital._id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleHospitalClick(hospital)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{hospital.name}</h3>
                  {getStatusBadge(hospital.approvalStatus)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{hospital.type}</p>
                <p className="text-sm text-gray-500">
                  {hospital.address.city}, {hospital.address.state}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitalsLoading ? (
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
        ) : hospitalsData?.hospitals?.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hospitals found
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedType || selectedCity
                ? "Try adjusting your search criteria"
                : "No hospitals are currently available"}
            </p>
          </div>
        ) : (
          hospitalsData?.hospitals?.map((hospital) => (
            <div
              key={hospital._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleHospitalClick(hospital)}
            >
              {/* Hospital Header */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {hospital.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {hospital.type}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex items-center space-x-1">
                  {getRatingStars(hospital.rating.average)}
                </div>
                <span className="text-sm text-gray-600">
                  ({hospital.rating.count} reviews)
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {hospital.address.city}, {hospital.address.state}
                </span>
              </div>

              {/* Contact */}
              <div className="flex items-center space-x-2 mb-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {hospital.contact.phone}
                </span>
              </div>

              {/* Doctor Count */}
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {hospital.doctorCount || 0} doctors
                </span>
              </div>

              {/* Specializations */}
              {hospital.specializations &&
                hospital.specializations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      Specializations:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {hospital.specializations
                        .slice(0, 3)
                        .map((spec, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {spec}
                          </span>
                        ))}
                      {hospital.specializations.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{hospital.specializations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

              {/* Facilities */}
              {hospital.facilities && hospital.facilities.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Facilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {hospital.facilities.slice(0, 3).map((facility, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {facility.replace("_", " ")}
                      </span>
                    ))}
                    {hospital.facilities.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{hospital.facilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              {user?.role === "patient" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate to doctors page with hospital filter
                    window.location.href = `/doctors?hospitalId=${hospital._id}`;
                  }}
                  className="w-full btn-primary"
                >
                  View Doctors
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Hospital Modal */}
      {showCreateModal && (
        <CreateHospitalModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateHospital}
          isLoading={createHospitalMutation.isLoading}
          hospitalTypes={hospitalTypes}
          facilities={facilities}
          specializations={specializations}
        />
      )}

      {/* Hospital Details Modal */}
      {showHospitalModal && selectedHospital && (
        <HospitalDetailsModal
          hospital={selectedHospital}
          onClose={() => setShowHospitalModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

// Create Hospital Modal Component
const CreateHospitalModal = ({
  onClose,
  onSubmit,
  isLoading,
  hospitalTypes,
  facilities,
  specializations
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    contact: {
      phone: "",
      email: "",
      website: ""
    },
    facilities: [],
    specializations: [],
    capacity: {
      beds: 0,
      icuBeds: 0,
      emergencyBeds: 0
    },
    emergencyServices: false,
    ambulanceServices: false,
    insuranceAccepted: []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFacilityToggle = (facility) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleSpecializationToggle = (spec) => {
    setFormData((prev) => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter((s) => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Add New Hospital
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="input-field"
                >
                  <option value="">Select Type</option>
                  {hospitalTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                rows={3}
                className="input-field"
              />
            </div>

            {/* Address */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Address
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, street: e.target.value }
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, city: e.target.value }
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, state: e.target.value }
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.zipCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, zipCode: e.target.value }
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address.country}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        address: { ...prev.address, country: e.target.value }
                      }))
                    }
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Contact Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contact.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, phone: e.target.value }
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contact.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value }
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.contact.website}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        contact: { ...prev.contact, website: e.target.value }
                      }))
                    }
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Facilities
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {facilities.map((facility) => (
                  <label key={facility} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.facilities.includes(facility)}
                      onChange={() => handleFacilityToggle(facility)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">
                      {facility.replace("_", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Specializations */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Specializations
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {specializations.map((spec) => (
                  <label key={spec} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.specializations.includes(spec)}
                      onChange={() => handleSpecializationToggle(spec)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{spec}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Capacity */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Capacity
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Beds
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity.beds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        capacity: {
                          ...prev.capacity,
                          beds: parseInt(e.target.value) || 0
                        }
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ICU Beds
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity.icuBeds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        capacity: {
                          ...prev.capacity,
                          icuBeds: parseInt(e.target.value) || 0
                        }
                      }))
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Beds
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity.emergencyBeds}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        capacity: {
                          ...prev.capacity,
                          emergencyBeds: parseInt(e.target.value) || 0
                        }
                      }))
                    }
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Services
              </h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.emergencyServices}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyServices: e.target.checked
                      }))
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Emergency Services
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.ambulanceServices}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ambulanceServices: e.target.checked
                      }))
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Ambulance Services
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
              >
                {isLoading ? "Creating..." : "Create Hospital"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Hospital Details Modal Component
const HospitalDetailsModal = ({ hospital, onClose, user }) => {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Fetch doctors for this hospital
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const response = await fetch(
          `/api/doctors/by-hospital/${hospital._id}`
        );
        const data = await response.json();
        setDoctors(data.doctors || []);
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [hospital._id]);
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {hospital.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Type</h4>
                <p className="text-gray-600 capitalize">{hospital.type}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Rating</h4>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {getRatingStars(hospital.rating.average)}
                  </div>
                  <span className="text-gray-600">
                    {hospital.rating.average.toFixed(1)} (
                    {hospital.rating.count} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {hospital.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{hospital.description}</p>
              </div>
            )}

            {/* Address */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Address</h4>
              <p className="text-gray-600">
                {hospital.address.street}, {hospital.address.city},{" "}
                {hospital.address.state} {hospital.address.zipCode},{" "}
                {hospital.address.country}
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Contact Information
              </h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {hospital.contact.phone}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {hospital.contact.email}
                  </span>
                </div>
                {hospital.contact.website && (
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">
                      Website: {hospital.contact.website}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Specializations */}
            {hospital.specializations &&
              hospital.specializations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Specializations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {hospital.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Facilities */}
            {hospital.facilities && hospital.facilities.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Facilities</h4>
                <div className="flex flex-wrap gap-2">
                  {hospital.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {facility.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Capacity */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Capacity</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {hospital.capacity.beds} Total Beds
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">
                    {hospital.capacity.icuBeds} ICU Beds
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">
                    {hospital.capacity.emergencyBeds} Emergency Beds
                  </span>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Services</h4>
              <div className="space-y-2">
                {hospital.emergencyServices && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Emergency Services</span>
                  </div>
                )}
                {hospital.ambulanceServices && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Ambulance Services</span>
                  </div>
                )}
              </div>
            </div>

            {/* Doctors */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-900">
                  Doctors ({doctors.length})
                </h4>
                {doctors.length > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      window.location.href = `/doctors?hospitalId=${hospital._id}`;
                    }}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View All Doctors →
                  </button>
                )}
              </div>
              {loadingDoctors ? (
                <div className="text-gray-600">Loading doctors...</div>
              ) : doctors.length > 0 ? (
                <div className="space-y-3">
                  {doctors.slice(0, 5).map((doctor) => (
                    <div
                      key={doctor._id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-600">
                          {doctor.userId.profile.firstName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Dr. {doctor.userId.profile.firstName}{" "}
                          {doctor.userId.profile.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>
                  ))}
                  {doctors.length > 5 && (
                    <p className="text-sm text-gray-600">
                      +{doctors.length - 5} more doctors
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-gray-600">
                  No doctors found at this hospital
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {user?.role === "patient" && (
              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    onClose();
                    window.location.href = `/doctors?hospitalId=${hospital._id}`;
                  }}
                  className="flex-1 btn-primary"
                >
                  View Doctors
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hospitals;
