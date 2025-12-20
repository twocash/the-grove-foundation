// Narrative Engine v2 Schema
// This file defines the TypeScript interfaces for the Lens-based narrative system

import { SectionId } from '../types';

// ============================================================================
// PERSONA TYPES
// ============================================================================

// Earthy palette based on design system
// Forest #2F5C3B, Moss #7EA16B, Clay #D95D39, Harvest Gold #E0A83B
// Taupe Stone #9C9285, Fig #6B4B56, Slate Blue #526F8A, Frost Blue #A8C2C7
export type PersonaColor = 'forest' | 'moss' | 'amber' | 'clay' | 'slate' | 'fig' | 'stone';
export type NarrativeStyle = 'evidence-first' | 'stakes-heavy' | 'mechanics-deep' | 'resolution-oriented' | 'balanced';
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

  // Extended prompt configuration (Sprint 7B)
  systemPrompt?: string;         // Optional system prompt override
  openingTemplate?: string;      // Custom session start message
  vocabularyLevel?: VocabularyLevel;    // accessible|technical|academic|executive
  emotionalRegister?: EmotionalRegister; // warm|neutral|urgent|measured
  promptVersion?: number;        // Current version number for rollback tracking

  // Journey configuration
  entryPoints: string[];         // Card IDs shown at journey start
  suggestedThread: string[];     // AI-generated or manually curated sequence
}

// ============================================================================
// CARD TYPES (Extended from NarrativeNode)
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
  systemPrompt?: string;          // Base system instruction (optional override)
  toneGuidance: string;           // How to speak
  openingTemplate?: string;       // Custom session start message
  vocabularyLevel: VocabularyLevel;
  emotionalRegister: EmotionalRegister;
  arcEmphasis: ArcEmphasis;
  version: number;
  updatedAt: string;              // ISO timestamp
}

export interface PersonaPromptVersion {
  personaId: string;
  version: number;
  config: PersonaPromptConfig;
  savedAt: string;                // ISO timestamp
  savedBy?: string;               // Optional: admin identifier
}

export const DEFAULT_PERSONA_PROMPT_CONFIG: Omit<PersonaPromptConfig, 'toneGuidance' | 'arcEmphasis'> = {
  vocabularyLevel: 'accessible',
  emotionalRegister: 'warm',
  version: 1,
  updatedAt: new Date().toISOString()
};

// ============================================================================
// V2.1 JOURNEY TYPES
// ============================================================================

export type JourneyStatus = 'active' | 'draft';

export interface Journey {
  id: string;
  title: string;
  description: string;
  entryNode: string;              // Node ID where journey starts
  targetAha: string;              // The key insight users should reach
  linkedHubId?: string;           // Foreign key to TopicHub.id
  estimatedMinutes: number;       // Expected time to complete
  icon?: string;                  // Lucide icon name
  color?: string;                 // Tailwind color class
  status: JourneyStatus;          // 'active' | 'draft'
  createdAt: string;
  updatedAt: string;
}

export interface JourneyNode {
  id: string;
  label: string;                  // User-facing question/prompt
  query: string;                  // LLM prompt instruction
  contextSnippet?: string;        // Verbatim RAG override
  sectionId?: string;             // Visual grouping
  journeyId: string;              // Foreign key to Journey.id
  sequenceOrder?: number;         // 1, 2, 3... for linear progression
  primaryNext?: string;           // Main continuation node
  alternateNext?: string[];       // Branch options
}

// ============================================================================
// V2.1 SESSION STATE (replaces thread-based state)
// ============================================================================

export interface JourneySessionState {
  activeJourneyId: string | null;   // Current journey (null = freestyle)
  currentNodeId: string | null;     // Current position in journey
  visitedNodes: string[];           // Nodes visited in this session
}

export const DEFAULT_JOURNEY_SESSION: JourneySessionState = {
  activeJourneyId: null,
  currentNodeId: null,
  visitedNodes: []
};

// ============================================================================
// TOPIC HUBS
// ============================================================================

export interface TopicHub {
  id: string;                      // Unique identifier
  title: string;                   // Display name (e.g., "The Ratchet Effect")
  tags: string[];                  // Routing tags to match against queries
  priority: number;                // Higher = match first (1-10)
  enabled: boolean;                // Can be disabled without deleting
  primarySource: string;           // Main knowledge base document path
  supportingSources: string[];     // Additional knowledge base documents
  expertFraming: string;           // Text injected into system prompt when hub matches
  keyPoints: string[];             // Must-hit points for responses
  commonMisconceptions?: string[]; // What to preemptively address
  personaOverrides?: Record<string, string>; // Persona-specific framing overrides
  createdAt: string;               // ISO timestamp
  updatedAt: string;               // ISO timestamp
}

export const DEFAULT_TOPIC_HUBS: TopicHub[] = [
  {
    id: 'ratchet-effect',
    title: 'The Ratchet Effect',
    tags: ['ratchet', 'capability propagation', 'frontier to edge', '21 months', 'seven month', '7 month'],
    priority: 8,
    enabled: true,
    primarySource: 'Grove_Ratchet_Deep_Dive',
    supportingSources: ['METR_research', 'hardware_data'],
    expertFraming: 'You are explaining the Ratchet Effect - the empirical pattern showing AI capability doubles every 7 months at frontier, with local models following 21 months behind. This creates a constant 8x capability gap but a rising absolute floor.',
    keyPoints: [
      '7-month capability doubling cycle at frontier',
      '21-month frontier-to-edge lag',
      'Constant 8x relative gap, but rising absolute floor',
      'Structural opportunity window for distributed infrastructure'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'infrastructure-bet',
    title: 'The $380B Infrastructure Bet',
    tags: ['$380 billion', 'hyperscaler', 'datacenter', 'infrastructure bet', 'data center', 'big tech spending'],
    priority: 8,
    enabled: true,
    primarySource: 'Grove_Economics_Deep_Dive',
    supportingSources: [],
    expertFraming: 'You are explaining the scale and implications of Big Tech\'s $380B annual AI infrastructure investment - the centralization risks, thermodynamic vulnerabilities, and what it means for AI ownership.',
    keyPoints: [
      'Microsoft, Google, Amazon, Meta spending $380B/year combined',
      'Capital concentration creates single points of failure',
      'Thermodynamic and regulatory vulnerabilities',
      'Rented vs owned infrastructure implications'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cognitive-split',
    title: 'The Cognitive Split',
    tags: ['cognitive split', 'hierarchical reasoning', 'two-phase', 'procedural strategic', 'constant hum', 'breakthrough'],
    priority: 7,
    enabled: true,
    primarySource: 'Hierarchical_Reasoning_Grove_Brief',
    supportingSources: [],
    expertFraming: 'You are explaining the Cognitive Split - how Grove\'s hybrid architecture separates "the constant hum" (routine local cognition) from "breakthrough moments" (cloud-assisted insight). This is the core of the efficiency-enlightenment loop.',
    keyPoints: [
      'Two-phase cognitive architecture: routine vs breakthrough',
      'Local handles 95% of operations (the constant hum)',
      'Cloud reserved for pivotal moments requiring frontier capability',
      'Agents remember cloud insights as their own - capability transfer'
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export interface FeatureFlag {
  id: string;                  // Unique key (e.g., 'custom-lens-in-picker')
  name: string;                // Display name
  description: string;         // What this flag controls
  enabled: boolean;            // Current state
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'custom-lens-in-picker',
    name: 'Show "Create Your Own" in Lens Picker',
    description: 'Users see custom lens option immediately in the lens picker',
    enabled: false
  },
  {
    id: 'journey-ratings',
    name: 'Journey Rating System',
    description: 'Show rating prompt after journey completion',
    enabled: true
  },
  {
    id: 'streaks-display',
    name: 'Show Streak Counter',
    description: 'Display streak counter in Terminal header',
    enabled: true
  },
  {
    id: 'feedback-transmission',
    name: 'Anonymous Feedback Submission',
    description: 'Allow anonymous feedback submission to Foundation',
    enabled: true
  },
  {
    id: 'auto-journey-generation',
    name: 'Auto-Generate Journeys',
    description: 'Generate first journey for custom persona users based on first question',
    enabled: true
  },
  {
    id: 'genesis-landing',
    name: 'Genesis Landing Experience',
    description: 'Show the new Jobs-style landing page instead of Classic',
    enabled: false
  }
];

// ============================================================================
// GLOBAL SETTINGS
// ============================================================================

export interface GlobalSettings {
  defaultToneGuidance: string;         // Base tone for all personas
  scholarModePromptAddition: string;   // Text appended when Scholar Mode is ON
  noLensBehavior: NoLensBehavior;      // How to handle users without a lens
  nudgeAfterExchanges: number;         // Exchanges before nudging no-lens users
  featureFlags: FeatureFlag[];         // Feature flag configurations
  autoGeneratedJourneyDepth: number;   // Number of cards in auto-generated journeys (default: 3)
  personaPromptVersions: PersonaPromptVersion[];  // Version history for rollback
  topicHubs: TopicHub[];               // Topic routing configuration
  loadingMessages: string[];           // ASCII messages shown while waiting for AI response
}

// ============================================================================
// FULL SCHEMA (Modern - has globalSettings)
// ============================================================================

export interface NarrativeSchemaV2 {
  version: string;  // Semantic versioning, e.g., "2.0", "2.1", "2.2"
  globalSettings: GlobalSettings;

  // V2.0 fields (personas/cards)
  personas?: Record<string, Persona>;
  cards?: Record<string, Card>;

  // V2.1 fields (journeys/nodes/hubs)
  journeys?: Record<string, Journey>;
  nodes?: Record<string, JourneyNode>;
  hubs?: Record<string, TopicHub>;
}

// ============================================================================
// TERMINAL SESSION STATE (V2.1 - Journey-based)
// ============================================================================

export interface TerminalSession {
  activeLens: string | null;       // Persona ID or null for "no lens"
  scholarMode: boolean;            // Existing toggle - preserved from v1

  // V2.1 Journey State (replaces currentThread/currentPosition)
  activeJourneyId: string | null;  // Current journey (null = freestyle)
  currentNodeId: string | null;    // Current position in journey
  visitedNodes: string[];          // Nodes visited in current journey

  // Legacy fields (deprecated, kept for backward compatibility)
  currentThread: string[];         // @deprecated - use activeJourneyId/currentNodeId
  currentPosition: number;         // @deprecated - use currentNodeId
  visitedCards: string[];          // For "don't repeat" logic
  exchangeCount: number;           // For nudge-after-exchanges logic
}

// ============================================================================
// LEGACY V1 COMPATIBILITY
// ============================================================================

// V1 NarrativeNode (from types.ts) - for migration
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
// MIGRATION HELPERS
// ============================================================================

/**
 * Check if data is v1 format
 */
// ============================================================================
// SCHEMA DETECTION (Semantic, not version-string based)
// ============================================================================
// We detect schema type by structure, not version strings.
// This is more robust as new versions can be added without changing checks.

export const CURRENT_SCHEMA_VERSION = "2.1";

/**
 * Check if schema is legacy format (nodes-only, no globalSettings)
 */
export function isLegacySchema(data: unknown): data is NarrativeGraphV1 {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.nodes === 'object' && !('globalSettings' in obj);
}

/**
 * Check if schema is modern format (has globalSettings)
 */
export function isModernSchema(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.globalSettings === 'object';
}

/**
 * Check if schema uses journey-based navigation
 */
export function hasJourneys(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.journeys === 'object' && typeof obj.nodes === 'object';
}

/**
 * Check if schema uses card-based navigation
 */
export function hasCards(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.cards === 'object' && typeof obj.personas === 'object';
}

/**
 * Check if data is v2+ format (modern schema with globalSettings)
 * @deprecated Use isModernSchema() for semantic check
 */
export function isV2Schema(data: unknown): data is NarrativeSchemaV2 {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  // Debug log for schema validation
  console.log('[Schema] isV2Schema checking:', {
    version: obj.version,
    hasJourneys: 'journeys' in obj,
    hasNodes: 'nodes' in obj,
    hasPersonas: 'personas' in obj,
    hasCards: 'cards' in obj
  });

  // Semantic check: modern schema has globalSettings
  return isModernSchema(data);
}

/**
 * @deprecated Use isLegacySchema() for semantic check
 */
export function isV1Schema(data: unknown): data is NarrativeGraphV1 {
  return isLegacySchema(data);
}

/**
 * Convert v1 NarrativeNode to v2 Card
 */
export function nodeToCard(node: NarrativeNodeV1): Card {
  return {
    id: node.id,
    label: node.label,
    query: node.query,
    contextSnippet: node.contextSnippet,
    sectionId: node.sectionId,
    next: node.next,
    personas: ['all'],  // Default: visible to all personas
    sourceDoc: node.sourceFile,
    isEntry: node.isEntry,
    createdAt: new Date().toISOString()
  };
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_LOADING_MESSAGES: string[] = [
  'asking the villagers...',
  'considering sources...',
  'applying slopes...',
  'gathering perspectives...',
  'weaving threads...',
  'consulting the grove...'
];

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  defaultToneGuidance: "",
  scholarModePromptAddition: "Give me the deep technical breakdown.",
  noLensBehavior: 'nudge-after-exchanges',
  nudgeAfterExchanges: 3,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  autoGeneratedJourneyDepth: 3,
  personaPromptVersions: [],
  topicHubs: DEFAULT_TOPIC_HUBS,
  loadingMessages: DEFAULT_LOADING_MESSAGES
};

export const DEFAULT_TERMINAL_SESSION: TerminalSession = {
  activeLens: 'freestyle',  // Default to freestyle persona instead of null
  scholarMode: false,

  // V2.1 Journey State
  activeJourneyId: null,
  currentNodeId: null,
  visitedNodes: [],

  // Legacy fields (deprecated)
  currentThread: [],
  currentPosition: 0,
  visitedCards: [],
  exchangeCount: 0
};

// ============================================================================
// PERSONA COLOR MAPPINGS (for Tailwind classes)
// ============================================================================

// Earthy color palette using Tailwind arbitrary values for custom hex colors
// Based on: Forest #2F5C3B, Moss #7EA16B, Clay #D95D39, Harvest Gold #E0A83B
//           Taupe Stone #9C9285, Fig #6B4B56, Slate Blue #526F8A
export const PERSONA_COLORS: Record<PersonaColor, {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
  dot: string;
}> = {
  forest: {
    bg: 'bg-[#2F5C3B]',
    bgLight: 'bg-[#2F5C3B]/10',
    text: 'text-[#2F5C3B]',
    border: 'border-[#2F5C3B]/30',
    dot: 'bg-[#2F5C3B]'
  },
  moss: {
    bg: 'bg-[#7EA16B]',
    bgLight: 'bg-[#7EA16B]/10',
    text: 'text-[#7EA16B]',
    border: 'border-[#7EA16B]/30',
    dot: 'bg-[#7EA16B]'
  },
  amber: {
    bg: 'bg-[#E0A83B]',
    bgLight: 'bg-[#E0A83B]/10',
    text: 'text-[#E0A83B]',
    border: 'border-[#E0A83B]/30',
    dot: 'bg-[#E0A83B]'
  },
  clay: {
    bg: 'bg-[#D95D39]',
    bgLight: 'bg-[#D95D39]/10',
    text: 'text-[#D95D39]',
    border: 'border-[#D95D39]/30',
    dot: 'bg-[#D95D39]'
  },
  slate: {
    bg: 'bg-[#526F8A]',
    bgLight: 'bg-[#526F8A]/10',
    text: 'text-[#526F8A]',
    border: 'border-[#526F8A]/30',
    dot: 'bg-[#526F8A]'
  },
  fig: {
    bg: 'bg-[#6B4B56]',
    bgLight: 'bg-[#6B4B56]/10',
    text: 'text-[#6B4B56]',
    border: 'border-[#6B4B56]/30',
    dot: 'bg-[#6B4B56]'
  },
  stone: {
    bg: 'bg-[#9C9285]',
    bgLight: 'bg-[#9C9285]/10',
    text: 'text-[#9C9285]',
    border: 'border-[#9C9285]/30',
    dot: 'bg-[#9C9285]'
  }
};

// Legacy color mapping for backwards compatibility with old stored data
// Maps old color names to new earthy palette
const LEGACY_COLOR_MAP: Record<string, PersonaColor> = {
  'emerald': 'forest',
  'blue': 'slate',
  'rose': 'clay',
  'violet': 'fig',
  'purple': 'fig'
};

/**
 * Get persona colors with legacy fallback support
 * Handles old color names that may still exist in stored data
 */
export function getPersonaColors(color: string) {
  // Try direct lookup first
  if (color in PERSONA_COLORS) {
    return PERSONA_COLORS[color as PersonaColor];
  }
  // Try legacy mapping
  const mappedColor = LEGACY_COLOR_MAP[color];
  if (mappedColor) {
    return PERSONA_COLORS[mappedColor];
  }
  // Default fallback
  return PERSONA_COLORS.stone;
}
