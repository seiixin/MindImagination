import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function StorePoints() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [paymongoApi, setPaymongoApi] = useState('498159498465465sd4a6sdsf6adsg1a6sd4f6asd4f54Ds54f');
  const [paymongoEdit, setPaymongoEdit] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  const [category, setCategory] = useState({
    name: 'TRIAL POINTS',
    additionalPoints: '3,000',
    purchaseCost: '100 PHP',
  });

  const [categoryEdit, setCategoryEdit] = useState(false);

  const handlePaymongoToggle = () => {
    if (paymongoEdit) {
      alert('PayMongo API saved:\n' + paymongoApi);
    }
    setPaymongoEdit(!paymongoEdit);
  };

  const handleFindCategory = () => {
    alert('Finding categories for:\n' + searchQuery);
  };

  const handleCategoryToggle = () => {
    if (categoryEdit) {
      alert(
        `Saved Points Category:\nName: ${category.name}\nAdditional Points: ${category.additionalPoints}\nPurchase Cost: ${category.purchaseCost}`
      );
    }
    setCategoryEdit(!categoryEdit);
  };

  const handleUpdate = () => {
    alert('Update category:\n' + category.name);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the category:\n"${category.name}"?`)) {
      alert(`Category "${category.name}" deleted.`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10 max-w-4xl mx-auto bg-gray-200 p-10 rounded-xl">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-800">STORE POINTS</h1>

        {/* PayMongo Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase text-gray-700">PayMongo Settings</h2>
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <input
              type="text"
              value={paymongoApi}
              readOnly={!paymongoEdit}
              onChange={(e) => setPaymongoApi(e.target.value)}
              className={`flex-1 p-3 rounded-lg outline-none bg-gray-200 ${neuShadow} ${!paymongoEdit && 'cursor-not-allowed text-gray-500'}`}
            />
            <button
              onClick={handlePaymongoToggle}
              className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}
            >
              {paymongoEdit ? 'Save' : 'Edit'}
            </button>
          </div>
        </section>

        {/* Category Controls */}
        <section className={`${neuShadow} bg-gray-200 p-6 rounded-xl space-y-6`}>
          <div className="flex flex-wrap justify-between gap-4">
            <button
              onClick={() => alert('Add New Points Category clicked')}
              className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}
            >
              Add New Points Category
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search Points Category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 p-3 rounded-lg outline-none bg-gray-200 ${neuShadow}`}
            />
            <button
              onClick={handleFindCategory}
              className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}
            >
              Find
            </button>
          </div>

          {/* Category Form */}
          <div className={`${neuShadow} bg-gray-200 p-6 rounded-lg space-y-6`}>
            <h3 className="text-lg font-bold uppercase tracking-wide text-gray-700">
              Points Category Details
            </h3>

            {['name', 'additionalPoints', 'purchaseCost'].map((field, index) => (
              <div key={index} className="flex flex-wrap gap-4 items-center">
                <label className="min-w-[160px] font-semibold uppercase text-sm text-gray-800">
                  {field === 'name'
                    ? 'Points Category Name'
                    : field === 'additionalPoints'
                    ? 'Additional Points'
                    : 'Purchase Cost'}
                </label>
                <input
                  type="text"
                  value={category[field]}
                  readOnly={!categoryEdit}
                  onChange={(e) =>
                    setCategory((prev) => ({ ...prev, [field]: e.target.value }))
                  }
                  className={`flex-1 p-3 rounded-lg bg-gray-200 outline-none ${neuShadow} ${
                    !categoryEdit && 'cursor-not-allowed text-gray-500'
                  }`}
                />
                {field === 'additionalPoints' && (
                  <div className="text-sm text-gray-600 bg-white border px-3 py-1 rounded-md">
                    MAX INPUT VALUE
                  </div>
                )}
                {field === 'purchaseCost' && (
                  <div className="text-sm text-gray-600 bg-white border px-3 py-1 rounded-md">
                    LINK TO PAYMONGO
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCategoryToggle}
                className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}
              >
                {categoryEdit ? 'Save' : 'Edit'}
              </button>
            </div>
          </div>

          {/* Preview Item (bottom section) */}
          <div className={`${neuShadow} bg-gray-200 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4`}>
            <input
              type="text"
              value={category.name}
              readOnly
              className={`flex-1 p-3 rounded-lg bg-gray-200 outline-none ${neuShadow} cursor-not-allowed text-gray-600`}
            />
            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                className={`px-4 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}
              >
                Update
              </button>
              <button
                onClick={handleDelete}
                className={`px-4 py-2 rounded-full font-semibold uppercase bg-red-200 text-red-700 ${neuShadow}`}
              >
                Delete
              </button>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
