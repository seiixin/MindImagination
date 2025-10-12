// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function Dashboard() {
  const { auth } = usePage().props;

  const [assets, setAssets]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints]   = useState(Number(auth?.user?.points ?? 0));
  const [busyId, setBusyId]   = useState(null);

  // Safe route() helper (fallback to "#")
  const r = (name, params) => {
    try { return route(name, params); } catch { return '#'; }
  };

  const showError = async (title = 'Oops!', text = 'Something went wrong.') => {
    await Swal.fire({ icon: 'error', title, text, confirmButtonText: 'OK' });
  };

  const showToast = (title = 'Done') =>
    Swal.fire({
      icon: 'success',
      title,
      toast: true,
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false,
    });

  useEffect(() => {
    const url = r('user.owned-assets.index');
    setLoading(true);
    fetch(url, { credentials: 'same-origin' })
      .then(res => res.json())
      .then(json => setAssets(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (asset) => {
    if (!asset?.downloadable || busyId === asset.id) return;

    setBusyId(asset.id);
    try {
      // 1) PREVIEW (GET)
      const previewUrl = asset.preview_url || r('user.owned-assets.preview', asset.id);
      const previewRes = await fetch(previewUrl, { credentials: 'same-origin' });

      if (!previewRes.ok) {
        const t = await previewRes.text();
        await showError('Preview Failed', t || 'Failed to check download cost.');
        return;
      }

      const preview   = await previewRes.json();
      const costNow   = Number(preview?.cost_now ?? 0);
      const canAfford = Boolean(preview?.can_afford ?? true);

      // If they can’t afford, offer Buy Points
      if (costNow > 0 && !canAfford) {
        const buy = await Swal.fire({
          icon: 'warning',
          title: 'Insufficient points',
          text: `You need ${costNow} points to re-download this file.`,
          showCancelButton: true,
          confirmButtonText: 'Buy Points',
          cancelButtonText: 'Cancel',
          reverseButtons: true,
        });
        if (buy.isConfirmed) {
          window.location.assign(r('buy-points'));
        }
        return;
      }

      // 2) SweetAlert2 CONFIRM
      const confirmHtml =
        costNow > 0
          ? `<div class="text-left">
               <p class="mb-2">This download costs <b>${costNow}</b> points (maintenance).</p>
               <p class="text-xs opacity-80">Points will be deducted upon download.</p>
             </div>`
          : `<div class="text-left">
               <p class="mb-2"><b>First download is free.</b></p>
               <p class="text-xs opacity-80">Maintenance may apply on your next download.</p>
             </div>`;

      const result = await Swal.fire({
        icon: costNow > 0 ? 'warning' : 'info',
        title: 'Confirm download',
        html: confirmHtml,
        showCancelButton: true,
        confirmButtonText: 'Download',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        focusConfirm: false,
      });

      if (!result.isConfirmed) return;

      // 3) DOWNLOAD VIA GET (?confirm=1) — no CSRF needed
      const base =
        asset.download_url ||
        r('user.owned-assets.download.get', asset.id) ||
        r('user.owned-assets.download', asset.id);
      const dlUrl = `${base}${base.includes('?') ? '&' : '?'}confirm=1`;

      // Optional “Starting…” toast (fires immediately)
      Swal.fire({
        title: 'Preparing your download…',
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // Keep UI points in sync locally (server does the real deduction)
      if (costNow > 0) {
        setPoints((p) => Math.max(0, Number(p || 0) - costNow));
      }

      // 4) Navigate — server will redirect/stream the file
      window.location.assign(dlUrl);
      // If the page continues (e.g., pop-up blocked), close loader after a short while
      setTimeout(() => Swal.close(), 3000);
    } catch (e) {
      console.error(e);
      await showError('Download Error', e?.message || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <div className="min-h-screen flex items-center justify-center p-4">
        <main className="bg-white/10 border border-blue-700 backdrop-blur-md rounded-lg max-w-3xl w-full p-6 flex flex-col shadow-lg">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
            <div>
              <h1 className="text-white font-semibold text-xl sm:text-2xl">
                HELLO {String(auth?.user?.name || '').toUpperCase()}
              </h1>
              <p className="text-slate-200 font-semibold">
                AVAILABLE POINTS{' '}
                <span id="availablePoints">{Number(points).toLocaleString()}</span>{' '}
                (Max Points)
              </p>
            </div>
            <Link
              href={r('buy-points')}
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-semibold py-2 px-4 rounded shadow transition"
            >
              BUY POINTS
            </Link>
          </header>

          {/* Owned Assets */}
          <section className="border-t border-blue-700 pt-4 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto scrollbar-thin pr-2 space-y-6 max-h-[400px]">
              {loading && <div className="text-slate-200">Loading your assets…</div>}

              {!loading && assets.length === 0 && (
                <div className="text-slate-200">No owned assets yet.</div>
              )}

              {!loading && assets.map((asset) => {
                const hasMaintenance  = Boolean(asset?.has_maintenance ?? asset?.maintenance);
                const maintenanceCost = Number(asset?.maintenance_cost ?? 0);

                return (
                  <article key={asset.id} className="flex border-b border-blue-700 pb-4 gap-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <img
                        src={asset.image_url}
                        alt={asset.title}
                        className="w-20 h-20 object-cover rounded shadow"
                        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                      />
                    </div>

                    {/* Title & chips */}
                    <div className="flex flex-col justify-center flex-grow min-w-0">
                      <h2 className="text-white font-bold text-xl truncate">{asset.title}</h2>

                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {/* Points chip */}
                        <span className="bg-amber-300 text-amber-900 px-3 rounded flex items-center gap-1 font-semibold text-sm">
                          {Number(asset.points ?? 0)}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="inline-block">
                            <circle cx="12" cy="12" r="10" fill="#fbbf24" />
                            <path d="M12 6v6l3 3" stroke="#a16207" strokeWidth="1.5" fill="none" />
                            <circle cx="12" cy="12" r="4" fill="none" stroke="#a16207" strokeWidth="1.5" />
                          </svg>
                        </span>

                        {/* Maintenance chip */}
                        {hasMaintenance && (
                          <span className="bg-fuchsia-300 text-fuchsia-900 px-3 rounded font-semibold text-xs tracking-wide">
                            MAINTENANCE{maintenanceCost > 0 ? `: ${maintenanceCost}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex flex-col items-end justify-center gap-2">
                      {asset.downloadable && (
                        <button
                          onClick={() => handleDownload(asset)}
                          disabled={busyId === asset.id}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded font-semibold text-sm ${
                            busyId === asset.id
                              ? 'bg-white/60 text-black cursor-not-allowed'
                              : 'bg-white/90 text-black hover:bg-white'
                          }`}
                        >
                          {busyId === asset.id ? 'WORKING…' : 'DOWNLOAD'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}