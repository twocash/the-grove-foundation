// src/bedrock/components/EmptyState.tsx
// Empty state display for collections with no results
// Sprint: bedrock-foundation-v1 (Epic 4, Story 4.2)

import React, { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

export type EmptyStateVariant = 'no-items' | 'no-results' | 'error' | 'loading';

export interface EmptyStateProps {
  /** Empty state variant */
  variant?: EmptyStateVariant;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom icon (Material Symbols name) */
  icon?: string;
  /** Action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom content */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Default Content
// =============================================================================

const variantDefaults: Record<EmptyStateVariant, { title: string; description: string; icon: string }> = {
  'no-items': {
    title: 'No items yet',
    description: 'Create your first item to get started.',
    icon: 'add_box',
  },
  'no-results': {
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
    icon: 'search_off',
  },
  error: {
    title: 'Something went wrong',
    description: 'We had trouble loading this content. Please try again.',
    icon: 'error_outline',
  },
  loading: {
    title: 'Loading...',
    description: 'Please wait while we fetch your data.',
    icon: 'hourglass_empty',
  },
};

// =============================================================================
// Component
// =============================================================================

export function EmptyState({
  variant = 'no-items',
  title,
  description,
  icon,
  action,
  secondaryAction,
  children,
  className = '',
}: EmptyStateProps) {
  const defaults = variantDefaults[variant];
  const displayTitle = title ?? defaults.title;
  const displayDescription = description ?? defaults.description;
  const displayIcon = icon ?? defaults.icon;

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        py-12 px-6
        ${className}
      `}
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--glass-panel)] flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-[var(--glass-text-muted)]">
          {displayIcon}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-[var(--glass-text-primary)] mb-2">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--glass-text-muted)] max-w-md mb-6">
        {displayDescription}
      </p>

      {/* Custom content */}
      {children}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]
                hover:bg-[var(--neon-cyan)]/30 transition-colors
                text-sm font-medium
              "
            >
              {action.icon && (
                <span className="material-symbols-outlined text-lg">{action.icon}</span>
              )}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="
                px-4 py-2 rounded-lg text-sm
                text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]
                transition-colors
              "
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Pre-configured Variants
// =============================================================================

export function NoItemsState(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="no-items" {...props} />;
}

export function NoResultsState(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="no-results" {...props} />;
}

export function ErrorState(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="error" {...props} />;
}

export function LoadingState(props: Omit<EmptyStateProps, 'variant'>) {
  return <EmptyState variant="loading" {...props} />;
}

export default EmptyState;
