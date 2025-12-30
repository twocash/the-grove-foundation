# SPEC.md — engagement-orchestrator-v1

## Overview

The Engagement Orchestrator is a declarative system for managing contextual content injection based on user engagement state. It unifies reveals, offers, welcome variants, and prompts into a single choreography engine.

**Core Insight:** Every special experience in Grove—simulation reveal, lens offers, journey prompts—is a "moment" triggered by engagement conditions and rendered to a specific surface.

**Key Pattern:** Moments follow the **GroveObject<T>** pattern (Pattern 7), giving us:
- Unified identity (meta.id, meta.type, meta.title)
- Provenance tracking (who created this moment?)
- Lifecycle management (draft → active → archived)
- Inspector compatibility (same patterns as lenses/journeys)
- Future AI Gardener support (generate moment drafts)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ENGAGEMENT ORCHESTRATOR                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐    ┌─────────────────┐    ┌────────────────────┐   │
│  │  Moment        │    │  Moment         │    │  Active Moments    │   │
│  │  Loader        │───▶│  Evaluator      │───▶│  (by surface)      │   │
│  │  (JSON files)  │    │  (trigger logic)│    │                    │   │
│  └────────────────┘    └─────────────────┘    └────────────────────┘   │
│          │                     ▲                        │              │
│          │              ┌──────┴───────┐                ▼              │
│          │              │  Engagement  │       ┌────────────────────┐  │
│          │              │  State       │       │  Surface Renderers │  │
│          │              │  (XState)    │       │  - Overlay         │  │
│          │              └──────────────┘       │  - Inline          │  │
│          │                     ▲               │  - Welcome         │  │
│          │                     │               │  - Header          │  │
│          │              ┌──────┴───────┐       │  - Prompt          │  │
│          │              │  Engagement  │       └────────────────────┘  │
│          │              │  Bus         │                │              │
│          │              │  (events)    │◀───────────────┘              │
│          │              └──────────────┘     (user actions)            │
│          │                                                             │
│          ▼                                                             │
│  ┌────────────────┐                                                    │
│  │  Component     │  Maps component keys to React components           │
│  │  Registry      │  for type: 'component' moments                     │
│  └────────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Schema Definitions

### GroveObject Pattern (from grove-object.ts)

```typescript
// Existing pattern - moments align with this
export interface GroveObjectMeta {
  id: string;
  type: GroveObjectType;  // 'moment' for this system
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: GroveObjectProvenance;
  status?: 'active' | 'draft' | 'archived' | 'pending';
  tags?: string[];
  favorite?: boolean;
}

export interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;
  payload: T;
}
```

### Moment Schema (New)

```typescript
// src/core/schema/moment.ts

import { z } from 'zod';
import type { GroveObject, GroveObjectMeta } from './grove-object';

// =============================================================================
// Surface Types
// =============================================================================

export const MomentSurface = z.enum([
  'overlay',    // Modal/dialog overlay
  'inline',     // In-stream card
  'welcome',    // Welcome section content
  'header',     // Header badge/pill
  'prompt',     // Suggested prompt injection
  'toast'       // Transient notification
]);
export type MomentSurface = z.infer<typeof MomentSurface>;

// =============================================================================
// Trigger Conditions
// =============================================================================

export const NumericRange = z.object({
  min: z.number().optional(),
  max: z.number().optional()
}).refine(data => data.min !== undefined || data.max !== undefined, {
  message: 'At least min or max must be specified'
});

export const MomentTrigger = z.object({
  // Stage conditions (OR - any matching stage triggers)
  stage: z.array(z.enum(['ARRIVAL', 'ORIENTED', 'EXPLORING', 'ENGAGED'])).optional(),
  
  // Numeric thresholds
  exchangeCount: NumericRange.optional(),
  journeysCompleted: NumericRange.optional(),
  sproutsCaptured: NumericRange.optional(),
  entropy: NumericRange.optional(),
  minutesActive: NumericRange.optional(),
  sessionCount: NumericRange.optional(),
  
  // Flag conditions (AND - all must match)
  flags: z.record(z.string(), z.boolean()).optional(),
  
  // Context conditions
  lens: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  journey: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  hasCustomLens: z.boolean().optional(),
  
  // Event-driven (reactive trigger)
  onEvent: z.string().optional(),
  
  // Probability (0-1, for A/B testing)
  probability: z.number().min(0).max(1).optional(),
  
  // Time-based (ISO day-of-week, hour ranges)
  schedule: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    hoursUTC: z.object({ start: z.number(), end: z.number() }).optional()
  }).optional()
});
export type MomentTrigger = z.infer<typeof MomentTrigger>;

// =============================================================================
// Content Definitions
// =============================================================================

export const PromptDefinition = z.object({
  text: z.string(),
  actionId: z.string(),
  icon: z.string().optional(),
  variant: z.enum(['primary', 'secondary', 'ghost']).optional()
});

export const MomentContent = z.object({
  type: z.enum(['text', 'card', 'component']),
  
  // For text/card types
  heading: z.string().optional(),
  body: z.string().optional(),
  icon: z.string().optional(),
  
  // For card type - action prompts
  prompts: z.array(PromptDefinition).optional(),
  
  // For component type
  component: z.string().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  
  // Lens-specific content variants
  variants: z.record(z.string(), z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
    props: z.record(z.string(), z.unknown()).optional()
  })).optional()
});
export type MomentContent = z.infer<typeof MomentContent>;

// =============================================================================
// Action Definitions
// =============================================================================

export const MomentAction = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['accept', 'dismiss', 'navigate', 'emit', 'startJourney', 'selectLens']),
  
  // For navigate
  target: z.string().optional(),
  
  // For emit
  event: z.string().optional(),
  eventPayload: z.record(z.string(), z.unknown()).optional(),
  
  // Side effects (always applied)
  setFlags: z.record(z.string(), z.boolean()).optional(),
  
  // Shortcuts for common actions
  journeyId: z.string().optional(),   // For startJourney
  lensId: z.string().optional(),      // For selectLens
  
  // Visual
  variant: z.enum(['primary', 'secondary', 'ghost', 'danger']).optional(),
  icon: z.string().optional()
});
export type MomentAction = z.infer<typeof MomentAction>;

// =============================================================================
// Moment Payload (the T in GroveObject<T>)
// =============================================================================

export const MomentPayload = z.object({
  // WHEN to show
  trigger: MomentTrigger,
  
  // WHAT to show
  content: MomentContent,
  
  // WHERE to show
  surface: MomentSurface,
  
  // Conflict resolution
  priority: z.number().default(50),  // 0-100
  
  // Behavior
  once: z.boolean().default(false),
  cooldown: z.number().optional(),    // ms between showings
  
  // WHAT happens when interacted with
  actions: z.array(MomentAction).default([]),
  
  // Enabled flag (quick disable without archive)
  enabled: z.boolean().default(true)
});
export type MomentPayload = z.infer<typeof MomentPayload>;

// =============================================================================
// Complete Moment Type (GroveObject<MomentPayload>)
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
export type Moment = GroveObject<MomentPayload>;

// Zod schema for meta (subset for validation)
export const MomentMetaSchema = z.object({
  id: z.string(),
  type: z.literal('moment'),
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.object({
    type: z.enum(['human', 'ai', 'system', 'import']),
    actorId: z.string().optional(),
    context: z.record(z.string(), z.unknown()).optional()
  }).optional(),
  status: z.enum(['active', 'draft', 'archived', 'pending']).default('active'),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional()
});

// Complete Moment schema for validation
export const MomentSchema = z.object({
  meta: MomentMetaSchema,
  payload: MomentPayload
});

// Type guard
export function isMoment(obj: unknown): obj is Moment {
  return MomentSchema.safeParse(obj).success;
}
```

## File Structure

Following the wizard pattern, moments are stored as individual JSON files:

```
src/data/moments/
├── core/
│   ├── welcome-arrival.moment.json
│   ├── simulation-reveal.moment.json
│   └── custom-lens-offer.moment.json
├── engagement/
│   ├── entropy-journey-offer.moment.json
│   └── first-sprout-prompt.moment.json
├── index.ts              # Loader + registry export
└── moment-loader.ts      # JSON import + validation
```

### Example Moment File

```json
// src/data/moments/core/simulation-reveal.moment.json
{
  "meta": {
    "id": "simulation-reveal",
    "type": "moment",
    "title": "The Simulation Reveal",
    "description": "Reveals that the user is already experiencing Grove's architecture",
    "icon": "Sparkles",
    "color": "amber",
    "createdAt": "2025-01-15T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z",
    "createdBy": {
      "type": "human",
      "actorId": "jim"
    },
    "status": "active",
    "tags": ["onboarding", "reveal", "meta"]
  },
  "payload": {
    "trigger": {
      "journeysCompleted": { "min": 1 },
      "flags": { "simulationRevealed": false }
    },
    "content": {
      "type": "component",
      "component": "SimulationReveal",
      "variants": {
        "academic": {
          "props": { "opening": "This terminal is a working prototype of the research infrastructure we're proposing." }
        },
        "engineer": {
          "props": { "opening": "The architecture you've been exploring? You're running on it." }
        },
        "concerned-citizen": {
          "props": { "opening": "You just experienced what distributed AI feels like — no Big Tech in the loop." }
        }
      }
    },
    "surface": "overlay",
    "priority": 90,
    "once": true,
    "actions": [
      {
        "id": "acknowledge",
        "label": "Continue Exploring",
        "type": "dismiss",
        "variant": "primary",
        "setFlags": { "simulationRevealed": true }
      },
      {
        "id": "how-it-works",
        "label": "How does this work?",
        "type": "startJourney",
        "journeyId": "architecture",
        "setFlags": { "simulationRevealed": true }
      }
    ]
  }
}
```

## Moment Loader

```typescript
// src/data/moments/moment-loader.ts

import { Moment, MomentSchema } from '@core/schema/moment';

// Import all moment JSON files
// Using Vite's glob import for directory scanning
const momentFiles = import.meta.glob<{ default: unknown }>('./**/*.moment.json', { eager: true });

/**
 * Load and validate all moment definitions
 */
export function loadMoments(): Moment[] {
  const moments: Moment[] = [];
  const errors: string[] = [];
  
  for (const [path, module] of Object.entries(momentFiles)) {
    try {
      const parsed = MomentSchema.parse(module.default);
      
      // Only include active moments (draft/archived filtered)
      if (parsed.meta.status === 'active') {
        moments.push(parsed);
      }
    } catch (e) {
      errors.push(`Failed to load ${path}: ${e}`);
    }
  }
  
  if (errors.length > 0) {
    console.warn('[MomentLoader] Validation errors:', errors);
  }
  
  console.log(`[MomentLoader] Loaded ${moments.length} active moments`);
  return moments;
}

/**
 * Load ALL moments including drafts (for admin/inspector)
 */
export function loadAllMoments(): Moment[] {
  const moments: Moment[] = [];
  
  for (const [, module] of Object.entries(momentFiles)) {
    try {
      const parsed = MomentSchema.parse(module.default);
      moments.push(parsed);
    } catch {
      // Skip invalid
    }
  }
  
  return moments;
}
```

## Moment Evaluator

```typescript
// src/core/engagement/moment-evaluator.ts

import { Moment, MomentTrigger, MomentSurface } from '@core/schema/moment';
import { EngagementContext } from './types';

export interface EvaluationResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Evaluate if a moment's trigger conditions are met
 */
export function evaluateTrigger(
  trigger: MomentTrigger,
  context: EngagementContext
): EvaluationResult {
  
  // Stage check (OR logic - any stage matches)
  if (trigger.stage && trigger.stage.length > 0) {
    if (!trigger.stage.includes(context.stage)) {
      return { eligible: false, reason: `Stage ${context.stage} not in ${trigger.stage}` };
    }
  }
  
  // Numeric range checks
  if (trigger.exchangeCount && !inRange(context.exchangeCount, trigger.exchangeCount)) {
    return { eligible: false, reason: 'exchangeCount out of range' };
  }
  if (trigger.journeysCompleted && !inRange(context.journeysCompleted, trigger.journeysCompleted)) {
    return { eligible: false, reason: 'journeysCompleted out of range' };
  }
  if (trigger.sproutsCaptured && !inRange(context.sproutsCaptured, trigger.sproutsCaptured)) {
    return { eligible: false, reason: 'sproutsCaptured out of range' };
  }
  if (trigger.entropy && !inRange(context.entropy, trigger.entropy)) {
    return { eligible: false, reason: 'entropy out of range' };
  }
  if (trigger.minutesActive && !inRange(context.minutesActive, trigger.minutesActive)) {
    return { eligible: false, reason: 'minutesActive out of range' };
  }
  
  // Flag checks (AND logic - all must match)
  if (trigger.flags) {
    for (const [flag, expected] of Object.entries(trigger.flags)) {
      const actual = context.flags[flag] ?? false;
      if (actual !== expected) {
        return { eligible: false, reason: `Flag ${flag} is ${actual}, expected ${expected}` };
      }
    }
  }
  
  // Context checks
  if (trigger.lens !== undefined) {
    const matches = matchesContextValue(context.activeLens, trigger.lens);
    if (!matches) {
      return { eligible: false, reason: 'Lens mismatch' };
    }
  }
  if (trigger.journey !== undefined) {
    const matches = matchesContextValue(context.activeJourney, trigger.journey);
    if (!matches) {
      return { eligible: false, reason: 'Journey mismatch' };
    }
  }
  if (trigger.hasCustomLens !== undefined && context.hasCustomLens !== trigger.hasCustomLens) {
    return { eligible: false, reason: 'hasCustomLens mismatch' };
  }
  
  // Probability check (A/B testing)
  if (trigger.probability !== undefined && trigger.probability < 1) {
    if (Math.random() > trigger.probability) {
      return { eligible: false, reason: 'Probability check failed' };
    }
  }
  
  return { eligible: true };
}

/**
 * Get all eligible moments for a surface, sorted by priority
 */
export function getEligibleMoments(
  moments: Moment[],
  context: EngagementContext,
  surface: MomentSurface,
  now: number = Date.now()
): Moment[] {
  return moments
    .filter(m => m.payload.enabled !== false)
    .filter(m => m.payload.surface === surface)
    .filter(m => {
      // Check cooldown
      if (m.payload.cooldown) {
        const lastShown = context.momentCooldowns[m.meta.id];
        if (lastShown && (now - lastShown) < m.payload.cooldown) {
          return false;
        }
      }
      return true;
    })
    .filter(m => {
      // Check once flag
      if (m.payload.once) {
        const flagKey = `moment_${m.meta.id}_shown`;
        if (context.flags[flagKey]) {
          return false;
        }
      }
      return true;
    })
    .filter(m => evaluateTrigger(m.payload.trigger, context).eligible)
    .sort((a, b) => (b.payload.priority ?? 50) - (a.payload.priority ?? 50));
}

// Helper functions
function inRange(value: number, range: { min?: number; max?: number }): boolean {
  if (range.min !== undefined && value < range.min) return false;
  if (range.max !== undefined && value > range.max) return false;
  return true;
}

function matchesContextValue(
  actual: string | null,
  expected: string | string[] | null
): boolean {
  if (expected === null) return actual === null;
  if (Array.isArray(expected)) return actual !== null && expected.includes(actual);
  return actual === expected;
}
```

## React Hook: useMoments

```typescript
// src/surface/hooks/useMoments.ts

import { useMemo, useCallback, useState, useEffect } from 'react';
import { Moment, MomentSurface, MomentAction } from '@core/schema/moment';
import { getEligibleMoments } from '@core/engagement/moment-evaluator';
import { useEngagementContext, useEngagementActions } from '@core/engagement';
import { useEngagementEmit } from '../../hooks/useEngagementBus';
import { loadMoments } from '@data/moments';

export interface UseMomentsOptions {
  surface: MomentSurface;
  limit?: number;  // Max moments to return (default: 1 for overlay, unlimited for others)
}

export interface UseMomentsReturn {
  moments: Moment[];
  activeMoment: Moment | null;  // Highest priority
  executeAction: (momentId: string, actionId: string) => MomentAction | undefined;
  dismissMoment: (momentId: string) => void;
  isLoading: boolean;
}

// Load moments once at module level
let cachedMoments: Moment[] | null = null;
function getMoments(): Moment[] {
  if (!cachedMoments) {
    cachedMoments = loadMoments();
  }
  return cachedMoments;
}

export function useMoments(options: UseMomentsOptions): UseMomentsReturn {
  const { surface, limit } = options;
  const context = useEngagementContext();
  const { setFlag, setCooldown } = useEngagementActions();
  const emit = useEngagementEmit();
  
  const [allMoments] = useState(getMoments);
  
  // Evaluate eligible moments
  const moments = useMemo(() => {
    const eligible = getEligibleMoments(allMoments, context, surface);
    
    // Apply limit (overlays typically show one at a time)
    const effectiveLimit = limit ?? (surface === 'overlay' ? 1 : undefined);
    return effectiveLimit ? eligible.slice(0, effectiveLimit) : eligible;
  }, [context, surface, limit, allMoments]);
  
  const activeMoment = moments[0] ?? null;
  
  // Track moment shown
  useEffect(() => {
    if (activeMoment) {
      emit.momentShown(activeMoment.meta.id, surface);
    }
  }, [activeMoment?.meta.id, surface, emit]);
  
  // Execute action handler
  const executeAction = useCallback((momentId: string, actionId: string): MomentAction | undefined => {
    const moment = allMoments.find(m => m.meta.id === momentId);
    const action = moment?.payload.actions.find(a => a.id === actionId);
    
    if (!moment || !action) {
      console.warn('[Moments] Action not found:', momentId, actionId);
      return undefined;
    }
    
    // Apply flag side effects
    if (action.setFlags) {
      Object.entries(action.setFlags).forEach(([key, value]) => {
        setFlag(key, value);
      });
    }
    
    // Mark once moments as shown
    if (moment.payload.once) {
      setFlag(`moment_${moment.meta.id}_shown`, true);
    }
    
    // Update cooldown
    if (moment.payload.cooldown) {
      setCooldown(moment.meta.id, Date.now());
    }
    
    // Emit telemetry
    emit.momentActioned(momentId, actionId, action.type);
    
    return action;
  }, [allMoments, setFlag, setCooldown, emit]);
  
  // Dismiss handler (convenience wrapper)
  const dismissMoment = useCallback((momentId: string) => {
    const moment = allMoments.find(m => m.meta.id === momentId);
    if (!moment) return;
    
    // Find dismiss action or create implicit one
    const dismissAction = moment.payload.actions.find(a => a.type === 'dismiss');
    if (dismissAction) {
      executeAction(momentId, dismissAction.id);
    } else {
      // Implicit dismiss
      if (moment.payload.once) {
        setFlag(`moment_${moment.meta.id}_shown`, true);
      }
      if (moment.payload.cooldown) {
        setCooldown(moment.meta.id, Date.now());
      }
      emit.momentDismissed(momentId);
    }
  }, [allMoments, executeAction, setFlag, setCooldown, emit]);
  
  return {
    moments,
    activeMoment,
    executeAction,
    dismissMoment,
    isLoading: false
  };
}
```

## Engagement State Extension

```typescript
// Extension to existing engagement context for flags + cooldowns
export interface EngagementFlags {
  // Reveal flags
  simulationRevealed: boolean;
  terminatorUnlocked: boolean;
  founderStoryShown: boolean;
  
  // Offer flags
  customLensOffered: boolean;
  journeyOfferShown: boolean;
  
  // Onboarding flags
  welcomeCompleted: boolean;
  firstExchangeCompleted: boolean;
  firstJourneyStarted: boolean;
  
  // Moment shown flags (auto-generated)
  [key: `moment_${string}_shown`]: boolean;
  
  // Custom flags (extensible)
  [key: string]: boolean;
}

// Extended engagement context
export interface EngagementContext {
  stage: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';
  exchangeCount: number;
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  entropy: number;
  minutesActive: number;
  sessionCount: number;
  
  // Current selections
  activeLens: string | null;
  activeJourney: string | null;
  hasCustomLens: boolean;
  
  // Flags for moment triggers
  flags: EngagementFlags;
  
  // Cooldown tracking
  momentCooldowns: Record<string, number>;  // momentId -> lastShownTimestamp
}
```

## Core Moment Definitions

### welcome-arrival.moment.json

```json
{
  "meta": {
    "id": "welcome-arrival",
    "type": "moment",
    "title": "Welcome - First Visit",
    "description": "Initial welcome for users who haven't selected a lens",
    "icon": "Home",
    "createdAt": "2025-01-15T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z",
    "createdBy": { "type": "system" },
    "status": "active",
    "tags": ["onboarding"]
  },
  "payload": {
    "trigger": {
      "stage": ["ARRIVAL"],
      "flags": { "welcomeCompleted": false }
    },
    "content": {
      "type": "card",
      "heading": "Welcome to The Grove",
      "body": "A space for exploring ideas about distributed AI. Choose how you'd like to begin.",
      "prompts": [
        { "text": "Choose a perspective", "actionId": "show-lens-picker", "variant": "primary" },
        { "text": "Create my own lens", "actionId": "start-wizard", "variant": "secondary" },
        { "text": "Just explore", "actionId": "select-freestyle", "variant": "ghost" }
      ]
    },
    "surface": "welcome",
    "priority": 100,
    "once": false,
    "actions": [
      { "id": "show-lens-picker", "label": "Choose Lens", "type": "navigate", "target": "lens-picker" },
      { "id": "start-wizard", "label": "Create Lens", "type": "navigate", "target": "wizard" },
      { "id": "select-freestyle", "label": "Explore", "type": "selectLens", "lensId": "freestyle", "setFlags": { "welcomeCompleted": true } }
    ]
  }
}
```

### custom-lens-offer.moment.json

```json
{
  "meta": {
    "id": "custom-lens-offer",
    "type": "moment",
    "title": "Custom Lens Offer",
    "description": "Offers custom lens creation after sustained engagement",
    "icon": "Sparkles",
    "color": "cyan",
    "createdAt": "2025-01-15T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z",
    "createdBy": { "type": "human", "actorId": "jim" },
    "status": "active",
    "tags": ["engagement", "conversion"]
  },
  "payload": {
    "trigger": {
      "exchangeCount": { "min": 8 },
      "stage": ["EXPLORING", "ENGAGED"],
      "hasCustomLens": false,
      "flags": { "customLensOffered": false }
    },
    "content": {
      "type": "card",
      "heading": "Ready for your own lens?",
      "body": "You've been exploring with a preset perspective. Want to create one tailored to your specific interests?",
      "icon": "Sparkles"
    },
    "surface": "inline",
    "priority": 50,
    "once": true,
    "actions": [
      { "id": "accept", "label": "Create My Lens", "type": "navigate", "target": "wizard", "variant": "primary", "setFlags": { "customLensOffered": true } },
      { "id": "dismiss", "label": "Not now", "type": "dismiss", "variant": "ghost", "setFlags": { "customLensOffered": true } }
    ]
  }
}
```

### entropy-journey-offer.moment.json

```json
{
  "meta": {
    "id": "entropy-journey-offer",
    "type": "moment",
    "title": "Entropy Journey Offer",
    "description": "Offers structured journey when conversation complexity is high",
    "icon": "Compass",
    "color": "amber",
    "createdAt": "2025-01-15T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z",
    "createdBy": { "type": "system" },
    "status": "active",
    "tags": ["engagement", "guidance"]
  },
  "payload": {
    "trigger": {
      "entropy": { "min": 0.7 },
      "onEvent": "exchange.completed",
      "flags": { "journeyOfferShown": false }
    },
    "content": {
      "type": "card",
      "heading": "Feeling the complexity?",
      "body": "Your exploration is getting deep. Would you like a structured path to help navigate these ideas?",
      "icon": "Compass"
    },
    "surface": "inline",
    "priority": 60,
    "cooldown": 300000,
    "actions": [
      { "id": "accept", "label": "Show me a journey", "type": "navigate", "target": "journey-picker", "variant": "primary" },
      { "id": "dismiss", "label": "I'll keep exploring", "type": "dismiss", "variant": "ghost" }
    ]
  }
}
```

### first-sprout-prompt.moment.json

```json
{
  "meta": {
    "id": "first-sprout-prompt",
    "type": "moment",
    "title": "First Sprout Prompt",
    "description": "Encourages capturing first insight after meaningful exchange",
    "icon": "Sprout",
    "color": "green",
    "createdAt": "2025-01-15T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z",
    "createdBy": { "type": "system" },
    "status": "active",
    "tags": ["education", "feature-discovery"]
  },
  "payload": {
    "trigger": {
      "exchangeCount": { "min": 3 },
      "sproutsCaptured": { "max": 0 },
      "flags": { "sproutPromptShown": false }
    },
    "content": {
      "type": "text",
      "body": "💡 Found something useful? Use /plant to capture it as a sprout.",
      "icon": "Sprout"
    },
    "surface": "toast",
    "priority": 40,
    "once": true,
    "actions": [
      { "id": "dismiss", "label": "Got it", "type": "dismiss", "setFlags": { "sproutPromptShown": true } }
    ]
  }
}
```

## Component Registry

```typescript
// src/surface/components/MomentRenderer/component-registry.ts

import { lazy, ComponentType } from 'react';

// Lazy-load moment components
const componentMap: Record<string, ComponentType<any>> = {
  SimulationReveal: lazy(() => import('../../Terminal/Reveals/SimulationReveal')),
  CustomLensOffer: lazy(() => import('../../Terminal/Reveals/CustomLensOffer')),
  TerminatorMode: lazy(() => import('../../Terminal/Reveals/TerminatorMode')),
  FounderStory: lazy(() => import('../../Terminal/Reveals/FounderStory')),
  // Add more as needed
};

export function getMomentComponent(key: string): ComponentType<any> | null {
  return componentMap[key] ?? null;
}

export function registerMomentComponent(key: string, component: ComponentType<any>): void {
  componentMap[key] = component;
}
```

## Success Criteria

1. **Schema validated:** All moment JSON files pass Zod validation
2. **GroveObject compliant:** Moments use meta/payload structure
3. **Evaluator tested:** Unit tests for trigger evaluation edge cases
4. **Loader works:** Moments auto-discovered from data/moments/ directory
5. **Hook works:** `useMoments` returns correct moments per surface
6. **Telemetry flows:** All moment events tracked via Engagement Bus
7. **Backward compatible:** Existing reveals still work during migration
8. **DEX compliant:** New moments addable via JSON only

## Test Plan

```typescript
// Unit tests for evaluator
describe('evaluateTrigger', () => {
  it('should match stage conditions', () => {
    const trigger = { stage: ['ARRIVAL', 'ORIENTED'] };
    expect(evaluateTrigger(trigger, { stage: 'ARRIVAL' })).toEqual({ eligible: true });
    expect(evaluateTrigger(trigger, { stage: 'ENGAGED' })).toEqual({ eligible: false, reason: expect.any(String) });
  });
  
  it('should match numeric ranges', () => {
    const trigger = { exchangeCount: { min: 5, max: 10 } };
    expect(evaluateTrigger(trigger, { exchangeCount: 7 })).toEqual({ eligible: true });
    expect(evaluateTrigger(trigger, { exchangeCount: 3 })).toEqual({ eligible: false, reason: expect.any(String) });
  });
  
  it('should AND all flag conditions', () => {
    const trigger = { flags: { a: true, b: false } };
    expect(evaluateTrigger(trigger, { flags: { a: true, b: false } })).toEqual({ eligible: true });
    expect(evaluateTrigger(trigger, { flags: { a: true, b: true } })).toEqual({ eligible: false, reason: expect.any(String) });
  });
});
```

---

*SPEC complete. Aligned with GroveObject<T> pattern. Ready for ADR.md.*
