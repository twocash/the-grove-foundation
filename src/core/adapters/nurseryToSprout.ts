// src/core/adapters/nurseryToSprout.ts
// Sprint: S26-NUR Phase 1a
//
// Adapter: Maps Nursery sprout data → Sprout (SproutFinishingRoom)
//
// WHY: The Nursery Console works with GroveObject<SproutPayload> (Supabase-backed,
// console factory pattern). The SproutFinishingRoom expects a Sprout type (localStorage-era
// schema). This adapter bridges the two without coupling either to the other's type system.
//
// ARCHITECTURE: This file lives in src/core/adapters/ and only imports from src/core/schema/.
// It defines its own NurseryBridgeInput interface so it does NOT import from src/bedrock/.
//
// FIELD MAPPING:
//   meta.id             → Sprout.id
//   meta.createdAt      → Sprout.capturedAt
//   payload.spark       → Sprout.query
//   payload.synthesis   → Sprout.response (summary text, fallback: researchDocument.position)
//   payload.status      → Sprout.status + Sprout.stage (mapped)
//   payload.researchDocument → Sprout.researchDocument
//   payload.generatedArtifacts → Sprout.generatedArtifacts
//   payload.tags        → Sprout.tags
//   payload.notes       → Sprout.notes

import type { Sprout, SproutStatus, SproutStage, SproutProvenance, GeneratedArtifact } from '../schema/sprout';
import type { ResearchSproutStatus } from '../schema/research-sprout';
import type { ResearchDocument } from '../schema/research-document';

/**
 * Minimal input shape for the adapter.
 *
 * This interface mirrors the fields the adapter reads from GroveObject<SproutPayload>
 * without importing from src/bedrock/. The caller constructs this from their GroveObject.
 */
export interface NurseryBridgeInput {
  meta: {
    id: string;
    createdAt: string;
  };
  payload: {
    spark: string;
    status: ResearchSproutStatus;
    inferenceModel?: string | null;
    tags: string[];
    notes: string | null;
    synthesis?: {
      summary: string;
      insights: string[];
      confidence: number;
      synthesizedAt: string;
    } | null;
    researchDocument?: ResearchDocument;
    generatedArtifacts?: GeneratedArtifact[];
    promotedAt?: string;
    promotedToGardenId?: string | null;
  };
}

/**
 * Map ResearchSproutStatus → SproutStatus (legacy 3-value enum)
 */
function mapStatus(status: ResearchSproutStatus): SproutStatus {
  switch (status) {
    case 'completed':
    case 'promoted':
      return 'tree';
    case 'active':
    case 'paused':
    case 'blocked':
      return 'sapling';
    default:
      return 'sprout';
  }
}

/**
 * Map ResearchSproutStatus → SproutStage (8-value botanical lifecycle)
 */
function mapStage(status: ResearchSproutStatus): SproutStage {
  switch (status) {
    case 'pending':
      return 'tender';
    case 'active':
      return 'rooting';
    case 'paused':
    case 'blocked':
      return 'branching';
    case 'completed':
      return 'hardened';
    case 'promoted':
      return 'established';
    case 'archived':
      return 'dormant';
    default:
      return 'tender';
  }
}

/**
 * Convert Nursery sprout data to a Sprout for SproutFinishingRoom.
 *
 * Preserves all available data while providing sensible defaults
 * for fields that don't have a direct Nursery equivalent.
 */
export function nurseryToSprout(input: NurseryBridgeInput): Sprout {
  const { meta, payload } = input;

  const provenance: SproutProvenance = {
    lens: null,
    hub: null,
    journey: null,
    node: null,
    knowledgeFiles: [],
    model: payload.inferenceModel ?? undefined,
    generatedAt: meta.createdAt,
  };

  // Use synthesis summary as the response text, falling back to spark
  const response = payload.synthesis?.summary
    ?? payload.researchDocument?.position
    ?? payload.spark;

  return {
    id: meta.id,
    capturedAt: meta.createdAt,

    // Content
    response,
    query: payload.spark,

    // Provenance
    provenance,
    personaId: null,
    journeyId: null,
    hubId: null,
    nodeId: null,

    // Lifecycle
    status: mapStatus(payload.status),
    stage: mapStage(payload.status),
    promotedAt: payload.promotedAt,

    // Research data
    researchDocument: payload.researchDocument,
    generatedArtifacts: payload.generatedArtifacts,

    // Research synthesis → legacy fields for SFR compatibility
    researchSynthesis: payload.synthesis ? {
      summary: payload.synthesis.summary,
      insights: payload.synthesis.insights,
      confidence: payload.synthesis.confidence,
      synthesizedAt: payload.synthesis.synthesizedAt,
    } : undefined,

    // User data
    tags: payload.tags,
    notes: payload.notes,

    // Attribution
    sessionId: 'nursery-bridge',
    creatorId: null,
  };
}
