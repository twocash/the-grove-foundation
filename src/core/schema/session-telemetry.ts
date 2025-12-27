// src/core/schema/session-telemetry.ts
// Session engagement telemetry for adaptive content
// Sprint: adaptive-engagement-v1

/**
 * SessionStage - Computed engagement level
 */
export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

/**
 * SessionTelemetry - Engagement signals for adaptive content
 */
export interface SessionTelemetry {
  // Identity
  sessionId: string;

  // Visit patterns
  visitCount: number;
  currentVisitStart: string;  // ISO timestamp
  lastVisit: string | null;

  // Engagement depth
  exchangeCount: number;       // This session
  totalExchangeCount: number;  // All time
  topicsExplored: string[];    // Hub IDs this session
  allTopicsExplored: string[]; // All time

  // Contribution
  sproutsCaptured: number;

  // Journey
  activeJourney: {
    journeyId: string;
    currentWaypoint: number;
    startedAt: string;
    explicit: boolean;
  } | null;
  completedJourneys: string[];

  // Computed
  stage: SessionStage;
}

/**
 * StageThresholds - Configurable progression thresholds
 */
export interface StageThresholds {
  oriented: {
    minExchanges?: number;  // Default: 3
    minVisits?: number;     // Default: 2
  };
  exploring: {
    minExchanges?: number;  // Default: 5
    minTopics?: number;     // Default: 2
  };
  engaged: {
    minSprouts?: number;        // Default: 1
    minVisits?: number;         // Default: 3
    minTotalExchanges?: number; // Default: 15
  };
}

export const DEFAULT_THRESHOLDS: StageThresholds = {
  oriented: { minExchanges: 3, minVisits: 2 },
  exploring: { minExchanges: 5, minTopics: 2 },
  engaged: { minSprouts: 1, minVisits: 3, minTotalExchanges: 15 },
};
