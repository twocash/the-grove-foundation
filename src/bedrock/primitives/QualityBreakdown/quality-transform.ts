// src/bedrock/primitives/QualityBreakdown/quality-transform.ts
// Quality Breakdown Panel - Transform (Domain → Render Tree)
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: json-render pattern - Converts QualityScore domain data to render tree

import type {
  QualityRenderTree,
  QualityRenderElement,
  QualityHeader,
  DimensionBar,
  DimensionGroup,
  MetadataRow,
  MetadataSection,
  NetworkPercentileBadge,
  ConfidenceIndicator,
  ActionButton,
  Divider,
  EmptyState,
  PendingState,
  ErrorState,
} from './quality-catalog';
import type { QualityScore, QualityDimensions, QualityGrade, SproutQualityMeta } from '@core/schema';
import { getQualityGrade, QUALITY_GRADE_CONFIGS, DIMENSION_CONFIGS } from '@core/schema';

// =============================================================================
// Transform Options
// =============================================================================

export interface QualityTransformOptions {
  /** Show the "View Details" action button */
  showViewDetails?: boolean;
  /** Show network percentile badge (if available) */
  showNetworkPercentile?: boolean;
  /** Show assessment metadata section */
  showMetadata?: boolean;
  /** Show confidence indicator */
  showConfidence?: boolean;
  /** Compact mode - fewer elements */
  compact?: boolean;
}

const DEFAULT_OPTIONS: QualityTransformOptions = {
  showViewDetails: true,
  showNetworkPercentile: true,
  showMetadata: true,
  showConfidence: true,
  compact: false,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get grade for a score value
 */
function gradeFromScore(score: number): QualityGrade {
  return getQualityGrade(score);
}

/**
 * Format date for display
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// =============================================================================
// Element Builders
// =============================================================================

/**
 * Build QualityHeader element
 */
function buildHeader(qualityScore: QualityScore): QualityHeader {
  const grade = gradeFromScore(qualityScore.overall);
  const gradeConfig = QUALITY_GRADE_CONFIGS[grade];

  return {
    type: 'QualityHeader',
    props: {
      overall: qualityScore.overall,
      grade,
      gradeLabel: gradeConfig.label,
      gradeIcon: gradeConfig.icon,
    },
  };
}

/**
 * Build DimensionBar element
 */
function buildDimensionBar(
  dimension: keyof QualityDimensions,
  value: number
): DimensionBar {
  const config = DIMENSION_CONFIGS[dimension];
  const grade = gradeFromScore(value);

  return {
    type: 'DimensionBar',
    props: {
      dimension,
      label: config.label,
      icon: config.icon,
      value,
      color: config.color,
      grade,
    },
  };
}

/**
 * Build DimensionGroup element
 */
function buildDimensionGroup(
  dimensions: QualityDimensions,
  title?: string
): DimensionGroup {
  return {
    type: 'DimensionGroup',
    props: { title },
    children: [
      buildDimensionBar('accuracy', dimensions.accuracy),
      buildDimensionBar('utility', dimensions.utility),
      buildDimensionBar('novelty', dimensions.novelty),
      buildDimensionBar('provenance', dimensions.provenance),
    ],
  };
}

/**
 * Build MetadataSection element
 */
function buildMetadataSection(qualityScore: QualityScore): MetadataSection {
  const children: MetadataRow[] = [
    {
      type: 'MetadataRow',
      props: {
        icon: 'schedule',
        label: 'Assessed',
        value: `${formatDate(qualityScore.assessedAt)} at ${formatTime(qualityScore.assessedAt)}`,
      },
    },
    {
      type: 'MetadataRow',
      props: {
        icon: 'smart_toy',
        label: 'Model',
        value: qualityScore.assessedBy,
      },
    },
  ];

  return {
    type: 'MetadataSection',
    props: { title: 'Assessment Details' },
    children,
  };
}

/**
 * Build NetworkPercentileBadge element
 */
function buildNetworkPercentileBadge(percentile: number): NetworkPercentileBadge {
  return {
    type: 'NetworkPercentileBadge',
    props: {
      percentile,
      label: 'in network',
    },
  };
}

/**
 * Build ConfidenceIndicator element
 */
function buildConfidenceIndicator(confidence: number): ConfidenceIndicator {
  return {
    type: 'ConfidenceIndicator',
    props: {
      confidence,
      label: 'confidence',
    },
  };
}

/**
 * Build ActionButton element
 */
function buildViewDetailsButton(): ActionButton {
  return {
    type: 'ActionButton',
    props: {
      label: 'View Full Assessment',
      icon: 'arrow_forward',
      variant: 'ghost',
    },
  };
}

/**
 * Build Divider element
 */
function buildDivider(spacing: 'sm' | 'md' | 'lg' = 'md'): Divider {
  return {
    type: 'Divider',
    props: { spacing },
  };
}

/**
 * Build EmptyState element
 */
function buildEmptyState(): EmptyState {
  return {
    type: 'EmptyState',
    props: {
      icon: 'psychology',
      title: 'Not Yet Assessed',
      description: 'Quality assessment has not been performed for this sprout.',
    },
  };
}

/**
 * Build PendingState element
 */
function buildPendingState(): PendingState {
  return {
    type: 'PendingState',
    props: {
      icon: 'hourglass_empty',
      title: 'Assessment in Progress',
      description: 'Quality scores are being calculated. Check back shortly.',
    },
  };
}

/**
 * Build ErrorState element
 */
function buildErrorState(message?: string): ErrorState {
  return {
    type: 'ErrorState',
    props: {
      icon: 'error_outline',
      title: 'Assessment Failed',
      message: message || 'Unable to calculate quality scores. Please try again.',
    },
  };
}

// =============================================================================
// Main Transform Function
// =============================================================================

/**
 * Transform QualityScore to render tree
 *
 * @param qualityScore - The quality score data (or undefined if not assessed)
 * @param status - The quality status ('scored', 'pending', 'error', 'not-assessed')
 * @param options - Transform options
 * @returns Render tree for the quality breakdown panel
 */
export function qualityScoreToRenderTree(
  qualityScore: QualityScore | undefined,
  status: SproutQualityMeta['status'],
  options: QualityTransformOptions = {}
): QualityRenderTree {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const children: QualityRenderElement[] = [];

  // Handle non-scored states
  if (status === 'not-assessed' || (!qualityScore && status !== 'pending' && status !== 'error')) {
    children.push(buildEmptyState());
    return { type: 'root', children };
  }

  if (status === 'pending') {
    children.push(buildPendingState());
    return { type: 'root', children };
  }

  if (status === 'error') {
    children.push(buildErrorState());
    return { type: 'root', children };
  }

  // At this point, we have a scored status with qualityScore data
  if (!qualityScore) {
    children.push(buildEmptyState());
    return { type: 'root', children };
  }

  // Build the full scored breakdown
  // 1. Header with overall score and grade
  children.push(buildHeader(qualityScore));

  // 2. Dimension bars
  const dimensionTitle = opts.compact ? undefined : 'Quality Dimensions';
  children.push(buildDimensionGroup(qualityScore.dimensions, dimensionTitle));

  // 3. Network percentile (if available and enabled)
  if (opts.showNetworkPercentile && qualityScore.networkPercentile !== undefined) {
    children.push(buildDivider('sm'));
    children.push(buildNetworkPercentileBadge(qualityScore.networkPercentile));
  }

  // 4. Confidence indicator (if available and enabled)
  if (opts.showConfidence && qualityScore.confidence !== undefined) {
    children.push(buildConfidenceIndicator(qualityScore.confidence));
  }

  // 5. Metadata section (if enabled and not compact)
  if (opts.showMetadata && !opts.compact) {
    children.push(buildDivider('md'));
    children.push(buildMetadataSection(qualityScore));
  }

  // 6. View details button (if enabled)
  if (opts.showViewDetails && !opts.compact) {
    children.push(buildDivider('md'));
    children.push(buildViewDetailsButton());
  }

  return { type: 'root', children };
}

/**
 * Transform SproutQualityMeta to render tree (convenience wrapper)
 *
 * @param qualityMeta - The sprout's quality metadata
 * @param options - Transform options
 * @returns Render tree for the quality breakdown panel
 */
export function sproutQualityToRenderTree(
  qualityMeta: SproutQualityMeta | undefined,
  options: QualityTransformOptions = {}
): QualityRenderTree {
  if (!qualityMeta) {
    return qualityScoreToRenderTree(undefined, 'not-assessed', options);
  }

  return qualityScoreToRenderTree(qualityMeta.score, qualityMeta.status, options);
}

export default qualityScoreToRenderTree;
