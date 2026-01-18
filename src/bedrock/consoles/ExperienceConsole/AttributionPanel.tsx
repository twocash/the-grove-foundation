// src/bedrock/consoles/ExperienceConsole/AttributionPanel.tsx
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Epic 2: "Why This Score?" Attribution Panel
// Pattern: slide-in panel with json-render content

import React, { useMemo, useCallback } from 'react';
import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { ScoreAttributionRegistry } from './json-render/score-attribution-registry';
import {
  scoreAttributionToRenderTree,
  createPendingAttributionTree,
} from './json-render/score-attribution-transform';
import type { ScoreAttributionData } from './json-render/score-attribution-transform';

// =============================================================================
// Types
// =============================================================================

export interface AttributionPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Attribution data from API */
  data: ScoreAttributionData | null;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when user clicks "Request Override" */
  onRequestOverride?: (sproutId: string) => void;
  /** Panel position (default: right) */
  position?: 'left' | 'right';
  /** Panel width */
  width?: 'sm' | 'md' | 'lg';
}

const WIDTH_CLASSES = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[28rem]',
};

// =============================================================================
// Loading Skeleton
// =============================================================================

function AttributionSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-4" data-testid="attribution-loading">
      {/* Header skeleton */}
      <div className="space-y-2 pb-4 border-b border-ink/10 dark:border-white/10">
        <div className="h-8 w-20 bg-ink/10 dark:bg-white/10 rounded" />
        <div className="h-4 w-32 bg-ink/10 dark:bg-white/10 rounded" />
      </div>
      {/* Dimension skeletons */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded border border-ink/10 dark:border-white/10">
          <div className="flex justify-between mb-2">
            <div className="h-5 w-24 bg-ink/10 dark:bg-white/10 rounded" />
            <div className="h-5 w-16 bg-ink/10 dark:bg-white/10 rounded" />
          </div>
          <div className="h-4 w-full bg-ink/10 dark:bg-white/10 rounded mb-2" />
          <div className="h-4 w-3/4 bg-ink/10 dark:bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

function AttributionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="p-6 text-center" data-testid="attribution-error">
      <div className="text-4xl mb-2">!</div>
      <h4 className="text-lg font-medium text-ink dark:text-paper mb-1">
        Unable to load attribution
      </h4>
      <p className="text-sm text-ink-muted dark:text-paper/60 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-medium bg-grove-forest text-white rounded hover:bg-grove-forest/90 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function AttributionPanel({
  open,
  onClose,
  data,
  loading = false,
  error = null,
  onRequestOverride,
  position = 'right',
  width = 'md',
}: AttributionPanelProps) {
  // Handle override CTA click
  const handleOverrideCta = useCallback(() => {
    if (data?.sproutId && onRequestOverride) {
      onRequestOverride(data.sproutId);
    }
  }, [data?.sproutId, onRequestOverride]);

  // Transform data to render tree
  const renderTree = useMemo(() => {
    if (!data) {
      return createPendingAttributionTree('', data?.sproutTitle);
    }

    return scoreAttributionToRenderTree(data, {
      enableOverrideCta: !!onRequestOverride,
      showMetadata: true,
    });
  }, [data, onRequestOverride]);

  // Position classes
  const positionClasses = position === 'right'
    ? 'right-0 border-l'
    : 'left-0 border-r';

  const translateClass = position === 'right'
    ? open ? 'translate-x-0' : 'translate-x-full'
    : open ? 'translate-x-0' : '-translate-x-full';

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
          data-testid="attribution-backdrop"
        />
      )}

      {/* Panel */}
      <aside
        className={`
          fixed top-0 ${positionClasses} h-full ${WIDTH_CLASSES[width]}
          bg-paper dark:bg-ink border-ink/10 dark:border-white/10
          transform transition-transform duration-300 ease-in-out z-50
          ${translateClass}
          overflow-y-auto
        `}
        data-testid="attribution-panel"
        aria-hidden={!open}
      >
        {/* Header */}
        <header className="sticky top-0 bg-paper dark:bg-ink z-10 flex items-center justify-between px-4 py-3 border-b border-ink/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">?</span>
            <h2 className="text-lg font-semibold text-ink dark:text-paper">
              Why This Score?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted dark:text-paper/60 hover:bg-ink/5 dark:hover:bg-white/5 transition-colors"
            aria-label="Close panel"
            data-testid="attribution-close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
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
        </header>

        {/* Content */}
        <div className="p-4">
          {loading ? (
            <AttributionSkeleton />
          ) : error ? (
            <AttributionError message={error} />
          ) : (
            <div onClick={handleOverrideCta}>
              <Renderer tree={renderTree} registry={ScoreAttributionRegistry} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default AttributionPanel;
