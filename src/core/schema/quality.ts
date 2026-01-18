// src/core/schema/quality.ts
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
// AI-curated quality score types and utilities

import { z } from 'zod';

// =============================================================================
// Quality Dimensions (4 dimensions, 0-100 each)
// =============================================================================

/**
 * The four quality dimensions assessed by AI curation
 */
export interface QualityDimensions {
  /** Factual correctness and precision of information (0-100) */
  accuracy: number;

  /** Practical usefulness and applicability (0-100) */
  utility: number;

  /** Originality and unique contribution (0-100) */
  novelty: number;

  /** Source attribution and verification quality (0-100) */
  provenance: number;
}

export const QualityDimensionsSchema = z.object({
  accuracy: z.number().min(0).max(100),
  utility: z.number().min(0).max(100),
  novelty: z.number().min(0).max(100),
  provenance: z.number().min(0).max(100),
});

/**
 * Dimension display metadata
 */
export interface DimensionConfig {
  key: keyof QualityDimensions;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const DIMENSION_CONFIGS: Record<keyof QualityDimensions, DimensionConfig> = {
  accuracy: {
    key: 'accuracy',
    label: 'Accuracy',
    description: 'Factual correctness and precision',
    icon: 'verified',
    color: 'var(--neon-cyan)',
  },
  utility: {
    key: 'utility',
    label: 'Utility',
    description: 'Practical usefulness and applicability',
    icon: 'handyman',
    color: 'var(--neon-green)',
  },
  novelty: {
    key: 'novelty',
    label: 'Novelty',
    description: 'Originality and unique contribution',
    icon: 'lightbulb',
    color: 'var(--neon-violet)',
  },
  provenance: {
    key: 'provenance',
    label: 'Provenance',
    description: 'Source attribution and verification',
    icon: 'history_edu',
    color: 'var(--neon-amber)',
  },
};

// =============================================================================
// Quality Grade (4 grades based on overall score)
// =============================================================================

/**
 * Quality grade labels based on overall score
 */
export type QualityGrade = 'excellent' | 'good' | 'fair' | 'needs-improvement';

export const QUALITY_GRADES: readonly QualityGrade[] = [
  'excellent',
  'good',
  'fair',
  'needs-improvement',
] as const;

/**
 * Quality grade configuration
 */
export interface QualityGradeConfig {
  grade: QualityGrade;
  minScore: number;
  maxScore: number;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const QUALITY_GRADE_CONFIGS: Record<QualityGrade, QualityGradeConfig> = {
  excellent: {
    grade: 'excellent',
    minScore: 90,
    maxScore: 100,
    label: 'Excellent',
    color: 'var(--neon-green)',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    icon: 'stars',
  },
  good: {
    grade: 'good',
    minScore: 70,
    maxScore: 89,
    label: 'Good',
    color: 'var(--neon-amber)',
    bgColor: 'rgba(255, 191, 0, 0.1)',
    icon: 'thumb_up',
  },
  fair: {
    grade: 'fair',
    minScore: 50,
    maxScore: 69,
    label: 'Fair',
    color: '#f97316', // orange-500
    bgColor: 'rgba(249, 115, 22, 0.1)',
    icon: 'balance',
  },
  'needs-improvement': {
    grade: 'needs-improvement',
    minScore: 0,
    maxScore: 49,
    label: 'Needs Improvement',
    color: '#ef4444', // red-500
    bgColor: 'rgba(239, 68, 68, 0.1)',
    icon: 'construction',
  },
};

/**
 * Get the quality grade for a given score
 */
export function getQualityGrade(score: number): QualityGrade {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'needs-improvement';
}

/**
 * Get the grade config for a given score
 */
export function getQualityGradeConfig(score: number): QualityGradeConfig {
  return QUALITY_GRADE_CONFIGS[getQualityGrade(score)];
}

// =============================================================================
// Quality Thresholds (configurable grade boundaries)
// =============================================================================

/**
 * Configurable thresholds for quality grades
 */
export interface QualityThresholds {
  /** Minimum score for 'excellent' grade (default: 90) */
  excellent: number;

  /** Minimum score for 'good' grade (default: 70) */
  good: number;

  /** Minimum score for 'fair' grade (default: 50) */
  fair: number;

  // Below 'fair' threshold = 'needs-improvement'
}

export const QualityThresholdsSchema = z.object({
  excellent: z.number().min(0).max(100).default(90),
  good: z.number().min(0).max(100).default(70),
  fair: z.number().min(0).max(100).default(50),
});

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  excellent: 90,
  good: 70,
  fair: 50,
};

/**
 * Get quality grade using custom thresholds
 */
export function getQualityGradeWithThresholds(
  score: number,
  thresholds: QualityThresholds = DEFAULT_QUALITY_THRESHOLDS
): QualityGrade {
  if (score >= thresholds.excellent) return 'excellent';
  if (score >= thresholds.good) return 'good';
  if (score >= thresholds.fair) return 'fair';
  return 'needs-improvement';
}

// =============================================================================
// Quality Score (complete assessment)
// =============================================================================

/**
 * Status of quality assessment for a sprout
 */
export type QualityStatus = 'scored' | 'pending' | 'error' | 'not-assessed';

export const QualityStatusSchema = z.enum(['scored', 'pending', 'error', 'not-assessed']);

/**
 * Complete quality score object from AI curation
 */
export interface QualityScore {
  /** Composite overall score (0-100) - weighted average of dimensions */
  overall: number;

  /** Individual dimension scores */
  dimensions: QualityDimensions;

  /** ISO timestamp when assessment was performed */
  assessedAt: string;

  /** Model/service that performed the assessment */
  assessedBy: string;

  /** Assessment confidence level (0-1) */
  confidence: number;

  /** Percentile ranking compared to Grove network (0-100) */
  networkPercentile?: number;

  /** Optional assessment notes/reasoning */
  assessmentNotes?: string;
}

export const QualityScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  dimensions: QualityDimensionsSchema,
  assessedAt: z.string().datetime(),
  assessedBy: z.string().min(1),
  confidence: z.number().min(0).max(1),
  networkPercentile: z.number().min(0).max(100).optional(),
  assessmentNotes: z.string().optional(),
});

// =============================================================================
// Sprout Quality Integration
// =============================================================================

/**
 * Quality metadata to be added to Sprout objects
 */
export interface SproutQualityMeta {
  /** Full quality score if assessed */
  qualityScore?: QualityScore;

  /** Current status of quality assessment */
  qualityStatus: QualityStatus;

  /** ISO timestamp when quality was last updated */
  qualityUpdatedAt?: string;

  /** Error message if assessment failed */
  qualityError?: string;
}

export const SproutQualityMetaSchema = z.object({
  qualityScore: QualityScoreSchema.optional(),
  qualityStatus: QualityStatusSchema,
  qualityUpdatedAt: z.string().datetime().optional(),
  qualityError: z.string().optional(),
});

// =============================================================================
// Filter Types
// =============================================================================

/**
 * Quality filter configuration for NurseryConsole
 */
export interface QualityFilterState {
  /** Minimum overall quality score (0-100, null = no filter) */
  minQuality?: number;

  /** Minimum accuracy score (0-100, null = no filter) */
  minAccuracy?: number;

  /** Minimum utility score (0-100, null = no filter) */
  minUtility?: number;

  /** Minimum novelty score (0-100, null = no filter) */
  minNovelty?: number;

  /** Minimum provenance score (0-100, null = no filter) */
  minProvenance?: number;

  /** Include sprouts without quality scores */
  includeUnscored?: boolean;
}

export const QualityFilterStateSchema = z.object({
  minQuality: z.number().min(0).max(100).optional(),
  minAccuracy: z.number().min(0).max(100).optional(),
  minUtility: z.number().min(0).max(100).optional(),
  minNovelty: z.number().min(0).max(100).optional(),
  minProvenance: z.number().min(0).max(100).optional(),
  includeUnscored: z.boolean().optional(),
});

/**
 * Preset filter configurations
 */
export type QualityFilterPreset = 'all' | 'top-performers' | 'ready-for-review' | 'needs-attention';

export const QUALITY_FILTER_PRESETS: Record<QualityFilterPreset, { label: string; filter: QualityFilterState }> = {
  all: {
    label: 'All Sprouts',
    filter: { includeUnscored: true },
  },
  'top-performers': {
    label: 'Top Performers',
    filter: { minQuality: 90, includeUnscored: false },
  },
  'ready-for-review': {
    label: 'Ready for Review',
    filter: { minQuality: 70, includeUnscored: false },
  },
  'needs-attention': {
    label: 'Needs Attention',
    filter: { minQuality: 0, includeUnscored: false },
  },
};

// =============================================================================
// Federated Learning Configuration
// =============================================================================

/**
 * Consent levels for federated learning
 */
export type FederatedConsentLevel = 'full' | 'anonymized' | 'none';

/**
 * Federated learning settings
 */
export interface FederatedLearningConfig {
  /** Whether federated learning is enabled */
  enabled: boolean;

  /** Data sharing consent level */
  consentLevel: FederatedConsentLevel;

  /** ISO timestamp when consent was given */
  consentedAt?: string;
}

export const FederatedLearningConfigSchema = z.object({
  enabled: z.boolean().default(false),
  consentLevel: z.enum(['full', 'anonymized', 'none']).default('none'),
  consentedAt: z.string().datetime().optional(),
});

export const DEFAULT_FEDERATED_CONFIG: FederatedLearningConfig = {
  enabled: false,
  consentLevel: 'none',
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Calculate overall score from dimensions (weighted average)
 */
export function calculateOverallScore(dimensions: QualityDimensions): number {
  // Default weights: equal weighting
  const weights = { accuracy: 0.25, utility: 0.25, novelty: 0.25, provenance: 0.25 };

  const weighted =
    dimensions.accuracy * weights.accuracy +
    dimensions.utility * weights.utility +
    dimensions.novelty * weights.novelty +
    dimensions.provenance * weights.provenance;

  return Math.round(weighted * 10) / 10; // Round to 1 decimal
}

/**
 * Check if a sprout passes a quality filter
 */
export function passesQualityFilter(
  qualityMeta: SproutQualityMeta | undefined,
  filter: QualityFilterState
): boolean {
  // If no quality meta, only pass if includeUnscored is true
  if (!qualityMeta || qualityMeta.qualityStatus !== 'scored') {
    return filter.includeUnscored ?? true;
  }

  const score = qualityMeta.qualityScore;
  if (!score) return filter.includeUnscored ?? true;

  // Check overall quality
  if (filter.minQuality !== undefined && score.overall < filter.minQuality) {
    return false;
  }

  // Check individual dimensions
  if (filter.minAccuracy !== undefined && score.dimensions.accuracy < filter.minAccuracy) {
    return false;
  }
  if (filter.minUtility !== undefined && score.dimensions.utility < filter.minUtility) {
    return false;
  }
  if (filter.minNovelty !== undefined && score.dimensions.novelty < filter.minNovelty) {
    return false;
  }
  if (filter.minProvenance !== undefined && score.dimensions.provenance < filter.minProvenance) {
    return false;
  }

  return true;
}

/**
 * Parse quality filter from URL search params
 */
export function parseQualityFilterFromURL(params: URLSearchParams): QualityFilterState {
  const filter: QualityFilterState = {};

  const quality = params.get('quality');
  if (quality) filter.minQuality = parseInt(quality, 10);

  const accuracy = params.get('accuracy');
  if (accuracy) filter.minAccuracy = parseInt(accuracy, 10);

  const utility = params.get('utility');
  if (utility) filter.minUtility = parseInt(utility, 10);

  const novelty = params.get('novelty');
  if (novelty) filter.minNovelty = parseInt(novelty, 10);

  const provenance = params.get('provenance');
  if (provenance) filter.minProvenance = parseInt(provenance, 10);

  const unscored = params.get('unscored');
  if (unscored) filter.includeUnscored = unscored === 'true';

  return filter;
}

/**
 * Serialize quality filter to URL search params
 */
export function serializeQualityFilterToURL(filter: QualityFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filter.minQuality !== undefined) params.set('quality', filter.minQuality.toString());
  if (filter.minAccuracy !== undefined) params.set('accuracy', filter.minAccuracy.toString());
  if (filter.minUtility !== undefined) params.set('utility', filter.minUtility.toString());
  if (filter.minNovelty !== undefined) params.set('novelty', filter.minNovelty.toString());
  if (filter.minProvenance !== undefined) params.set('provenance', filter.minProvenance.toString());
  if (filter.includeUnscored !== undefined) params.set('unscored', filter.includeUnscored.toString());

  return params;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isQualityScore(obj: unknown): obj is QualityScore {
  return QualityScoreSchema.safeParse(obj).success;
}

export function isQualityDimensions(obj: unknown): obj is QualityDimensions {
  return QualityDimensionsSchema.safeParse(obj).success;
}

export function isSproutQualityMeta(obj: unknown): obj is SproutQualityMeta {
  return SproutQualityMetaSchema.safeParse(obj).success;
}

export function isQualityFilterState(obj: unknown): obj is QualityFilterState {
  return QualityFilterStateSchema.safeParse(obj).success;
}
