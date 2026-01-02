// src/bedrock/types/lens.ts
// Lens (Persona) payload type for Bedrock
// Migration: MIGRATION-001-lens

import type {
  PersonaColor,
  NarrativeStyle,
  ArcEmphasis,
  OpeningPhase,
  VocabularyLevel,
  EmotionalRegister,
} from '../../../data/narratives-schema';
import type { GroveObject } from '../../core/schema/grove-object';

/**
 * Lens (Persona) payload for Bedrock
 *
 * A Lens is fundamentally a prompt engineering object. The toneGuidance
 * field is injected into LLM system prompts to control response style.
 */
export interface LensPayload {
  // === IDENTITY (beyond meta) ===
  /** Theme color from earthy palette */
  color: PersonaColor;

  // === PROMPT ENGINEERING (the core function) ===
  /**
   * THE MAIN FIELD - Injected directly into LLM system prompt.
   * Controls vocabulary, metaphors, emphasis, and tone.
   * Example: "[PERSONA: Engineer] Get technical. Show architecture..."
   */
  toneGuidance: string;

  /** Optional complete system prompt override */
  systemPrompt?: string;

  /** Custom message shown at session start */
  openingTemplate?: string;

  // === NARRATIVE CONTROL ===
  /** High-level style preset */
  narrativeStyle: NarrativeStyle;

  /** Weights for each narrative phase (1-4 scale) */
  arcEmphasis: ArcEmphasis;

  /** Which phase to emphasize at conversation start */
  openingPhase: OpeningPhase;

  // === VOICE MODIFIERS ===
  /** Vocabulary complexity level */
  vocabularyLevel: VocabularyLevel;

  /** Emotional tone of responses */
  emotionalRegister: EmotionalRegister;

  // === JOURNEY BINDING ===
  /** Default number of cards per journey */
  defaultThreadLength: number;

  /** Card IDs shown at journey start */
  entryPoints: string[];

  /** Curated card sequence for guided exploration */
  suggestedThread: string[];
}

// =============================================================================
// Lens Type (GroveObject with LensPayload)
// =============================================================================

export type Lens = GroveObject<LensPayload>;

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
  PersonaColor,
  NarrativeStyle,
  ArcEmphasis,
  OpeningPhase,
  VocabularyLevel,
  EmotionalRegister,
};

// =============================================================================
// Enum value arrays for dropdowns
// =============================================================================

export const PERSONA_COLORS: PersonaColor[] = [
  'forest', 'moss', 'amber', 'clay', 'slate', 'fig', 'stone',
];

export const NARRATIVE_STYLES: { value: NarrativeStyle; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'evidence-first', label: 'Evidence First' },
  { value: 'stakes-heavy', label: 'Stakes Heavy' },
  { value: 'mechanics-deep', label: 'Mechanics Deep' },
  { value: 'resolution-oriented', label: 'Resolution Oriented' },
];

export const OPENING_PHASES: { value: OpeningPhase; label: string }[] = [
  { value: 'hook', label: 'Hook' },
  { value: 'stakes', label: 'Stakes' },
  { value: 'mechanics', label: 'Mechanics' },
];

export const VOCABULARY_LEVELS: { value: VocabularyLevel; label: string }[] = [
  { value: 'accessible', label: 'Accessible' },
  { value: 'technical', label: 'Technical' },
  { value: 'academic', label: 'Academic' },
  { value: 'executive', label: 'Executive' },
];

export const EMOTIONAL_REGISTERS: { value: EmotionalRegister; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'measured', label: 'Measured' },
];

// =============================================================================
// Color config with hex values for UI
// =============================================================================

export const LENS_COLOR_CONFIG: Record<PersonaColor, { hex: string; label: string }> = {
  forest: { hex: '#2F5C3B', label: 'Forest' },
  moss: { hex: '#7EA16B', label: 'Moss' },
  amber: { hex: '#E0A83B', label: 'Amber' },
  clay: { hex: '#D95D39', label: 'Clay' },
  slate: { hex: '#526F8A', label: 'Slate' },
  fig: { hex: '#6B4B56', label: 'Fig' },
  stone: { hex: '#9C9285', label: 'Stone' },
};

// =============================================================================
// Default values for new lens
// =============================================================================

export const DEFAULT_LENS_PAYLOAD: Omit<LensPayload, 'toneGuidance'> = {
  color: 'slate',
  narrativeStyle: 'balanced',
  arcEmphasis: { hook: 3, stakes: 3, mechanics: 3, evidence: 3, resolution: 3 },
  openingPhase: 'hook',
  vocabularyLevel: 'accessible',
  emotionalRegister: 'warm',
  defaultThreadLength: 5,
  entryPoints: [],
  suggestedThread: [],
};

// =============================================================================
// Type Guards
// =============================================================================

export function isLens(obj: unknown): obj is Lens {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.meta === 'object' &&
    o.meta !== null &&
    (o.meta as Record<string, unknown>).type === 'lens' &&
    typeof o.payload === 'object' &&
    o.payload !== null
  );
}

export function isLensPayload(obj: unknown): obj is LensPayload {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.color === 'string' &&
    typeof o.toneGuidance === 'string' &&
    typeof o.narrativeStyle === 'string'
  );
}
