// src/bedrock/consoles/ExperienceConsole/json-render/score-attribution-catalog.ts
// Sprint: S19-BD-JsonRenderFactory (migrated from S10.2-SL-AICuration v3)
// Pattern: json-render catalog using factory pattern
// Defines component vocabulary for "Why This Score?" Attribution Panel

import { z } from 'zod';
import { createCatalog, type CatalogDefinition } from '@core/json-render';

/**
 * ScoreAttributionCatalog - Defines components for quality score explanation
 *
 * This catalog provides the vocabulary for the "Why This Score?" panel,
 * which explains AI quality assessments using educational, user-friendly language.
 *
 * MANDATORY: Educational tone throughout
 * - First-person plural ("We found")
 * - Positive framing for findings
 * - Constructive suggestions (not critical)
 *
 * Components:
 * - ScoreAttributionHeader: Overall score with confidence
 * - AttributionDimension: Individual dimension breakdown
 * - StarRating: Visual 1-5 star rating
 * - AttributionOverrideCta: Request Override button
 */

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const ScoreAttributionHeaderSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Composite score'),
  grade: z.string().describe('Letter grade (A, A-, B+, etc.)'),
  confidence: z.number().min(0).max(1).describe('Model confidence 0-1'),
  confidenceLabel: z.enum(['Low', 'Medium', 'High']).describe('Human-readable confidence'),
  sproutTitle: z.string().optional().describe('Sprout title for context'),
  assessedAt: z.string().optional().describe('When assessment was performed'),
});

export const StarRatingSchema = z.object({
  value: z.number().min(1).max(5).describe('Star rating 1-5'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
});

export const AttributionDimensionSchema = z.object({
  dimension: z.enum(['accuracy', 'utility', 'novelty', 'provenance']),
  label: z.string().describe('Display label (e.g., "Accuracy")'),
  score: z.number().min(0).max(100).describe('Dimension score'),
  stars: z.number().min(1).max(5).describe('Star rating equivalent'),
  // Educational narrative content - MANDATORY
  summary: z.string().describe('Educational summary using "we" language'),
  findings: z.array(z.string()).describe('What we found - positive framing'),
  suggestion: z.string().optional().describe('Constructive improvement tip'),
});

export const AttributionOverrideCtaSchema = z.object({
  enabled: z.boolean().default(true),
  label: z.string().default('Request Override'),
  sproutId: z.string().describe('Sprout ID for override'),
});

export const AttributionMetadataSchema = z.object({
  model: z.string().optional().describe('Model used for assessment'),
  version: z.string().optional().describe('Model version'),
  assessedAt: z.string().describe('Assessment timestamp'),
  processingTime: z.number().optional().describe('Processing time in ms'),
});

// ============================================================================
// CATALOG DEFINITION (using factory pattern)
// ============================================================================

export const ScoreAttributionCatalog: CatalogDefinition = createCatalog({
  name: 'score-attribution',
  version: '2.0.0',
  components: {
    ScoreAttributionHeader: {
      props: ScoreAttributionHeaderSchema,
      category: 'data',
      description: 'Overall score with confidence and grade display',
      agentHint: 'Use at the top of score attribution panels to show composite score',
    },
    StarRating: {
      props: StarRatingSchema,
      category: 'data',
      description: 'Visual 1-5 star rating display',
      agentHint: 'Display star ratings for dimension scores',
    },
    AttributionDimension: {
      props: AttributionDimensionSchema,
      category: 'data',
      description: 'Individual dimension breakdown with educational narrative',
      agentHint: 'Show detailed breakdown of a single quality dimension',
    },
    AttributionOverrideCta: {
      props: AttributionOverrideCtaSchema,
      category: 'action',
      description: 'Request Override button with sprout context',
      agentHint: 'Allow operators to request score override',
    },
    AttributionMetadata: {
      props: AttributionMetadataSchema,
      category: 'data',
      description: 'Assessment metadata including model and timing',
      agentHint: 'Display provenance information about the assessment',
    },
  },
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ScoreAttributionCatalogType = typeof ScoreAttributionCatalog;
export type ScoreAttributionHeaderProps = z.infer<typeof ScoreAttributionHeaderSchema>;
export type StarRatingProps = z.infer<typeof StarRatingSchema>;
export type AttributionDimensionProps = z.infer<typeof AttributionDimensionSchema>;
export type AttributionOverrideCtaProps = z.infer<typeof AttributionOverrideCtaSchema>;
export type AttributionMetadataProps = z.infer<typeof AttributionMetadataSchema>;

// ============================================================================
// EDUCATIONAL TONE GUIDELINES (for registry implementation)
// ============================================================================

/**
 * Educational Tone Requirements for AttributionDimension registry component:
 *
 * 1. Use first-person plural ("We found", "We noticed", "We analyzed")
 * 2. Start with positive findings before areas for improvement
 * 3. Use lightbulb icon (💡) for improvement suggestions
 * 4. Frame suggestions constructively ("To improve" not "Problems found")
 * 5. Never use defensive language ("The model determined")
 *
 * Example summary:
 *   ✅ "We found strong factual consistency with verified sources."
 *   ❌ "The model determined the content has accurate facts."
 *
 * Example suggestion:
 *   ✅ "To improve: Consider adding more recent citations."
 *   ❌ "Missing recent citations detected."
 */
export const EDUCATIONAL_TONE_GUIDELINES = {
  pronouns: ['we', 'our'],
  forbiddenPhrases: ['the model', 'algorithm determined', 'system found'],
  suggestionPrefix: 'To improve:',
  findingsHeader: 'What we found:',
  positiveFirst: true,
};

// ============================================================================
// BACKWARD COMPATIBILITY: Re-export core types
// ============================================================================

// Re-export RenderElement and RenderTree from core for consumers who imported
// from this file. New code should import directly from '@core/json-render'.
export type { RenderElement, RenderTree } from '@core/json-render';
