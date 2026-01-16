// src/core/schema/sprout-signals.ts
// Sprint: S6-SL-ObservableSignals v1
// Phase 2 of Observable Knowledge System EPIC
// "We're not building analytics. We're building the nervous system for emergent quality."

import { z } from 'zod';

// ============================================================================
// EVENT TYPE TAXONOMY
// ============================================================================

/**
 * All possible sprout usage event types.
 * Each event captures a specific interaction with a sprout.
 */
export type SproutEventType =
  | 'sprout_viewed'      // Sprout opened in Finishing Room
  | 'sprout_retrieved'   // Sprout included in RAG context
  | 'sprout_referenced'  // Sprout cited in new research query
  | 'sprout_searched'    // Sprout appeared in search results
  | 'sprout_rated'       // User gave thumbs up/down
  | 'sprout_exported'    // User exported to markdown/json/notion
  | 'sprout_promoted'    // User promoted to RAG corpus
  | 'sprout_refined';    // User revised/extended sprout

export const SPROUT_EVENT_TYPES: SproutEventType[] = [
  'sprout_viewed',
  'sprout_retrieved',
  'sprout_referenced',
  'sprout_searched',
  'sprout_rated',
  'sprout_exported',
  'sprout_promoted',
  'sprout_refined',
];

// ============================================================================
// PROVENANCE SCHEMA (DEX Pillar III)
// ============================================================================

/**
 * Full provenance for each event - traces back to lens, journey, hub, query.
 * Enables Phase 3 to understand which contexts produce valuable sprouts.
 */
export const EventProvenanceSchema = z.object({
  lensId: z.string().optional(),
  lensName: z.string().optional(),
  journeyId: z.string().optional(),
  journeyName: z.string().optional(),
  hubId: z.string().optional(),
  hubName: z.string().optional(),
  queryHash: z.string().optional(),    // For retrieval events - hash of query
  sourceFile: z.string().optional(),   // For RAG context - knowledge file source
});

export type EventProvenance = z.infer<typeof EventProvenanceSchema>;

// ============================================================================
// BASE EVENT SCHEMA
// ============================================================================

/**
 * Common fields for all sprout usage events.
 */
export interface SproutUsageEventBase {
  id: string;                    // UUID
  sproutId: string;              // FK to sprouts table
  eventType: SproutEventType;
  createdAt: string;             // ISO timestamp
  sessionId: string;             // Anonymous session ID
  userId?: string;               // Grove ID when authenticated
  provenance: EventProvenance;
}

export const SproutUsageEventBaseSchema = z.object({
  id: z.string().uuid(),
  sproutId: z.string(),
  eventType: z.enum(SPROUT_EVENT_TYPES as [SproutEventType, ...SproutEventType[]]),
  createdAt: z.string().datetime(),
  sessionId: z.string(),
  userId: z.string().optional(),
  provenance: EventProvenanceSchema,
});

// ============================================================================
// DISCRIMINATED EVENT TYPES
// ============================================================================

/**
 * Sprout viewed in Finishing Room.
 * Tracks engagement depth via duration and scroll.
 */
export interface SproutViewedEvent extends SproutUsageEventBase {
  eventType: 'sprout_viewed';
  metadata: {
    viewDurationMs?: number;     // Time spent viewing
    scrollDepth?: number;        // 0-100% scroll depth
  };
}

export const SproutViewedMetadataSchema = z.object({
  viewDurationMs: z.number().optional(),
  scrollDepth: z.number().min(0).max(100).optional(),
});

/**
 * Sprout included in RAG context for a query.
 * Captures retrieval relevance signals.
 */
export interface SproutRetrievedEvent extends SproutUsageEventBase {
  eventType: 'sprout_retrieved';
  metadata: {
    queryText: string;           // The query that retrieved this sprout
    retrievalRank: number;       // Position in context (1 = most relevant)
    contextBytes: number;        // How much content was included
  };
}

export const SproutRetrievedMetadataSchema = z.object({
  queryText: z.string(),
  retrievalRank: z.number().min(1),
  contextBytes: z.number().min(0),
});

/**
 * Sprout cited/referenced in new research query.
 * Tracks knowledge building upon knowledge.
 */
export interface SproutReferencedEvent extends SproutUsageEventBase {
  eventType: 'sprout_referenced';
  metadata: {
    referencingQueryId?: string; // ID of query that references this sprout
    referenceType: 'explicit' | 'implicit'; // How it was referenced
  };
}

export const SproutReferencedMetadataSchema = z.object({
  referencingQueryId: z.string().optional(),
  referenceType: z.enum(['explicit', 'implicit']),
});

/**
 * Sprout appeared in search results.
 * Tracks discoverability.
 */
export interface SproutSearchedEvent extends SproutUsageEventBase {
  eventType: 'sprout_searched';
  metadata: {
    searchQuery: string;         // What the user searched for
    resultPosition: number;      // Position in search results
    wasClicked: boolean;         // Did user click through?
  };
}

export const SproutSearchedMetadataSchema = z.object({
  searchQuery: z.string(),
  resultPosition: z.number().min(1),
  wasClicked: z.boolean(),
});

/**
 * User rated sprout quality.
 * Direct utility signal.
 */
export interface SproutRatedEvent extends SproutUsageEventBase {
  eventType: 'sprout_rated';
  metadata: {
    rating: 'up' | 'down';
    previousRating?: 'up' | 'down' | null;
  };
}

export const SproutRatedMetadataSchema = z.object({
  rating: z.enum(['up', 'down']),
  previousRating: z.enum(['up', 'down']).nullable().optional(),
});

/**
 * User exported sprout to external format.
 * Signals high utility.
 */
export interface SproutExportedEvent extends SproutUsageEventBase {
  eventType: 'sprout_exported';
  metadata: {
    format: 'markdown' | 'json' | 'notion' | 'clipboard';
  };
}

export const SproutExportedMetadataSchema = z.object({
  format: z.enum(['markdown', 'json', 'notion', 'clipboard']),
});

/**
 * User promoted sprout to higher tier.
 * Explicit quality endorsement.
 */
export interface SproutPromotedEvent extends SproutUsageEventBase {
  eventType: 'sprout_promoted';
  metadata: {
    fromTier: string;
    toTier: string;
  };
}

export const SproutPromotedMetadataSchema = z.object({
  fromTier: z.string(),
  toTier: z.string(),
});

/**
 * User refined/extended sprout content.
 * Signals value worth improving.
 */
export interface SproutRefinedEvent extends SproutUsageEventBase {
  eventType: 'sprout_refined';
  metadata: {
    refinementType: 'extend' | 'revise' | 'annotate';
    charsDelta: number;          // Change in content length
  };
}

export const SproutRefinedMetadataSchema = z.object({
  refinementType: z.enum(['extend', 'revise', 'annotate']),
  charsDelta: z.number(),
});

// ============================================================================
// UNION TYPE
// ============================================================================

/**
 * Discriminated union of all sprout usage events.
 */
export type SproutUsageEvent =
  | SproutViewedEvent
  | SproutRetrievedEvent
  | SproutReferencedEvent
  | SproutSearchedEvent
  | SproutRatedEvent
  | SproutExportedEvent
  | SproutPromotedEvent
  | SproutRefinedEvent;

// ============================================================================
// AGGREGATION SCHEMA
// ============================================================================

/**
 * Aggregated signals for a single sprout.
 * Computed periodically from raw events.
 * Used by Phase 3 for auto-advancement decisions.
 */
export interface SignalAggregation {
  sproutId: string;
  period: 'all_time' | 'last_30d' | 'last_7d';

  // Retrieval signals
  viewCount: number;
  retrievalCount: number;
  referenceCount: number;
  searchAppearances: number;

  // Utility signals
  upvotes: number;
  downvotes: number;
  utilityScore: number;          // Computed: (up - down) / total, normalized
  exportCount: number;
  promotionCount: number;
  refinementCount: number;

  // Diversity signals
  uniqueSessions: number;
  uniqueUsers: number;
  uniqueLenses: number;
  uniqueHubs: number;
  uniqueQueries: number;
  diversityIndex: number;        // Computed metric (0-1)

  // Timeline
  firstEventAt: string;
  lastEventAt: string;
  daysActive: number;

  // Computed indicators (for Phase 3)
  qualityScore: number;          // Weighted composite (0-1)
  advancementEligible: boolean;  // Based on Phase 3 criteria preview

  // Metadata
  computedAt: string;
}

export const SignalAggregationSchema = z.object({
  sproutId: z.string(),
  period: z.enum(['all_time', 'last_30d', 'last_7d']),

  viewCount: z.number().int().min(0),
  retrievalCount: z.number().int().min(0),
  referenceCount: z.number().int().min(0),
  searchAppearances: z.number().int().min(0),

  upvotes: z.number().int().min(0),
  downvotes: z.number().int().min(0),
  utilityScore: z.number().min(-1).max(1),
  exportCount: z.number().int().min(0),
  promotionCount: z.number().int().min(0),
  refinementCount: z.number().int().min(0),

  uniqueSessions: z.number().int().min(0),
  uniqueUsers: z.number().int().min(0),
  uniqueLenses: z.number().int().min(0),
  uniqueHubs: z.number().int().min(0),
  uniqueQueries: z.number().int().min(0),
  diversityIndex: z.number().min(0).max(1),

  firstEventAt: z.string().datetime(),
  lastEventAt: z.string().datetime(),
  daysActive: z.number().int().min(0),

  qualityScore: z.number().min(0).max(1),
  advancementEligible: z.boolean(),

  computedAt: z.string().datetime(),
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isSproutUsageEvent(obj: unknown): obj is SproutUsageEvent {
  if (!obj || typeof obj !== 'object') return false;
  const event = obj as SproutUsageEvent;
  return (
    typeof event.id === 'string' &&
    typeof event.sproutId === 'string' &&
    SPROUT_EVENT_TYPES.includes(event.eventType) &&
    typeof event.createdAt === 'string' &&
    typeof event.sessionId === 'string'
  );
}

export function isSignalAggregation(obj: unknown): obj is SignalAggregation {
  if (!obj || typeof obj !== 'object') return false;
  const agg = obj as SignalAggregation;
  return (
    typeof agg.sproutId === 'string' &&
    ['all_time', 'last_30d', 'last_7d'].includes(agg.period) &&
    typeof agg.viewCount === 'number' &&
    typeof agg.qualityScore === 'number'
  );
}

// ============================================================================
// EMPTY/DEFAULT VALUES
// ============================================================================

export const EMPTY_AGGREGATION: Omit<SignalAggregation, 'sproutId' | 'period' | 'computedAt'> = {
  viewCount: 0,
  retrievalCount: 0,
  referenceCount: 0,
  searchAppearances: 0,
  upvotes: 0,
  downvotes: 0,
  utilityScore: 0,
  exportCount: 0,
  promotionCount: 0,
  refinementCount: 0,
  uniqueSessions: 0,
  uniqueUsers: 0,
  uniqueLenses: 0,
  uniqueHubs: 0,
  uniqueQueries: 0,
  diversityIndex: 0,
  firstEventAt: '',
  lastEventAt: '',
  daysActive: 0,
  qualityScore: 0,
  advancementEligible: false,
};

/**
 * Create empty aggregation for a sprout.
 */
export function createEmptyAggregation(
  sproutId: string,
  period: SignalAggregation['period'] = 'all_time'
): SignalAggregation {
  return {
    ...EMPTY_AGGREGATION,
    sproutId,
    period,
    firstEventAt: new Date().toISOString(),
    lastEventAt: new Date().toISOString(),
    computedAt: new Date().toISOString(),
  };
}
