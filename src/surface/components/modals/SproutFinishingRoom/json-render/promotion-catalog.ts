// src/surface/components/modals/SproutFinishingRoom/json-render/promotion-catalog.ts
// Sprint: S24-SFR sfr-garden-bridge-v1
// Pattern: json-render catalog for Garden promotion display
//
// Rule: "Read = json-render. Write = React."
// These components DISPLAY promotion results — pure read-only data.

import { z } from 'zod';
import { createCatalog, type CatalogDefinition } from '@core/json-render';

// =============================================================================
// Schema Definitions
// =============================================================================

/**
 * PromotionStatus - Full confirmation card after successful Garden promotion.
 * Shows title, tier, provenance chain, and metadata.
 */
export const PromotionStatusSchema = z.object({
  title: z.string().describe('Document title promoted to Garden'),
  tier: z.enum(['seed', 'sprout', 'sapling', 'tree', 'grove']).describe('Garden tier (always seed on promotion)'),
  gardenDocId: z.string().describe('Garden document UUID'),
  sproutId: z.string().describe('Source sprout UUID'),
  templateName: z.string().describe('Writer template used'),
  promotedAt: z.string().describe('ISO timestamp of promotion'),
  confidenceScore: z.number().min(0).max(1).describe('Research confidence 0-1'),
});

/**
 * PromotionBadge - Compact badge on artifact version tab.
 * Shows tier and when it was promoted.
 */
export const PromotionBadgeSchema = z.object({
  tier: z.enum(['seed', 'sprout', 'sapling', 'tree', 'grove']).describe('Current Garden tier'),
  promotedAt: z.string().describe('ISO timestamp of promotion'),
});

// =============================================================================
// Catalog Definition
// =============================================================================

export const PromotionCatalog: CatalogDefinition = createCatalog({
  name: 'promotion',
  version: '1.0.0',
  components: {
    PromotionStatus: {
      props: PromotionStatusSchema,
      category: 'feedback',
      description: 'Full promotion confirmation card with provenance chain',
      agentHint: 'Display after successful Garden promotion showing document identity and lineage',
    },
    PromotionBadge: {
      props: PromotionBadgeSchema,
      category: 'data',
      description: 'Compact promotion badge for artifact tabs',
      agentHint: 'Show on artifact version tab to indicate Garden promotion status',
    },
  },
});

// =============================================================================
// Type Exports
// =============================================================================

export type PromotionCatalogType = typeof PromotionCatalog;
export type PromotionStatusProps = z.infer<typeof PromotionStatusSchema>;
export type PromotionBadgeProps = z.infer<typeof PromotionBadgeSchema>;
