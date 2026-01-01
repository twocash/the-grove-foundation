// src/bedrock/components/ObjectList.tsx
// List display for GroveObject collections
// Sprint: bedrock-foundation-v1 (Epic 4, Story 4.5)

import React, { type ReactNode, useCallback } from 'react';
import type { GroveObject, GroveObjectMeta } from '../../core/schema/grove-object';
import { FavoriteToggle } from './FavoriteToggle';
import { EmptyState, NoResultsState, NoItemsState } from './EmptyState';

// =============================================================================
// Types
// =============================================================================

export interface ObjectListColumn<T = unknown> {
  /** Column key */
  key: string;
  /** Column header label */
  label: string;
  /** Column width (CSS width value) */
  width?: string;
  /** Custom cell renderer */
  render?: (object: GroveObject<T>) => ReactNode;
  /** Field path for default rendering (supports dot notation) */
  field?: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
}

export interface ObjectListProps<T = unknown> {
  /** Objects to display */
  objects: GroveObject<T>[];
  /** Column definitions */
  columns: ObjectListColumn<T>[];
  /** Currently selected object ID */
  selectedId?: string | null;
  /** Currently inspected object ID */
  inspectedId?: string | null;
  /** Favorited object IDs */
  favorites?: Set<string>;
  /** Callback when row is clicked */
  onSelect?: (object: GroveObject<T>) => void;
  /** Callback when row is double-clicked */
  onInspect?: (object: GroveObject<T>) => void;
  /** Callback when favorite is toggled */
  onFavoriteToggle?: (objectId: string) => void;
  /** Show favorite column */
  showFavorites?: boolean;
  /** Current sort field */
  sortField?: string;
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc';
  /** Callback when sort changes */
  onSortChange?: (field: string) => void;
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton rows to show when loading */
  skeletonCount?: number;
  /** Custom empty state */
  emptyState?: ReactNode;
  /** Whether we're filtering */
  isFiltering?: boolean;
  /** Total count (for empty state context) */
  totalCount?: number;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function formatCellValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return value.toLocaleString();
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'string') {
    // Check if it's an ISO date string
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleDateString();
    }
    return value;
  }
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

// =============================================================================
// Skeleton Row
// =============================================================================

function SkeletonRow({ columnCount }: { columnCount: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columnCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-[var(--glass-panel)] rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// =============================================================================
// Component
// =============================================================================

export function ObjectList<T = unknown>({
  objects,
  columns,
  selectedId,
  inspectedId,
  favorites,
  onSelect,
  onInspect,
  onFavoriteToggle,
  showFavorites = true,
  sortField,
  sortDirection,
  onSortChange,
  loading = false,
  skeletonCount = 8,
  emptyState,
  isFiltering = false,
  totalCount,
  className = '',
}: ObjectListProps<T>) {
  // Handle row click
  const handleRowClick = useCallback(
    (object: GroveObject<T>) => {
      onSelect?.(object);
    },
    [onSelect]
  );

  // Handle row double-click
  const handleRowDoubleClick = useCallback(
    (object: GroveObject<T>) => {
      onInspect?.(object);
    },
    [onInspect]
  );

  // Favorites check
  const isFavorite = useCallback(
    (id: string) => favorites?.has(id) ?? false,
    [favorites]
  );

  // Total column count (including favorites)
  const totalColumns = columns.length + (showFavorites && onFavoriteToggle ? 1 : 0);

  // Empty state
  if (!loading && objects.length === 0) {
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
        />
      );
    }

    return <NoItemsState />;
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="border-b border-[var(--glass-border)]">
            {/* Favorite column */}
            {showFavorites && onFavoriteToggle && (
              <th className="w-12 px-2 py-3 text-left">
                <span className="sr-only">Favorite</span>
              </th>
            )}

            {/* Data columns */}
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  px-4 py-3 text-xs font-medium uppercase tracking-wide
                  text-[var(--glass-text-muted)]
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : 'text-left'}
                  ${column.sortable && onSortChange ? 'cursor-pointer hover:text-[var(--glass-text-primary)]' : ''}
                `}
                style={{ width: column.width }}
                onClick={
                  column.sortable && onSortChange
                    ? () => onSortChange(column.key)
                    : undefined
                }
              >
                <span className="flex items-center gap-1">
                  {column.label}
                  {column.sortable && sortField === column.key && (
                    <span className="material-symbols-outlined text-sm">
                      {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {loading ? (
            // Skeleton rows
            Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonRow key={i} columnCount={totalColumns} />
            ))
          ) : (
            // Data rows
            objects.map((object) => {
              const isSelected = selectedId === object.meta.id;
              const isInspected = inspectedId === object.meta.id;

              return (
                <tr
                  key={object.meta.id}
                  className={`
                    border-b border-[var(--glass-border)] transition-colors cursor-pointer
                    ${isInspected
                      ? 'bg-[var(--neon-cyan)]/10 border-l-2 border-l-[var(--neon-cyan)]'
                      : isSelected
                        ? 'bg-[var(--glass-elevated)]'
                        : 'hover:bg-[var(--glass-elevated)]'
                    }
                  `}
                  onClick={() => handleRowClick(object)}
                  onDoubleClick={() => handleRowDoubleClick(object)}
                  data-object-id={object.meta.id}
                  role="row"
                  aria-selected={isSelected}
                >
                  {/* Favorite cell */}
                  {showFavorites && onFavoriteToggle && (
                    <td className="w-12 px-2 py-3">
                      <FavoriteToggle
                        isFavorite={isFavorite(object.meta.id)}
                        onToggle={() => onFavoriteToggle(object.meta.id)}
                        size="sm"
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        px-4 py-3 text-sm text-[var(--glass-text-primary)]
                        ${column.align === 'center' ? 'text-center' : ''}
                        ${column.align === 'right' ? 'text-right' : ''}
                      `}
                    >
                      {column.render
                        ? column.render(object)
                        : column.field
                          ? formatCellValue(getNestedValue(object, column.field))
                          : '—'}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ObjectList;
