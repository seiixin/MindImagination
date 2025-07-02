import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Star } from 'lucide-react'; // assuming you used lucide-react icons in Store.jsx

export default function AssetDetails() {
  const [activeTab, setActiveTab] = useState('details');
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(null);
  const [comments] = useState([]); // dummy comments

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto mt-6 p-4 bg-[#2a587a] rounded-lg shadow-lg border-4 border-[#154965] grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 text-black">
        {/* Left panel */}
        <div className="flex flex-col items-center">
          <div className="w-[230px] h-[170px] bg-[#364a5e] rounded shadow-inner overflow-hidden">
            <img src="/Images/LavaCaves.png" alt="Asset preview" className="object-cover w-full h-full" />
          </div>
          <div className="mt-3 bg-[#c7ad88] text-black font-semibold text-lg px-3 py-1 rounded border-2 border-[#b5946f]">
            1,200 pts
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col space-y-3">


          <header className="flex justify-between items-center">
            <h1 className="font-extrabold text-2xl">Lava Caves</h1>
            <div className="flex items-center gap-1 font-semibold">
              <Star size={20} className="text-yellow-400" />
              <span>2000</span>
            </div>
          </header>

          <div className="space-y-1 text-sm">
            <div>VIEWERS: 2000</div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={20} className="text-yellow-400" />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 bg-[#c7ad88] text-black font-semibold rounded py-1 hover:bg-[#b5946f] transition">
              YOUTUBE VIDEO
            </button>
            {[1,2,3,4,5].map(i => (
              <button key={i} className="flex-1 bg-[#c7ad88] text-black font-semibold rounded py-1 hover:bg-[#b5946f] transition">
                IMAGE
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 font-semibold py-1 rounded border-2 border-[#b5946f] ${
                activeTab === 'details' ? 'bg-[#b5946f] text-white' : 'bg-[#c7ad88] text-black'
              }`}
            >
              ASSET DETAILS
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 font-semibold py-1 rounded border-2 border-[#b5946f] ${
                activeTab === 'reviews' ? 'bg-[#b5946f] text-white' : 'bg-[#c7ad88] text-black'
              }`}
            >
              REVIEWS
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'details' ? (
            <div className="flex-1 bg-[#326890] text-white p-3 rounded shadow-inner overflow-auto">
              <p className="font-semibold">Detailed description of Lava Caves asset goes here...</p>
            </div>
          ) : (
            <div className="flex-1 bg-[#326890] text-white p-3 rounded shadow-inner overflow-auto space-y-3">
              <div>
                <label className="font-semibold">RATE THIS ASSET:</label>
                <div className="flex gap-1 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <button
                      key={i}
                      onClick={() => setRating(i)}
                      className={`w-6 h-6 rounded ${i <= rating ? 'bg-yellow-400' : 'bg-[#c7ad88]'} transition`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold">DO YOU LIKE THIS ASSET:</label>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => setLiked(true)}
                    className={`w-6 h-6 rounded ${liked === true ? 'bg-yellow-400' : 'bg-[#c7ad88]'}`}
                  >👍</button>
                  <button
                    onClick={() => setLiked(false)}
                    className={`w-6 h-6 rounded ${liked === false ? 'bg-yellow-400' : 'bg-[#c7ad88]'}`}
                  >👎</button>
                </div>
              </div>

              <div>
                <label className="font-semibold">COMMENTS LIST:</label>
                <div className="bg-[#4379a6] rounded p-2 max-h-[120px] overflow-y-auto mt-1">
                  {comments.length === 0 ? (
                    <p className="italic opacity-75">No comments yet.</p>
                  ) : (
                    comments.map((c, i) => <p key={i}>{c}</p>)
                  )}
                </div>
              </div>
            </div>

          )}
                    {/* Back button */}
          <Link
            href={route('store')}
            className="self-start bg-[#c7ad88] text-black font-semibold px-3 py-1 rounded border-2 border-[#b5946f] hover:bg-[#b5946f] hover:text-white transition"
          >
            ← Back
          </Link>
        </div>

      </div>
    </AuthenticatedLayout>
  );
}
