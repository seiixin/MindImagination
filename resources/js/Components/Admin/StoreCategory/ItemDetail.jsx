// resources/js/.../ItemDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  X, Eye, Heart, Star, GaugeCircle, Coins, Wrench,
  Plus, Trash2, Edit, Save, XCircle
} from 'lucide-react';

/* -----------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------*/
function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.assets)) return payload.assets;
  if (payload && typeof payload === 'object') return Object.values(payload);
  return [];
}

/* -----------------------------------------------------------
 * Tiny in-file selects (hit /admin/users-light and /admin/assets-light)
 * ---------------------------------------------------------*/
function UserSelect({ value, onChange, disabled }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState([]);

  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/users-light', { params: { q: query, limit: 100 } });
      setOpts(normalizeList(res?.data));
    } catch (e) {
      console.error(e);
      setOpts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const safeOpts = Array.isArray(opts) ? opts : [];

  return (
    <div className="flex items-center gap-2">
      <input
        placeholder="Search user…"
        className="bg-[#475569]/40 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm text-gray-100 focus:outline-none"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
      />
      <select
        className="bg-[#475569]/50 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm text-gray-100 focus:outline-none"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
        disabled={disabled}
      >
        <option value="">— Select User —</option>
        {safeOpts.map((u) => (
          <option key={u.id} value={u.id}>
            {(u.name ?? u.username ?? `User #${u.id}`)}{u.email ? ` • ${u.email}` : ''}
          </option>
        ))}
      </select>
      {loading && <span className="text-xs opacity-60">Loading…</span>}
    </div>
  );
}

function AssetSelect({ value, onChange, disabled }) {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState([]);

  const fetchAssets = async (query = '') => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/assets-light', { params: { q: query, limit: 100 } });
      setOpts(normalizeList(res?.data));
    } catch (e) {
      console.error(e);
      setOpts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchAssets(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const safeOpts = Array.isArray(opts) ? opts : [];

  return (
    <div className="flex items-center gap-2">
      <input
        placeholder="Search asset…"
        className="bg-[#475569]/40 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm text-gray-100 focus:outline-none"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
      />
      <select
        className="bg-[#475569]/50 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm text-gray-100 focus:outline-none"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
        disabled={disabled}
      >
        <option value="">— Select Asset —</option>
        {safeOpts.map((a) => (
          <option key={a.id} value={a.id}>{a.title ?? a.name ?? `#${a.id}`}</option>
        ))}
      </select>
      {loading && <span className="text-xs opacity-60">Loading…</span>}
    </div>
  );
}

/* -----------------------------------------------------------
 * Main component (keeps your existing style; adds admin panels)
 * ---------------------------------------------------------*/
export default function ItemDetail({ itemId, onClose }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewImage, setViewImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  // --- Comments form state
  const [commentUserId, setCommentUserId] = useState(null);
  const [commentAssetId, setCommentAssetId] = useState(itemId);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);

  // --- Favorites/Ratings/Views generation controls
  const [favCount, setFavCount] = useState(10);
  const [rateCount, setRateCount] = useState(10);
  const [viewCount, setViewCount] = useState(50);
  const [guestRatio, setGuestRatio] = useState(0.15);

  // Single create helpers
  const [favUserId, setFavUserId] = useState(null);
  const [ratingUserId, setRatingUserId] = useState(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [viewUserId, setViewUserId] = useState(null); // null => guest

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/admin/assets/${itemId}`, {
        params: { include_relations: true, with_counts: true, relations_limit: 50 }
      });
      setItem(res.data);
      setCommentAssetId(itemId);
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: 'Failed to load item.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItem(); }, [itemId]);

  const priceDisplay = Number(item?.price ?? item?.category?.purchase_cost ?? 0);
  const pointsDisplay = Number(item?.points ?? item?.category?.additional_points ?? 0);

  const maintCost = Number(item?.maintenance_cost ?? 0);
  const hasMaintenance = Boolean(item?.has_maintenance || maintCost > 0);

  const viewsCount = item?.views_count ?? (item?.views?.length ?? 0);
  const favoritesCount = item?.favorites_count ?? (item?.favorites?.length ?? 0);
  const ratingsCount = item?.ratings_count ?? (item?.ratings?.length ?? 0);
  const avgRating = useMemo(() => {
    if (typeof item?.avg_rating === 'number') return item.avg_rating.toFixed(1);
    const rc = item?.ratings?.length ?? 0;
    return rc ? (item.ratings.reduce((t, r) => t + (r.rating || 0), 0) / rc).toFixed(1) : '0.0';
  }, [item]);

  const hasSubImages = Array.isArray(item?.sub_image_path) && item.sub_image_path.length > 0;

  // -------------------- Helpers --------------------
  const setOk = (msg) => setStatus({ type: 'ok', msg });
  const setErr = (msg) => setStatus({ type: 'error', msg });

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await fetchItem();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  // -------------------- Comments CRUD --------------------
  const submitComment = () => run(async () => {
    if (!commentUserId || !commentAssetId || !commentText.trim()) {
      setErr('Select user, asset and enter a message.'); return;
    }

    if (editingCommentId) {
      await axios.put(`/admin/interactions/comments/${editingCommentId}`, {
        asset_id: commentAssetId,
        user_id: commentUserId,
        comment: commentText.trim(),
      });
      setOk('Comment updated.');
      setEditingCommentId(null);
    } else {
      await axios.post('/admin/interactions/comments', {
        asset_id: commentAssetId,
        user_id: commentUserId,
        comment: commentText.trim(),
      });
      setOk('Comment added.');
    }
    setCommentText('');
  });

  const editComment = (c) => {
    setEditingCommentId(c.id);
    setCommentUserId(c.user_id ?? (c.user?.id ?? null));
    setCommentAssetId(itemId);
    setCommentText(c.comment || '');
  };

  const deleteComment = (id) => run(async () => {
    await axios.delete(`/admin/interactions/comments/${id}`);
    setOk('Comment deleted.');
  });

  // -------------------- Favorites --------------------
  const generateFavorites = () => run(async () => {
    await axios.post('/admin/interactions/favorites/generate', {
      asset_id: itemId,
      count: Math.max(1, Number(favCount || 0)),
    });
    setOk('Favorites generated.');
  });

  const addFavorite = () => run(async () => {
    if (!favUserId) { setErr('Select a user to favorite.'); return; }
    await axios.post('/admin/interactions/favorites', {
      asset_id: itemId,
      user_id: favUserId,
    });
    setOk('Favorite added.');
  });

  const deleteFavorite = (id) => run(async () => {
    await axios.delete(`/admin/interactions/favorites/${id}`);
    setOk('Favorite removed.');
  });

  // -------------------- Ratings --------------------
  const generateRatings = () => run(async () => {
    await axios.post('/admin/interactions/ratings/generate', {
      asset_id: itemId,
      count: Math.max(1, Number(rateCount || 0)),
    });
    setOk('Ratings generated.');
  });

  const addRating = () => run(async () => {
    if (!ratingUserId) { setErr('Select a user to rate.'); return; }
    const rating = Math.min(5, Math.max(1, Number(ratingValue || 5)));
    await axios.post('/admin/interactions/ratings', {
      asset_id: itemId,
      user_id: ratingUserId,
      rating,
    });
    setOk('Rating set.');
  });

  const deleteRating = (id) => run(async () => {
    await axios.delete(`/admin/interactions/ratings/${id}`);
    setOk('Rating removed.');
  });

  // -------------------- Views --------------------
  const generateViews = () => run(async () => {
    await axios.post('/admin/interactions/views/generate', {
      asset_id: itemId,
      count: Math.max(1, Number(viewCount || 0)),
      guest_ratio: Math.max(0, Math.min(1, Number(guestRatio))),
    });
    setOk('Views generated.');
  });

  const addView = () => run(async () => {
    await axios.post('/admin/interactions/views', {
      asset_id: itemId,
      user_id: viewUserId || null, // null → guest view
    });
    setOk('View added.');
  });

  const deleteView = (id) => run(async () => {
    await axios.delete(`/admin/interactions/views/${id}`);
    setOk('View removed.');
  });

  if (loading) return <p className="text-gray-300">Loading...</p>;
  if (!item) return <p className="text-gray-300">No details.</p>;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 overflow-y-auto p-6 flex justify-center items-start">
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl bg-[#334155]/60 border border-[#475569]/30 p-6 text-gray-100">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#334155]/60 backdrop-blur-md p-2 rounded-xl">
          <h2 className="text-2xl font-bold drop-shadow">{item.title}</h2>
          <button onClick={onClose} className="hover:scale-105 transition-transform" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {!!status && (
          <div className={`mb-4 rounded-xl px-3 py-2 text-sm ${status.type === 'ok' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>
            {status.msg}
          </div>
        )}

        {item.file_path && (
          <div className="mb-6 neuromorphic">
            <img
              src={item.file_path}
              alt=""
              className="rounded-2xl max-h-64 object-cover w-full shadow-inner"
            />
          </div>
        )}

        {item.cover_image_path && (
          <div className="mb-6">
            <img
              src={item.cover_image_path}
              alt=""
              className="rounded-2xl max-h-64 object-cover w-full shadow-inner"
            />
          </div>
        )}

        {hasSubImages && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              {item.sub_image_path.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  onClick={() => setViewImage(img)}
                  className="w-24 h-24 rounded-xl object-cover hover:brightness-110 cursor-pointer"
                />
              ))}
            </div>
          </div>
        )}

        {item.video_path && (
          <div className="mb-6">
            <video
              src={item.video_path}
              controls
              className="w-full rounded-2xl max-h-64 object-cover shadow-inner"
            />
          </div>
        )}

        {/* Price & Points (with Maintenance chip beside Points) */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-[#475569]/50 p-3 rounded-xl">
            <Coins size={18} />
            <span className="opacity-80">
              <strong>Price:</strong> ₱{priceDisplay.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-[#475569]/50 p-3 rounded-xl">
            <GaugeCircle size={18} />
            <span className="opacity-80">
              <strong>Points:</strong> {pointsDisplay}
            </span>

            {hasMaintenance && (
              <span
                className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-200 text-fuchsia-900 font-semibold"
                title={`Maintenance cost: ${maintCost} pts`}
              >
                <Wrench size={14} />
                MAINTENANCE
                <span className="ml-1 text-xs opacity-80">({maintCost} pts)</span>
              </span>
            )}
          </div>
        </div>

        <p className="mb-4 opacity-80">
          <strong>Description:</strong> {item.description}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
          <div className="flex items-center gap-1"><Eye size={16} /> {viewsCount}</div>
          <div className="flex items-center gap-1"><Heart size={16} /> {favoritesCount}</div>
          <div className="flex items-center gap-1"><Star size={16} /> {ratingsCount}</div>
          <div className="flex items-center gap-1"><GaugeCircle size={16} /> {avgRating}</div>
        </div>

        {/* Optional: category context */}
        {item?.category && (
          <div className="mb-6 text-sm opacity-80">
            <p><strong>Category:</strong> {item.category.name}</p>
            <p>
              <strong>Category Defaults:</strong>{' '}
              ₱{Number(item.category.purchase_cost ?? 0).toFixed(2)} /{' '}
              {item.category.additional_points ?? 0} pts
            </p>
          </div>
        )}

        {/* =========================
            COMMENTS PANEL (CRUD)
           ========================= */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Comments</h3>

          {/* Form */}
          <div className="bg-[#475569]/40 border border-[#64748b]/30 p-3 rounded-xl mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs opacity-70 block mb-1">User</label>
                <UserSelect value={commentUserId} onChange={setCommentUserId} disabled={busy} />
              </div>
              <div>
                <label className="text-xs opacity-70 block mb-1">Asset</label>
                <AssetSelect value={commentAssetId} onChange={setCommentAssetId} disabled={busy} />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <textarea
                className="w-full bg-[#475569]/50 border border-[#64748b]/30 rounded-lg px-3 py-2 text-sm focus:outline-none"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={busy}
                rows={3}
              />
              <button
                onClick={submitComment}
                disabled={busy}
                className="h-10 mt-0.5 inline-flex items-center gap-2 px-3 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm"
              >
                {editingCommentId ? <><Save size={16}/> Save</> : <><Plus size={16}/> Add</>}
              </button>
              {editingCommentId && (
                <button
                  onClick={() => { setEditingCommentId(null); setCommentText(''); }}
                  className="h-10 mt-0.5 inline-flex items-center gap-2 px-3 rounded-lg bg-rose-500/70 hover:bg-rose-500 text-white text-sm"
                >
                  <XCircle size={16}/> Cancel
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
            {item.comments?.length ? (
              item.comments.map((c) => (
                <div key={c.id} className="bg-[#475569]/50 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs opacity-70">User #{c.user_id ?? c.user?.id} • {c.user?.name ?? 'Unknown'}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editComment(c)}
                        className="text-xs px-2 py-1 rounded-md bg-blue-500/70 hover:bg-blue-500"
                      >
                        <span className="inline-flex items-center gap-1"><Edit size={14}/> Edit</span>
                      </button>
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="text-xs px-2 py-1 rounded-md bg-rose-500/70 hover:bg-rose-500"
                      >
                        <span className="inline-flex items-center gap-1"><Trash2 size={14}/> Delete</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm">{c.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-sm opacity-50">No comments yet.</p>
            )}
          </div>
        </div>

        {/* =========================
            FAVORITES PANEL
           ========================= */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Favorites</h3>
          <div className="bg-[#475569]/40 border border-[#64748b]/30 p-3 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Generate */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-28 bg-[#475569]/50 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm focus:outline-none"
                  value={favCount}
                  onChange={(e) => setFavCount(e.target.value)}
                  disabled={busy}
                />
                <button
                  onClick={generateFavorites}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm"
                >
                  <Plus size={16}/> Generate
                </button>
                <span className="text-xs opacity-70 ml-2">Count: {favoritesCount}</span>
              </div>

              {/* Single add */}
              <div className="flex items-center gap-2">
                <UserSelect value={favUserId} onChange={setFavUserId} disabled={busy} />
                <button
                  onClick={addFavorite}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white text-sm"
                >
                  <Plus size={16}/> Add One
                </button>
              </div>
            </div>

            {/* List */}
            <div className="mt-3 grid gap-2">
              {(item.favorites ?? []).map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-[#475569]/50 rounded-md px-3 py-2">
                  <span className="text-sm opacity-90">
                    #{f.id} — User #{f.user_id ?? f.user?.id} {f.user?.name ? `(${f.user.name})` : ''}
                  </span>
                  <button
                    onClick={() => deleteFavorite(f.id)}
                    className="text-xs px-2 py-1 rounded-md bg-rose-500/70 hover:bg-rose-500"
                  >
                    <span className="inline-flex items-center gap-1"><Trash2 size={14}/> Remove</span>
                  </button>
                </div>
              ))}
              {!item.favorites?.length && <p className="text-sm opacity-50 mt-2">No favorites listed.</p>}
            </div>
          </div>
        </div>

        {/* =========================
            RATINGS PANEL
           ========================= */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Ratings</h3>
          <div className="bg-[#475569]/40 border border-[#64748b]/30 p-3 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Generate */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-28 bg-[#475569]/50 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm focus:outline-none"
                  value={rateCount}
                  onChange={(e) => setRateCount(e.target.value)}
                  disabled={busy}
                />
                <button
                  onClick={generateRatings}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm"
                >
                  <Plus size={16}/> Generate
                </button>
                <span className="text-xs opacity-70 ml-2">Count: {ratingsCount} • Avg {avgRating}</span>
              </div>

              {/* Single add/update */}
              <div className="flex items-center gap-2">
                <UserSelect value={ratingUserId} onChange={setRatingUserId} disabled={busy} />
                <select
                  className="bg-[#475569]/50 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm focus:outline-none"
                  value={ratingValue}
                  onChange={(e) => setRatingValue(Number(e.target.value))}
                  disabled={busy}
                >
                  {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
                <button
                  onClick={addRating}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white text-sm"
                >
                  <Plus size={16}/> Set One
                </button>
              </div>
            </div>

            {/* List */}
            <div className="mt-3 grid gap-2">
              {(item.ratings ?? []).map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-[#475569]/50 rounded-md px-3 py-2">
                  <span className="text-sm opacity-90">
                    #{r.id} — {r.rating} ★ — User #{r.user_id ?? r.user?.id} {r.user?.name ? `(${r.user.name})` : ''}
                  </span>
                  <button
                    onClick={() => deleteRating(r.id)}
                    className="text-xs px-2 py-1 rounded-md bg-rose-500/70 hover:bg-rose-500"
                  >
                    <span className="inline-flex items-center gap-1"><Trash2 size={14}/> Remove</span>
                  </button>
                </div>
              ))}
              {!item.ratings?.length && <p className="text-sm opacity-50 mt-2">No ratings listed.</p>}
            </div>
          </div>
        </div>

        {/* =========================
            VIEWS PANEL
           ========================= */}
        <div className="mb-2">
          <h3 className="font-medium mb-2">Views</h3>
          <div className="bg-[#475569]/40 border border-[#64748b]/30 p-3 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Generate */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  className="w-28 bg-[#475569]/50 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm focus:outline-none"
                  value={viewCount}
                  onChange={(e) => setViewCount(e.target.value)}
                  disabled={busy}
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs opacity-70">Guest ratio</span>
                  <input
                    type="number"
                    step="0.05"
                    min={0}
                    max={1}
                    className="w-20 bg-[#475569]/50 border border-[#64748b]/30 rounded-lg px-2 py-1 text-sm focus:outline-none"
                    value={guestRatio}
                    onChange={(e) => setGuestRatio(e.target.value)}
                    disabled={busy}
                  />
                </div>
                <button
                  onClick={generateViews}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/80 hover:bg-emerald-500 text-white text-sm"
                >
                  <Plus size={16}/> Generate
                </button>
                <span className="text-xs opacity-70 ml-2">Count: {viewsCount}</span>
              </div>

              {/* Single add */}
              <div className="flex items-center gap-2">
                <UserSelect value={viewUserId} onChange={setViewUserId} disabled={busy} />
                <button
                  onClick={addView}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white text-sm"
                >
                  <Plus size={16}/> Add One (user or guest)
                </button>
              </div>
            </div>

            {/* List */}
            <div className="mt-3 grid gap-2">
              {(item.views ?? []).map((v) => (
                <div key={v.id} className="flex items-center justify-between bg-[#475569]/50 rounded-md px-3 py-2">
                  <span className="text-sm opacity-90">
                    #{v.id} — {v.user_id ? `User #${v.user_id} ${v.user?.name ? `(${v.user.name})` : ''}` : 'Guest'}
                  </span>
                  <button
                    onClick={() => deleteView(v.id)}
                    className="text-xs px-2 py-1 rounded-md bg-rose-500/70 hover:bg-rose-500"
                  >
                    <span className="inline-flex items-center gap-1"><Trash2 size={14}/> Remove</span>
                  </button>
                </div>
              ))}
              {!item.views?.length && <p className="text-sm opacity-50 mt-2">No views listed.</p>}
            </div>
          </div>
        </div>
      </div>

      {viewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
          onClick={() => setViewImage(null)}
        >
          <img src={viewImage} className="max-h-[90vh] max-w-[90vw] rounded-2xl" />
        </div>
      )}
    </div>
  );
}
