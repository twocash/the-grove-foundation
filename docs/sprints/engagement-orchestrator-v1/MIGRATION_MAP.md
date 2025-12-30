# MIGRATION_MAP.md — engagement-orchestrator-v1

## File Operations Overview

### Files to Create (14 files)

| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/core/schema/moment.ts` | Zod schemas + GroveObject type | ~180 |
| `src/core/engagement/moment-evaluator.ts` | Trigger evaluation logic | ~120 |
| `src/data/moments/moment-loader.ts` | JSON glob import + validation | ~50 |
| `src/data/moments/index.ts` | Loader export + types | ~15 |
| `src/data/moments/core/welcome-arrival.moment.json` | First visit welcome | ~50 |
| `src/data/moments/core/simulation-reveal.moment.json` | Post-journey reveal | ~60 |
| `src/data/moments/core/custom-lens-offer.moment.json` | Create your own lens | ~45 |
| `src/data/moments/engagement/entropy-journey-offer.moment.json` | High complexity journey offer | ~45 |
| `src/data/moments/education/first-sprout-prompt.moment.json` | Encourage first capture | ~35 |
| `src/surface/hooks/useMoments.ts` | React hook for surfaces | ~100 |
| `src/surface/components/MomentRenderer/index.ts` | Barrel export | ~10 |
| `src/surface/components/MomentRenderer/MomentCard.tsx` | Generic card renderer | ~100 |
| `src/surface/components/MomentRenderer/component-registry.ts` | Component key→React mapping | ~40 |

### Files to Modify (6 files)

| File | Changes |
|------|---------|
| `src/core/schema/index.ts` | Add moment schema exports |
| `src/core/engagement/index.ts` | Add moment API exports |
| `src/core/engagement/machine.ts` | Add flags context + actions |
| `src/core/engagement/context.ts` | Extend context with flags + cooldowns |
| `hooks/useEngagementBus.ts` | Add moment event emissions |
| `src/surface/components/index.ts` | Add MomentRenderer export |

---

## Directory Structure (Final State)

```
src/
├── core/
│   ├── schema/
│   │   ├── moment.ts              # NEW: Zod schemas + Moment type
│   │   └── index.ts               # MODIFY: Add moment exports
│   └── engagement/
│       ├── moment-evaluator.ts    # NEW: Pure evaluation functions
│       ├── context.ts             # MODIFY: Add flags + cooldowns
│       ├── machine.ts             # MODIFY: Add flag actions
│       └── index.ts               # MODIFY: Add exports
├── data/
│   └── moments/
│       ├── core/
│       │   ├── welcome-arrival.moment.json
│       │   ├── simulation-reveal.moment.json
│       │   └── custom-lens-offer.moment.json
│       ├── engagement/
│       │   └── entropy-journey-offer.moment.json
│       ├── education/
│       │   └── first-sprout-prompt.moment.json
│       ├── moment-loader.ts       # NEW: Glob import + validation
│       └── index.ts               # NEW: Public API
├── surface/
│   ├── hooks/
│   │   └── useMoments.ts          # NEW: Surface consumption hook
│   └── components/
│       ├── MomentRenderer/
│       │   ├── index.ts           # NEW: Barrel export
│       │   ├── MomentCard.tsx     # NEW: Generic renderer
│       │   └── component-registry.ts  # NEW: Lazy component map
│       └── index.ts               # MODIFY: Add export
└── hooks/
    └── useEngagementBus.ts        # MODIFY: Add moment events
```

---

## Detailed Migration Map

### 1. CREATE: `src/core/schema/moment.ts`

**Purpose:** Zod schemas following GroveObject<MomentPayload> pattern

**Dependencies:** `zod`, `./grove-object`

**Exports:**
```typescript
// Enums/Constants
export const MomentSurface: z.ZodEnum;
export type MomentSurface;

// Trigger types
export const NumericRange: z.ZodObject;
export const MomentTrigger: z.ZodObject;
export type MomentTrigger;

// Content types
export const PromptDefinition: z.ZodObject;
export const MomentContent: z.ZodObject;
export type MomentContent;

// Action types
export const MomentAction: z.ZodObject;
export type MomentAction;

// Payload (the T in GroveObject<T>)
export const MomentPayload: z.ZodObject;
export type MomentPayload;

// Complete Moment = GroveObject<MomentPayload>
export const MomentSchema: z.ZodObject;
export type Moment;

// Type guard
export function isMoment(obj: unknown): obj is Moment;
```

---

### 2. CREATE: `src/core/engagement/moment-evaluator.ts`

**Purpose:** Pure functions for evaluating moment triggers

**Dependencies:** `@core/schema/moment`

**Exports:**
```typescript
export interface EvaluationResult {
  eligible: boolean;
  reason?: string;
}

export function evaluateTrigger(
  trigger: MomentTrigger,
  context: EngagementContext
): EvaluationResult;

export function getEligibleMoments(
  moments: Moment[],
  context: EngagementContext,
  surface: MomentSurface,
  now?: number
): Moment[];
```

**Implementation notes:**
- Pure functions (no side effects)
- Access payload via `moment.payload.trigger`
- Access ID via `moment.meta.id`
- Filter by `meta.status === 'active'`

---

### 3. CREATE: `src/data/moments/moment-loader.ts`

**Purpose:** Load and validate moment JSON files using Vite glob

**Dependencies:** `@core/schema/moment`

**Exports:**
```typescript
export function loadMoments(): Moment[];
export function loadAllMoments(): Moment[];  // Includes draft/archived
```

**Implementation:**
```typescript
// Use Vite glob import
const momentFiles = import.meta.glob<{ default: unknown }>(
  './**/*.moment.json',
  { eager: true }
);

export function loadMoments(): Moment[] {
  const moments: Moment[] = [];
  
  for (const [path, module] of Object.entries(momentFiles)) {
    const parsed = MomentSchema.safeParse(module.default);
    if (parsed.success && parsed.data.meta.status === 'active') {
      moments.push(parsed.data);
    }
  }
  
  return moments;
}
```

---

### 4. CREATE: `src/data/moments/index.ts`

**Purpose:** Public API for moment data

```typescript
export { loadMoments, loadAllMoments } from './moment-loader';
export type { Moment } from '@core/schema/moment';
```

---

### 5-9. CREATE: Moment JSON Files

Each moment file follows GroveObject<MomentPayload> structure:

**Template:**
```json
{
  "meta": {
    "id": "moment-id",
    "type": "moment",
    "title": "Human-readable title",
    "description": "What this moment does",
    "icon": "LucideIconName",
    "color": "tailwind-color",
    "createdAt": "2025-01-15T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z",
    "createdBy": { "type": "human", "actorId": "jim" },
    "status": "active",
    "tags": ["category"]
  },
  "payload": {
    "trigger": { ... },
    "content": { ... },
    "surface": "overlay|inline|welcome|header|prompt|toast",
    "priority": 50,
    "once": false,
    "cooldown": 300000,
    "actions": [ ... ],
    "enabled": true
  }
}
```

**Files:**
| File | ID | Surface | Priority |
|------|----|---------|----------|
| `core/welcome-arrival.moment.json` | `welcome-arrival` | welcome | 100 |
| `core/simulation-reveal.moment.json` | `simulation-reveal` | overlay | 90 |
| `core/custom-lens-offer.moment.json` | `custom-lens-offer` | inline | 50 |
| `engagement/entropy-journey-offer.moment.json` | `entropy-journey-offer` | inline | 60 |
| `education/first-sprout-prompt.moment.json` | `first-sprout-prompt` | toast | 40 |

---

### 10. CREATE: `src/surface/hooks/useMoments.ts`

**Purpose:** React hook for consuming moments by surface

**Dependencies:**
- `@data/moments`
- `@core/engagement/moment-evaluator`
- `@core/engagement` (context, actions)
- `hooks/useEngagementBus`

**Exports:**
```typescript
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

export function useMoments(options: UseMomentsOptions): UseMomentsReturn;
```

---

### 11-13. CREATE: MomentRenderer Components

**`MomentRenderer/index.ts`:**
```typescript
export { MomentCard } from './MomentCard';
export { getMomentComponent, registerMomentComponent } from './component-registry';
```

**`MomentRenderer/MomentCard.tsx`:**
- Generic card for `content.type: 'card'` moments
- Lens variant resolution via `content.variants`
- Action button rendering

**`MomentRenderer/component-registry.ts`:**
```typescript
const componentMap: Record<string, ComponentType<MomentComponentProps>> = {
  SimulationReveal: lazy(() => import('../../Terminal/Reveals/SimulationReveal')),
  // ...
};

export function getMomentComponent(key: string): ComponentType<MomentComponentProps> | null;
```

---

### 14. MODIFY: `src/core/schema/index.ts`

**Add:**
```typescript
export * from './moment';
```

---

### 15. MODIFY: `src/core/engagement/index.ts`

**Add:**
```typescript
export { evaluateTrigger, getEligibleMoments } from './moment-evaluator';
export type { EvaluationResult } from './moment-evaluator';
```

---

### 16. MODIFY: `src/core/engagement/machine.ts`

**Add to context:**
```typescript
context: {
  // ... existing ...
  flags: {
    welcomeCompleted: false,
    simulationRevealed: false,
    customLensOffered: false,
    terminatorUnlocked: false,
    founderStoryShown: false,
    sproutPromptShown: false,
    journeyOfferShown: false,
  },
  momentCooldowns: {},
}
```

**Add actions:**
```typescript
setFlag: assign({
  flags: (ctx, event) => ({ ...ctx.flags, [event.key]: event.value })
}),
setCooldown: assign({
  momentCooldowns: (ctx, event) => ({ ...ctx.momentCooldowns, [event.momentId]: event.timestamp })
}),
```

---

### 17. MODIFY: `src/core/engagement/context.ts`

**Extend context type:**
```typescript
flags: EngagementFlags;
setFlag: (key: string, value: boolean) => void;
momentCooldowns: Record<string, number>;
setCooldown: (momentId: string, timestamp: number) => void;
```

---

### 18. MODIFY: `hooks/useEngagementBus.ts`

**Add:**
```typescript
momentShown: (momentId: string, surface: string) => void;
momentActioned: (momentId: string, actionId: string, actionType: string) => void;
momentDismissed: (momentId: string) => void;
```

---

### 19. MODIFY: `src/surface/components/index.ts`

**Add:**
```typescript
export * from './MomentRenderer';
```

---

## File Dependency Graph

```
                    ┌─────────────────────────┐
                    │  src/core/schema/       │
                    │  moment.ts              │
                    │  (Zod + GroveObject)    │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
┌───────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ moment-evaluator  │ │ moment-loader   │ │ *.moment.json   │
│ .ts               │ │ .ts             │ │ (5 files)       │
└─────────┬─────────┘ └────────┬────────┘ └────────┬────────┘
          │                    │                   │
          └────────────────────┼───────────────────┘
                               │
                               ▼
                    ┌─────────────────────────┐
                    │  useMoments.ts          │
                    │  (surface hook)         │
                    └───────────┬─────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │                                       │
            ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│ MomentCard.tsx      │               │ component-registry  │
│ (generic renderer)  │               │ .ts                 │
└─────────────────────┘               └─────────────────────┘
```

---

## Migration Order

Execute in this order to avoid import errors:

1. **Schema first:** `src/core/schema/moment.ts` + update index
2. **Evaluator:** `moment-evaluator.ts`
3. **Engagement integration:** Update machine.ts, context.ts
4. **Bus events:** Update useEngagementBus.ts
5. **Moment loader:** `moment-loader.ts`, `index.ts`
6. **Moment files:** All `.moment.json` files
7. **Surface hook:** `useMoments.ts`
8. **Renderers:** MomentRenderer components
9. **Export updates:** All index.ts files

---

## Validation Checkpoints

After each phase, verify:

1. **After schema:** `npm run typecheck` passes
2. **After evaluator:** Unit tests for trigger evaluation
3. **After engagement:** XState inspector shows flags
4. **After loader:** `loadMoments()` returns 5 moments
5. **After hook:** `useMoments({ surface: 'overlay' })` works
6. **After render:** MomentCard renders in Storybook

---

*Migration map complete. Ready for STORY_BREAKDOWN.md.*
