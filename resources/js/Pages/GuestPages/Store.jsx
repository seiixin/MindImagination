// resources/js/Pages/GuestPages/Store.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import axios from "axios";
import GuestLayout from "@/Layouts/GuestLayout";
import HeroSlider from "@/Components/HeroSlider";

const PLACEHOLDER = "/Images/placeholder.png";

/** Turn any value (absolute, /storage/..., assets/foo.png, or bare file.png) into a valid public URL. */
function normalizeMediaUrl(u) {
  if (!u) return PLACEHOLDER;
  if (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/storage/")) return u;
  const clean = u.replace(/^\/+/, "");
  if (clean.startsWith("storage/")) return `/${clean}`;
  if (clean.startsWith("assets/")) return `/storage/${clean}`;
  if (/^[\w.-]+\.(png|jpe?g|webp|gif)$/i.test(clean)) return `/storage/assets/${clean}`;
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
  if (a?.category && typeof a.category.additional_points === "number")
    return a.category.additional_points;
  return null;
}

/** STRICT category extraction: never from description. */
function extractCategoryName(a) {
  return (
    (a?.category && (a.category.name || a.category.title)) ||
    a?.category_name ||
    a?.category_title ||
    null
  );
}

/** Normalize server payload to UI-friendly objects. */
function normalize(serverAssets = []) {
  if (!Array.isArray(serverAssets)) return [];
  return serverAssets.map((a, i) => {
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

    const categoryName = extractCategoryName(a) || "Uncategorized";

    return {
      id: a.id ?? i,
      title: a.title ?? "Untitled Asset",
      slug,
      image,
      description: a.description ?? null,
      points: pickPoints(a),
      price: pickPrice(a),
      commentsCount,
      favoritesCount,
      viewsCount,
      avgRating: Number(avgRating || 0),
      categoryName, // <- strictly derived, never from description
    };
  });
}

/** Debounce hook for smoother search typing */
function useDebounced(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function Store() {
  const { auth, assets: serverAssets = [] } = usePage().props;

  const [assets, setAssets] = useState(() => normalize(serverAssets));
  useEffect(() => {
    setAssets(normalize(serverAssets));
  }, [serverAssets]);

  // ------- FILTER STATE (no description in search) -------
  const [showFilters, setShowFilters] = useState(true);
  const [category, setCategory] = useState(() => {
    if (typeof window === "undefined") return "All";
    const qs = new URLSearchParams(window.location.search);
    return qs.get("category") || "All";
  });
  const [minPts, setMinPts] = useState(() => {
    if (typeof window === "undefined") return "";
    const qs = new URLSearchParams(window.location.search);
    return qs.get("min_points") || "";
  });
  const [maxPts, setMaxPts] = useState(() => {
    if (typeof window === "undefined") return "";
    const qs = new URLSearchParams(window.location.search);
    return qs.get("max_points") || "";
  });
  const [search, setSearch] = useState(() => {
    if (typeof window === "undefined") return "";
    const qs = new URLSearchParams(window.location.search);
    return qs.get("q") || "";
  });
  const debouncedSearch = useDebounced(search, 250);

  // Build category options strictly from categoryName
  const categoryOptions = useMemo(() => {
    const set = new Set(["All"]);
    assets.forEach((a) => set.add(a.categoryName || "Uncategorized"));
    return Array.from(set);
  }, [assets]);

  // Apply filters (search by title ONLY)
  const filteredAssets = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const min = minPts === "" ? null : Number(minPts);
    const max = maxPts === "" ? null : Number(maxPts);

    return assets.filter((a) => {
      if (category !== "All" && (a.categoryName || "Uncategorized") !== category) return false;

      if (min !== null && Number.isFinite(min)) {
        const pts = Number(a.points ?? -Infinity);
        if (!Number.isFinite(pts) || pts < min) return false;
      }
      if (max !== null && Number.isFinite(max)) {
        const pts = Number(a.points ?? Infinity);
        if (!Number.isFinite(pts) || pts > max) return false;
      }

      if (q) {
        const hay = `${a.title || ""}`.toLowerCase(); // STRICT: title only
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [assets, category, minPts, maxPts, debouncedSearch]);

  // Sync URL (nice UX, no reload)
  function syncUrl() {
    if (typeof window === "undefined") return;
    const path = window.location.pathname;
    const qs = new URLSearchParams();
    if (category && category !== "All") qs.set("category", category);
    if (minPts !== "") qs.set("min_points", String(minPts));
    if (maxPts !== "") qs.set("max_points", String(maxPts));
    if (search.trim() !== "") qs.set("q", search.trim());
    const url = qs.toString() ? `${path}?${qs.toString()}` : path;
    router.visit(url, { preserveState: true, replace: true, only: [] });
  }

  function resetFilters() {
    setCategory("All");
    setMinPts("");
    setMaxPts("");
    setSearch("");
    if (typeof window !== "undefined") {
      router.visit(window.location.pathname, { preserveState: true, replace: true, only: [] });
    }
  }

  const formatPhp = (n) =>
    typeof n === "number" ? `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}` : null;

  /** POST /assets/{id}/views (used by the 👁️ button that does NOT navigate) */
  function postView(assetId) {
    const url = `/assets/${assetId}/views`;
    return axios.post(url, new URLSearchParams().toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      withCredentials: true,
    });
  }

  /** Fire-and-forget view ping that survives navigation. */
  function beaconView(assetId) {
    const url = `/assets/${assetId}/views`;
    try {
      const data = new URLSearchParams();
      const ok = typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url, data);
      if (!ok) {
        fetch(url, {
          method: "POST",
          keepalive: true,
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: data.toString(),
        }).catch(() => {});
      }
    } catch {
      fetch(url, {
        method: "POST",
        keepalive: true,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: "",
      }).catch(() => {});
    }
  }

  /** Card click: optimistic + sendBeacon, then navigate */
  function handleCardClick(e, item) {
    e.preventDefault();
    setAssets((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, viewsCount: (a.viewsCount || 0) + 1 } : a))
    );
    beaconView(item.id);
    router.visit(`/assets/${item.slug}`);
  }

  /** 👁️ button inside the card (no navigation) */
  async function handleViewButtonClick(assetId) {
    try {
      await postView(assetId);
      setAssets((prev) =>
        prev.map((a) => (a.id === assetId ? { ...a, viewsCount: (a.viewsCount || 0) + 1 } : a))
      );
    } catch (e) {
      console.error("View count failed", e);
    }
  }

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
              className="md:hidden bg-white/10 border border-white/20 text-white px-3 py-1 rounded text-sm hover:bg白/20 transition"
            >
              {showFilters ? "Hide" : "Show"}
            </button>
          </div>

          <div
            className={`${showFilters ? "block" : "hidden md:block"} space-y-5 max-h-[420px] overflow-y-auto pr-1`}
          >
            {/* Category */}
            <div>
              <label className="block mb-1 text-sm font-semibold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#001f35] border border-white/20 text-white"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Points Range */}
            <div>
              <label className="block mb-1 text-sm font-semibold">Points Range</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  inputMode="numeric"
                  value={minPts}
                  onChange={(e) => setMinPts(e.target.value)}
                  placeholder="Min"
                  className="w-full px-2 py-1 rounded bg-[#001f35] border border-white/20 text-white"
                />
                <span className="text-white/50">-</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={maxPts}
                  onChange={(e) => setMaxPts(e.target.value)}
                  placeholder="Max"
                  className="w-full px-2 py-1 rounded bg-[#001f35] border border-white/20 text-white"
                />
              </div>
            </div>

            {/* Search (title only) */}
            <div>
              <label className="block mb-1 text-sm font-semibold">Search (Title)</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title..."
                className="w-full px-3 py-2 rounded bg-[#001f35] border border-white/20 text-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={syncUrl}
                className="w-full bg-[#0ff] text-[#003153] font-semibold py-2 rounded hover:bg-[#00e0e0] transition"
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                type="button"
                className="w-28 bg-white/10 border border-white/20 text-white font-semibold py-2 rounded hover:bg-white/20 transition"
              >
                Reset
              </button>
            </div>

            {/* Result count */}
            <div className="text-xs text-white/70">
              Showing <span className="font-semibold">{filteredAssets.length}</span> of{" "}
              <span className="font-semibold">{assets.length}</span> items
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.length === 0 && (
            <div className="col-span-full text-white/70 text-sm">No assets match your filters.</div>
          )}

          {filteredAssets.map((item) => (
            <div
              key={item.id}
              className="bg-[#002744] border border-white/20 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition transform duration-200"
            >
              <Link href={`/assets/${item.slug}`} onClick={(e) => handleCardClick(e, item)}>
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER;
                  }}
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg">{item.title}</h3>

                  {item.description ? (
                    <p className="text-sm text-white/70 line-clamp-2">{item.description}</p>
                  ) : (
                    <p className="text-sm text-white/70">
                      High-quality asset preview with dynamic tags.
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm mt-2">
                    <div className="flex gap-2 items-baseline">
                      {typeof item.points === "number" && (
                        <span className="text-[#cea76d] font-semibold">
                          {item.points.toLocaleString()} pts
                        </span>
                      )}
                      {typeof item.price === "number" && (
                        <span className="text-white/80">{formatPhp(item.price)}</span>
                      )}
                    </div>

                    <div className="flex gap-3 text-white/70 text-xs items-center">
                      <span title="Average Rating">⭐ {item.avgRating.toFixed(1)}</span>
                      <span title="Favorites">❤️ {item.favoritesCount}</span>
                      <span title="Comments">💬 {item.commentsCount}</span>
                      <button
                        type="button"
                        title="Add a view"
                        className="hover:text-white underline-offset-2"
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewButtonClick(item.id);
                        }}
                      >
                        👁️ {item.viewsCount}
                      </button>
                    </div>
                  </div>

                  {/* Strict category badge */}
                  <div className="mt-2">
                    <span className="text-xs bg-white/10 border border-white/20 px-2 py-1 rounded">
                      {item.categoryName || "Uncategorized"}
                    </span>
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
