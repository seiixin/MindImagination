import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Category() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null); // {id, name, additional_points, purchase_cost}

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    additional_points: '',
    purchase_cost: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    // Keep using the same data source used by StorePoints before
    const res = await axios.get('/admin/store-points/data');
    setCategories(res.data.categories || []);
  };

  const startAddNew = () => {
    setSelected(null);
    setForm({ name: '', additional_points: '', purchase_cost: '' });
    setIsEditing(true);
  };

  const startEdit = (cat) => {
    setSelected(cat);
    setForm({
      name: cat.name ?? '',
      additional_points: String(cat.additional_points ?? ''),
      purchase_cost: String(cat.purchase_cost ?? ''),
    });
    setIsEditing(true);
  };

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const saveCategory = async () => {
    const payload = {
      name: form.name?.trim(),
      // Keep raw strings; let backend validate/parse (or implement parseFloat if needed):
      additional_points: form.additional_points,
      purchase_cost: form.purchase_cost,
    };

    if (!payload.name) return;

    if (selected?.id) {
      await axios.put(`/admin/store-points/${selected.id}`, payload);
    } else {
      await axios.post('/admin/store-points', payload);
    }

    setIsEditing(false);
    setSelected(null);
    setForm({ name: '', additional_points: '', purchase_cost: '' });
    fetchCategories();
  };

  const deleteCategory = async (cat) => {
    if (confirm(`Delete "${cat.name}"?`)) {
      await axios.delete(`/admin/store-points/${cat.id}`);
      fetchCategories();
      setSelected(null);
      setIsEditing(false);
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
          .filter((c) => (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
          .map((c) => (
            <button
              key={c.id}
              onClick={() => startEdit(c)}
              className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-lg`}
              title={`+${c.additional_points || 0} pts · ₱${c.purchase_cost || 0}`}
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

          {/* Name */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium text-gray-600">Category Name</label>
            <input
              type="text"
              value={form.name}
              onChange={onChange('name')}
              className={`${neuShadow} bg-white p-3 rounded-lg outline-none`}
            />
          </div>

          {/* Additional Points */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium text-gray-600">Additional Points</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.additional_points}
              onChange={onChange('additional_points')}
              className={`${neuShadow} bg-white p-3 rounded-lg outline-none`}
            />
          </div>

          {/* Purchase Cost */}
          <div className="flex flex-col space-y-2">
            <label className="font-medium text-gray-600">Purchase Cost</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 rounded-lg bg-gray-100">₱</span>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={form.purchase_cost}
                onChange={onChange('purchase_cost')}
                className={`${neuShadow} bg-white p-3 rounded-lg outline-none flex-1`}
              />
            </div>
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
