// src/explore/components/ErrorDisplay.tsx
// User-friendly error display with retry option
// Sprint: polish-demo-prep-v1
//
// DEX: Capability Agnosticism
// Graceful degradation regardless of API response - always provide user guidance.

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export type ErrorPhase = 'research' | 'writing' | 'timeout' | 'network';

export interface ErrorDisplayProps {
  /** Phase where the error occurred */
  phase: ErrorPhase;
  /** Technical error message (for logging) */
  message?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Error Messages Config (DEX: Declarative Sovereignty)
// =============================================================================

interface ErrorConfig {
  icon: string;
  title: string;
  description: string;
  suggestion: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}

const ERROR_CONFIG: Record<ErrorPhase, ErrorConfig> = {
  timeout: {
    icon: 'schedule',
    title: 'Research is taking longer than expected',
    description: 'The query may be too broad or the service is experiencing high demand.',
    suggestion: 'Try a more specific query or wait a moment and retry.',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    iconColor: 'text-amber-500 dark:text-amber-400',
    textColor: 'text-amber-800 dark:text-amber-200',
  },
  research: {
    icon: 'science_off',
    title: 'Research phase encountered an issue',
    description: 'We couldn\'t complete the research gathering phase.',
    suggestion: 'Check your query and try again. The service may be temporarily unavailable.',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800/50',
    iconColor: 'text-red-500 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
  },
  writing: {
    icon: 'edit_off',
    title: 'Document generation failed',
    description: 'The research completed but we couldn\'t generate the document.',
    suggestion: 'Your evidence is preserved. Try regenerating the document.',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800/50',
    iconColor: 'text-orange-500 dark:text-orange-400',
    textColor: 'text-orange-800 dark:text-orange-200',
  },
  network: {
    icon: 'wifi_off',
    title: 'Connection issue detected',
    description: 'Unable to reach the research service.',
    suggestion: 'Check your internet connection and try again.',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    borderColor: 'border-slate-300 dark:border-slate-600',
    iconColor: 'text-slate-500 dark:text-slate-400',
    textColor: 'text-slate-700 dark:text-slate-300',
  },
};

// =============================================================================
// Component
// =============================================================================

export function ErrorDisplay({
  phase,
  message,
  onRetry,
  onDismiss,
  className = '',
}: ErrorDisplayProps) {
  const config = ERROR_CONFIG[phase];

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor}
        border rounded-lg p-4
        ${className}
      `}
      role="alert"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <span className={`material-symbols-outlined text-2xl ${config.iconColor}`}>
            {config.icon}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`text-sm font-semibold ${config.textColor}`}>
            {config.title}
          </h3>

          {/* Description */}
          <p className={`text-sm mt-1 ${config.textColor} opacity-80`}>
            {config.description}
          </p>

          {/* Suggestion */}
          <p className={`text-xs mt-2 ${config.textColor} opacity-60`}>
            {config.suggestion}
          </p>

          {/* Technical details (collapsed by default for dev purposes) */}
          {message && process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                Technical details
              </summary>
              <pre className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-x-auto">
                {message}
              </pre>
            </details>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Dismiss error"
          >
            <span className="material-symbols-outlined text-base text-slate-400 dark:text-slate-500">
              close
            </span>
          </button>
        )}
      </div>

      {/* Retry button */}
      {onRetry && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onRetry}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2
              text-sm font-medium text-white
              bg-purple-600 hover:bg-purple-700
              rounded-lg shadow-sm
              transition-colors
            `}
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Utility function to detect error phase from message
// =============================================================================

export function detectErrorPhase(errorMessage: string): ErrorPhase {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return 'timeout';
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return 'network';
  }

  if (lowerMessage.includes('write') || lowerMessage.includes('document') || lowerMessage.includes('generate')) {
    return 'writing';
  }

  return 'research';
}

// =============================================================================
// Export
// =============================================================================

export default ErrorDisplay;
