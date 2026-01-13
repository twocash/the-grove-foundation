// src/explore/components/SkeletonCard.tsx
// Skeleton loading placeholders for research UI
// Sprint: polish-demo-prep-v1
//
// DEX: Capability Agnosticism
// Loading states work regardless of data source speed.

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface SkeletonCardProps {
  /** Number of text lines to show */
  lines?: number;
  /** Show header element */
  showHeader?: boolean;
  /** Show badge element */
  showBadge?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface SkeletonCardListProps {
  /** Number of cards to display */
  count?: number;
  /** Props to pass to each card */
  cardProps?: Omit<SkeletonCardProps, 'className'>;
  /** Additional CSS classes for the list container */
  className?: string;
}

// =============================================================================
// SkeletonCard Component
// =============================================================================

export function SkeletonCard({
  lines = 3,
  showHeader = true,
  showBadge = false,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      className={`
        animate-pulse p-4
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-700
        rounded-lg
        ${className}
      `}
      aria-hidden="true"
      role="presentation"
    >
      {/* Header row */}
      {showHeader && (
        <div className="flex items-center gap-3 mb-3">
          {/* Icon placeholder */}
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />

          {/* Title placeholder */}
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          </div>

          {/* Badge placeholder */}
          {showBadge && (
            <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
          )}
        </div>
      )}

      {/* Text lines */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 bg-slate-200 dark:bg-slate-700 rounded"
            style={{ width: getLineWidth(i, lines) }}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// SkeletonCardList Component
// =============================================================================

export function SkeletonCardList({
  count = 3,
  cardProps,
  className = '',
}: SkeletonCardListProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} {...cardProps} />
      ))}
    </div>
  );
}

// =============================================================================
// Specialized Skeleton Components
// =============================================================================

/**
 * Skeleton for source/citation items
 */
export function SkeletonSource({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        animate-pulse p-3 flex items-center gap-3
        bg-slate-50 dark:bg-slate-800/50
        border border-slate-200 dark:border-slate-700
        rounded-lg
        ${className}
      `}
      aria-hidden="true"
    >
      {/* Favicon placeholder */}
      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded" />

      {/* Text content */}
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * Skeleton for branch/progress items
 */
export function SkeletonBranch({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        animate-pulse p-3 flex items-center gap-3
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-700
        rounded-lg
        ${className}
      `}
      aria-hidden="true"
    >
      {/* Status indicator */}
      <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded" />

      {/* Branch info */}
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
      </div>

      {/* Progress bar */}
      <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
    </div>
  );
}

/**
 * Full-page skeleton for research results
 */
export function SkeletonResearchResults({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 space-y-6 animate-pulse ${className}`} aria-hidden="true">
      {/* Position card skeleton */}
      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-lg">
        <div className="h-5 bg-purple-200 dark:bg-purple-800/50 rounded w-1/4 mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-purple-200 dark:bg-purple-800/50 rounded w-full" />
          <div className="h-4 bg-purple-200 dark:bg-purple-800/50 rounded w-5/6" />
        </div>
      </div>

      {/* Analysis section skeleton */}
      <div className="space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/5" />
        <div className="space-y-2">
          {[100, 95, 90, 85, 70].map((width, i) => (
            <div
              key={i}
              className="h-3 bg-slate-200 dark:bg-slate-700 rounded"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>

      {/* Citations skeleton */}
      <div className="space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/6" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <SkeletonSource key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get varied line widths for more natural-looking skeleton
 */
function getLineWidth(index: number, total: number): string {
  // Last line is usually shorter
  if (index === total - 1) {
    return '60%';
  }

  // Vary middle lines
  const widths = ['100%', '95%', '85%', '90%', '75%'];
  return widths[index % widths.length];
}

// =============================================================================
// Export
// =============================================================================

export default SkeletonCard;
