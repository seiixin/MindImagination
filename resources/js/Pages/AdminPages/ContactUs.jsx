import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminContactSettings() {
  const [formData, setFormData] = useState({
    email: 'support@mindimagination.com',
    facebook: 'https://facebook.com/mindimagination',
    discord: 'https://discord.gg/mindimagination',
    phone: '+63 912 345 6789',
    address: '123 Tech St, Bacoor City, Cavite, PH',
    website: 'https://mindimagination.com/contact',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // mock save — replace with real API later
      console.log('Saving Contact Us data:', formData);
      alert('Contact info updated (mock)');
    }
    setIsEditing(!isEditing);
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">📨 Contact Us Settings</h1>
          <button
            onClick={handleToggleEdit}
            className="px-4 py-2 bg-[#1e293b] text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        <div className="bg-white shadow border border-gray-200 rounded-xl p-6 space-y-6">

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Portforward Email Address</label>
            <input
              type="email"
              placeholder="Enter Email Address"
              value={formData.email}
              disabled={!isEditing}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b] disabled:bg-gray-100"
            />
          </div>

          {/* Facebook */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Facebook URL Link</label>
            <input
              type="text"
              placeholder="Enter URL Link"
              value={formData.facebook}
              disabled={!isEditing}
              onChange={(e) => handleChange('facebook', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b] disabled:bg-gray-100"
            />
          </div>

          {/* Discord */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Discord URL Link</label>
            <input
              type="text"
              placeholder="Enter URL Link"
              value={formData.discord}
              disabled={!isEditing}
              onChange={(e) => handleChange('discord', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b] disabled:bg-gray-100"
            />
          </div>

          {/* Additional Contact Info */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
            <input
              type="text"
              placeholder="Enter Phone Number"
              value={formData.phone}
              disabled={!isEditing}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b] disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Physical Address</label>
            <input
              type="text"
              placeholder="Enter Office Address"
              value={formData.address}
              disabled={!isEditing}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b] disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Form URL</label>
            <input
              type="text"
              placeholder="Enter Contact Page Link"
              value={formData.website}
              disabled={!isEditing}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b] disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
