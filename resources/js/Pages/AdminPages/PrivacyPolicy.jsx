import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function AdminPolicySettings() {
  const [activeTab, setActiveTab] = useState('privacy');
  const [isEditing, setIsEditing] = useState(false);

  const [privacyData, setPrivacyData] = useState({
    description:
      'At Mind Imagination, we respect your privacy. This policy describes how we collect and use your data.',
    items: [
      '⚡ We collect email, name, and usage data for platform access.',
      '🔒 We do not share your data without your consent.',
      '🗑️ You can contact support to delete your data anytime.',
    ],
  });

  const [aboutData, setAboutData] = useState({
    description:
      'Mind Imagination is a platform providing high-quality game assets and tools for developers and creators.',
    items: [
      '🎯 Empowering creativity through accessible tools.',
      '🤝 Built by developers, for developers.',
      '📈 Continuously evolving platform.',
    ],
  });

  const currentData = activeTab === 'privacy' ? privacyData : aboutData;

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const handleListChange = (index, value) => {
    const updated = { ...currentData };
    updated.items[index] = value;
    activeTab === 'privacy' ? setPrivacyData(updated) : setAboutData(updated);
  };

  const addListItem = () => {
    const updated = { ...currentData };
    updated.items.push('');
    activeTab === 'privacy' ? setPrivacyData(updated) : setAboutData(updated);
  };

  const removeListItem = (index) => {
    const updated = { ...currentData };
    updated.items.splice(index, 1);
    activeTab === 'privacy' ? setPrivacyData(updated) : setAboutData(updated);
  };

  const handleDescriptionChange = (value) => {
    const updated = { ...currentData, description: value };
    activeTab === 'privacy' ? setPrivacyData(updated) : setAboutData(updated);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      console.log(`Saving ${activeTab} data:`, currentData);
      alert('Changes saved (mock)');
    }
    setIsEditing(!isEditing);
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8 bg-gray-200 rounded-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">📄 Policy Settings</h1>
          <button
            onClick={handleToggleEdit}
            className={`px-5 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow} hover:brightness-95 transition`}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${neuShadow} ${
              activeTab === 'privacy' ? 'bg-gray-300' : 'bg-gray-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${neuShadow} ${
              activeTab === 'about' ? 'bg-gray-300' : 'bg-gray-200'
            }`}
          >
            About Us
          </button>
        </div>

        {/* Main Card */}
        <div className={`p-6 rounded-xl bg-gray-200 space-y-6 ${neuShadow}`}>
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTab === 'privacy' ? 'Privacy Policy' : 'About Us'}
          </h2>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={currentData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows="4"
              disabled={!isEditing}
              className={`w-full p-4 rounded-xl text-sm outline-none resize-none ${
                isEditing ? neuShadow : ''
              } bg-gray-200 disabled:opacity-60`}
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
                  onChange={(e) => handleListChange(index, e.target.value)}
                  disabled={!isEditing}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm outline-none ${
                    isEditing ? neuShadow : ''
                  } bg-gray-200 disabled:opacity-60`}
                />
                {isEditing && (
                  <button
                    onClick={() => removeListItem(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {isEditing && (
              <button
                onClick={addListItem}
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
