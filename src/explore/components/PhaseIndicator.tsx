// src/explore/components/PhaseIndicator.tsx
// Phase indicator badge for research progress
// Sprint: progress-streaming-ui-v1

import type { ProgressPhase } from '../hooks/useResearchProgress';

interface PhaseIndicatorProps {
  phase: ProgressPhase;
  className?: string;
}

const PHASE_CONFIG: Record<ProgressPhase, {
  icon: string;
  label: string;
  color: string;
  bgColor: string;
  animate: boolean;
}> = {
  idle: {
    icon: 'hourglass_empty',
    label: 'Waiting',
    color: 'text-slate-500',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    animate: false,
  },
  research: {
    icon: 'science',
    label: 'Researching',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    animate: true,
  },
  writing: {
    icon: 'edit_note',
    label: 'Writing',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    animate: true,
  },
  complete: {
    icon: 'check_circle',
    label: 'Complete',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    animate: false,
  },
  error: {
    icon: 'error',
    label: 'Failed',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    animate: false,
  },
};

export function PhaseIndicator({ phase, className = '' }: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        ${config.bgColor} ${config.color}
        ${config.animate ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <span className="material-symbols-outlined text-lg">
        {config.icon}
      </span>
      <span className="text-sm font-medium">
        {config.label}
      </span>
    </div>
  );
}

export default PhaseIndicator;
