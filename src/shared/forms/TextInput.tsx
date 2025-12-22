// src/shared/forms/TextInput.tsx
// Reusable text input component

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'url' | 'password';
  error?: string;
}

export function TextInput({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  type = 'text',
  error,
}: TextInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-3 py-2 text-sm
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
