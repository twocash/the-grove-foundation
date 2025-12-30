# ADR.md — engagement-orchestrator-v1

## Architecture Decision Record

### ADR-001: Declarative Moment Definitions Over Code

**Status:** Accepted

**Context:**
Currently, reveals, offers, and welcome variants are implemented as scattered React components with trigger logic embedded in hooks and state machines. Adding new contextual experiences requires code changes across multiple files.

**Decision:**
Implement moments as JSON definitions with a centralized evaluator. Components become render targets, not logic containers.

**Consequences:**
- ✅ Content team can add moments without deploys
- ✅ A/B testing via probability triggers
- ✅ Community contributions possible (future)
- ⚠️ Requires robust schema validation
- ⚠️ Component registry must be maintained

**Advisory Input:**
- **Park (10):** Declarative is correct—keeps cognitive complexity in configuration where humans can reason about it
- **Asparouhova (7):** Governance-ready pattern; moments become shared infrastructure

---

### ADR-002: Priority-Based Conflict Resolution

**Status:** Accepted

**Context:**
Multiple moments may be eligible simultaneously (e.g., custom lens offer AND journey offer). Need deterministic selection.

**Decision:**
Each moment has a `priority` number (0-100). When multiple moments are eligible for a surface, highest priority wins. For overlay surface, show only one (highest priority). For inline surface, can show multiple but sorted by priority.

**Priority Ranges:**
- 90-100: Critical onboarding/reveal moments
- 70-89: Engagement moments (journey offers, reveals)
- 50-69: Enhancement moments (custom lens, sprout prompts)
- 30-49: Educational/informational
- 0-29: Low-priority suggestions

**Consequences:**
- ✅ Deterministic behavior
- ✅ Easy to debug (log why moment won)
- ⚠️ Priority collision requires manual coordination
- ⚠️ May need priority categories in future

---

### ADR-003: Flag-Based State vs. Computed State

**Status:** Accepted

**Context:**
Some trigger conditions are computable (e.g., `journeysCompleted >= 1`) while others are flags (e.g., `simulationRevealed`). Need to decide how to handle "once" semantics.

**Decision:**
Use explicit flags for "shown" state. When a `once: true` moment is shown, set flag `moment_{id}_shown: true`. Flags are persisted in engagement context and localStorage.

**Pattern:**
```typescript
// Trigger check
{ flags: { "moment_simulation-reveal_shown": false } }

// On dismiss/action with setFlags
{ setFlags: { "moment_simulation-reveal_shown": true } }
```

**Consequences:**
- ✅ Explicit, debuggable
- ✅ Can reset flags for testing
- ✅ Flags can be set by multiple triggers
- ⚠️ Flag namespace management needed
- ⚠️ Must migrate existing reveal state to flags

---

### ADR-004: Component Registry for Complex Moments

**Status:** Accepted

**Context:**
Some moments (SimulationReveal, TerminatorMode) have complex UI that can't be expressed as simple card content. Need a way to render custom components while keeping definitions declarative.

**Decision:**
Implement a component registry that maps string keys to React components. Moment definitions reference components by key, not import.

```typescript
// Definition
{ content: { type: 'component', component: 'SimulationReveal', props: {...} } }

// Registry
componentMap['SimulationReveal'] = lazy(() => import('./SimulationReveal'));
```

**Consequences:**
- ✅ Definitions stay declarative (JSON-serializable)
- ✅ Components lazy-loaded
- ✅ Props can have lens variants
- ⚠️ Component interface contract must be documented
- ⚠️ Registry must be updated when adding components

**Component Interface:**
```typescript
interface MomentComponentProps {
  onAction: (actionId: string) => void;
  onDismiss: () => void;
  // Plus custom props from moment definition
}
```

---

### ADR-005: Event-Driven vs. Polling Evaluation

**Status:** Accepted

**Context:**
Moments need to be evaluated when engagement state changes. Two approaches: poll on interval, or evaluate on events.

**Decision:**
Hybrid approach:
1. **Primary:** Re-evaluate when engagement context changes (via useMemo dependency)
2. **Event-driven:** Some moments have `onEvent` trigger for reactive evaluation
3. **No polling:** Never poll on interval

**Implementation:**
```typescript
// Context change triggers re-evaluation
const moments = useMemo(() => {
  return getEligibleMoments(registry, context, surface);
}, [context, surface]);

// Event triggers handled separately
useEffect(() => {
  if (activeMoment?.trigger.onEvent) {
    // Subscribe to specific event
  }
}, [activeMoment]);
```

**Consequences:**
- ✅ Efficient (no wasted cycles)
- ✅ Predictable (state changes → evaluation)
- ✅ Reactive moments possible
- ⚠️ Event subscription management needed

---

### ADR-006: Surface-Specific Limits

**Status:** Accepted

**Context:**
Different surfaces have different UX constraints. Overlay should show one thing at a time. Inline might show multiple offers. Toast is transient.

**Decision:**
Default limits by surface:
- `overlay`: 1 (exclusive)
- `inline`: 3 (stacked)
- `welcome`: 1 (exclusive)
- `header`: 2 (badges)
- `prompt`: 5 (suggested prompts)
- `toast`: 1 (transient, auto-dismiss)

Limits configurable per surface in hook options.

**Consequences:**
- ✅ UX-appropriate defaults
- ✅ Flexible for specific needs
- ⚠️ Must document limits

---

### ADR-007: Lens Variant Resolution

**Status:** Accepted

**Context:**
Moments need lens-specific content (e.g., different opening lines for SimulationReveal). How to express variants?

**Decision:**
Content object can have `variants` keyed by lens ID. Evaluator merges variant into base content.

```json
{
  "content": {
    "heading": "Default heading",
    "body": "Default body",
    "variants": {
      "academic": { "heading": "Academic-specific heading" },
      "engineer": { "body": "Engineer-specific body" }
    }
  }
}
```

**Resolution order:**
1. Check `variants[activeLensId]`
2. Fall back to base content
3. Merge (variant overrides base, doesn't replace)

**Consequences:**
- ✅ Clean separation of base and variants
- ✅ Partial overrides supported
- ✅ Easy to add new lens variants
- ⚠️ No nested variant inheritance

---

### ADR-008: Cooldown Implementation

**Status:** Accepted

**Context:**
Some moments shouldn't show too frequently (e.g., journey offer after dismissal). Need cooldown mechanism.

**Decision:**
Store `momentCooldowns: Record<string, number>` in engagement context. Value is timestamp of last shown. Evaluator checks `now - lastShown >= moment.cooldown`.

**Storage:**
- In-memory for session cooldowns
- localStorage for persistent cooldowns (future)

**Consequences:**
- ✅ Simple timestamp comparison
- ✅ Per-moment granularity
- ⚠️ Memory grows with moments (but bounded)
- ⚠️ Persistence adds complexity

---

### ADR-009: Telemetry Event Design

**Status:** Accepted

**Context:**
Need to track moment effectiveness for optimization. What events to emit?

**Decision:**
Three core events via Engagement Bus:

```typescript
'moment.shown': { momentId, surface, timestamp }
'moment.actioned': { momentId, actionId, actionType, timestamp }
'moment.dismissed': { momentId, timestamp }
```

**Derived metrics:**
- Show rate = shown / eligible evaluations
- Action rate = actioned / shown
- Dismiss rate = dismissed / shown
- Conversion = specific action type / shown

**Consequences:**
- ✅ Sufficient for analytics
- ✅ Consistent with existing bus events
- ✅ Low overhead
- ⚠️ Need analytics pipeline to consume

---

### ADR-010: Migration Strategy

**Status:** Accepted

**Context:**
Existing reveals must continue working while we migrate. Can't do big-bang replacement.

**Decision:**
Phased migration with feature flag:

**Phase 1: Parallel Implementation**
- Build orchestrator alongside existing reveals
- Feature flag `USE_MOMENT_ORCHESTRATOR` (default: false)
- Both systems can coexist

**Phase 2: Moment Definitions**
- Port existing reveals to moment definitions
- Test parity with existing behavior
- Enable flag for testing cohort

**Phase 3: Deprecation**
- Remove old reveal components
- Remove feature flag
- Clean up redundant state

**Consequences:**
- ✅ Safe rollout
- ✅ Easy rollback
- ⚠️ Temporary code duplication
- ⚠️ Must maintain both during transition

---

### ADR-011: Registry Initialization

**Status:** Accepted

**Context:**
Moments need to be loaded before components render. When/how to initialize registry?

**Decision:**
Load moments in `EngagementProvider` initialization:

```typescript
// In EngagementProvider
useEffect(() => {
  import('@data/moments/core-moments.json')
    .then(data => momentRegistry.registerBatch(data.moments));
}, []);
```

**Future:** Support dynamic moment loading from API for personalization.

**Consequences:**
- ✅ Guaranteed loaded before use
- ✅ Single initialization point
- ✅ Extensible to dynamic loading
- ⚠️ Async loading adds complexity

---

### ADR-012: GroveObject Pattern Alignment

**Status:** Accepted

**Context:**
Grove has an established object model pattern (`GroveObject<T>`) used by journeys, hubs, and other entities. This provides unified identity, provenance tracking, lifecycle management, and inspector compatibility. The original engagement-orchestrator design used a flat schema that duplicated these concerns.

**Decision:**
Align moments with the GroveObject pattern:

```typescript
// Moment = GroveObject<MomentPayload>
interface Moment {
  meta: GroveObjectMeta;  // id, type, title, status, createdBy, tags, etc.
  payload: MomentPayload; // trigger, content, surface, priority, actions
}
```

**Benefits:**
1. **Unified search:** Find all objects by type, tag, status
2. **Provenance:** Track if moment was human-authored or AI-generated
3. **Lifecycle:** Draft → Active → Archived workflow
4. **Inspector:** Same panel patterns as lenses/journeys
5. **AI Gardener:** Future system can generate moment drafts

**Storage:**
Individual JSON files (following wizard pattern):
```
src/data/moments/
├── core/
│   ├── welcome-arrival.moment.json
│   └── simulation-reveal.moment.json
├── engagement/
│   └── entropy-journey-offer.moment.json
└── index.ts
```

**Consequences:**
- ✅ Consistent with existing patterns
- ✅ Enables future tooling (inspector, gardener)
- ✅ Better provenance tracking
- ✅ Supports status-based filtering (show only active)
- ⚠️ Slightly more verbose JSON structure
- ⚠️ Must validate both meta and payload

**Advisory Input:**
- **Park (10):** Pattern consistency reduces cognitive overhead
- **Asparouhova (7):** This enables community contribution workflows

---

### ADR-013: File-Based Moment Storage

**Status:** Accepted

**Context:**
Original design assumed a single `core-moments.json` array. But this doesn't scale well for:
- Version control (merge conflicts)
- Individual moment lifecycle
- Categorical organization

**Decision:**
Store moments as individual JSON files with `.moment.json` extension:

```
src/data/moments/
├── core/                          # Critical onboarding
│   ├── welcome-arrival.moment.json
│   └── simulation-reveal.moment.json
├── engagement/                    # Retention moments
│   ├── custom-lens-offer.moment.json
│   └── entropy-journey-offer.moment.json
├── education/                     # Feature discovery
│   └── first-sprout-prompt.moment.json
└── index.ts                       # Loader + exports
```

**Loading:**
Use Vite's `import.meta.glob` for automatic discovery:
```typescript
const momentFiles = import.meta.glob('./**/*.moment.json', { eager: true });
```

**Consequences:**
- ✅ Clean git history (one file per moment)
- ✅ Category organization via directories
- ✅ Individual status management
- ✅ Easy to add/remove moments
- ⚠️ More files to manage
- ⚠️ Glob import has slight build overhead

---

## Decision Summary

| ADR | Decision | Impact |
|-----|----------|--------|
| 001 | Declarative JSON definitions | High - core architecture |
| 002 | Priority-based conflict resolution | Medium |
| 003 | Explicit flags for shown state | Medium |
| 004 | Component registry for complex UI | Medium |
| 005 | Event-driven + context-change evaluation | Medium |
| 006 | Surface-specific limits | Low |
| 007 | Lens variant merging | Low |
| 008 | Timestamp-based cooldowns | Low |
| 009 | Three telemetry events | Low |
| 010 | Phased migration with flag | High - rollout safety |
| 011 | Provider-level initialization | Low |
| **012** | **GroveObject pattern alignment** | **High - pattern consistency** |
| **013** | **File-based moment storage** | **Medium - organization** |

---

*ADR complete. Ready for MIGRATION_MAP.md.*
