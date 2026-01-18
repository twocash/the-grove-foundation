// src/core/schema/federation.ts
// Grove-Level Federation Schema - S9-SL-Federation-v1
// Defines types for cross-grove federation (external communities)
// NOTE: Distinct from src/core/federation/* which handles Sprint-level (internal)

import { z } from 'zod';
import type { GroveObject, GroveObjectMeta } from './grove-object';

// ============================================================================
// TIER SYSTEM DEFINITIONS
// ============================================================================

/**
 * Tier definition within a grove's tier system.
 */
export interface TierDefinition {
  id: string;           // Unique tier identifier
  name: string;         // Display name
  level: number;        // Numeric order (1 = lowest)
  icon?: string;        // Emoji or Material Symbol
  color?: string;       // CSS color
  description?: string; // Tier description
}

export const TierDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().positive(),
  icon: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional()
});

/**
 * Complete tier system definition for a grove.
 */
export interface TierSystemDefinition {
  name: string;              // e.g., "botanical", "academic", "numeric"
  tiers: TierDefinition[];
  description?: string;
}

export const TierSystemDefinitionSchema = z.object({
  name: z.string(),
  tiers: z.array(TierDefinitionSchema),
  description: z.string().optional()
});

// ============================================================================
// GROVE STATUS TYPES
// ============================================================================

export type GroveStatus = 'active' | 'inactive' | 'degraded' | 'blocked';
export type ConnectionStatus = 'connected' | 'pending' | 'blocked' | 'none';
export type TrustLevel = 'new' | 'established' | 'trusted' | 'verified';

export const GroveStatusSchema = z.enum(['active', 'inactive', 'degraded', 'blocked']);
export const ConnectionStatusSchema = z.enum(['connected', 'pending', 'blocked', 'none']);
export const TrustLevelSchema = z.enum(['new', 'established', 'trusted', 'verified']);

// ============================================================================
// TRUST CONFIGURATION
// ============================================================================

/**
 * Trust level thresholds.
 */
export const TRUST_THRESHOLDS: Record<TrustLevel, { min: number; max: number }> = {
  new: { min: 0, max: 25 },
  established: { min: 25, max: 50 },
  trusted: { min: 50, max: 75 },
  verified: { min: 75, max: 100 }
};

/**
 * Trust level configuration (analogous to REPUTATION_TIER_CONFIGS).
 */
export interface TrustLevelConfig {
  level: TrustLevel;
  label: string;
  description: string;
  minScore: number;
  maxScore: number;
  color: string;
  icon: string;
  multiplier: number;  // Trust multiplier for exchanges
}

export const TRUST_LEVEL_CONFIGS: Record<TrustLevel, TrustLevelConfig> = {
  new: {
    level: 'new',
    label: 'New',
    description: 'Recently connected grove with no exchange history',
    minScore: 0,
    maxScore: 25,
    color: '#94a3b8', // slate-400
    icon: '🌱',
    multiplier: 1.0
  },
  established: {
    level: 'established',
    label: 'Established',
    description: 'Grove with some successful exchanges',
    minScore: 25,
    maxScore: 50,
    color: '#60a5fa', // blue-400
    icon: '🌿',
    multiplier: 1.15
  },
  trusted: {
    level: 'trusted',
    label: 'Trusted',
    description: 'Grove with consistent positive exchange history',
    minScore: 50,
    maxScore: 75,
    color: '#4ade80', // green-400
    icon: '🌳',
    multiplier: 1.3
  },
  verified: {
    level: 'verified',
    label: 'Verified',
    description: 'Highly trusted grove with verified identity',
    minScore: 75,
    maxScore: 100,
    color: '#a78bfa', // violet-400
    icon: '🏛️',
    multiplier: 1.5
  }
};

// ============================================================================
// FEDERATED GROVE
// ============================================================================

/**
 * Payload for FederatedGrove GroveObject.
 */
export interface FederatedGrovePayload {
  // Identity
  groveId: string;           // Unique grove identifier
  name: string;              // Display name
  description: string;       // Grove purpose
  endpoint: string;          // API endpoint URL

  // Status
  status: GroveStatus;
  connectionStatus: ConnectionStatus;
  lastHealthCheck?: string;  // ISO timestamp

  // Tier System
  tierSystem: TierSystemDefinition;

  // Trust
  trustScore: number;        // 0-100
  trustLevel: TrustLevel;

  // Metrics
  sproutCount: number;
  exchangeCount: number;

  // Federation metadata
  registeredAt: string;
  lastActivityAt?: string;
  capabilities: string[];    // e.g., ['knowledge-exchange', 'tier-mapping']
}

export const FederatedGrovePayloadSchema = z.object({
  groveId: z.string(),
  name: z.string(),
  description: z.string(),
  endpoint: z.string().url().optional().or(z.literal('')),
  status: GroveStatusSchema,
  connectionStatus: ConnectionStatusSchema,
  lastHealthCheck: z.string().optional(),
  tierSystem: TierSystemDefinitionSchema,
  trustScore: z.number().min(0).max(100),
  trustLevel: TrustLevelSchema,
  sproutCount: z.number().int().min(0),
  exchangeCount: z.number().int().min(0),
  registeredAt: z.string(),
  lastActivityAt: z.string().optional(),
  capabilities: z.array(z.string())
});

/**
 * FederatedGrove as GroveObject.
 */
export interface FederatedGrove extends GroveObject<FederatedGrovePayload> {
  meta: GroveObjectMeta & {
    type: 'federated-grove';
  };
}

// ============================================================================
// TIER MAPPING
// ============================================================================

export type EquivalenceType = 'exact' | 'approximate' | 'subset' | 'superset';
export type MappingStatus = 'draft' | 'proposed' | 'accepted' | 'rejected';

export const EquivalenceTypeSchema = z.enum(['exact', 'approximate', 'subset', 'superset']);
export const MappingStatusSchema = z.enum(['draft', 'proposed', 'accepted', 'rejected']);

/**
 * Single tier equivalence rule.
 */
export interface TierEquivalence {
  sourceTierId: string;      // Tier ID from source grove
  targetTierId: string;      // Tier ID from target grove
  equivalenceType: EquivalenceType;
  notes?: string;            // Human explanation
}

export const TierEquivalenceSchema = z.object({
  sourceTierId: z.string(),
  targetTierId: z.string(),
  equivalenceType: EquivalenceTypeSchema,
  notes: z.string().optional()
});

/**
 * Payload for TierMapping GroveObject.
 */
export interface TierMappingPayload {
  // Relationship
  sourceGroveId: string;     // "our" grove
  targetGroveId: string;     // "their" grove

  // Mapping rules
  mappings: TierEquivalence[];

  // Validation
  status: MappingStatus;
  validatedAt?: string;
  validatedBy?: string;      // User or system

  // Trust impact
  confidenceScore: number;   // 0-1, how confident in mapping
}

export const TierMappingPayloadSchema = z.object({
  sourceGroveId: z.string(),
  targetGroveId: z.string(),
  mappings: z.array(TierEquivalenceSchema),
  status: MappingStatusSchema,
  validatedAt: z.string().optional(),
  validatedBy: z.string().optional(),
  confidenceScore: z.number().min(0).max(1)
});

/**
 * TierMapping as GroveObject.
 */
export interface TierMapping extends GroveObject<TierMappingPayload> {
  meta: GroveObjectMeta & {
    type: 'tier-mapping';
  };
}

// ============================================================================
// FEDERATION EXCHANGE
// ============================================================================

export type ExchangeType = 'request' | 'offer';
export type ExchangeContentType = 'sprout' | 'concept' | 'research' | 'insight';
export type ExchangeStatus = 'pending' | 'approved' | 'completed' | 'rejected' | 'expired';

export const ExchangeTypeSchema = z.enum(['request', 'offer']);
export const ExchangeContentTypeSchema = z.enum(['sprout', 'concept', 'research', 'insight']);
export const ExchangeStatusSchema = z.enum(['pending', 'approved', 'completed', 'rejected', 'expired']);

/**
 * Payload for FederationExchange GroveObject.
 */
export interface FederationExchangePayload {
  // Parties
  requestingGroveId: string;
  providingGroveId: string;

  // Content
  type: ExchangeType;
  contentType: ExchangeContentType;
  contentId?: string;        // If specific content requested
  query?: string;            // If search-based request

  // Status
  status: ExchangeStatus;

  // Tier context
  sourceTier: string;
  mappedTier?: string;       // After tier mapping applied

  // Tracking
  initiatedAt: string;
  completedAt?: string;

  // Attribution
  tokenValue?: number;       // Economic value of exchange
}

export const FederationExchangePayloadSchema = z.object({
  requestingGroveId: z.string(),
  providingGroveId: z.string(),
  type: ExchangeTypeSchema,
  contentType: ExchangeContentTypeSchema,
  contentId: z.string().optional(),
  query: z.string().optional(),
  status: ExchangeStatusSchema,
  sourceTier: z.string(),
  mappedTier: z.string().optional(),
  initiatedAt: z.string(),
  completedAt: z.string().optional(),
  tokenValue: z.number().optional()
});

/**
 * FederationExchange as GroveObject.
 */
export interface FederationExchange extends GroveObject<FederationExchangePayload> {
  meta: GroveObjectMeta & {
    type: 'federation-exchange';
  };
}

// ============================================================================
// TRUST RELATIONSHIP
// ============================================================================

/**
 * Trust component scores.
 */
export interface TrustComponents {
  exchangeSuccess: number;  // Historical success rate (0-100)
  tierAccuracy: number;     // Mapping accuracy (0-100)
  responseTime: number;     // Avg response latency score (0-100)
  contentQuality: number;   // Quality of exchanged content (0-100)
}

export const TrustComponentsSchema = z.object({
  exchangeSuccess: z.number().min(0).max(100),
  tierAccuracy: z.number().min(0).max(100),
  responseTime: z.number().min(0).max(100),
  contentQuality: z.number().min(0).max(100)
});

/**
 * Payload for TrustRelationship GroveObject.
 */
export interface TrustRelationshipPayload {
  // Parties (alphabetically ordered for consistency)
  groveIds: [string, string];

  // Trust metrics
  overallScore: number;      // 0-100

  // Component scores
  components: TrustComponents;

  // History
  exchangeCount: number;
  successfulExchanges: number;
  lastExchangeAt?: string;

  // Status
  level: TrustLevel;
  verifiedAt?: string;
  verifiedBy?: 'system' | 'admin' | 'community';
}

export const TrustRelationshipPayloadSchema = z.object({
  groveIds: z.tuple([z.string(), z.string()]),
  overallScore: z.number().min(0).max(100),
  components: TrustComponentsSchema,
  exchangeCount: z.number().int().min(0),
  successfulExchanges: z.number().int().min(0),
  lastExchangeAt: z.string().optional(),
  level: TrustLevelSchema,
  verifiedAt: z.string().optional(),
  verifiedBy: z.enum(['system', 'admin', 'community']).optional()
});

/**
 * TrustRelationship as GroveObject.
 */
export interface TrustRelationship extends GroveObject<TrustRelationshipPayload> {
  meta: GroveObjectMeta & {
    type: 'trust-relationship';
  };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isFederatedGrove(obj: unknown): obj is FederatedGrove {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return o.meta && (o.meta as Record<string, unknown>).type === 'federated-grove';
}

export function isTierMapping(obj: unknown): obj is TierMapping {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return o.meta && (o.meta as Record<string, unknown>).type === 'tier-mapping';
}

export function isFederationExchange(obj: unknown): obj is FederationExchange {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return o.meta && (o.meta as Record<string, unknown>).type === 'federation-exchange';
}

export function isTrustRelationship(obj: unknown): obj is TrustRelationship {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return o.meta && (o.meta as Record<string, unknown>).type === 'trust-relationship';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get trust level from score.
 */
export function getTrustLevel(score: number): TrustLevel {
  if (score >= TRUST_THRESHOLDS.verified.min) return 'verified';
  if (score >= TRUST_THRESHOLDS.trusted.min) return 'trusted';
  if (score >= TRUST_THRESHOLDS.established.min) return 'established';
  return 'new';
}

/**
 * Get trust multiplier from level.
 */
export function getTrustMultiplier(level: TrustLevel): number {
  return TRUST_LEVEL_CONFIGS[level].multiplier;
}

/**
 * Calculate overall trust score from components.
 */
export function calculateTrustScore(components: TrustComponents): number {
  const weights = {
    exchangeSuccess: 0.35,
    tierAccuracy: 0.25,
    responseTime: 0.15,
    contentQuality: 0.25
  };

  return Math.round(
    components.exchangeSuccess * weights.exchangeSuccess +
    components.tierAccuracy * weights.tierAccuracy +
    components.responseTime * weights.responseTime +
    components.contentQuality * weights.contentQuality
  );
}

/**
 * Order grove IDs alphabetically for consistent relationship keys.
 */
export function orderGroveIds(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1];
}
