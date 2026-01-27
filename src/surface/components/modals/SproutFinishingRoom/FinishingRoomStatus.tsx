// src/surface/components/modals/SproutFinishingRoom/FinishingRoomStatus.tsx
// Sprint: S1-SFR-Shell - US-A004 Status bar displays metadata

import React, { useMemo } from 'react';
import type { Sprout } from '@core/schema/sprout';

export interface FinishingRoomStatusProps {
  sprout: Sprout;
}

/**
 * Format a timestamp as relative time (e.g., "5m ago", "2h ago", "3d ago")
 */
function formatRelativeTime(isoTimestamp: string): string {
  const now = Date.now();
  const timestamp = new Date(isoTimestamp).getTime();
  const diffMs = now - timestamp;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * FinishingRoomStatus - Status bar footer
 *
 * Layout:
 * SPROUT.FINISHING.v1 | Status: READY | Created: 2m ago | [Pulse indicator]
 */
export const FinishingRoomStatus: React.FC<FinishingRoomStatusProps> = ({
  sprout
}) => {
  // US-A004: Display status in uppercase
  const displayStatus = (sprout.stage || sprout.status || 'tender').toUpperCase();

  // US-A004: Relative timestamp
  const relativeTime = useMemo(
    () => formatRelativeTime(sprout.capturedAt),
    [sprout.capturedAt]
  );

  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-[var(--glass-border)] text-xs font-mono" style={{ backgroundColor: 'var(--glass-elevated, transparent)' }}>
      {/* Left: Version tag */}
      <span className="text-[var(--glass-text-muted)]">
        SPROUT.FINISHING.v1
      </span>

      {/* Center: Status and timestamp */}
      <div className="flex items-center gap-4 text-[var(--glass-text-muted)]">
        <span>
          Status: <span className="text-[var(--glass-text-primary)] font-medium">{displayStatus}</span>
        </span>
        <span>
          Created: <span className="text-[var(--glass-text-primary)] font-medium">{relativeTime}</span>
        </span>
      </div>

      {/* Right: Health indicator (semantic success pulse) */}
      <div
        className="relative w-3 h-3"
        aria-label="System healthy"
        role="status"
      >
        {/* Pulse ring animation */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: 'var(--semantic-success)' }} />
        {/* Solid dot */}
        <span className="absolute inset-0 rounded-full" style={{ backgroundColor: 'var(--semantic-success)' }} />
      </div>
    </footer>
  );
};

export default FinishingRoomStatus;
