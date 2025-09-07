import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Category() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null); // {id, name, additional_points, purchase_cost}

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    additional_points: '',
    purchase_cost: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/admin/store-categories');
      // Controller returns StoreCategory::all() -> array of categories
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('Failed to load categories.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startAddNew = () => {
    setSelected(null);
    setForm({ name: '', additional_points: '', purchase_cost: '' });
    setIsEditing(true);
    setError('');
  };

  const startEdit = (cat) => {
    setSelected(cat);
    setForm({
      name: cat.name ?? '',
      additional_points:
        cat.additional_points === null || cat.additional_points === undefined
          ? ''
          : String(cat.additional_points),
      purchase_cost:
        cat.purchase_cost === null || cat.purchase_cost === undefined
          ? ''
          : String(cat.purchase_cost),
    });
    setIsEditing(true);
    setError('');
  };

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toNumberOrNull = (v, isFloat = false) => {
    if (v === '' || v === null || v === undefined) return null;
    return isFloat ? parseFloat(v) : parseInt(v, 10);
  };

  const saveCategory = async () => {
    const payload = {
      name: form.name?.trim(),
      additional_points: toNumberOrNull(form.additional_points, false),
      purchase_cost: toNumberOrNull(form.purchase_cost, true),
    };

    if (!payload.name) {
      setError('Name is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      if (selected?.id) {
        await axios.put(`/admin/store-categories/${selected.id}`, payload);
      } else {
        await axios.post('/admin/store-categories', payload);
      }

      setIsEditing(false);
      setSelected(null);
      setForm({ name: '', additional_points: '', purchase_cost: '' });
      await fetchCategories();
    } catch (e) {
      // Try to surface Laravel validation errors if present
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.errors
          ? Object.values(e.response.data.errors).flat().join('\n')
          : 'Failed to save category.';
      setError(message);
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (cat) => {
    if (!cat?.id) return;
    if (!confirm(`Delete "${cat.name}"?`)) return;

    try {
      setSaving(true);
      setError('');
      await axios.delete(`/admin/store-categories/${cat.id}`);
      await fetchCategories();
      setSelected(null);
      setIsEditing(false);
    } catch (e) {
      setError('Failed to delete category.');
      console.error(e);
    } finally {
      setSaving(false);
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

      {error && (
        <div className="bg-red-100 text-red-800 border border-red-200 rounded p-3">
          {error}
        </div>
      )}

      {/* List */}
      <div className="flex flex-wrap gap-3">
        {loading ? (
          <span className="text-gray-500">Loading…</span>
        ) : categories.length === 0 ? (
          <span className="text-gray-500">No categories yet.</span>
        ) : (
          categories
            .filter((c) =>
              (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((c) => (
              <button
                key={c.id}
                onClick={() => startEdit(c)}
                className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-lg`}
                title={`+${c.additional_points ?? 0} pts · ₱${c.purchase_cost ?? 0}`}
              >
                {c.name}
              </button>
            ))
        )}
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
              disabled={saving}
              className={`${neuShadow} bg-green-400 px-5 py-2 rounded-full font-bold disabled:opacity-60`}
            >
              {saving ? 'SAVING…' : 'SAVE'}
            </button>
          </div>

          {selected && (
            <button
              onClick={() => deleteCategory(selected)}
              disabled={saving}
              className={`${neuShadow} bg-red-300 text-red-800 px-4 py-2 rounded-full font-bold disabled:opacity-60`}
            >
              {saving ? 'DELETING…' : 'DELETE'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
