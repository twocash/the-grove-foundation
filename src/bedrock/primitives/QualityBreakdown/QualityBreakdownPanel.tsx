// src/bedrock/primitives/QualityBreakdown/QualityBreakdownPanel.tsx
// Quality Breakdown Panel - Main Component
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: json-render pattern - Renders quality score breakdown from render tree
// Uses: quality-catalog.ts, quality-registry.tsx, quality-transform.ts

import React, { useMemo, useCallback } from 'react';
import type { QualityScore, SproutQualityMeta } from '@core/schema';
import type { QualityRenderTree, QualityRenderElement } from './quality-catalog';
import { renderElement } from './quality-registry';
import { qualityScoreToRenderTree, sproutQualityToRenderTree, type QualityTransformOptions } from './quality-transform';

// =============================================================================
// Types
// =============================================================================

export interface QualityBreakdownPanelProps {
  /** Quality score data */
  qualityScore?: QualityScore;
  /** Quality status */
  status?: SproutQualityMeta['status'];
  /** Callback when "View Details" is clicked */
  onViewDetails?: () => void;
  /** Transform options */
  options?: QualityTransformOptions;
  /** Additional class names */
  className?: string;
}

export interface QualityBreakdownFromMetaProps {
  /** Sprout quality metadata (combined status + score) */
  qualityMeta?: SproutQualityMeta;
  /** Callback when "View Details" is clicked */
  onViewDetails?: () => void;
  /** Transform options */
  options?: QualityTransformOptions;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Render Tree Renderer
// =============================================================================

interface RenderTreeProps {
  tree: QualityRenderTree;
  onAction?: (action: string) => void;
}

/**
 * Renders a complete render tree
 */
function RenderTree({ tree, onAction }: RenderTreeProps) {
  return (
    <>
      {tree.children.map((element, idx) => (
        <React.Fragment key={`${element.type}-${idx}`}>
          {renderElement({ element, onAction })}
        </React.Fragment>
      ))}
    </>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Quality Breakdown Panel
 *
 * Displays a detailed breakdown of quality scores using the json-render pattern.
 * Transforms domain data (QualityScore) to a declarative render tree, then renders
 * using the component registry.
 *
 * @example
 * ```tsx
 * <QualityBreakdownPanel
 *   qualityScore={sprout.qualityScore}
 *   status="scored"
 *   onViewDetails={() => openDetailModal(sprout.id)}
 * />
 * ```
 */
export function QualityBreakdownPanel({
  qualityScore,
  status = 'not-assessed',
  onViewDetails,
  options = {},
  className = '',
}: QualityBreakdownPanelProps) {
  // Transform domain data to render tree
  const renderTree = useMemo(
    () => qualityScoreToRenderTree(qualityScore, status, options),
    [qualityScore, status, options]
  );

  // Handle actions from registry components
  const handleAction = useCallback(
    (action: string) => {
      if (action === 'view-details' && onViewDetails) {
        onViewDetails();
      }
    },
    [onViewDetails]
  );

  return (
    <div
      className={`
        p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)]
        ${className}
      `}
      data-testid="quality-breakdown-panel"
    >
      <RenderTree tree={renderTree} onAction={handleAction} />
    </div>
  );
}

/**
 * Quality Breakdown Panel from SproutQualityMeta
 *
 * Convenience wrapper that accepts SproutQualityMeta directly.
 *
 * @example
 * ```tsx
 * <QualityBreakdownFromMeta
 *   qualityMeta={sprout.qualityMeta}
 *   onViewDetails={() => openDetailModal(sprout.id)}
 * />
 * ```
 */
export function QualityBreakdownFromMeta({
  qualityMeta,
  onViewDetails,
  options = {},
  className = '',
}: QualityBreakdownFromMetaProps) {
  // Transform from SproutQualityMeta
  const renderTree = useMemo(
    () => sproutQualityToRenderTree(qualityMeta, options),
    [qualityMeta, options]
  );

  // Handle actions from registry components
  const handleAction = useCallback(
    (action: string) => {
      if (action === 'view-details' && onViewDetails) {
        onViewDetails();
      }
    },
    [onViewDetails]
  );

  return (
    <div
      className={`
        p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)]
        ${className}
      `}
      data-testid="quality-breakdown-panel"
    >
      <RenderTree tree={renderTree} onAction={handleAction} />
    </div>
  );
}

// =============================================================================
// Compact Variant
// =============================================================================

export interface QualityBreakdownCompactProps {
  /** Quality score data */
  qualityScore?: QualityScore;
  /** Quality status */
  status?: SproutQualityMeta['status'];
  /** Additional class names */
  className?: string;
}

/**
 * Compact Quality Breakdown
 *
 * Smaller version of the breakdown panel for inline use in cards/lists.
 */
export function QualityBreakdownCompact({
  qualityScore,
  status = 'not-assessed',
  className = '',
}: QualityBreakdownCompactProps) {
  // Transform with compact options
  const renderTree = useMemo(
    () =>
      qualityScoreToRenderTree(qualityScore, status, {
        compact: true,
        showViewDetails: false,
        showMetadata: false,
        showNetworkPercentile: false,
        showConfidence: false,
      }),
    [qualityScore, status]
  );

  return (
    <div
      className={`
        p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)]
        ${className}
      `}
      data-testid="quality-breakdown-compact"
    >
      <RenderTree tree={renderTree} />
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default QualityBreakdownPanel;
