// src/bedrock/components/QualityEmptyStates.tsx
// Quality-related Empty and Error States
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: Consistent, informative empty/error states for quality assessment UI

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface QualityEmptyStateProps {
  /** Additional class names */
  className?: string;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
  /** CTA button configuration */
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface QualityErrorStateProps extends QualityEmptyStateProps {
  /** Error message to display */
  errorMessage?: string;
  /** Retry action */
  onRetry?: () => void;
}

export interface QualityFilterEmptyStateProps {
  /** Number of items hidden by filter */
  hiddenCount?: number;
  /** Clear filters action */
  onClearFilters?: () => void;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Not Assessed State
// =============================================================================

/**
 * Shown when a sprout has not been assessed for quality yet
 */
export function QualityNotAssessedState({
  className = '',
  title = 'Not Yet Assessed',
  description = 'Quality assessment has not been performed for this sprout. Assessments typically occur automatically after synthesis is complete.',
  action,
}: QualityEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      data-testid="quality-not-assessed-state"
    >
      <div className="p-4 rounded-full bg-[var(--glass-border)] mb-4">
        <span className="material-symbols-outlined text-4xl text-[var(--glass-text-muted)]">
          psychology
        </span>
      </div>
      <h4 className="text-base font-medium text-[var(--glass-text-primary)] mb-2">
        {title}
      </h4>
      <p className="text-sm text-[var(--glass-text-muted)] max-w-xs mb-4">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--neon-cyan)] text-black hover:bg-[var(--neon-cyan)]/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Pending State
// =============================================================================

/**
 * Shown when quality assessment is in progress
 */
export function QualityPendingState({
  className = '',
  title = 'Assessment in Progress',
  description = 'Quality scores are being calculated. This usually takes a few moments.',
}: QualityEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      data-testid="quality-pending-state"
    >
      <div className="relative mb-4">
        <div className="p-4 rounded-full bg-[var(--neon-amber)]/10">
          <span className="material-symbols-outlined text-4xl text-[var(--neon-amber)] animate-pulse">
            hourglass_empty
          </span>
        </div>
        {/* Spinning ring animation */}
        <div className="absolute inset-0 rounded-full border-2 border-[var(--neon-amber)]/30 animate-spin border-t-[var(--neon-amber)]" style={{ animationDuration: '2s' }} />
      </div>
      <h4 className="text-base font-medium text-[var(--glass-text-primary)] mb-2">
        {title}
      </h4>
      <p className="text-sm text-[var(--glass-text-muted)] max-w-xs">
        {description}
      </p>
    </div>
  );
}

// =============================================================================
// Error State
// =============================================================================

/**
 * Shown when quality assessment has failed
 */
export function QualityErrorState({
  className = '',
  title = 'Assessment Failed',
  description = 'Unable to calculate quality scores for this sprout.',
  errorMessage,
  onRetry,
}: QualityErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      data-testid="quality-error-state"
    >
      <div className="p-4 rounded-full mb-4" style={{ backgroundColor: 'var(--semantic-error-bg)' }}>
        <span className="material-symbols-outlined text-4xl" style={{ color: 'var(--semantic-error)' }}>
          error_outline
        </span>
      </div>
      <h4 className="text-base font-medium mb-2" style={{ color: 'var(--semantic-error)' }}>
        {title}
      </h4>
      <p className="text-sm text-[var(--glass-text-muted)] max-w-xs mb-2">
        {description}
      </p>
      {errorMessage && (
        <p className="text-xs max-w-xs mb-4 font-mono px-3 py-2 rounded-lg" style={{ color: 'var(--semantic-error)', opacity: 0.7, backgroundColor: 'var(--semantic-error-bg)' }}>
          {errorMessage}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors"
          style={{ borderColor: 'var(--semantic-error-border)', color: 'var(--semantic-error)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--semantic-error-bg)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Retry Assessment
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Filter Empty State
// =============================================================================

/**
 * Shown when quality filter hides all results
 */
export function QualityFilterEmptyState({
  hiddenCount,
  onClearFilters,
  className = '',
}: QualityFilterEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      data-testid="quality-filter-empty-state"
    >
      <div className="p-4 rounded-full bg-[var(--neon-cyan)]/10 mb-4">
        <span className="material-symbols-outlined text-4xl text-[var(--neon-cyan)]">
          filter_alt_off
        </span>
      </div>
      <h4 className="text-base font-medium text-[var(--glass-text-primary)] mb-2">
        No Matching Results
      </h4>
      <p className="text-sm text-[var(--glass-text-muted)] max-w-xs mb-4">
        {hiddenCount !== undefined
          ? `${hiddenCount} sprout${hiddenCount === 1 ? '' : 's'} ${hiddenCount === 1 ? 'is' : 'are'} hidden by the current quality filter.`
          : 'No sprouts match the current quality filter criteria.'}
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 transition-colors"
        >
          <span className="material-symbols-outlined text-base">filter_alt_off</span>
          Clear Filters
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Network Unavailable State
// =============================================================================

/**
 * Shown when federated network is unavailable
 */
export function QualityNetworkUnavailableState({
  className = '',
  onRetry,
}: {
  className?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      data-testid="quality-network-unavailable-state"
    >
      <div className="p-4 rounded-full bg-[var(--glass-border)] mb-4">
        <span className="material-symbols-outlined text-4xl text-[var(--glass-text-muted)]">
          cloud_off
        </span>
      </div>
      <h4 className="text-base font-medium text-[var(--glass-text-primary)] mb-2">
        Network Unavailable
      </h4>
      <p className="text-sm text-[var(--glass-text-muted)] max-w-xs mb-4">
        Unable to reach the federated quality network. Local assessments will continue to work normally.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-[var(--glass-border)] text-[var(--glass-text-secondary)] hover:border-[var(--neon-cyan)]/50 transition-colors"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Retry Connection
        </button>
      )}
    </div>
  );
}

// =============================================================================
// Inline Variants (Compact)
// =============================================================================

/**
 * Compact inline version of not assessed state
 */
export function QualityNotAssessedInline({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-border)] ${className}`}
      data-testid="quality-not-assessed-inline"
    >
      <span className="material-symbols-outlined text-base text-[var(--glass-text-muted)]">
        psychology
      </span>
      <span className="text-xs text-[var(--glass-text-muted)]">Not assessed</span>
    </div>
  );
}

/**
 * Compact inline version of pending state
 */
export function QualityPendingInline({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--neon-amber)]/10 ${className}`}
      data-testid="quality-pending-inline"
    >
      <span className="material-symbols-outlined text-base text-[var(--neon-amber)] animate-pulse">
        hourglass_empty
      </span>
      <span className="text-xs text-[var(--neon-amber)]">Assessing...</span>
    </div>
  );
}

/**
 * Compact inline version of error state
 */
export function QualityErrorInline({
  className = '',
  onClick,
}: {
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ backgroundColor: 'var(--semantic-error-bg)' }}
      onClick={onClick}
      onMouseEnter={onClick ? (e) => e.currentTarget.style.opacity = '0.8' : undefined}
      onMouseLeave={onClick ? (e) => e.currentTarget.style.opacity = '1' : undefined}
      data-testid="quality-error-inline"
    >
      <span className="material-symbols-outlined text-base" style={{ color: 'var(--semantic-error)' }}>
        error_outline
      </span>
      <span className="text-xs" style={{ color: 'var(--semantic-error)' }}>Assessment failed</span>
      {onClick && (
        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--semantic-error)' }}>refresh</span>
      )}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default {
  QualityNotAssessedState,
  QualityPendingState,
  QualityErrorState,
  QualityFilterEmptyState,
  QualityNetworkUnavailableState,
  QualityNotAssessedInline,
  QualityPendingInline,
  QualityErrorInline,
};
