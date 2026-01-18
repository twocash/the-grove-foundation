// src/bedrock/consoles/ExperienceConsole/json-render/attribution-catalog.ts
// Sprint: S11-SL-Attribution v1 - Phase 4
// Pattern: json-render catalog (Vercel Labs)
// Defines component vocabulary for Attribution Dashboard visualization

import { z } from 'zod';

/**
 * AttributionCatalog - Defines the component vocabulary for attribution/economy visualization
 *
 * This catalog constrains what components can render attribution data, ensuring predictable,
 * schema-compliant output. Each component has a Zod schema for validation.
 *
 * Components:
 * - AttributionHeader: Title and grove context
 * - TokenBalanceCard: Current balance with lifetime stats
 * - ReputationCard: Score with tier display
 * - TierProgressBar: Visual progress toward next tier
 * - BadgeGrid: Collection of earned badges
 * - RecentActivityList: Recent attribution events
 * - BadgeStatsSummary: Category/rarity breakdown
 */

// ============================================================================
// SCHEMA DEFINITIONS
// ============================================================================

export const AttributionHeaderSchema = z.object({
  title: z.string().describe('Panel title'),
  subtitle: z.string().optional().describe('Optional subtitle'),
  groveId: z.string().optional().describe('Grove ID for context'),
  compact: z.boolean().default(false).describe('Compact display mode'),
});

export const TokenBalanceCardSchema = z.object({
  currentBalance: z.number().describe('Current token balance'),
  lifetimeEarned: z.number().describe('Total tokens earned'),
  lifetimeSpent: z.number().default(0).describe('Total tokens spent'),
  totalAttributions: z.number().describe('Number of attribution events'),
  icon: z.string().default('toll').describe('Material Symbol icon name'),
  accent: z.enum(['amber', 'cyan', 'violet', 'green', 'default']).default('amber'),
});

export const ReputationTierSchema = z.enum([
  'novice',
  'developing',
  'competent',
  'expert',
  'legendary',
]);

export const ReputationCardSchema = z.object({
  reputationScore: z.number().describe('Current reputation score'),
  currentTier: ReputationTierSchema.describe('Current tier'),
  tierMultiplier: z.number().describe('Tier-based multiplier'),
  totalContributions: z.number().describe('Total contribution count'),
  icon: z.string().default('military_tech').describe('Material Symbol icon name'),
  accent: z.enum(['amber', 'cyan', 'violet', 'green', 'default']).default('violet'),
});

export const TierProgressBarSchema = z.object({
  currentScore: z.number().describe('Current reputation score'),
  currentTier: ReputationTierSchema.describe('Current tier'),
  currentThreshold: z.number().describe('Score at which current tier was reached'),
  nextThreshold: z.number().describe('Score required for next tier'),
  nextTier: ReputationTierSchema.nullable().describe('Next tier or null if at max'),
  progressPercent: z.number().min(0).max(100).describe('Progress percentage'),
});

export const BadgeRaritySchema = z.enum(['common', 'uncommon', 'rare', 'legendary']);
export const BadgeCategorySchema = z.enum(['tier', 'milestone', 'tokens', 'quality', 'special']);

export const BadgeItemSchema = z.object({
  id: z.string().describe('Badge ID'),
  name: z.string().describe('Badge display name'),
  description: z.string().describe('Badge description'),
  icon: z.string().describe('Material Symbol icon name'),
  rarity: BadgeRaritySchema,
  category: BadgeCategorySchema,
  earned: z.boolean().describe('Whether badge is earned'),
  earnedAt: z.string().optional().describe('ISO timestamp when earned'),
});

export const BadgeGridSchema = z.object({
  badges: z.array(BadgeItemSchema),
  layout: z.enum(['grid', 'row', 'list']).default('grid'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  showUnearned: z.boolean().default(false),
  maxVisible: z.number().optional().describe('Max badges to show before overflow'),
  emptyMessage: z.string().default('No badges earned yet'),
});

export const AttributionEventItemSchema = z.object({
  id: z.string().describe('Event ID'),
  finalTokens: z.number().describe('Tokens earned from event'),
  tierLevel: z.number().min(1).max(3).describe('Content tier level'),
  qualityScore: z.number().min(0).max(100).describe('Quality score'),
  timestamp: z.string().describe('ISO timestamp'),
});

export const RecentActivityListSchema = z.object({
  events: z.array(AttributionEventItemSchema),
  limit: z.number().default(5),
  showQuality: z.boolean().default(true),
  showTier: z.boolean().default(true),
});

export const BadgeCategoryStatsSchema = z.object({
  category: BadgeCategorySchema,
  earned: z.number(),
  total: z.number(),
});

export const BadgeRarityStatsSchema = z.object({
  rarity: BadgeRaritySchema,
  earned: z.number(),
  total: z.number(),
});

export const BadgeStatsSummarySchema = z.object({
  totalBadges: z.number(),
  earnedCount: z.number(),
  earnedPercentage: z.number().min(0).max(100),
  byCategory: z.array(BadgeCategoryStatsSchema),
  byRarity: z.array(BadgeRarityStatsSchema),
});

export const MetricsRowSchema = z.object({
  metrics: z.array(z.object({
    label: z.string(),
    value: z.string(),
    icon: z.string().optional(),
    accent: z.enum(['amber', 'cyan', 'violet', 'green', 'default']).default('default'),
    description: z.string().optional(),
  })),
  columns: z.number().min(2).max(4).default(3),
});

// ============================================================================
// CATALOG DEFINITION
// ============================================================================

export const AttributionCatalog = {
  components: {
    AttributionHeader: { props: AttributionHeaderSchema },
    TokenBalanceCard: { props: TokenBalanceCardSchema },
    ReputationCard: { props: ReputationCardSchema },
    TierProgressBar: { props: TierProgressBarSchema },
    BadgeGrid: { props: BadgeGridSchema },
    RecentActivityList: { props: RecentActivityListSchema },
    BadgeStatsSummary: { props: BadgeStatsSummarySchema },
    MetricsRow: { props: MetricsRowSchema },
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AttributionCatalogType = typeof AttributionCatalog;
export type AttributionHeaderProps = z.infer<typeof AttributionHeaderSchema>;
export type TokenBalanceCardProps = z.infer<typeof TokenBalanceCardSchema>;
export type ReputationCardProps = z.infer<typeof ReputationCardSchema>;
export type ReputationTier = z.infer<typeof ReputationTierSchema>;
export type TierProgressBarProps = z.infer<typeof TierProgressBarSchema>;
export type BadgeRarity = z.infer<typeof BadgeRaritySchema>;
export type BadgeCategory = z.infer<typeof BadgeCategorySchema>;
export type BadgeItemProps = z.infer<typeof BadgeItemSchema>;
export type BadgeGridProps = z.infer<typeof BadgeGridSchema>;
export type AttributionEventItemProps = z.infer<typeof AttributionEventItemSchema>;
export type RecentActivityListProps = z.infer<typeof RecentActivityListSchema>;
export type BadgeCategoryStatsProps = z.infer<typeof BadgeCategoryStatsSchema>;
export type BadgeRarityStatsProps = z.infer<typeof BadgeRarityStatsSchema>;
export type BadgeStatsSummaryProps = z.infer<typeof BadgeStatsSummarySchema>;
export type MetricsRowProps = z.infer<typeof MetricsRowSchema>;

// ============================================================================
// ELEMENT TYPES (shared with other catalogs)
// ============================================================================

export interface RenderElement<T = unknown> {
  type: string;
  props: T;
}

export interface RenderTree {
  type: 'root';
  children: RenderElement[];
}
