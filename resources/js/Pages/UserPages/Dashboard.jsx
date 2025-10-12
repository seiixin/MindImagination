// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
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

  const jsonHeaders = useMemo(() => ({
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }), []);

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

  // Extract human error from a fetch Response
  const extractErrorMessage = async (res) => {
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await res.json();
        // Laravel validation/abort patterns
        if (typeof j?.message === 'string' && j.message.trim()) return j.message;
        if (typeof j?.error === 'string' && j.error.trim()) return j.error;
        if (typeof j?.errors === 'object' && j?.errors) {
          const first = Object.values(j.errors)?.[0];
          if (Array.isArray(first) && first[0]) return String(first[0]);
        }
        // Custom preview payloads sometimes include message
        if (j?.code === 'NOT_ENOUGH_POINTS') return 'Not enough points';
      } else {
        const t = await res.text();
        if (t && t.length < 500) return t;
      }
    } catch { /* ignore */ }
    // Fallback by status
    if (res.status === 422) return 'Not enough points';
    if (res.status === 409) return 'Confirmation required';
    if (res.status === 403) return 'You do not have access to this asset.';
    if (res.status === 404) return 'File not found.';
    return `Request failed (HTTP ${res.status}).`;
  };

  useEffect(() => {
    const url = r('user.owned-assets.index');
    setLoading(true);
    fetch(url, { credentials: 'same-origin', headers: jsonHeaders })
      .then(async (res) => {
        if (!res.ok) throw new Error(await extractErrorMessage(res));
        return res.json();
      })
      .then(json => {
        const list = Array.isArray(json?.data) ? json.data : [];
        setAssets(list);
      })
      .catch(async (e) => {
        setAssets([]);
        await showError('Load Failed', e?.message || 'Unable to load your assets.');
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async (asset) => {
    if (!asset?.downloadable || busyId === asset.id) return;

    // If API already told us it's blocked, stop early with the same message.
    if (asset?.downloadable_now === false) {
      const reason = asset?.blocked_reason || 'Not enough points';
      return showError('Download Blocked', reason);
    }

    setBusyId(asset.id);
    try {
      // 1) PREVIEW (GET) — check cost/affordability
      const previewUrl =
        asset.preview_url ||
        r('user.owned-assets.preview', asset.id);

      const previewRes = await fetch(previewUrl, {
        credentials: 'same-origin',
        headers: jsonHeaders,
      });

      if (!previewRes.ok) {
        // Bubble up the exact preview error
        const msg = await extractErrorMessage(previewRes);
        await showError('Preview Failed', msg);
        return;
      }

      const preview   = await previewRes.json();
      const costNow   = Number(preview?.cost_now ?? 0);
      const canAfford = Boolean(preview?.can_afford ?? true);

      // Not enough points → stop with proper message
      if (costNow > 0 && !canAfford) {
        const buy = await Swal.fire({
          icon: 'error',
          title: 'Not enough points',
          text: `You need ${costNow} points to re-download this file.`,
          showCancelButton: true,
          confirmButtonText: 'Buy Points',
          cancelButtonText: 'Close',
          reverseButtons: true,
        });
        if (buy.isConfirmed) window.location.assign(r('buy-points'));
        return;
      }

      // 2) CONFIRM (only if maintenance cost applies)
      if (costNow > 0) {
        const result = await Swal.fire({
          icon: 'warning',
          title: 'Confirm download',
          showCancelButton: true,
          confirmButtonText: 'Download',
          cancelButtonText: 'Cancel',
          reverseButtons: true,
          focusConfirm: false,
        });
        if (!result.isConfirmed) return;
      } else {
        // First-time free message (optional)
        await Swal.fire({
          icon: 'info',
          title: 'First download is free',
          text: 'Maintenance points may apply on your next download.',
          confirmButtonText: 'Continue',
        });
      }

      // 3) DOWNLOAD (GET with ?confirm=1) but request JSON so server returns {url}
      const base =
        asset.download_url ||
        r('user.owned-assets.download.get', asset.id) || // if you have a named GET route
        r('user.owned-assets.download', asset.id);       // fallback

      const dlUrl = `${base}${base.includes('?') ? '&' : '?'}confirm=1`;

      // Show loading while we request a signed URL / response
      Swal.fire({
        title: 'Preparing your download…',
        allowEscapeKey: false,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const dlRes = await fetch(dlUrl, {
        credentials: 'same-origin',
        headers: jsonHeaders,
      });

      if (!dlRes.ok) {
        const msg = await extractErrorMessage(dlRes);
        await showError('Download Error', msg);
        return;
      }

      // Expect { url: "..." }
      const payload = await dlRes.json();
      if (payload?.url) {
        // Update local points after confirmed deduction
        if (Number(costNow) > 0) {
          setPoints((p) => Math.max(0, Number(p || 0) - Number(costNow)));
        }
        Swal.close();
        window.location.assign(payload.url);
        // Optional success toast
        setTimeout(() => showToast('Download started'), 400);
      } else {
        await showError('Download Error', 'No download URL returned.');
      }
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
                const hasMaintenance   = Boolean(asset?.has_maintenance ?? asset?.maintenance);
                const maintenanceCost  = Number(asset?.maintenance_cost ?? 0);
                const costNow          = Number(asset?.cost_now ?? 0);
                const downloadableNow  = asset?.downloadable_now !== undefined ? Boolean(asset.downloadable_now) : true;
                const blockedReason    = asset?.blocked_reason || (costNow > 0 && !Boolean(asset?.can_afford) ? 'Not enough points' : null);

                const buttonDisabled =
                  busyId === asset.id ||
                  !asset?.downloadable ||
                  downloadableNow === false;

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
                          <span className="bg-fuchsia-300 text-fuchsia-900 px-3 rounded font-semibold text-xs tracking-wide inline-flex items-center gap-1">
                            <span>MAINTENANCE</span>
                            {maintenanceCost > 0 && (
                              <span className="inline-flex items-center gap-1">                          
                                <span>:</span>
                                {/* coin icon */}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  width="14"
                                  height="14"
                                  aria-hidden="true"
                                  className="inline-block"
                                >
                                  <circle cx="12" cy="12" r="10" fill="#fbbf24" />
                                  <path d="M12 6v6l3 3" stroke="#a16207" strokeWidth="1.5" fill="none" />
                                  <circle cx="12" cy="12" r="4" fill="none" stroke="#a16207" strokeWidth="1.5" />
                                </svg>
                                <span>{maintenanceCost}</span>
                              </span>
                            )}
                          </span>
                        )}


                        {/* Cost-now chip (when sent by API) */}
                        {/* Blocked reason chip */}
                        {blockedReason && (
                          <span className="bg-rose-300 text-rose-900 px-3 rounded font-semibold text-xs tracking-wide">
                            {blockedReason.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex flex-col items-end justify-center gap-2">
                      {asset.downloadable && (
                        <button
                          onClick={() => handleDownload(asset)}
                          disabled={buttonDisabled}
                          title={blockedReason || ''}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded font-semibold text-sm ${
                            buttonDisabled
                              ? 'bg-white/60 text-black cursor-not-allowed'
                              : 'bg-white/90 text-black hover:bg-white'
                          }`}
                        >
                          {busyId === asset.id ? 'WORKING…' : (downloadableNow === false ? 'BLOCKED' : 'DOWNLOAD')}
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
