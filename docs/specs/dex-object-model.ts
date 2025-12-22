// specs/dex-object-model.ts
// ═══════════════════════════════════════════════════════════════════════════
// DEX OBJECT MODEL — Unified Type Definitions for The Grove Platform
// ═══════════════════════════════════════════════════════════════════════════
// 
// This file is the authoritative source for all DEX stack type definitions.
// All implementations must conform to these schemas.
//
// Version: 2.0 (Field-Aware)
// Last Updated: December 2024
//
// Cross-References:
// - FIELD_ARCHITECTURE.md — Field specification
// - TRELLIS.md — DEX stack documentation
// - SPROUT_SYSTEM.md — Insight capture lifecycle
// ═══════════════════════════════════════════════════════════════════════════

// ============================================================================
// PART 1: FIELD TYPES
// ============================================================================

export type FieldType = 'standard' | 'forked' | 'composite' | 'template';
export type FieldVisibility = 'private' | 'organization' | 'public';
export type FieldStatus = 'active' | 'archived' | 'deleted';

/**
 * Namespaced Entity Reference
 * 
 * All entities within a Field have a namespaced identifier:
 * {namespace}.{local-id} (e.g., "grove.strategic-insight")
 */
export interface NamespacedEntityRef {
  /** Full identifier (e.g., "legal.contract-clause") */
  id: string;
  
  /** Namespace prefix (e.g., "legal") */
  namespace: string;
  
  /** Local identifier (e.g., "contract-clause") */
  localId: string;
  
  /** UUID of originating Field */
  sourceFieldId: string;
  
  /** Originating Field name (denormalized) */
  sourceFieldName: string;
  
  /** Relationship to current Field */
  relationship: 'native' | 'inherited' | 'forked';
  
  /** User who created original */
  originalCreator: string;
  
  /** Fork lineage (Field IDs) */
  forkChain?: string[];
}

/**
 * Collaborator with role-based access
 */
export interface Collaborator {
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  addedAt: Date;
  addedBy: string;
}

/**
 * Attribution metadata for Knowledge Commons
 */
export interface Attribution {
  /** Original creator */
  originalCreator: {
    userId: string;
    organizationId?: string;
    createdAt: Date;
  };
  
  /** Fork lineage */
  forkChain: {
    fieldId: string;
    fieldName: string;
    forkedAt: Date;
    forkedBy: string;
  }[];
  
  /** Contributors */
  contributors: {
    userId: string;
    contributionType: 'create' | 'edit' | 'review' | 'promote';
    contributedAt: Date;
  }[];
  
  /** Adoption metrics */
  adoption: {
    forkCount: number;
    usageCount: number;
    lastUsed: Date;
  };
  
  /** Credit accumulation (future) */
  credits?: {
    earned: number;
    pending: number;
    lastPayout: Date;
  };
}

/**
 * RAG configuration for a Field
 */
export interface FieldRAGConfig {
  /** Primary vector store collection */
  collectionId: string;
  
  /** Document count */
  documentCount: number;
  
  /** Last indexing timestamp */
  lastIndexed: Date;
  
  /** Indexing status */
  indexingStatus: 'idle' | 'indexing' | 'error';
}

/**
 * RAG configuration for Composite Fields
 */
export interface CompositeRAGConfig {
  /** Merged collection ID */
  compositeCollectionId: string;
  
  /** Parent collection references */
  parentCollections: {
    collectionId: string;
    fieldId: string;
    namespace: string;
    documentCount: number;
  }[];
  
  /** Document-level source tracking */
  documentSourceMap: {
    [documentId: string]: {
      sourceFieldId: string;
      namespace: string;
      originalCollectionId: string;
    };
  };
  
  /** Retrieval strategy */
  retrievalStrategy: 'unified' | 'weighted' | 'source-balanced' | 'query-routed';
  
  /** Namespace weights (for 'weighted' strategy) */
  namespaceWeights?: { [namespace: string]: number };
}

/**
 * Marketplace listing metadata
 */
export interface MarketplaceListing {
  isPublished: boolean;
  publishedAt?: Date;
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  forkCount: number;
  featured: boolean;
}

/**
 * Field statistics
 */
export interface FieldStats {
  sproutCount: number;
  sessionCount: number;
  activeExplorers: number;
  lastActivity: Date;
}

/**
 * Field — The core organizational unit for knowledge exploration
 * 
 * A Field is a bounded knowledge domain with:
 * - RAG collection (vector-indexed documents)
 * - Exploration tools (Lenses, Journeys, Nodes, Card Definitions)
 * - Captured insights (Sprouts)
 * - Access control and attribution
 */
export interface Field {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════
  
  /** UUID */
  id: string;
  
  /** URL-friendly identifier */
  slug: string;
  
  /** Display name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Icon (emoji or reference) */
  icon?: string;
  
  /** Field classification */
  fieldType: FieldType;
  
  // ═══════════════════════════════════════════════════════════
  // OWNERSHIP & ACCESS
  // ═══════════════════════════════════════════════════════════
  
  /** Creator user ID */
  createdBy: string;
  
  /** Owning organization (if org-owned) */
  organizationId?: string;
  
  /** Visibility level */
  visibility: FieldVisibility;
  
  /** Collaborators with roles */
  collaborators: Collaborator[];
  
  // ═══════════════════════════════════════════════════════════
  // KNOWLEDGE SOURCE
  // ═══════════════════════════════════════════════════════════
  
  /** RAG configuration */
  rag: FieldRAGConfig;
  
  // ═══════════════════════════════════════════════════════════
  // EXPLORATION CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  
  /** Entity references (namespaced) */
  entities: {
    nodes: NamespacedEntityRef[];
    journeys: NamespacedEntityRef[];
    lenses: NamespacedEntityRef[];
    cardDefinitions: NamespacedEntityRef[];
  };
  
  // ═══════════════════════════════════════════════════════════
  // COMPOSITE FIELD SPECIFICS (null if not composite)
  // ═══════════════════════════════════════════════════════════
  
  composite?: {
    parentFieldIds: string[];
    namespaceMap: { [fieldId: string]: string };
    mergeStrategy: 'union' | 'intersection' | 'custom';
    ragConfig: CompositeRAGConfig;
  };
  
  // ═══════════════════════════════════════════════════════════
  // FORK LINEAGE (null if not forked)
  // ═══════════════════════════════════════════════════════════
  
  fork?: {
    sourceFieldId: string;
    sourceFieldName: string;
    forkedAt: Date;
    divergencePoint: string;
  };
  
  // ═══════════════════════════════════════════════════════════
  // ATTRIBUTION
  // ═══════════════════════════════════════════════════════════
  
  attribution: Attribution;
  
  // ═══════════════════════════════════════════════════════════
  // MARKETPLACE
  // ═══════════════════════════════════════════════════════════
  
  marketplace?: MarketplaceListing;
  
  // ═══════════════════════════════════════════════════════════
  // METRICS
  // ═══════════════════════════════════════════════════════════
  
  stats: FieldStats;
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  
  status: FieldStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PART 2: SPROUT TYPES
// ============================================================================

export type SproutStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type SproutContentType = 'text' | 'card' | 'synthesis';

/**
 * RAG source with namespace tracking
 */
export interface RAGSource {
  documentId: string;
  namespace: string;
  relevanceScore: number;
}

/**
 * Sprout generation provenance
 */
export interface SproutProvenance {
  /** Terminal session ID */
  sessionId: string;
  
  /** User's query */
  query: string;
  
  /** Active Lens (namespaced) */
  lensId?: string;
  lensNamespace?: string;
  
  /** Active Journey (namespaced) */
  journeyId?: string;
  journeyNamespace?: string;
  
  /** Triggered Node */
  nodeId?: string;
  
  /** RAG sources with namespace tracking */
  ragSources: RAGSource[];
}

/**
 * Composite Field context for cross-domain Sprouts
 */
export interface CompositeContext {
  /** Parent namespaces that contributed */
  sourceNamespaces: string[];
  
  /** Dominant source (if identifiable) */
  primaryNamespace?: string;
  
  /** Parent Field IDs this could promote to */
  canPromoteTo: string[];
  
  /** If promoted to parent Field */
  promotedTo?: {
    fieldId: string;
    promotedAt: Date;
  };
}

/**
 * Sprout — Atomic unit of captured insight
 * 
 * A Sprout is an LLM output captured with full provenance,
 * always scoped to a Field.
 */
export interface Sprout {
  id: string;
  
  // ═══════════════════════════════════════════════════════════
  // FIELD CONTEXT (REQUIRED)
  // ═══════════════════════════════════════════════════════════
  
  /** The Field this Sprout belongs to */
  fieldId: string;
  
  /** URL-friendly Field identifier */
  fieldSlug: string;
  
  /** Field name (denormalized) */
  fieldName: string;
  
  // ═══════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════
  
  /** The captured response (verbatim) */
  content: string;
  
  /** Content classification */
  contentType: SproutContentType;
  
  // ═══════════════════════════════════════════════════════════
  // GENERATION PROVENANCE
  // ═══════════════════════════════════════════════════════════
  
  generatedFrom: SproutProvenance;
  
  // ═══════════════════════════════════════════════════════════
  // COMPOSITE CONTEXT (if captured in composite Field)
  // ═══════════════════════════════════════════════════════════
  
  compositeContext?: CompositeContext;
  
  // ═══════════════════════════════════════════════════════════
  // CURATION
  // ═══════════════════════════════════════════════════════════
  
  status: SproutStatus;
  curatedBy?: string;
  curatedAt?: Date;
  tags: string[];
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PART 3: TERMINAL SESSION TYPES
// ============================================================================

export type SessionStatus = 'active' | 'completed' | 'abandoned';

/**
 * Chat message in a Terminal session
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  
  /** Metadata for assistant messages */
  metadata?: {
    lensId?: string;
    journeyId?: string;
    nodeId?: string;
    ragSources?: RAGSource[];
  };
}

/**
 * Terminal Session — A conversation within a Field
 * 
 * Sessions are always scoped to a single Field.
 * Field switching creates a new session (clean break).
 */
export interface TerminalSession {
  id: string;
  
  // ═══════════════════════════════════════════════════════════
  // FIELD CONTEXT (IMMUTABLE PER SESSION)
  // ═══════════════════════════════════════════════════════════
  
  /** The Field this session belongs to */
  fieldId: string;
  
  /** URL-friendly Field identifier */
  fieldSlug: string;
  
  /** Field name (denormalized) */
  fieldName: string;
  
  // ═══════════════════════════════════════════════════════════
  // ACTIVE CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  
  /** Active Lens (namespaced, e.g., "grove.skeptic") */
  activeLensId?: string;
  activeLensNamespace?: string;
  
  /** Active Journey (namespaced) */
  activeJourneyId?: string;
  activeJourneyNamespace?: string;
  
  /** Current position in Journey */
  currentNodeId?: string;
  visitedNodes: string[];
  
  /** Scholar mode toggle */
  scholarMode: boolean;
  
  // ═══════════════════════════════════════════════════════════
  // CONVERSATION
  // ═══════════════════════════════════════════════════════════
  
  messages: ChatMessage[];
  
  /** Exchange count (for entropy detection) */
  exchangeCount: number;
  
  // ═══════════════════════════════════════════════════════════
  // SESSION METADATA
  // ═══════════════════════════════════════════════════════════
  
  userId: string;
  startedAt: Date;
  lastActivity: Date;
  status: SessionStatus;
}

// ============================================================================
// PART 4: LENS TYPES
// ============================================================================

export type NarrativeStyle = 
  | 'evidence-first' 
  | 'stakes-heavy' 
  | 'mechanics-deep' 
  | 'resolution-oriented';

export type NarrativePhase = 'hook' | 'stakes' | 'mechanics' | 'evidence' | 'resolution';

export interface ArcEmphasis {
  hook: 1 | 2 | 3 | 4;
  stakes: 1 | 2 | 3 | 4;
  mechanics: 1 | 2 | 3 | 4;
  evidence: 1 | 2 | 3 | 4;
  resolution: 1 | 2 | 3 | 4;
}

/**
 * Lens — A perspective configuration for exploration
 * 
 * Lenses shape how the Field speaks to different audiences.
 * Each Lens belongs to a Field and has a namespaced identifier.
 */
export interface Lens {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY (NAMESPACED)
  // ═══════════════════════════════════════════════════════════
  
  /** Full namespaced ID (e.g., "grove.skeptic") */
  id: string;
  
  /** Namespace (e.g., "grove") */
  namespace: string;
  
  /** Local ID (e.g., "skeptic") */
  localId: string;
  
  /** Owning Field */
  fieldId: string;
  
  // ═══════════════════════════════════════════════════════════
  // DISPLAY
  // ═══════════════════════════════════════════════════════════
  
  publicLabel: string;
  description: string;
  icon: string;
  color: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate' | 'violet' | 'purple';
  enabled: boolean;
  
  // ═══════════════════════════════════════════════════════════
  // NARRATIVE CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  
  toneGuidance: string;
  narrativeStyle: NarrativeStyle;
  arcEmphasis: ArcEmphasis;
  openingPhase: NarrativePhase;
  defaultThreadLength: number;
  
  // ═══════════════════════════════════════════════════════════
  // JOURNEY CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  
  /** Entry point Journey IDs (namespaced) */
  entryPoints: string[];
  
  /** Suggested Journey sequence */
  suggestedThread: string[];
  
  // ═══════════════════════════════════════════════════════════
  // ATTRIBUTION
  // ═══════════════════════════════════════════════════════════
  
  createdBy: string;
  forkedFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PART 5: JOURNEY TYPES
// ============================================================================

export type JourneyStatus = 'draft' | 'published' | 'archived';

/**
 * Journey Node — A step in an exploration path
 */
export interface JourneyNode {
  id: string;
  title: string;
  description: string;
  query: string;
  
  /** Node type */
  type: 'entry' | 'waypoint' | 'exit';
  
  /** Connected nodes */
  nextNodes: string[];
  previousNodes: string[];
}

/**
 * Journey — A curated exploration path through Field knowledge
 * 
 * Journeys guide users through connected concepts.
 * Each Journey belongs to a Field and has a namespaced identifier.
 */
export interface Journey {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY (NAMESPACED)
  // ═══════════════════════════════════════════════════════════
  
  /** Full namespaced ID (e.g., "grove.architecture-deep-dive") */
  id: string;
  
  /** Namespace (e.g., "grove") */
  namespace: string;
  
  /** Local ID (e.g., "architecture-deep-dive") */
  localId: string;
  
  /** Owning Field */
  fieldId: string;
  
  // ═══════════════════════════════════════════════════════════
  // DISPLAY
  // ═══════════════════════════════════════════════════════════
  
  title: string;
  description: string;
  icon: string;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // ═══════════════════════════════════════════════════════════
  // STRUCTURE
  // ═══════════════════════════════════════════════════════════
  
  nodes: JourneyNode[];
  entryNodeId: string;
  
  /** Topic clusters this Journey covers */
  clusters: string[];
  
  // ═══════════════════════════════════════════════════════════
  // ENTRY CONDITIONS
  // ═══════════════════════════════════════════════════════════
  
  /** Entropy triggers */
  entropyThreshold?: number;
  triggerClusters?: string[];
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  
  status: JourneyStatus;
  createdBy: string;
  forkedFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PART 6: CARD DEFINITION TYPES
// ============================================================================

/**
 * Card Definition — A template for insight capture
 * 
 * Card Definitions specify what kinds of insights can be
 * harvested within a Field.
 */
export interface CardDefinition {
  // ═══════════════════════════════════════════════════════════
  // IDENTITY (NAMESPACED)
  // ═══════════════════════════════════════════════════════════
  
  /** Full namespaced ID (e.g., "legal.contract-clause") */
  id: string;
  
  /** Namespace (e.g., "legal") */
  namespace: string;
  
  /** Local ID (e.g., "contract-clause") */
  localId: string;
  
  /** Owning Field */
  fieldId: string;
  
  // ═══════════════════════════════════════════════════════════
  // DISPLAY
  // ═══════════════════════════════════════════════════════════
  
  title: string;
  description: string;
  icon: string;
  color: string;
  
  // ═══════════════════════════════════════════════════════════
  // TEMPLATE
  // ═══════════════════════════════════════════════════════════
  
  /** Fields to capture */
  fields: {
    name: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'tags';
    required: boolean;
    options?: string[];
    placeholder?: string;
  }[];
  
  /** Validation rules */
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  
  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  
  createdBy: string;
  forkedFrom?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PART 7: HELPER TYPE GUARDS
// ============================================================================

export function isCompositeField(field: Field): boolean {
  return field.fieldType === 'composite' && !!field.composite;
}

export function isForkedField(field: Field): boolean {
  return field.fieldType === 'forked' && !!field.fork;
}

export function hasCompositeContext(sprout: Sprout): boolean {
  return !!sprout.compositeContext;
}

export function canPromote(sprout: Sprout): boolean {
  return !!sprout.compositeContext?.canPromoteTo?.length;
}

// ============================================================================
// PART 8: NAMESPACE UTILITIES
// ============================================================================

/**
 * Parse a namespaced ID into components
 */
export function parseNamespacedId(id: string): { namespace: string; localId: string } {
  const [namespace, ...rest] = id.split('.');
  return {
    namespace,
    localId: rest.join('.')
  };
}

/**
 * Create a namespaced ID from components
 */
export function createNamespacedId(namespace: string, localId: string): string {
  return `${namespace}.${localId}`;
}

/**
 * Check if an entity belongs to a namespace
 */
export function isInNamespace(id: string, namespace: string): boolean {
  return id.startsWith(`${namespace}.`);
}
