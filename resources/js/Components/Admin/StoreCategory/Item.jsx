import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Item() {
  const neuShadow =
    'shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]';

  const [items, setItems] = useState([]);
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
    price: '',
    file: null
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();

    const timer = setInterval(() => {
      if (!loading) fetchItems();
    }, 10000);
    return () => clearInterval(timer);
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
    if (files) {
      setNewItem({ ...newItem, file: files[0] });
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
      price: '',
      file: null
    });
  };

  const handleEdit = (item) => {
    setShowForm(true);
    setNewItem({
      id: item.id,
      title: item.title,
      description: item.description,
      category_id: item.category_id,
      price: item.price,
      file: null
    });
  };

  const handleDelete = async (item) => {
    if (confirm(`Delete "${item.title}"?`)) {
      await axios.delete(`/admin/assets/${item.id}`);
      fetchItems();
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', 1);
      formData.append('title', newItem.title);
      formData.append('description', newItem.description);
      formData.append('category_id', newItem.category_id);
      formData.append('price', newItem.price);
      if (newItem.file) formData.append('file_path', newItem.file);

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
    } catch {
      setError('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  // search / filter
  const visibleItems = items.filter((i) => {
    const m1 = i.title.toLowerCase().includes(searchTerm.toLowerCase());
    const m2 =
      filterCategory === '' ||
      (i.category && i.category.id === parseInt(filterCategory));
    return m1 && m2;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">Manage Items</h2>
        <button
          onClick={handleFormToggle}
          className={`${neuShadow} bg-blue-200 px-5 py-2 rounded-full`}
        >
          {showForm ? 'CLOSE FORM' : 'ADD NEW ITEM'}
        </button>
      </div>

      {/* Animated form */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          showForm ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className={`p-4 rounded-xl bg-[#e0e0e0] ${neuShadow} space-y-3`}
        >
          <input
            name="title"
            placeholder="Item name *"
            className="w-full p-2 rounded-lg bg-white border"
            value={newItem.title}
            onChange={handleChange}
            disabled={loading}
          />
          <textarea
            name="description"
            placeholder="Description"
            className="w-full p-2 rounded-lg bg-white border"
            value={newItem.description}
            onChange={handleChange}
            disabled={loading}
          />
          <select
            name="category_id"
            className="w-full p-2 rounded-lg bg-white border"
            value={newItem.category_id}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Choose category *</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="price"
            placeholder="Price *"
            type="number"
            min="0"
            className="w-full p-2 rounded-lg bg-white border"
            value={newItem.price}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            type="file"
            name="file"
            accept="image/*"
            className="w-full p-2 rounded-lg bg-white"
            onChange={handleChange}
            disabled={loading}
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-5 py-2 rounded-full text-white ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Saving...' : newItem.id ? 'Update' : 'Add Item'}
          </button>
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
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl bg-[#e00e0e0] ${neuShadow}`}
          >
            {item.file_path && (
              <img
                src={item.file_path}
                alt={item.title}
                className="w-full h-40 rounded-lg object-cover mb-2"
              />
            )}
            <h3 className="font-medium">{item.title}</h3>
            <p className="text-xs text-gray-700">{item.description}</p>
            <p className="text-xs mt-1">
              <strong>Category:</strong>{' '}
              {item.category?.name || 'No Category'}
            </p>
            <p className="text-xs mb-2">
              <strong>Price:</strong> ₱{parseFloat(item.price).toFixed(2)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="flex-1 bg-yellow-300 px-3 py-1 rounded-lg"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="flex-1 bg-red-300 px-3 py-1 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
