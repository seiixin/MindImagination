import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ItemDetail from './ItemDetail.jsx';

export default function Item() {
  const neuShadow = 'shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]';
  const [items, setItems] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [newItem, setNewItem] = useState({
    id: null,
    title: '',
    description: '',
    category_id: '',
    file_path: null,
    cover_image_file: null,
    video_file: null,
    sub_image_file: null,
    download_file: null,
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('/admin/assets');
      setItems(res.data);
    } catch {
      setError('Failed to load items');
    }
  };

  const fetchCategories = async () => {
    const res = await axios.get('/admin/store-categories');
    setCategories(res.data);
  };

    const handleChange = (e) => {
    const { name, value, files } = e.target;

    // handle multiple sub-images
    if (name === 'sub_image_file' && files?.length) {
        setNewItem({ ...newItem, sub_image_file: files }); // store FileList
        return;
    }

    if (files) {
        setNewItem({ ...newItem, [name]: files[0] });     // single-file fields
    } else {
        setNewItem({ ...newItem, [name]: value });
    }
    };

  const handleFormToggle = () => {
    setShowForm(!showForm);
    setNewItem({
      id: null,
      title: '',
      description: '',
      category_id: '',
      file_path: null,
      cover_image_file: null,
      video_file: null,
      sub_image_file: null,
      download_file: null
    });
  };

// Edit existing item — reset file inputs, keep form data
const handleEdit = (item) => {
  setShowForm(true);
  setNewItem({
    id: item.id,
    title: item.title,
    description: item.description,
    category_id: item.category_id,
    file_path: null,
    cover_image_file: null,
    video_file: null,
    sub_image_file: [],     // now array
    download_file: null
  });
};

// Delete
const handleDelete = async (item) => {
  if (!confirm(`Delete "${item.title}"?`)) return;
  await axios.delete(`/admin/assets/${item.id}`);
  fetchItems();
};

// Add / Update
const handleSave = async () => {
  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('user_id', 1);
    formData.append('title', newItem.title);
    formData.append('description', newItem.description);
    formData.append('category_id', newItem.category_id);

    // append file uploads
    if (newItem.file_path)        formData.append('file_path', newItem.file_path);
    if (newItem.cover_image_file) formData.append('cover_image_path', newItem.cover_image_file);
    if (newItem.video_file)       formData.append('video_path', newItem.video_file);
    if (newItem.download_file)    formData.append('download_file_path', newItem.download_file);

    // multiple sub images
    if (newItem.sub_image_file?.length) {
      [...newItem.sub_image_file].forEach((file) =>
        formData.append('sub_image_path[]', file)
      );
    }

    // send request
    if (newItem.id) {
      await axios.post(`/admin/assets/${newItem.id}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      await axios.post('/admin/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }

    handleFormToggle();
    fetchItems();
  } catch (e) {
    console.error(e);
    setError('Failed to save item');
  } finally {
    setLoading(false);
  }
};

  const visibleItems = items.filter((i) => {
    const m1 = i.title.toLowerCase().includes(searchTerm.toLowerCase());
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

      <div className={`transition-all duration-300 overflow-hidden ${showForm ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className={`p-4 rounded-xl bg-[#e0e0e0] ${neuShadow} space-y-3`}>
          <input name="title" placeholder="Item name *" className="w-full p-2 rounded-lg bg-white border"
            value={newItem.title} onChange={handleChange} disabled={loading} />
          <textarea name="description" placeholder="Description" className="w-full p-2 rounded-lg bg-white border"
            value={newItem.description} onChange={handleChange} disabled={loading} />

          <select name="category_id" className="w-full p-2 rounded-lg bg-white border"
            value={newItem.category_id} onChange={handleChange} disabled={loading}>
            <option value="">Choose category *</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>

          {selectedCategory && (
            <div className="text-sm p-2 bg-white rounded-lg border">
              <p><strong>Price:</strong> ₱{parseFloat(selectedCategory.purchase_cost).toFixed(2)}</p>
              <p><strong>Gives Points:</strong> {selectedCategory.additional_points}</p>
            </div>
          )}

          <label className="text-sm">Browse cover image</label>
          <input type="file" name="file_path" className="w-full p-2 rounded-lg bg-white" onChange={handleChange} disabled={loading} />

          <label className="text-sm">Browse video preview</label>
          <input type="file" name="video_file" accept="video/*" className="w-full p-2 rounded-lg bg-white" onChange={handleChange} disabled={loading} />

          <label className="text-sm">Browse extra screenshot</label>
            <input
            type="file"
            name="sub_image_file"
            multiple
            accept="image/*"
            className="w-full p-2 rounded-lg bg-white"
            onChange={handleChange}
            disabled={loading}
            />

          <label className="text-sm">Browse downloadable file (.zip/.exe)</label>
          <input type="file" name="download_file" className="w-full p-2 rounded-lg bg-white" onChange={handleChange} disabled={loading} />

          <button onClick={handleSave} disabled={loading} className={`px-5 py-2 rounded-full text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {loading ? 'Saving...' : newItem.id ? 'Update' : 'Add Item'}
          </button>
        </div>
      </div>


      {/* search/filter */}
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title..."
          className={`p-2 rounded-lg bg-white border flex-1 ${neuShadow}`} />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className={`p-2 rounded-lg bg-white border ${neuShadow}`}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {visibleItems.map((item) => (
          <div key={item.id} className={`p-4 rounded-xl bg-[#e0e0e0] ${neuShadow}`}>
            {item.file_path && (
              <img src={item.file_path} alt={item.title}
                className="w-full h-40 rounded-lg object-cover mb-2" />
            )}

            <h3 className="font-medium">{item.title}</h3>
            <p className="text-xs text-gray-700">{item.description}</p>

            {/* new counts display */}
            <p className="text-xs mt-1"><strong>Comments:</strong> {item.comments?.length ?? 0}</p>
            <p className="text-xs"><strong>Views:</strong> {item.views?.length ?? 0}</p>
            <p className="text-xs"><strong>Favorites:</strong> {item.favorites?.length ?? 0}</p>
            <p className="text-xs"><strong>Avg Rating:</strong> {(item.ratings?.length ? (item.ratings.reduce((t, r) => t + r.rating, 0) / item.ratings.length).toFixed(1) : '0.0')}</p>

            <p className="text-xs mt-1"><strong>Category:</strong> {item.category?.name || 'No Category'}</p>
            <p className="text-xs mb-2">
              <strong>Price:</strong> ₱{parseFloat(item.category?.purchase_cost ?? 0).toFixed(2)}
              {' '}({item.category?.additional_points} pts)
            </p>

            <div className="flex gap-2">
            <button onClick={() => setDetailId(item.id)} className="flex-1 bg-blue-300 px-3 py-1 rounded-lg">View</button>
            <button onClick={() => handleEdit(item)} className="flex-1 bg-yellow-300 px-3 py-1 rounded-lg">Edit</button>
            <button onClick={() => handleDelete(item)} className="flex-1 bg-red-300 px-3 py-1 rounded-lg">Delete</button>
            </div>
          </div>
        ))}
      </div>
      {detailId && (
      <ItemDetail itemId={detailId} onClose={() => setDetailId(null)} />
      )}

    </div>
  );
}
