// components/Terminal/JourneyProgressIndicator.tsx
// Subtle journey progress display
// Sprint: adaptive-engagement-v1

import React from 'react';
import type { Journey } from '../../src/core/schema/journey';

interface JourneyProgressIndicatorProps {
  journey: Journey;
  currentWaypointIndex: number;
  onWaypointClick?: (index: number) => void;
}

export const JourneyProgressIndicator: React.FC<JourneyProgressIndicatorProps> = ({
  journey,
  currentWaypointIndex,
  onWaypointClick,
}) => {
  const progress = ((currentWaypointIndex) / journey.waypoints.length) * 100;

  return (
    <div className="journey-progress-indicator">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--glass-text-subtle)]">
          {journey.title}
        </span>
        <span className="text-xs text-[var(--glass-text-subtle)]">
          {currentWaypointIndex}/{journey.waypoints.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--glass-bg-secondary)] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-[var(--neon-cyan)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Waypoint dots */}
      <div className="flex items-center gap-2">
        {journey.waypoints.map((waypoint, index) => (
          <button
            key={waypoint.id}
            onClick={() => onWaypointClick?.(index)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${index < currentWaypointIndex
                ? 'bg-[var(--neon-cyan)]'
                : index === currentWaypointIndex
                  ? 'bg-[var(--neon-cyan)] ring-2 ring-[var(--neon-cyan)] ring-opacity-50'
                  : 'bg-[var(--glass-bg-secondary)]'
              }
            `}
            title={waypoint.title}
          />
        ))}
      </div>

      {/* Current waypoint label */}
      {currentWaypointIndex < journey.waypoints.length && (
        <div className="mt-2 text-xs text-[var(--glass-text-body)]">
          <span className="text-[var(--neon-cyan)]">→</span>{' '}
          {journey.waypoints[currentWaypointIndex].title}
        </div>
      )}
    </div>
  );
};
