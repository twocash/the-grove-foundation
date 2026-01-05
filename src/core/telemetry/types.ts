// src/core/telemetry/types.ts
// Prompt Telemetry Types
// Sprint: 4d-prompt-refactor-telemetry-v1

import type { Stage } from '@core/context-fields/types';

// =============================================================================
// EVENT TYPES (Declarative const array for DEX compliance)
// =============================================================================

export const PROMPT_TELEMETRY_EVENT_TYPES = [
  'impression',
  'selection',
  'completion',
  'feedback',
  'skip'
] as const;

export type PromptTelemetryEventType = typeof PROMPT_TELEMETRY_EVENT_TYPES[number];

// =============================================================================
// CONTEXT SNAPSHOT
// =============================================================================

/**
 * Context snapshot at time of event
 * Mirrors ContextState but flattened for storage
 */
export interface TelemetryContext {
  stage: Stage;
  lensId: string | null;
  entropy: number;
  interactionCount: number;
  activeTopics: string[];
  activeMoments: string[];
}

// =============================================================================
// SCORING DETAILS
// =============================================================================

/**
 * Scoring details explaining why prompt was surfaced
 * Aligns with ScoredPrompt.matchDetails from context-fields
 */
export interface TelemetryScoringDetails {
  finalScore: number;
  rank: number;
  matchDetails: {
    stageMatch: boolean;
    lensWeight: number;
    topicWeight: number;
    momentBoost: number;
    baseWeight?: number;
  };
}

// =============================================================================
// OUTCOME METRICS
// =============================================================================

/**
 * Outcome metrics (populated async after completion)
 */
export interface TelemetryOutcome {
  dwellTimeMs: number;
  entropyDelta: number;
  followUpPromptId?: string;
}

// =============================================================================
// TELEMETRY EVENT
// =============================================================================

/**
 * Full telemetry event for transmission
 */
export interface PromptTelemetryEvent {
  eventType: PromptTelemetryEventType;
  promptId: string;
  sessionId: string;
  timestamp: number;
  context: TelemetryContext;
  scoring?: TelemetryScoringDetails;
  outcome?: TelemetryOutcome;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Aggregated stats returned from API
 */
export interface PromptTelemetryStats {
  promptId: string;
  impressions: number;
  selections: number;
  completions: number;
  selectionRate: number;
  avgEntropyDelta: number | null;
  avgDwellTimeMs: number | null;
  lastSurfaced: string | null;
}

/**
 * Response from single event submission
 */
export interface TelemetrySubmitResponse {
  id: string;
  status: string;
}

/**
 * Response from batch submission
 */
export interface TelemetryBatchResponse {
  count: number;
  status: string;
}

/**
 * Response from performance list
 */
export interface TelemetryPerformanceResponse {
  prompts: PromptTelemetryStats[];
  total: number;
}
