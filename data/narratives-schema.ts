// Narrative Engine v2 Schema
// This file defines the TypeScript interfaces for the Lens-based narrative system

import { SectionId } from '../types';

// ============================================================================
// PERSONA TYPES
// ============================================================================

export type PersonaColor = 'emerald' | 'amber' | 'blue' | 'rose' | 'slate' | 'violet';
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
// GLOBAL SETTINGS
// ============================================================================

export interface GlobalSettings {
  defaultToneGuidance: string;         // Base tone for all personas
  scholarModePromptAddition: string;   // Text appended when Scholar Mode is ON
  noLensBehavior: NoLensBehavior;      // How to handle users without a lens
  nudgeAfterExchanges: number;         // Exchanges before nudging no-lens users
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
  activeLens: string | null;     // Persona ID or null for "no lens"
  scholarMode: boolean;          // Existing toggle - preserved from v1
  currentThread: string[];       // Card IDs in current journey
  currentPosition: number;       // Index in thread
  visitedCards: string[];        // For "don't repeat" logic
  exchangeCount: number;         // For nudge-after-exchanges logic
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
export function isV1Schema(data: unknown): data is NarrativeGraphV1 {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj.version === "1.0" && typeof obj.nodes === 'object';
}

/**
 * Check if data is v2 format
 */
export function isV2Schema(data: unknown): data is NarrativeSchemaV2 {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj.version === "2.0" &&
         typeof obj.personas === 'object' &&
         typeof obj.cards === 'object' &&
         typeof obj.globalSettings === 'object';
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

export const DEFAULT_GLOBAL_SETTINGS: GlobalSettings = {
  defaultToneGuidance: "",
  scholarModePromptAddition: "Give me the deep technical breakdown.",
  noLensBehavior: 'nudge-after-exchanges',
  nudgeAfterExchanges: 3
};

export const DEFAULT_TERMINAL_SESSION: TerminalSession = {
  activeLens: null,
  scholarMode: false,
  currentThread: [],
  currentPosition: 0,
  visitedCards: [],
  exchangeCount: 0
};

// ============================================================================
// PERSONA COLOR MAPPINGS (for Tailwind classes)
// ============================================================================

export const PERSONA_COLORS: Record<PersonaColor, {
  bg: string;
  bgLight: string;
  text: string;
  border: string;
  dot: string;
}> = {
  emerald: {
    bg: 'bg-emerald-600',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500'
  },
  amber: {
    bg: 'bg-amber-600',
    bgLight: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-300',
    dot: 'bg-amber-500'
  },
  blue: {
    bg: 'bg-blue-600',
    bgLight: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-300',
    dot: 'bg-blue-500'
  },
  rose: {
    bg: 'bg-rose-600',
    bgLight: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-300',
    dot: 'bg-rose-500'
  },
  slate: {
    bg: 'bg-slate-600',
    bgLight: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-500'
  },
  violet: {
    bg: 'bg-violet-600',
    bgLight: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-300',
    dot: 'bg-violet-500'
  }
};
