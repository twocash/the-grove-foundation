// src/surface/components/modals/SproutFinishingRoom/json-render/promotion-transform.ts
// Sprint: S24-SFR sfr-garden-bridge-v1
// Pattern: json-render transform for Garden promotion display
//
// Transforms promotion results into RenderTree using PromotionCatalog components.
// Two output shapes:
//   1. Full PromotionStatus tree (for center column confirmation card)
//   2. Compact PromotionBadge tree (for artifact version tab)

import type { RenderTree, RenderElement } from '@core/json-render';
import type { PromotionResult } from '../garden-bridge';

/**
 * Transform a PromotionResult into a full confirmation card RenderTree.
 * Used in the center column after successful Garden promotion.
 *
 * Structure:
 *   - PromotionStatus: Full provenance card with tier, IDs, template, confidence
 */
export function promotionResultToRenderTree(result: PromotionResult): RenderTree {
  const children: RenderElement[] = [];

  children.push({
    type: 'PromotionStatus',
    props: {
      title: result.title,
      tier: result.tier,
      gardenDocId: result.gardenDocId,
      sproutId: result.sproutId,
      templateName: result.templateName,
      promotedAt: result.promotedAt,
      confidenceScore: result.confidenceScore,
    },
  });

  return {
    type: 'root',
    children,
    meta: {
      catalog: 'promotion',
      version: '1.0.0',
      generatedAt: result.promotedAt,
      generatedBy: 'system',
    },
  };
}

/**
 * Transform a PromotionResult into a compact badge RenderTree.
 * Used on artifact version tabs to indicate promotion status.
 *
 * Structure:
 *   - PromotionBadge: Tier icon + label + timestamp
 */
export function promotionBadgeToRenderTree(result: PromotionResult): RenderTree {
  const children: RenderElement[] = [];

  children.push({
    type: 'PromotionBadge',
    props: {
      tier: result.tier,
      promotedAt: result.promotedAt,
    },
  });

  return {
    type: 'root',
    children,
    meta: {
      catalog: 'promotion',
      version: '1.0.0',
      generatedAt: result.promotedAt,
      generatedBy: 'system',
    },
  };
}
