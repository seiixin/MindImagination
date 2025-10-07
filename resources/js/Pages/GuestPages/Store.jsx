// resources/js/Pages/GuestPages/Store.jsx
import { useMemo, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import GuestLayout from "@/Layouts/GuestLayout";
import HeroSlider from "@/Components/HeroSlider";

const PLACEHOLDER = "/Images/placeholder.png";

/** Turn any value (absolute, /storage/..., assets/foo.png, or bare file.png) into a valid public URL. */
function normalizeMediaUrl(u) {
  if (!u) return PLACEHOLDER;

  // Absolute or already correct
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/storage/")) return u;

  // Remove leading slashes to unify handling
  const clean = u.replace(/^\/+/, "");

  // Common stored forms
  if (clean.startsWith("storage/")) return `/${clean}`;              // "storage/assets/abc.png"
  if (clean.startsWith("assets/"))  return `/storage/${clean}`;      // "assets/abc.png"

  // Bare filename like "abc.png" → assume it lives under "assets/"
  if (/^[\w.-]+\.(png|jpe?g|webp|gif)$/i.test(clean)) return `/storage/assets/${clean}`;

  // Anything else we route via /storage/ as a last resort
  return `/storage/${clean}`;
}

/** Compute price with fallback to category default. */
function pickPrice(a) {
  if (typeof a.price === "number") return a.price;
  if (a?.category && typeof a.category.purchase_cost === "number") return a.category.purchase_cost;
  return null;
}

/** Compute points with fallback to category default. */
function pickPoints(a) {
  if (typeof a.points === "number") return a.points;
  if (a?.category && typeof a.category.additional_points === "number") return a.category.additional_points;
  return null;
}

export default function Store() {
  const { auth, assets: serverAssets = [] } = usePage().props;
  const [showFilters, setShowFilters] = useState(true);

  // Normalize assets from server
  const assets = useMemo(() => {
    if (!Array.isArray(serverAssets)) return [];

    return serverAssets.map((a, i) => {
      // choose best candidate, then normalize to a public URL
      const imageCand =
        a.image_url ||
        a.cover_image_path ||
        a.file_path ||
        (Array.isArray(a.sub_image_path) && a.sub_image_path[0]) ||
        null;

      const image = normalizeMediaUrl(imageCand);

      const slug =
        a.slug ||
        (a.title ? a.title.toString().toLowerCase().replace(/\s+/g, "-") : String(a.id || i));

      // counts (prefer *_count; else length)
      const commentsCount =
        typeof a.comments_count === "number"
          ? a.comments_count
          : Array.isArray(a.comments)
          ? a.comments.length
          : 0;

      const favoritesCount =
        typeof a.favorites_count === "number"
          ? a.favorites_count
          : Array.isArray(a.favorites)
          ? a.favorites.length
          : 0;

      const viewsCount =
        typeof a.views_count === "number"
          ? a.views_count
          : Array.isArray(a.views)
          ? a.views.length
          : 0;

      const avgRating =
        typeof a.avg_rating === "number"
          ? a.avg_rating
          : Array.isArray(a.ratings) && a.ratings.length
          ? a.ratings.reduce((t, r) => t + (Number(r.rating) || 0), 0) / a.ratings.length
          : 0;

      return {
        id: a.id ?? i,
        title: a.title ?? "Untitled Asset",
        slug,
        image,
        points: pickPoints(a),          // NEW: with fallback to category
        price: pickPrice(a),            // NEW: with fallback to category
        commentsCount,
        favoritesCount,
        viewsCount,
        avgRating: Number(avgRating || 0),
      };
    });
  }, [serverAssets]);

  const formatPhp = (n) =>
    typeof n === "number" ? `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}` : null;

  return (
    <GuestLayout>
      {/* Hero Section */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl shadow-inner border border-white/20 overflow-hidden mx-auto max-w-6xl mt-6">
        <HeroSlider />
      </div>

      {/* User Info + Button (only when logged in) */}
      {auth?.user && (
        <div className="max-w-7xl mx-auto px-4 mt-2 mb-1 flex flex-col md:flex-row justify-between items-center gap-2 text-white">
          <div className="text-base">
            <span className="font-semibold">Your Points:</span>{" "}
            <span className="text-[#0ff] font-bold">{auth.user.points ?? "0"} pts</span>
          </div>
          <Link
            href="/dashboard"
            className="bg-[#0ff] text-[#003153] font-semibold px-3 py-1.5 rounded shadow hover:bg-[#00e0e0] transition text-sm"
          >
            Purchased
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-12 text-white flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <aside className="w-full md:w-[260px] bg-[#00213a]/60 border border-white/20 rounded-xl p-4 backdrop-blur-md shadow-md h-fit">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold">Filters</h3>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="md:hidden bg-white/10 border border-white/20 text-white px-3 py-1 rounded text-sm hover:bg-white/20 transition"
            >
              {showFilters ? "Hide" : "Show"}
            </button>
          </div>

          <div className={`${showFilters ? "block" : "hidden md:block"} space-y-5 max-h-[350px] overflow-y-auto pr-1`}>
            {/* Category */}
            <div>
              <label className="block mb-1 text-sm font-semibold">Category</label>
              <select className="w-full px-3 py-2 rounded bg-[#001f35] border border-white/20 text-white">
                <option>All</option>
                <option>Character</option>
                <option>Environment</option>
                <option>UI Kit</option>
              </select>
            </div>

            {/* Points Range */}
            <div>
              <label className="block mb-1 text-sm font-semibold">Points Range</label>
              <div className="flex gap-2 items-center">
                <input type="number" placeholder="Min" className="w-full px-2 py-1 rounded bg-[#001f35] border border-white/20 text-white" />
                <span className="text-white/50">-</span>
                <input type="number" placeholder="Max" className="w-full px-2 py-1 rounded bg-[#001f35] border border-white/20 text-white" />
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block mb-1 text-sm font-semibold">Search</label>
              <input type="text" placeholder="Search assets..." className="w-full px-3 py-2 rounded bg-[#001f35] border border-white/20 text-white" />
            </div>

            {/* Apply Button */}
            <div>
              <button className="w-full bg-[#0ff] text-[#003153] font-semibold py-2 rounded hover:bg-[#00e0e0] transition">
                Apply Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.length === 0 && (
            <div className="col-span-full text-white/70 text-sm">No assets available yet.</div>
          )}

          {assets.map((item) => (
            <div
              key={item.id}
              className="bg-[#002744] border border-white/20 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition transform duration-200"
            >
              <Link href={`/assets/${item.slug}`}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Hard fallback if something still fails server-side
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-white/70">High-quality asset preview with dynamic tags.</p>

                  <div className="flex items-center justify-between text-sm mt-2">
                    {/* Points & Price */}
                    <div className="flex gap-2 items-baseline">
                      {typeof item.points === "number" && (
                        <span className="text-[#cea76d] font-semibold">
                          {item.points.toLocaleString()} pts
                        </span>
                      )}
                      {typeof item.price === "number" && (
                        <span className="text-white/80">
                          {formatPhp(item.price)}
                        </span>
                      )}
                    </div>

                    {/* Live social proof from backend */}
                    <div className="flex gap-3 text-white/70 text-xs items-center">
                      <span title="Average Rating">⭐ {item.avgRating.toFixed(1)}</span>
                      <span title="Favorites">❤️ {item.favoritesCount}</span>
                      <span title="Comments">💬 {item.commentsCount}</span>
                      <span title="Views">👁️ {item.viewsCount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </section>
      </div>
    </GuestLayout>
  );
}
