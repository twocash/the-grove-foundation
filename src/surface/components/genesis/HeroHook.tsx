// src/surface/components/genesis/HeroHook.tsx
// Screen 1: The Hook - Full viewport emotional hit
// DESIGN: Organic, warm, paper-textured - NOT futuristic

import React, { useEffect, useState } from 'react';

interface HeroHookProps {
  onScrollNext?: () => void;
}

export const HeroHook: React.FC<HeroHookProps> = ({ onScrollNext }) => {
  const [showSubtext1, setShowSubtext1] = useState(false);
  const [showSubtext2, setShowSubtext2] = useState(false);

  // Fade-in sequence for subtext
  useEffect(() => {
    const timer1 = setTimeout(() => setShowSubtext1(true), 600);
    const timer2 = setTimeout(() => setShowSubtext2(true), 1400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleScrollClick = () => {
    if (onScrollNext) {
      onScrollNext();
    } else {
      // Default: scroll to next section
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle organic background texture */}
      <div className="absolute inset-0 bg-grain opacity-50 pointer-events-none" />

      <div className="text-center max-w-2xl relative z-10">
        {/* Main headline */}
        <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-grove-forest mb-8 tracking-tight">
          YOUR AI.
        </h1>

        {/* Subtext with fade-in sequence */}
        <div className="space-y-4 mb-8">
          <p
            className={`font-serif text-xl sm:text-2xl md:text-3xl text-ink transition-opacity duration-700 ${
              showSubtext1 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Not rented. Not surveilled. Not theirs.
          </p>
          <p
            className={`font-serif text-2xl sm:text-3xl md:text-4xl text-ink font-semibold transition-opacity duration-700 ${
              showSubtext2 ? 'opacity-100' : 'opacity-0'
            }`}
          >
            Yours.
          </p>
        </div>

        {/* Scroll indicator - organic leaf/seed style */}
        <button
          onClick={handleScrollClick}
          className="mt-16 text-ink-muted hover:text-grove-forest transition-colors focus:outline-none focus:ring-2 focus:ring-grove-forest/20 rounded-full p-2"
          aria-label="Scroll to next section"
        >
          <div className="animate-bounce">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </button>
      </div>
    </section>
  );
};

export default HeroHook;
