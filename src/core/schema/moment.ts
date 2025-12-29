// src/core/schema/moment.ts
// Engagement Moment Schema - GroveObject<MomentPayload> pattern
// Sprint: engagement-orchestrator-v1

import type { GroveObject, GroveObjectMeta, GroveObjectProvenance } from './grove-object';

// =============================================================================
// Surface Types
// =============================================================================

/**
 * Where a moment can be rendered
 */
export type MomentSurface =
  | 'overlay'    // Modal/dialog overlay
  | 'inline'     // In-stream card
  | 'welcome'    // Welcome section content
  | 'header'     // Header badge/pill
  | 'prompt'     // Suggested prompt injection
  | 'toast';     // Transient notification

// =============================================================================
// Trigger Conditions
// =============================================================================

/**
 * Numeric range for threshold triggers
 */
export interface NumericRange {
  min?: number;
  max?: number;
}

/**
 * Session stages for trigger conditions
 */
export type TriggerStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

/**
 * Schedule configuration for time-based triggers
 */
export interface TriggerSchedule {
  daysOfWeek?: number[];  // 0-6 (Sunday-Saturday)
  hoursUTC?: { start: number; end: number };
}

/**
 * Trigger conditions that determine when a moment is eligible
 * All specified conditions must be met (AND logic)
 * Stage conditions use OR logic (any matching stage)
 */
export interface MomentTrigger {
  // Stage conditions (OR - any matching stage triggers)
  stage?: TriggerStage[];

  // Numeric thresholds
  exchangeCount?: NumericRange;
  journeysCompleted?: NumericRange;
  sproutsCaptured?: NumericRange;
  entropy?: NumericRange;
  minutesActive?: NumericRange;
  sessionCount?: NumericRange;

  // Flag conditions (AND - all must match)
  flags?: Record<string, boolean>;

  // Context conditions
  lens?: string | string[] | null;
  journey?: string | string[] | null;
  hasCustomLens?: boolean;

  // Event-driven (reactive trigger)
  onEvent?: string;

  // Probability (0-1, for A/B testing)
  probability?: number;

  // Time-based
  schedule?: TriggerSchedule;
}

// =============================================================================
// Content Definitions
// =============================================================================

/**
 * Button variant for prompts and actions
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * A prompt/button within moment content
 */
export interface PromptDefinition {
  text: string;
  actionId: string;
  icon?: string;
  variant?: ButtonVariant;
}

/**
 * Content type discriminator
 */
export type MomentContentType = 'text' | 'card' | 'component';

/**
 * Lens-specific content variant
 */
export interface ContentVariant {
  heading?: string;
  body?: string;
  props?: Record<string, unknown>;
}

/**
 * What to display when moment is shown
 */
export interface MomentContent {
  type: MomentContentType;

  // For text/card types
  heading?: string;
  body?: string;
  icon?: string;

  // For card type - action prompts
  prompts?: PromptDefinition[];

  // For component type
  component?: string;
  props?: Record<string, unknown>;

  // Lens-specific content variants
  variants?: Record<string, ContentVariant>;
}

// =============================================================================
// Action Definitions
// =============================================================================

/**
 * Action type discriminator
 */
export type MomentActionType =
  | 'accept'
  | 'dismiss'
  | 'navigate'
  | 'emit'
  | 'startJourney'
  | 'selectLens';

/**
 * An action that can be taken from a moment
 */
export interface MomentAction {
  id: string;
  label: string;
  type: MomentActionType;

  // For navigate
  target?: string;

  // For emit
  event?: string;
  eventPayload?: Record<string, unknown>;

  // Side effects (always applied)
  setFlags?: Record<string, boolean>;

  // Shortcuts for common actions
  journeyId?: string;   // For startJourney
  lensId?: string;      // For selectLens

  // Visual
  variant?: ButtonVariant;
  icon?: string;
}

// =============================================================================
// Moment Payload (the T in GroveObject<T>)
// =============================================================================

/**
 * The type-specific payload for a Moment
 */
export interface MomentPayload {
  // WHEN to show
  trigger: MomentTrigger;

  // WHAT to show
  content: MomentContent;

  // WHERE to show
  surface: MomentSurface;

  // Conflict resolution (0-100, higher = more important)
  priority: number;

  // Behavior
  once: boolean;         // Only show once ever
  cooldown?: number;     // ms between showings

  // WHAT happens when interacted with
  actions: MomentAction[];

  // Enabled flag (quick disable without archive)
  enabled: boolean;
}

// =============================================================================
// Moment Meta (extends GroveObjectMeta with moment-specific fields)
// =============================================================================

/**
 * Moment metadata - extends standard GroveObjectMeta
 */
export interface MomentMeta extends GroveObjectMeta {
  type: 'moment';
}

// =============================================================================
// Complete Moment Type
// =============================================================================

/**
 * A Moment is a GroveObject with MomentPayload.
 *
 * The GroveObjectMeta gives us:
 * - id: unique identifier
 * - type: 'moment'
 * - title: human-readable name
 * - description: what this moment does
 * - icon: visual representation
 * - color: theming
 * - createdAt/updatedAt: timestamps
 * - createdBy: provenance (human? AI? system?)
 * - status: 'active' | 'draft' | 'archived'
 * - tags: categorization (onboarding, engagement, etc.)
 */
export interface Moment {
  meta: MomentMeta;
  payload: MomentPayload;
}

// Alternative type for generic GroveObject compatibility
export type MomentObject = GroveObject<MomentPayload>;

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if an object is a valid Moment
 */
export function isMoment(obj: unknown): obj is Moment {
  if (typeof obj !== 'object' || obj === null) return false;
  const m = obj as Record<string, unknown>;

  // Check meta
  if (typeof m.meta !== 'object' || m.meta === null) return false;
  const meta = m.meta as Record<string, unknown>;
  if (typeof meta.id !== 'string') return false;
  if (meta.type !== 'moment') return false;
  if (typeof meta.title !== 'string') return false;

  // Check payload
  if (typeof m.payload !== 'object' || m.payload === null) return false;
  const payload = m.payload as Record<string, unknown>;
  if (typeof payload.trigger !== 'object') return false;
  if (typeof payload.content !== 'object') return false;
  if (typeof payload.surface !== 'string') return false;

  return true;
}

/**
 * Check if a surface is valid
 */
export function isValidSurface(s: string): s is MomentSurface {
  return ['overlay', 'inline', 'welcome', 'header', 'prompt', 'toast'].includes(s);
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a moment with sensible defaults
 */
export function createMoment(
  id: string,
  title: string,
  payload: Partial<MomentPayload> & { trigger: MomentTrigger; content: MomentContent; surface: MomentSurface }
): Moment {
  const now = new Date().toISOString();
  return {
    meta: {
      id,
      type: 'moment',
      title,
      createdAt: now,
      updatedAt: now,
      status: 'active',
    },
    payload: {
      priority: 50,
      once: false,
      actions: [],
      enabled: true,
      ...payload,
    },
  };
}

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_MOMENT_PRIORITY = 50;

export const MOMENT_SURFACES: MomentSurface[] = [
  'overlay',
  'inline',
  'welcome',
  'header',
  'prompt',
  'toast',
];
