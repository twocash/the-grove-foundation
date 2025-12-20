// src/surface/components/genesis/ProductReveal.tsx
// Screen 3: The Product Reveal - "thousand songs in your pocket" moment
// DESIGN: Organic, warm, garden metaphor - NOT futuristic

import React, { useEffect, useRef, useState } from 'react';

interface ProductRevealProps {
  onOpenTerminal?: () => void;
}

const pillars = [
  {
    emoji: '🌱',
    title: 'Learning',
    subtitle: 'while you sleep'
  },
  {
    emoji: '🔗',
    title: 'Working',
    subtitle: 'with other Groves'
  },
  {
    emoji: '🔒',
    title: 'Yours',
    subtitle: 'entirely'
  }
];

export const ProductReveal: React.FC<ProductRevealProps> = ({ onOpenTerminal }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCTAClick = () => {
    if (onOpenTerminal) {
      onOpenTerminal();
    } else {
      // Default: scroll to next section (Aha Demo)
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  return (
    <section ref={sectionRef} className="min-h-screen bg-paper py-24 px-6 flex flex-col items-center justify-center">
      <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        {/* Headline */}
        <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-grove-forest mb-8 tracking-tight">
          YOUR GROVE
        </h2>

        {/* One-liner */}
        <div className="mb-12">
          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-ink leading-relaxed">
            Your own personal AI village:
          </p>
          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-ink leading-relaxed">
            learning, working, and one day—earning.
          </p>
          <p className="font-serif text-xl sm:text-2xl md:text-3xl text-ink leading-relaxed font-semibold mt-2">
            All for you.
          </p>
        </div>

        {/* Three Pillars */}
        <div className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-12 md:gap-16 mb-12">
          {pillars.map((pillar, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl mb-3">{pillar.emoji}</span>
              <span className="font-serif text-lg md:text-xl text-ink font-semibold">
                {pillar.title}
              </span>
              <span className="font-serif text-sm md:text-base text-ink-muted">
                {pillar.subtitle}
              </span>
            </div>
          ))}
        </div>

        {/* Value teaser - italicized */}
        <p className="font-serif text-lg md:text-xl text-ink-muted italic max-w-2xl mx-auto mb-12">
          Tend your Grove, and one day it might bear fruit—
          <br className="hidden sm:inline" />
          services and capabilities you can share, trade, or sell.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleCTAClick}
          className="inline-flex items-center gap-2 px-8 py-4 bg-grove-forest text-white font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-ink transition-colors focus:outline-none focus:ring-2 focus:ring-grove-forest/50"
        >
          See it in action
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default ProductReveal;
