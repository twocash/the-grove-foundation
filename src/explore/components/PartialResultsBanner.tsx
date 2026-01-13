// src/explore/components/PartialResultsBanner.tsx
// Banner for indicating partial research results
// Sprint: polish-demo-prep-v1
//
// DEX: Provenance as Infrastructure
// Users know exactly what data the document is based on.

import React, { useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export interface FailedBranch {
  id: string;
  label: string;
  error?: string;
}

export interface PartialResultsBannerProps {
  /** Number of branches that completed successfully */
  successfulBranches: number;
  /** Total number of branches attempted */
  totalBranches: number;
  /** Optional: details about failed branches */
  failedBranches?: FailedBranch[];
  /** Whether to allow collapsing the banner */
  dismissible?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function PartialResultsBanner({
  successfulBranches,
  totalBranches,
  failedBranches = [],
  dismissible = false,
  onDismiss,
  className = '',
}: PartialResultsBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const failedCount = totalBranches - successfulBranches;

  // Don't render if all branches succeeded
  if (failedCount === 0) {
    return null;
  }

  // Calculate severity
  const severity = calculateSeverity(successfulBranches, totalBranches);

  return (
    <div
      className={`
        ${severity.bgColor} ${severity.borderColor}
        border rounded-lg overflow-hidden
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {/* Main banner content */}
      <div className="p-3 flex items-center gap-3">
        {/* Icon */}
        <span className={`material-symbols-outlined text-lg ${severity.iconColor}`}>
          {severity.icon}
        </span>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${severity.textColor}`}>
            <span className="font-medium">
              {failedCount} of {totalBranches}
            </span>
            {' '}research {failedCount === 1 ? 'branch' : 'branches'} failed.
            {' '}Results are based on{' '}
            <span className="font-medium">
              {successfulBranches} successful {successfulBranches === 1 ? 'branch' : 'branches'}
            </span>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Expand/collapse button (if failed branches provided) */}
          {failedBranches.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors`}
              aria-expanded={expanded}
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              <span className={`material-symbols-outlined text-base ${severity.iconColor} transition-transform ${expanded ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
          )}

          {/* Dismiss button */}
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss banner"
            >
              <span className={`material-symbols-outlined text-base ${severity.iconColor}`}>
                close
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && failedBranches.length > 0 && (
        <div className="px-3 pb-3 pt-0">
          <div className="border-t border-black/10 dark:border-white/10 pt-3">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Failed branches:
            </p>
            <ul className="space-y-1">
              {failedBranches.map((branch) => (
                <li
                  key={branch.id}
                  className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                >
                  <span className="material-symbols-outlined text-sm text-red-400 mt-0.5">
                    close
                  </span>
                  <div>
                    <span className="font-medium">{branch.label}</span>
                    {branch.error && (
                      <span className="text-slate-400 dark:text-slate-500">
                        {' '}— {branch.error}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Severity Calculation
// =============================================================================

interface SeverityConfig {
  icon: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}

function calculateSeverity(successful: number, total: number): SeverityConfig {
  const successRate = successful / total;

  // Critical: Less than 50% succeeded
  if (successRate < 0.5) {
    return {
      icon: 'error',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800/50',
      iconColor: 'text-red-500 dark:text-red-400',
      textColor: 'text-red-800 dark:text-red-200',
    };
  }

  // Warning: 50-80% succeeded
  if (successRate < 0.8) {
    return {
      icon: 'warning',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800/50',
      iconColor: 'text-amber-500 dark:text-amber-400',
      textColor: 'text-amber-800 dark:text-amber-200',
    };
  }

  // Info: More than 80% succeeded
  return {
    icon: 'info',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    iconColor: 'text-blue-500 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200',
  };
}

// =============================================================================
// Export
// =============================================================================

export default PartialResultsBanner;
