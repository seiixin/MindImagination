// resources/js/Pages/UserPages/AssetDetails.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {
  Star,
  X,
  Play,
  Heart,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import RateModal from "@/Components/asset/RateModal";

// ---- axios defaults (Laravel CSRF + XHR header) ----
if (typeof window !== "undefined") {
  axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
  const token = document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
  if (token) axios.defaults.headers.common["X-CSRF-TOKEN"] = token;
}

/** Normalize any media path to a real, public URL. */
function normalizeMediaUrl(u) {
  if (!u) return null;
  const s = String(u).trim();
  // absolute web URLs
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  // already public
  if (s.startsWith("/storage/")) return s;
  // strip leading slashes
  const clean = s.replace(/^\/+/, "");
  // common Laravel outputs to normalize
  if (clean.startsWith("public/storage/")) return "/" + clean.replace(/^public\//, "");
  if (clean.startsWith("storage/"))        return "/" + clean;            // -> /storage/...
  if (clean.startsWith("assets/"))         return "/storage/" + clean;    // -> /storage/assets/...
  // bare filename (png/jpg/webp/gif/svg/mp4/mov/webm)
  if (/^[\w.-]+\.(png|jpe?g|webp|gif|svg|mp4|mov|webm)$/i.test(clean)) {
    return "/storage/assets/" + clean;
  }
  // last resort: make root-relative so it's not resolved under /assets/<slug>
  return "/" + clean;
}

function parseSubImages(sub) {
  if (!sub) return [];
  if (Array.isArray(sub)) return sub.filter(Boolean);
  if (typeof sub === "string") {
    try {
      const arr = JSON.parse(sub);
      return Array.isArray(arr) ? arr.filter(Boolean) : [];
    } catch {
      return sub.startsWith("/") || sub.startsWith("http") ? [sub] : [];
    }
  }
  return [];
}

// read natural image size (for precise mapping)
function useNaturalSize(src) {
  const [sz, setSz] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => setSz({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);
  return sz;
}

// compute the *drawn* image box (object-contain letterboxing aware)
function drawnBox(containerW, containerH, naturalW, naturalH) {
  if (!containerW || !containerH || !naturalW || !naturalH) {
    return { dw: 0, dh: 0, offX: 0, offY: 0, scale: 1 };
  }
  const scale = Math.min(containerW / naturalW, containerH / naturalH);
  const dw = naturalW * scale;
  const dh = naturalH * scale;
  const offX = (containerW - dw) / 2;
  const offY = (containerH - dh) / 2;
  return { dw, dh, offX, offY, scale };
}

export default function AssetDetails() {
  const { asset, auth } = usePage().props || {};
  const userId = auth?.user?.id ?? null;

  if (!asset) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-3xl mx-auto mt-6 p-4 text-white bg-[#2a587a] rounded-lg border-4 border-[#154965]">
          <p className="opacity-80">Asset not found.</p>
          <Link
            href={route("store")}
            className="inline-block mt-3 bg-[#c7ad88] text-black font-semibold px-3 py-1 rounded border-2 border-[#b5946f] hover:bg-[#b5946f] hover:text-white transition"
          >
            ← Back
          </Link>
        </div>
      </AuthenticatedLayout>
    );
  }

  const {
    id,
    title,
    description,
    points,
    price,
    avg_rating = 0,
    views_count = 0,
    favorites_count = 0,
    comments_count = 0,
    file_path,
    cover_image_path,
    image_url,
    sub_image_path,
    video_path,
  } = asset;

  // ---------------- Media ----------------
  const images = useMemo(() => {
    const baseRaw = image_url || cover_image_path || file_path || null;
    const subsRaw = parseSubImages(sub_image_path);
    const base = normalizeMediaUrl(baseRaw);
    const subs = subsRaw.map(normalizeMediaUrl);
    const seen = new Set();
    return [base, ...subs].filter((u) => u && !seen.has(u) && seen.add(u));
  }, [image_url, cover_image_path, file_path, sub_image_path]);

  // Put VIDEO FIRST (if present), then images
  const media = useMemo(() => {
    const vidSrc = normalizeMediaUrl(video_path);
    const vid = vidSrc ? [{ type: "video", src: vidSrc }] : [];
    const imgItems = images.map((src) => ({ type: "image", src }));
    return [...vid, ...imgItems];
  }, [images, video_path]);

  const [activeIndex, setActiveIndex] = useState(0); // video (if any) will be index 0
  const active = media[activeIndex] || null;
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // ---------------- Helpers ----------------
  const formatPhp = (n) =>
    typeof n === "number"
      ? `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`
      : null;

  // ---------------- Local interaction state ----------------
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const [myRating, setMyRating] = useState(null);
  const [avgRating, setAvgRating] = useState(avg_rating || 0);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(favorites_count || 0);

  const [viewsCount, setViewsCount] = useState(views_count || 0);

  const [loading, setLoading] = useState(false);
  const loadedInteractions = useRef(false);
  const isMounted = useRef(true);

  const [showRateModal, setShowRateModal] = useState(false);

  useEffect(() => () => (isMounted.current = false), []);

  // ---------------- Post view on mount ----------------
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        await axios.post(`/assets/${id}/views`);
        if (isMounted.current) {
          setViewsCount((v) => (Number.isFinite(v) ? v + 1 : 1));
        }
      } catch {}
    })();
  }, [id, userId]);

  // ---------------- Load interactions ----------------
  useEffect(() => {
    if (!userId || loadedInteractions.current) return;
    loadedInteractions.current = true;

    (async () => {
      try {
        const [cRes, rRes, fRes] = await Promise.all([
          axios.get(`/assets/${id}/comments`),
          axios.get(`/assets/${id}/ratings`),
          axios.get(`/assets/${id}/favorites`),
        ]);

        if (!isMounted.current) return;

        setComments(Array.isArray(cRes.data) ? cRes.data : []);

        const ratings = Array.isArray(rRes.data) ? rRes.data : [];
        const mine = ratings.find((r) => r.user_id === userId)?.rating ?? null;
        setMyRating(mine);
        if (ratings.length) {
          const avg =
            ratings.reduce((t, r) => t + (Number(r.rating) || 0), 0) /
            ratings.length;
          setAvgRating(Number.isFinite(avg) ? Number(avg.toFixed(1)) : avg_rating);
        }

        const favs = Array.isArray(fRes.data) ? fRes.data : [];
        setIsFavorite(!!favs.find((f) => f.user_id === userId));
        setFavoritesCount(favs.length);
      } catch {}
    })();
  }, [id, userId, avg_rating]);

  // ---------------- Comments CRUD ----------------
  const addComment = async () => {
    if (!userId || !commentText.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`/assets/${id}/comments`, {
        comment: commentText.trim(),
      });
      if (!isMounted.current) return;
      setComments((s) => [res.data, ...s]);
      setCommentText("");
    } catch {} finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditText(c.comment || "");
  };

  const saveEdit = async (cid) => {
    if (!userId || !editText.trim()) return;
    setLoading(true);
    try {
      const res = await axios.put(`/assets/${id}/comments/${cid}`, {
        comment: editText.trim(),
      });
      if (!isMounted.current) return;
      setComments((s) => s.map((c) => (c.id === cid ? res.data : c)));
      setEditingId(null);
      setEditText("");
    } catch {} finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const deleteComment = async (cid) => {
    if (!userId) return;
    setLoading(true);
    try {
      await axios.delete(`/assets/${id}/comments/${cid}`);
      if (!isMounted.current) return;
      setComments((s) => s.filter((c) => c.id !== cid));
    } catch {} finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // ---------------- Ratings (modal submit) ----------------
  const submitRating = async (value) => {
    if (!userId) return;
    setLoading(true);
    try {
      await axios.post(`/assets/${id}/ratings`, { rating: value });
      if (!isMounted.current) return;
      setMyRating(value);

      const rRes = await axios.get(`/assets/${id}/ratings`);
      const ratings = Array.isArray(rRes.data) ? rRes.data : [];
      if (!isMounted.current) return;
      if (ratings.length) {
        const avg =
          ratings.reduce((t, r) => t + (Number(r.rating) || 0), 0) /
          ratings.length;
        setAvgRating(Number.isFinite(avg) ? Number(avg.toFixed(1)) : avg_rating);
      }
      setShowRateModal(false);
    } catch {} finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // ---------------- Favorites CRUD ----------------
  const toggleFavorite = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (!isFavorite) {
        await axios.post(`/assets/${id}/favorites`);
        if (!isMounted.current) return;
        setIsFavorite(true);
        setFavoritesCount((n) => (Number.isFinite(n) ? n + 1 : 1));
      } else {
        const fRes = await axios.get(`/assets/${id}/favorites`);
        const mine = (Array.isArray(fRes.data) ? fRes.data : []).find(
          (f) => f.user_id === userId
        );
        if (mine?.id) {
          await axios.delete(`/assets/${id}/favorites/${mine.id}`);
          if (!isMounted.current) return;
          setIsFavorite(false);
          setFavoritesCount((n) => Math.max(0, Number.isFinite(n) ? n - 1 : 0));
        }
      }
    } catch {} finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // ---------------- Lazada-style Hover Zoom (images only) ----------------
  const containerRef = useRef(null); // square media box
  const VIEW_W = 520;
  const VIEW_H = 520;
  const ZOOM_FACTOR = 2.2;

  const isCoarsePointer =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;

  const { w: naturalW, h: naturalH } = useNaturalSize(
    active?.type === "image" ? active.src : ""
  );

  const [drawn, setDrawn] = useState({ dw: 0, dh: 0, offX: 0, offY: 0 });
  const [lens, setLens] = useState({ w: 0, h: 0, x: 0, y: 0, show: false });
  const [bg, setBg] = useState({ w: 0, h: 0, x: 0, y: 0 });

  // track hover to pause autoplay
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const recalc = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      if (naturalW && naturalH) {
        const d = drawnBox(r.width, r.height, naturalW, naturalH);
        setDrawn(d);
        const desiredLensW = Math.min(d.dw, Math.max(80, VIEW_W / ZOOM_FACTOR));
        const desiredLensH = Math.min(d.dh, Math.max(80, VIEW_H / ZOOM_FACTOR));
        setLens((l) => ({ ...l, w: desiredLensW, h: desiredLensH }));
        const ratioX = VIEW_W / desiredLensW;
        const ratioY = VIEW_H / desiredLensH;
        setBg((b) => ({ ...b, w: d.dw * ratioX, h: d.dh * ratioY }));
      }
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    const current = containerRef.current;
    if (current) ro.observe(current);

    const onResize = () => recalc();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [active?.src, naturalW, naturalH]);

  const canZoom = !!(active?.type === "image" && naturalW && !isCoarsePointer);

  const move = (clientX, clientY) => {
    if (!containerRef.current || !canZoom) return;
    const rect = containerRef.current.getBoundingClientRect();

    let x = clientX - rect.left;
    let y = clientY - rect.top;

    x = Math.max(drawn.offX, Math.min(drawn.offX + drawn.dw, x));
    y = Math.max(drawn.offY, Math.min(drawn.offY + drawn.dh, y));

    const halfW = lens.w / 2;
    const halfH = lens.h / 2;
    const cx = Math.max(
      drawn.offX + halfW,
      Math.min(drawn.offX + drawn.dw - halfW, x)
    );
    const cy = Math.max(
      drawn.offY + halfH,
      Math.min(drawn.offY + drawn.dh - halfH, y)
    );

    setLens((l) => ({ ...l, x: cx - halfW, y: cy - halfH }));

    const ix = cx - drawn.offX;
    const iy = cy - drawn.offY;
    const ratioX = VIEW_W / lens.w;
    const ratioY = VIEW_H / lens.h;
    setBg({
      w: drawn.dw * ratioX,
      h: drawn.dh * ratioY,
      x: -(ix * ratioX - VIEW_W / 2),
      y: -(iy * ratioY - VIEW_H / 2),
    });
  };

  const onEnter = () => {
    if (canZoom) setLens((l) => ({ ...l, show: true }));
    setIsHovering(true);
  };
  const onLeave = () => {
    setLens((l) => ({ ...l, show: false }));
    setIsHovering(false);
  };
  const onMove = (e) => move(e.clientX, e.clientY);

  // ---------------- Video autoplay + sound ----------------
  const videoRef = useRef(null);
  const [showUnmute, setShowUnmute] = useState(false);
  const [muted, setMuted] = useState(false);

  // when switching away from video, pause it
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v) v.pause();
    };
  }, [active?.type, active?.src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || active?.type !== "video") return;

    let cancelled = false;

    const tryAutoplayWithSound = async () => {
      try {
        v.muted = false;
        setMuted(false);
        v.volume = 1;
        v.autoplay = true;
        const p = v.play();
        if (p && typeof p.then === "function") await p;
        if (!cancelled) setShowUnmute(false);
      } catch {
        // Fallback: autoplay muted, show unmute UI
        try {
          v.muted = true;
          setMuted(true);
          v.play().catch(() => {});
        } catch {}
        if (!cancelled) setShowUnmute(true);

        const unlock = () => {
          if (cancelled) return;
          v.muted = false;
          setMuted(false);
          v.volume = 1;
          v.play().catch(() => {});
          setShowUnmute(false);
          window.removeEventListener("pointerdown", unlock);
          window.removeEventListener("keydown", unlock);
        };
        window.addEventListener("pointerdown", unlock, { once: true });
        window.addEventListener("keydown", unlock, { once: true });
      }
    };

    tryAutoplayWithSound();
    return () => {
      cancelled = true;
    };
  }, [active?.type, active?.src]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.paused) v.play().catch(() => {});
  };

  // ---------------- Carousel controls + fade + auto (video first) ----------------
  const hasMultiple = media.length > 1;
  const AUTO_MS = 5000;   // every 5s
  const FADE_MS = 400;    // fade duration (ms)

  const [isVisible, setIsVisible] = useState(true);        // for fade class
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = (nextIndex) => {
    if (!hasMultiple || isTransitioning || nextIndex === activeIndex) return;
    setIsTransitioning(true);
    setIsVisible(false); // fade-out current
    setTimeout(() => {
      if (!isMounted.current) return;
      const mod = ((nextIndex % media.length) + media.length) % media.length;
      setActiveIndex(mod); // switch content while hidden
      setIsVisible(true);  // fade-in new
      setTimeout(() => {
        if (isMounted.current) setIsTransitioning(false);
      }, FADE_MS);
    }, FADE_MS);
  };

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  // keyboard arrows
  useEffect(() => {
    if (!hasMultiple) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMultiple, media.length, activeIndex, isTransitioning]);

  // autoplay every 5s; pause on hover/lightbox/transition; DO NOT advance while video is active
  useEffect(() => {
    if (!hasMultiple || isHovering || lightboxSrc || isTransitioning) return;
    if (active?.type === "video") return; // wait for video end
    const id = setInterval(() => {
      goNext(); // has own guard vs isTransitioning
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [hasMultiple, isHovering, lightboxSrc, isTransitioning, active?.type, activeIndex]);

  // when video finishes, go next with fade
  const handleVideoEnded = () => {
    if (!hasMultiple) return;
    goNext();
  };

  // ---------------- Thumbnails rail (kept) ----------------
  const thumbsRef = useRef(null);
  const thumbEls = useRef([]);
  const scrollThumbs = (dir) => {
    // dir: -1 left, +1 right
    thumbsRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };
  // ensure active thumb is visible/centered
  useEffect(() => {
    const el = thumbEls.current[activeIndex];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  // ---------------- UI state ----------------
  const [activeTab, setActiveTab] = useState("details");
  const liveCommentsCount = comments.length || comments_count;

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto mt-6 p-4 bg-[#2a587a] rounded-lg shadow-lg border-4 border-[#154965] grid grid-cols-1 md:grid-cols-[minmax(0,520px)_1fr] gap-6 text-black relative">
        {/* LEFT: main media with arrows */}
        <div className="flex flex-col items-stretch">
          <div
            ref={containerRef}
            className="relative w-full aspect-square bg-[#364a5e] rounded overflow-hidden shadow-inner select-none"
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            onMouseMove={onMove}
          >
            {/* Fade wrapper */}
            <div
              className={`absolute inset-0 transition-opacity duration-[${FADE_MS}ms] ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {active?.type === "video" ? (
                <div className="absolute inset-0">
                  <video
                    ref={videoRef}
                    src={active?.src}
                    controls
                    autoPlay
                    playsInline
                    onEnded={handleVideoEnded}
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                  />
                  {/* Unmute overlay */}
                  {showUnmute && (
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="absolute bottom-3 right-3 bg-black/70 text-white rounded-md px-3 py-1.5 flex items-center gap-2"
                      title="Play with sound"
                    >
                      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      <span className="text-sm">{muted ? "Unmute" : "Mute"}</span>
                    </button>
                  )}
                </div>
              ) : (
                <img
                  src={active?.src || "/Images/placeholder.png"}
                  alt={title || "Asset preview"}
                  className={`absolute inset-0 w-full h-full object-contain ${
                    canZoom ? "cursor-zoom-in" : ""
                  }`}
                  onClick={() => active?.src && setLightboxSrc(active.src)}
                  loading="eager"
                  draggable={false}
                />
              )}
            </div>

            {/* Lens overlay (only when image + hover + non-touch) */}
            {canZoom && lens.show && (
              <div
                className="pointer-events-none absolute border border-white/80 bg-white/10 backdrop-blur-[1px] rounded-md shadow-[0_8px_24px_rgba(0,0,0,.45)]"
                style={{
                  width: `${lens.w}px`,
                  height: `${lens.h}px`,
                  left: `${lens.x}px`,
                  top: `${lens.y}px`,
                  boxShadow:
                    "0 0 0 9999px rgba(0,0,0,.28), 0 8px 24px rgba(0,0,0,.45)",
                }}
              />
            )}

            {/* Arrow controls for main media */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white/60"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white/60"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* small position indicator */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {media.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-4 rounded-full ${
                        i === activeIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* --- KEPT: Thumbnails rail below the selected area --- */}
          {media.length > 0 && (
            <div className="mt-3 relative">
              {/* rail arrows */}
              {media.length > 6 && (
                <>
                  <button
                    type="button"
                    aria-label="Thumbs left"
                    onClick={() => scrollThumbs(-1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Thumbs right"
                    onClick={() => scrollThumbs(1)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div
                ref={thumbsRef}
                className="mx-7 flex gap-3 overflow-x-hidden pb-1"
              >
                {media.map((m, i) => {
                  const isActive = i === activeIndex;
                  return (
                    <button
                      key={`${m.type}-${m.src}-${i}`}
                      type="button"
                      ref={(el) => (thumbEls.current[i] = el)}
                      onClick={() => goTo(i)}
                      className={`relative shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 ${
                        isActive ? "border-[#b5946f]" : "border-white/20"
                      } focus:outline-none focus:ring-2 focus:ring-[#b5946f]/60`}
                      title={m.type === "video" ? "Play video" : "View image"}
                    >
                      {m.type === "video" ? (
                        <div className="relative w-full h-full bg-black/60 grid place-items-center">
                          <Play className="w-6 h-6 text-white/90" />
                        </div>
                      ) : (
                        <img
                          src={m.src}
                          alt={`thumb-${i}`}
                          className="w-full h-full object-cover hover:brightness-110"
                          draggable={false}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price under media */}
          <div className="mt-3 self-start bg-[#c7ad88] text-black font-semibold text-lg px-3 py-1 rounded border-2 border-[#b5946f]">
            {typeof points === "number" ? (
              <>{points.toLocaleString()} pts</>
            ) : typeof price === "number" ? (
              <>{formatPhp(price)}</>
            ) : (
              <>No price</>
            )}
          </div>
        </div>

        {/* RIGHT: floating zoom viewer ABOVE the details + the rest of details */}
        <div className="flex flex-col space-y-3 relative">
          {/* Lazada-style floating zoom viewer (desktop only, images only) */}
          {canZoom && (
            <div
              className={`hidden md:block absolute -top-1 right-0 z-30 rounded-xl border border-black/10 bg-white shadow-xl transition-opacity ${
                lens.show ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={{
                width: `${VIEW_W}px`,
                height: `${VIEW_H}px`,
                backgroundImage: `url(${active?.src})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${bg.w}px ${bg.h}px`,
                backgroundPosition: `${bg.x}px ${bg.y}px`,
              }}
              aria-hidden={!lens.show}
            />
          )}

          {/* spacer to avoid overlap while zoom viewer is visible */}
          <div className="hidden md:block" style={{ height: lens.show ? VIEW_H : 0 }} />

          {/* Details header */}
          <header className="flex justify-between items-center">
            <h1 className="font-extrabold text-2xl">{title || "Untitled Asset"}</h1>

            <div className="flex items-center gap-3">
              {/* Favorite toggle */}
              <button
                type="button"
                onClick={toggleFavorite}
                disabled={!userId || loading}
                className={`flex items-center gap-1 px-2 py-1 rounded border-2 border-[#b5946f] ${
                  isFavorite ? "bg-[#b5946f] text-white" : "bg-[#c7ad88] text-black"
                } ${!userId ? "opacity-60 cursor-not-allowed" : ""}`}
                title={!userId ? "Login to favorite" : isFavorite ? "Unfavorite" : "Favorite"}
              >
                <Heart className={isFavorite ? "fill-current" : ""} size={18} />
                <span className="text-sm">{favoritesCount}</span>
              </button>

              {/* Avg rating */}
              <div className="flex items-center gap-1 font-semibold">
                <Star size={20} className="text-yellow-400" />
                <span>{Number(avgRating).toFixed(1)}</span>
              </div>
            </div>
          </header>

          {/* Stats + visual stars */}
          <div className="space-y-1 text-sm">
            <div className="flex gap-4">
              <span>VIEWERS: {viewsCount}</span>
              <span>FAVORITES: {favoritesCount}</span>
              <span>COMMENTS: {liveCommentsCount}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < Math.round(avgRating);
                return (
                  <Star
                    key={i}
                    size={20}
                    className={filled ? "text-yellow-400" : "text-yellow-400/40"}
                    fill={filled ? "currentColor" : "none"}
                  />
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 font-semibold py-1 rounded border-2 border-[#b5946f] ${
                activeTab === "details" ? "bg-[#b5946f] text-white" : "bg-[#c7ad88] text-black"
              }`}
              type="button"
            >
              ASSET DETAILS
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 font-semibold py-1 rounded border-2 border-[#b5946f] ${
                activeTab === "reviews" ? "bg-[#b5946f] text-white" : "bg-[#c7ad88] text-black"
              }`}
              type="button"
            >
              REVIEWS
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "details" ? (
            <div className="flex-1 bg-[#326890] text-white p-3 rounded shadow-inner overflow-auto">
              <p className="font-semibold">
                {description?.trim() ? description : "No description provided for this asset yet."}
              </p>
            </div>
          ) : (
            <div className="flex-1 bg-[#326890] text-white p-3 rounded shadow-inner overflow-auto space-y-6">
              {/* Rating button → modal */}
              <div className="flex items-center gap-2">
                <label className="font-semibold">RATE THIS ASSET:</label>
                <button
                  type="button"
                  onClick={() => setShowRateModal(true)}
                  disabled={!userId || loading}
                  className={`px-3 py-1.5 rounded border-2 border-[#b5946f] ${
                    !userId
                      ? "bg-[#c7ad88] text-black opacity-60 cursor-not-allowed"
                      : "bg-[#b5946f] text-white hover:brightness-110"
                  }`}
                  title={!userId ? "Login to rate" : "Rate this asset"}
                >
                  Rate this Asset
                </button>
                {myRating ? (
                  <span className="text-sm opacity-80">Your rating: {myRating}/5</span>
                ) : null}
              </div>

              {/* Favorites quick toggle */}
              <div className="flex items-center gap-2">
                <label className="font-semibold">FAVORITE:</label>
                <button
                  type="button"
                  onClick={toggleFavorite}
                  disabled={!userId || loading}
                  className={`flex items-center gap-1 px-3 py-1 rounded border-2 border-[#b5946f] ${
                    isFavorite ? "bg-[#b5946f] text-white" : "bg-[#c7ad88] text-black"
                  } ${!userId ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={!userId ? "Login to favorite" : isFavorite ? "Unfavorite" : "Favorite"}
                >
                  <Heart className={isFavorite ? "fill-current" : ""} size={18} />
                  <span>{isFavorite ? "Favorited" : "Mark as Favorite"}</span>
                </button>
              </div>

              {/* Comments CRUD */}
              <div>
                <label className="font-semibold">COMMENTS:</label>

                {/* Add comment */}
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 rounded bg-white/90 text-black"
                    placeholder={userId ? "Write a comment..." : "Login to comment"}
                    disabled={!userId || loading}
                  />
                  <button
                    onClick={addComment}
                    disabled={!userId || loading || !commentText.trim()}
                    className={`px-3 py-2 rounded border-2 border-[#b5946f] ${
                      !userId || !commentText.trim()
                        ? "bg-[#c7ad88] text-black opacity-60 cursor-not-allowed"
                        : "bg-[#b5946f] text-white"
                    }`}
                  >
                    Post
                  </button>
                </div>

                {/* List */}
                <div className="bg-[#4379a6] rounded p-2 mt-3 max-h-[240px] overflow-y-auto space-y-2">
                  {comments.length ? (
                    comments.map((c) => {
                      const mine = userId && c.user_id === userId;
                      const isEditing = editingId === c.id;

                      return (
                        <div key={c.id} className="bg-[#3b6b93] rounded p-2">
                          <div className="flex justify-between items-center">
                            <p className="text-xs opacity-80">
                              {c.user?.name ? c.user.name : `User #${c.user_id}`}
                            </p>
                            {mine && !isEditing && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(c)}
                                  className="text-xs underline"
                                  disabled={loading}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteComment(c.id)}
                                  className="text-xs underline text-red-100"
                                  disabled={loading}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>

                          {!isEditing ? (
                            <p className="text-sm mt-1">{c.comment}</p>
                          ) : (
                            <div className="mt-2 flex gap-2">
                              <input
                                className="flex-1 px-2 py-1 rounded bg-white/90 text-black"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                disabled={loading}
                              />
                              <button
                                onClick={() => saveEdit(c.id)}
                                className="px-3 py-1 rounded bg-[#b5946f] text-white"
                                disabled={!editText.trim() || loading}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditText("");
                                }}
                                className="px-3 py-1 rounded bg-[#c7ad88] text-black"
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="italic opacity-75 text-sm">No comments yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Back */}
          <Link
            href={route("store")}
            className="self-start bg-[#c7ad88] text-black font-semibold px-3 py-1 rounded border-2 border-[#b5946f] hover:bg-[#b5946f] hover:text-white transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Lightbox (images only) */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white/90 hover:text-white"
            onClick={() => setLightboxSrc(null)}
            aria-label="Close"
          >
            <X size={28} />
          </button>
          <img
            src={normalizeMediaUrl(lightboxSrc)}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl"
          />
        </div>
      )}

      {/* Rate modal (5 stars) */}
      <RateModal
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        onSubmit={submitRating}
        initialValue={myRating}
        disabled={loading || !userId}
      />
    </AuthenticatedLayout>
  );
}
