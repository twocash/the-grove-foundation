// src/core/schema/sprout.ts
// Sprint: Sprout System → sprout-declarative-v1
// Sprout data model for capturing LLM responses with full provenance
// v3: Adds 8-stage botanical lifecycle and ResearchManifest support
// v3.1: Adds optional ResearchDocument for structured research display (S2-SFR-Display)
// v3.2: Adds CanonicalResearch for 100% structured output capture (S22-WP)
// v3.3: Adds generatedArtifacts[] for persistent artifact history (S25-GSE)

import type { ResearchDocument } from './research-document';
import type { ResearchBranch, Evidence } from './research-strategy';

// ─────────────────────────────────────────────────────────────
// Generated Artifacts (S25-GSE: Persistent artifact history)
// ─────────────────────────────────────────────────────────────

/**
 * A generated artifact from the Writer agent, persisted on the sprout.
 * Each generation (Blog Post, Vision Paper, etc.) creates one entry.
 * Survives modal close and page refresh via localStorage.
 */
export interface GeneratedArtifact {
  /** The full research document output */
  document: ResearchDocument;
  /** Writer template ID used to generate this artifact */
  templateId: string;
  /** Human-readable template name */
  templateName: string;
  /** ISO timestamp of generation */
  generatedAt: string;
  /** ISO timestamp when grafted (saved) to Nursery — absent means draft/unsaved */
  savedAt?: string;
  /** Which rendering instructions shaped this artifact (S27-OT provenance) */
  renderingSource?: 'template' | 'default-writer' | 'default-research';
}

// ─────────────────────────────────────────────────────────────
// Canonical Research (S22-WP: Structured Output Architecture)
// ─────────────────────────────────────────────────────────────

/**
 * Source citation from deep research
 */
export interface CanonicalSource {
  /** Citation index (1-based) */
  index: number;
  /** Source title */
  title: string;
  /** Source URL */
  url: string;
  /** Domain extracted from URL */
  domain?: string;
  /** Credibility assessment */
  credibility?: string;
  /** Relevant snippet from source */
  snippet?: string;
}

/**
 * Research section with citations
 */
export interface CanonicalSection {
  /** Section heading */
  heading: string;
  /** Section content (markdown) */
  content: string;
  /** Indices of sources cited in this section */
  citation_indices?: number[];
}

/**
 * Confidence assessment for research results
 */
export interface CanonicalConfidence {
  /** Confidence level (high/medium/low) */
  level?: string;
  /** Numeric confidence score (0-1) */
  score?: number;
  /** Rationale for confidence assessment */
  rationale?: string;
}

/**
 * Canonical Research - 100% of structured output from deep research API
 *
 * S22-WP: User requirement: "capture and cache 100% of what is returned from
 * the deep research as a canonical object... not a subset. The refinement step
 * is where we consolidate research into knowledge."
 *
 * This is the single source of truth for research results.
 * Frontend and Writer agent should read from this field.
 * DO NOT transform or subset this data for storage.
 */
export interface CanonicalResearch {
  /** Research report title */
  title: string;

  /** Executive summary of findings */
  executive_summary: string;

  /** Research sections with content and citations */
  sections: CanonicalSection[];

  /** Key findings extracted from research */
  key_findings: string[];

  /** Confidence assessment of the research */
  confidence_assessment?: CanonicalConfidence;

  /** Acknowledged limitations of the research */
  limitations?: string[];

  /** Source citations with metadata */
  sources: CanonicalSource[];

  /** Capture metadata (added by backend) */
  _meta?: {
    /** ISO timestamp when captured */
    capturedAt: string;
    /** Tool that produced this output */
    toolName: string;
    /** Number of web search results processed */
    webSearchResultCount?: number;
  };
}

/**
 * Provenance - Human-readable lineage of an insight
 *
 * Captures the "clues" that produced this sprout:
 * what lens was active, which hub matched, what knowledge informed it.
 *
 * POST-MVP: Foundation Refactor Spec defines 8 botanical growth stages:
 * 'tender' | 'rooting' | 'branching' | 'hardened' | 'grafted' | 'established' | 'dormant' | 'withered'
 * Current MVP uses simplified: 'sprout' | 'sapling' | 'tree'
 */
export interface SproutProvenance {
  /** Lens/persona that shaped the response */
  lens: { id: string; name: string } | null;

  /** Topic hub that was matched */
  hub: { id: string; name: string } | null;

  /** Journey context if in guided mode */
  journey: { id: string; name: string } | null;

  /** Specific node/card that triggered the query */
  node: { id: string; name: string } | null;

  /** Knowledge base files that informed the response */
  knowledgeFiles: string[];

  /** Model/API used for generation (future-proofing) */
  model?: string;

  /** ISO timestamp of generation */
  generatedAt: string;
}

/**
 * Sprout - A captured LLM response with full generation context
 *
 * Sprouts are the atomic unit of user contribution to the Knowledge Commons.
 * Each sprout preserves the exact response verbatim along with the complete
 * context that produced it (query, persona, journey, topic hub, etc.)
 *
 * POST-MVP: Foundation Refactor Spec defines 8 botanical growth stages.
 * Current MVP uses simplified 3-stage lifecycle.
 */
export interface Sprout {
  /** Unique identifier (UUID) */
  id: string;

  /** ISO timestamp of capture */
  capturedAt: string;

  // ─────────────────────────────────────────────────────────────
  // Preserved Content (VERBATIM)
  // ─────────────────────────────────────────────────────────────

  /** Exact LLM response text */
  response: string;

  /** Original user query that generated this response */
  query: string;

  // ─────────────────────────────────────────────────────────────
  // Generation Context (Provenance)
  // ─────────────────────────────────────────────────────────────

  /** Human-readable provenance with names (v2+) */
  provenance?: SproutProvenance;

  /** @deprecated Use provenance.lens.id - Active persona/lens ID at time of generation */
  personaId: string | null;

  /** @deprecated Use provenance.journey.id - Active journey ID if in journey mode */
  journeyId: string | null;

  /** @deprecated Use provenance.hub.id - Topic hub that was matched (if any) */
  hubId: string | null;

  /** @deprecated Use provenance.node.id - Narrative card/node that triggered the query (if any) */
  nodeId: string | null;

  // ─────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────

  /** 
   * @deprecated Use stage instead 
   * Current status in the contribution lifecycle 
   */
  status: SproutStatus;

  /** Growth stage in botanical lifecycle (sprout-declarative-v1) */
  stage: SproutStage;

  /** ISO timestamp when promoted to 'established' (S4-SL-TierProgression) */
  promotedAt?: string;

  /** Research manifest for research sprouts (sprout-declarative-v1) */
  researchManifest?: ResearchManifest;

  /** Structured research document for json-render display (S2-SFR-Display) */
  researchDocument?: ResearchDocument;

  /** All generated artifacts, persisted across modal sessions (S25-GSE) */
  generatedArtifacts?: GeneratedArtifact[];

  // ─────────────────────────────────────────────────────────────
  // Canonical Research (S22-WP: Structured Output Architecture)
  // 100% of what the deep research API returns - DO NOT SUBSET
  // ─────────────────────────────────────────────────────────────

  /**
   * Canonical research output from deep research API.
   * Contains 100% of the structured output from `deliver_research_results` tool.
   * This is the single source of truth - refinement happens in Writer agent.
   * @see CanonicalResearch type definition for full structure
   */
  canonicalResearch?: CanonicalResearch;

  // ─────────────────────────────────────────────────────────────
  // Research Evidence (Sprint: research-template-wiring-v1)
  // Bridged from ResearchSprout when opening SproutFinishingRoom
  // LEGACY: Prefer canonicalResearch for deep research results
  // ─────────────────────────────────────────────────────────────

  /** @deprecated Use canonicalResearch - Research branches with evidence (from ResearchSprout) */
  researchBranches?: ResearchBranch[];

  /** @deprecated Use canonicalResearch - Collected evidence from research process (from ResearchSprout) */
  researchEvidence?: Evidence[];

  /** @deprecated Use canonicalResearch - Synthesis summary from research process (from ResearchSprout) */
  researchSynthesis?: {
    summary: string;
    insights: string[];
    confidence: number;
    synthesizedAt: string;
  };

  /** User-assigned tags for categorization */
  tags: string[];

  /** Optional human commentary on the sprout */
  notes: string | null;

  // ─────────────────────────────────────────────────────────────
  // Attribution (Future-Ready)
  // ─────────────────────────────────────────────────────────────

  /** Anonymous session ID for grouping sprouts */
  sessionId: string;

  /** Grove ID of creator (future: when auth is implemented) */
  creatorId: string | null;
}

/**
 * Sprout lifecycle status
 *
 * @deprecated Use SproutStage instead
 * MVP only uses 'sprout'. Future phases will implement:
 * - sapling: Under review by curator
 * - tree: Published to Knowledge Commons
 */
export type SproutStatus = 'sprout' | 'sapling' | 'tree';

// ─────────────────────────────────────────────────────────────
// Sprout Stage (8-stage botanical lifecycle) - sprout-declarative-v1
// ─────────────────────────────────────────────────────────────

/**
 * Botanical growth stages for sprouts.
 * Full lifecycle from Foundation Refactor Spec.
 * 
 * Stage progression:
 * - tender: Just captured, no research intent
 * - rooting: Has research manifest, accumulating clues
 * - branching: Prompt generated, ready to execute
 * - hardened: Research harvested, needs review
 * - grafted: Connected to other sprouts
 * - established: Promoted to Knowledge Commons
 * - dormant: Archived but preserved
 * - withered: Abandoned
 */
export type SproutStage =
  | 'tender'
  | 'rooting'
  | 'branching'
  | 'hardened'
  | 'grafted'
  | 'established'
  | 'dormant'
  | 'withered';

// ─────────────────────────────────────────────────────────────
// Research Manifest - sprout-declarative-v1
// ─────────────────────────────────────────────────────────────

/**
 * Research intent categories
 */
export type ResearchPurpose = 'skeleton' | 'thread' | 'challenge' | 'gap' | 'validate';

/**
 * Types of research clues
 */
export type ClueType = 'url' | 'citation' | 'author' | 'concept' | 'question';

/**
 * A single research clue - a hint for where to look
 */
export interface ResearchClue {
  /** Type of clue */
  type: ClueType;
  /** The clue value (URL, name, concept, etc.) */
  value: string;
  /** Optional annotation */
  note?: string;
}

/**
 * Research manifest for research-type sprouts.
 * Accumulates clues and directions until ready to generate a prompt.
 */
export interface ResearchManifest {
  /** Research intent */
  purpose: ResearchPurpose;

  /** Accumulated research clues */
  clues: ResearchClue[];

  /** Research directions/questions to pursue */
  directions: string[];

  /** Generated prompt (if any) */
  promptGenerated?: {
    templateId: string;
    generatedAt: string;
    rawPrompt: string;
  };

  /** Harvested research output */
  harvest?: {
    raw: string;
    harvestedAt: string;
    addedToKnowledge?: boolean;
  };
}

/**
 * localStorage schema for sprout persistence
 */
export interface SproutStorage {
  /** Schema version for migrations (v2 adds provenance, v3 adds stage) */
  version: 1 | 2 | 3;

  /** All captured sprouts */
  sprouts: Sprout[];

  /** Session ID for this browser (generated once) */
  sessionId: string;
}

/** Current storage schema version */
export const CURRENT_STORAGE_VERSION = 3;

/**
 * Options for capturing a sprout
 */
export interface SproutCaptureOptions {
  /** Tags to associate with the sprout */
  tags?: string[];

  /** Human annotation/notes */
  notes?: string;
}

/**
 * Context required to capture a sprout
 */
export interface SproutCaptureContext {
  /** The LLM response text */
  response: string;

  /** The user's query */
  query: string;

  /** Human-readable provenance (v2+) */
  provenance: SproutProvenance;
}

/**
 * @deprecated Legacy capture context - use SproutCaptureContext with provenance instead
 */
export interface LegacySproutCaptureContext {
  response: string;
  query: string;
  personaId: string | null;
  journeyId: string | null;
  hubId: string | null;
  nodeId: string | null;
}

/**
 * Aggregated sprout statistics
 */
export interface SproutStats {
  /** Total number of sprouts captured (all time) */
  totalSprouts: number;

  /** Number of sprouts in current session */
  sessionSprouts: number;

  /** Count of sprouts by topic hub */
  sproutsByHub: Record<string, number>;

  /** Count of sprouts by tag */
  sproutsByTag: Record<string, number>;

  /** Most recent sprouts (for display) */
  recentSprouts: Sprout[];
}

// ─────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────

/**
 * Check if an object is a valid Sprout
 */
export function isSprout(obj: unknown): obj is Sprout {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Partial<Sprout>;
  return (
    typeof s.id === 'string' &&
    typeof s.capturedAt === 'string' &&
    typeof s.response === 'string' &&
    typeof s.query === 'string' &&
    typeof s.status === 'string' &&
    Array.isArray(s.tags) &&
    typeof s.sessionId === 'string'
  );
}

/**
 * Check if storage object is valid (supports v1, v2, and v3)
 */
export function isValidSproutStorage(obj: unknown): obj is SproutStorage {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Partial<SproutStorage>;
  return (
    (s.version === 1 || s.version === 2 || s.version === 3) &&
    Array.isArray(s.sprouts) &&
    typeof s.sessionId === 'string'
  );
}

/**
 * Migrate v1 storage to v2 (adds empty provenance to existing sprouts)
 */
export function migrateStorageToV2(storage: SproutStorage): SproutStorage {
  if (storage.version === 2) return storage;

  // Migrate v1 sprouts: add empty provenance from legacy fields
  const migratedSprouts = storage.sprouts.map(sprout => ({
    ...sprout,
    provenance: sprout.provenance || {
      lens: sprout.personaId ? { id: sprout.personaId, name: sprout.personaId } : null,
      hub: sprout.hubId ? { id: sprout.hubId, name: sprout.hubId } : null,
      journey: sprout.journeyId ? { id: sprout.journeyId, name: sprout.journeyId } : null,
      node: sprout.nodeId ? { id: sprout.nodeId, name: sprout.nodeId } : null,
      knowledgeFiles: [],
      generatedAt: sprout.capturedAt
    } as SproutProvenance
  }));

  return {
    version: 2,
    sprouts: migratedSprouts,
    sessionId: storage.sessionId
  };
}

/**
 * Migrate v2 storage to v3 (adds stage field from status)
 * sprout-declarative-v1
 */
export function migrateStorageToV3(storage: SproutStorage): SproutStorage {
  if (storage.version === 3) return storage;

  // First ensure we're at v2
  const v2Storage = storage.version === 1 ? migrateStorageToV2(storage) : storage;

  // Map old status to new stage
  const mapStatusToStage = (status: SproutStatus): SproutStage => {
    const mapping: Record<SproutStatus, SproutStage> = {
      'sprout': 'tender',
      'sapling': 'rooting',
      'tree': 'established'
    };
    return mapping[status] ?? 'tender';
  };

  // Migrate v2 sprouts: add stage field
  const migratedSprouts = v2Storage.sprouts.map(sprout => ({
    ...sprout,
    stage: (sprout as Sprout).stage ?? mapStatusToStage(sprout.status),
    // researchManifest remains undefined for existing sprouts
  }));

  return {
    version: 3,
    sprouts: migratedSprouts,
    sessionId: v2Storage.sessionId
  };
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** localStorage key for sprout data */
export const SPROUT_STORAGE_KEY = 'grove-sprouts';

/** Maximum number of recent sprouts to return in stats */
export const MAX_RECENT_SPROUTS = 10;
