// resources/js/Pages/Dashboard.jsx
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';

export default function Dashboard() {
  const { auth } = usePage().props;

  const assets = [
    {
      title: 'ASSETS TITLE',
      img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80',
      points: 10,
      maintenance: true,
      download: true,
    },
    {
      title: 'ASSETS TITLE',
      img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=80&q=80',
      points: 20,
      maintenance: true,
      download: true,
    },
  ];

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <div className="min-h-screen flex items-center justify-center p-4">
        <main className="bg-white/10 border border-blue-700 backdrop-blur-md rounded-lg max-w-3xl w-full p-6 flex flex-col shadow-lg">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
            <div>
              <h1 className="text-white font-semibold text-xl sm:text-2xl">
                HELLO {auth.user.name.toUpperCase()}
              </h1>
              <p className="text-slate-200 font-semibold">
                AVAILABLE POINTS:{' '}
                <span id="availablePoints">
                  {auth.user.points?.toLocaleString() || 0}
                </span>{' '}
                (Max Points)
              </p>
            </div>
            <Link
            href={route('buy-points')}
            className="bg-cyan-400 hover:bg-cyan-300 text-black font-semibold py-2 px-4 rounded shadow transition"
            >
            BUY POINTS
            </Link>

          </header>

          {/* Assets List */}
          <section className="border-t border-blue-700 pt-4 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-y-auto scrollbar-thin pr-2 space-y-6 max-h-[400px]">
              {assets.map((asset, index) => (
                <article
                  key={index}
                  className="flex border-b border-blue-700 pb-4 gap-4"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={asset.img}
                      alt={asset.title}
                      className="w-20 h-20 object-cover rounded shadow"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-grow">
                    <h2 className="text-white font-bold text-xl">
                      {asset.title}
                    </h2>
                    <div className="flex justify-end gap-4 text-white font-semibold text-sm">
                      {asset.maintenance && <span>MAINTENANCE</span>}
                      {asset.download && <span>DOWNLOAD</span>}
                      <span className="bg-amber-300 text-amber-900 px-3 rounded flex items-center gap-1">
                        {asset.points}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="#a16207"
                          viewBox="0 0 24 24"
                          stroke="#a16207"
                          strokeWidth="1.5"
                          width="18"
                          height="18"
                          className="inline-block"
                        >
                          <circle cx="12" cy="12" r="10" fill="#fbbf24" />
                          <path d="M12 6v6l3 3" stroke="#a16207" />
                          <circle
                            cx="12"
                            cy="12"
                            r="4"
                            fill="none"
                            stroke="#a16207"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </AuthenticatedLayout>
  );
}
