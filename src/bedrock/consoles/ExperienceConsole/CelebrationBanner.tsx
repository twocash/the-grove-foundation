// src/bedrock/consoles/ExperienceConsole/CelebrationBanner.tsx
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Epic 4: Advancement Celebration Banner
// Pattern: Animated dismissible banner

import React, { useState, useEffect, useCallback } from 'react';
import { themeColor } from '../../config/themeColors';

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
  colorStyle: React.CSSProperties;
  bgStyle: React.CSSProperties;
  borderStyle: React.CSSProperties;
  progressColor: string;
  icon: string;
  message: string;
}> = {
  seed: {
    label: 'Seed',
    colorStyle: { color: 'var(--semantic-warning)' },
    bgStyle: { backgroundColor: 'var(--semantic-warning-bg)' },
    borderStyle: { borderColor: 'var(--semantic-warning-border)' },
    progressColor: 'var(--semantic-warning)',
    icon: '.',
    message: 'Your idea has been planted!',
  },
  sprout: {
    label: 'Sprout',
    colorStyle: { color: 'var(--semantic-success)' },
    bgStyle: { backgroundColor: 'var(--semantic-success-bg)' },
    borderStyle: { borderColor: 'var(--semantic-success-border)' },
    progressColor: 'var(--semantic-success)',
    icon: '*',
    message: 'Your research is taking root!',
  },
  sapling: {
    label: 'Sapling',
    colorStyle: { color: 'var(--semantic-success)' },
    bgStyle: { backgroundColor: 'var(--semantic-success-bg)' },
    borderStyle: { borderColor: 'var(--semantic-success-border)' },
    progressColor: 'var(--semantic-success)',
    icon: '|',
    message: 'Growing stronger every day!',
  },
  tree: {
    label: 'Tree',
    colorStyle: { color: 'var(--semantic-success)' },
    bgStyle: { backgroundColor: 'var(--semantic-success-bg)' },
    borderStyle: { borderColor: 'var(--semantic-success-border)' },
    progressColor: 'var(--semantic-success)',
    icon: 'Y',
    message: 'Mature and thriving!',
  },
  grove: {
    label: 'Grove',
    colorStyle: { color: 'var(--semantic-info)' },
    bgStyle: { backgroundColor: 'var(--semantic-info-bg)' },
    borderStyle: { borderColor: 'var(--semantic-info-border)' },
    progressColor: 'var(--semantic-info)',
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
            backgroundColor: themeColor.confetti[i % 5],
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
        className="relative overflow-hidden border rounded-xl shadow-lg backdrop-blur-sm"
        style={{ ...config.bgStyle, ...config.borderStyle }}
      >
        {/* Confetti effect */}
        <Confetti />

        {/* Content */}
        <div className="relative p-4">
          <div className="flex items-start gap-4">
            {/* Tier icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={config.bgStyle}>
              <span className="text-2xl font-bold" style={config.colorStyle}>
                {config.icon}
              </span>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">!</span>
                <h3 className="font-bold" style={config.colorStyle}>
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
                className="h-full"
                style={{
                  backgroundColor: config.progressColor,
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
