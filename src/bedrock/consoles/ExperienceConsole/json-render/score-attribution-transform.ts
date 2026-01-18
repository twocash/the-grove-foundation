// src/bedrock/consoles/ExperienceConsole/json-render/score-attribution-transform.ts
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Pattern: json-render transform (converts ScoreAttribution to renderable tree)
// MANDATORY: Educational tone throughout - first-person plural, positive framing

import type { RenderTree, RenderElement } from './score-attribution-catalog';

/**
 * Score attribution data structure from API/assessment
 */
export interface ScoreAttributionData {
  sproutId: string;
  sproutTitle?: string;
  overallScore: number;
  grade: string;
  confidence: number;
  assessedAt: string;
  model?: string;
  version?: string;
  processingTime?: number;
  dimensions: {
    accuracy: DimensionAttribution;
    utility: DimensionAttribution;
    novelty: DimensionAttribution;
    provenance: DimensionAttribution;
  };
}

export interface DimensionAttribution {
  score: number;
  /** Raw signals/factors that contributed to this score */
  signals: string[];
  /** Pre-generated educational explanation (uses "we" language) */
  explanation?: string;
}

/**
 * Transform options for customizing attribution render output
 */
export interface ScoreAttributionTransformOptions {
  /** Enable override request CTA */
  enableOverrideCta?: boolean;
  /** Override button label */
  overrideLabel?: string;
  /** Show processing metadata */
  showMetadata?: boolean;
  /** Dimensions to display (default: all) */
  dimensions?: Array<'accuracy' | 'utility' | 'novelty' | 'provenance'>;
}

const DEFAULT_OPTIONS: ScoreAttributionTransformOptions = {
  enableOverrideCta: true,
  overrideLabel: 'Request Override',
  showMetadata: true,
  dimensions: ['accuracy', 'utility', 'novelty', 'provenance'],
};

/**
 * Get confidence label from numeric confidence
 */
function getConfidenceLabel(confidence: number): 'Low' | 'Medium' | 'High' {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.5) return 'Medium';
  return 'Low';
}

/**
 * Convert score to star rating (1-5)
 */
function scoreToStars(score: number): number {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

/**
 * Get dimension display label
 */
const DIMENSION_LABELS: Record<string, string> = {
  accuracy: 'Accuracy',
  utility: 'Utility',
  novelty: 'Novelty',
  provenance: 'Provenance',
};

/**
 * Generate educational summary from signals using first-person plural.
 * MANDATORY: Use "we" language, positive framing first.
 */
function generateEducationalSummary(
  dimension: string,
  score: number,
  signals: string[],
  explanation?: string
): string {
  // If pre-generated explanation exists, use it
  if (explanation) {
    return explanation;
  }

  // Generate educational summary based on score and dimension
  const scoreQuality = score >= 75 ? 'strong' : score >= 50 ? 'moderate' : 'limited';

  const summaryTemplates: Record<string, Record<string, string>> = {
    accuracy: {
      strong: 'We found strong factual consistency with verified sources.',
      moderate: 'We noticed generally accurate content with some areas for verification.',
      limited: 'We identified several areas where additional verification would strengthen the content.',
    },
    utility: {
      strong: 'We observed highly actionable insights that address the research question directly.',
      moderate: 'We found useful content that partially addresses the research question.',
      limited: 'We see potential to make the content more directly applicable.',
    },
    novelty: {
      strong: 'We discovered fresh perspectives and unique contributions to the topic.',
      moderate: 'We found some original elements alongside established knowledge.',
      limited: 'We noticed the content largely reflects existing information.',
    },
    provenance: {
      strong: 'We traced clear attribution and credible sources throughout.',
      moderate: 'We found partial attribution with room for stronger sourcing.',
      limited: 'We recommend adding more explicit source references.',
    },
  };

  return summaryTemplates[dimension]?.[scoreQuality] ||
    `We analyzed this dimension and found a ${scoreQuality} performance.`;
}

/**
 * Generate constructive improvement suggestion.
 * MANDATORY: Use "To improve:" prefix, constructive tone.
 */
function generateSuggestion(
  dimension: string,
  score: number,
  signals: string[]
): string | undefined {
  // Only suggest improvements for scores below 80
  if (score >= 80) return undefined;

  const suggestionTemplates: Record<string, string> = {
    accuracy: 'Consider cross-referencing key claims with primary sources.',
    utility: 'Adding specific examples or case studies could enhance practical value.',
    novelty: 'Exploring alternative perspectives or recent developments could add fresh insights.',
    provenance: 'Including publication dates and author credentials would strengthen attribution.',
  };

  return suggestionTemplates[dimension];
}

/**
 * Extract positive findings from signals.
 * MANDATORY: Positive framing, use "we" language.
 */
function extractFindings(signals: string[], score: number): string[] {
  // If signals are provided, transform them into positive findings
  if (signals.length > 0) {
    return signals.slice(0, 3).map(signal => {
      // Transform signal into "we found" language
      if (signal.toLowerCase().startsWith('we ')) {
        return signal;
      }
      return `We found: ${signal}`;
    });
  }

  // Default findings based on score
  if (score >= 80) {
    return ['We found strong performance in this area.'];
  }
  if (score >= 60) {
    return ['We observed solid fundamentals with room for enhancement.'];
  }
  return ['We identified this as an area for potential improvement.'];
}

/**
 * Transforms ScoreAttributionData into a json-render tree structure.
 *
 * Components used:
 * - ScoreAttributionHeader: overall score, grade, confidence
 * - AttributionDimension: dimension breakdown with educational narrative
 * - AttributionOverrideCta: request override button
 * - AttributionMetadata: model, version, processing info
 */
export function scoreAttributionToRenderTree(
  data: ScoreAttributionData,
  options: ScoreAttributionTransformOptions = {}
): RenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: RenderElement[] = [];

  // 1. Header with overall score and confidence
  children.push({
    type: 'ScoreAttributionHeader',
    props: {
      overallScore: data.overallScore,
      grade: data.grade,
      confidence: data.confidence,
      confidenceLabel: getConfidenceLabel(data.confidence),
      sproutTitle: data.sproutTitle,
      assessedAt: data.assessedAt,
    },
  });

  // 2. Dimension breakdowns with educational narrative
  const dimensionsToShow = opts.dimensions || Object.keys(data.dimensions) as Array<keyof typeof data.dimensions>;

  for (const dimKey of dimensionsToShow) {
    const dim = data.dimensions[dimKey];
    if (!dim) continue;

    children.push({
      type: 'AttributionDimension',
      props: {
        dimension: dimKey,
        label: DIMENSION_LABELS[dimKey],
        score: dim.score,
        stars: scoreToStars(dim.score),
        summary: generateEducationalSummary(dimKey, dim.score, dim.signals, dim.explanation),
        findings: extractFindings(dim.signals, dim.score),
        suggestion: generateSuggestion(dimKey, dim.score, dim.signals),
      },
    });
  }

  // 3. Override CTA (if enabled)
  if (opts.enableOverrideCta) {
    children.push({
      type: 'AttributionOverrideCta',
      props: {
        enabled: true,
        label: opts.overrideLabel || 'Request Override',
        sproutId: data.sproutId,
      },
    });
  }

  // 4. Metadata (if enabled)
  if (opts.showMetadata) {
    children.push({
      type: 'AttributionMetadata',
      props: {
        model: data.model,
        version: data.version,
        assessedAt: data.assessedAt,
        processingTime: data.processingTime,
      },
    });
  }

  return {
    type: 'root',
    children,
  };
}

/**
 * Creates a minimal render tree for loading/pending state.
 */
export function createPendingAttributionTree(
  sproutId: string,
  sproutTitle?: string
): RenderTree {
  return {
    type: 'root',
    children: [
      {
        type: 'ScoreAttributionHeader',
        props: {
          overallScore: 0,
          grade: '--',
          confidence: 0,
          confidenceLabel: 'Low' as const,
          sproutTitle,
        },
      },
    ],
  };
}

/**
 * Creates a single dimension element for focused display.
 */
export function dimensionToElement(
  dimension: 'accuracy' | 'utility' | 'novelty' | 'provenance',
  data: DimensionAttribution
): RenderElement {
  return {
    type: 'AttributionDimension',
    props: {
      dimension,
      label: DIMENSION_LABELS[dimension],
      score: data.score,
      stars: scoreToStars(data.score),
      summary: generateEducationalSummary(dimension, data.score, data.signals, data.explanation),
      findings: extractFindings(data.signals, data.score),
      suggestion: generateSuggestion(dimension, data.score, data.signals),
    },
  };
}

export default scoreAttributionToRenderTree;
