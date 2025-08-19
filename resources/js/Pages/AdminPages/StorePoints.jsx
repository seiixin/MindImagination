import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

export default function StorePoints() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  const [paymongoPublic, setPaymongoPublic] = useState('');
  const [paymongoSecret, setPaymongoSecret] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [editSecret, setEditSecret] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryEdit, setCategoryEdit] = useState(false);
  const [category, setCategory] = useState({
    id: '',
    name: '',
    additional_points: '',
    purchase_cost: ''
  });

  /* ===============================
      LOAD DATA
  ===============================*/
  useEffect(() => {
    axios.get('/admin/store-points/data').then(res => {
      setCategories(res.data.categories);
    });
  }, []);

  /* ===============================
      SAVE PAYMONGO PUBLIC KEY
  ===============================*/
  const handleTogglePublic = async () => {
    if (editPublic) {
      await axios.post('/admin/store-points/source', {
        key_type: 'public', value: paymongoPublic
      });
      alert('Public key saved!');
    }
    setEditPublic(!editPublic);
  };

  /* ===============================
      SAVE PAYMONGO SECRET KEY
  ===============================*/
  const handleToggleSecret = async () => {
    if (editSecret) {
      await axios.post('/admin/store-points/source', {
        key_type: 'secret', value: paymongoSecret
      });
      alert('Secret key saved!');
    }
    setEditSecret(!editSecret);
  };

  /* ===============================
      SAVE CATEGORY
  ===============================*/
  const handleCategoryToggle = async () => {
    if (categoryEdit) {
      if (category.id) {
        await axios.put(`/admin/store-points/${category.id}`, category);
        alert('Category updated!');
      } else {
        await axios.post(`/admin/store-points`, category);
        alert('Category added!');
      }
    }
    setCategoryEdit(!categoryEdit);
  };

  /* ===============================
      UPDATE BUTTON
  ===============================*/
  const handleUpdate = (c) => {
    setCategory(c);
    setCategoryEdit(true);
  };

  /* ===============================
      DELETE CATEGORY
  ===============================*/
  const handleDelete = async (c) => {
    if (confirm(`Delete "${c.name}"?`)) {
      await axios.delete(`/admin/store-points/${c.id}`);
      alert('Deleted!');
    }
  };

  /* ===============================
      FIND CATEGORY
  ===============================*/
  const handleFindCategory = () => {
    const c = categories.find(x => x.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (c) setCategory(c);
    else alert('Not found');
  };

  /* ===============================
      TEST PAYMENT
  ===============================*/
  const testPayment = async () => {
    const src = await axios.post('/admin/store-points/source', {
      amount: 10000,
      type: 'gcash'
    });
    console.log(src.data);
    alert(`Source created: ${src.data.data.id}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-10 max-w-4xl mx-auto bg-gray-200 p-10 rounded-xl">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-gray-800">STORE POINTS</h1>

        {/* PayMongo Settings */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold uppercase text-gray-700">PayMongo Settings</h2>

          {/* Public Key */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <input
              type="text"
              value={paymongoPublic}
              readOnly={!editPublic}
              onChange={(e) => setPaymongoPublic(e.target.value)}
              className={`flex-1 p-3 rounded-lg outline-none bg-gray-200 ${neuShadow} ${!editPublic && 'cursor-not-allowed text-gray-500'}`}
              placeholder="Public Key"
            />
            <button onClick={handleTogglePublic} className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}>
              {editPublic ? 'Save' : 'Edit'}
            </button>
          </div>

          {/* Secret Key */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <input
              type="text"
              value={paymongoSecret}
              readOnly={!editSecret}
              onChange={(e) => setPaymongoSecret(e.target.value)}
              className={`flex-1 p-3 rounded-lg outline-none bg-gray-200 ${neuShadow} ${!editSecret && 'cursor-not-allowed text-gray-500'}`}
              placeholder="Secret Key"
            />
            <button onClick={handleToggleSecret} className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}>
              {editSecret ? 'Save' : 'Edit'}
            </button>
          </div>
        </section>

        {/* Category Controls */}
        <section className={`${neuShadow} bg-gray-200 p-6 rounded-xl space-y-6`}>
          <div className="flex justify-between gap-4">
            <button onClick={() => setCategory({ id: '', name: '', additional_points: '', purchase_cost: '' })} className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}>
              Add New Points Category
            </button>
            <button onClick={testPayment} className="px-6 py-2 rounded-full font-semibold uppercase bg-green-500 text-white">
              Test PayMongo
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search Points Category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 p-3 rounded-lg outline-none bg-gray-200 ${neuShadow}`}
            />
            <button onClick={handleFindCategory} className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}>Find</button>
          </div>

          {/* Category Form */}
          <div className={`${neuShadow} bg-gray-200 p-6 rounded-lg space-y-6`}>
            <h3 className="text-lg font-bold uppercase tracking-wide text-gray-700">Points Category Details</h3>

{[
  { key: 'name', label: 'Points Category Name' },
  { key: 'additional_points', label: 'Additional Points' },
  { key: 'purchase_cost', label: 'Purchase Cost' }
].map(({ key, label }) => (
  <div key={key} className="flex flex-wrap gap-4 items-center">
    <label className="min-w-[160px] font-semibold uppercase text-sm text-gray-800">{label}</label>
    <input
      type="text"
      name={key}
      value={category[key]}
      readOnly={!categoryEdit}
      onChange={(e) => setCategory(prev => ({ ...prev, [key]: e.target.value }))}
      className={`flex-1 p-3 rounded-lg bg-gray-200 outline-none ${neuShadow} ${
        !categoryEdit && 'cursor-not-allowed text-gray-500'
      }`}
    />
  </div>
))}


            <div className="flex justify-end">
              <button onClick={handleCategoryToggle} className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}>
                {categoryEdit ? 'Save' : 'Edit'}
              </button>
            </div>
          </div>

          {/* List of Categories */}
          {categories.map(c => (
            <div key={c.id} className={`${neuShadow} bg-gray-200 p-4 rounded-lg flex items-center justify-between`}>
              <input type="text" value={c.name} readOnly className={`flex-1 p-3 rounded-lg bg-gray-200 outline-none ${neuShadow} cursor-not-allowed text-gray-600`} />
              <div className="flex gap-2 ml-2">
                <button onClick={() => handleUpdate(c)} className="px-4 py-2 rounded-full font-semibold uppercase bg-gray-200">Update</button>
                <button onClick={() => handleDelete(c)} className="px-4 py-2 rounded-full font-semibold uppercase bg-red-200 text-red-700">Delete</button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
