// src/bedrock/primitives/GlassTable.tsx
// Quantum Glass table primitive for data display
// Sprint: kinetic-pipeline-v1 (Story 6.0)

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

interface Column<T> {
  /** Column key (for data access) */
  key: keyof T | string;
  /** Column header label */
  label: string;
  /** Column width (Tailwind class or CSS value) */
  width?: string;
  /** Custom render function */
  render?: (value: unknown, row: T, index: number) => ReactNode;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether column is sortable */
  sortable?: boolean;
}

interface GlassTableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Data rows */
  data: T[];
  /** Unique key field */
  keyField?: keyof T;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Selected row key */
  selectedKey?: string | number;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Number of skeleton rows to show when loading */
  loadingRows?: number;
  /** Compact mode (less padding) */
  compact?: boolean;
  /** Additional classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function GlassTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = 'id' as keyof T,
  onRowClick,
  selectedKey,
  emptyState,
  loading = false,
  loadingRows = 5,
  compact = false,
  className = '',
}: GlassTableProps<T>) {
  const isInteractive = Boolean(onRowClick);
  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headerPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const getNestedValue = (obj: T, path: string): unknown => {
    return path.split('.').reduce((acc: unknown, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`overflow-hidden rounded-xl border border-white/5 bg-[var(--glass-solid)] ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-[var(--glass-panel)]">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`${headerPadding} text-xs font-medium text-[var(--glass-text-muted)] uppercase tracking-wider ${alignmentClasses[col.align || 'left']}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-white/5 last:border-0">
                {columns.map((_, colIndex) => (
                  <td key={colIndex} className={cellPadding}>
                    <div className="h-4 bg-[var(--glass-panel)] rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`overflow-hidden rounded-xl border border-white/5 bg-[var(--glass-solid)] ${className}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-[var(--glass-panel)]">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`${headerPadding} text-xs font-medium text-[var(--glass-text-muted)] uppercase tracking-wider ${alignmentClasses[col.align || 'left']}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="p-8 text-center">
          {emptyState || (
            <div className="text-[var(--glass-text-muted)]">
              <span className="material-symbols-outlined text-3xl mb-2 block opacity-50">
                inbox
              </span>
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-white/5 bg-[var(--glass-solid)] ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-[var(--glass-panel)]">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`${headerPadding} text-xs font-medium text-[var(--glass-text-muted)] uppercase tracking-wider ${alignmentClasses[col.align || 'left']}`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => {
              const rowKey = row[keyField] as string | number;
              const isSelected = selectedKey !== undefined && rowKey === selectedKey;

              return (
                <tr
                  key={rowKey ?? rowIndex}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={`
                    border-b border-white/5 last:border-0 transition-colors
                    ${isInteractive ? 'cursor-pointer hover:bg-[var(--glass-elevated)]' : ''}
                    ${isSelected ? 'bg-[var(--glass-elevated)]' : ''}
                  `}
                >
                  {columns.map((col, colIndex) => {
                    const value = typeof col.key === 'string' && col.key.includes('.')
                      ? getNestedValue(row, col.key)
                      : row[col.key as keyof T];

                    return (
                      <td
                        key={colIndex}
                        className={`${cellPadding} text-sm text-[var(--glass-text-body)] ${alignmentClasses[col.align || 'left']}`}
                      >
                        {col.render ? col.render(value, row, rowIndex) : String(value ?? '')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GlassTable;
