// src/shared/forms/Checkbox.tsx
// Reusable checkbox component

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: CheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={`
          mt-0.5 rounded border-border-light dark:border-slate-600
          text-primary focus:ring-primary bg-stone-50 dark:bg-slate-800
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      <div className="flex flex-col">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
        {description && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">{description}</span>
        )}
      </div>
    </div>
  );
}
