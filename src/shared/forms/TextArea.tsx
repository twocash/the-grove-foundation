// src/shared/forms/TextArea.tsx
// Reusable text area component

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  error?: string;
  maxLength?: number;
}

export function TextArea({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  rows = 3,
  error,
  maxLength,
}: TextAreaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {label}
          </label>
          {maxLength && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
      <textarea
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-3 py-2 text-sm resize-none
          bg-stone-50 dark:bg-slate-900
          border rounded-lg
          text-slate-700 dark:text-slate-300
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          focus:outline-none focus:border-primary
          ${error
            ? 'border-red-300 dark:border-red-700'
            : 'border-border-light dark:border-slate-700'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
