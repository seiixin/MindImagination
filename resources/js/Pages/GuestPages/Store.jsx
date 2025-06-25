import GuestLayout from '@/Layouts/GuestLayout';
import HeroSlider from '@/Components/HeroSlider';
import { Link } from '@inertiajs/react';

export default function Store() {
  return (
    <GuestLayout>
      {/* Hero Banner */}
      <div className="backdrop-blur-md bg-white/10 rounded-xl shadow-inner border border-white/20 overflow-hidden mx-auto max-w-6xl mt-6">
        <HeroSlider />
      </div>

      {/* Store Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 text-white flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="md:w-1/4 w-full bg-[#00213a]/60 border border-white/20 rounded-xl p-4 backdrop-blur-md shadow-md space-y-6">
          <h3 className="text-xl font-bold text-center">Filters</h3>

          {/* Category Filter */}
          <div>
            <label className="block mb-1 text-sm font-semibold">Category</label>
            <select className="w-full px-3 py-2 rounded bg-[#001f35] border border-white/20 text-white">
              <option>All</option>
              <option>Character</option>
              <option>Environment</option>
              <option>UI Kit</option>
            </select>
          </div>

          {/* Point Range */}
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

          {/* Search Bar */}
          <div>
            <label className="block mb-1 text-sm font-semibold">Search</label>
            <input
              type="text"
              placeholder="Search assets..."
              className="w-full px-3 py-2 rounded bg-[#001f35] border border-white/20 text-white"
            />
          </div>
        </aside>

        {/* Product Grid */}
        <section className="flex-1 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item, index) => (
            <div
              key={index}
              className="bg-[#002744] border border-white/20 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition transform duration-200"
            >
              <Link href="/assets/sample-slug">
                <img
                  src={`/Images/${['LavaCaves.png', 'PlatformGameKit.jpg', 'RedHatBoy.png'][index]}`}
                  alt="Asset"
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-lg">Sample Asset {index + 1}</h3>
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
