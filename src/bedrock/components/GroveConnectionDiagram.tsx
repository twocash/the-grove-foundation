// src/bedrock/components/GroveConnectionDiagram.tsx
// Visual diagram showing connection between two groves
// Sprint: S15-BD-FederationEditors-v1

import React from 'react';
import { BufferedInput } from '../primitives/BufferedInput';

// =============================================================================
// Types
// =============================================================================

export interface GroveConnectionDiagramProps {
  /** Source grove identifier */
  sourceGrove: string;
  /** Target grove identifier */
  targetGrove: string;
  /** Label for source grove (defaults to "Source Grove") */
  sourceLabel?: string;
  /** Label for target grove (defaults to "Target Grove") */
  targetLabel?: string;
  /** Handler for source grove changes */
  onSourceChange?: (value: string) => void;
  /** Handler for target grove changes */
  onTargetChange?: (value: string) => void;
  /** If true, inputs are read-only */
  readonly?: boolean;
  /** Custom icon element to show in the center */
  icon?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * GroveConnectionDiagram displays a visual representation of two groves
 * connected by a bidirectional arrow. Used in TierMapping, Exchange, and Trust editors.
 *
 * On mobile (sm: breakpoint), the diagram stacks vertically.
 *
 * @example
 * <GroveConnectionDiagram
 *   sourceGrove={grove1.id}
 *   targetGrove={grove2.id}
 *   sourceLabel="Requesting Grove"
 *   targetLabel="Providing Grove"
 *   onSourceChange={(v) => setSource(v)}
 *   onTargetChange={(v) => setTarget(v)}
 * />
 */
export function GroveConnectionDiagram({
  sourceGrove,
  targetGrove,
  sourceLabel = 'Source Grove',
  targetLabel = 'Target Grove',
  onSourceChange,
  onTargetChange,
  readonly = false,
  icon,
  className = '',
}: GroveConnectionDiagramProps) {
  const defaultIcon = (
    <span className="material-symbols-outlined text-xl text-[var(--neon-cyan)]">
      sync_alt
    </span>
  );

  return (
    <div
      data-testid="grove-connection-diagram"
      className={`
        flex flex-col sm:flex-row items-stretch sm:items-center gap-3
        p-4 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)]
        ${className}
      `}
    >
      {/* Source Grove */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
          {sourceLabel}
        </label>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--neon-cyan)]/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-sm text-[var(--neon-cyan)]">
              forest
            </span>
          </div>
          {readonly ? (
            <div
              data-testid="source-grove"
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] truncate"
            >
              {sourceGrove || <span className="text-[var(--glass-text-muted)]">Not set</span>}
            </div>
          ) : (
            <BufferedInput
              data-testid="source-grove"
              value={sourceGrove}
              onChange={(v) => onSourceChange?.(v)}
              placeholder="grove-id"
              disabled={readonly}
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
            />
          )}
        </div>
      </div>

      {/* Connection Arrow / Icon */}
      <div className="flex items-center justify-center py-2 sm:py-0 sm:px-2">
        <div className="w-10 h-10 rounded-full bg-[var(--glass-elevated)] border border-[var(--glass-border)] flex items-center justify-center">
          {icon || defaultIcon}
        </div>
      </div>

      {/* Target Grove */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
          {targetLabel}
        </label>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--neon-green)]/10 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-sm text-[var(--neon-green)]">
              forest
            </span>
          </div>
          {readonly ? (
            <div
              data-testid="target-grove"
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] truncate"
            >
              {targetGrove || <span className="text-[var(--glass-text-muted)]">Not set</span>}
            </div>
          ) : (
            <BufferedInput
              data-testid="target-grove"
              value={targetGrove}
              onChange={(v) => onTargetChange?.(v)}
              placeholder="grove-id"
              disabled={readonly}
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)] focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default GroveConnectionDiagram;
