// src/shared/inspector/VersionIndicator.tsx
// Version badge and metadata display for inspectors

import type { VersionActor } from '@core/versioning';
import { getActorLabel, formatRelativeTime } from '@core/versioning';

interface VersionIndicatorProps {
  /** Version ordinal (v1, v2, etc.) */
  ordinal: number | null;
  /** Last modification timestamp */
  lastModifiedAt: string | null;
  /** Who made the last change */
  lastModifiedBy: VersionActor | null;
  /** Compact mode for tight spaces */
  compact?: boolean;
}

/**
 * Version indicator component.
 * Shows version number, relative time, and actor.
 *
 * Full: "v3 • Modified 2 min ago via Copilot"
 * Compact: "v3"
 */
export function VersionIndicator({
  ordinal,
  lastModifiedAt,
  lastModifiedBy,
  compact = false,
}: VersionIndicatorProps) {
  // No version yet (draft state)
  if (!ordinal) {
    return (
      <span className="text-[10px] text-slate-500">
        Draft • Unsaved
      </span>
    );
  }

  const relativeTime = formatRelativeTime(lastModifiedAt);
  const actorLabel = getActorLabel(lastModifiedBy);

  // Compact mode - just badge
  if (compact) {
    return (
      <span
        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
        title={`Modified ${relativeTime} via ${actorLabel}`}
      >
        v{ordinal}
      </span>
    );
  }

  // Full mode - badge with metadata
  return (
    <div className="flex items-center gap-2 text-[10px] text-slate-400">
      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
        v{ordinal}
      </span>
      <span className="text-slate-500">•</span>
      <span>
        Modified {relativeTime} via {actorLabel}
      </span>
      <button
        disabled
        title="Version history coming soon"
        className="text-slate-600 hover:text-slate-400 cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-sm">history</span>
      </button>
    </div>
  );
}

export default VersionIndicator;
