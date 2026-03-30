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

  const hasNav = showNavigation && totalSlides > 1;

  return (
    <div
      role="region"
      aria-label="Carousel"
      className="relative w-full"
    >
      {/* Outer flex: arrows + slides */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Left arrow */}
        {hasNav && (
          <button
            onClick={goToPrevious}
            aria-label="Previous slide"
            className="hidden sm:flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full shadow-md border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            style={{ width: '44px', height: '44px' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Slides */}
        <div className="overflow-hidden flex-1 min-w-0">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            aria-live="polite"
            aria-atomic="true"
          >
            {children.map((child, index) => (
              <div
                key={index}
                className="min-w-full px-1 py-2"
                aria-hidden={index !== currentIndex}
              >
                {child}
              </div>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        {hasNav && (
          <button
            onClick={goToNext}
            aria-label="Next slide"
            className="hidden sm:flex flex-shrink-0 items-center justify-center bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-full shadow-md border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            style={{ width: '44px', height: '44px' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Indicators */}
      {showIndicators && totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
              className={`rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                index === currentIndex
                  ? 'bg-primary'
                  : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
              }`}
              style={{ width: index === currentIndex ? '24px' : '8px', height: '8px' }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
