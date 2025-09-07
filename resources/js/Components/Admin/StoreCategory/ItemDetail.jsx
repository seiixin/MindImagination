import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { X, Eye, Heart, Star, GaugeCircle } from 'lucide-react';

export default function ItemDetail({ itemId, onClose }) {
  const [item, setItem] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Normalize any legacy/bare media paths to public URLs
  const mediaUrl = useCallback((u) => {
    if (!u) return '';
    if (typeof u !== 'string') return '';
    if (u.startsWith('http://') || u.startsWith('https://')) return u;
    if (u.startsWith('/storage/')) return u;
    // treat as relative path or bare filename -> map to /storage/assets/...
    const p = u.startsWith('assets/') ? u : `assets/${u.replace(/^\/+/, '')}`;
    return `/storage/${p}`;
  }, []);

  const fetchItem = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const res = await axios.get(`/admin/assets/${itemId}`);
      const data = res.data || null;

      // Safety normalization in case backend didn’t run accessors
      if (data) {
        data.file_path          = mediaUrl(data.file_path);
        data.cover_image_path   = mediaUrl(data.cover_image_path);
        data.video_path         = mediaUrl(data.video_path);
        data.download_file_path = mediaUrl(data.download_file_path);

        if (Array.isArray(data.sub_image_path)) {
          data.sub_image_path = data.sub_image_path.map(mediaUrl).filter(Boolean);
        } else if (typeof data.sub_image_path === 'string') {
          try {
            const arr = JSON.parse(data.sub_image_path);
            data.sub_image_path = Array.isArray(arr) ? arr.map(mediaUrl).filter(Boolean) : [];
          } catch {
            data.sub_image_path = [];
          }
        } else {
          data.sub_image_path = [];
        }
      }

      setItem(data);
    } catch (e) {
      console.error(e);
      setError('Failed to load item details.');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [itemId, mediaUrl]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 grid place-items-center">
        <p className="text-gray-200">Loading…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 grid place-items-center">
        <div className="bg-[#334155]/70 border border-[#475569]/30 text-gray-100 rounded-2xl p-6">
          {error || 'No details.'}
          <div className="mt-4 text-right">
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 overflow-y-auto p-6 flex justify-center items-start"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl bg-[#334155]/60 border border-[#475569]/30 p-6 text-gray-100">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#334155]/60 backdrop-blur-md p-2 rounded-xl">
          <h2 className="text-2xl font-bold drop-shadow">{item.title}</h2>
          <button onClick={onClose} className="hover:scale-105 transition-transform" aria-label="Close">
            <X size={24} />
          </button>
        </div>

        {/* Main image */}
        {item.file_path && (
          <div className="mb-6">
            <img
              src={item.file_path}
              alt=""
              className="rounded-2xl max-h-64 object-cover w-full shadow-inner"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}

        {/* Cover image */}
        {item.cover_image_path && (
          <div className="mb-6">
            <img
              src={item.cover_image_path}
              alt=""
              className="rounded-2xl max-h-64 object-cover w-full shadow-inner"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
        )}

        {/* Sub images */}
        {Array.isArray(item.sub_image_path) && item.sub_image_path.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              {item.sub_image_path.map((img, i) => (
                <img
                  key={`${img}-${i}`}
                  src={img}
                  onClick={() => setViewImage(img)}
                  className="w-24 h-24 rounded-xl object-cover hover:brightness-110 cursor-pointer"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Video */}
        {item.video_path && (
          <div className="mb-6">
            <video
              src={item.video_path}
              controls
              className="w-full rounded-2xl max-h-64 object-cover shadow-inner"
              onError={(e) => {
                // hide the broken player if the URL 403s
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="mb-4 opacity-80"><strong>Description:</strong> {item.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
          <div className="flex items-center gap-1"><Eye size={16} /> {item.views?.length ?? 0}</div>
          <div className="flex items-center gap-1"><Heart size={16} /> {item.favorites?.length ?? 0}</div>
          <div className="flex items-center gap-1"><Star size={16} /> {item.ratings?.length ?? 0}</div>
          <div className="flex items-center gap-1">
            <GaugeCircle size={16} />
            {item.ratings?.length
              ? (item.ratings.reduce((t, r) => t + (r.rating || 0), 0) / item.ratings.length).toFixed(1)
              : '0.0'}
          </div>
        </div>

        {/* Comments */}
        <h3 className="font-medium mb-2">Comments</h3>
        <div className="space-y-3">
          {item.comments?.length ? (
            item.comments.map((c) => (
              <div key={c.id} className="bg-[#475569]/50 p-3 rounded-md">
                <p className="text-xs opacity-70 mb-1">User #{c.user_id}</p>
                <p className="text-sm">{c.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-sm opacity-50">No comments yet.</p>
          )}
        </div>
      </div>

      {/* Lightbox */}
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
