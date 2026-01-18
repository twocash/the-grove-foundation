// src/core/schema/attribution.ts
// Attribution Economy Schema
// Sprint: S11-SL-Attribution v1.0
// Knowledge Economy & Rewards system types

import { z } from 'zod';

// =============================================================================
// Reputation Tiers
// =============================================================================

/**
 * Reputation tier levels (5 tiers)
 * Multipliers: novice=0.9, developing=1.0, competent=1.1, expert=1.3, legendary=1.5
 */
export type ReputationTier = 'novice' | 'developing' | 'competent' | 'expert' | 'legendary';

export const REPUTATION_TIERS: readonly ReputationTier[] = [
  'novice',
  'developing',
  'competent',
  'expert',
  'legendary'
] as const;

/**
 * Reputation tier configuration
 */
export interface ReputationTierConfig {
  tier: ReputationTier;
  minScore: number;
  maxScore: number;
  multiplier: number;
  label: string;
  color: string;
  badgeIcon: string;
}

export const REPUTATION_TIER_CONFIGS: Record<ReputationTier, ReputationTierConfig> = {
  novice: {
    tier: 'novice',
    minScore: 0,
    maxScore: 29,
    multiplier: 0.9,
    label: 'Novice',
    color: '#6B7280', // gray-500
    badgeIcon: '🌱'
  },
  developing: {
    tier: 'developing',
    minScore: 30,
    maxScore: 49,
    multiplier: 1.0,
    label: 'Developing',
    color: '#3B82F6', // blue-500
    badgeIcon: '🌿'
  },
  competent: {
    tier: 'competent',
    minScore: 50,
    maxScore: 69,
    multiplier: 1.1,
    label: 'Competent',
    color: '#10B981', // green-500
    badgeIcon: '🌳'
  },
  expert: {
    tier: 'expert',
    minScore: 70,
    maxScore: 89,
    multiplier: 1.3,
    label: 'Expert',
    color: '#8B5CF6', // purple-500
    badgeIcon: '🏆'
  },
  legendary: {
    tier: 'legendary',
    minScore: 90,
    maxScore: 100,
    multiplier: 1.5,
    label: 'Legendary',
    color: '#F59E0B', // amber-500
    badgeIcon: '👑'
  }
};

// =============================================================================
// Base Tokens (Tier-based)
// =============================================================================

/**
 * Content tier levels (sprout=1, sapling=2, tree=3)
 */
export type ContentTierLevel = 1 | 2 | 3;

export const BASE_TOKENS: Record<ContentTierLevel, number> = {
  1: 10,   // Sprout
  2: 50,   // Sapling
  3: 250   // Tree
};

export const TIER_LABELS: Record<ContentTierLevel, string> = {
  1: 'Sprout',
  2: 'Sapling',
  3: 'Tree'
};

// =============================================================================
// Quality Multipliers (from S10-SL-AICuration)
// =============================================================================

export interface QualityMultiplierRange {
  minScore: number;
  multiplier: number;
  label: string;
}

export const QUALITY_MULTIPLIER_RANGES: QualityMultiplierRange[] = [
  { minScore: 90, multiplier: 2.0, label: 'Exceptional' },
  { minScore: 80, multiplier: 1.8, label: 'Outstanding' },
  { minScore: 70, multiplier: 1.6, label: 'Excellent' },
  { minScore: 60, multiplier: 1.4, label: 'Good' },
  { minScore: 50, multiplier: 1.2, label: 'Above Average' },
  { minScore: 40, multiplier: 1.0, label: 'Standard' },
  { minScore: 30, multiplier: 0.9, label: 'Below Average' },
  { minScore: 20, multiplier: 0.8, label: 'Needs Improvement' },
  { minScore: 0, multiplier: 0.5, label: 'Minimum' }
];

/**
 * Get quality multiplier from score (0-100)
 */
export function getQualityMultiplier(score: number): number {
  for (const range of QUALITY_MULTIPLIER_RANGES) {
    if (score >= range.minScore) {
      return range.multiplier;
    }
  }
  return 0.5; // Minimum fallback
}

/**
 * Get reputation tier from score (0-100)
 */
export function getReputationTier(score: number): ReputationTier {
  if (score >= 90) return 'legendary';
  if (score >= 70) return 'expert';
  if (score >= 50) return 'competent';
  if (score >= 30) return 'developing';
  return 'novice';
}

/**
 * Get tier multiplier from reputation tier
 */
export function getTierMultiplier(tier: ReputationTier): number {
  return REPUTATION_TIER_CONFIGS[tier].multiplier;
}

// =============================================================================
// Attribution Event
// =============================================================================

export interface AttributionEvent {
  id: string;
  sourceGroveId: string;
  targetGroveId: string;
  contentId?: string;

  // Tier & Quality
  tierLevel: ContentTierLevel;
  qualityScore?: number;
  attributionStrength: number;  // 0.0 to 1.0

  // Token Calculation Components
  baseTokens: number;
  qualityMultiplier: number;
  networkBonus: number;
  reputationMultiplier: number;

  // Final Result
  finalTokens: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export const AttributionEventSchema = z.object({
  id: z.string().uuid(),
  sourceGroveId: z.string().min(1),
  targetGroveId: z.string().min(1),
  contentId: z.string().uuid().optional(),

  tierLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  qualityScore: z.number().min(0).max(100).optional(),
  attributionStrength: z.number().min(0).max(1).default(0.75),

  baseTokens: z.number().min(0),
  qualityMultiplier: z.number().min(0.5).max(2.0),
  networkBonus: z.number().min(0).max(2.0),
  reputationMultiplier: z.number().min(0.9).max(1.5),

  finalTokens: z.number().min(0),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// =============================================================================
// Token Balance
// =============================================================================

export interface TokenBalance {
  id: string;
  groveId: string;
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastActivityAt?: string;
  totalAttributions: number;
  createdAt: string;
  updatedAt: string;
}

export const TokenBalanceSchema = z.object({
  id: z.string().uuid(),
  groveId: z.string().min(1),
  currentBalance: z.number().default(0),
  lifetimeEarned: z.number().default(0),
  lifetimeSpent: z.number().default(0),
  lastActivityAt: z.string().datetime().optional(),
  totalAttributions: z.number().int().default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// =============================================================================
// Reputation Score
// =============================================================================

export interface ReputationScore {
  id: string;
  groveId: string;
  reputationScore: number;
  currentTier: ReputationTier;
  tierMultiplier: number;

  // Statistics
  totalContributions: number;
  qualityWeightedScore: number;
  averageQuality?: number;
  consistencyScore?: number;

  // Badges
  badges: string[];

  // Timestamps
  tierAchievedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const ReputationScoreSchema = z.object({
  id: z.string().uuid(),
  groveId: z.string().min(1),
  reputationScore: z.number().min(0).max(100).default(0),
  currentTier: z.enum(['novice', 'developing', 'competent', 'expert', 'legendary']).default('novice'),
  tierMultiplier: z.number().min(0.9).max(1.5).default(0.9),

  totalContributions: z.number().int().default(0),
  qualityWeightedScore: z.number().default(0),
  averageQuality: z.number().min(0).max(100).optional(),
  consistencyScore: z.number().min(0).max(100).optional(),

  badges: z.array(z.string()).default([]),

  tierAchievedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// =============================================================================
// Network Influence
// =============================================================================

export interface NetworkInfluence {
  id: string;
  sourceGroveId: string;
  targetGroveId: string;

  // Metrics
  influenceScore: number;
  interactionCount: number;
  totalTokensExchanged: number;
  networkBonus: number;  // 1.0 to 2.0
  isBidirectional: boolean;

  // Timestamps
  firstInteractionAt?: string;
  lastInteractionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const NetworkInfluenceSchema = z.object({
  id: z.string().uuid(),
  sourceGroveId: z.string().min(1),
  targetGroveId: z.string().min(1),

  influenceScore: z.number().min(0).max(100).default(0),
  interactionCount: z.number().int().default(0),
  totalTokensExchanged: z.number().default(0),
  networkBonus: z.number().min(1.0).max(2.0).default(1.0),
  isBidirectional: z.boolean().default(false),

  firstInteractionAt: z.string().datetime().optional(),
  lastInteractionAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// =============================================================================
// Economic Settings (DEX: Declarative Sovereignty)
// =============================================================================

export interface EconomicSetting {
  id: string;
  settingKey: string;
  settingValue: unknown;
  description?: string;
  version: number;
  previousValue?: unknown;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const EconomicSettingSchema = z.object({
  id: z.string().uuid(),
  settingKey: z.string().min(1),
  settingValue: z.unknown(),
  description: z.string().optional(),
  version: z.number().int().default(1),
  previousValue: z.unknown().optional(),
  updatedBy: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// =============================================================================
// Attribution Chain (DEX Pillar III: Provenance)
// =============================================================================

export interface ChainEvent {
  eventId: string;
  sourceGroveId: string;
  targetGroveId: string;
  tokens: number;
  timestamp: string;
}

export interface AttributionChain {
  id: string;
  rootContentId: string;
  chainDepth: number;
  chainEvents: ChainEvent[];
  totalTokens: number;
  participantCount: number;
  averageQuality?: number;
  chainStartedAt: string;
  lastEventAt: string;
  createdAt: string;
  updatedAt: string;
}

export const ChainEventSchema = z.object({
  eventId: z.string().uuid(),
  sourceGroveId: z.string().min(1),
  targetGroveId: z.string().min(1),
  tokens: z.number(),
  timestamp: z.string().datetime()
});

export const AttributionChainSchema = z.object({
  id: z.string().uuid(),
  rootContentId: z.string().uuid(),
  chainDepth: z.number().int().min(1).default(1),
  chainEvents: z.array(ChainEventSchema).default([]),
  totalTokens: z.number().default(0),
  participantCount: z.number().int().min(1).default(1),
  averageQuality: z.number().min(0).max(100).optional(),
  chainStartedAt: z.string().datetime(),
  lastEventAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// =============================================================================
// Token Calculation
// =============================================================================

export interface TokenCalculationInput {
  tierLevel: ContentTierLevel;
  qualityScore?: number;
  networkBonus?: number;
  reputationTier?: ReputationTier;
}

export interface TokenCalculationResult {
  baseTokens: number;
  qualityMultiplier: number;
  networkBonus: number;
  reputationMultiplier: number;
  finalTokens: number;
  breakdown: {
    afterQuality: number;
    afterNetwork: number;
    afterReputation: number;
  };
}

/**
 * Calculate final token amount with all multipliers
 * Formula: finalTokens = baseTokens × qualityMultiplier × (1 + networkBonus) × reputationMultiplier
 */
export function calculateTokens(input: TokenCalculationInput): TokenCalculationResult {
  const baseTokens = BASE_TOKENS[input.tierLevel];
  const qualityMultiplier = getQualityMultiplier(input.qualityScore ?? 0);
  const networkBonus = input.networkBonus ?? 0.2;
  const reputationMultiplier = input.reputationTier
    ? getTierMultiplier(input.reputationTier)
    : 1.0;

  const afterQuality = Math.round(baseTokens * qualityMultiplier * 100) / 100;
  const afterNetwork = Math.round(afterQuality * (1 + networkBonus) * 100) / 100;
  const finalTokens = Math.round(afterNetwork * reputationMultiplier * 100) / 100;

  return {
    baseTokens,
    qualityMultiplier,
    networkBonus,
    reputationMultiplier,
    finalTokens,
    breakdown: {
      afterQuality,
      afterNetwork,
      afterReputation: finalTokens
    }
  };
}

// =============================================================================
// Grove Economic Summary (View)
// =============================================================================

export interface GroveEconomicSummary {
  groveId: string;
  currentBalance: number;
  lifetimeEarned: number;
  totalAttributions: number;
  reputationScore: number;
  currentTier: ReputationTier;
  tierMultiplier: number;
  badges: string[];
  outgoingInfluenceCount: number;
  avgOutgoingInfluence: number;
  lastActivityAt?: string;
  updatedAt: string;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isAttributionEvent(obj: unknown): obj is AttributionEvent {
  return AttributionEventSchema.safeParse(obj).success;
}

export function isTokenBalance(obj: unknown): obj is TokenBalance {
  return TokenBalanceSchema.safeParse(obj).success;
}

export function isReputationScore(obj: unknown): obj is ReputationScore {
  return ReputationScoreSchema.safeParse(obj).success;
}

export function isNetworkInfluence(obj: unknown): obj is NetworkInfluence {
  return NetworkInfluenceSchema.safeParse(obj).success;
}

export function isAttributionChain(obj: unknown): obj is AttributionChain {
  return AttributionChainSchema.safeParse(obj).success;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface CalculateAttributionRequest {
  sourceGroveId: string;
  targetGroveId: string;
  tierLevel: ContentTierLevel;
  qualityScore?: number;
  contentId?: string;
}

export interface CalculateAttributionResponse {
  success: boolean;
  attributionEvent?: AttributionEvent;
  tokenBalance?: TokenBalance;
  error?: string;
}

export interface GetEconomicSummaryRequest {
  groveId: string;
}

export interface GetEconomicSummaryResponse {
  success: boolean;
  summary?: GroveEconomicSummary;
  error?: string;
}

export interface UpdateReputationRequest {
  groveId: string;
  additionalScore?: number;
  badge?: string;
}

export interface UpdateReputationResponse {
  success: boolean;
  reputationScore?: ReputationScore;
  tierChanged?: boolean;
  previousTier?: ReputationTier;
  newTier?: ReputationTier;
  error?: string;
}
