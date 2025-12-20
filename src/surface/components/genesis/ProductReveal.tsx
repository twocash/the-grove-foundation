// src/surface/components/genesis/ProductReveal.tsx
// Screen 3: The Product Reveal - "thousand songs in your pocket" moment
// DESIGN: Organic, warm, garden metaphor - NOT futuristic
// ANIMATION: "STEP INTO THE GROVE" → YOUR sprouts up and knocks THE away → "STEP INTO YOUR GROVE"

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

// Animation phases
type AnimationPhase = 'hidden' | 'pixelating' | 'revealed' | 'sprouting' | 'knocking' | 'settled';

export const ProductReveal: React.FC<ProductRevealProps> = ({ onOpenTerminal }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<AnimationPhase>('hidden');
  const [pixelProgress, setPixelProgress] = useState(0);
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

  // Animation sequence
  useEffect(() => {
    if (!isVisible) return;

    // Phase 1: Start pixelating
    setPhase('pixelating');

    // Animate pixel progress
    let progress = 0;
    const pixelInterval = setInterval(() => {
      progress += 0.05;
      setPixelProgress(Math.min(progress, 1));
      if (progress >= 1) {
        clearInterval(pixelInterval);
        setPhase('revealed');
      }
    }, 50);

    // Phase 2: After reveal, pause then sprout
    const sproutTimer = setTimeout(() => {
      setPhase('sprouting');
    }, 1500);

    // Phase 3: Knock THE away
    const knockTimer = setTimeout(() => {
      setPhase('knocking');
    }, 2200);

    // Phase 4: Settle
    const settleTimer = setTimeout(() => {
      setPhase('settled');
    }, 2800);

    return () => {
      clearInterval(pixelInterval);
      clearTimeout(sproutTimer);
      clearTimeout(knockTimer);
      clearTimeout(settleTimer);
    };
  }, [isVisible]);

  const handleCTAClick = () => {
    if (onOpenTerminal) {
      onOpenTerminal();
    } else {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  // Calculate blur based on pixel progress (starts blurry, becomes clear)
  const textBlur = phase === 'pixelating' ? `blur(${(1 - pixelProgress) * 8}px)` : 'blur(0px)';
  const textOpacity = phase === 'hidden' ? 0 : Math.min(pixelProgress * 1.5, 1);

  return (
    <section ref={sectionRef} className="min-h-screen bg-paper py-24 px-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">

        {/* Animated Headline */}
        <div className="relative h-24 sm:h-28 md:h-36 mb-8 flex items-center justify-center">
          {/* "STEP INTO" - static after reveal */}
          <span
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-grove-forest tracking-tight transition-all duration-500"
            style={{
              filter: textBlur,
              opacity: textOpacity,
              transform: phase === 'hidden' ? 'translateY(20px)' : 'translateY(0)'
            }}
          >
            STEP INTO{' '}
          </span>

          {/* Word container for THE/YOUR swap */}
          <span className="relative inline-block w-32 sm:w-40 md:w-48">
            {/* THE - gets knocked away */}
            <span
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-grove-forest tracking-tight absolute left-0 transition-all duration-500 ease-out"
              style={{
                filter: textBlur,
                opacity: phase === 'knocking' || phase === 'settled' ? 0 : textOpacity,
                transform: phase === 'knocking' || phase === 'settled'
                  ? 'translateX(80px) translateY(-60px) rotate(25deg)'
                  : 'translateX(0) translateY(0) rotate(0deg)',
              }}
            >
              THE
            </span>

            {/* YOUR - sprouts up from below */}
            <span
              className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-grove-forest tracking-tight absolute left-0 transition-all duration-700 ease-out"
              style={{
                opacity: phase === 'sprouting' || phase === 'knocking' || phase === 'settled' ? 1 : 0,
                transform: phase === 'sprouting'
                  ? 'translateY(40px) scale(0.8)'
                  : phase === 'knocking' || phase === 'settled'
                    ? 'translateY(0) scale(1)'
                    : 'translateY(80px) scale(0.5)',
                textShadow: phase === 'sprouting' ? '0 4px 12px rgba(47, 92, 59, 0.3)' : 'none'
              }}
            >
              YOUR
            </span>
          </span>

          {/* GROVE - static after reveal */}
          <span
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-grove-forest tracking-tight transition-all duration-500"
            style={{
              filter: textBlur,
              opacity: textOpacity,
              transform: phase === 'hidden' ? 'translateY(20px)' : 'translateY(0)'
            }}
          >
            {' '}GROVE
          </span>
        </div>

        {/* Sparkle effect during sprouting */}
        {(phase === 'sprouting' || phase === 'knocking') && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="absolute text-grove-forest/40 animate-ping"
                style={{
                  left: `${30 + Math.random() * 40}%`,
                  top: `${20 + Math.random() * 30}%`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '1s'
                }}
              >
                ✦
              </span>
            ))}
          </div>
        )}

        {/* Rest of content - fades in after headline settles */}
        <div className={`transition-all duration-1000 delay-500 ${
          phase === 'settled' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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

          {/* Scroll indicator */}
          <div className="mt-16">
            <button
              onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
              className="text-ink-muted hover:text-grove-forest transition-colors animate-bounce"
              aria-label="Continue scrolling"
            >
              <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductReveal;
