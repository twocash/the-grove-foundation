'use client';

import React from 'react';
import { X } from 'lucide-react';
import type {
  Journey,
  JourneyWaypoint,
  WaypointAction,
  JourneyDisplayConfig
} from '@core/schema/journey';
import {
  JourneyProvenance,
  createJourneyProvenance
} from '@core/schema/journey-provenance';

// =============================================================================
// DEX Default Configurations
// These are the fallback values when schema doesn't specify
// =============================================================================

const DEFAULT_DISPLAY: Required<JourneyDisplayConfig> = {
  showProgressBar: true,
  showExitButton: true,
  showWaypointCount: true,
  progressBarColor: 'emerald',
  labels: {
    sectionTitle: 'Journey',
    exitButton: 'Exit',
  },
};

const DEFAULT_ACTIONS: WaypointAction[] = [
  { type: 'explore', label: 'Explore This', variant: 'primary' },
  { type: 'advance', label: 'Next →', variant: 'secondary' },
];

const FINAL_WAYPOINT_ACTIONS: WaypointAction[] = [
  { type: 'explore', label: 'Explore This', variant: 'primary' },
  { type: 'complete', label: 'Complete Journey', variant: 'primary' },
];

// =============================================================================
// Style Mappings (variant → Tailwind classes)
// =============================================================================

const ACTION_STYLES: Record<string, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 text-white font-medium',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
  subtle: 'bg-transparent hover:bg-slate-800 text-slate-400 border border-slate-700',
};

const PROGRESS_COLORS: Record<string, string> = {
  emerald: 'bg-emerald-500',
  cyan: 'bg-cyan-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};

// =============================================================================
// Component Props
// =============================================================================

export interface JourneyContentProps {
  /** The active journey */
  journey: Journey;
  /** Current waypoint being displayed */
  currentWaypoint: JourneyWaypoint;
  /** Zero-based index of current waypoint */
  journeyProgress: number;
  /** Total number of waypoints */
  journeyTotal: number;
  /** Callback when user clicks an action button */
  onAction: (action: WaypointAction, provenance: JourneyProvenance) => void;
  /** Callback when user exits the journey */
  onExit: () => void;
}

// =============================================================================
// JourneyContent Component
// DEX Interpreter: Reads schema configuration, renders UI
// =============================================================================

export function JourneyContent({
  journey,
  currentWaypoint,
  journeyProgress,
  journeyTotal,
  onAction,
  onExit,
}: JourneyContentProps) {
  // Merge schema display config with defaults
  const display = {
    ...DEFAULT_DISPLAY,
    ...journey.display,
    labels: {
      ...DEFAULT_DISPLAY.labels,
      ...journey.display?.labels,
    },
  };

  // Determine if this is the final waypoint
  const isLastWaypoint = journeyProgress >= journeyTotal - 1;

  // Get actions: schema-defined or defaults
  const actions: WaypointAction[] = currentWaypoint.actions
    ?? (isLastWaypoint ? FINAL_WAYPOINT_ACTIONS : DEFAULT_ACTIONS);

  // Calculate progress percentage
  const progressPercent = journeyTotal > 0
    ? ((journeyProgress + 1) / journeyTotal) * 100
    : 0;

  // Build provenance for an action
  const buildProvenance = (action: WaypointAction): JourneyProvenance => {
    return createJourneyProvenance(
      journey,
      currentWaypoint,
      journeyProgress,
      action
    );
  };

  // Handle action button click
  const handleActionClick = (action: WaypointAction) => {
    const provenance = buildProvenance(action);
    console.log('[JourneyContent] Action clicked:', action.type, provenance);
    onAction(action, provenance);
  };

  return (
    <div className="mb-6 rounded-lg border border-emerald-700/40 bg-emerald-900/20 p-4">
      {/* Header: Section title and exit button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
            {display.labels.sectionTitle}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-sm text-slate-300 font-medium">
            {journey.title}
          </span>
        </div>

        {display.showExitButton && (
          <button
            onClick={onExit}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            aria-label={display.labels.exitButton}
          >
            <X className="w-3 h-3" />
            <span>{display.labels.exitButton}</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      {display.showProgressBar && (
        <div className="mb-4">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${PROGRESS_COLORS[display.progressBarColor]} transition-all duration-500 ease-out`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {display.showWaypointCount && (
            <div className="mt-1 text-xs text-slate-500 text-right">
              {journeyProgress + 1} of {journeyTotal}
            </div>
          )}
        </div>
      )}

      {/* Waypoint content */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-2">
          {currentWaypoint.title}
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {currentWaypoint.prompt}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => (
          <button
            key={`${action.type}-${index}`}
            onClick={() => handleActionClick(action)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              ACTION_STYLES[action.variant || 'secondary']
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default JourneyContent;
