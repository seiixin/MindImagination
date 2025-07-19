import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Users() {
  const [registrationPoints, setRegistrationPoints] = useState(999);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    fullName: 'VIEWING DATA ONLY',
    userName: 'VIEWING DATA ONLY',
    emailAddress: 'VIEWING DATA ONLY',
    mobileNumber: 'VIEWING DATA ONLY',
    address: 'VIEWING DATA ONLY',
    userPoints: 999,
    password: 'qwerty',
    verificationStatus: 'verified',
    activeStatus: 'enabled',
    access: 'admin',
  });

  const handleToggleEdit = () => {
    if (isEditing) {
      alert('User details saved successfully (mock)');
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  return (
    <AdminLayout>
      <div className="space-y-6 text-gray-700 max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">USER LIST</h1>
          <button
            onClick={handleToggleEdit}
            className={`px-6 py-2 rounded-full font-bold bg-gray-200 ${neuShadow}`}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Controls */}
        <div className={`flex flex-wrap gap-4 items-center font-semibold bg-gray-200 p-4 rounded-xl ${neuShadow}`}>
          <label htmlFor="registrationPoints">User Registration Points:</label>
          <input
            id="registrationPoints"
            type="number"
            value={registrationPoints}
            onChange={(e) =>
              setRegistrationPoints(Math.min(3000, Math.max(0, Number(e.target.value))))
            }
            className={`w-24 text-center px-3 py-2 rounded-xl bg-gray-200 outline-none ${neuShadow}`}
            disabled={!isEditing}
          />
          <button className={`px-4 py-2 rounded-full bg-gray-200 ${neuShadow}`} disabled={!isEditing}>
            UPDATE
          </button>
          <button className={`px-4 py-2 rounded-full bg-gray-200 ${neuShadow}`} disabled={!isEditing}>
            ADD USER
          </button>
          <input
            type="text"
            placeholder="Search User"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-grow min-w-[180px] max-w-[350px] px-3 py-2 rounded-xl bg-gray-200 outline-none ${neuShadow}`}
          />
          <button className={`px-4 py-2 rounded-full bg-gray-200 ${neuShadow}`}>
            FIND
          </button>
        </div>

        <hr className="h-1 bg-gray-300 rounded-xl" />

        {/* User Details */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleToggleEdit();
          }}
          className={`bg-gray-200 p-6 rounded-xl space-y-6 ${neuShadow}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {['fullName', 'userName', 'emailAddress', 'mobileNumber', 'address'].map((field) => (
              <div key={field} className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
                <label className="block text-xs font-bold uppercase mb-1 text-gray-600">
                  {field.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </label>
                <input
                  type="text"
                  value={user[field]}
                  onChange={(e) => handleChange(field, e.target.value)}
                  readOnly={!isEditing}
                  className="w-full px-3 py-2 rounded-xl bg-gray-200 outline-none text-center"
                />
              </div>
            ))}

            <div className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-600">
                Add User Points
              </label>
              <input
                type="number"
                value={user.userPoints}
                onChange={(e) => handleChange('userPoints', e.target.value)}
                readOnly={!isEditing}
                className="w-full px-3 py-2 rounded-xl bg-gray-200 outline-none text-center"
              />
            </div>

            <div className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-600">
                Reset User Password
              </label>
              <input
                type="text"
                value={user.password}
                onChange={(e) => handleChange('password', e.target.value)}
                readOnly={!isEditing}
                className="w-full px-3 py-2 rounded-xl bg-gray-200 outline-none text-center"
              />
            </div>

            {[
              {
                id: 'verificationStatus',
                label: 'Verification Status',
                options: ['verified', 'unverified', 'pending'],
              },
              {
                id: 'activeStatus',
                label: 'User Active Status',
                options: ['enabled', 'disabled'],
              },
              {
                id: 'access',
                label: 'User Access',
                options: ['admin', 'editor', 'viewer'],
              },
            ].map(({ id, label, options }) => (
              <div key={id} className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
                <label className="block text-xs font-bold uppercase mb-1 text-gray-600">
                  {label}
                </label>
                <select
                  value={user[id]}
                  onChange={(e) => handleChange(id, e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 rounded-xl bg-gray-200 outline-none"
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </form>

        {/* Bottom Actions */}
        <div className="flex flex-wrap gap-4 pt-6">
          {['fullName', 'userName', 'emailAddress'].map((field) => (
            <div key={field} className={`p-4 rounded-xl bg-gray-200 ${neuShadow}`}>
              <label className="block text-xs font-bold uppercase mb-1 text-gray-600">
                {field.replace(/([A-Z])/g, ' $1').toUpperCase()}
              </label>
              <input
                type="text"
                value={user[field]}
                readOnly
                className="w-full px-3 py-2 rounded-xl bg-gray-200 outline-none text-center"
              />
            </div>
          ))}

          <button
            className={`px-5 py-2 rounded-full bg-gray-200 font-semibold ${neuShadow}`}
            disabled={!isEditing}
          >
            UPDATE USER
          </button>
          <button
            className={`px-5 py-2 rounded-full text-red-600 font-semibold bg-gray-200 ${neuShadow} hover:text-white hover:bg-red-500 transition`}
            disabled={!isEditing}
          >
            DELETE USER
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
