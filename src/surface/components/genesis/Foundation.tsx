// src/surface/components/genesis/Foundation.tsx
// Screen 5: The Foundation - For believers ready for depth
// DESIGN: Clean, confident, minimal - paper background

import React, { useEffect, useRef, useState } from 'react';
import ScrollIndicator from './ScrollIndicator';

interface FoundationProps {
  onOpenTerminal?: (query: string) => void;
}

// Deep dive queries from TARGET_CONTENT.md
const deepDiveQueries = {
  ratchet: "Explain the Ratchet: how AI capability propagates from frontier to local, and why this matters for The Grove's thesis.",
  economics: "Walk me through The Grove's economic model: the efficiency tax, credit system, and how value flows to Gardeners.",
  vision: "What is The Grove's long-term vision? How does distributed, sovereign AI change the landscape?"
};

export const Foundation: React.FC<FoundationProps> = ({ onOpenTerminal }) => {
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

  const handleExplore = () => {
    if (onOpenTerminal) {
      onOpenTerminal("Tell me more about The Grove and how it works.");
    }
  };

  return (
    <section ref={sectionRef} className="min-h-screen bg-paper py-24 px-6 flex flex-col items-center justify-center">
      <div className={`max-w-3xl mx-auto transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}>
        {/* Headline */}
        <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-ink text-center mb-12 tracking-tight">
          WHY THIS WORKS
        </h2>

        {/* Ratchet explanation */}
        <div className="space-y-6 text-center mb-12">
          <p className="font-serif text-xl md:text-2xl text-ink leading-relaxed">
            AI capability doubles every seven months.
          </p>
          <p className="font-serif text-xl md:text-2xl text-ink leading-relaxed">
            Today's data center becomes tomorrow's laptop.
          </p>
          <p className="font-serif text-xl md:text-2xl text-ink leading-relaxed font-semibold">
            We're building the infrastructure to ride that wave.
          </p>
        </div>

        {/* Deep dive links - ordered for narrative arc: Vision → Ratchet → Economics */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <button
            onClick={() => handleDeepDive('vision')}
            className="px-6 py-3 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
          >
            The Vision
          </button>
          <button
            onClick={() => handleDeepDive('ratchet')}
            className="px-6 py-3 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
          >
            The Ratchet
          </button>
          <button
            onClick={() => handleDeepDive('economics')}
            className="px-6 py-3 border border-ink/20 text-ink font-mono text-sm uppercase tracking-wider rounded-sm hover:border-grove-forest hover:text-grove-forest transition-colors"
          >
            The Economics
          </button>
        </div>

        {/* Terminal CTA */}
        <div className="text-center">
          <p className="font-serif text-lg text-ink-muted mb-6">
            Want to go deeper? Open the Terminal.
          </p>
          <button
            onClick={handleExplore}
            className="px-8 py-4 bg-grove-forest text-white font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-ink transition-colors"
          >
            Consult the Grove
          </button>

          {/* Scroll indicator - floating seedling */}
          <div className="mt-12 flex justify-center">
            <ScrollIndicator onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Foundation;
