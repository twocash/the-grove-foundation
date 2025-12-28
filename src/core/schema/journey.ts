// src/core/schema/journey.ts
// Journey type definitions for guided exploration
// Sprint: adaptive-engagement-v1

// =============================================================================
// DEX Display Configuration
// Satisfies Trellis Pillar I: Declarative Sovereignty
// =============================================================================

/**
 * Schema-driven display configuration for journeys.
 * Non-technical users can customize UI by editing JSON.
 */
export interface JourneyDisplayConfig {
  /** Show progress bar. Default: true */
  showProgressBar?: boolean;
  /** Show exit button in header. Default: true */
  showExitButton?: boolean;
  /** Show waypoint count (e.g., "2 of 5"). Default: true */
  showWaypointCount?: boolean;
  /** Progress bar color. Default: 'emerald' */
  progressBarColor?: 'emerald' | 'cyan' | 'amber' | 'blue' | 'purple';
  /** Custom labels */
  labels?: {
    /** Header section title. Default: 'Journey' */
    sectionTitle?: string;
    /** Exit button text. Default: 'Exit' */
    exitButton?: string;
  };
}

/**
 * Schema-driven action definition for waypoints.
 * Actions are declarative - the interpreter component renders them.
 */
export interface WaypointAction {
  /** Action type determines handler behavior */
  type: 'explore' | 'advance' | 'complete' | 'branch' | 'custom';
  /** Button label text */
  label: string;
  /** Visual style variant. Default: 'secondary' */
  variant?: 'primary' | 'secondary' | 'subtle';
  /** For 'branch' type: target waypoint ID */
  targetWaypoint?: string;
  /** For 'custom' type: command to send */
  command?: string;
}

/**
 * JourneyWaypoint - A step in a guided journey
 */
export interface JourneyWaypoint {
  id: string;
  title: string;
  prompt: string;
  hub?: string;

  successCriteria?: {
    minExchanges?: number;
    topicsMentioned?: string[];
  };

  // Patterns that trigger implicit entry at this waypoint
  entryPatterns?: string[];

  /** Custom actions for this waypoint. If undefined, defaults apply. */
  actions?: WaypointAction[];
}

/**
 * Journey - A structured exploration path
 */
export interface Journey {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;

  lensAffinity?: string[];
  lensExclude?: string[];

  waypoints: JourneyWaypoint[];

  completionMessage: string;
  nextJourneys?: string[];

  allowImplicitEntry?: boolean;
  ambientTracking?: boolean;

  /** Display configuration. If undefined, defaults apply. */
  display?: JourneyDisplayConfig;
}
