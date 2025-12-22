// src/shared/feedback/EmptyState.tsx
// Reusable empty state component for lists/grids

import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
  iconColor?: string;
  iconBg?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  iconColor = 'text-primary',
  iconBg = 'bg-stone-100 dark:bg-slate-800',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-8">
      <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mb-4`}>
        <span className={`material-symbols-outlined text-3xl ${iconColor}`}>{icon}</span>
      </div>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
        {description}
      </p>
      {action}
    </div>
  );
}
