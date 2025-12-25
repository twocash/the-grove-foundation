// src/surface/components/GroveObjectCard/CardShell.tsx
// Styling wrapper using --card-* tokens (Sprint 6)

import React from 'react';
import { GroveObjectMeta } from '@core/schema/grove-object';
import { Star } from 'lucide-react';

interface CardShellProps {
  meta: GroveObjectMeta;
  isActive?: boolean;
  isInspected?: boolean;
  onFavorite?: () => void;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function CardShell({
  meta,
  isActive,
  isInspected,
  onFavorite,
  onClick,
  children,
  className = '',
}: CardShellProps) {
  // Build className for visual state matrix
  const stateClasses = isInspected
    ? 'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'
    : isActive
      ? 'bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1 ring-[var(--card-ring-active)]'
      : 'border-[var(--card-border-default)] hover:border-primary/30';

  return (
    <article
      role="article"
      onClick={onClick}
      className={`
        rounded-xl border p-4 transition-all cursor-pointer
        ${stateClasses}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {meta.icon && (
            <span className="material-symbols-outlined text-slate-500">
              {meta.icon}
            </span>
          )}
          <h3 className="font-medium text-slate-900 dark:text-slate-100">
            {meta.title}
          </h3>
        </div>

        {onFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                meta.favorite
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-400'
              }`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      {children}

      {/* Footer: Status + Tags */}
      {(meta.status || (meta.tags && meta.tags.length > 0)) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          {meta.status && meta.status !== 'active' && (
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
              {meta.status}
            </span>
          )}
          {meta.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-slate-500">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
