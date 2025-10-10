// resources/js/Pages/GuestPages/PrivacyPolicy.jsx
import { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import axios from 'axios';

const views = ['privacy', 'about'];

export default function PrivacyPolicy() {
  const [currentView, setCurrentView] = useState(0);

  // --- NEW: load privacy / about content from backend ---
  const [policies, setPolicies] = useState({
    privacy: { description: '', items: [] },
    about:   { description: '', items: [] },
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let mounted = true;
    axios.get('/policy/guest')
      .then(res => {
        if (!mounted) return;
        setPolicies({
          privacy: {
            description: res.data?.privacy?.description ?? '',
            items: Array.isArray(res.data?.privacy?.items) ? res.data.privacy.items : [],
          },
          about: {
            description: res.data?.about?.description ?? '',
            items: Array.isArray(res.data?.about?.items) ? res.data.about.items : [],
          },
        });
      })
      .catch(() => {
        if (!mounted) return;
        setErr('Failed to load policy content.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleNext = () => setCurrentView((currentView + 1) % views.length);
  const handlePrev = () => setCurrentView((currentView - 1 + views.length) % views.length);

  // Small helper for decorative icons on list items
  const iconFor = (i) => ['⚡','🔒','🗑️','✨','✅','🎯','📌','⭐','🧩','💡'][i % 10];

  const active = views[currentView]; // 'privacy' | 'about'
  const data   = policies[active] || { description: '', items: [] };

  return (
    <GuestLayout>
      <section className="max-w-4xl mx-auto px-4 py-12 text-white">
        <div className="relative bg-gradient-to-br from-orange-900/60 via-orange-800/50 to-amber-900/60 backdrop-blur-md border-2 border-orange-300/40 rounded-xl shadow-2xl p-8 overflow-hidden">

          {/* Decorative Game Elements */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-amber-400/80 rounded-full shadow-lg animate-pulse"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400/80 rounded-full shadow-lg animate-pulse delay-1000"></div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-amber-400/80 rounded-full shadow-lg animate-pulse delay-500"></div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-400/80 rounded-full shadow-lg animate-pulse delay-1500"></div>

          {/* Power-up style corners */}
          <div className="absolute top-4 left-4 w-3 h-3 bg-white/80 rounded-full animate-bounce"></div>
          <div className="absolute top-4 right-4 w-3 h-3 bg-white/80 rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-white/80 rounded-full animate-bounce delay-600"></div>
          <div className="absolute bottom-4 right-4 w-3 h-3 bg-white/80 rounded-full animate-bounce delay-900"></div>

          {/* Game-style border effect */}
          <div className="absolute inset-0 rounded-xl border border-amber-200/20 animate-pulse"></div>

          {/* Navigation Arrows - Game Controller Style */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-orange-800/70 hover:bg-orange-700/80 text-white border border-orange-300/50 rounded-lg p-3 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-orange-800/70 hover:bg-orange-700/80 text-white border border-orange-300/50 rounded-lg p-3 transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Level/Page Indicator */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-orange-900/70 border border-amber-300/60 rounded-full px-4 py-1 text-sm font-bold text-amber-100 shadow-lg">
            LEVEL {currentView + 1} / {views.length}
          </div>

          {/* Main Content Container */}
          <div className="mt-12 mb-4 transition-all duration-500 ease-in-out transform">
            {active === 'privacy' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-amber-100 mb-2 drop-shadow-lg">
                    🛡️ PRIVACY POLICY
                  </h1>
                  <div className="w-32 h-1 bg-amber-300/80 mx-auto rounded-full shadow-lg"></div>
                </div>

                <div className="bg-orange-900/30 border border-orange-300/30 rounded-lg p-6 backdrop-blur-sm">
                  {/* Description */}
                  {loading ? (
                    <p className="mb-4 text-lg text-orange-50 leading-relaxed animate-pulse">
                      Loading policy…
                    </p>
                  ) : err ? (
                    <p className="mb-4 text-lg text-red-200 leading-relaxed">
                      {err}
                    </p>
                  ) : (
                    <p className="mb-4 text-lg text-orange-50 leading-relaxed">
                      {data.description || 'No privacy content available yet.'}
                    </p>
                  )}

                  {/* Bullet Points */}
                  <div className="space-y-3">
                    {loading ? (
                      <>
                        <div className="flex items-start space-x-3 bg-orange-800/20 p-3 rounded-lg border border-orange-400/20 animate-pulse h-14" />
                        <div className="flex items-start space-x-3 bg-orange-800/20 p-3 rounded-lg border border-orange-400/20 animate-pulse h-14" />
                        <div className="flex items-start space-x-3 bg-orange-800/20 p-3 rounded-lg border border-orange-400/20 animate-pulse h-14" />
                      </>
                    ) : (
                      (data.items && data.items.length > 0 ? data.items : []).map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-3 bg-orange-800/20 p-3 rounded-lg border border-orange-400/20">
                          <span className="text-amber-300 text-xl">{iconFor(idx)}</span>
                          <span className="text-orange-50">{item}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-amber-100 mb-2 drop-shadow-lg">
                    🎮 ABOUT US
                  </h1>
                  <div className="w-32 h-1 bg-amber-300/80 mx-auto rounded-full shadow-lg"></div>
                </div>

                <div className="bg-orange-900/30 border border-orange-300/30 rounded-lg p-6 backdrop-blur-sm">
                  {/* Description */}
                  {loading ? (
                    <p className="mb-4 text-lg text-orange-50 leading-relaxed animate-pulse">
                      Loading about…
                    </p>
                  ) : err ? (
                    <p className="mb-4 text-lg text-red-200 leading-relaxed">
                      {err}
                    </p>
                  ) : (
                    <p className="mb-4 text-lg text-orange-50 leading-relaxed">
                      {data.description || 'No about content available yet.'}
                    </p>
                  )}

                  {/* Bullet Points (render if present) */}
                  {(loading || (data.items && data.items.length)) && (
                    <div className="bg-orange-800/20 p-4 rounded-lg border border-orange-400/20">
                      {loading ? (
                        <div className="space-y-3">
                          <div className="h-4 bg-white/20 rounded animate-pulse" />
                          <div className="h-4 bg-white/20 rounded animate-pulse" />
                          <div className="h-4 bg-white/20 rounded animate-pulse" />
                        </div>
                      ) : (
                        <ul className="list-disc list-inside space-y-2 text-orange-50">
                          {(data.items || []).map((item, idx) => (
                            <li key={idx} className="leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-2 bg-orange-900/60 rounded-full overflow-hidden border border-orange-400/30">
            <div
              className="h-full bg-gradient-to-r from-amber-400/90 to-orange-300/90 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${((currentView + 1) / views.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </section>
    </GuestLayout>
  );
}
