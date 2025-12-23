// src/surface/components/genesis/HeroHook.tsx
// Screen 1: The Hook - Full viewport emotional hit
// DESIGN: Organic, warm, paper-textured - NOT futuristic
// v0.13: Quantum Interface - headline morphs with lens change
// v0.15: Dynamic headline sizing based on content length

import React, { useEffect, useState, useMemo } from 'react';
import { ActiveTree } from './ActiveTree';
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
 * Calculate line height for headlines based on tier.
 * Larger headlines can be tighter; smaller headlines need more breathing room.
 */
function getHeadlineLeadingClass(headline: string): string {
  const charCount = headline.length;
  
  if (charCount <= 12) {
    // XL tier: usually single line, tight is fine
    return 'leading-none';  // 1.0
  } else if (charCount <= 20) {
    // Large tier: might wrap on mobile, slightly looser
    return 'leading-[1.1]';
  } else if (charCount <= 30) {
    // Medium tier: will likely wrap, comfortable reading
    return 'leading-tight';  // 1.25
  } else {
    // Small tier: dense text, needs room to breathe
    return 'leading-snug';  // 1.375
  }
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

/**
 * Calculate subtext sizing based on headline tier.
 * Subtext should be proportional to headline - smaller headlines get larger subtext.
 * Includes leading for comfortable multi-line reading.
 */
function getSubtextSizeClasses(headline: string, isLastLine: boolean): string {
  const charCount = headline.length;
  
  // Last line is always slightly larger/bolder
  // Leading is tighter for short punchy lines, looser for longer ones
  if (charCount <= 12) {
    // XL headline tier - larger subtext, tight leading (short lines)
    return isLastLine 
      ? 'text-2xl sm:text-3xl md:text-4xl font-semibold leading-snug'
      : 'text-xl sm:text-2xl md:text-3xl leading-snug';
  } else if (charCount <= 20) {
    // Large headline tier
    return isLastLine
      ? 'text-xl sm:text-2xl md:text-3xl font-semibold leading-snug'
      : 'text-lg sm:text-xl md:text-2xl leading-snug';
  } else if (charCount <= 30) {
    // Medium headline tier - proportionally smaller subtext
    return isLastLine
      ? 'text-lg sm:text-xl md:text-2xl font-semibold leading-normal'
      : 'text-base sm:text-lg md:text-xl leading-normal';
  } else {
    // Small headline tier - compact subtext, relaxed leading
    return isLastLine
      ? 'text-base sm:text-lg md:text-xl font-semibold leading-relaxed'
      : 'text-sm sm:text-base md:text-lg leading-relaxed';
  }
}

/**
 * Calculate vertical spacing between subtext lines based on headline tier.
 * Tighter spacing for larger headlines (they dominate), more breathing room for smaller.
 */
function getSubtextSpacingClass(headline: string): string {
  const charCount = headline.length;
  
  if (charCount <= 12) {
    return 'space-y-3';  // Tighter - headline dominates
  } else if (charCount <= 20) {
    return 'space-y-4';
  } else if (charCount <= 30) {
    return 'space-y-5';
  } else {
    return 'space-y-6';  // More breathing room when headline is dense
  }
}

/**
 * Calculate margin between headline and subtext based on headline tier.
 */
function getHeadlineMarginClass(headline: string): string {
  const charCount = headline.length;
  
  if (charCount <= 12) {
    return 'mb-8';   // Standard gap for big headlines
  } else if (charCount <= 20) {
    return 'mb-6';
  } else if (charCount <= 30) {
    return 'mb-5';
  } else {
    return 'mb-4';   // Tighter when headline is already dense
  }
}

interface HeroHookProps {
  onScrollNext?: () => void;
  content?: HeroContent;  // Optional - enables Chameleon in v0.13
  trigger?: any;  // v0.13: Triggers animation restart on lens change
  isCollapsing?: boolean;  // v0.14: Show tuning animation during LLM generation
  onAnimationComplete?: () => void;  // v0.16: Active Grove - notify when headline morph completes
  flowState?: 'hero' | 'split' | 'selecting' | 'collapsing' | 'unlocked';  // v0.16: Current flow state
}

export const HeroHook: React.FC<HeroHookProps> = ({
  onScrollNext,
  content = DEFAULT_CONTENT,
  trigger,
  isCollapsing = false,
  onAnimationComplete,
  flowState = 'hero'
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

  const subtextSpacingClass = useMemo(
    () => getSubtextSpacingClass(content.headline),
    [content.headline]
  );

  const headlineMarginClass = useMemo(
    () => getHeadlineMarginClass(content.headline),
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
    <section className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 relative overflow-hidden hero-container">
      {/* Subtle organic background texture */}
      <div className="absolute inset-0 bg-grain opacity-50 pointer-events-none" />

      <div className={`text-center ${containerWidthClass} relative z-10`}>
        {/* Main headline - morphs with lens via WaveformCollapse */}
        {/* Size classes are dynamic based on headline length */}
        <h1 className={`font-display ${headlineSizeClasses} ${headlineLeadingClass} font-bold text-grove-forest ${headlineMarginClass} tracking-tight hero-headline`}>
          <WaveformCollapse
            text={content.headline}
            trigger={trigger}
            className="block"
            isGenerating={isCollapsing}
            onComplete={onAnimationComplete}
          />
        </h1>

        {/* Subtext with fade-in sequence - sizing proportional to headline */}
        <div className={`${subtextSpacingClass} mb-8`}>
          {content.subtext.map((text, index) => {
            const isLastLine = index === content.subtext.length - 1;
            const sizeClasses = getSubtextSizeClasses(content.headline, isLastLine);
            return (
              <p
                key={index}
                className={`font-serif ${sizeClasses} text-ink transition-opacity duration-700 ${
                  visibleSubtext.includes(index) ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {text}
              </p>
            );
          })}
        </div>

        {/* Active Tree - mode-aware scroll/interaction indicator */}
        <div className="mt-16 flex justify-center">
          <ActiveTree
            mode={
              flowState === 'unlocked' ? 'directional' :
              flowState === 'hero' ? 'pulsing' :
              'stabilized'
            }
            onClick={handleScrollClick}
            isLocked={flowState !== 'hero' && flowState !== 'unlocked'}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroHook;
