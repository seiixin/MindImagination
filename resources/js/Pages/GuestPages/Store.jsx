import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import HeroSlider from '@/Components/HeroSlider';

export default function Store() {
  const { auth } = usePage().props;
  const [showFilters, setShowFilters] = useState(true);

  const assets = [
    { name: 'Lava Caves', image: 'LavaCaves.png' },
    { name: 'Platform Game Kit', image: 'PlatformGameKit.jpg' },
    { name: 'Red Hat Boy', image: 'RedHatBoy.png' },
    { name: 'Sprout Lands', image: 'SproutLands.png' },
    { name: 'Game Kit', image: 'GameKit.png' },
    { name: 'Legacy', image: 'Legacy.png' },
  ];

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
            <span className="font-semibold">Your Points:</span>{' '}
            <span className="text-[#0ff] font-bold">{auth.user.points ?? '0'} pts</span>
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
              onClick={() => setShowFilters(prev => !prev)}
              className="md:hidden bg-white/10 border border-white/20 text-white px-3 py-1 rounded text-sm hover:bg-white/20 transition"
            >
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden md:block'} space-y-5 max-h-[350px] overflow-y-auto pr-1`}>
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
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full px-2 py-1 rounded bg-[#001f35] border border-white/20 text-white"
                />
                <span className="text-white/50">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full px-2 py-1 rounded bg-[#001f35] border border-white/20 text-white"
                />
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="block mb-1 text-sm font-semibold">Search</label>
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full px-3 py-2 rounded bg-[#001f35] border border-white/20 text-white"
              />
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
          {assets.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#002744] border border-white/20 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition transform duration-200"
            >
              <Link href="/assets/sample-slug">
                <img
                  src={`/Images/${item.image}`}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <p className="text-sm text-white/70">High-quality asset preview with dynamic tags.</p>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-[#cea76d] font-semibold">1,200 pts</span>
                    <div className="flex gap-2 text-white/60 text-xs items-center">
                      <span>⭐ 4.5</span>
                      <span>❤️ 120</span>
                      <span>👁️ 800</span>
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
