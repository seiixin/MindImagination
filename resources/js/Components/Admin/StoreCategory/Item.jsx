import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Item() {
  const neuShadow =
    'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [items, setItems] = useState([]);

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category_id: '',
    price: '',
  });

  // Load items from backend
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/admin/assets');
      setItems(res.data);
    } catch (e) {
      console.error('Failed to fetch assets', e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAddItem = async () => {
    if (newItem.title && newItem.price && newItem.category_id) {
      try {
        await axios.post('/api/admin/assets', {
          user_id: 1, // hardcode or use your logged user ID
          ...newItem,
        });

        setNewItem({ title: '', description: '', category_id: '', price: '' });
        fetchItems();
      } catch (e) {
        console.error('Failed to save asset', e);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Manage Items</h2>

      <div className={`p-4 bg-white rounded-lg ${neuShadow} space-y-3`}>
        <input
          type="text"
          name="title"
          placeholder="Item Name"
          className="w-full p-2 rounded border"
          value={newItem.title}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          className="w-full p-2 rounded border"
          value={newItem.description}
          onChange={handleChange}
        />
        <input
          type="text"
          name="category_id"
          placeholder="Category ID"
          className="w-full p-2 rounded border"
          value={newItem.category_id}
          onChange={handleChange}
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          className="w-full p-2 rounded border"
          value={newItem.price}
          onChange={handleChange}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleAddItem}
        >
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 bg-white rounded-lg ${neuShadow}`}
          >
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
            <p className="text-sm mt-1">
              <strong>Category:</strong> {item.category?.name ?? '—'}
            </p>
            <p className="text-sm">
              <strong>Price:</strong> ₱{parseFloat(item.price).toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
