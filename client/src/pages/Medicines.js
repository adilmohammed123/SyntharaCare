import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { medicinesAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import {
  Pill,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  X
} from "lucide-react";

const Medicines = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm();

  // Fetch medicines
  const { data: medicinesData, isLoading: medicinesLoading } = useQuery(
    ["medicines", searchTerm, selectedCategory],
    () =>
      medicinesAPI.getAll({
        search: searchTerm || undefined,
        category: selectedCategory || undefined
      }),
    {
      refetchInterval: 60000
    }
  );

  // Fetch categories
  const { data: categoriesData } = useQuery("medicine-categories", () =>
    medicinesAPI.getCategories()
  );

  // Mutations
  const createMedicineMutation = useMutation(
    (data) => medicinesAPI.create(data),
    {
      onSuccess: () => {
        toast.success("Medicine added successfully!");
        setShowCreateModal(false);
        reset();
        queryClient.invalidateQueries("medicines");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to add medicine");
      }
    }
  );

  const updateMedicineMutation = useMutation(
    ({ id, data }) => medicinesAPI.update(id, data),
    {
      onSuccess: () => {
        toast.success("Medicine updated successfully!");
        setShowEditModal(false);
        setSelectedMedicine(null);
        reset();
        queryClient.invalidateQueries("medicines");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Failed to update medicine"
        );
      }
    }
  );

  const deleteMedicineMutation = useMutation((id) => medicinesAPI.delete(id), {
    onSuccess: () => {
      toast.success("Medicine deleted!");
      queryClient.invalidateQueries("medicines");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete medicine");
    }
  });

  const handleCreateMedicine = (data) => {
    createMedicineMutation.mutate({
      ...data,
      price: parseFloat(data.price),
      stockQuantity: parseInt(data.stockQuantity),
      reorderLevel: parseInt(data.reorderLevel)
    });
  };

  const handleEditMedicine = (data) => {
    updateMedicineMutation.mutate({
      id: selectedMedicine._id,
      data: {
        ...data,
        price: parseFloat(data.price),
        stockQuantity: parseInt(data.stockQuantity),
        reorderLevel: parseInt(data.reorderLevel)
      }
    });
  };

  const handleEditClick = (medicine) => {
    setSelectedMedicine(medicine);
    setValue("name", medicine.name);
    setValue("genericName", medicine.genericName);
    setValue("brand", medicine.brand);
    setValue("category", medicine.category);
    setValue("dosageForm", medicine.dosageForm);
    setValue("strength", medicine.strength);
    setValue("price", medicine.price);
    setValue("stockQuantity", medicine.stockQuantity);
    setValue("reorderLevel", medicine.reorderLevel);
    setValue("manufacturer", medicine.manufacturer);
    setShowEditModal(true);
  };

  const handleDetailsClick = (medicine) => {
    setSelectedMedicine(medicine);
    setShowDetailsModal(true);
  };

  const getStockStatus = (medicine) => {
    if (medicine.stockQuantity === 0) {
      return {
        status: "out-of-stock",
        color: "bg-red-100 text-red-800",
        text: "Out of Stock"
      };
    } else if (medicine.stockQuantity <= medicine.reorderLevel) {
      return {
        status: "low-stock",
        color: "bg-yellow-100 text-yellow-800",
        text: "Low Stock"
      };
    } else {
      return {
        status: "in-stock",
        color: "bg-green-100 text-green-800",
        text: "In Stock"
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Medicines</h1>
            <p className="text-gray-600 mt-2">
              Manage medicine inventory and track stock levels.
            </p>
          </div>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Medicine</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search medicines by name, brand, or generic name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">All Categories</option>
              {categoriesData?.categories?.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Medicines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medicinesLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
            >
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))
        ) : medicinesData?.medicines?.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No medicines found
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory
                ? "Try adjusting your search criteria"
                : "No medicines are currently available"}
            </p>
          </div>
        ) : (
          medicinesData?.medicines?.map((medicine) => {
            const stockStatus = getStockStatus(medicine);
            return (
              <div
                key={medicine._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Medicine Header */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Pill className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {medicine.name}
                    </h3>
                    <p className="text-sm text-gray-600">{medicine.brand}</p>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="mb-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}
                  >
                    {stockStatus.text}
                  </span>
                </div>

                {/* Medicine Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Generic Name:</span>
                    <span className="text-gray-900">
                      {medicine.genericName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="text-gray-900">{medicine.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Strength:</span>
                    <span className="text-gray-900">{medicine.strength}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className="text-gray-900">
                      {medicine.stockQuantity} units
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="text-gray-900 font-semibold">
                      ${medicine.price}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDetailsClick(medicine)}
                    className="flex-1 btn-secondary text-sm py-2"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </button>
                  {user?.role === "admin" && (
                    <>
                      <button
                        onClick={() => handleEditClick(medicine)}
                        className="btn-primary text-sm py-2"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          deleteMedicineMutation.mutate(medicine._id)
                        }
                        className="btn-danger text-sm py-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Medicine Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Add New Medicine
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(handleCreateMedicine)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Medicine Name</label>
                    <input
                      {...register("name", {
                        required: "Medicine name is required"
                      })}
                      className="input-field"
                      placeholder="Enter medicine name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Generic Name</label>
                    <input
                      {...register("genericName", {
                        required: "Generic name is required"
                      })}
                      className="input-field"
                      placeholder="Enter generic name"
                    />
                    {errors.genericName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.genericName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Brand</label>
                    <input
                      {...register("brand", { required: "Brand is required" })}
                      className="input-field"
                      placeholder="Enter brand name"
                    />
                    {errors.brand && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.brand.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Category</label>
                    <select
                      {...register("category", {
                        required: "Category is required"
                      })}
                      className="input-field"
                    >
                      <option value="">Select category</option>
                      {categoriesData?.categories?.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Dosage Form</label>
                    <select
                      {...register("dosageForm", {
                        required: "Dosage form is required"
                      })}
                      className="input-field"
                    >
                      <option value="">Select dosage form</option>
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="liquid">Liquid</option>
                      <option value="injection">Injection</option>
                      <option value="cream">Cream</option>
                      <option value="ointment">Ointment</option>
                    </select>
                    {errors.dosageForm && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dosageForm.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Strength</label>
                    <input
                      {...register("strength", {
                        required: "Strength is required"
                      })}
                      className="input-field"
                      placeholder="e.g., 500mg, 10ml"
                    />
                    {errors.strength && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.strength.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price", {
                        required: "Price is required",
                        min: 0
                      })}
                      className="input-field"
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      {...register("stockQuantity", {
                        required: "Stock quantity is required",
                        min: 0
                      })}
                      className="input-field"
                      placeholder="0"
                    />
                    {errors.stockQuantity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.stockQuantity.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Reorder Level</label>
                    <input
                      type="number"
                      {...register("reorderLevel", {
                        required: "Reorder level is required",
                        min: 0
                      })}
                      className="input-field"
                      placeholder="0"
                    />
                    {errors.reorderLevel && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.reorderLevel.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Manufacturer</label>
                    <input
                      {...register("manufacturer", {
                        required: "Manufacturer is required"
                      })}
                      className="input-field"
                      placeholder="Enter manufacturer name"
                    />
                    {errors.manufacturer && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.manufacturer.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMedicineMutation.isLoading}
                    className="btn-primary"
                  >
                    {createMedicineMutation.isLoading
                      ? "Adding..."
                      : "Add Medicine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditModal && selectedMedicine && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Edit Medicine
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(handleEditMedicine)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Medicine Name</label>
                    <input
                      {...register("name", {
                        required: "Medicine name is required"
                      })}
                      className="input-field"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Generic Name</label>
                    <input
                      {...register("genericName", {
                        required: "Generic name is required"
                      })}
                      className="input-field"
                    />
                    {errors.genericName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.genericName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Brand</label>
                    <input
                      {...register("brand", { required: "Brand is required" })}
                      className="input-field"
                    />
                    {errors.brand && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.brand.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Category</label>
                    <select
                      {...register("category", {
                        required: "Category is required"
                      })}
                      className="input-field"
                    >
                      <option value="">Select category</option>
                      {categoriesData?.categories?.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Dosage Form</label>
                    <select
                      {...register("dosageForm", {
                        required: "Dosage form is required"
                      })}
                      className="input-field"
                    >
                      <option value="">Select dosage form</option>
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="liquid">Liquid</option>
                      <option value="injection">Injection</option>
                      <option value="cream">Cream</option>
                      <option value="ointment">Ointment</option>
                    </select>
                    {errors.dosageForm && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dosageForm.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Strength</label>
                    <input
                      {...register("strength", {
                        required: "Strength is required"
                      })}
                      className="input-field"
                    />
                    {errors.strength && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.strength.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("price", {
                        required: "Price is required",
                        min: 0
                      })}
                      className="input-field"
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      {...register("stockQuantity", {
                        required: "Stock quantity is required",
                        min: 0
                      })}
                      className="input-field"
                    />
                    {errors.stockQuantity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.stockQuantity.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Reorder Level</label>
                    <input
                      type="number"
                      {...register("reorderLevel", {
                        required: "Reorder level is required",
                        min: 0
                      })}
                      className="input-field"
                    />
                    {errors.reorderLevel && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.reorderLevel.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Manufacturer</label>
                    <input
                      {...register("manufacturer", {
                        required: "Manufacturer is required"
                      })}
                      className="input-field"
                    />
                    {errors.manufacturer && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.manufacturer.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateMedicineMutation.isLoading}
                    className="btn-primary"
                  >
                    {updateMedicineMutation.isLoading
                      ? "Updating..."
                      : "Update Medicine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Medicine Details Modal */}
      {showDetailsModal && selectedMedicine && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedMedicine.name}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Generic Name
                    </h4>
                    <p className="text-gray-600">
                      {selectedMedicine.genericName}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Brand</h4>
                    <p className="text-gray-600">{selectedMedicine.brand}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Category</h4>
                    <p className="text-gray-600">{selectedMedicine.category}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Dosage Form
                    </h4>
                    <p className="text-gray-600 capitalize">
                      {selectedMedicine.dosageForm}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Strength</h4>
                    <p className="text-gray-600">{selectedMedicine.strength}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Manufacturer
                    </h4>
                    <p className="text-gray-600">
                      {selectedMedicine.manufacturer}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-gray-900">Stock</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedMedicine.stockQuantity}
                    </p>
                    <p className="text-sm text-gray-600">units available</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-gray-900">Price</h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${selectedMedicine.price}
                    </p>
                    <p className="text-sm text-gray-600">per unit</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-gray-900">
                        Reorder Level
                      </h4>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedMedicine.reorderLevel}
                    </p>
                    <p className="text-sm text-gray-600">units</p>
                  </div>
                </div>

                {selectedMedicine.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Description
                    </h4>
                    <p className="text-gray-600">
                      {selectedMedicine.description}
                    </p>
                  </div>
                )}

                {selectedMedicine.sideEffects && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Side Effects
                    </h4>
                    <p className="text-gray-600">
                      {selectedMedicine.sideEffects}
                    </p>
                  </div>
                )}

                {selectedMedicine.contraindications && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Contraindications
                    </h4>
                    <p className="text-gray-600">
                      {selectedMedicine.contraindications}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;
