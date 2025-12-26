// src/shared/FlowCTA.tsx
// Floating CTA for flow-based navigation
// Sprint: route-selection-flow-v1

import { useNavigate } from 'react-router-dom';

interface FlowCTAProps {
  label: string;
  returnTo: string;
  disabled?: boolean;
  className?: string;
}

export function FlowCTA({ label, returnTo, disabled, className }: FlowCTAProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(returnTo)}
      disabled={disabled}
      className={`
        glass-select-button glass-select-button--solid
        fixed bottom-6 right-6 px-6 py-3 text-sm font-medium
        shadow-lg shadow-[var(--neon-cyan)]/20
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className || ''}
      `}
    >
      {label}
    </button>
  );
}
