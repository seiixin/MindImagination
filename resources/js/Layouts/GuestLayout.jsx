// resources/js/Layouts/GuestLayout.jsx
import Navigation from '@/Components/Navigation';
import { useEffect, useState } from 'react';

export default function GuestLayout({ children }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate blur amount based on scroll position (0 to 8px blur)
  const blurAmount = Math.min(scrollY / 100, 8);

  // Calculate opacity for overlay (increases with scroll)
  const overlayOpacity = Math.min(scrollY / 500, 0.7);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#001f35]/40 to-[#001f35]/60 overflow-x-hidden">
      {/* Background Layer with Scroll Blur */}
      <div className="fixed inset-0 -z-10">
        <img
          src="/Images/background.jpg"
          alt="Background"
          className="w-full h-full object-cover brightness-110 contrast-125"
          style={{
            filter: `blur(${blurAmount}px)`,
            transition: 'filter 0.1s ease-out'
          }}
        />

        {/* Gradient overlay that increases with scroll */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#001f35]/40 to-[#001f35]/60"
          style={{
            opacity: 0.6 + overlayOpacity,
            transition: 'opacity 0.1s ease-out'
          }}
        />
      </div>

      {/* Fixed Navigation */}
      <Navigation />

      {/* Foreground Content with top padding to account for fixed navbar */}
      <div className="relative z-10 pt-12">
        {children}
      </div>
    </div>
  );
}
