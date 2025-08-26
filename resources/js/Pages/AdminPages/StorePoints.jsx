import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AdminLayout from '@/Layouts/AdminLayout';

export default function StorePoints() {
  const neuShadow = 'shadow-[8px_8px_15px_#bebebe,-8px_-8px_15px_#ffffff]';

  // PayMongo keys
  const [paymongoPublic, setPaymongoPublic] = useState('');
  const [paymongoSecret, setPaymongoSecret] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [editSecret, setEditSecret] = useState(false);

  // Store Plans CRUD
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', points: '', price: '', image_url: '' });
  const [loading, setLoading] = useState(false);

  // optional — available points
  const [availablePoints, setAvailablePoints] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [keysRes, plansRes] = await Promise.all([
          axios.get('/admin/store-points/keys'),
          axios.get('/admin/store-plans'),
        ]);

        setPaymongoPublic(keysRes.data.public || '');
        setPaymongoSecret(keysRes.data.secret || '');

        const list = Array.isArray(plansRes.data) ? plansRes.data : (plansRes.data?.plans || []);
        setPlans(list);

        try {
          const bal = await axios.get('/admin/store-points/available');
          setAvailablePoints(Number(bal?.data?.points || 0));
        } catch {}
      } catch (e) {
        console.error(e);
        alert('Failed to load admin Store Points data.');
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter((p) =>
      [p.name, String(p.points), String(p.price)].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }, [plans, search]);

  /* ===============================
        PayMongo keys save
  =============================== */
  const savePayMongoKey = async (type) => {
    const value = type === 'public' ? paymongoPublic : paymongoSecret;
    await axios.post('/admin/store-points/keys', { key_type: type, value });
    alert(`${type === 'public' ? 'Public' : 'Secret'} key saved!`);
  };
  const togglePublic = async () => { if (editPublic) await savePayMongoKey('public'); setEditPublic(v => !v); };
  const toggleSecret = async () => { if (editSecret) await savePayMongoKey('secret'); setEditSecret(v => !v); };

  /* ===============================
        CRUD actions
  =============================== */
  const startAdd = () => {
    setForm({ id: null, name: '', points: '', price: '', image_url: '' });
    setIsEditing(true);
  };
  const startEdit = (p) => {
    setForm({
      id: p.id,
      name: p.name || '',
      points: String(p.points ?? ''),
      price: String(p.price ?? ''),
      image_url: p.image_url || '',
    });
    setIsEditing(true);
  };
  const cancelEdit = () => {
    setIsEditing(false);
    setForm({ id: null, name: '', points: '', price: '', image_url: '' });
  };

  const savePlan = async () => {
    const name = form.name.trim();
    const points = Number(form.points);
    const price = Number(form.price);
    if (!name) return alert('Name is required.');
    if (!Number.isFinite(points) || points < 0) return alert('Points must be a non-negative number.');
    if (!Number.isFinite(price) || price < 0) return alert('Price must be a non-negative number.');

    const payload = { name, points, price, image_url: form.image_url?.trim() || '' };
    setLoading(true);
    try {
      if (form.id) {
        await axios.put(`/admin/store-plans/${form.id}`, payload);
        setPlans(prev => prev.map(x => (x.id === form.id ? { ...x, ...payload } : x)));
      } else {
        const res = await axios.post('/admin/store-plans', payload);
        const created = res?.data?.plan || res?.data || { ...payload, id: Math.random().toString(36).slice(2) };
        setPlans(prev => [created, ...prev]);
      }
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert('Failed to save plan.');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    setLoading(true);
    try {
      await axios.delete(`/admin/store-plans/${p.id}`);
      setPlans(prev => prev.filter(x => x.id !== p.id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete plan.');
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
        PayMongo TEST preview
  =============================== */
  const previewCheckout = async (p) => {
    try {
      const amountCentavos = Math.round(Number(p.price) * 100);
      const srcRes = await axios.post('/admin/store-points/source', {
        amount: amountCentavos,
        type: 'gcash',
        mode: 'test', // force TEST secret on backend
        metadata: { plan_id: p.id, plan_name: p.name, points: p.points },
      });
      const checkoutUrl = srcRes?.data?.data?.attributes?.redirect?.checkout_url;
      if (!checkoutUrl) return alert('Checkout URL missing from PayMongo.');
      window.open(checkoutUrl, '_blank');
    } catch (err) {
      console.error(err?.response?.data || err);
      alert('Failed to create payment source.');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-10 max-w-5xl mx-auto bg-gray-200 p-10 rounded-xl">
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
              placeholder="Public Key (pk_test_...)"
            />
            <button onClick={togglePublic} className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}>
              {editPublic ? 'Save' : paymongoPublic ? 'Edit' : 'Add'}
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
              placeholder="Secret Key (sk_test_...)"
            />
            <button onClick={toggleSecret} className={`px-6 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}>
              {editSecret ? 'Save' : paymongoSecret ? 'Edit' : 'Add'}
            </button>
          </div>
        </section>

        {/* STORE PLAN — ADMIN CRUD */}
        <section className={`${neuShadow} bg-gray-200 p-6 rounded-xl space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold uppercase text-gray-700">Store Plan</h2>
            <div className="flex items-center gap-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plans..."
                className={`p-2 rounded-lg outline-none bg-gray-200 ${neuShadow}`}
              />
              <button onClick={startAdd} className={`px-4 py-2 rounded-full font-semibold uppercase bg-gray-200 ${neuShadow}`}>Add New Plan</button>
            </div>
          </div>

          {/* Editor Panel */}
          {isEditing && (
            <div className={`${neuShadow} bg-gray-200 p-5 rounded-lg space-y-4`}>
              <h3 className="text-base font-bold uppercase text-gray-700">{form.id ? 'Edit Plan' : 'Add Plan'}</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className={`${neuShadow} bg-white p-3 rounded-lg outline-none`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-medium text-gray-700">Points</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.points}
                    onChange={(e) => setForm(f => ({ ...f, points: e.target.value }))}
                    className={`${neuShadow} bg-white p-3 rounded-lg outline-none`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-medium text-gray-700">Price (PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    className={`${neuShadow} bg-white p-3 rounded-lg outline-none`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-medium text-gray-700">Image URL (optional)</label>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className={`${neuShadow} bg-white p-3 rounded-lg outline-none`}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-lg`}>{form.id ? `ID: ${form.id}` : 'New'}</span>
                <div className="flex gap-2">
                  <button onClick={cancelEdit} className={`${neuShadow} bg-gray-200 px-5 py-2 rounded-full font-semibold`}>Cancel</button>
                  <button disabled={loading} onClick={savePlan} className={`${neuShadow} bg-green-400 px-5 py-2 rounded-full font-bold disabled:opacity-60`}>{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Plans List */}
          <div className="flex flex-col divide-y divide-gray-300/50">
            {filtered.length === 0 && (
              <div className={`${neuShadow} bg-gray-200 p-4 rounded-lg text-center text-gray-500`}>No plans found.</div>
            )}

            {filtered.map((p) => (
              <div key={p.id} className="py-4">
                <div className="flex items-center gap-4">
                  {/* Image */}
                  <div className="w-28 h-20 rounded-xl overflow-hidden bg-gray-300 shrink-0">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-xs text-gray-600">No Image</div>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold uppercase text-gray-800 truncate">{p.name}</div>
                    <div className="uppercase text-gray-600 mt-1">Purchase {p.points} Points</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => previewCheckout(p)}
                      className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-lg font-semibold`}
                      title={`Preview checkout for ₱${p.price}`}
                    >
                      {Number.isFinite(Number(p.price)) ? `${Math.round(Number(p.price))} PHP` : 'PHP'}
                    </button>
                    <button onClick={() => startEdit(p)} className={`${neuShadow} bg-gray-200 px-4 py-2 rounded-full font-semibold`}>Edit</button>
                    <button onClick={() => deletePlan(p)} className={`${neuShadow} bg-red-200 text-red-800 px-4 py-2 rounded-full font-semibold`}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer: available points (optional) */}
          <div className="flex justify-end">
            <span className="text-sm text-gray-700">
              Available Points: <b className="text-teal-700">{availablePoints}</b> <span className="text-gray-500">(Max Points)</span>
            </span>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
