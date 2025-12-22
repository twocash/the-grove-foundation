// src/shared/feedback/LoadingSpinner.tsx
// Reusable loading spinner component

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  size = 'md',
  label,
  fullPage = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`
          ${sizeClasses[size]}
          border-primary/30 border-t-primary
          rounded-full animate-spin
        `}
      />
      {label && (
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
          {label}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="h-full flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
