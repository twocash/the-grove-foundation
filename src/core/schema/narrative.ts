// src/core/schema/narrative.ts
// Narrative Engine v2 Schema - no React dependencies

import { SectionId } from './base';

// ============================================================================
// PERSONA TYPES
// ============================================================================

export type PersonaColor = 'forest' | 'moss' | 'amber' | 'clay' | 'slate' | 'fig' | 'stone';
export type NarrativeStyle = 'evidence-first' | 'stakes-heavy' | 'mechanics-deep' | 'resolution-oriented';
export type OpeningPhase = 'hook' | 'stakes' | 'mechanics';
export type NoLensBehavior = 'nudge-after-exchanges' | 'never-nudge' | 'force-selection';

export interface ArcEmphasis {
  hook: 1 | 2 | 3 | 4;
  stakes: 1 | 2 | 3 | 4;
  mechanics: 1 | 2 | 3 | 4;
  evidence: 1 | 2 | 3 | 4;
  resolution: 1 | 2 | 3 | 4;
}

export interface Persona {
  id: string;
  publicLabel: string;           // User-facing name (e.g., "Concerned Citizen")
  description: string;           // One-liner for lens picker
  icon: string;                  // Lucide icon name (e.g., "Home", "GraduationCap")
  color: PersonaColor;           // Tailwind color class prefix
  enabled: boolean;              // Show/hide in Terminal lens picker

  // Narrative configuration
  toneGuidance: string;          // Injected into LLM prompt
  narrativeStyle: NarrativeStyle;
  arcEmphasis: ArcEmphasis;
  openingPhase: OpeningPhase;
  defaultThreadLength: number;   // 3-10 cards per journey

  // Extended prompt configuration
  systemPrompt?: string;         // Optional system prompt override
  openingTemplate?: string;      // Custom session start message
  vocabularyLevel?: VocabularyLevel;
  emotionalRegister?: EmotionalRegister;
  promptVersion?: number;        // Current version number for rollback tracking

  // Journey configuration
  entryPoints: string[];         // Card IDs shown at journey start
  suggestedThread: string[];     // AI-generated or manually curated sequence
}

// ============================================================================
// CARD TYPES
// ============================================================================

export interface Card {
  id: string;
  label: string;                 // User-facing question/prompt button text
  query: string;                 // LLM prompt instruction
  contextSnippet?: string;       // RAG context injected (verbatim quote)
  sectionId?: SectionId | string; // Grouping (stakes, architecture, etc.)
  next: string[];                // Connected card IDs for journey flow
  personas: string[];            // Which lenses see this card (or ['all'])
  sourceDoc?: string;            // RAG source reference
  createdAt?: string;            // ISO date
  isEntry?: boolean;             // Legacy: Is this a starting point?
}

// ============================================================================
// PERSONA PROMPT VERSION HISTORY
// ============================================================================

export type VocabularyLevel = 'accessible' | 'technical' | 'academic' | 'executive';
export type EmotionalRegister = 'warm' | 'neutral' | 'urgent' | 'measured';

export interface PersonaPromptConfig {
  systemPrompt?: string;
  toneGuidance: string;
  openingTemplate?: string;
  vocabularyLevel: VocabularyLevel;
  emotionalRegister: EmotionalRegister;
  arcEmphasis: ArcEmphasis;
  version: number;
  updatedAt: string;
}

export interface PersonaPromptVersion {
  personaId: string;
  version: number;
  config: PersonaPromptConfig;
  savedAt: string;
  savedBy?: string;
}

// ============================================================================
// TOPIC HUBS (Unified Registry Model)
// ============================================================================

/**
 * Hub lifecycle status for plugin management
 */
export type HubStatus = 'active' | 'draft' | 'archived';

/**
 * TopicHub - Unified registry entry combining routing metadata and file paths
 *
 * This interface merges what was previously split between:
 * - globalSettings.topicHubs (routing: tags, priority, enabled)
 * - hubs.json (files: path, primaryFile, supportingFiles)
 *
 * The result is a Single Source of Truth for hub configuration.
 */
export interface TopicHub {
  id: string;
  title: string;

  // Routing configuration (for query matching)
  tags: string[];
  priority: number;
  enabled: boolean;

  // File path configuration (for RAG loading)
  path: string;                   // e.g., "hubs/ratchet-effect/"
  primaryFile: string;            // e.g., "ratchet-deep-dive.md"
  supportingFiles: string[];      // Additional files in this hub
  maxBytes: number;               // Tier 2 budget for this hub

  // Expert framing (injected into prompts)
  expertFraming: string;
  keyPoints: string[];
  commonMisconceptions?: string[];
  personaOverrides?: Record<string, string>;

  // Plugin lifecycle
  status: HubStatus;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy TopicHub for backward compatibility during migration
 * @deprecated Use TopicHub instead
 */
export interface TopicHubLegacy {
  id: string;
  title: string;
  tags: string[];
  priority: number;
  enabled: boolean;
  primarySource: string;          // Old field name (was descriptive text)
  supportingSources: string[];    // Old field name (was descriptive text)
  expertFraming: string;
  keyPoints: string[];
  commonMisconceptions?: string[];
  personaOverrides?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// JOURNEYS
// ============================================================================

/**
 * Journey status for plugin lifecycle management
 * - 'active': Visible to users, fully functional
 * - 'draft': Only visible in Foundation admin, for AI Gardener preparation
 */
export type JourneyStatus = 'active' | 'draft';

/**
 * Journey - A narrative container that links cards to a knowledge hub
 *
 * Journeys provide the "foreign key" relationship between the UI flow
 * (cards, personas) and the RAG context (hubs).
 *
 * The `status` field supports the AI Gardener workflow:
 * - Gardener creates journeys in 'draft' status
 * - Admin reviews and promotes to 'active' status
 */
export interface Journey {
  id: string;
  title: string;
  description: string;

  // Entry point into the journey
  entryNode: string;              // Card ID where journey starts

  // Target "Aha" moment - the insight this journey builds toward
  targetAha: string;              // The key insight users should reach

  // Link to knowledge hub (enables "Deterministic Mode" RAG loading)
  linkedHubId?: string;           // Foreign key to TopicHub.id

  // Journey metrics
  estimatedMinutes: number;       // Expected time to complete

  // Visual metadata
  icon?: string;                  // Lucide icon name
  color?: string;                 // Tailwind color class

  // Plugin lifecycle (for AI Gardener support)
  status: JourneyStatus;          // 'active' | 'draft'

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// JOURNEY NODES (V2.1)
// ============================================================================

/**
 * JourneyNode - A narrative node that belongs to a specific journey
 *
 * Unlike Cards (which are persona-scoped), JourneyNodes are journey-scoped
 * and include sequencing information for linear narrative progression.
 */
export interface JourneyNode {
  id: string;
  label: string;                  // Lewis-style provocative question
  query: string;                  // LLM prompt instruction
  contextSnippet?: string;        // Verbatim RAG override

  // Section linkage
  sectionId?: string;             // Visual grouping

  // Journey association (THE KEY FIELD for Deterministic RAG)
  journeyId: string;              // Foreign key to Journey.id

  // Sequence within journey
  sequenceOrder?: number;         // 1, 2, 3... for linear progression

  // Navigation
  primaryNext?: string;           // Main continuation node
  alternateNext?: string[];       // Branch options
}

// ============================================================================
// DEFAULT CONTEXT (Tier 1)
// ============================================================================

/**
 * DefaultContext - Configuration for always-loaded Tier 1 RAG files
 */
export interface DefaultContext {
  path: string;                   // e.g., "_default/"
  maxBytes: number;               // Budget for Tier 1 (default: 15000)
  files: string[];                // Files to always load
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

// ============================================================================
// SYSTEM PROMPT VERSIONING
// ============================================================================

export interface SystemPromptVersion {
  id: string;              // "v1", "v2", etc.
  content: string;         // The full system prompt text
  label: string;           // User-provided description (e.g., "Warmer storytelling")
  createdAt: string;       // ISO timestamp
  isActive: boolean;       // Currently live version
}

// ============================================================================
// GLOBAL SETTINGS
// ============================================================================

export interface GlobalSettings {
  defaultToneGuidance: string;
  scholarModePromptAddition: string;
  noLensBehavior: NoLensBehavior;
  nudgeAfterExchanges: number;
  featureFlags: FeatureFlag[];
  autoGeneratedJourneyDepth: number;
  personaPromptVersions: PersonaPromptVersion[];
  topicHubs: TopicHub[];
  loadingMessages: string[];
  systemPromptVersions: SystemPromptVersion[];  // Version history for system voice
  activeSystemPromptId: string;                  // ID of currently active version
}

// ============================================================================
// LENS REALITY (Quantum Interface Content)
// ============================================================================

/**
 * Quote for problem section - CEO/authority voice
 */
export interface LensQuote {
  text: string;
  author: string;
  title: string;
}

/**
 * HeroContent - Headline and subtext for the landing page hero section
 */
export interface HeroContent {
  headline: string;
  subtext: string[];
}

/**
 * TensionContent - Problem section with quotes and tension framing
 */
export interface TensionContent {
  quotes: LensQuote[];
  tension: string[];
}

/**
 * TerminalWelcome - Lens-specific terminal greeting content
 *
 * When a user selects a lens, the terminal welcome message transforms
 * to match their perspective, mirroring how the landing page hero morphs.
 *
 * Sprint: Terminal Architecture Refactor v1.0
 * Sprint: Declarative UI Config v1 - Added placeholder field
 */
export interface TerminalWelcome {
  heading: string;           // e.g., "The Terminal." → "Research Interface."
  thesis: string;            // One-sentence value prop for this lens
  prompts: string[];         // 2-4 suggested starting questions
  footer?: string;           // Optional closing line
  placeholder?: string;      // Input field placeholder (Sprint: declarative-ui-config-v1)
}

/**
 * LensReality - Complete reality projection for a lens/persona
 *
 * This is what the Quantum Interface collapses to when a lens is selected.
 * Each lens can have a unique "reality" that reshapes the landing page.
 *
 * Sprint: Declarative UI Config v1 - Added navigation and foundation fields
 */
export interface LensReality {
  hero: HeroContent;
  problem: TensionContent;
  terminal?: TerminalWelcome;  // Lens-specific terminal greeting

  // Sprint: declarative-ui-config-v1 - Extended UI touchpoints
  navigation?: {
    ctaLabel?: string;       // Primary CTA button text
    ctaSubtext?: string;     // Optional subtext under CTA
    skipLabel?: string;      // Skip/dismiss link text
  };
  foundation?: {
    sectionLabels?: {
      explore?: string;      // "Explore" section label
      cultivate?: string;    // "Cultivate" section label
      grove?: string;        // "Grove Project" section label
      lenses?: string;       // Override "Lenses" nav label
      journeys?: string;     // Override "Journeys" nav label
      nodes?: string;        // Override "Nodes" nav label
    };
  };
}

// ============================================================================
// FULL SCHEMA V2.1 (Unified Registry Model)
// ============================================================================

/**
 * NarrativeSchemaV2 - The Single Source of Truth
 *
 * Version 2.1 adds:
 * - `hubs`: Top-level registry of TopicHub entries (replaces hubs.json)
 * - `journeys`: Narrative containers linking cards to hubs
 * - `defaultContext`: Tier 1 RAG configuration
 * - `gcsFileMapping`: Clean names to hashed GCS filenames
 *
 * This eliminates the "Split Brain" problem where routing config lived
 * in globalSettings.topicHubs while file paths lived in hubs.json.
 */
export interface NarrativeSchemaV2 {
  version: "2.0" | "2.1";
  globalSettings: GlobalSettings;
  personas: Record<string, Persona>;
  cards: Record<string, Card>;

  // NEW in V2.1: Top-level registries (replaces hubs.json)
  hubs?: Record<string, TopicHub>;          // The unified hub registry
  journeys?: Record<string, Journey>;       // Journey containers
  nodes?: Record<string, JourneyNode>;      // Journey-aware narrative nodes
  defaultContext?: DefaultContext;          // Tier 1 RAG config
  gcsFileMapping?: Record<string, string>;  // Clean name → hashed GCS name

  // Quantum Interface: Lens-specific reality content (v0.14+)
  lensRealities?: Record<string, LensReality>;  // Lens ID → collapsed reality
  defaultReality?: LensReality;                  // Fallback when no lens selected
}

// ============================================================================
// TERMINAL SESSION STATE
// ============================================================================

export interface TerminalSession {
  activeLens: string | null;
  scholarMode: boolean;
  currentThread: string[];
  currentPosition: number;
  visitedCards: string[];
  exchangeCount: number;
}

// ============================================================================
// LEGACY V1 COMPATIBILITY
// ============================================================================

export interface NarrativeNodeV1 {
  id: string;
  label: string;
  query: string;
  contextSnippet?: string;
  next: string[];
  sectionId?: SectionId;
  isEntry?: boolean;
  sourceFile?: string;
}

export interface NarrativeGraphV1 {
  version: string;
  nodes: Record<string, NarrativeNodeV1>;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isV1Schema(data: unknown): data is NarrativeGraphV1 {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj.version === "1.0" && typeof obj.nodes === 'object';
}

export function isV2Schema(data: unknown): data is NarrativeSchemaV2 {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  // Debug log (BUILD 2025-12-18T18:25Z)
  console.log('[Schema] isV2Schema checking version:', obj.version, 'hasJourneys:', 'journeys' in obj);

  // V2.0 requires personas and cards
  if (obj.version === "2.0") {
    return typeof obj.personas === 'object' &&
           typeof obj.cards === 'object' &&
           typeof obj.globalSettings === 'object';
  }

  // V2.1 uses journeys and nodes instead of personas/cards
  if (obj.version === "2.1") {
    return typeof obj.globalSettings === 'object' &&
           typeof obj.journeys === 'object' &&
           typeof obj.nodes === 'object';
  }

  return false;
}

/**
 * Check if schema has the unified registry (V2.1 features)
 */
export function hasUnifiedRegistry(data: unknown): boolean {
  if (!isV2Schema(data)) return false;
  return data.version === "2.1" && !!data.hubs;
}

export function nodeToCard(node: NarrativeNodeV1): Card {
  return {
    id: node.id,
    label: node.label,
    query: node.query,
    contextSnippet: node.contextSnippet,
    sectionId: node.sectionId,
    next: node.next,
    personas: ['all'],
    sourceDoc: node.sourceFile,
    isEntry: node.isEntry,
    createdAt: new Date().toISOString()
  };
}
