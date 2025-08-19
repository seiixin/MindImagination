import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Item() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category_id: '',
    price: '',
  });

  // Load items and categories from backend
  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      // Fixed: Removed /api prefix and used correct endpoint
      const res = await axios.get('/admin/assets');
      setItems(res.data);
      setError('');
    } catch (e) {
      console.error('Failed to fetch assets', e);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fixed: Removed /api prefix and used correct endpoint
      const res = await axios.get('/admin/store-categories');
      setCategories(res.data);
    } catch (e) {
      console.error('Failed to fetch categories', e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAddItem = async () => {
    if (newItem.title && newItem.price && newItem.category_id) {
      try {
        setLoading(true);
        // Fixed: Removed /api prefix and used correct endpoint
        await axios.post('/admin/assets', {
          user_id: 1, // You should get this from authentication context
          ...newItem,
        });

        setNewItem({ title: '', description: '', category_id: '', price: '' });
        await fetchItems();
        setError('');
      } catch (e) {
        console.error('Failed to save asset', e);
        setError('Failed to save item');
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please fill in all required fields');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Manage Items</h2>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className={`p-4 bg-white rounded-lg ${neuShadow} space-y-3`}>
        <input
          type="text"
          name="title"
          placeholder="Item Name *"
          className="w-full p-2 rounded border"
          value={newItem.title}
          onChange={handleChange}
          disabled={loading}
        />
        <textarea
          name="description"
          placeholder="Description"
          className="w-full p-2 rounded border"
          value={newItem.description}
          onChange={handleChange}
          disabled={loading}
        />
        {/* Fixed: Use dropdown for categories instead of text input */}
        <select
          name="category_id"
          className="w-full p-2 rounded border"
          value={newItem.category_id}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="">Select Category *</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="price"
          placeholder="Price *"
          step="0.01"
          min="0"
          className="w-full p-2 rounded border"
          value={newItem.price}
          onChange={handleChange}
          disabled={loading}
        />
        <button
          className={`px-4 py-2 text-white rounded transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={handleAddItem}
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Item'}
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div className="text-center py-4">Loading items...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 bg-white rounded-lg ${neuShadow}`}
            >
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
              <p className="text-sm mt-1">
                <strong>Category:</strong> {item.category?.name ?? 'No Category'}
              </p>
              <p className="text-sm">
                <strong>Price:</strong> ₱{parseFloat(item.price).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items found. Add your first item above.
        </div>
      )}
    </div>
  );
}
