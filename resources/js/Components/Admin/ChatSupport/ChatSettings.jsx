import React, { useState } from 'react';

export default function ChatSettings() {
  const [settings, setSettings] = useState({
    enableChat: true,
    allowFileUpload: false,
    showTypingIndicator: true,
    soundNotifications: false,
  });

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Chat Settings</h2>

      <div className="space-y-3 text-sm">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center border-b py-2">
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={value}
                onChange={() => handleToggle(key)}
              />
              <div className={`w-10 h-5 bg-gray-300 rounded-full shadow-inner transition duration-300 ease-in-out ${value ? 'bg-gray-700' : ''}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${value ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
