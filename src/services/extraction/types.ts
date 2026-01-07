// src/services/extraction/types.ts
// Types for prompt extraction pipeline
// Sprint: extraction-pipeline-integration-v1

import type { Stage } from '@core/context-fields/types';

// =============================================================================
// Topic Categories
// =============================================================================

/**
 * Valid topic categories for extraction mapping
 */
export const TOPIC_CATEGORIES = [
  'infrastructure',
  'architecture',
  'economics',
  'ratchet-thesis',
  'vision',
  'community',
  'philosophy',
  'roles',
  'engagement',
] as const;

export type TopicCategory = (typeof TOPIC_CATEGORIES)[number];

// =============================================================================
// Salience Dimensions
// =============================================================================

export const SALIENCE_DIMENSIONS = [
  'technical',
  'economic',
  'philosophical',
  'practical',
] as const;

export type SalienceDimension = (typeof SALIENCE_DIMENSIONS)[number];

// =============================================================================
// Extracted Concept
// =============================================================================

/**
 * Extracted concept from document analysis
 */
export interface ExtractedConcept {
  // Identity
  concept: string;
  label: string;

  // Content
  executionPrompt: string;
  systemContext: string;

  // Targeting (NEW)
  targetStages: Stage[];
  stageReasoning: string;
  topicCategory: TopicCategory;

  // Quality metrics
  confidence: number;
  salienceDimensions: SalienceDimension[];
  interestingBecause: string;

  // Source tracking
  sourcePassage: string;

  // Legacy fields (for backwards compatibility)
  whyConfusing?: string;
  dimensions?: SalienceDimension[];
  userQuestion?: string;
  systemGuidance?: string;
}

// =============================================================================
// Extraction Configuration
// =============================================================================

export interface ExtractionConfig {
  model?: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
  maxConcepts?: number;
  confidenceThreshold?: number;
  existingTriggers?: string[];
  stages?: Stage[];
}

// =============================================================================
// Extraction Result
// =============================================================================

export interface ExtractionResult {
  documentId: string;
  documentTitle: string;
  concepts: ExtractedConcept[];
  extractedAt: string;
  model: string;
  batchId?: string;
}

// =============================================================================
// Extraction Provenance
// =============================================================================

export interface ExtractionProvenance {
  type: 'extracted';
  sourceDocument: string;
  sourceSnippet: string;
  extractedBy: string;
  extractedAt: string;
  extractionBatch: string;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'edited';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}
