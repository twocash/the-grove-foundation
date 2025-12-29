# ADR.md — moment-ui-integration-v1

**Sprint:** moment-ui-integration-v1
**Created:** 2024-12-29

---

## ADR-014: Surface-Specific Moment Renderers

### Context

The engagement-orchestrator-v1 sprint created the declarative moment system with:
- Moment schema following GroveObject pattern
- Trigger evaluator
- useMoments hook
- Generic MomentCard component

We now need to render moments on specific UI surfaces (overlay, inline, welcome, toast).

### Decision

Create surface-specific wrapper components that:
1. Handle surface-specific layout and animation
2. Delegate content rendering to MomentCard
3. Manage dismissal and action behaviors

**Component hierarchy:**
```
MomentOverlay (handles modal/backdrop)
  └── MomentCard (handles content)
        └── ComponentContent (handles custom reveals)
              └── SimulationReveal (domain content)
```

### Rationale

- Single responsibility: Surface components handle positioning, MomentCard handles content
- Testable: Each layer can be tested independently
- Extensible: New surfaces added without modifying content layer

### Alternatives Considered

**Option A:** Single MomentRenderer with surface prop
- Rejected: Would require conditional logic for each surface
- Violates: DEX Declarative Sovereignty (behavior in code)

**Option B:** Generic portal system
- Rejected: Over-engineered for current needs
- Consider for future header/prompt surfaces

---

## ADR-015: Action Execution Hook Separation

### Context

Currently, useMoments.executeAction handles:
- Flag updates
- Cooldown updates
- Telemetry

It needs to also handle:
- Journey starts
- Lens selection
- Navigation

### Decision

Create dedicated `useMomentActions` hook that:
1. Imports from journey and lens systems
2. Provides unified action executor
3. Keeps useMoments focused on moment evaluation

```typescript
// useMomentActions.ts
export function useMomentActions() {
  const { startJourney } = useJourneyState({ actor });
  const { selectLens } = useLensState({ actor });
  
  const execute = useCallback((action: MomentAction) => {
    switch (action.type) {
      case 'startJourney':
        const journey = getJourneyById(action.journeyId!);
        if (journey) startJourney(journey);
        break;
      case 'selectLens':
        selectLens(action.lensId!);
        break;
      // ... other types
    }
  }, [startJourney, selectLens]);
  
  return { execute };
}
```

### Rationale

- Separation of concerns: Evaluation vs execution
- Testable: Action execution can be mocked independently
- Extensible: New action types added in one place

---

## ADR-016: Reveal Component Pattern

### Context

Moments with `content.type: 'component'` need custom React components registered in the component registry.

### Decision

Create lightweight reveal components that:
1. Accept moment data as props
2. Handle lens-variant content internally
3. Render using glass/kinetic styling

**Location:** `src/surface/components/MomentRenderer/reveals/`

**Pattern:**
```typescript
// reveals/SimulationReveal.tsx
interface SimulationRevealProps {
  moment: Moment;
  opening?: string;  // From variant props
}

export function SimulationReveal({ moment, opening }: SimulationRevealProps) {
  const defaultOpening = "This terminal is proof that distributed AI works.";
  return (
    <div className="simulation-reveal">
      <p className="text-lg text-[var(--glass-text-primary)]">
        {opening || defaultOpening}
      </p>
      {/* Additional reveal content */}
    </div>
  );
}
```

### Rationale

- Lens-specific content handled via `content.variants[lens].props`
- Consistent styling via token namespaces
- Lazy loading via component registry
