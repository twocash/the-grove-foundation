// src/shared/forms/Toggle.tsx
// Reusable toggle switch component

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled = false }: ToggleProps) {
  return (
    <div className="p-4 bg-stone-50 dark:bg-slate-900/50 border border-border-light dark:border-slate-700 rounded-xl flex items-center justify-between shadow-sm">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {description && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{description}</span>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900
          ${checked ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}
