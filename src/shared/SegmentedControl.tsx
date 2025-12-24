// src/shared/SegmentedControl.tsx
// Generic segmented control for view switching

import React from 'react';

interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
  icon?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: SegmentedControlProps<T>) {
  const sizeClasses = size === 'sm' ? 'text-xs py-1 px-2' : 'text-sm py-1.5 px-3';

  return (
    <div
      className={`
        inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`
            ${sizeClasses}
            rounded-md font-medium transition-all duration-150
            flex items-center gap-1.5
            ${fullWidth ? 'flex-1 justify-center' : ''}
            ${value === option.id
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }
          `}
        >
          {option.icon && (
            <span className="material-symbols-outlined text-base">{option.icon}</span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
