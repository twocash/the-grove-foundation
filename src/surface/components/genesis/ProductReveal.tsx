// src/surface/components/genesis/ProductReveal.tsx
// Screen 3: The Product Reveal - "thousand songs in your pocket" moment
// DESIGN: Organic, warm, garden metaphor - NOT futuristic
// HEADLINE: "STEP INTO YOUR GROVE" - static with orange emphasis on "YOUR GROVE"

import React, { useEffect, useRef, useState } from 'react';
import ScrollIndicator from './ScrollIndicator';

interface ProductRevealProps {
  onOpenTerminal?: (query: string) => void;
  onScrollNext?: () => void;  // v0.15: Section-aware scroll
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

// Animation phases - simplified to just hidden/visible
type AnimationPhase = 'hidden' | 'visible';

export const ProductReveal: React.FC<ProductRevealProps> = ({ onOpenTerminal, onScrollNext }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<AnimationPhase>('hidden');
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
      { threshold: 0.3 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Simple fade-in when visible
  useEffect(() => {
    if (!isVisible) return;
    setPhase('visible');
  }, [isVisible]);

  const handleCTAClick = () => {
    if (onOpenTerminal) {
      onOpenTerminal("What is a Grove node? How does local AI ownership lead to distributed intelligence?");
    } else {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  return (
    <section ref={sectionRef} className="min-h-screen bg-paper py-24 px-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">

        {/* Headline - Static with color emphasis */}
        <div className="mb-8">
          <h2 className={`font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-center transition-all duration-700 ${
            phase === 'visible' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <span className="text-grove-forest">STEP INTO </span>
            <span className="text-grove-clay">YOUR GROVE</span>
          </h2>
        </div>

        {/* Rest of content - fades in with headline */}
        <div className={`transition-all duration-1000 delay-300 ${
          phase === 'visible' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
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
              <div
                key={index}
                className="flex flex-col items-center transition-all duration-500"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
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
            className="px-8 py-4 bg-grove-forest text-white font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-ink transition-colors focus:outline-none focus:ring-2 focus:ring-grove-forest/50"
          >
            Consult the Grove
          </button>

          {/* Scroll indicator - floating seedling */}
          <div className="mt-16 flex justify-center">
            <ScrollIndicator onClick={onScrollNext || (() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }))} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductReveal;
