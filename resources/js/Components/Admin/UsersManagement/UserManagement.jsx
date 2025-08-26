import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function UserManagement({ selectedUser, onBack, defaultFreeRegPoints = 100 }) {
  const [user, setUser] = useState({
    fullName: '',
    userName: '',
    emailAddress: '',
    mobileNumber: '',
    address: '',
    userPoints: '',
    password: '',
    verificationStatus: 'pending',
    activeStatus: 'enabled',
    access: 'viewer',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // track whether admin has manually changed the Points field
  const [userPointsDirty, setUserPointsDirty] = useState(false);

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  // Populate form on selectedUser change
  useEffect(() => {
    if (selectedUser) {
      setUser({
        fullName: selectedUser.fullName || '',
        userName: selectedUser.userName || '',
        emailAddress: selectedUser.emailAddress || '',
        mobileNumber: selectedUser.mobileNumber || '',
        address: selectedUser.address || '',
        userPoints: selectedUser.userPoints?.toString() || '0',
        password: '',
        verificationStatus: selectedUser.verificationStatus || 'pending',
        activeStatus: selectedUser.activeStatus || 'enabled',
        access: selectedUser.access || 'viewer',
      });
      setUserPointsDirty(false);
    } else {
      // ADD USER: mirror the saved default automatically
      setUser({
        fullName: '',
        userName: '',
        emailAddress: '',
        mobileNumber: '',
        address: '',
        userPoints: String(defaultFreeRegPoints ?? 0),
        password: '',
        verificationStatus: 'pending',
        activeStatus: 'enabled',
        access: 'viewer',
      });
      setUserPointsDirty(false);
    }
    setErrors({});
  }, [selectedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // If default changes while adding a new user AND the admin hasn't edited points yet, mirror it live
  useEffect(() => {
    if (!selectedUser && !userPointsDirty) {
      setUser((prev) => ({ ...prev, userPoints: String(defaultFreeRegPoints ?? 0) }));
    }
  }, [defaultFreeRegPoints, selectedUser, userPointsDirty]);

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));

    if (field === 'userPoints') setUserPointsDirty(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!user.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (!user.userName?.trim()) newErrors.userName = 'Username is required';

    if (!user.emailAddress?.trim()) {
      newErrors.emailAddress = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.emailAddress)) {
      newErrors.emailAddress = 'Please enter a valid email address';
    }

    if (!user.mobileNumber?.trim()) newErrors.mobileNumber = 'Mobile number is required';

    if (!user.userPoints && user.userPoints !== '0') {
      newErrors.userPoints = 'Points are required';
    } else if (parseInt(user.userPoints, 10) < 0) {
      newErrors.userPoints = 'Points cannot be negative';
    }

    if (!selectedUser && !user.password?.trim()) {
      newErrors.password = 'Password is required for new users';
    } else if (user.password && user.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const payload = {
      fullName: user.fullName.trim(),
      userName: user.userName.trim(),
      emailAddress: user.emailAddress.trim(),
      mobileNumber: user.mobileNumber.trim(),
      address: user.address?.trim() || '',
      userPoints: parseInt(user.userPoints, 10) || 0,
      password: user.password.trim(),
      verificationStatus: user.verificationStatus,
      activeStatus: user.activeStatus,
      access: user.access,
    };

    if (selectedUser) {
      router.put(`/admin/users/${selectedUser.id}`, payload, {
        onSuccess: () => { setIsSubmitting(false); onBack(); },
        onError: (backendErrors) => {
          setIsSubmitting(false);
          const transformed = {};
          Object.entries(backendErrors).forEach(([k, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            transformed[k] = msg;
            if (k === 'userName' && msg?.includes('already been taken')) {
              transformed[k] = 'This username is already taken. Please choose a different one.';
            } else if (k === 'emailAddress' && msg?.includes('already been taken')) {
              transformed[k] = 'This email address is already registered. Please use a different one.';
            } else if (k === 'mobileNumber' && msg?.includes('already been taken')) {
              transformed[k] = 'This mobile number is already registered. Please use a different one.';
            }
          });
          setErrors(transformed);
        }
      });
    } else {
      router.post('/admin/users', payload, {
        onSuccess: () => { setIsSubmitting(false); onBack(); },
        onError: (backendErrors) => {
          setIsSubmitting(false);
          const transformed = {};
          Object.entries(backendErrors).forEach(([k, msgs]) => {
            const msg = Array.isArray(msgs) ? msgs[0] : msgs;
            transformed[k] = msg;
            if (k === 'userName' && msg?.includes('already been taken')) {
              transformed[k] = 'This username is already taken. Please choose a different one.';
            } else if (k === 'emailAddress' && msg?.includes('already been taken')) {
              transformed[k] = 'This email address is already registered. Please use a different one.';
            } else if (k === 'mobileNumber' && msg?.includes('already been taken')) {
              transformed[k] = 'This mobile number is already registered. Please use a different one.';
            }
          });
          setErrors(transformed);
        }
      });
    }
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setIsSubmitting(true);
      router.delete(`/admin/users/${selectedUser.id}`, {
        onSuccess: () => { setIsSubmitting(false); onBack(); },
        onError: () => { setIsSubmitting(false); alert('Failed to delete user. Please try again.'); }
      });
    }
  };

  const formFields = [
    { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    { key: 'userName', label: 'Username', type: 'text', required: true },
    { key: 'emailAddress', label: 'Email Address', type: 'email', required: true },
    { key: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true },
    { key: 'address', label: 'Address', type: 'text', required: false },
    { key: 'userPoints', label: 'Points', type: 'number', required: true },
  ];

  const selectFields = [
    { key: 'verificationStatus', label: 'Verification Status', options: ['verified', 'unverified', 'pending'] },
    { key: 'activeStatus', label: 'Active Status', options: ['enabled', 'disabled'] },
    { key: 'access', label: 'Access Role', options: ['admin', 'editor', 'viewer'] },
  ];

  return (
    <div className="space-y-6">
      <div className={`bg-gray-200 p-6 rounded-xl ${neuShadow}`}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {formFields.map(({ key, label, type, required }) => (
              <div key={key} className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
                <label className="block text-xs font-bold uppercase mb-2 text-gray-600">
                  {label} {required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={type}
                  value={user[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-gray-200 outline-none text-center ${
                    errors[key] ? 'border-2 border-red-500' : ''
                  }`}
                  min={type === 'number' ? '0' : undefined}
                />
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}

            {/* Password Field */}
            <div className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
              <label className="block text-xs font-bold uppercase mb-2 text-gray-600">
                Password {!selectedUser && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={user.password || ''}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={selectedUser ? 'Leave empty to keep current password' : 'Enter password'}
                className={`w-full px-3 py-2 rounded-xl bg-gray-200 outline-none text-center ${
                  errors.password ? 'border-2 border-red-500' : ''
                }`}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Select Fields */}
            {selectFields.map(({ key, label, options }) => (
              <div key={key} className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
                <label className="block text-xs font-bold uppercase mb-2 text-gray-600">
                  {label}
                </label>
                <select
                  value={user[key] || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl bg-gray-200 outline-none ${
                    errors[key] ? 'border-2 border-red-500' : ''
                  }`}
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
                {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full text-gray-700 font-semibold bg-[#e0e0e0]
                         shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]
                         hover:shadow-[inset_8px_8px_15px_#bebebe,inset_-8px_-8px_15px_#ffffff]
                         transition-all duration-200 ease-in-out"
            >
              {isSubmitting ? 'Processing...' : selectedUser ? 'UPDATE USER' : 'CREATE USER'}
            </button>

            {selectedUser && (
              <button
                type="button"
                onClick={() => {
                  if (!selectedUser) return;
                  if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                    setIsSubmitting(true);
                    router.delete(`/admin/users/${selectedUser.id}`, {
                      onSuccess: () => { setIsSubmitting(false); onBack(); },
                      onError: () => { setIsSubmitting(false); alert('Failed to delete user. Please try again.'); }
                    });
                  }
                }}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-full font-bold text-white bg-red-500 hover:bg-red-600 transition-colors ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                } ${neuShadow}`}
              >
                DELETE USER
              </button>
            )}

            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full text-gray-700 font-semibold bg-[#e0e0e0]
                         shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]
                         hover:shadow-[inset_8px_8px_15px_#bebebe,inset_-8px_-8px_15px_#ffffff]
                         transition-all duration-200 ease-in-out"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>

      {/* User Preview (if editing existing user) */}
      {selectedUser && (
        <div className={`bg-gray-200 p-6 rounded-xl ${neuShadow}`}>
          <h3 className="text-lg font-bold mb-4 text-gray-700">Current User Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-semibold text-gray-600">ID:</span>
              <p className="text-gray-800">{selectedUser.id}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Verification Status:</span>
              <p className="text-gray-800 capitalize">{selectedUser.verificationStatus || 'N/A'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Active Status:</span>
              <p className="text-gray-800 capitalize">{selectedUser.activeStatus || 'N/A'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Access Role:</span>
              <p className="text-gray-800 capitalize">{selectedUser.access || 'N/A'}</p>
            </div>
            <div>
              <span className="font-semibold text-gray-600">Current Points:</span>
              <p className="text-blue-600 font-bold">{selectedUser.userPoints}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Please fix the following errors:</strong>
          <ul className="mt-2">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field} className="text-sm">• {message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
