// src/core/schema/journey.ts
// Journey type definitions for guided exploration
// Sprint: adaptive-engagement-v1

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
}
