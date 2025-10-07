// resources/js/Components/HeroSlider.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";

export default function HeroSlider() {
  const { slides: pageSlides = [] } = usePage().props;

  // Normalize incoming slides to a consistent shape (src, alt, link?)
  const slides = useMemo(() => {
    if (!Array.isArray(pageSlides)) return [];
    return pageSlides
      .filter(s => s && (s.image_path || s.src || s.img))
      .map((s) => ({
        src: s.image_path || s.src || s.img,
        alt: s.details || s.alt || "Slide",
        link: s.link || null,
        id: s.id ?? `${s.image_path || s.src || s.img}-${Math.random().toString(36).slice(2)}`
      }));
  }, [pageSlides]);

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);
  const canSlide = slides.length > 1;

  const goTo = (idx) => setCurrent((idx + slides.length) % slides.length);
  const goToPrevious = () => goTo(current - 1);
  const goToNext = () => goTo(current + 1);

  // Autoplay (pause on hover or if only one slide)
  useEffect(() => {
    if (!canSlide || paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timerRef.current);
  }, [slides.length, paused, canSlide]);

  if (!slides.length) return null;

  return (
    <div
      className="relative w-full mt-4 overflow-hidden rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured slides"
    >
      {/* Slides track */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide, index) => {
          const content = (
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-[400px] object-contain bg-slate-800"
              loading={index === 0 ? "eager" : "lazy"}
            />
          );

          return (
            <div
              key={slide.id || index}
              className="w-full flex-shrink-0 min-w-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              {slide.link ? (
                <a href={slide.link} className="block" tabIndex={-1}>
                  {content}
                </a>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      {canSlide && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors duration-200 z-10 focus:outline-none focus:ring focus:ring-white/50"
            onClick={goToPrevious}
            aria-label="Previous slide"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors duration-200 z-10 focus:outline-none focus:ring focus:ring-white/50"
            onClick={goToNext}
            aria-label="Next slide"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {canSlide && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                index === current ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
