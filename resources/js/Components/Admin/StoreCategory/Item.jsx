import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ItemDetail from './ItemDetail.jsx';

export default function Item() {
  const neuShadow = 'shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]';

  const [items, setItems] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);   // page-level loading
  const [saving, setSaving] = useState(false);     // form saving state
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [newItem, setNewItem] = useState({
    id: null,
    title: '',
    description: '',
    category_id: '',
    // file inputs (MUST match backend field names)
    file_path: null,            // main image
    cover_image_path: null,     // cover image
    video_path: null,           // video file
    sub_image_path: [],         // multiple images
    download_file_path: null,   // downloadable file
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/admin/assets');
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/admin/store-categories');
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {
      // ignore
    }
  };

  const resetForm = () => {
    setNewItem({
      id: null,
      title: '',
      description: '',
      category_id: '',
      file_path: null,
      cover_image_path: null,
      video_path: null,
      sub_image_path: [],
      download_file_path: null,
    });
  };

  const handleFormToggle = () => {
    setShowForm((v) => !v);
    setError('');
    resetForm();
  };

  // Edit existing item — reset file inputs, keep text/category
  const handleEdit = (item) => {
    setShowForm(true);
    setError('');
    setNewItem({
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      category_id: item.category_id || '',
      file_path: null,
      cover_image_path: null,
      video_path: null,
      sub_image_path: [],
      download_file_path: null,
    });
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    try {
      await axios.delete(`/admin/assets/${item.id}`);
      fetchItems();
    } catch {
      setError('Failed to delete item');
    }
  };

  const handleChange = (e) => {
    const { name, value, files, multiple } = e.target;

    if (files) {
      if (multiple) {
        setNewItem((s) => ({ ...s, [name]: Array.from(files) }));
      } else {
        setNewItem((s) => ({ ...s, [name]: files[0] }));
      }
    } else {
      setNewItem((s) => ({ ...s, [name]: value }));
    }
  };

  // Previews
  const imgPreview = (file) => (file ? URL.createObjectURL(file) : null);
  const thumbPreviews = useMemo(
    () => (newItem.sub_image_path || []).map((f) => URL.createObjectURL(f)),
    [newItem.sub_image_path]
  );

  // Add / Update
  const handleSave = async () => {
    if (!newItem.title?.trim() || !newItem.category_id) {
      setError('Title and Category are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('user_id', 1); // TODO: replace with actual user id
      formData.append('title', newItem.title);
      formData.append('description', newItem.description || '');
      formData.append('category_id', newItem.category_id || '');

      if (newItem.file_path)         formData.append('file_path', newItem.file_path);
      if (newItem.cover_image_path)  formData.append('cover_image_path', newItem.cover_image_path);
      if (newItem.video_path)        formData.append('video_path', newItem.video_path);
      if (newItem.download_file_path)formData.append('download_file_path', newItem.download_file_path);
      if (newItem.sub_image_path?.length) {
        newItem.sub_image_path.forEach((file) => formData.append('sub_image_path[]', file));
      }

      if (newItem.id) {
        await axios.post(`/admin/assets/${newItem.id}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post('/admin/assets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      handleFormToggle();
      fetchItems();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        (e?.response?.data?.errors
          ? Object.values(e.response.data.errors).flat().join('\n')
          : 'Failed to save item');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const visibleItems = items.filter((i) => {
    const m1 = (i.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const m2 = filterCategory === '' || (i.category && i.category.id === parseInt(filterCategory));
    return m1 && m2;
  });

  const selectedCategory = categories.find((c) => c.id === parseInt(newItem.category_id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">Manage Items</h2>
        <button onClick={handleFormToggle} className={`${neuShadow} bg-blue-200 px-5 py-2 rounded-full`}>
          {showForm ? 'CLOSE FORM' : 'ADD NEW ITEM'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-800 border border-red-200 rounded p-3 whitespace-pre-line">
          {error}
        </div>
      )}

      <div className={`transition-all duration-300 overflow-hidden ${showForm ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className={`p-4 rounded-xl bg-[#e0e0e0] ${neuShadow} space-y-3`}>
          <input
            name="title"
            placeholder="Item name *"
            className="w-full p-2 rounded-lg bg-white border"
            value={newItem.title}
            onChange={handleChange}
            disabled={saving}
          />
          <textarea
            name="description"
            placeholder="Description"
            className="w-full p-2 rounded-lg bg-white border"
            value={newItem.description}
            onChange={handleChange}
            disabled={saving}
          />

          <select
            name="category_id"
            className="w-full p-2 rounded-lg bg-white border"
            value={newItem.category_id}
            onChange={handleChange}
            disabled={saving}
          >
            <option value="">Choose category *</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {selectedCategory && (
            <div className="text-sm p-2 bg-white rounded-lg border">
              <p><strong>Gives Points:</strong> {selectedCategory.additional_points ?? 0}</p>
              <p><strong>Default Price:</strong> ₱{parseFloat(selectedCategory.purchase_cost ?? 0).toFixed(2)}</p>
            </div>
          )}

          {/* Main image */}
          <label className="text-sm">Main image (file_path)</label>
          <input
            type="file"
            name="file_path"
            accept="image/*"
            className="w-full p-2 rounded-lg bg-white"
            onChange={handleChange}
            disabled={saving}
          />
          {imgPreview(newItem.file_path) && (
            <img src={imgPreview(newItem.file_path)} alt="preview" className="w-full h-40 object-cover rounded-lg" />
          )}

          {/* Cover image */}
          <label className="text-sm">Cover image (cover_image_path)</label>
          <input
            type="file"
            name="cover_image_path"
            accept="image/*"
            className="w-full p-2 rounded-lg bg-white"
            onChange={handleChange}
            disabled={saving}
          />
          {imgPreview(newItem.cover_image_path) && (
            <img src={imgPreview(newItem.cover_image_path)} alt="preview" className="w-full h-40 object-cover rounded-lg" />
          )}

          {/* Video */}
          <label className="text-sm">Video preview (video_path)</label>
          <input
            type="file"
            name="video_path"
            accept="video/*"
            className="w-full p-2 rounded-lg bg-white"
            onChange={handleChange}
            disabled={saving}
          />
          {newItem.video_path && (
            <video src={URL.createObjectURL(newItem.video_path)} controls className="w-full rounded-lg max-h-64" />
          )}

          {/* Multiple sub images */}
          <label className="text-sm">Extra screenshots (sub_image_path[])</label>
          <input
            type="file"
            name="sub_image_path"
            multiple
            accept="image/*"
            className="w-full p-2 rounded-lg bg-white"
            onChange={handleChange}
            disabled={saving}
          />
          {thumbPreviews.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {thumbPreviews.map((src, i) => (
                <img key={i} src={src} className="w-20 h-20 object-cover rounded-md" />
              ))}
            </div>
          )}

          {/* Downloadable file */}
          <label className="text-sm">Downloadable file (.zip/.exe) (download_file_path)</label>
          <input
            type="file"
            name="download_file_path"
            className="w-full p-2 rounded-lg bg-white"
            onChange={handleChange}
            disabled={saving}
          />

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2 rounded-full text-white ${saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saving ? 'Saving...' : newItem.id ? 'Update' : 'Add Item'}
            </button>
            <button
              onClick={handleFormToggle}
              disabled={saving}
              className="px-5 py-2 rounded-full bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* search/filter */}
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title..."
          className={`p-2 rounded-lg bg-white border flex-1 ${neuShadow}`}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={`p-2 rounded-lg bg-white border ${neuShadow}`}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center text-gray-600">Loading…</div>
        ) : (
          visibleItems.map((item) => (
            <div key={item.id} className={`p-4 rounded-xl bg-[#e0e0e0] ${neuShadow}`}>
              {(item.file_path || item.cover_image_path) && (
                <img
                  src={item.file_path || item.cover_image_path}
                  alt={item.title}
                  className="w-full h-40 rounded-lg object-cover mb-2"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}

              <h3 className="font-medium">{item.title}</h3>
              <p className="text-xs text-gray-700">{item.description}</p>

              <p className="text-xs mt-1"><strong>Comments:</strong> {item.comments?.length ?? 0}</p>
              <p className="text-xs"><strong>Views:</strong> {item.views?.length ?? 0}</p>
              <p className="text-xs"><strong>Favorites:</strong> {item.favorites?.length ?? 0}</p>
              <p className="text-xs">
                <strong>Avg Rating:</strong>{' '}
                {item.ratings?.length
                  ? (item.ratings.reduce((t, r) => t + r.rating, 0) / item.ratings.length).toFixed(1)
                  : '0.0'}
              </p>

              <p className="text-xs mt-1"><strong>Category:</strong> {item.category?.name || 'No Category'}</p>
              <p className="text-xs mb-2">
                <strong>Price:</strong> ₱{parseFloat(item.category?.purchase_cost ?? 0).toFixed(2)} ({item.category?.additional_points ?? 0} pts)
              </p>

              <div className="flex gap-2">
                <button onClick={() => setDetailId(item.id)} className="flex-1 bg-blue-300 px-3 py-1 rounded-lg">View</button>
                <button onClick={() => handleEdit(item)} className="flex-1 bg-yellow-300 px-3 py-1 rounded-lg">Edit</button>
                <button onClick={() => handleDelete(item)} className="flex-1 bg-red-300 px-3 py-1 rounded-lg">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {detailId && <ItemDetail itemId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
