// src/bedrock/consoles/GardenConsole/types.ts
// Document types with enrichment fields aligned with Knowledge Commons
// Sprint: pipeline-inspector-v1 (Epic 1)
// Authority: ADR-001-knowledge-commons-unification.md

// =============================================================================
// Canonical Tier Values (per ADR-001)
// =============================================================================

/**
 * CANONICAL TIERS - Only these values are allowed.
 * Matches Sprout System lifecycle: seed → sprout → sapling → tree → grove
 *
 * PROHIBITED: 'seedling', 'oak', 'published', 'archived', 'draft'
 */
export const CANONICAL_TIERS = ['seed', 'sprout', 'sapling', 'tree', 'grove'] as const;
export type DocumentTier = (typeof CANONICAL_TIERS)[number];

// =============================================================================
// Document Types
// =============================================================================

export const DOCUMENT_TYPES = ['research', 'tutorial', 'reference', 'opinion', 'announcement', 'transcript'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const TEMPORAL_CLASSES = ['evergreen', 'current', 'dated', 'historical'] as const;
export type TemporalClass = (typeof TEMPORAL_CLASSES)[number];

export const ENRICHMENT_SOURCES = ['copilot', 'manual', 'bulk'] as const;
export type EnrichmentSource = (typeof ENRICHMENT_SOURCES)[number];

// =============================================================================
// Document Status (existing)
// =============================================================================

export type DocumentStatus = 'pending' | 'processing' | 'complete' | 'error';

// =============================================================================
// Provenance Context
// =============================================================================

export interface SourceContext {
  uploadedBy?: string;
  uploadSession?: string;
  originalPath?: string;
  sourceUrl?: string;
  capturedFrom?: 'upload' | 'api' | 'migration';
}

// =============================================================================
// Named Entities
// =============================================================================

export interface NamedEntities {
  people: string[];
  organizations: string[];
  concepts: string[];
  technologies: string[];
}

// =============================================================================
// Document Interface (Extended with Enrichment)
// =============================================================================

export interface Document {
  // Identity (existing)
  id: string;
  title: string;
  tier: DocumentTier;
  embedding_status: DocumentStatus;
  created_at: string;
  updated_at?: string;

  // Content (existing)
  content?: string;
  content_length?: number;
  file_type?: string;
  source_url?: string;

  // Provenance (new)
  source_context?: SourceContext;
  derived_from?: string[]; // Parent document UUIDs
  derivatives?: string[]; // Child documents (auto-populated)
  cited_by_sprouts?: string[];

  // Enrichment (new)
  keywords?: string[];
  summary?: string;
  document_type?: DocumentType;
  named_entities?: NamedEntities;
  questions_answered?: string[];
  temporal_class?: TemporalClass;

  // Usage Signals (new, read-only)
  retrieval_count?: number;
  retrieval_queries?: string[];
  last_retrieved_at?: string;
  utility_score?: number;

  // Editorial (new)
  editorial_notes?: string;
  enriched_at?: string;
  enriched_by?: EnrichmentSource;
  enrichment_model?: string;

  // Prompt extraction tracking (Sprint: extraction-pipeline-integration-v1)
  promptsExtracted?: boolean;
  promptExtractionAt?: string;
  promptExtractionCount?: number;
}

// =============================================================================
// Document Payload (for GroveObject wrapper)
// =============================================================================

/**
 * Document payload for GroveObject wrapper
 * Maps Document fields to payload structure for factory compatibility
 */
export interface DocumentPayload {
  // Core
  tier: DocumentTier;
  content?: string;
  source_url?: string;
  file_type?: string;
  content_length?: number;
  embedding_status: string;

  // Enrichment
  keywords: string[];
  summary: string;
  document_type?: DocumentType;
  named_entities: NamedEntities;
  questions_answered: string[];
  temporal_class: string;

  // Usage signals
  retrieval_count: number;
  retrieval_queries: string[];
  last_retrieved_at?: string;
  utility_score: number;

  // Provenance
  source_context: Record<string, unknown>;
  derived_from: string[];
  derivatives: string[];
  cited_by_sprouts: string[];

  // Editorial
  editorial_notes: string;
  enriched_at?: string;
  enriched_by?: EnrichmentSource;
  enrichment_model?: string;
}

// =============================================================================
// Copilot Result Types
// =============================================================================

export interface CopilotResult {
  preview: boolean;
  data?: unknown;
  message: string;
  error?: string;
}

export interface EnrichmentResult {
  keywords?: string[];
  summary?: string;
  named_entities?: NamedEntities;
  document_type?: DocumentType;
  questions_answered?: string[];
  temporal_class?: TemporalClass;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Type guard for valid tier values
 */
export function isValidTier(tier: string): tier is DocumentTier {
  return CANONICAL_TIERS.includes(tier as DocumentTier);
}

/**
 * Get next tier in lifecycle (for promotion suggestions)
 */
export function getNextTier(currentTier: DocumentTier): DocumentTier | null {
  const index = CANONICAL_TIERS.indexOf(currentTier);
  if (index < 0 || index >= CANONICAL_TIERS.length - 1) return null;
  return CANONICAL_TIERS[index + 1];
}

/**
 * Capitalize first letter for display
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
