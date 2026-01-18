# Kinetic Foundation v1.0 — Architecture Decision Records

**Sprint:** `kinetic-foundation-v1`  
**Date:** December 24, 2024

---

## ADR-001: Extract vs Rewrite Strategy

### Status
**Accepted**

### Context
NarrativeArchitect contains working patterns that could be:
1. **Extracted** into reusable components (preserve working code)
2. **Rewritten** from scratch with ideal architecture

### Decision
**Extract** working patterns into shared components.

### Rationale
- NarrativeArchitect is battle-tested and working in production
- Extraction preserves working behavior while enabling reuse
- Rewrite would risk introducing regressions
- Time to value is faster with extraction

### Alternatives Considered
1. **Full Rewrite:** Build all components from scratch
   - Rejected: Higher risk, no clear benefit
2. **No Change:** Keep inline components
   - Rejected: Blocks other consoles from reusing patterns

### Consequences
- Some "not invented here" patterns will persist
- Components may need refinement after extraction
- Migration is incremental, not big-bang

---

## ADR-002: DEX Object Model Design

### Status
**Accepted**

### Context
Current schema has multiple type families:
- V2.1: Journey, JourneyNode, TopicHub
- V2.0: Card, Persona
- Future: Sprouts, Agent proposals

Need unified type system for:
- Consistent CRUD operations
- Inspector pattern generalization
- Agent proposal pipeline

### Decision
Create `DEXObject` base interface with kinetic metadata fields. All domain types extend this base.

### Rationale
- Single pattern for all objects enables generic components
- Kinetic fields (proposedBy, telemetryScore) prepare for agent integration
- Backward compatible: existing types can be cast to DEX types

### Schema Design
```typescript
interface DEXObject {
  // Identity
  id: string;
  type: DEXObjectType;
  
  // Display
  label: string;
  description?: string;
  
  // Lifecycle
  status: 'draft' | 'active' | 'archived';
  version: number;
  createdAt: string;
  updatedAt: string;
  
  // Kinetic (optional, for future agent support)
  proposedBy?: 'human' | 'agent';
  approvedBy?: string;
  telemetryScore?: number;
  evolutionHistory?: DEXVersionEntry[];
}
```

### Alternatives Considered
1. **Keep separate types:** Journey, Node, Hub remain independent
   - Rejected: Duplicates patterns, blocks generalization
2. **Union type:** `type DEXObject = Journey | Node | Hub | ...`
   - Rejected: No shared fields, can't build generic components

### Consequences
- New types must extend DEXObject
- Some type casting required for backward compatibility
- Kinetic fields add small overhead even when unused

---

## ADR-003: Registry Pattern for State Management

### Status
**Accepted**

### Context
Current state management:
- `useNarrativeSchema` hook manages all state internally
- Each console could duplicate this pattern
- No shared subscription mechanism

Options:
1. Keep per-console hooks
2. Global state (Redux/Zustand)
3. Registry pattern with React Context

### Decision
**Registry pattern** with React Context. DEXRegistry provides centralized CRUD with subscriptions.

### Rationale
- Registry is the natural Kinetic Architecture pattern
- React Context integrates seamlessly with existing code
- No new dependencies (Redux/Zustand)
- Enables future agent proposal queue

### Implementation
```typescript
const DEXRegistryContext = createContext<DEXRegistryContextValue | null>(null);

function useDEXRegistry() {
  const ctx = useContext(DEXRegistryContext);
  if (!ctx) throw new Error('useDEXRegistry must be used within DEXRegistryProvider');
  return ctx;
}
```

### Alternatives Considered
1. **Redux:** Global state management
   - Rejected: Overkill for this use case, adds dependency
2. **Zustand:** Lightweight global state
   - Rejected: Still adds dependency, Context is sufficient
3. **Per-console hooks:** Each console manages own state
   - Rejected: Duplicates code, blocks shared inspector

### Consequences
- Registry must be wrapped at app level
- All consumers share same state (desired)
- Persistence logic centralized in registry

---

## ADR-004: Backward Compatibility Strategy

### Status
**Accepted**

### Context
Production is running with:
- V2.1 schema (journeys, nodes, hubs)
- V2.0 schema (cards, personas) for some installations
- GCS storage format
- GitHub sync

Cannot break:
- Data loading
- Data saving
- GitHub PR creation
- Inspector integration

### Decision
**Facade pattern** for useNarrativeSchema. Public API unchanged, internal implementation delegates to DEXRegistry.

### Rationale
- Existing consumers (NarrativeArchitect) continue working
- Internal refactor is invisible to callers
- Can gradually migrate consumers to direct registry use

### Implementation
```typescript
// Public API (unchanged)
export function useNarrativeSchema() {
  // Internal delegation to registry
  const registry = useDEXRegistry();
  
  return {
    // Existing API surface
    allJourneys: registry.getAll<DEXJourney>('journey'),
    getJourney: (id) => registry.get<DEXJourney>('journey', id),
    save: () => registry.save(),
    // ... etc
  };
}
```

### Alternatives Considered
1. **Breaking change:** New API, update all consumers
   - Rejected: Risk of regressions, unnecessary
2. **Parallel APIs:** Old and new coexist
   - Rejected: Maintenance burden, confusing

### Consequences
- useNarrativeSchema becomes thin facade
- Some type casting between DEX and legacy types
- Migration to direct registry use is optional

---

## ADR-005: Component Generics Strategy

### Status
**Accepted**

### Context
Extracted components need to work with different object types:
- ObjectList: Journeys, Personas, Lenses
- ObjectGrid: Nodes, Cards
- SegmentedControl: String literals

Options:
1. Concrete types per component
2. Generic components with type parameters
3. Render props pattern

### Decision
**Generic components** with `getItemProps` callback for type-specific rendering.

### Rationale
- Type safety at compile time
- Flexible enough for different object shapes
- Render props would be more complex
- Concrete types would require duplicating components

### Implementation
```typescript
interface ObjectListProps<T> {
  items: T[];
  getItemProps: (item: T) => ObjectListItem;
  // ... other props
}

function ObjectList<T>({ items, getItemProps, ...props }: ObjectListProps<T>) {
  return items.map(item => {
    const { id, label, count, status } = getItemProps(item);
    // render with normalized props
  });
}
```

### Alternatives Considered
1. **Render props:** `renderItem={(item) => <div>...</div>}`
   - Rejected: More flexible but less consistent styling
2. **Concrete types:** `JourneyList`, `NodeGrid` separately
   - Rejected: Code duplication

### Consequences
- Consumer must provide `getItemProps` callback
- Type inference works with generics
- Styling remains consistent across uses

---

## ADR-006: Testing Strategy

### Status
**Accepted**

### Context
Need to verify:
- New components render correctly
- Registry CRUD operations work
- NarrativeArchitect continues working
- E2E flows pass

### Decision
**Layered testing:**
1. Unit tests for types and registry
2. Component tests for shared components
3. E2E tests for user flows

### Test Files
```
tests/unit/core/schema/dex.test.ts        # Type validation
tests/unit/core/registry/DEXRegistry.test.ts  # CRUD operations
tests/unit/shared/SegmentedControl.test.tsx   # Component render
tests/unit/shared/ObjectList.test.tsx         # Component render
tests/unit/shared/ObjectGrid.test.tsx         # Component render
tests/e2e/foundation/narrative-architect.spec.ts  # User flows
```

### Build Gate
```bash
npm test                    # Unit + component tests
npx playwright test         # E2E tests
npm run build              # Compile check
```

### Consequences
- Test coverage increases
- CI gate prevents regressions
- Some test setup required for registry

---

## ADR-007: Capture Context for Entropy Integration

### Status
**Accepted**

### Context
The "Entropy as DEX Infrastructure Vision" document establishes that entropy detection provides situational awareness for the Trellis Architecture. When objects (especially Sprouts) are created, the complexity context at capture time should be recorded as provenance.

### Decision
Add optional `captureContext` field to `DEXObject` with entropy and session metadata.

### Schema
```typescript
interface DEXCaptureContext {
  entropyScore?: number;                    // 0-1 complexity score
  entropyLevel?: 'low' | 'medium' | 'high'; // Discretized
  sessionId?: string;                       // Conversation session
  journeyId?: string;                       // If in journey
  nodeId?: string;                          // Specific step
  lensId?: string;                          // Active persona
}

interface DEXObject {
  // ... existing fields ...
  captureContext?: DEXCaptureContext;
}
```

### Rationale
- Enables "cognitive archaeology" — understanding how insights emerged
- Positions Sprout system for entropy integration
- Optional field, no breaking changes
- Aligns with Provenance as Infrastructure pillar

### Alternatives Considered
1. **Defer to Sprint 2:** Wait until Sprout queue migration
   - Rejected: Small addition now prevents schema changes later
2. **Sprout-only field:** Only add to DEXSprout
   - Rejected: Other objects may benefit from capture context

### Consequences
- ~10 lines added to type definitions
- All DEX objects can optionally record capture context
- Ready for entropy integration without schema migration

---

## Decision Log

| ID | Decision | Date | Status |
|----|----------|------|--------|
| ADR-001 | Extract vs Rewrite | 2024-12-24 | Accepted |
| ADR-002 | DEX Object Model | 2024-12-24 | Accepted |
| ADR-003 | Registry Pattern | 2024-12-24 | Accepted |
| ADR-004 | Backward Compatibility | 2024-12-24 | Accepted |
| ADR-005 | Component Generics | 2024-12-24 | Accepted |
| ADR-006 | Testing Strategy | 2024-12-24 | Accepted |
| ADR-007 | Capture Context | 2024-12-24 | Accepted |
