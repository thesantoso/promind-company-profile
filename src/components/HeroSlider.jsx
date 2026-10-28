import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HERO_SLIDES = [
  {
    url: '/assets/jakarta1.jpg',
    alt: 'Deretan gedung pencakar langit kawasan Sudirman dan SCBD Jakarta',
  },
  {
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Jakarta_CBD.jpg/1920px-Jakarta_CBD.jpg',
    alt: 'Gedung perkantoran dan komersial di Central Business District Jakarta',
  },
  {
    url: '/assets/jakarta-skyline-3.jpg',
    alt: 'Panorama malam kawasan bisnis Semanggi dan gedung pencakar langit Jakarta',
  },
  {
    url: '/assets/jakarta2.jpg',
    alt: 'Kawasan terpadu gedung pencakar langit di Jakarta',
  },
];

export default function HeroSlider({ slides = HERO_SLIDES }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const items = slides && slides.length > 0 ? slides : HERO_SLIDES;

  useEffect(() => {
    if (activeSlide >= items.length) {
      setActiveSlide(0);
    }
    if (items.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length, activeSlide]);

  const prevSlide = () => {
    if (items.length <= 1) return;
    setActiveSlide((prev) => (prev - 1 + items.length) % items.length);
  };

  const nextSlide = () => {
    if (items.length <= 1) return;
    setActiveSlide((prev) => (prev + 1) % items.length);
  };

  return (
    <div className="hero-image">
      {items.map((slide, idx) => (
        <div
          key={slide.url || idx}
          className={`hero-slide ${idx === activeSlide ? 'is-active' : ''}`}
          aria-hidden={idx !== activeSlide}
        >
          <img
            src={slide.url}
            alt={slide.alt || 'Foto Hero'}
            loading={idx === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}
      <div className="hero-gradient" />

      {/* Minimalist Slider Controls (only shown if more than 1 item) */}
      {items.length > 1 && (
        <div className="hero-slider-controls">
          <button
            type="button"
            onClick={prevSlide}
            className="text-white/80 hover:text-white p-1 cursor-pointer"
            aria-label="Foto sebelumnya"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex items-center gap-1.5 px-1">
            {items.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`hero-dot cursor-pointer ${idx === activeSlide ? 'is-active' : ''}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            className="text-white/80 hover:text-white p-1 cursor-pointer"
            aria-label="Foto selanjutnya"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

