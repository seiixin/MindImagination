import { useEffect, useState } from 'react';

export default function BackgroundEffect() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const blurAmount = Math.min(scrollY / 100, 8);
  const overlayOpacity = Math.min(scrollY / 500, 0.7);

  return (
    <div className="fixed inset-0 -z-10">
      <img
        src="/Images/background.jpg"
        alt="Background"
        className="w-full h-full object-cover brightness-110 contrast-125"
        style={{
          filter: `blur(${blurAmount}px)`,
          transition: 'filter 0.1s ease-out',
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#001f35]/40 to-[#001f35]/60"
        style={{
          opacity: 0.6 + overlayOpacity,
          transition: 'opacity 0.1s ease-out',
        }}
      />
    </div>
  );
}
