// src/bedrock/components/ObjectGrid.tsx
// Grid display for GroveObject collections
// Sprint: bedrock-foundation-v1 (Epic 4, Story 4.4)

import React, { type ReactNode, useCallback, useMemo } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import { ObjectCard, type ObjectCardProps } from './ObjectCard';
import { EmptyState, NoResultsState, NoItemsState } from './EmptyState';

// =============================================================================
// Types
// =============================================================================

export interface ObjectGridProps<T = unknown> {
  /** Objects to display */
  objects: GroveObject<T>[];
  /** Currently selected object ID */
  selectedId?: string | null;
  /** Currently inspected object ID */
  inspectedId?: string | null;
  /** Favorited object IDs */
  favorites?: Set<string>;
  /** Callback when object is clicked */
  onSelect?: (object: GroveObject<T>) => void;
  /** Callback when object is double-clicked */
  onInspect?: (object: GroveObject<T>) => void;
  /** Callback when favorite is toggled */
  onFavoriteToggle?: (objectId: string) => void;
  /** Custom card render props */
  cardProps?: Partial<ObjectCardProps<T>>;
  /** Number of columns (auto-responsive if not set) */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Gap between cards */
  gap?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  /** Custom empty state */
  emptyState?: ReactNode;
  /** Whether we're filtering (affects empty state message) */
  isFiltering?: boolean;
  /** Total count (for empty state context) */
  totalCount?: number;
  /** Additional CSS classes */
  className?: string;
  /** Grid ID for keyboard navigation */
  gridId?: string;
}

// =============================================================================
// Skeleton Card
// =============================================================================

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)] p-4 animate-pulse">
      <div className="h-4 w-2/3 bg-[var(--glass-panel)] rounded mb-3" />
      <div className="h-3 w-full bg-[var(--glass-panel)] rounded mb-2" />
      <div className="h-3 w-4/5 bg-[var(--glass-panel)] rounded mb-4" />
      <div className="flex justify-between">
        <div className="h-3 w-16 bg-[var(--glass-panel)] rounded" />
        <div className="h-3 w-8 bg-[var(--glass-panel)] rounded" />
      </div>
    </div>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ObjectGrid<T = unknown>({
  objects,
  selectedId,
  inspectedId,
  favorites,
  onSelect,
  onInspect,
  onFavoriteToggle,
  cardProps,
  columns,
  gap = 'md',
  loading = false,
  skeletonCount = 8,
  emptyState,
  isFiltering = false,
  totalCount,
  className = '',
  gridId,
}: ObjectGridProps<T>) {
  // Gap classes
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  // Column classes (responsive if not specified)
  const columnClasses = columns
    ? {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6',
      }[columns]
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  // Handle click
  const handleClick = useCallback(
    (object: GroveObject<T>) => {
      onSelect?.(object);
    },
    [onSelect]
  );

  // Handle double-click
  const handleDoubleClick = useCallback(
    (object: GroveObject<T>) => {
      onInspect?.(object);
    },
    [onInspect]
  );

  // Memoize favorites check
  const isFavorite = useCallback(
    (id: string) => favorites?.has(id) ?? false,
    [favorites]
  );

  // Loading state
  if (loading) {
    return (
      <div
        className={`grid ${columnClasses} ${gapClasses[gap]} ${className}`}
        role="grid"
        aria-busy="true"
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (objects.length === 0) {
    if (emptyState) {
      return <>{emptyState}</>;
    }

    if (isFiltering) {
      return (
        <NoResultsState
          description={
            totalCount !== undefined
              ? `No results found. ${totalCount} total items available.`
              : 'Try adjusting your search or filters.'
          }
          secondaryAction={{
            label: 'Clear filters',
            onClick: () => {
              // This will be wired up by the parent component
            },
          }}
        />
      );
    }

    return (
      <NoItemsState
        action={{
          label: 'Create first item',
          icon: 'add',
          onClick: () => {
            // This will be wired up by the parent component
          },
        }}
      />
    );
  }

  return (
    <div
      className={`grid ${columnClasses} ${gapClasses[gap]} ${className}`}
      role="grid"
      aria-label="Object grid"
      id={gridId}
    >
      {objects.map((object) => (
        <ObjectCard
          key={object.meta.id}
          object={object}
          selected={selectedId === object.meta.id}
          inspected={inspectedId === object.meta.id}
          isFavorite={isFavorite(object.meta.id)}
          onClick={() => handleClick(object)}
          onFavoriteToggle={
            onFavoriteToggle
              ? () => onFavoriteToggle(object.meta.id)
              : undefined
          }
          {...cardProps}
        />
      ))}
    </div>
  );
}

export default ObjectGrid;
