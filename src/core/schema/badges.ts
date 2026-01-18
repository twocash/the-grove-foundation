// src/core/schema/badges.ts
// Badge System Schema
// Sprint: S11-SL-Attribution v1.0 - Phase 3
// Reputation badges and achievement system

import { z } from 'zod';
import type { ReputationTier } from './attribution';

// =============================================================================
// Badge Categories
// =============================================================================

/**
 * Badge category types
 * - tier: Awarded for reaching reputation tiers
 * - milestone: Awarded for contribution/token milestones
 * - quality: Awarded for quality streaks
 * - special: Limited edition or event badges
 */
export type BadgeCategory = 'tier' | 'milestone' | 'quality' | 'special';

export const BADGE_CATEGORIES: readonly BadgeCategory[] = [
  'tier',
  'milestone',
  'quality',
  'special'
] as const;

// =============================================================================
// Badge Rarity
// =============================================================================

/**
 * Badge rarity levels (affects visual styling)
 */
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export const BADGE_RARITIES: readonly BadgeRarity[] = [
  'common',
  'uncommon',
  'rare',
  'legendary'
] as const;

/**
 * Rarity styling configuration
 */
export interface BadgeRarityConfig {
  rarity: BadgeRarity;
  glowIntensity: number;  // 0-1 for glow effect
  borderStyle: string;    // Tailwind border class modifier
  bgOpacity: number;      // Background opacity
}

export const BADGE_RARITY_CONFIGS: Record<BadgeRarity, BadgeRarityConfig> = {
  common: {
    rarity: 'common',
    glowIntensity: 0,
    borderStyle: 'border',
    bgOpacity: 0.1
  },
  uncommon: {
    rarity: 'uncommon',
    glowIntensity: 0.2,
    borderStyle: 'border-2',
    bgOpacity: 0.15
  },
  rare: {
    rarity: 'rare',
    glowIntensity: 0.4,
    borderStyle: 'border-2',
    bgOpacity: 0.2
  },
  legendary: {
    rarity: 'legendary',
    glowIntensity: 0.6,
    borderStyle: 'border-2',
    bgOpacity: 0.25
  }
};

// =============================================================================
// Badge Criteria (DEX: Declarative Sovereignty)
// =============================================================================

/**
 * Criteria types for badge awards
 */
export type BadgeCriteriaType =
  | 'tier_reached'
  | 'contribution_count'
  | 'tokens_earned'
  | 'quality_streak'
  | 'special_event';

/**
 * Declarative badge award criteria
 */
export interface BadgeCriteria {
  type: BadgeCriteriaType;
  value: number | string;
  /** Optional: require this to be consecutive (for streaks) */
  consecutive?: boolean;
}

export const BadgeCriteriaSchema = z.object({
  type: z.enum(['tier_reached', 'contribution_count', 'tokens_earned', 'quality_streak', 'special_event']),
  value: z.union([z.number(), z.string()]),
  consecutive: z.boolean().optional()
});

// =============================================================================
// Badge Definition
// =============================================================================

/**
 * Complete badge definition
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;           // Material Symbol name
  category: BadgeCategory;
  rarity: BadgeRarity;
  color: string;          // CSS color (hex or var)
  criteria: BadgeCriteria;
  /** Optional: badge is hidden until earned */
  hidden?: boolean;
}

export const BadgeDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  icon: z.string().min(1),
  category: z.enum(['tier', 'milestone', 'quality', 'special']),
  rarity: z.enum(['common', 'uncommon', 'rare', 'legendary']),
  color: z.string(),
  criteria: BadgeCriteriaSchema,
  hidden: z.boolean().optional()
});

// =============================================================================
// Earned Badge
// =============================================================================

/**
 * Record of a badge earned by a user
 */
export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
  /** Value at time of earning (for milestone badges) */
  earnedValue?: number;
}

export const EarnedBadgeSchema = z.object({
  badgeId: z.string().min(1),
  earnedAt: z.string().datetime(),
  earnedValue: z.number().optional()
});

// =============================================================================
// Badge Definitions Registry (DEX: Declarative Sovereignty)
// =============================================================================

/**
 * Pre-defined badge definitions
 * All badges are declaratively defined here, not hardcoded in logic
 */
export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  // ==========================================================================
  // Tier Badges (5) - Awarded when reaching reputation tiers
  // ==========================================================================
  'tier-novice': {
    id: 'tier-novice',
    name: 'Seedling',
    description: 'Welcome to the Grove! You\'ve taken your first steps.',
    icon: 'eco',
    category: 'tier',
    rarity: 'common',
    color: '#6B7280', // gray-500
    criteria: { type: 'tier_reached', value: 'novice' }
  },
  'tier-developing': {
    id: 'tier-developing',
    name: 'Cultivator',
    description: 'Growing stronger with each contribution.',
    icon: 'potted_plant',
    category: 'tier',
    rarity: 'common',
    color: '#3B82F6', // blue-500
    criteria: { type: 'tier_reached', value: 'developing' }
  },
  'tier-competent': {
    id: 'tier-competent',
    name: 'Arborist',
    description: 'A skilled contributor to the knowledge garden.',
    icon: 'park',
    category: 'tier',
    rarity: 'uncommon',
    color: '#10B981', // green-500
    criteria: { type: 'tier_reached', value: 'competent' }
  },
  'tier-expert': {
    id: 'tier-expert',
    name: 'Forest Keeper',
    description: 'A respected guardian of knowledge.',
    icon: 'forest',
    category: 'tier',
    rarity: 'rare',
    color: '#8B5CF6', // purple-500
    criteria: { type: 'tier_reached', value: 'expert' }
  },
  'tier-legendary': {
    id: 'tier-legendary',
    name: 'Grove Elder',
    description: 'A legendary contributor whose wisdom shapes the Grove.',
    icon: 'emoji_events',
    category: 'tier',
    rarity: 'legendary',
    color: '#F59E0B', // amber-500
    criteria: { type: 'tier_reached', value: 'legendary' }
  },

  // ==========================================================================
  // Milestone Badges - Contribution Count
  // ==========================================================================
  'milestone-first': {
    id: 'milestone-first',
    name: 'First Contribution',
    description: 'You\'ve made your first contribution to the Grove!',
    icon: 'flag',
    category: 'milestone',
    rarity: 'common',
    color: '#22D3EE', // cyan-400
    criteria: { type: 'contribution_count', value: 1 }
  },
  'milestone-decathlete': {
    id: 'milestone-decathlete',
    name: 'Decathlete',
    description: 'Ten contributions and counting!',
    icon: 'military_tech',
    category: 'milestone',
    rarity: 'uncommon',
    color: '#22D3EE', // cyan-400
    criteria: { type: 'contribution_count', value: 10 }
  },
  'milestone-centurion': {
    id: 'milestone-centurion',
    name: 'Centurion',
    description: 'A hundred contributions to the collective knowledge.',
    icon: 'shield',
    category: 'milestone',
    rarity: 'rare',
    color: '#22D3EE', // cyan-400
    criteria: { type: 'contribution_count', value: 100 }
  },

  // ==========================================================================
  // Milestone Badges - Tokens Earned
  // ==========================================================================
  'tokens-century': {
    id: 'tokens-century',
    name: 'Token Century',
    description: 'Earned 100 tokens through your contributions.',
    icon: 'toll',
    category: 'milestone',
    rarity: 'uncommon',
    color: '#F59E0B', // amber-500
    criteria: { type: 'tokens_earned', value: 100 }
  },
  'tokens-thousand': {
    id: 'tokens-thousand',
    name: 'Token Thousandaire',
    description: 'Earned 1,000 tokens - a true knowledge investor!',
    icon: 'savings',
    category: 'milestone',
    rarity: 'rare',
    color: '#F59E0B', // amber-500
    criteria: { type: 'tokens_earned', value: 1000 }
  }
};

/**
 * Get all badge definitions as an array
 */
export function getAllBadgeDefinitions(): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS);
}

/**
 * Get badge definition by ID
 */
export function getBadgeDefinition(id: string): BadgeDefinition | null {
  return BADGE_DEFINITIONS[id] || null;
}

/**
 * Get badges by category
 */
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return getAllBadgeDefinitions().filter(b => b.category === category);
}

/**
 * Get badges by rarity
 */
export function getBadgesByRarity(rarity: BadgeRarity): BadgeDefinition[] {
  return getAllBadgeDefinitions().filter(b => b.rarity === rarity);
}

// =============================================================================
// Type Guards
// =============================================================================

export function isBadgeDefinition(obj: unknown): obj is BadgeDefinition {
  return BadgeDefinitionSchema.safeParse(obj).success;
}

export function isEarnedBadge(obj: unknown): obj is EarnedBadge {
  return EarnedBadgeSchema.safeParse(obj).success;
}

// =============================================================================
// Badge Award Result
// =============================================================================

export interface BadgeAwardResult {
  badgeId: string;
  badge: BadgeDefinition;
  earnedAt: string;
  earnedValue?: number;
  isNew: boolean;
}

export interface BadgeEvaluationResult {
  earnedBadges: string[];
  newBadges: BadgeAwardResult[];
  allBadges: BadgeDefinition[];
}
