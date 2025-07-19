import React, { useState } from 'react';

export default function Item() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [items, setItems] = useState([
    {
      id: 1,
      name: 'Example Item 1',
      description: 'Description for Item 1',
      category: 'Category A',
      price: 100,
    },
    {
      id: 2,
      name: 'Example Item 2',
      description: 'Description for Item 2',
      category: 'Category B',
      price: 150,
    },
  ]);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewItem({ ...newItem, [name]: value });
  };

  const handleAddItem = () => {
    if (newItem.name && newItem.price && newItem.category) {
      setItems([
        ...items,
        {
          ...newItem,
          id: items.length + 1,
          price: parseFloat(newItem.price),
        },
      ]);
      setNewItem({ name: '', description: '', category: '', price: '' });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Manage Items</h2>

      <div className={`p-4 bg-white rounded-lg ${neuShadow} space-y-3`}>
        <input
          type="text"
          name="name"
          placeholder="Item Name"
          className="w-full p-2 rounded border"
          value={newItem.name}
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
          name="category"
          placeholder="Category"
          className="w-full p-2 rounded border"
          value={newItem.category}
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
          <div key={item.id} className={`p-4 bg-white rounded-lg ${neuShadow}`}>
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.description}</p>
            <p className="text-sm mt-1">
              <strong>Category:</strong> {item.category}
            </p>
            <p className="text-sm">
              <strong>Price:</strong> ₱{item.price.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
