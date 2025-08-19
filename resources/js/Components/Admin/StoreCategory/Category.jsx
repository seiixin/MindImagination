import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Category() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get('/admin/store-categories');
    setCategories(res.data);
  };

  const startAddNew = () => {
    setSelected(null);
    setCategoryName('');
    setIsEditing(true);
  };

  const startEdit = (cat) => {
    setSelected(cat);
    setCategoryName(cat.name);
    setIsEditing(true);
  };

  const saveCategory = async () => {
    if (!categoryName.trim()) return;

    if (selected) {
      // Update
      await axios.put(`/admin/store-categories/${selected.id}`, {
        name: categoryName,
      });
    } else {
      // Create
      await axios.post('/admin/store-categories', {
        name: categoryName,
      });
    }
    setIsEditing(false);
    setSelected(null);
    setCategoryName('');
    fetchCategories();
  };

  const deleteCategory = async (cat) => {
    if (confirm(`Delete "${cat.name}"?`)) {
      await axios.delete(`/admin/store-categories/${cat.id}`);
      fetchCategories();
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col space-y-6">

      {/* Header Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={startAddNew}
          className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-full font-medium`}
        >
          ADD NEW CATEGORY
        </button>

        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="SEARCH CATEGORY"
          className={`flex-1 max-w-sm ${neuShadow} bg-gray-200 p-2 rounded-lg outline-none`}
        />
      </div>

      {/* List */}
      <div className="flex flex-wrap gap-3">
        {categories
          .filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((c) => (
            <button
              key={c.id}
              onClick={() => startEdit(c)}
              className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-lg`}
            >
              {c.name}
            </button>
          ))}
      </div>

      {/* FORM PANEL — only show when editing or adding */}
      {isEditing && (
        <div className={`${neuShadow} bg-gray-200 p-5 rounded-lg space-y-4`}>
          <h2 className="text-lg font-bold">
            {selected ? 'EDIT CATEGORY' : 'ADD CATEGORY'}
          </h2>

          <div className="flex flex-col space-y-2">
            <label className="font-medium text-gray-600">Category Name:</label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className={`${neuShadow} bg-white p-3 rounded-lg outline-none`}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-lg`}>
              {selected ? `ID: ${selected.id}` : 'New'}
            </span>
            <button
              onClick={saveCategory}
              className={`${neuShadow} bg-green-400 px-5 py-2 rounded-full font-bold`}
            >
              SAVE
            </button>
          </div>

          {selected && (
            <button
              onClick={() => deleteCategory(selected)}
              className={`${neuShadow} bg-red-300 text-red-800 px-4 py-2 rounded-full font-bold`}
            >
              DELETE
            </button>
          )}
        </div>
      )}
    </div>
  );
}
