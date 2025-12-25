# Architecture: Grove Object Model v1

**Sprint:** grove-object-model-v1  
**Pattern:** Pattern 7 (Object Model) — NEW  
**Dependencies:** Sprint 6 (card-system-unification-v1) for `--card-*` tokens

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GROVE OBJECT MODEL                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     GroveObjectMeta (Base)                           │  │
│  │  id | type | title | description | icon | color                      │  │
│  │  createdAt | updatedAt | createdBy | status | tags | favorite        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│           ▲              ▲              ▲              ▲                    │
│           │              │              │              │                    │
│  ┌────────┴───┐  ┌──────┴─────┐  ┌─────┴─────┐  ┌────┴─────┐              │
│  │  Journey   │  │  TopicHub  │  │   Sprout  │  │  Persona │  + Future    │
│  │  (v1)      │  │  (v1.1)    │  │   (v1.2)  │  │  (v1.3)  │              │
│  └────────────┘  └────────────┘  └───────────┘  └──────────┘              │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                     RENDERING LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    GroveObjectCard                                   │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │  Journey    │ │   Hub       │ │   Sprout    │ │   Lens      │   │   │
│  │  │  Content    │ │   Content   │ │   Content   │ │   Content   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  │                                                                     │   │
│  │  Uses: --card-* tokens | isActive | isInspected | variant          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                     COLLECTION LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    useGroveObjects                                   │   │
│  │                                                                      │   │
│  │  filter: types[], status[], tags[], favorite                        │   │
│  │  sort: createdAt | updatedAt | title                                │   │
│  │  actions: setFavorite(), addTag(), removeTag()                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Data Sources:                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                  │
│  │ NarrativeEng  │  │ SproutQueue   │  │ localStorage  │                  │
│  │ (journeys,    │  │ (sprouts)     │  │ (favorites,   │                  │
│  │  hubs, etc)   │  │               │  │  user tags)   │                  │
│  └───────────────┘  └───────────────┘  └───────────────┘                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Schema Layer

### GroveObjectMeta: The Universal Contract

Every object in Grove implements this interface, enabling unified operations:

```typescript
// src/core/schema/grove-object.ts

export interface GroveObjectMeta {
  // IDENTITY - Who is this object?
  id: string;
  type: GroveObjectType;
  
  // DISPLAY - How does it appear?
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  
  // TIME - When did things happen?
  createdAt: string;
  updatedAt: string;
  
  // PROVENANCE - Where did it come from?
  createdBy?: GroveObjectProvenance;
  
  // LIFECYCLE - What state is it in?
  status?: 'active' | 'draft' | 'archived' | 'pending';
  
  // ORGANIZATION - How is it categorized?
  tags?: string[];
  favorite?: boolean;
}
```

### Type Extension Pattern

Existing types extend GroveObjectMeta using **flattened inheritance** for backward compatibility:

```typescript
// BEFORE: Journey without Object Model
interface Journey {
  id: string;
  title: string;
  description: string;
  status: JourneyStatus;
  createdAt: string;
  updatedAt: string;
  // ... type-specific fields
}

// AFTER: Journey with Object Model
interface Journey extends GroveObjectMeta {
  type: 'journey';  // Narrowed from GroveObjectType
  
  // Type-specific fields (unchanged)
  entryNode: string;
  targetAha: string;
  linkedHubId?: string;
  estimatedMinutes: number;
}
```

**Why flattened (not nested)?**
- Backward compatibility: Existing code accessing `journey.title` still works
- Simpler queries: No need to dig into `journey.meta.title`
- JSON serialization: Flat structure matches existing data format

---

## Rendering Layer

### GroveObjectCard Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ GroveObjectCard                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Card Shell (--card-* tokens)                            │ │
│ │                                                         │ │
│ │  isInspected → ring-2 ring-[var(--card-ring-color)]    │ │
│ │  isActive    → bg-[var(--card-bg-active)] ring-1       │ │
│ │  default     → border-[var(--card-border-default)]     │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Header                                              │ │ │
│ │ │ [Icon] Title            [Favorite ★] [Actions ⋯]   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Content (type-dispatched)                           │ │ │
│ │ │                                                     │ │ │
│ │ │ <JourneyContent /> | <HubContent /> | <Generic />  │ │ │
│ │ │                                                     │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Footer                                              │ │ │
│ │ │ [Tags] [Status Badge] [Primary Action Button]       │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Type Dispatch Strategy

```typescript
// Type-specific content renderers
const CONTENT_RENDERERS: Record<string, React.ComponentType<ContentProps>> = {
  journey: JourneyCardContent,
  hub: HubCardContent,
  lens: LensCardContent,
  sprout: SproutCardContent,
};

function GroveObjectCard({ object, ...props }: GroveObjectCardProps) {
  const ContentRenderer = CONTENT_RENDERERS[object.type] ?? GenericCardContent;
  
  return (
    <CardShell {...props} meta={object.meta}>
      <ContentRenderer object={object} />
    </CardShell>
  );
}
```

**Extensibility:** Add new renderers to the map without modifying GroveObjectCard.

---

## Collection Layer

### useGroveObjects Data Flow

```
┌────────────────────┐
│  Component         │
│  useGroveObjects({ │
│    types: ['journey'],
│    favorite: true  │
│  })                │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  useGroveObjects   │
│  (hook)            │
└─────────┬──────────┘
          │
          ├──────────────┬──────────────┐
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Narrative    │ │ SproutQueue  │ │ localStorage │
│ Engine       │ │ (API)        │ │ (user prefs) │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
               ┌────────────────┐
               │  Normalizer    │
               │  → GroveObject │
               └────────┬───────┘
                        │
                        ▼
               ┌────────────────┐
               │  Filter/Sort   │
               └────────┬───────┘
                        │
                        ▼
               ┌────────────────┐
               │  Return to     │
               │  Component     │
               └────────────────┘
```

### Normalization Functions

```typescript
// Each type has a normalizer to GroveObject

function normalizeJourney(journey: Journey): GroveObject<Journey> {
  return {
    meta: {
      id: journey.id,
      type: 'journey',
      title: journey.title,
      description: journey.description,
      icon: journey.icon,
      color: journey.color,
      createdAt: journey.createdAt,
      updatedAt: journey.updatedAt,
      status: journey.status,
      // These may come from user preferences overlay
      tags: journey.tags,
      favorite: journey.favorite,
    },
    payload: journey,
  };
}

// Future: normalizeHub, normalizeSprout, etc.
```

---

## DEX Compliance

### Declarative Sovereignty

**How domain experts modify behavior without code:**

1. **New object types:** Add to `GroveObjectType` union and register renderer
2. **Custom tags:** User-defined via localStorage (no code)
3. **Status values:** Extend status union in schema
4. **Display fields:** icon, color, description all in data

**Future (v2):** Object type definitions in config file:
```yaml
objectTypes:
  thesis:
    icon: "Lightbulb"
    defaultStatus: "draft"
    requiredFields: ["claim", "evidence"]
    cardRenderer: "ThesisCardContent"
```

### Capability Agnosticism

**Works regardless of model:**
- Pure data schema, no LLM calls
- Normalization is deterministic
- Filtering/sorting is local computation

### Provenance

**Every object tracks origin:**
```typescript
createdBy: {
  type: 'ai',
  actorId: 'gemini-1.5-pro',
  context: {
    lensId: 'researcher',
    sessionId: 'abc123',
    prompt: 'Generate journey about X'
  }
}
```

### Organic Scalability

**Grows without restructuring:**
- New types: Add normalizer + renderer
- New metadata: Optional fields on GroveObjectMeta
- New sources: Add to useGroveObjects aggregation

---

## State Management

### What Lives Where

| Data | Storage | Scope |
|------|---------|-------|
| Object definitions | NarrativeEngine (schema) | Global |
| Object status | Schema + API | Global |
| Favorites | localStorage | User-local |
| User tags | localStorage | User-local |
| Filter/sort state | Component state | Session |

### Favorites Implementation

```typescript
// src/core/storage/user-preferences.ts

const FAVORITES_KEY = 'grove:favorites';
const MAX_FAVORITES = 1000;

export function getFavorites(): string[] {
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function setFavorite(id: string, favorite: boolean): void {
  const favorites = getFavorites();
  
  if (favorite && !favorites.includes(id)) {
    // Add, respecting max
    const updated = [id, ...favorites].slice(0, MAX_FAVORITES);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } else if (!favorite && favorites.includes(id)) {
    // Remove
    const updated = favorites.filter(f => f !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  }
}
```

---

## Integration with Existing Systems

### NarrativeEngine

GroveObjectCard and useGroveObjects consume from NarrativeEngine:

```typescript
// In useGroveObjects
const { journeys } = useNarrativeEngine();

const normalizedJourneys = Object.values(journeys ?? {})
  .map(normalizeJourney)
  .filter(matchesFilters);
```

No changes to NarrativeEngine required for v1.

### Existing Card Components

**Phase 1 (v1):** GroveObjectCard exists alongside LensCard, JourneyCard
**Phase 2:** Existing cards refactored to use GroveObjectCard internally
**Phase 3:** Direct GroveObjectCard usage everywhere

This gradual migration prevents breaking changes.

### Sprint 6 Tokens

GroveObjectCard uses `--card-*` tokens from Sprint 6:

```typescript
// CardShell component
className={cn(
  "rounded-xl border transition-all",
  isInspected
    ? "ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]"
    : isActive
      ? "bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1"
      : "border-[var(--card-border-default)]"
)}
```

---

## File Structure

```
src/
├── core/
│   └── schema/
│       ├── grove-object.ts      ← NEW: Base types
│       └── narrative.ts         ← MODIFIED: Journey extends GroveObjectMeta
│
├── surface/
│   ├── components/
│   │   └── GroveObjectCard/
│   │       ├── index.tsx        ← Main component
│   │       ├── CardShell.tsx    ← Styling wrapper
│   │       ├── ContentRenderers/
│   │       │   ├── JourneyContent.tsx
│   │       │   ├── HubContent.tsx
│   │       │   └── GenericContent.tsx
│   │       └── types.ts
│   │
│   └── hooks/
│       ├── useGroveObjects.ts   ← NEW: Collection hook
│       └── normalizers/
│           ├── index.ts
│           └── journey.ts
│
└── lib/
    └── storage/
        └── user-preferences.ts  ← NEW: Favorites storage
```

---

## Testing Strategy

### Unit Tests

```typescript
// grove-object.test.ts
describe('normalizeJourney', () => {
  it('maps all GroveObjectMeta fields', () => {
    const journey = createMockJourney();
    const normalized = normalizeJourney(journey);
    
    expect(normalized.meta.id).toBe(journey.id);
    expect(normalized.meta.type).toBe('journey');
    expect(normalized.meta.title).toBe(journey.title);
  });
});
```

### Component Tests

```typescript
// GroveObjectCard.test.tsx
describe('GroveObjectCard', () => {
  it('renders journey content for journey type', () => {
    const object = normalizeJourney(createMockJourney());
    render(<GroveObjectCard object={object} />);
    
    expect(screen.getByText(object.meta.title)).toBeInTheDocument();
  });
  
  it('applies inspected styling', () => {
    const object = normalizeJourney(createMockJourney());
    render(<GroveObjectCard object={object} isInspected />);
    
    const card = screen.getByRole('article');
    expect(card).toHaveClass('ring-2');
  });
});
```

---

## Migration Path

### v1 (This Sprint)
- GroveObjectMeta types
- Journey extends GroveObjectMeta
- GroveObjectCard renders journeys
- useGroveObjects returns journeys
- Favorites for journeys

### v1.1
- TopicHub extends GroveObjectMeta
- HubCardContent renderer
- useGroveObjects includes hubs

### v1.2
- Sprout normalized to GroveObject
- SproutCardContent renderer
- useGroveObjects includes sprouts

### v1.3
- Persona extends GroveObjectMeta
- LensCardContent renderer
- Refactor LensPicker to use GroveObjectCard

### v2
- Config-driven type definitions
- Custom types via YAML/JSON
- AI can register new types at runtime

---

*Architecture complete. This establishes Pattern 7: Object Model as the foundation for unified Grove content.*
