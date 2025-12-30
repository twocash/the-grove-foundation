# EXECUTION_PROMPT.md — engagement-orchestrator-v1

## Context

You are implementing the Engagement Orchestrator—a declarative system for managing contextual content injection (reveals, offers, welcome variants, prompts) based on user engagement state.

**Core insight:** Every special experience in Grove is a "moment" triggered by engagement conditions and rendered to a specific surface.

**Key pattern:** Moments follow the `GroveObject<T>` pattern from `grove-object.ts`, providing unified identity, provenance tracking, and lifecycle management.

## Repository

```
C:\GitHub\the-grove-foundation
```

## Pre-Execution Checklist

```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean
npm run typecheck  # Should pass
```

## Sprint Documents

Read these in order before starting:

1. `docs/sprints/engagement-orchestrator-v1/REPO_AUDIT.md` - Current state analysis
2. `docs/sprints/engagement-orchestrator-v1/SPEC.md` - Complete technical specification
3. `docs/sprints/engagement-orchestrator-v1/ADR.md` - Architecture decisions (especially ADR-012, ADR-013)
4. `docs/sprints/engagement-orchestrator-v1/MIGRATION_MAP.md` - File operations
5. `docs/sprints/engagement-orchestrator-v1/STORY_BREAKDOWN.md` - Implementation order

## Execution Order

Execute stories in this exact order:

### Phase 1: Schema Foundation

**Story 1.1: Create Moment Schema**

Create `src/core/schema/moment.ts`:

```typescript
// src/core/schema/moment.ts
// Engagement Moment Schema - GroveObject<MomentPayload> pattern
// Sprint: engagement-orchestrator-v1

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
  stage: z.array(z.enum(['ARRIVAL', 'ORIENTED', 'EXPLORING', 'ENGAGED'])).optional(),
  exchangeCount: NumericRange.optional(),
  journeysCompleted: NumericRange.optional(),
  sproutsCaptured: NumericRange.optional(),
  entropy: NumericRange.optional(),
  minutesActive: NumericRange.optional(),
  sessionCount: NumericRange.optional(),
  flags: z.record(z.string(), z.boolean()).optional(),
  lens: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  journey: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  hasCustomLens: z.boolean().optional(),
  onEvent: z.string().optional(),
  probability: z.number().min(0).max(1).optional(),
  schedule: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    hoursUTC: z.object({ start: z.number(), end: z.number() }).optional()
  }).optional()
});
export type MomentTrigger = z.infer<typeof MomentTrigger>;

// =============================================================================
// Content + Actions
// =============================================================================

// ... continue with MomentContent, MomentAction from SPEC.md

// =============================================================================
// Moment Payload (the T in GroveObject<T>)
// =============================================================================

export const MomentPayload = z.object({
  trigger: MomentTrigger,
  content: MomentContent,
  surface: MomentSurface,
  priority: z.number().default(50),
  once: z.boolean().default(false),
  cooldown: z.number().optional(),
  actions: z.array(MomentAction).default([]),
  enabled: z.boolean().default(true)
});
export type MomentPayload = z.infer<typeof MomentPayload>;

// =============================================================================
// Complete Moment Type
// =============================================================================

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

export const MomentSchema = z.object({
  meta: MomentMetaSchema,
  payload: MomentPayload
});

// Type alias: Moment = GroveObject<MomentPayload>
export type Moment = GroveObject<MomentPayload>;

export function isMoment(obj: unknown): obj is Moment {
  return MomentSchema.safeParse(obj).success;
}
```

Update `src/core/schema/index.ts`:
```typescript
export * from './moment';
```

### Phase 2: Core Engine

**Story 2.1: Implement Moment Evaluator**

Create `src/core/engagement/moment-evaluator.ts`:

```typescript
// src/core/engagement/moment-evaluator.ts
// Moment Trigger Evaluation
// Sprint: engagement-orchestrator-v1

import { Moment, MomentTrigger, MomentSurface } from '@core/schema/moment';

export interface EngagementContext {
  stage: 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';
  exchangeCount: number;
  journeysCompleted: number;
  sproutsCaptured: number;
  topicsExplored: string[];
  entropy: number;
  minutesActive: number;
  sessionCount: number;
  activeLens: string | null;
  activeJourney: string | null;
  hasCustomLens: boolean;
  flags: Record<string, boolean>;
  momentCooldowns: Record<string, number>;
}

export interface EvaluationResult {
  eligible: boolean;
  reason?: string;
}

export function evaluateTrigger(
  trigger: MomentTrigger,
  context: EngagementContext
): EvaluationResult {
  // ... implementation from SPEC.md
}

export function getEligibleMoments(
  moments: Moment[],
  context: EngagementContext,
  surface: MomentSurface,
  now: number = Date.now()
): Moment[] {
  return moments
    .filter(m => m.payload.enabled !== false)
    .filter(m => m.meta.status === 'active')
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
```

**Story 2.2: Extend Engagement State**

Modify `src/core/engagement/machine.ts`:
- Add `flags` to context with default values
- Add `momentCooldowns` to context
- Add `SET_FLAG` and `SET_COOLDOWN` events
- Add corresponding actions

Modify `src/core/engagement/context.ts`:
- Extend context type with flags and cooldowns
- Add `setFlag` and `setCooldown` to actions hook

Update `src/core/engagement/index.ts`:
```typescript
export { evaluateTrigger, getEligibleMoments } from './moment-evaluator';
export type { EvaluationResult, EngagementContext as MomentContext } from './moment-evaluator';
```

**Story 2.3: Add Moment Telemetry**

Modify `hooks/useEngagementBus.ts`:
```typescript
// Add to emit object
momentShown: (momentId: string, surface: string) => {
  bus.emit('moment.shown', { momentId, surface, timestamp: Date.now() });
},

momentActioned: (momentId: string, actionId: string, actionType: string) => {
  bus.emit('moment.actioned', { momentId, actionId, actionType, timestamp: Date.now() });
},

momentDismissed: (momentId: string) => {
  bus.emit('moment.dismissed', { momentId, timestamp: Date.now() });
},
```

### Phase 3: Data Layer

**Story 3.1: Create Moment Loader**

Create `src/data/moments/moment-loader.ts`:

```typescript
// src/data/moments/moment-loader.ts
// Moment JSON File Loader
// Sprint: engagement-orchestrator-v1

import { Moment, MomentSchema } from '@core/schema/moment';

// Vite glob import for all moment JSON files
const momentFiles = import.meta.glob<{ default: unknown }>(
  './**/*.moment.json',
  { eager: true }
);

export function loadMoments(): Moment[] {
  const moments: Moment[] = [];
  const errors: string[] = [];

  for (const [path, module] of Object.entries(momentFiles)) {
    try {
      const parsed = MomentSchema.parse(module.default);
      if (parsed.meta.status === 'active') {
        moments.push(parsed);
      }
    } catch (e) {
      errors.push(`${path}: ${e}`);
    }
  }

  if (errors.length > 0) {
    console.warn('[MomentLoader] Validation errors:', errors);
  }

  console.log(`[MomentLoader] Loaded ${moments.length} active moments`);
  return moments;
}

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

Create `src/data/moments/index.ts`:

```typescript
export { loadMoments, loadAllMoments } from './moment-loader';
```

**Story 3.2: Create Core Moment Files**

Create directory structure:
```
src/data/moments/
├── core/
├── engagement/
└── education/
```

Create these moment JSON files following the `GroveObject<MomentPayload>` structure:

1. `core/welcome-arrival.moment.json`
2. `core/simulation-reveal.moment.json`
3. `core/custom-lens-offer.moment.json`
4. `engagement/entropy-journey-offer.moment.json`
5. `education/first-sprout-prompt.moment.json`

See SPEC.md for complete JSON structures.

### Phase 4: Surface Layer

**Story 4.1: Implement useMoments Hook**

Create `src/surface/hooks/useMoments.ts`:

```typescript
// src/surface/hooks/useMoments.ts
// React Hook for Consuming Moments
// Sprint: engagement-orchestrator-v1

import { useMemo, useCallback, useState, useEffect } from 'react';
import { Moment, MomentSurface, MomentAction } from '@core/schema/moment';
import { getEligibleMoments } from '@core/engagement/moment-evaluator';
import { useEngagementContext, useEngagementActions } from '@core/engagement';
import { useEngagementEmit } from '../../hooks/useEngagementBus';
import { loadMoments } from '@data/moments';

// Cache moments at module level
let cachedMoments: Moment[] | null = null;
function getMoments(): Moment[] {
  if (!cachedMoments) {
    cachedMoments = loadMoments();
  }
  return cachedMoments;
}

export interface UseMomentsOptions {
  surface: MomentSurface;
  limit?: number;
}

export interface UseMomentsReturn {
  moments: Moment[];
  activeMoment: Moment | null;
  executeAction: (momentId: string, actionId: string) => MomentAction | undefined;
  dismissMoment: (momentId: string) => void;
  isLoading: boolean;
}

export function useMoments(options: UseMomentsOptions): UseMomentsReturn {
  // ... implementation from SPEC.md
  // Key: use moment.meta.id and moment.payload.* accessors
}
```

**Story 4.2: Implement MomentCard Component**

Create `src/surface/components/MomentRenderer/`:

1. `index.ts` - barrel export
2. `MomentCard.tsx` - generic card renderer (access `moment.meta`, `moment.payload`)
3. `component-registry.ts` - lazy component map

### Phase 5: Integration

**Story 5.1: Verify Loading**

Moments are loaded lazily via `loadMoments()` in `useMoments` hook. No explicit initialization needed in provider.

Add a test in browser console:
```javascript
import { loadMoments } from '@data/moments';
console.log('Moments:', loadMoments());
```

## Key Differences from Previous Design

| Aspect | Previous | Updated |
|--------|----------|---------|
| Schema | Flat `EngagementMoment` | `GroveObject<MomentPayload>` |
| Storage | Single JSON array | Individual `.moment.json` files |
| Loading | Registry class | Vite glob + loader function |
| Access | `moment.id` | `moment.meta.id` |
| Access | `moment.priority` | `moment.payload.priority` |
| Access | `moment.trigger` | `moment.payload.trigger` |

## Validation Steps

After each phase, run:

```bash
npm run typecheck
npm run lint
```

After all phases:

```bash
npm run dev
# In browser console:
# import { loadMoments } from './src/data/moments'
# loadMoments().length should equal 5
```

## Import Aliases

```typescript
import { Moment, MomentPayload, MomentSchema } from '@core/schema';
import { evaluateTrigger, getEligibleMoments } from '@core/engagement';
import { useMoments } from '@surface/hooks/useMoments';
import { loadMoments } from '@data/moments';
```

## Do NOT

- Do NOT modify existing reveal components yet (Phase 2 migration)
- Do NOT delete any existing functionality
- Do NOT add feature flags yet (this is infrastructure)
- Do NOT integrate with actual UI surfaces yet (separate sprint)

## Known Limitations (from kinetic-context-v1)

**Journey Start is a TODO stub:** The `startJourney` action type in moments won't fully work yet. The journey acceptance in `KineticWelcome.tsx` has a TODO because actual journey start requires schema access not yet wired.

**What this means for this sprint:**
- Define `startJourney` action type in schema ✅ (do this)
- Include journey-related moments in JSON ✅ (do this)
- `executeAction()` should return the action object ✅ (do this)
- Caller handles actual journey start ⏳ (future sprint)

The moment system is infrastructure—it returns *what* should happen, the surface layer handles *how*. Journey integration comes in `moment-ui-integration-v1`.

## Expected Outcome

After this sprint:

1. `@core/schema` exports all moment types with GroveObject pattern
2. `@core/engagement` exports evaluator functions
3. `@data/moments` exports loader with 5 active moments
4. `useMoments({ surface: 'overlay' })` works but returns empty (no UI wiring)
5. All TypeScript compiles
6. Foundation ready for UI integration sprint

## Commit Strategy

Commit after each story:

```bash
git add -A
git commit -m "feat(engagement): [Story X.Y] Description"
```

Final commit:
```bash
git commit -m "feat(engagement): engagement-orchestrator-v1 complete - GroveObject pattern"
```

## Questions?

If anything in the spec is unclear:
1. Check ADR.md for architectural decisions (especially ADR-012, ADR-013)
2. Check SPEC.md for implementation details
3. Check grove-object.ts for GroveObject pattern reference
4. Ask before making assumptions

---

*Execute this sprint. Document any deviations in DEV_LOG.md.*
