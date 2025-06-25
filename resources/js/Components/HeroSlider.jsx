import { useEffect, useState } from 'react';

const slides = [
  {
    img: '/Images/LavaCaves.png',
    alt: 'Lava Caves'
  },
  {
    img: '/Images/PlatformGameKit.jpg',
    alt: 'PlatformGameKit '
  },
  {
    img: '/Images/RedHatBoy.png',
    alt: 'Red Hat Boy'
  }
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    setCurrent((current - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrent((current + 1) % slides.length);
  };

  return (
    <div className="relative w-full mt-4 overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${current * 100}%)`
        }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="w-full flex-shrink-0 min-w-full">
            <a href={slide.link} className="block">
              <img
                src={slide.img}
                alt={slide.alt}
                className="w-full h-[400px] object-contain bg-slate-800"
                loading="lazy"
              />
            </a>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors duration-200 z-10"
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors duration-200 z-10"
        onClick={goToNext}
        aria-label="Next slide"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
              index === current ? 'bg-white' : 'bg-white/50'
            }`}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
