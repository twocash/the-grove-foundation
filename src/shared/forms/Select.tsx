// src/shared/forms/Select.tsx
// Reusable select dropdown component

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
}

export function Select({
  value,
  onChange,
  label,
  options,
  disabled = false,
  placeholder,
}: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`
            w-full bg-stone-50 dark:bg-slate-900 border border-border-light dark:border-slate-700
            text-slate-700 dark:text-slate-300 text-xs rounded-lg px-3 py-2.5
            focus:outline-none focus:border-primary appearance-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
          arrow_drop_down
        </span>
      </div>
    </div>
  );
}
