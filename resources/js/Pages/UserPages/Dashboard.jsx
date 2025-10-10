// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { auth } = usePage().props;
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const r = (name, params) => {
    try { return route(name, params); } catch { return '#'; }
  };

  useEffect(() => {
    const url = r('user.owned-assets.index');
    setLoading(true);
    fetch(url, { credentials: 'same-origin' })
      .then(res => res.json())
      .then(json => setAssets(Array.isArray(json?.data) ? json.data : []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <div className="min-h-screen flex items-center justify-center p-4">
        <main className="bg-white/10 border border-blue-700 backdrop-blur-md rounded-lg max-w-3xl w-full p-6 flex flex-col shadow-lg">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
            <div>
              <h1 className="text-white font-semibold text-xl sm:text-2xl">
                HELLO {String(auth.user.name || '').toUpperCase()}
              </h1>
              <p className="text-slate-200 font-semibold">
                AVAILABLE POINTS:{' '}
                <span id="availablePoints">
                  {Number(auth.user.points ?? 0).toLocaleString()}
                </span>{' '}
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
                // Support both keys from backend: has_maintenance OR maintenance
                const hasMaintenance = (asset.has_maintenance ?? asset.maintenance) === true;
                // Use maintenance_cost if available; else fall back to points
                const cost = hasMaintenance
                  ? Number(asset.maintenance_cost ?? 0)
                  : Number(asset.points ?? 0);

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

                    {/* Title */}
                    <div className="flex flex-col justify-center flex-grow">
                      <h2 className="text-white font-bold text-xl truncate">{asset.title}</h2>
                    </div>

                    {/* Actions / Cost */}
                    <div className="flex flex-col items-end justify-between gap-2">
                      <span className="text-slate-200 text-xs font-semibold tracking-wider">
                        RE-DOWNLOAD COST
                      </span>

                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
                        {asset.downloadable && (
                          <a
                            href={asset.download_url}
                            className="inline-flex items-center gap-2 bg-white/90 text-black px-3 py-1 rounded hover:bg-white font-semibold text-sm"
                          >
                            DOWNLOAD
                          </a>
                        )}

                        {/* Cost chip → now shows maintenance_cost when available */}
                        <span className="bg-amber-300 text-amber-900 px-3 rounded flex items-center gap-1 font-semibold text-sm">
                          {isFinite(cost) ? cost : 0}
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" className="inline-block">
                            <circle cx="12" cy="12" r="10" fill="#fbbf24" />
                            <path d="M12 6v6l3 3" stroke="#a16207" strokeWidth="1.5" fill="none" />
                            <circle cx="12" cy="12" r="4" fill="none" stroke="#a16207" strokeWidth="1.5" />
                          </svg>
                        </span>
                      </div>
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
