// src/core/schema/quality-override.ts
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Schema for quality override data structures

import { QualityDimensions } from './quality';

/**
 * Override reason codes
 */
export type OverrideReasonCode =
  | 'incorrect_assessment'
  | 'missing_context'
  | 'model_error'
  | 'other';

/**
 * Reason code labels for display
 */
export const OVERRIDE_REASON_LABELS: Record<OverrideReasonCode, string> = {
  incorrect_assessment: 'Incorrect Assessment',
  missing_context: 'Missing Context',
  model_error: 'Model Error',
  other: 'Other',
};

/**
 * Reason code descriptions
 */
export const OVERRIDE_REASON_DESCRIPTIONS: Record<OverrideReasonCode, string> = {
  incorrect_assessment: 'The AI assessment was factually incorrect or missed key information',
  missing_context: 'The AI lacked context that would have changed the assessment',
  model_error: 'Technical error or obvious model malfunction',
  other: 'Other reason not covered above',
};

/**
 * Quality override record
 */
export interface QualityOverride {
  id: string;
  sproutId: string;
  operatorId: string;
  operatorEmail?: string;
  timestamp: string;

  // Score change
  scoreBefore: number;
  scoreAfter: number;
  dimensionsBefore: QualityDimensions;
  dimensionsAfter: Partial<QualityDimensions>;

  // Justification
  reasonCode: OverrideReasonCode;
  explanation: string;
  evidenceUrl?: string;

  // Rollback tracking
  rolledBack: boolean;
  rollbackTimestamp?: string;
  rollbackOperatorId?: string;
  rollbackOperatorEmail?: string;
}

/**
 * Override submission data
 */
export interface OverrideSubmission {
  sproutId: string;
  dimensions: Partial<QualityDimensions>;
  reasonCode: OverrideReasonCode;
  explanation: string;
  evidenceFile?: File;
}

/**
 * Override validation result
 */
export interface OverrideValidation {
  valid: boolean;
  errors: {
    field: keyof OverrideSubmission | 'explanation_length';
    message: string;
  }[];
}

/**
 * Minimum explanation length
 */
export const MIN_EXPLANATION_LENGTH = 20;

/**
 * Maximum file size for evidence (5MB)
 */
export const MAX_EVIDENCE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed evidence file types
 */
export const ALLOWED_EVIDENCE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

/**
 * Validate override submission
 */
export function validateOverride(submission: OverrideSubmission): OverrideValidation {
  const errors: OverrideValidation['errors'] = [];

  // Check reason code
  if (!submission.reasonCode) {
    errors.push({ field: 'reasonCode', message: 'Reason code is required' });
  }

  // Check explanation length
  if (!submission.explanation || submission.explanation.length < MIN_EXPLANATION_LENGTH) {
    errors.push({
      field: 'explanation_length',
      message: `Explanation must be at least ${MIN_EXPLANATION_LENGTH} characters`,
    });
  }

  // Check at least one dimension changed
  const hasChanges = Object.keys(submission.dimensions).length > 0;
  if (!hasChanges) {
    errors.push({ field: 'dimensions', message: 'At least one dimension score must be changed' });
  }

  // Validate dimension scores
  for (const [key, value] of Object.entries(submission.dimensions)) {
    if (value !== undefined && (value < 0 || value > 100)) {
      errors.push({
        field: 'dimensions',
        message: `${key} must be between 0 and 100`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate evidence file
 */
export function validateEvidenceFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_EVIDENCE_SIZE) {
    return { valid: false, error: 'File size must be under 5MB' };
  }

  if (!ALLOWED_EVIDENCE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Supports: PDF, PNG, JPG' };
  }

  return { valid: true };
}

/**
 * Calculate new composite score from dimension changes
 */
export function calculateNewComposite(
  currentDimensions: QualityDimensions,
  changes: Partial<QualityDimensions>,
  weights?: Record<keyof QualityDimensions, number>
): number {
  const defaultWeights = {
    accuracy: 0.30,
    utility: 0.25,
    novelty: 0.20,
    provenance: 0.25,
  };

  const w = weights || defaultWeights;
  const merged = { ...currentDimensions, ...changes };

  return Math.round(
    merged.accuracy * w.accuracy +
    merged.utility * w.utility +
    merged.novelty * w.novelty +
    merged.provenance * w.provenance
  );
}

/**
 * Format score change for display
 */
export function formatScoreChange(before: number, after: number): string {
  const delta = after - before;
  const sign = delta >= 0 ? '+' : '';
  return `${before} → ${after} (${sign}${delta})`;
}
