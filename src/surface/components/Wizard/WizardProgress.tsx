// WizardProgress - Progress bar component
// Sprint: wizard-engine-v1

import React from 'react';

interface WizardProgressProps {
  current: number;
  total: number;
  color?: string;
}

export function WizardProgress({ current, total, color = 'purple' }: WizardProgressProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  // Map color names to Tailwind classes
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
  };

  const bgClass = colorMap[color] || colorMap.purple;

  return (
    <div className="h-1 bg-ink/5">
      <div
        className={`h-full ${bgClass} transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
