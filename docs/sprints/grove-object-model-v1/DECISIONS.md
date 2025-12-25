# Architecture Decision Records: Grove Object Model v1

**Sprint:** grove-object-model-v1

---

## ADR-001: Flattened Extension Over Nested Meta

**Status:** Accepted

**Context:**
When adding GroveObjectMeta to existing types, we have two options:
1. Nested: `journey.meta.title`
2. Flattened: `journey.title` (Journey extends GroveObjectMeta)

**Decision:** Use flattened extension.

**Rationale:**
- Backward compatibility: Existing code accessing `journey.title` continues working
- Simpler access patterns: No `.meta.` indirection
- JSON serialization: Matches existing data format in NarrativeSchema
- TypeScript ergonomics: `extends` is cleaner than composition for this use case

**Consequences:**
- Journey (and future types) have many top-level fields
- Type narrowing requires checking `type` field
- Clear separation between "meta" and "payload" is less explicit

---

## ADR-002: Type Dispatch via Renderer Registry

**Status:** Accepted

**Context:**
GroveObjectCard needs to render different content for different object types. Options:
1. Switch statement in component
2. Registry object mapping types to renderers
3. Dynamic import based on type

**Decision:** Use registry object (option 2).

**Rationale:**
- Extensible: Add new types without modifying GroveObjectCard
- Type-safe: Registry can be typed to ensure all types have renderers
- Testable: Can mock individual renderers
- Predictable: No dynamic imports, clear bundling

**Implementation:**
```typescript
const CONTENT_RENDERERS: Record<GroveObjectType, React.ComponentType> = {
  journey: JourneyCardContent,
  hub: HubCardContent,
  // ...
};
```

**Consequences:**
- Must remember to add renderer when adding new types
- All renderers bundled together (acceptable for Grove's scale)

---

## ADR-003: Favorites in localStorage (Not Schema)

**Status:** Accepted

**Context:**
Favorites need to persist. Options:
1. Add `favorite` field to schema objects
2. Store favorites in localStorage by object ID
3. Store in user preferences API

**Decision:** localStorage by object ID (option 2).

**Rationale:**
- User-local: Different users have different favorites
- Non-destructive: Doesn't modify source schema
- Simple: No API changes required
- Fast: Synchronous reads
- Offline-capable: Works without network

**Consequences:**
- Not synced across devices (acceptable for v1)
- Limited to ~1000 favorites (localStorage size)
- Need to merge favorites into normalized objects at runtime

**Future:** Cloud sync via user preferences API in v2.

---

## ADR-004: Normalization at Hook Level

**Status:** Accepted

**Context:**
Existing types (Journey, Hub, etc.) need to become GroveObjects. Options:
1. Modify source data to include GroveObjectMeta
2. Normalize at hook level (useGroveObjects)
3. Normalize at component level (GroveObjectCard)

**Decision:** Normalize at hook level (option 2).

**Rationale:**
- Single source of truth: Normalization happens once
- Reusable: Any component using useGroveObjects gets normalized data
- Testable: Normalizers are pure functions
- Non-breaking: Source data unchanged

**Implementation:**
```typescript
function useGroveObjects(options) {
  const { journeys } = useNarrativeEngine();
  return Object.values(journeys).map(normalizeJourney);
}
```

**Consequences:**
- Slight runtime cost for normalization (acceptable)
- Need normalizer for each source type

---

## ADR-005: Journey First Migration Strategy

**Status:** Accepted

**Context:**
Six object types could implement GroveObjectMeta. Order of migration matters.

**Decision:** Journey first, then Hub, Sprout, Persona. Cards/Nodes deferred.

**Rationale:**
- Journey already closest to target (has timestamps, status)
- Journey is actively used in current UI
- Hub and Sprout are simpler, follow naturally
- Persona has many config fields, needs careful planning
- Cards/Nodes have complex relationships, lowest priority

**Migration Order:**
1. Journey (v1)
2. TopicHub (v1.1)
3. Sprout (v1.2)
4. Persona (v1.3)
5. Card/Node (v2, maybe)

**Consequences:**
- Immediate value from Journey migration
- Incremental validation of pattern
- Cards/Nodes may never need migration if replaced by nodes

---

## ADR-006: GroveObjectType as Extensible Union

**Status:** Accepted

**Context:**
The `type` field identifies object types. Options:
1. Strict enum: `'journey' | 'hub' | 'sprout'`
2. Extensible union: `'journey' | 'hub' | string`
3. Fully open: `string`

**Decision:** Extensible union (option 2).

**Rationale:**
- Type safety: Known types have autocomplete
- Extensibility: Custom types allowed via `string`
- Forward compatible: AI can create new types without schema changes
- Explicit: Known types are documented in the union

**Implementation:**
```typescript
export type GroveObjectType = 
  | 'lens'
  | 'journey'
  | 'hub'
  | 'sprout'
  | 'node'
  | 'card'
  | string;  // Custom types
```

**Consequences:**
- Renderer registry needs fallback for unknown types
- Type guards needed for type-specific operations

---

## ADR-007: Provenance as Structured Object

**Status:** Accepted

**Context:**
Tracking who/what created objects. Options:
1. Simple string: `createdBy: 'user-123'`
2. Structured object with context
3. Reference to external provenance system

**Decision:** Structured object (option 2).

**Rationale:**
- AI attribution: Need to know which model, with what prompt
- Context preservation: Capture lens, journey, session at creation time
- Queryable: Can filter by `createdBy.type === 'ai'`
- Self-contained: No external system dependency

**Implementation:**
```typescript
interface GroveObjectProvenance {
  type: 'human' | 'ai' | 'system' | 'import';
  actorId?: string;
  context?: {
    lensId?: string;
    journeyId?: string;
    sessionId?: string;
    sourceFile?: string;
  };
}
```

**Consequences:**
- More complex than simple string
- Need to populate context at creation time
- Valuable for debugging and analytics

---

## ADR-008: Use Sprint 6 Card Tokens

**Status:** Accepted

**Context:**
GroveObjectCard needs styling. Options:
1. Create new token namespace for generic cards
2. Use existing `--card-*` tokens from Sprint 6
3. Inline styles

**Decision:** Use existing `--card-*` tokens (option 2).

**Rationale:**
- Consistency: All cards look unified
- DRY: Tokens already defined and tested
- Themeable: Dark mode, customization work automatically
- Pattern compliance: Aligns with Pattern 4 (Token Namespaces)

**Dependency:** Sprint 6 (card-system-unification-v1) must complete first.

**Consequences:**
- GroveObjectCard inherits same visual states
- Any token changes affect all cards (feature, not bug)

---

## Decision Summary

| ADR | Decision | Key Trade-off |
|-----|----------|---------------|
| 001 | Flattened extension | Backward compat > explicit separation |
| 002 | Renderer registry | Extensibility > simplicity |
| 003 | localStorage favorites | Local-first > cloud sync |
| 004 | Hook-level normalization | Single source > raw access |
| 005 | Journey first | Quick value > comprehensive |
| 006 | Extensible type union | Safety + flexibility |
| 007 | Structured provenance | Rich context > simplicity |
| 008 | Sprint 6 tokens | Consistency > independence |

---

*All decisions align with DEX principles and incremental delivery.*
