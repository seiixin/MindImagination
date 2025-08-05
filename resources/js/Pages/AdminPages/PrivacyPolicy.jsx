import { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminPolicySettings() {
  const [policies, setPolicies] = useState({
    privacy: { description: '', items: [] },
    about: { description: '', items: [] },
  });

  const [activeTab, setActiveTab] = useState('privacy');
  const [isEditing, setIsEditing] = useState(false);
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  useEffect(() => {
    axios.get('/admin/policy')
      .then(res => setPolicies(prev => ({ ...prev, ...res.data })))
      .catch(err => {
        console.error('Failed to load policies:', err);
        alert('Failed to load policies.');
      });
  }, []);

  const currentData = policies[activeTab] || { description: '', items: [] };

  const handleChange = (key, value) => {
    const updated = { ...currentData, [key]: value };
    setPolicies(prev => ({ ...prev, [activeTab]: updated }));
  };

  const handleItemChange = (index, value) => {
    const updatedItems = [...currentData.items];
    updatedItems[index] = value;
    handleChange('items', updatedItems);
  };

  const addItem = () => {
    handleChange('items', [...currentData.items, '']);
  };

  const removeItem = (index) => {
    const updatedItems = currentData.items.filter((_, i) => i !== index);
    handleChange('items', updatedItems);
  };

const handleSave = async () => {
  const payload = {
    description: currentData.description || null,
    items: currentData.items.filter(item => item.trim() !== ''),
  };

  try {
    // First try to update
    await axios.put(`/admin/policy/${activeTab}`, payload);
    alert('Changes saved!');
    setIsEditing(false);
  } catch (err) {
    console.error('Save failed:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    if (err.response?.status === 404) {
      // If policy doesn't exist, create it
      try {
        await axios.post('/admin/policy', {
          type: activeTab,
          ...payload
        });
        alert('Policy created and saved!');
        setIsEditing(false);
      } catch (createErr) {
        console.error('Create failed:', createErr);
        alert('Error creating policy.');
      }
    } else if (err.response?.status === 401) {
      alert('You are not authenticated. Please log in again.');
    } else {
      alert('Error saving changes.');
    }
  }
};

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 bg-gray-200 rounded-xl">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">📄 Policy Settings</h1>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`px-5 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow} hover:brightness-95 transition`}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          {['privacy', 'about'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setIsEditing(false);
              }}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${neuShadow} ${activeTab === tab ? 'bg-gray-300' : 'bg-gray-200'}`}
            >
              {tab === 'privacy' ? 'Privacy Policy' : 'About Us'}
            </button>
          ))}
        </div>

        {/* Policy Editor Card */}
        <div className={`p-6 rounded-xl bg-gray-200 space-y-6 ${neuShadow}`}>
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTab === 'privacy' ? 'Privacy Policy' : 'About Us'}
          </h2>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={currentData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows="4"
              disabled={!isEditing}
              className={`w-full p-4 rounded-xl text-sm outline-none resize-none ${isEditing ? neuShadow : ''} bg-gray-200 disabled:opacity-60`}
            />
          </div>

          {/* Bullet Points */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Bullet Points</label>
            {currentData.items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  disabled={!isEditing}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm outline-none ${isEditing ? neuShadow : ''} bg-gray-200 disabled:opacity-60`}
                />
                {isEditing && (
                  <button
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={addItem}
                className="text-sm text-[#1e293b] font-semibold hover:underline"
              >
                + Add Item
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
