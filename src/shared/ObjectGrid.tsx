// src/shared/ObjectGrid.tsx
// Generic grid component for displaying DEX objects

import React from 'react';
import { EmptyState } from './feedback';

interface ObjectCardBadge {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

interface ObjectCardProps {
  id: string;
  title: string;
  subtitle: string;
  badges?: ObjectCardBadge[];
}

interface ObjectGridProps<T> {
  items: T[];
  activeInspectorId: string | null;
  searchQuery: string;
  onSelect: (id: string) => void;
  getCardProps: (item: T) => ObjectCardProps;
  emptyMessage?: string;
  emptySearchMessage?: string;
  columns?: 2 | 3 | 4;
  maxHeight?: string;
  className?: string;
}

const badgeVariants: Record<string, string> = {
  default: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
};

const columnClasses: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function ObjectGrid<T>({
  items,
  activeInspectorId,
  searchQuery,
  onSelect,
  getCardProps,
  emptyMessage = 'No items',
  emptySearchMessage = 'No items match your search',
  columns = 2,
  maxHeight = '50vh',
  className = '',
}: ObjectGridProps<T>) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={searchQuery ? 'search_off' : 'inventory_2'}
        title={searchQuery ? 'No results' : emptyMessage}
        description={searchQuery ? emptySearchMessage : undefined}
      />
    );
  }

  return (
    <div
      className={`overflow-y-auto ${className}`}
      style={{ maxHeight }}
    >
      <div className={`grid ${columnClasses[columns]} gap-3 p-1`}>
        {items.map((item) => {
          const { id, title, subtitle, badges = [] } = getCardProps(item);
          const isInspected = activeInspectorId === id;

          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`
                text-left p-3 rounded-lg border transition-all
                ${isInspected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h4>
                {badges.length > 0 && (
                  <div className="flex gap-1 flex-shrink-0">
                    {badges.map((badge, i) => (
                      <span
                        key={i}
                        className={`
                          px-1.5 py-0.5 text-xs rounded
                          ${badgeVariants[badge.variant || 'default']}
                        `}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Export the badge type for consumers
export type { ObjectCardBadge };

export default ObjectGrid;
