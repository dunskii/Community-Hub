import React, { useState, useEffect } from 'react';

interface CarouselProps {
  /** Carousel items (images or content) */
  children: React.ReactNode[];
  /** Auto-advance interval in ms (0 = no auto-advance) */
  autoAdvance?: number;
  /** Show indicators */
  showIndicators?: boolean;
  /** Show navigation arrows */
  showNavigation?: boolean;
}

export function Carousel({
  children,
  autoAdvance = 0,
  showIndicators = true,
  showNavigation = true,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = children.length;

  useEffect(() => {
    if (autoAdvance > 0) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % totalSlides);
      }, autoAdvance);
      return () => clearInterval(interval);
    }
  }, [autoAdvance, totalSlides]);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div
      role="region"
      aria-label="Carousel"
      className="relative w-full overflow-hidden"
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        aria-live="polite"
        aria-atomic="true"
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="min-w-full"
            aria-hidden={index !== currentIndex}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {showNavigation && totalSlides > 1 && (
        <>
          <button
            onClick={goToPrevious}
            aria-label="Previous slide"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            aria-label="Next slide"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
              className={`w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              style={{ minWidth: '16px', minHeight: '16px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
