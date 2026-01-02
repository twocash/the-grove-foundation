// src/core/context-fields/telemetry.ts
// Session telemetry schema for prompt generation
// Sprint: genesis-context-fields-v1 (Epic 5)

import type { Stage } from './types';

/**
 * Session telemetry snapshot for prompt generation
 */
export interface SessionTelemetry {
  // Session identity
  sessionId: string;
  capturedAt: number;

  // Stage progression
  currentStage: Stage;
  stageTransitions: StageTransition[];

  // Topic exploration
  topicsExplored: string[];
  topicFrequency: Record<string, number>;
  lastTopicId: string | null;

  // Entropy history
  entropyHistory: EntropyPoint[];
  averageEntropy: number;
  peakEntropy: number;

  // Interaction patterns
  exchangeCount: number;
  averageResponseLength: number;
  queryPatterns: QueryPattern[];

  // Gaps (unexplored areas)
  unexploredTopics: string[];
  suggestedNextTopics: string[];
}

/**
 * Stage transition record
 */
export interface StageTransition {
  from: Stage;
  to: Stage;
  timestamp: number;
  triggerEvent: string;
}

/**
 * Entropy measurement point
 */
export interface EntropyPoint {
  timestamp: number;
  value: number;
  afterExchange: number;
}

/**
 * Query pattern for analysis
 */
export interface QueryPattern {
  type: 'question' | 'command' | 'exploration' | 'follow-up';
  frequency: number;
}

/**
 * Capture current telemetry from engagement state
 */
export function captureSessionTelemetry(
  sessionId: string,
  stage: Stage,
  topicsExplored: string[],
  entropy: number,
  exchangeCount: number
): SessionTelemetry {
  // Known topic clusters for gap detection
  const ALL_TOPICS = [
    'ratchet-effect',
    'infrastructure-bet',
    'distributed-systems',
    'governance',
    'technical-arch',
    'cognitive-split',
    'observer-dynamic',
    'meta-philosophy',
  ];

  const unexploredTopics = ALL_TOPICS.filter(t => !topicsExplored.includes(t));

  // Suggest next topics based on what's unexplored
  const suggestedNextTopics = unexploredTopics.slice(0, 3);

  return {
    sessionId,
    capturedAt: Date.now(),
    currentStage: stage,
    stageTransitions: [], // TODO: Track transitions
    topicsExplored,
    topicFrequency: topicsExplored.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    lastTopicId: topicsExplored[topicsExplored.length - 1] || null,
    entropyHistory: [{ timestamp: Date.now(), value: entropy, afterExchange: exchangeCount }],
    averageEntropy: entropy,
    peakEntropy: entropy,
    exchangeCount,
    averageResponseLength: 0, // TODO: Track response lengths
    queryPatterns: [],
    unexploredTopics,
    suggestedNextTopics,
  };
}
