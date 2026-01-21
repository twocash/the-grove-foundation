// src/bedrock/components/ObjectCard.tsx
// Base card component for GroveObject display
// Sprint: bedrock-foundation-v1 (Epic 4, Story 4.3)
// Simplified universal pattern for all Bedrock cards

import React, { type ReactNode } from 'react';
import type { GroveObject } from '../../core/schema/grove-object';
import { FavoriteToggle } from './FavoriteToggle';

// =============================================================================
// Types
// =============================================================================

export interface ObjectCardProps<T = unknown> {
  /** The GroveObject to display */
  object: GroveObject<T>;
  /** Whether the card is selected */
  selected?: boolean;
  /** Whether the object is favorited */
  isFavorite?: boolean;
  /** Callback when card is clicked */
  onClick?: () => void;
  /** Callback when favorite is toggled */
  onFavoriteToggle?: () => void;
  /** Icon slot (emoji, icon, or thumbnail) */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Subtitle text (category, type, etc.) */
  subtitle?: string;
  /** Status badge (Active, Draft, etc.) */
  status?: {
    label: string;
    variant: 'active' | 'draft' | 'archived' | 'default';
  };
  /** Footer metadata (left and right) */
  footer?: {
    left?: ReactNode;
    right?: ReactNode;
  };
  /** Additional CSS classes */
  className?: string;
  /** Test ID for e2e testing */
  testId?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ObjectCard<T = unknown>({
  object,
  selected = false,
  isFavorite = false,
  onClick,
  onFavoriteToggle,
  icon,
  title,
  subtitle,
  status,
  footer,
  className = '',
  testId,
}: ObjectCardProps<T>) {
  const meta = object.meta;

  const statusStyles: Record<string, React.CSSProperties> = {
    active: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' },
    draft: { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' },
    archived: { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' },
    default: { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' },
  };

  return (
    <div
      className={`
        group relative rounded-xl border bg-[var(--glass-solid)]
        transition-all duration-200 cursor-pointer
        ${selected
          ? 'border-[var(--neon-cyan)] shadow-[0_0_20px_rgba(34,211,238,0.15)]'
          : 'border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'
        }
        ${className}
      `}
      onClick={onClick}
      data-testid={testId || `object-card-${meta.id}`}
      data-object-id={meta.id}
      data-object-type={meta.type}
      role="button"
      tabIndex={0}
      aria-selected={selected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Favorite Toggle */}
      {onFavoriteToggle && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <FavoriteToggle
            isFavorite={isFavorite}
            onToggle={onFavoriteToggle}
            size="sm"
          />
        </div>
      )}

      {/* Card Content */}
      <div className="p-4">
        {/* Icon */}
        {icon && <div className="mb-3">{icon}</div>}

        {/* Header: Title + Status */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)] truncate flex-1">
            {title}
          </h3>
          {status && (
            <span
              className="px-2 py-0.5 text-xs rounded-full font-medium shrink-0"
              style={statusStyles[status.variant]}
            >
              {status.label}
            </span>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-[var(--glass-text-muted)] mb-3 line-clamp-2">
            {subtitle}
          </p>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between text-xs text-[var(--glass-text-muted)] pt-2 border-t border-[var(--glass-border)]">
            <div>{footer.left}</div>
            <div>{footer.right}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ObjectCard;
