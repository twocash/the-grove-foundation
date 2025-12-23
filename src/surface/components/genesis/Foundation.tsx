// src/surface/components/genesis/Foundation.tsx
// Screen 5: The Foundation - For believers ready for depth
// DESIGN: Clean, confident, minimal - paper background
// Active Grove Polish v2: Reordered layout, accent CTA

import React, { useEffect, useRef, useState } from 'react';
import { ActiveTree } from './ActiveTree';

interface FoundationProps {
  onOpenTerminal?: (query: string) => void;
  onScrollNext?: () => void;  // v0.15: Section-aware scroll
}

// Deep dive queries from TARGET_CONTENT.md
const deepDiveQueries = {
  ratchet: "Explain the Ratchet: how AI capability propagates from frontier to local, and why this matters for The Grove's thesis.",
  economics: "Walk me through The Grove's economic model: the efficiency tax, credit system, and how value flows to Gardeners.",
  vision: "What is The Grove's long-term vision? How does distributed, sovereign AI change the landscape?"
};

export const Foundation: React.FC<FoundationProps> = ({ onOpenTerminal, onScrollNext }) => {
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

  const handleDeepDive = (topic: keyof typeof deepDiveQueries) => {
    if (onOpenTerminal) {
      onOpenTerminal(deepDiveQueries[topic]);
    }
  };

  return (
    <section ref={sectionRef} className="flex-1 flex flex-col bg-paper">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center px-6 py-8">
        <div className={`max-w-3xl mx-auto transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          {/* Headline */}
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ink text-center mb-8 tracking-tight">
            WHY THIS WORKS
          </h2>

          {/* Ratchet explanation */}
          <div className="space-y-4 text-center mb-8">
            <p className="font-serif text-lg md:text-xl text-ink leading-relaxed">
              AI capability doubles every seven months.
            </p>
            <p className="font-serif text-lg md:text-xl text-ink leading-relaxed">
              Today's data center becomes tomorrow's laptop.
            </p>
            <p className="font-serif text-lg md:text-xl text-ink leading-relaxed font-semibold">
              We're building the infrastructure to ride that wave.
            </p>
          </div>

          {/* CTA invitation - Active Grove Polish v2: moved up, restyled orange */}
          <p className="text-grove-clay text-center font-medium text-lg mb-6">
            Want to go deeper?
          </p>

          {/* Deep dive buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <button
              onClick={() => handleDeepDive('vision')}
              className="px-5 py-2.5 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
            >
              The Vision
            </button>
            <button
              onClick={() => handleDeepDive('ratchet')}
              className="px-5 py-2.5 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
            >
              The Ratchet
            </button>
            <button
              onClick={() => handleDeepDive('economics')}
              className="px-5 py-2.5 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
            >
              The Economics
            </button>
          </div>
        </div>
      </div>

      {/* ActiveTree anchored at bottom */}
      <div className="shrink-0 py-4 flex justify-center bg-paper">
        <ActiveTree mode="directional" onClick={onScrollNext || (() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }))} />
      </div>
    </section>
  );
};

export default Foundation;
