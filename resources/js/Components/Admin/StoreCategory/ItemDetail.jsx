import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Eye, Heart, Star, GaugeCircle, Coins } from 'lucide-react';

export default function ItemDetail({ itemId, onClose }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`/admin/assets/${itemId}`);
        setItem(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  if (loading) return <p className="text-gray-300">Loading...</p>;
  if (!item) return <p className="text-gray-300">No details.</p>;

  // Prefer per-asset values; fall back to category defaults if needed
  const priceDisplay = Number(
    item?.price ?? item?.category?.purchase_cost ?? 0
  );
  const pointsDisplay =
    item?.points ?? item?.category?.additional_points ?? 0;

  const viewsCount = item?.views?.length ?? 0;
  const favoritesCount = item?.favorites?.length ?? 0;
  const ratingsCount = item?.ratings?.length ?? 0;
  const avgRating =
    ratingsCount
      ? (item.ratings.reduce((t, r) => t + (r.rating || 0), 0) / ratingsCount).toFixed(1)
      : '0.0';

  const hasSubImages = Array.isArray(item?.sub_image_path) && item.sub_image_path.length > 0;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 overflow-y-auto p-6 flex justify-center items-start">
      <div className="w-full max-w-3xl rounded-3xl shadow-2xl bg-[#334155]/60 border border-[#475569]/30 p-6 text-gray-100">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#334155]/60 backdrop-blur-md p-2 rounded-xl">
          <h2 className="text-2xl font-bold drop-shadow">{item.title}</h2>
          <button onClick={onClose} className="hover:scale-105 transition-transform">
            <X size={24} />
          </button>
        </div>

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

        {/* Price & Points */}
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

        {/* Optional: show category info for context */}
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
