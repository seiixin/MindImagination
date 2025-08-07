import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';

export default function UserList({ users, onSelect, onAddUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState('userName');
  const [sortField, setSortField] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
      router.delete(`/admin/users/${id}`, {
        preserveScroll: true,
        onSuccess: () => {
          console.log('User deleted successfully.');
        },
        onError: () => {
          alert('Failed to delete the user.');
        },
      });
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const fieldValue = user[searchField]?.toString().toLowerCase() || '';
    return fieldValue.includes(searchQuery.toLowerCase());
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField]?.toString().toLowerCase() || '';
    const bValue = b[sortField]?.toString().toLowerCase() || '';
    return sortOrder === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-yellow-100 text-yellow-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'enabled':
        return 'bg-green-100 text-green-800';
      case 'unverified':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className={`bg-gray-200 p-4 rounded-xl ${neuShadow}`}>
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={onAddUser}
            className="px-6 py-3 rounded-full text-gray-700 font-semibold bg-[#e0e0e0]
              shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]
              hover:shadow-[inset_8px_8px_15px_#bebebe,inset_-8px_-8px_15px_#ffffff]
              transition-all duration-200 ease-in-out"
          >
            ADD NEW USER
          </button>

          <div className="flex items-center gap-2">
            <label className="font-semibold">Search by:</label>
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className={`px-3 py-2 rounded-xl bg-gray-200 outline-none ${neuShadow}`}
            >
              <option value="userName">Username</option>
              <option value="fullName">Full Name</option>
              <option value="emailAddress">Email</option>
              <option value="mobileNumber">Mobile</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-grow max-w-md px-3 py-2 rounded-xl bg-gray-200 outline-none ${neuShadow}`}
          />

          <div className="text-sm font-semibold text-gray-600">
            Found: {sortedUsers.length} users
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`bg-gray-200 rounded-xl ${neuShadow} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-300">
                {[
                  { label: 'Full Name', field: 'fullName' },
                  { label: 'Username', field: 'userName' },
                  { label: 'Email', field: 'emailAddress' },
                  { label: 'Points', field: 'userPoints' },
                  { label: 'Role', field: 'access' },
                ].map(({ label, field }) => (
                  <th
                    key={field}
                    className="px-4 py-3 text-left font-bold cursor-pointer hover:bg-gray-400 transition-colors"
                    onClick={() => handleSort(field)}
                  >
                    {label} {sortField === field && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-bold">Mobile</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-center font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No users found matching your search criteria
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold">{user.fullName}</td>
                    <td className="px-4 py-3">{user.userName}</td>
                    <td className="px-4 py-3 text-sm">{user.emailAddress}</td>
                    <td className="px-4 py-3 font-bold text-blue-600">{user.userPoints}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getRoleColor(user.access)}`}>
                        {user.access?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">{user.mobileNumber}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(user.verificationStatus)}`}>
                          {user.verificationStatus?.toUpperCase()}
                        </span>
                        <br />
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(user.activeStatus)}`}>
                          {user.activeStatus?.toUpperCase()}
                        </span>
                      </div>
                    </td>

<td className="px-4 py-3 text-center space-x-2">
  <button
    onClick={() => onSelect(user)}
    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
    title="Edit"
  >
    <Pencil className="w-4 h-4" />
  </button>
  <button
    onClick={() => handleDelete(user.id)}
    className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
    title="Delete"
  >
    <Trash2 className="w-4 h-4" />
  </button>
</td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
