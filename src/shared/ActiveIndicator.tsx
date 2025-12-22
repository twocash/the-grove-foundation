// src/shared/ActiveIndicator.tsx
// Shows current active state (lens, journey, etc.)

interface ActiveIndicatorProps {
  label: string;
  value: string;
  icon?: string;
  className?: string;
}

export function ActiveIndicator({ label, value, icon, className = '' }: ActiveIndicatorProps) {
  return (
    <div className={`border border-border-light dark:border-slate-700 bg-stone-50 dark:bg-slate-900 rounded-lg p-4 flex items-center gap-3 shadow-sm ${className}`}>
      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {label}:
      </span>
      {icon && (
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      )}
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}
