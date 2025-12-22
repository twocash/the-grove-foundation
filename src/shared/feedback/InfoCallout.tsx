// src/shared/feedback/InfoCallout.tsx
// Reusable info callout component

import { type ReactNode } from 'react';

type CalloutVariant = 'info' | 'warning' | 'error' | 'success';

interface InfoCalloutProps {
  message: string | ReactNode;
  variant?: CalloutVariant;
  icon?: string;
  title?: string;
}

const variantStyles: Record<CalloutVariant, { colors: string; icon: string }> = {
  info: {
    colors: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30',
    icon: 'info',
  },
  warning: {
    colors: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30',
    icon: 'warning',
  },
  error: {
    colors: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30',
    icon: 'error',
  },
  success: {
    colors: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30',
    icon: 'check_circle',
  },
};

export function InfoCallout({
  message,
  variant = 'info',
  icon,
  title,
}: InfoCalloutProps) {
  const styles = variantStyles[variant];
  const displayIcon = icon || styles.icon;

  return (
    <div className={`flex items-start gap-2.5 text-xs p-3 rounded-lg border ${styles.colors}`}>
      <span className="material-symbols-outlined text-sm mt-0.5 flex-shrink-0">{displayIcon}</span>
      <div className="flex-1">
        {title && (
          <p className="font-medium mb-0.5">{title}</p>
        )}
        <span className="leading-relaxed">{message}</span>
      </div>
    </div>
  );
}
