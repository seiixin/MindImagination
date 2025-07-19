import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import Category from '@/Components/Admin/StoreCategory/Category';
import Item from '@/Components/Admin/StoreCategory/Item';

export default function StoreCategory() {
  const [activeTab, setActiveTab] = useState('store-category');

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  return (
    <AdminLayout>
      <div className={`p-6 max-w-5xl mx-auto bg-gray-200 ${neuShadow} rounded-lg flex flex-col space-y-6`}>
        <h1 className="text-2xl font-semibold text-gray-700 select-none">STORE MANAGEMENT</h1>

        {/* Tab Switch */}
        <div className="flex space-x-3">
          <button
            className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-full font-medium ${
              activeTab === 'store-category' ? 'text-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('store-category')}
          >
            STORE CATEGORY
          </button>
          <button
            className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-full font-medium ${
              activeTab === 'items' ? 'text-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('items')}
          >
            ITEMS
          </button>
        </div>

        {/* Active Panel */}
        {activeTab === 'store-category' ? <Category /> : <Item />}
      </div>
    </AdminLayout>
  );
}
