// src/shared/ObjectList.tsx
// Generic list component with selection and inspector highlighting

import React from 'react';

interface ObjectListItem {
  id: string;
  label: string;
  count?: number;
  status?: 'active' | 'inactive' | 'draft';
}

interface ObjectListProps<T> {
  items: T[];
  selectedId: string | null;
  activeInspectorId: string | null;
  onSelect: (id: string) => void;
  getItemProps: (item: T) => ObjectListItem;
  emptyMessage?: string;
  className?: string;
}

const statusDot: Record<string, string> = {
  active: 'bg-emerald-500',
  inactive: 'bg-slate-400',
  draft: 'bg-amber-500',
};

export function ObjectList<T>({
  items,
  selectedId,
  activeInspectorId,
  onSelect,
  getItemProps,
  emptyMessage = 'No items',
  className = '',
}: ObjectListProps<T>) {
  if (items.length === 0) {
    return (
      <div className={`text-slate-400 text-sm py-4 text-center ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((item) => {
        const { id, label, count, status } = getItemProps(item);
        const isSelected = selectedId === id;
        const isInspected = activeInspectorId === id;

        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`
              w-full text-left px-3 py-2 rounded-lg transition-colors
              flex items-center justify-between gap-2
              ${isInspected
                ? 'bg-primary/10 border border-primary/30'
                : isSelected
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }
            `}
          >
            <div className="flex items-center gap-2 min-w-0">
              {status && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[status] || statusDot.inactive}`} />
              )}
              <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {label}
              </span>
            </div>
            {count !== undefined && (
              <span className="text-xs text-slate-400 flex-shrink-0">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ObjectList;
