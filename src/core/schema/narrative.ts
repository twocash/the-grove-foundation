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
// TOPIC HUBS
// ============================================================================

export interface TopicHub {
  id: string;
  title: string;
  tags: string[];
  priority: number;
  enabled: boolean;
  primarySource: string;
  supportingSources: string[];
  expertFraming: string;
  keyPoints: string[];
  commonMisconceptions?: string[];
  personaOverrides?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
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
// FULL SCHEMA V2
// ============================================================================

export interface NarrativeSchemaV2 {
  version: "2.0";
  globalSettings: GlobalSettings;
  personas: Record<string, Persona>;
  cards: Record<string, Card>;
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
  return obj.version === "2.0" &&
         typeof obj.personas === 'object' &&
         typeof obj.cards === 'object' &&
         typeof obj.globalSettings === 'object';
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
