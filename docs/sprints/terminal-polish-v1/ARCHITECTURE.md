# Terminal Polish v1 — Architecture

**Sprint:** terminal-polish-v1

---

## System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           /terminal views                                │
├─────────────┬───────────────────────────────┬───────────────────────────┤
│             │                               │                           │
│   Nav       │      Content Grid             │      Inspector Panel      │
│   Sidebar   │   (LensPicker, JourneyList)   │   (ObjectInspector)       │
│             │                               │                           │
│   ~200px    │           flex-1              │         ~320px            │
│             │                               │                           │
│             │   ┌─────────┐ ┌─────────┐     │   ┌─────────────────┐     │
│             │   │ Card    │ │ Card    │     │   │ META            │     │
│             │   │ (token) │ │ (token) │     │   │   id: ...       │     │
│             │   └─────────┘ └─────────┘     │   │   type: ...     │     │
│             │                               │   │                 │     │
│             │   ┌─────────┐ ┌─────────┐     │   │ PAYLOAD         │     │
│             │   │ Card    │ │ Card    │     │   │   title: ...    │     │
│             │   │ (token) │ │ (token) │     │   │   ...           │     │
│             │   └─────────┘ └─────────┘     │   └─────────────────┘     │
│             │                               │                           │
└─────────────┴───────────────────────────────┴───────────────────────────┘
                        ↓                               ↓
               Uses --card-* tokens          Uses GroveObject interface
```

---

## Token Architecture

### CSS Variable Hierarchy

```
globals.css
├── @theme { } — Tailwind theme tokens
│   ├── --color-primary
│   ├── --color-surface-*
│   └── --color-holo-*
│
├── :root { } — Runtime CSS variables
│   ├── --card-* ← NEW (this sprint)
│   └── --chat-*
│
└── .dark { } — Dark mode overrides
    └── --card-* overrides
```

### Token Flow

```
--card-border-default (CSS var)
         ↓
CardShell.tsx: border-[var(--card-border-default)]
         ↓
Tailwind: compiles to inline style
         ↓
Browser: renders border color
```

**Key insight:** CSS variables enable runtime theme changes without rebuild. Tailwind's arbitrary value syntax (`[var(...)]`) bridges tokens to utility classes.

---

## Object Inspector Architecture

### Data Flow

```
Source Data              Normalizer              ObjectInspector
───────────────────────────────────────────────────────────────
Persona                  personaToGroveObject()  
Journey (already has     journeyToGroveObject()   ObjectInspector
  GroveObjectMeta)       (minimal conversion)       ↓
Hub                      normalizeHub()           - Collapsible META
Node                     future: normalizeNode()  - Collapsible PAYLOAD
                                                  - Copy JSON button
```

### Interface Contract

```typescript
// From Pattern 7: Object Model
interface GroveObjectMeta {
  id: string;
  type: string;
  title: string;
  description?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;       // Provenance
  status?: 'active' | 'draft' | 'archived';
  tags?: string[];
  favorite?: boolean;
}

interface GroveObject {
  meta: GroveObjectMeta;
  payload: Record<string, unknown>;
}
```

### ObjectInspector Component

```
┌─────────────────────────────────────────┐
│  Object Inspector               [X]     │  ← InspectorPanel wrapper
├─────────────────────────────────────────┤
│  ▶ META                                 │  ← CollapsibleSection
│    id: "freestyle-explorer"             │
│    type: "lens"                         │
│    status: "active"                     │
│    createdBy: "system"                  │
│                                         │
│  ▶ PAYLOAD                              │  ← CollapsibleSection
│    publicLabel: "Freestyle"             │
│    description: "..."                   │
│    systemPrompt: "..."                  │
│                                         │
├─────────────────────────────────────────┤
│  [Copy Full JSON]                       │  ← Actions slot
└─────────────────────────────────────────┘
```

---

## Component Composition

### Before (Fake UI)

```
LensInspector
├── InspectorPanel (wrapper)
│   ├── Toggle (fake control)
│   ├── Slider (fake control)
│   └── Select (fake control)
```

### After (Object Data)

```
LensInspector
├── personaToGroveObject() — converts Persona to GroveObject
└── ObjectInspector
    └── InspectorPanel (wrapper)
        ├── CollapsibleSection (META)
        │   └── JsonBlock (recursive renderer)
        └── CollapsibleSection (PAYLOAD)
            └── JsonBlock
```

---

## DEX Compliance Analysis

### Declarative Sovereignty ✅

**Token system:** Styling is declarative (CSS vars). Domain experts can modify card appearance by editing globals.css without touching components.

**Inspector:** ObjectInspector has no hardcoded type checks. Any object matching GroveObjectMeta interface renders correctly.

### Capability Agnosticism ✅

**No model dependency:** Inspector displays data structure, not AI-generated content. Works identically regardless of which model populated the data.

### Provenance as Infrastructure ✅

**Visible in UI:** `createdBy` field displays in META section. Users see attribution for every object.

```
META
  id: "freestyle-explorer"
  type: "lens"
  createdBy: "system"  ← Provenance visible
```

### Organic Scalability ✅

**Adding new object types:**
1. Create normalizer function (~10 lines)
2. Import ObjectInspector in new inspector component
3. Done — no changes to ObjectInspector itself

**Token extension:**
1. Add new `--card-*` variant to globals.css
2. Reference in component — no rebuild required

---

## Risk Mitigation

### Risk: Token naming conflicts

**Mitigation:** Audit confirmed no existing `--card-*` tokens. Namespace is clear.

### Risk: Breaking existing card styling

**Mitigation:** Cards already reference these variables. Implementing them will fix, not break, styling.

### Risk: Inspector type coercion failures

**Mitigation:** Normalizer functions handle conversion. GroveObject interface is the contract.

---

## Future Extensions (Not This Sprint)

### v1.1: Grove Glass Aesthetic
Once base tokens work, extend with glass effects:
- `--card-glass-bg: rgba(17, 24, 39, 0.6)`
- `backdrop-filter: blur(12px)`
- Glow utilities

### v1.2: Inline JSON Editing
ObjectInspector becomes editable:
- `onEdit?: (path: string, value: unknown) => void`
- Input fields for primitive values
- Validation against schema

### v1.3: Node Inspector
Nodes have graph context (connections). May need specialized inspector showing:
- Incoming/outgoing edges
- Position in journey
- Connection graph visualization

---

*Architecture approved. Proceed to DECISIONS.md.*
