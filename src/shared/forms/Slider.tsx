// src/shared/forms/Slider.tsx
// Reusable slider component

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  valueLabel?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  onChange,
  label,
  min = 0,
  max = 100,
  step = 1,
  valueLabel,
  disabled = false,
}: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
        <span className="text-xs text-slate-900 dark:text-slate-300 font-mono bg-stone-200 dark:bg-slate-800 px-1.5 rounded">
          {valueLabel || value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`
          w-full h-1.5 bg-stone-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />
    </div>
  );
}
