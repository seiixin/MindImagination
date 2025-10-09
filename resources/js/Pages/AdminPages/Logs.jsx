import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Downloads from '@/Components/Admin/Logs/Downloads';
import Purchases from '@/Components/Admin/Logs/Purchases';
import ActiveGames from '@/Components/Admin/Logs/ActiveGames';

export default function Logs() {
  const [activeTab, setActiveTab] = useState('purchase');

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="flex space-x-4 mb-4">
          {['purchase', 'download'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded ${
                activeTab === tab ? 'bg-gray-700 text-white' : 'bg-gray-200'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'purchase' && <Purchases />}
        {activeTab === 'download' && <Downloads />}
      </div>
    </AdminLayout>
  );
}
