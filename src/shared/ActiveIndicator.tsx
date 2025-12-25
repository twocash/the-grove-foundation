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
    <div className={`border border-[var(--glass-border)] bg-[var(--glass-solid)] rounded-lg p-4 flex items-center gap-3 ${className}`}>
      <div className="h-2 w-2 rounded-full bg-[var(--neon-green)] animate-pulse" />
      <span className="text-sm font-medium text-[var(--glass-text-subtle)] uppercase tracking-wide">
        {label}:
      </span>
      {icon && (
        <span className="material-symbols-outlined text-[var(--neon-green)] text-lg">{icon}</span>
      )}
      <span className="text-sm font-semibold text-[var(--glass-text-primary)]">
        {value}
      </span>
    </div>
  );
}
