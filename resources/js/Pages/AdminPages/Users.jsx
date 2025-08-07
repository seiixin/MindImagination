import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { usePage } from '@inertiajs/react';
import UserList from '@/Components/Admin/UsersManagement/UserList';
import UserManagement from '@/Components/Admin/UsersManagement/UserManagement';

export default function Users() {
  const { users: rawUsers = [] } = usePage().props;
  const [currentView, setCurrentView] = useState('list'); // 'list', 'management', or null
  const [selectedUser, setSelectedUser] = useState(null);

  // Debug: Log the raw users data
  console.log('Raw users from backend:', rawUsers);

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const formatUsers = (users) => {
    return users.map((u) => ({
      id: u.id,
      fullName: u.name || '',
      userName: u.username || '',
      emailAddress: u.email || '',
      mobileNumber: u.mobile_number || '',
      address: u.address || '',
      userPoints: u.points || 0,
      password: '',
      verificationStatus: u.verification_status || 'pending',
      activeStatus: u.active_status || 'enabled',
      access: u.role || 'viewer',
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
  };

  const formattedUsers = formatUsers(rawUsers);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCurrentView('management');
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setCurrentView('management');
  };

  const handleBackToMain = () => {
    setCurrentView(null);
    setSelectedUser(null);
  };

  const renderMainView = () => (
    <div className="space-y-6 text-gray-700 max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">USER MANAGEMENT</h1>
      </div>

      <div className={`bg-gray-200 p-6 rounded-xl ${neuShadow}`}>
        <div className="text-center space-y-6">
          <h2 className="text-xl font-semibold text-gray-700">Choose an Action</h2>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setCurrentView('list')}
              className={`px-8 py-4 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors ${neuShadow}`}
            >
              VIEW USER LIST
            </button>

            <button
              onClick={handleAddUser}
              className={`px-8 py-4 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-colors ${neuShadow}`}
            >
              USER MANAGEMENT
            </button>
          </div>

          <div className="text-sm text-gray-600 max-w-md mx-auto">
            <p><strong>User List:</strong> View all users, search, and select users to manage</p>
            <p><strong>User Management:</strong> Create new users or manage existing ones</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      {currentView === null && renderMainView()}

      {currentView === 'list' && (
        <div className="space-y-6 text-gray-700 max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">USER LIST</h1>
            <button
              onClick={handleBackToMain}
              className={`px-5 py-2 rounded-full font-bold bg-gray-500 text-white hover:bg-gray-600 transition-colors ${neuShadow}`}
            >
              Back to Main
            </button>
          </div>

          <UserList
            users={formattedUsers}
            onSelect={handleUserSelect}
            onAddUser={handleAddUser}
          />
        </div>
      )}

      {currentView === 'management' && (
        <div className="space-y-6 text-gray-700 max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              {selectedUser ? 'EDIT USER' : 'ADD USER'}
            </h1>
            <button
              onClick={handleBackToMain}
              className={`px-5 py-2 rounded-full font-bold bg-gray-500 text-white hover:bg-gray-600 transition-colors ${neuShadow}`}
            >
              Back to Main
            </button>
          </div>

          <UserManagement
            selectedUser={selectedUser}
            onBack={handleBackToMain}
          />
        </div>
      )}
    </AdminLayout>
  );
}
