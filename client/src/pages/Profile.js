import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { authAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
    watch,
  } = useForm();

  // Mutations
  const updateProfileMutation = useMutation(
    (data) => authAPI.updateProfile(data),
    {
      onSuccess: (response) => {
        toast.success('Profile updated successfully!');
        updateUser(response.user);
        setIsEditing(false);
        queryClient.invalidateQueries('user');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      },
    }
  );

  const updatePasswordMutation = useMutation(
    (data) => authAPI.updatePassword(data),
    {
      onSuccess: () => {
        toast.success('Password updated successfully!');
        setShowPasswordModal(false);
        resetPassword();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update password');
      },
    }
  );

  const handleEditClick = () => {
    setIsEditing(true);
    setValue('firstName', user?.profile?.firstName || '');
    setValue('lastName', user?.profile?.lastName || '');
    setValue('phone', user?.profile?.phone || '');
    setValue('dateOfBirth', user?.profile?.dateOfBirth ? user.profile.dateOfBirth.split('T')[0] : '');
    setValue('gender', user?.profile?.gender || '');
    setValue('address', user?.profile?.address || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const handleUpdateProfile = (data) => {
    updateProfileMutation.mutate(data);
  };

  const handleUpdatePassword = (data) => {
    updatePasswordMutation.mutate(data);
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'patient': return 'Patient';
      case 'doctor': return 'Doctor';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">
              Manage your account information and settings.
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="btn-primary flex items-center space-x-2"
            >
              <Edit className="h-5 w-5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
        
        {isEditing ? (
          <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">First Name</label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  className="input-field"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Last Name</label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  className="input-field"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input
                  {...register('phone')}
                  className="input-field"
                  placeholder="+1234567890"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="input-field"
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Gender</label>
                <select
                  {...register('gender')}
                  className="input-field"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Address</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="input-field"
                  placeholder="Enter your address..."
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateProfileMutation.isLoading}
                className="btn-primary"
              >
                {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {user?.profile?.firstName} {user?.profile?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{getRoleDisplay(user?.role)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>

                {user?.profile?.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">{user.profile.phone}</p>
                    </div>
                  </div>
                )}

                {user?.profile?.dateOfBirth && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date of Birth</p>
                      <p className="text-sm text-gray-600">
                        {new Date(user.profile.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {user?.profile?.gender && (
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Gender</p>
                      <p className="text-sm text-gray-600 capitalize">{user.profile.gender}</p>
                    </div>
                  </div>
                )}

                {user?.profile?.address && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-600">{user.profile.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-600">Update your account password</p>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="btn-secondary"
            >
              Change Password
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Account Status</h3>
              <p className="text-sm text-gray-600">Your account is active</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Member Since</h3>
              <p className="text-sm text-gray-600">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitPassword(handleUpdatePassword)} className="space-y-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...registerPassword('currentPassword', { required: 'Current password is required' })}
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      {...registerPassword('newPassword', { 
                        required: 'New password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...registerPassword('confirmPassword', { 
                        required: 'Please confirm your password',
                        validate: (value) => value === watch('newPassword') || 'Passwords do not match'
                      })}
                      className="input-field pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatePasswordMutation.isLoading}
                    className="btn-primary"
                  >
                    {updatePasswordMutation.isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
