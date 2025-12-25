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
  // Data attributes for CSS-driven glass-card states
  const dataAttributes: Record<string, string | undefined> = {
    'data-selected': isInspected ? 'true' : undefined,
    'data-active': isActive ? 'true' : undefined,
  };

  return (
    <article
      role="article"
      onClick={onClick}
      {...dataAttributes}
      className={`glass-card p-5 cursor-pointer ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {meta.icon && (
            <span className="material-symbols-outlined text-[var(--glass-text-muted)]">
              {meta.icon}
            </span>
          )}
          <h3 className="font-medium text-[var(--glass-text-primary)]">
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
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--glass-border)]">
          {meta.status && meta.status !== 'active' && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--glass-elevated)] text-[var(--glass-text-muted)]">
              {meta.status}
            </span>
          )}
          {meta.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs text-[var(--glass-text-subtle)]">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
