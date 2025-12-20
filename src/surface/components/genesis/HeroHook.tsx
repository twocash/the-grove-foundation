// src/surface/components/genesis/HeroHook.tsx
// Screen 1: The Hook - Full viewport emotional hit
// DESIGN: Organic, warm, paper-textured - NOT futuristic
// v0.13: Quantum Interface - headline morphs with lens change

import React, { useEffect, useState } from 'react';
import ScrollIndicator from './ScrollIndicator';
import { WaveformCollapse } from '../effects/WaveformCollapse';

// Content interface for Chameleon (v0.13)
export interface HeroContent {
  headline: string;
  subtext: string[];
}

// Default content (preserves current behavior)
const DEFAULT_CONTENT: HeroContent = {
  headline: "YOUR AI.",
  subtext: [
    "Not rented. Not surveilled. Not theirs.",
    "Yours."
  ]
};

interface HeroHookProps {
  onScrollNext?: () => void;
  content?: HeroContent;  // Optional - enables Chameleon in v0.13
  trigger?: any;  // v0.13: Triggers animation restart on lens change
  isCollapsing?: boolean;  // v0.14: Show tuning animation during LLM generation
}

export const HeroHook: React.FC<HeroHookProps> = ({
  onScrollNext,
  content = DEFAULT_CONTENT,
  trigger,
  isCollapsing = false
}) => {
  const [visibleSubtext, setVisibleSubtext] = useState<number[]>([]);

  // Reset and re-animate on content/trigger change
  useEffect(() => {
    setVisibleSubtext([]);  // Reset visibility

    const timers: NodeJS.Timeout[] = [];
    content.subtext.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleSubtext(prev => [...prev, index]);
      }, 600 + (index * 800));
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [content.subtext, trigger]);

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
        {/* Main headline - morphs with lens via WaveformCollapse */}
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-grove-forest mb-8 tracking-tight">
          <WaveformCollapse
            text={content.headline}
            trigger={trigger}
            className="block"
            isGenerating={isCollapsing}
          />
        </h1>

        {/* Subtext with fade-in sequence - from props */}
        <div className="space-y-4 mb-8">
          {content.subtext.map((text, index) => (
            <p
              key={index}
              className={`font-serif ${
                index === content.subtext.length - 1
                  ? 'text-2xl sm:text-3xl md:text-4xl font-semibold'
                  : 'text-xl sm:text-2xl md:text-3xl'
              } text-ink transition-opacity duration-700 ${
                visibleSubtext.includes(index) ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {text}
            </p>
          ))}
        </div>

        {/* Scroll indicator - floating seedling */}
        <div className="mt-16 flex justify-center">
          <ScrollIndicator onClick={handleScrollClick} />
        </div>
      </div>
    </section>
  );
};

export default HeroHook;
