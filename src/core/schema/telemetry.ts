// src/core/schema/telemetry.ts
// Sprint: dex-telemetry-compliance-v1
// DEX Pillar: Provenance as Infrastructure

/**
 * Base attribution for all telemetry metrics.
 * Every metric tracks when and in which Field it occurred.
 */
export interface MetricAttribution {
  fieldId: string;
  timestamp: number;
}

/**
 * Journey completion with full provenance.
 * Tracks which journey was completed, when, and optional duration.
 */
export interface JourneyCompletion extends MetricAttribution {
  journeyId: string;
  durationMs?: number;
  waypointsVisited?: number;
}

/**
 * Topic exploration with hub context.
 * Tracks which topic was explored via which hub.
 */
export interface TopicExploration extends MetricAttribution {
  topicId: string;
  hubId: string;
  queryTrigger?: string;
}

/**
 * Sprout capture with journey context.
 * Tracks which sprout was captured and its originating context.
 */
export interface SproutCapture extends MetricAttribution {
  sproutId: string;
  journeyId?: string;
  hubId?: string;
}

/**
 * V2 cumulative metrics with full provenance chain.
 * Replaces raw counters with attribution arrays.
 */
export interface CumulativeMetricsV2 {
  version: 2;
  fieldId: string;
  journeyCompletions: JourneyCompletion[];
  topicExplorations: TopicExploration[];
  sproutCaptures: SproutCapture[];
  sessionCount: number;
  lastSessionAt: number;
}

/**
 * Computed metrics derived from provenance arrays.
 * These are the values moment conditions evaluate against.
 */
export interface ComputedMetrics {
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
}

/**
 * Compute derived metrics from provenance data.
 * Deduplicates topics by topicId.
 */
export function computeMetrics(metrics: CumulativeMetricsV2): ComputedMetrics {
  return {
    journeysCompleted: metrics.journeyCompletions.length,
    sproutsCaptured: metrics.sproutCaptures.length,
    topicsExplored: [...new Set(metrics.topicExplorations.map(t => t.topicId))],
  };
}
