import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Category() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);       // category selected for viewing/editing
  const [categoryName, setCategoryName] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get('/admin/store-categories');
    setCategories(res.data);
  };

  const handleAddNew = () => {
    setSelected(null);
    setCategoryName('');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!categoryName) return;

    if (selected) {
      // update
      await axios.put(`/admin/store-categories/${selected.id}`, {
        name: categoryName,
      });
    } else {
      // create
      await axios.post('/admin/store-categories', {
        name: categoryName,
      });
    }

    setIsEditing(false);
    fetchCategories();
  };

  const handleEdit = (category) => {
    setSelected(category);
    setCategoryName(category.name);
    setIsEditing(true);
  };

  const handleDelete = async (category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      await axios.delete(`/admin/store-categories/${category.id}`);
      setSelected(null);
      setCategoryName('');
      fetchCategories();
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-5">
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
        </div>
      </div>

      {/* Category List */}
      <div className="flex flex-wrap gap-4">
        {categories
          ?.filter((x) =>
            x.name.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .map((cat) => (
            <button
              key={cat.id}
              className={`${neuShadow} px-4 py-2 bg-gray-200 rounded-lg`}
              onClick={() => handleEdit(cat)}
            >
              {cat.name}
            </button>
          ))}
      </div>

      {/* Category Details Panel */}
      <div
        className={`${neuShadow} bg-gray-200 p-5 rounded-lg flex flex-col space-y-4`}
      >
        <h2 className="text-lg font-bold text-gray-700">CATEGORY DETAILS</h2>
        <div className="flex flex-col space-y-2">
          <label className="font-medium text-gray-600">Category Name:</label>
          <input
            type="text"
            value={categoryName}
            readOnly={!isEditing}
            onChange={(e) => setCategoryName(e.target.value)}
            className={`${neuShadow} bg-gray-200 p-3 rounded-lg outline-none ${
              !isEditing && 'cursor-not-allowed text-gray-500'
            }`}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-lg`}>
            {selected ? `ID: ${selected.id}` : 'New'}
          </span>
          {!isEditing ? (
            selected && (
              <button
                className={`${neuShadow} bg-blue-300 px-5 py-2 rounded-full font-bold`}
                onClick={() => setIsEditing(true)}
              >
                EDIT
              </button>
            )
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

      {selected && (
        <div
          className={`${neuShadow} bg-gray-200 p-4 rounded-lg flex flex-wrap items-center space-x-4`}
        >
          <button
            className={`${neuShadow} bg-red-200 text-red-700 px-4 py-2 rounded-full font-medium`}
            onClick={() => handleDelete(selected)}
          >
            DELETE
          </button>
        </div>
      )}
    </div>
  );
}
