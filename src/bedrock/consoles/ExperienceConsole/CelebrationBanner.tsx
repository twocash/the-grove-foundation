// src/bedrock/consoles/ExperienceConsole/CelebrationBanner.tsx
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Epic 4: Advancement Celebration Banner
// Pattern: Animated dismissible banner

import React, { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

export type TierName = 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';

export interface CelebrationBannerProps {
  /** Whether to show the banner */
  show: boolean;
  /** The tier that was achieved */
  tier: TierName;
  /** Sprout title that advanced */
  sproutTitle?: string;
  /** Callback when banner is dismissed */
  onDismiss: () => void;
  /** Auto-dismiss after N milliseconds (default: 8000) */
  autoDismissMs?: number;
  /** Animation style */
  animation?: 'slide' | 'fade' | 'bounce';
}

// =============================================================================
// Constants
// =============================================================================

const TIER_CONFIG: Record<TierName, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  message: string;
}> = {
  seed: {
    label: 'Seed',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: '.',
    message: 'Your idea has been planted!',
  },
  sprout: {
    label: 'Sprout',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: '*',
    message: 'Your research is taking root!',
  },
  sapling: {
    label: 'Sapling',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: '|',
    message: 'Growing stronger every day!',
  },
  tree: {
    label: 'Tree',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    icon: 'Y',
    message: 'Mature and thriving!',
  },
  grove: {
    label: 'Grove',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    icon: 'W',
    message: 'A flourishing ecosystem!',
  },
};

// =============================================================================
// Confetti Effect (CSS-based)
// =============================================================================

function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${1 + Math.random()}s`,
            backgroundColor: ['#2F5C3B', '#D95D39', '#FFB800', '#60A5FA', '#A78BFA'][i % 5],
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function CelebrationBanner({
  show,
  tier,
  sproutTitle,
  onDismiss,
  autoDismissMs = 8000,
  animation = 'slide',
}: CelebrationBannerProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  const config = TIER_CONFIG[tier];

  // Handle show/hide transitions
  useEffect(() => {
    if (show) {
      // Small delay for entrance animation
      const showTimer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(showTimer);
    } else {
      setVisible(false);
      setExiting(false);
    }
  }, [show]);

  // Auto-dismiss
  useEffect(() => {
    if (show && autoDismissMs > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [show, autoDismissMs]);

  // Handle dismissal with exit animation
  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 300); // Match exit animation duration
  }, [onDismiss]);

  if (!show && !visible) return null;

  // Animation classes
  const animationClasses = {
    slide: {
      enter: 'translate-y-0 opacity-100',
      exit: '-translate-y-full opacity-0',
      initial: '-translate-y-full opacity-0',
    },
    fade: {
      enter: 'opacity-100 scale-100',
      exit: 'opacity-0 scale-95',
      initial: 'opacity-0 scale-95',
    },
    bounce: {
      enter: 'translate-y-0 opacity-100',
      exit: '-translate-y-4 opacity-0',
      initial: 'translate-y-4 opacity-0',
    },
  };

  const anim = animationClasses[animation];
  const currentAnim = exiting ? anim.exit : visible ? anim.enter : anim.initial;

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        w-full max-w-md px-4
        transform transition-all duration-300 ease-out
        ${currentAnim}
      `}
      data-testid="celebration-banner"
      data-tier={tier}
      role="status"
      aria-live="polite"
    >
      <div
        className={`
          relative overflow-hidden
          ${config.bgColor} ${config.borderColor}
          border rounded-xl shadow-lg
          backdrop-blur-sm
        `}
      >
        {/* Confetti effect */}
        <Confetti />

        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-4">
            {/* Tier icon */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center`}>
              <span className={`text-2xl font-bold ${config.color}`}>
                {config.icon}
              </span>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">!</span>
                <h3 className={`font-bold ${config.color}`}>
                  Achieved: {config.label}!
                </h3>
              </div>
              <p className="text-sm text-ink dark:text-paper mt-1">
                {config.message}
              </p>
              {sproutTitle && (
                <p className="text-xs text-ink-muted dark:text-paper/60 mt-1 truncate">
                  "{sproutTitle}"
                </p>
              )}
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-lg text-ink-muted dark:text-paper/50 hover:text-ink dark:hover:text-paper hover:bg-ink/5 dark:hover:bg-white/5 transition-colors"
              aria-label="Dismiss"
              data-testid="dismiss-celebration"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Progress bar for auto-dismiss */}
          {autoDismissMs > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink/10 dark:bg-white/10">
              <div
                className={`h-full ${config.color.replace('text-', 'bg-')}`}
                style={{
                  animation: `shrink-progress ${autoDismissMs}ms linear forwards`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Keyframe animation styles */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 1.5s ease-out forwards;
        }
        @keyframes shrink-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default CelebrationBanner;
