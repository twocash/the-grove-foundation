// src/core/quality/schema.ts
// Quality scoring data types and interfaces
// Sprint: S10-SL-AICuration v1

import type { GroveObject } from '@core/schema/grove-object';

/**
 * Quality Dimension Types
 * The four canonical quality dimensions for knowledge assessment
 */

export type QualityDimension = 'accuracy' | 'utility' | 'novelty' | 'provenance';

/**
 * Quality Score Range (0.0 to 1.0)
 */
export type QualityValue = number;

/**
 * Multi-dimensional quality scores
 */
export interface QualityDimensions {
  /** Factual correctness, verification status */
  accuracy: QualityValue;
  /** Practical value, relevance, actionability */
  utility: QualityValue;
  /** Originality, unique insights, perspective diversity */
  novelty: QualityValue;
  /** Attribution completeness, source credibility, chain depth */
  provenance: QualityValue;
}

/**
 * Quality Score Assessment
 * Complete quality assessment for a target object
 */
export interface QualityScore {
  id: string;

  /** Target being scored */
  targetId: string;
  targetType: string;  // 'sprout', 'research-sprout', 'document', etc.

  /** Multi-dimensional scores */
  dimensions: QualityDimensions;

  /** Weighted composite score */
  compositeScore: QualityValue;

  /** Scoring metadata */
  scoringModel: string;
  confidence: QualityValue;

  /** Federation metadata */
  federationId?: string;
  sourceGrove?: string;

  /** Reasoning/explanation for each dimension */
  reasoning?: Partial<Record<QualityDimension, string>>;

  /** Timestamps */
  scoredAt: string;
  updatedAt: string;
}

/**
 * Quality Score Override
 * Manual override for quality scores
 */
export interface QualityOverride {
  id: string;
  scoreId: string;

  /** Override values (null = no override) */
  overrideAccuracy?: QualityValue | null;
  overrideUtility?: QualityValue | null;
  overrideNovelty?: QualityValue | null;
  overrideProvenance?: QualityValue | null;
  overrideComposite?: QualityValue | null;

  /** Override metadata */
  reason: string;
  overriddenBy?: string;

  /** Timestamp */
  createdAt: string;
}

/**
 * Effective Quality Score
 * Quality score with overrides applied
 */
export interface EffectiveQualityScore extends QualityDimensions {
  compositeScore: QualityValue;
  isOverridden: boolean;
}

/**
 * Quality Threshold Configuration Payload (GroveObject pattern)
 */
export interface QualityThresholdPayload {
  /** Dimension-specific thresholds */
  thresholds: {
    accuracy: {
      minimum: QualityValue;
      target: QualityValue;
    };
    utility: {
      minimum: QualityValue;
      target: QualityValue;
    };
    novelty: {
      minimum: QualityValue;
      target: QualityValue;
    };
    provenance: {
      minimum: QualityValue;
      target: QualityValue;
    };
  };

  /** Composite score thresholds */
  composite: {
    minimum: QualityValue;
    target: QualityValue;
    excellent: QualityValue;
  };

  /** Dimension weights for composite calculation */
  weights: Record<QualityDimension, number>;

  /** Auto-filtering enabled */
  autoFilterEnabled: boolean;

  /** Apply to which target types */
  targetTypes: string[];

  /** Is this the active configuration */
  isActive: boolean;
}

/**
 * Quality Threshold GroveObject
 */
export type QualityThreshold = GroveObject<QualityThresholdPayload>;

/**
 * Federated Learning Participation
 */
export interface FederatedLearningParticipation {
  id: string;

  /** Grove identity */
  groveId: string;
  groveName: string;

  /** Participation settings */
  optIn: boolean;
  shareScores: boolean;
  shareModelUpdates: boolean;

  /** Statistics */
  scoresContributed: number;
  modelUpdatesReceived: number;
  lastSyncAt?: string;

  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

/**
 * Federated Learning Model Update
 */
export interface FederatedModelUpdate {
  id: string;

  /** Update metadata */
  version: string;
  fromGroveId: string;
  timestamp: string;

  /** Model parameters (aggregated weights) */
  parameters: {
    dimensionWeights: Record<QualityDimension, number>;
    scoringFactors: Record<string, number>;
  };

  /** Update statistics */
  samplesContributed: number;
  aggregationMethod: 'federated_averaging' | 'weighted_average';
}

/**
 * Quality Assessment Request
 */
export interface QualityAssessmentRequest {
  targetId: string;
  targetType: string;
  content: string;
  metadata?: Record<string, unknown>;
  forceRescore?: boolean;
}

/**
 * Quality Assessment Result
 */
export interface QualityAssessmentResult {
  score: QualityScore;
  meetsThreshold: boolean;
  belowMinimum: QualityDimension[];
  feedback?: string;
}

/**
 * Quality Filter Criteria
 */
export interface QualityFilterCriteria {
  minimumComposite?: QualityValue;
  minimumDimensions?: Partial<QualityDimensions>;
  targetTypes?: string[];
  includeOverridden?: boolean;
}

/**
 * Quality Analytics Summary
 */
export interface QualityAnalyticsSummary {
  period: {
    start: string;
    end: string;
  };

  /** Score distributions */
  distributions: {
    accuracy: { mean: number; stdDev: number; median: number };
    utility: { mean: number; stdDev: number; median: number };
    novelty: { mean: number; stdDev: number; median: number };
    provenance: { mean: number; stdDev: number; median: number };
    composite: { mean: number; stdDev: number; median: number };
  };

  /** Counts */
  totalScored: number;
  meetsThreshold: number;
  belowMinimum: number;
  overridden: number;

  /** By target type */
  byTargetType: Record<string, {
    count: number;
    avgComposite: number;
  }>;
}

/**
 * Quality Configuration
 */
export interface QualityConfig {
  scoring: {
    defaultModel: string;
    batchSize: number;
    timeout: number;
  };
  thresholds: {
    updateInterval: number;
    cacheDuration: number;
  };
  federation: {
    syncInterval: number;
    minParticipants: number;
    aggregationMethod: 'federated_averaging' | 'weighted_average';
  };
}

/**
 * Default Quality Configuration
 */
export const DEFAULT_QUALITY_CONFIG: QualityConfig = {
  scoring: {
    defaultModel: 'default-v1',
    batchSize: 10,
    timeout: 30000,  // 30 seconds
  },
  thresholds: {
    updateInterval: 3600000,  // 1 hour
    cacheDuration: 300000,    // 5 minutes
  },
  federation: {
    syncInterval: 86400000,   // 24 hours
    minParticipants: 3,
    aggregationMethod: 'federated_averaging',
  },
};

/**
 * Default Quality Thresholds
 */
export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholdPayload = {
  thresholds: {
    accuracy: { minimum: 0.4, target: 0.7 },
    utility: { minimum: 0.3, target: 0.6 },
    novelty: { minimum: 0.2, target: 0.5 },
    provenance: { minimum: 0.5, target: 0.8 },
  },
  composite: {
    minimum: 0.4,
    target: 0.6,
    excellent: 0.8,
  },
  weights: {
    accuracy: 0.3,
    utility: 0.3,
    novelty: 0.15,
    provenance: 0.25,
  },
  autoFilterEnabled: false,
  targetTypes: ['sprout', 'research-sprout'],
  isActive: true,
};

/**
 * Quality Event Types
 */
export enum QualityEventType {
  SCORE_CREATED = 'quality.score.created',
  SCORE_UPDATED = 'quality.score.updated',
  SCORE_OVERRIDDEN = 'quality.score.overridden',
  THRESHOLD_UPDATED = 'quality.threshold.updated',
  FILTER_APPLIED = 'quality.filter.applied',
  FEDERATION_SYNC = 'quality.federation.sync',
  MODEL_UPDATE = 'quality.model.update',
}

/**
 * Quality Event
 */
export interface QualityEvent {
  type: QualityEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Helper Functions
 */

export function isValidQualityValue(value: number): boolean {
  return value >= 0 && value <= 1;
}

export function calculateCompositeScore(
  dimensions: QualityDimensions,
  weights: Record<QualityDimension, number>
): QualityValue {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  if (totalWeight === 0) return 0;

  const weightedSum =
    dimensions.accuracy * (weights.accuracy || 0) +
    dimensions.utility * (weights.utility || 0) +
    dimensions.novelty * (weights.novelty || 0) +
    dimensions.provenance * (weights.provenance || 0);

  return Math.round((weightedSum / totalWeight) * 1000) / 1000;
}

export function meetsThreshold(
  score: QualityScore,
  thresholds: QualityThresholdPayload
): { meets: boolean; belowMinimum: QualityDimension[] } {
  const belowMinimum: QualityDimension[] = [];

  if (score.dimensions.accuracy < thresholds.thresholds.accuracy.minimum) {
    belowMinimum.push('accuracy');
  }
  if (score.dimensions.utility < thresholds.thresholds.utility.minimum) {
    belowMinimum.push('utility');
  }
  if (score.dimensions.novelty < thresholds.thresholds.novelty.minimum) {
    belowMinimum.push('novelty');
  }
  if (score.dimensions.provenance < thresholds.thresholds.provenance.minimum) {
    belowMinimum.push('provenance');
  }

  const meetsComposite = score.compositeScore >= thresholds.composite.minimum;

  return {
    meets: belowMinimum.length === 0 && meetsComposite,
    belowMinimum,
  };
}

export function getQualityGrade(compositeScore: QualityValue): string {
  if (compositeScore >= 0.9) return 'A+';
  if (compositeScore >= 0.8) return 'A';
  if (compositeScore >= 0.7) return 'B';
  if (compositeScore >= 0.6) return 'C';
  if (compositeScore >= 0.5) return 'D';
  return 'F';
}

export function getQualityColor(compositeScore: QualityValue): string {
  if (compositeScore >= 0.8) return 'green';
  if (compositeScore >= 0.6) return 'yellow';
  if (compositeScore >= 0.4) return 'orange';
  return 'red';
}
