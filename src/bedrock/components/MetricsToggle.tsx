// src/bedrock/components/MetricsToggle.tsx
// Toggle component for metrics bar visibility in Bedrock consoles
// Sprint: bedrock-ui-compact-v1
// User Stories: US-BUC001, US-BUC002, US-BUC003

import React from 'react';
import { useBedrockUI } from '../context/BedrockUIContext';

/**
 * MetricsToggle - A toggle button to show/hide the metrics bar across all Bedrock consoles.
 *
 * Features:
 * - Persists preference to localStorage via BedrockUIContext
 * - Accessible: keyboard focusable, clear labels, focus ring
 * - Respects prefers-reduced-motion for animations
 *
 * Placement: Nav sidebar footer (BedrockWorkspace)
 */
export function MetricsToggle() {
  const { metricsBarVisible, setMetricsBarVisible } = useBedrockUI();

  const handleToggle = () => {
    setMetricsBarVisible(!metricsBarVisible);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm
        transition-colors motion-reduce:transition-none
        focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50
        ${metricsBarVisible
          ? 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] hover:bg-[var(--glass-elevated)]'
          : 'text-[var(--neon-amber)] bg-[var(--neon-amber)]/10 hover:bg-[var(--neon-amber)]/20'
        }
      `}
      title={metricsBarVisible ? 'Hide metrics bar' : 'Show metrics bar'}
      aria-pressed={!metricsBarVisible}
    >
      <span className="material-symbols-outlined text-lg">
        {metricsBarVisible ? 'visibility' : 'visibility_off'}
      </span>
      <span className="text-xs font-medium">
        {metricsBarVisible ? 'Hide Stats' : 'Show Stats'}
      </span>
    </button>
  );
}

export default MetricsToggle;
