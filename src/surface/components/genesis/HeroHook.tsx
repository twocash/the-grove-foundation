// src/surface/components/genesis/HeroHook.tsx
// Screen 1: The Hook - Full viewport emotional hit
// DESIGN: Organic, warm, paper-textured - NOT futuristic
// v0.13: Quantum Interface - headline morphs with lens change
// v0.15: Dynamic headline sizing based on content length

import React, { useEffect, useState, useMemo } from 'react';
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

/**
 * Calculate dynamic font size based on headline character count.
 * 
 * The goal: headlines should fill roughly the same visual space regardless of length.
 * 
 * Breakpoints (character count → size tier):
 * - ≤12 chars: XL (e.g., "YOUR AI.", "OWN YOUR AI.")
 * - 13-20 chars: Large (e.g., "THE EDGE HEDGE.", "SOVEREIGN INTELLIGENCE.")
 * - 21-30 chars: Medium (e.g., "ADAPT? ADAPT AND OWN.", "THE EPISTEMIC COMMONS.")
 * - 31+ chars: Small (e.g., "LOCAL HUMS. CLOUD BREAKS THROUGH.")
 * 
 * Returns Tailwind classes for responsive sizing.
 */
function getHeadlineSizeClasses(headline: string): string {
  const charCount = headline.length;
  
  if (charCount <= 12) {
    // Short headlines: max impact (YOUR AI., OWN YOUR AI.)
    return 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl';
  } else if (charCount <= 20) {
    // Medium-short (THE EDGE HEDGE., SOVEREIGN INTELLIGENCE.)
    return 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl';
  } else if (charCount <= 30) {
    // Medium (ADAPT? ADAPT AND OWN., THE EPISTEMIC COMMONS.)
    return 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl';
  } else {
    // Long headlines (LOCAL HUMS. CLOUD BREAKS THROUGH.)
    return 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl';
  }
}

/**
 * Calculate line height adjustment for multi-line headlines.
 * Tighter leading for headlines that will wrap.
 */
function getHeadlineLeadingClass(headline: string): string {
  // Headlines with line breaks or very long get tighter leading
  if (headline.includes('\n') || headline.length > 25) {
    return 'leading-[0.9]';
  }
  return 'leading-tight';
}

/**
 * Calculate container max-width based on headline length.
 * Longer headlines need more horizontal room to breathe.
 */
function getContainerWidthClass(headline: string): string {
  const charCount = headline.length;
  
  if (charCount <= 12) {
    return 'max-w-2xl';  // Tight for short punchy headlines
  } else if (charCount <= 20) {
    return 'max-w-3xl';
  } else {
    return 'max-w-4xl';  // Wide for longer headlines
  }
}

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

  // Calculate size classes based on headline length (memoized)
  const headlineSizeClasses = useMemo(
    () => getHeadlineSizeClasses(content.headline),
    [content.headline]
  );
  
  const headlineLeadingClass = useMemo(
    () => getHeadlineLeadingClass(content.headline),
    [content.headline]
  );

  const containerWidthClass = useMemo(
    () => getContainerWidthClass(content.headline),
    [content.headline]
  );

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

      <div className={`text-center ${containerWidthClass} relative z-10`}>
        {/* Main headline - morphs with lens via WaveformCollapse */}
        {/* Size classes are dynamic based on headline length */}
        <h1 className={`font-display ${headlineSizeClasses} ${headlineLeadingClass} font-bold text-grove-forest mb-8 tracking-tight`}>
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
