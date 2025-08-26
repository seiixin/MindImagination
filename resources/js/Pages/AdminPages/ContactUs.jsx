import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminContactSettings() {
  const [formData, setFormData] = useState({
    email: '',
    facebook: '',
    discord: '',
    phone: '',
    address: '',
    website: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    axios.get('/admin/contact-setting').then(res => {
      setFormData(res.data);
    });
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleEdit = async () => {
    if (isEditing) {
      try {
        const res = await axios.put('/admin/contact-setting', formData);
        alert('Successfully updated contact settings');
      } catch (err) {
        console.error(err);
        alert('Failed to update');
      }
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
          {[
            { label: 'Portforward Email Address', name: 'email', type: 'email' },
            { label: 'Facebook URL Link', name: 'facebook' },
            { label: 'Discord URL Link', name: 'discord' },
            { label: 'Phone Number', name: 'phone' },
            { label: 'Physical Address', name: 'address' },
          ].map(({ label, name, type = 'text' }) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                placeholder={`Enter ${label}`}
                value={formData[name] || ''}
                disabled={!isEditing}
                onChange={(e) => handleChange(name, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e293b] disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
