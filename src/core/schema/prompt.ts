// src/core/schema/prompt.ts
// Prompt object type with declarative sequence membership
// Sprint: prompt-unification-v1, prompt-schema-rationalization-v1

import type { GroveObject } from './grove-object';
import type { PromptProvenance, PromptSurface, HighlightTrigger } from '../context-fields/types';

// =============================================================================
// Type Aliases
// =============================================================================

/** Lifecycle stages for targeting */
export type PromptStage = 'genesis' | 'exploration' | 'synthesis' | 'advocacy';

/** Prompt source tracking */
export type PromptSource = 'library' | 'generated' | 'user';

/** Sequence types */
export type SequenceType =
  | 'journey'
  | 'briefing'
  | 'wizard'
  | 'tour'
  | 'research'
  | 'faq'
  | string;

// =============================================================================
// Affinity Types
// =============================================================================

/** Topic relevance */
export interface TopicAffinity {
  topicId: string;
  weight: number;
}

/** Lens relevance */
export interface LensAffinity {
  lensId: string;
  weight: number;
  labelOverride?: string;
}

// =============================================================================
// Targeting
// =============================================================================

/** Targeting criteria */
export interface PromptTargeting {
  stages?: PromptStage[];
  excludeStages?: PromptStage[];
  entropyWindow?: { min?: number; max?: number };
  lensIds?: string[];
  excludeLenses?: string[];
  momentTriggers?: string[];
  requireMoment?: boolean;
  minInteractions?: number;
  minConfidence?: number;
  afterPromptIds?: string[];
  topicClusters?: string[];
}

// =============================================================================
// Sequence Types
// =============================================================================

/** Success criteria for sequence completion */
export interface SuccessCriteria {
  minExchanges?: number;
  topicsMentioned?: string[];
  entropyDelta?: number;
}

/** Analytics */
export interface PromptStats {
  impressions: number;
  selections: number;
  completions: number;
  avgEntropyDelta: number;
  avgDwellMs: number;
  lastSurfaced?: string;
}

/** Sequence membership */
export interface PromptSequence {
  groupId: string;
  groupType: SequenceType;
  order: number;
  bridgeAfter?: string;
  titleOverride?: string;
  successCriteria?: SuccessCriteria;
  stats?: PromptStats;
}

// =============================================================================
// Wizard Types
// =============================================================================

/**
 * Wizard choice option for choice-type steps
 */
export interface WizardChoice {
  value: string;
  label: string;
  icon?: string;
  next?: string;
}

/**
 * Input validation rules for text-type steps
 */
export interface InputValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Conditional navigation rule
 */
export interface ConditionalNext {
  if: string;
  then: string;
}

/**
 * WizardStepConfig enables prompts to function as wizard steps.
 * See: docs/sprints/prompt-schema-rationalization-v1/wizard-integration.md for unification plan.
 */
export interface WizardStepConfig {
  stepType: 'consent' | 'choice' | 'text' | 'generation' | 'selection' | 'confirmation';
  choices?: WizardChoice[];
  inputKey?: string;
  validation?: InputValidation;
  nextConditions?: ConditionalNext[];
  defaultNext?: string;
}

// =============================================================================
// AI Generation Context
// =============================================================================

/** AI generation context */
export interface PromptGenerationContext {
  sessionId: string;
  modelId: string;
  generatedAt: string;
  reasoning?: string;
}

// =============================================================================
// Payload
// =============================================================================

/**
 * The prompt payload.
 *
 * Note: title, description, icon, and tags are stored in meta only.
 * This avoids redundancy between meta and payload fields.
 */
export interface PromptPayload {
  executionPrompt: string;
  systemContext?: string;
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  targeting: PromptTargeting;
  baseWeight: number;
  sequences?: PromptSequence[];
  stats: PromptStats;
  source: PromptSource;
  generatedFrom?: PromptGenerationContext;
  cooldownMs?: number;
  maxShows?: number;
  wizardConfig?: WizardStepConfig;
  /** Sprint: exploration-node-unification-v1 */
  provenance?: PromptProvenance;
  /** Sprint: kinetic-highlights-v1 - Where this prompt can appear */
  surfaces?: PromptSurface[];
  /** Sprint: kinetic-highlights-v1 - Text patterns that trigger this prompt */
  highlightTriggers?: HighlightTrigger[];
}

/** Full Prompt object */
export type Prompt = GroveObject<PromptPayload>;

// =============================================================================
// Sequence Utilities
// =============================================================================

/** Derived sequence definition */
export interface SequenceDefinition {
  groupId: string;
  groupType: SequenceType;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  promptCount: number;
}

/** Derive sequences from prompts */
export function deriveSequences(prompts: Prompt[]): SequenceDefinition[] {
  const groups = new Map<string, { type: SequenceType; count: number }>();

  prompts.forEach((p) => {
    p.payload.sequences?.forEach((seq) => {
      const existing = groups.get(seq.groupId);
      if (existing) {
        existing.count++;
      } else {
        groups.set(seq.groupId, { type: seq.groupType, count: 1 });
      }
    });
  });

  return Array.from(groups.entries()).map(([groupId, { type, count }]) => ({
    groupId,
    groupType: type,
    title: formatGroupTitle(groupId),
    promptCount: count,
  }));
}

function formatGroupTitle(groupId: string): string {
  const parts = groupId.split('-').slice(1);
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
