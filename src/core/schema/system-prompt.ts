// src/core/schema/system-prompt.ts
// SystemPrompt schema for managing AI system prompts in the Experiences Console
// Sprint: experiences-console-v1

import type { GroveObject } from './grove-object';

// =============================================================================
// Types
// =============================================================================

/**
 * How the AI should structure responses
 */
export type ResponseMode = 'architect' | 'librarian' | 'contemplative';

/**
 * How the AI should close its responses
 */
export type ClosingBehavior = 'navigation' | 'question' | 'open';

/**
 * Environment targeting for system prompts
 */
export type PromptEnvironment = 'production' | 'staging' | 'development';

// =============================================================================
// Constants
// =============================================================================

/**
 * Available response modes with descriptions
 */
export const RESPONSE_MODES: { value: ResponseMode; label: string; description: string }[] = [
  {
    value: 'architect',
    label: 'Architect',
    description: 'Structured, organized responses with clear sections',
  },
  {
    value: 'librarian',
    label: 'Librarian',
    description: 'Reference-rich responses with citations and context',
  },
  {
    value: 'contemplative',
    label: 'Contemplative',
    description: 'Thoughtful, reflective responses that explore nuance',
  },
];

/**
 * Available closing behaviors with descriptions
 */
export const CLOSING_BEHAVIORS: { value: ClosingBehavior; label: string; description: string }[] = [
  {
    value: 'navigation',
    label: 'Navigation',
    description: 'End with suggested paths to explore',
  },
  {
    value: 'question',
    label: 'Question',
    description: 'End with a thought-provoking question',
  },
  {
    value: 'open',
    label: 'Open',
    description: 'End naturally without explicit call-to-action',
  },
];

/**
 * Prompt section metadata for editors and wizards
 */
export const PROMPT_SECTIONS = {
  identity: {
    label: 'Identity',
    description: 'Who is the AI? What role does it play?',
    placeholder: 'You are Grove, a research companion exploring the future of distributed AI...',
    maxLength: 500,
  },
  voiceGuidelines: {
    label: 'Voice Guidelines',
    description: 'How should the AI communicate? Tone, style, register.',
    placeholder: 'Speak with intellectual warmth. Balance precision with accessibility...',
    maxLength: 500,
  },
  structureRules: {
    label: 'Structure Rules',
    description: 'How should responses be organized?',
    placeholder: 'Use clear sections. Lead with the key insight. Support with evidence...',
    maxLength: 500,
  },
  knowledgeInstructions: {
    label: 'Knowledge Instructions',
    description: 'How should the AI use and reference knowledge?',
    placeholder: 'Draw from the Grove white paper. Cite specific concepts. Connect ideas...',
    maxLength: 500,
  },
  boundaries: {
    label: 'Boundaries',
    description: 'What should the AI avoid? Limits and guardrails.',
    placeholder: 'Do not make up statistics. Acknowledge uncertainty. Stay on topic...',
    maxLength: 500,
  },
} as const;

// =============================================================================
// Payload Interface
// =============================================================================

/**
 * SystemPrompt payload containing decomposed prompt sections
 */
export interface SystemPromptPayload {
  // === Prompt Content (5 sections) ===
  /** Core identity and role definition */
  identity: string;
  /** Communication style and tone guidelines */
  voiceGuidelines: string;
  /** Response organization rules */
  structureRules: string;
  /** Knowledge usage instructions */
  knowledgeInstructions: string;
  /** Guardrails and limitations */
  boundaries: string;

  // === Behavior Configuration ===
  /** Response structuring mode */
  responseMode: ResponseMode;
  /** How to close responses */
  closingBehavior: ClosingBehavior;

  // === Output Tag Toggles ===
  /** Include breadcrumb navigation tags */
  useBreadcrumbTags: boolean;
  /** Include topic classification tags */
  useTopicTags: boolean;
  /** Include navigation block suggestions */
  useNavigationBlocks: boolean;

  // === Environment & Versioning ===
  /** Target environment (null = all environments) */
  environment?: PromptEnvironment;
  /** Version number (increments on createVersion) */
  version: number;
  /** Change description for this version */
  changelog?: string;
  /** Reference to previous version for history chain */
  previousVersionId?: string;

  // === Provenance (DEX: Provenance as Infrastructure) ===
  /** User ID who created this prompt (null for system-generated) */
  createdByUserId?: string | null;
  /** User ID who last modified this prompt */
  updatedByUserId?: string | null;
}

/**
 * SystemPrompt as a GroveObject
 */
export type SystemPrompt = GroveObject<SystemPromptPayload>;

// =============================================================================
// Defaults
// =============================================================================

/**
 * Default payload for new SystemPrompt objects
 */
export const DEFAULT_SYSTEM_PROMPT_PAYLOAD: SystemPromptPayload = {
  identity: '',
  voiceGuidelines: '',
  structureRules: '',
  knowledgeInstructions: '',
  boundaries: '',
  responseMode: 'architect',
  closingBehavior: 'navigation',
  useBreadcrumbTags: true,
  useTopicTags: true,
  useNavigationBlocks: true,
  version: 1,
  createdByUserId: null,
  updatedByUserId: null,
};

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Type guard to check if an object is a SystemPrompt
 */
export function isSystemPrompt(obj: unknown): obj is SystemPrompt {
  if (typeof obj !== 'object' || obj === null) return false;

  const candidate = obj as Record<string, unknown>;

  // Check meta
  if (typeof candidate.meta !== 'object' || candidate.meta === null) return false;
  const meta = candidate.meta as Record<string, unknown>;
  if (meta.type !== 'system-prompt') return false;

  // Check payload
  if (typeof candidate.payload !== 'object' || candidate.payload === null) return false;
  const payload = candidate.payload as Record<string, unknown>;

  // Validate required payload fields
  return (
    typeof payload.identity === 'string' &&
    typeof payload.voiceGuidelines === 'string' &&
    typeof payload.structureRules === 'string' &&
    typeof payload.knowledgeInstructions === 'string' &&
    typeof payload.boundaries === 'string' &&
    typeof payload.responseMode === 'string' &&
    typeof payload.closingBehavior === 'string' &&
    typeof payload.version === 'number'
  );
}

/**
 * Validate a SystemPromptPayload
 */
export function validateSystemPromptPayload(payload: Partial<SystemPromptPayload>): string[] {
  const errors: string[] = [];

  // Check section lengths
  for (const [key, config] of Object.entries(PROMPT_SECTIONS)) {
    const value = payload[key as keyof typeof PROMPT_SECTIONS];
    if (typeof value === 'string' && value.length > config.maxLength) {
      errors.push(`${config.label} exceeds maximum length of ${config.maxLength} characters`);
    }
  }

  // Check response mode
  if (payload.responseMode && !RESPONSE_MODES.some((m) => m.value === payload.responseMode)) {
    errors.push(`Invalid response mode: ${payload.responseMode}`);
  }

  // Check closing behavior
  if (payload.closingBehavior && !CLOSING_BEHAVIORS.some((b) => b.value === payload.closingBehavior)) {
    errors.push(`Invalid closing behavior: ${payload.closingBehavior}`);
  }

  // Check version
  if (payload.version !== undefined && (payload.version < 1 || !Number.isInteger(payload.version))) {
    errors.push('Version must be a positive integer');
  }

  return errors;
}

// =============================================================================
// Assembly Helpers
// =============================================================================

/**
 * Assemble SystemPromptPayload into a complete prompt string
 * Used by server.js to build the final system prompt
 *
 * NOTE: Section headers are read from PROMPT_SECTIONS to maintain
 * Declarative Sovereignty - labels can be changed without code modification.
 */
export function assemblePromptContent(payload: SystemPromptPayload): string {
  const sections: string[] = [];

  // Map payload fields to their PROMPT_SECTIONS config
  const sectionMap: Array<{ key: keyof typeof PROMPT_SECTIONS; value: string | undefined }> = [
    { key: 'identity', value: payload.identity },
    { key: 'voiceGuidelines', value: payload.voiceGuidelines },
    { key: 'structureRules', value: payload.structureRules },
    { key: 'knowledgeInstructions', value: payload.knowledgeInstructions },
    { key: 'boundaries', value: payload.boundaries },
  ];

  for (const { key, value } of sectionMap) {
    if (value) {
      const config = PROMPT_SECTIONS[key];
      sections.push(`## ${config.label}\n${value}`);
    }
  }

  return sections.join('\n\n');
}
