# ARCH_DECISIONS.md — kinetic-context-v1

## ADR-001: Reuse Terminal Infrastructure

**Context:** Terminal has mature lens/journey state management via engagement hooks.

**Decision:** Import and use existing hooks rather than recreating:
- `useLensState` from `@core/engagement`
- `useJourneyState` from `@core/engagement`
- `useSuggestedPrompts` from `hooks/useSuggestedPrompts`

**Rationale:** DRY principle. These hooks are well-tested and integrated with XState.

**Consequences:** KineticStream depends on core engagement infrastructure.

---

## ADR-002: Component Adaptation vs. Import

**Context:** Should we import TerminalHeader/TerminalWelcome or create new components?

**Decision:** Create new KineticHeader/KineticWelcome components that adapt patterns.

**Rationale:**
- Terminal components have overlay/embedded variant logic we don't need
- KineticStream uses `--glass-*` tokens exclusively
- Cleaner separation allows independent evolution
- Avoids importing Terminal's complex prop interfaces

**Consequences:** Some code duplication, but simpler maintenance.

---

## ADR-003: Overlay State as Local useState

**Context:** How should overlay state (picker open/closed) be managed?

**Decision:** Use local `useState` in ExploreShell, not XState.

```typescript
const [overlay, setOverlay] = useState<{ type: KineticOverlayType }>({ type: 'none' });
```

**Rationale:**
- Overlay state is UI-only, doesn't need persistence
- Simpler than adding to engagement machine
- Easy to reason about

**Consequences:** No cross-component overlay coordination (acceptable for now).

---

## ADR-004: Picker Component Reuse

**Context:** Should we create new picker components or reuse Terminal's?

**Decision:** Import and reuse Terminal's LensPicker and JourneyPicker.

**Rationale:**
- Pickers are self-contained modal components
- They handle their own styling
- No benefit to recreating them

**Consequences:** KineticStream imports from `components/Terminal/`.

---

## ADR-005: Welcome Shows When No Messages

**Context:** When should the personalized welcome appear?

**Decision:** Show KineticWelcome when `items.length === 0`.

```tsx
{items.length === 0 && lens && (
  <KineticWelcome content={welcomeContent} ... />
)}
```

**Rationale:** Matches Terminal pattern. Once conversation starts, welcome disappears.

**Consequences:** Welcome content set by lens selection persists until first message.

---

## ADR-006: Stage Calculation

**Context:** How is engagement stage determined?

**Decision:** Import stage calculation from `useEngagementBridge` or compute from state:

```typescript
const computedStage = useMemo(() => {
  if (journeysCompleted >= 1 || exchangeCount >= 10) return 'ENGAGED';
  if (topicsExplored.length >= 2 || exchangeCount >= 5) return 'EXPLORING';
  if (exchangeCount >= 3) return 'ORIENTED';
  return 'ARRIVAL';
}, [journeysCompleted, exchangeCount, topicsExplored.length]);
```

**Rationale:** Consistent with Terminal's stage logic.

**Consequences:** Stage updates as user engages with stream.

---

## ADR-007: Suggested Prompts Integration

**Context:** How do personalized prompts flow into the welcome card?

**Decision:** Use `useSuggestedPrompts` hook with lens context:

```typescript
const { prompts, stage, refreshPrompts } = useSuggestedPrompts({
  lensId: lens,
  lensName: lensData?.publicLabel,
  maxPrompts: 3,
});
```

**Rationale:** Hook already exists and handles stage-aware prompt generation.

**Consequences:** Prompts may include `journeyId` for structured path starts.

---

## DEX Compliance Notes

**Declarative Sovereignty:** Lens/journey definitions live in schema, not code.

**Capability Agnosticism:** Context system works regardless of AI backend.

**Provenance as Infrastructure:** Stage tracking documents user journey.

**Organic Scalability:** Adding new lenses/journeys requires only data updates.
