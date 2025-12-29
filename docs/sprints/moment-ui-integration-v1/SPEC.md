# SPEC.md — moment-ui-integration-v1

**Sprint:** moment-ui-integration-v1
**Created:** 2024-12-29
**Status:** Planning

---

## Purpose

Wire the declarative moment system (from `engagement-orchestrator-v1`) to actual UI surfaces in the Terminal. This sprint connects the infrastructure to visible, interactive moments.

---

## Scope

### In Scope

1. **MomentOverlay Component** - Modal overlay for high-priority moments (surface: 'overlay')
2. **KineticWelcome Integration** - Wire welcome surface moments as contextual prompts
3. **MomentInline Component** - In-stream moment cards (surface: 'inline')
4. **MomentToast Component** - Transient notifications (surface: 'toast')
5. **Component Registry** - Register reveal components (SimulationReveal, etc.)
6. **Journey Start Wiring** - Connect startJourney action to actual journey system

### Out of Scope

- New moment content (use existing 5 moments)
- Header surface implementation (future sprint)
- Prompt surface implementation (future sprint)
- Custom reveal component designs (use existing patterns)

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Overlay display | Pattern 6 (Component Composition) | Compose MomentOverlay into ExploreShell |
| Welcome integration | Pattern 7 (Object Model) | useMoments hook already exists, extend KineticWelcome |
| Toast notifications | Pattern 4 (Token Namespaces) | Use `--glass-*` tokens for toast styling |
| Journey start | Pattern 2 (Engagement Machine) | Wire executeAction to useJourneyState.startJourney |
| Component registry | Pattern 10 (Declarative Engine) | Lazy imports in component-registry.ts |

## New Patterns Proposed

None. All needs met by extending existing infrastructure.

---

## Technical Requirements

### 1. MomentOverlay Integration

```typescript
// In ExploreShell.tsx
import { useOverlayMoment } from '@surface/hooks/useMoments';
import { MomentOverlay } from '../MomentRenderer/MomentOverlay';

// Add to component:
const overlayMoment = useOverlayMoment();
// ... render MomentOverlay when overlayMoment exists
```

**Behavior:**
- Shows when overlay moment is eligible
- Backdrop blur, centered modal
- Actions trigger flag updates and navigation
- Dismissable via action or backdrop click

### 2. KineticWelcome Integration

```typescript
// Extend KineticWelcome to accept moment-driven prompts
interface KineticWelcomeProps {
  content: TerminalWelcome;
  prompts?: Array<{ id: string; text: string; command?: string; journeyId?: string }>;
  // NEW: Moment-driven prompts (take precedence if present)
  momentPrompts?: Moment[];
  onMomentAction: (momentId: string, actionId: string) => void;
}
```

**Behavior:**
- useMoments({ surface: 'welcome' }) in ExploreShell
- Pass moments to KineticWelcome as additional prompts
- Moment actions wired through executeAction

### 3. Component Registry Population

Create actual reveal components or wire existing ones:

```typescript
// component-registry.ts
const componentMap: Record<string, ComponentType<any>> = {
  SimulationReveal: lazy(() => import('./reveals/SimulationReveal')),
  CustomLensOffer: lazy(() => import('./reveals/CustomLensOffer')),
  EntropyJourneyOffer: lazy(() => import('./reveals/EntropyJourneyOffer')),
};
```

### 4. Journey Start Wiring

```typescript
// In useMoments executeAction:
if (action.type === 'startJourney' && action.journeyId) {
  const journey = getJourneyById(action.journeyId);
  if (journey) {
    // Get startJourney from useJourneyState
    actor.send({ type: 'START_JOURNEY', journey });
  }
}
```

---

## File Inventory

### New Files (7)

| File | Purpose |
|------|---------|
| `src/surface/components/MomentRenderer/MomentOverlay.tsx` | Full-screen overlay renderer |
| `src/surface/components/MomentRenderer/MomentInline.tsx` | In-stream card renderer |
| `src/surface/components/MomentRenderer/MomentToast.tsx` | Toast notification renderer |
| `src/surface/components/MomentRenderer/reveals/SimulationReveal.tsx` | Simulation reveal content |
| `src/surface/components/MomentRenderer/reveals/CustomLensOffer.tsx` | Lens offer content |
| `src/surface/components/MomentRenderer/reveals/EntropyJourneyOffer.tsx` | Journey offer content |
| `src/surface/hooks/useMomentActions.ts` | Action execution with journey/lens wiring |

### Modified Files (5)

| File | Change |
|------|--------|
| `src/surface/components/KineticStream/ExploreShell.tsx` | Add MomentOverlay, wire welcome moments |
| `src/surface/components/KineticStream/KineticWelcome.tsx` | Accept moment-driven prompts |
| `src/surface/components/MomentRenderer/component-registry.ts` | Populate with actual imports |
| `src/surface/components/MomentRenderer/index.ts` | Export new components |
| `src/surface/hooks/useMoments.ts` | Add journey start wiring in executeAction |

---

## DEX Compliance

- **Declarative Sovereignty:** Moment content and triggers remain in JSON files; this sprint only wires UI
- **Capability Agnosticism:** UI rendering works regardless of model - moments are data-driven
- **Provenance:** Moment shown/actioned events tracked via telemetry (existing)
- **Organic Scalability:** New reveal components added to registry without code changes

---

## Success Criteria

1. `simulation-reveal.moment.json` displays as overlay after journey completion
2. Welcome moments appear as contextual prompts in KineticWelcome
3. `startJourney` action actually starts a journey in engagement machine
4. Toast notifications appear for relevant moments
5. All 5 existing moments can render on their designated surfaces

---

## Dependencies

- `engagement-orchestrator-v1` (completed c1df11b)
- `kinetic-context-v1` (completed ad0b8b7)
- Journey registry (`src/data/journeys/index.ts`)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Component registry complexity | Low | Medium | Keep reveals simple, extend later |
| XState journey state conflicts | Low | High | Test state transitions carefully |
| Z-index conflicts with overlay | Medium | Low | Use consistent z-index tokens |
