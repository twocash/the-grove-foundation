// src/bedrock/types/sprout.ts
// Sprout types using GroveObject pattern
// Sprint: bedrock-foundation-v1

import type { GroveObject, GroveObjectMeta, GroveObjectProvenance } from '../../core/schema/grove-object';

// =============================================================================
// Sprout Types
// =============================================================================

/**
 * Types of knowledge contributions users can create
 */
export type SproutType = 'document' | 'insight' | 'question' | 'connection';

/**
 * Moderation status for sprouts
 */
export type SproutStatus = 'pending' | 'approved' | 'rejected' | 'deferred';

// =============================================================================
// Sprout Claims
// =============================================================================

/**
 * A factual claim extracted from or associated with a sprout
 */
export interface SproutClaim {
  id: string;
  text: string;
  confidence: number;
  status: 'unverified' | 'verified' | 'disputed';
  verifiedAt?: string;
  verifiedBy?: string;
}

// =============================================================================
// Sprout Source
// =============================================================================

/**
 * Source context for where the sprout originated
 */
export interface SproutSource {
  /** Journey the user was exploring when capturing */
  journeyId?: string;
  /** Specific node/waypoint in the journey */
  nodeId?: string;
  /** Message ID from chat conversation */
  messageId?: string;
  /** Selected text that was highlighted */
  selection?: string;
  /** URL if from external source */
  sourceUrl?: string;
}

// =============================================================================
// Sprout Payload
// =============================================================================

/**
 * Type-specific payload for a Sprout GroveObject
 */
export interface SproutPayload {
  /** The kind of sprout */
  type: SproutType;

  /** Main content of the sprout */
  content: string;

  /** Where this sprout came from */
  source?: SproutSource;

  /** Extracted claims for verification */
  claims?: SproutClaim[];

  /** Notes from moderation */
  moderationNotes?: string;

  /** Moderation status */
  status: SproutStatus;

  /** Type-specific fields */
  fields?: Record<string, unknown>;
}

// =============================================================================
// Sprout (GroveObject)
// =============================================================================

/**
 * A Sprout is a GroveObject with SproutPayload
 */
export type Sprout = GroveObject<SproutPayload>;

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new Sprout with proper GroveObject structure
 */
export function createSprout(
  title: string,
  type: SproutType,
  content: string,
  options?: {
    source?: SproutSource;
    fields?: Record<string, unknown>;
    provenance?: GroveObjectProvenance;
    tags?: string[];
  }
): Sprout {
  const now = new Date().toISOString();

  const meta: GroveObjectMeta = {
    id: crypto.randomUUID(),
    type: 'sprout',
    title,
    createdAt: now,
    updatedAt: now,
    status: 'pending',
    createdBy: options?.provenance ?? {
      type: 'human',
      context: {
        journeyId: options?.source?.journeyId,
        sessionId: typeof window !== 'undefined'
          ? localStorage.getItem('grove-session-id') ?? undefined
          : undefined,
      },
    },
    tags: options?.tags,
  };

  const payload: SproutPayload = {
    type,
    content,
    source: options?.source,
    status: 'pending',
    fields: options?.fields,
  };

  return { meta, payload };
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if an object is a valid Sprout
 */
export function isSprout(obj: unknown): obj is Sprout {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;

  // Check meta
  if (!o.meta || typeof o.meta !== 'object') return false;
  const meta = o.meta as Record<string, unknown>;
  if (meta.type !== 'sprout') return false;

  // Check payload
  if (!o.payload || typeof o.payload !== 'object') return false;
  const payload = o.payload as Record<string, unknown>;
  if (!['document', 'insight', 'question', 'connection'].includes(payload.type as string)) {
    return false;
  }

  return true;
}

// =============================================================================
// Helper Types
// =============================================================================

/**
 * Sprout filtered by type
 */
export type DocumentSprout = Sprout & { payload: SproutPayload & { type: 'document' } };
export type InsightSprout = Sprout & { payload: SproutPayload & { type: 'insight' } };
export type QuestionSprout = Sprout & { payload: SproutPayload & { type: 'question' } };
export type ConnectionSprout = Sprout & { payload: SproutPayload & { type: 'connection' } };

/**
 * Sprout creation input (before GroveObject wrapping)
 */
export interface SproutInput {
  title: string;
  type: SproutType;
  content: string;
  source?: SproutSource;
  fields?: Record<string, unknown>;
  tags?: string[];
}
