import React, { useState } from 'react';

export default function Category() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryName, setCategoryName] = useState('2D MODELS');
  const [bottomInput, setBottomInput] = useState('2D MODELS');
  const [isEditing, setIsEditing] = useState(false); // toggle edit mode

  const handleAddNew = () => {
    setCategoryName('');
    setBottomInput('');
    setIsEditing(true);
    alert('Add new category');
  };

  const handleFind = () => alert(`Find: "${searchTerm}"`);

  const handleSave = () => {
    alert(`Saved: "${categoryName}"`);
    setBottomInput(categoryName);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleUpdate = () => {
    alert(`Updated: "${bottomInput}"`);
    setCategoryName(bottomInput);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${bottomInput}"?`)) {
      alert('Deleted');
      setCategoryName('');
      setBottomInput('');
    }
  };

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  return (
    <div className="flex-1 flex flex-col space-y-5">
      {/* Top Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <button
          className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-full font-medium`}
          onClick={handleAddNew}
        >
          ADD NEW CATEGORY
        </button>
        <div className="flex flex-1 items-center space-x-2">
          <input
            type="search"
            placeholder="SEARCH CATEGORY"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 ${neuShadow} bg-gray-200 p-2 rounded-lg outline-none`}
          />
          <button
            className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-full font-medium`}
            onClick={handleFind}
          >
            FIND
          </button>
        </div>
      </div>

      {/* Category Details Panel */}
      <div className={`${neuShadow} bg-gray-200 p-5 rounded-lg flex flex-col space-y-4`}>
        <h2 className="text-lg font-bold text-gray-700">CATEGORY STORE DETAILS</h2>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Category Name:</label>
          <input
            type="text"
            value={categoryName}
            readOnly={!isEditing}
            onChange={(e) => setCategoryName(e.target.value)}
            className={`${neuShadow} bg-gray-200 p-3 rounded-lg outline-none ${!isEditing && 'cursor-not-allowed text-gray-500'}`}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-lg`}>
            10 ITEMS (VIEW ONLY)
          </span>
          {!isEditing ? (
            <button
              className={`${neuShadow} bg-blue-300 px-5 py-2 rounded-full font-bold`}
              onClick={handleEdit}
            >
              EDIT
            </button>
          ) : (
            <button
              className={`${neuShadow} bg-green-300 px-5 py-2 rounded-full font-bold`}
              onClick={handleSave}
            >
              SAVE
            </button>
          )}
        </div>
      </div>

      {/* Bottom Row Actions */}
      <div
        className={`${neuShadow} bg-gray-200 p-4 rounded-lg flex flex-wrap items-center space-x-4`}
      >
        <label className="font-medium text-gray-600">Edit Category:</label>
        <input
          type="text"
          value={bottomInput}
          onChange={(e) => setBottomInput(e.target.value)}
          className={`${neuShadow} bg-gray-200 p-2 rounded-lg outline-none`}
        />
        <button
          className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-full font-medium`}
          onClick={handleUpdate}
        >
          UPDATE
        </button>
        <button
          className={`${neuShadow} bg-red-200 text-red-700 px-4 py-2 rounded-full font-medium`}
          onClick={handleDelete}
        >
          DELETE
        </button>
      </div>
    </div>
  );
}
