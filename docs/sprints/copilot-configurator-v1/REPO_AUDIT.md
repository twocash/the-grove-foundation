# Repository Audit: Copilot Configurator v1

**Sprint:** copilot-configurator-v1  
**Audited:** 2024-12-26  
**Focus:** Object Inspector extension for natural language editing

---

## Current State Analysis

### Object Inspector Architecture

The Grove workspace has a three-column layout:
- **Left:** Navigation sidebar
- **Center:** Content area (routes)
- **Right:** Inspector panel (contextual)

**Key Files:**
```
src/workspace/Inspector.tsx          # Route dispatcher for inspector types
src/shared/inspector/ObjectInspector.tsx   # Generic JSON viewer
src/shared/layout/InspectorPanel.tsx       # Reusable panel wrapper
src/explore/JourneyInspector.tsx           # Journey-specific inspector
src/explore/LensInspector.tsx              # Lens-specific inspector
src/cultivate/SproutInspector.tsx          # Sprout-specific inspector
```

### ObjectInspector Component (src/shared/inspector/ObjectInspector.tsx)

Current capabilities:
- Displays any GroveObject as collapsible META/PAYLOAD sections
- Recursive JSON renderer with syntax highlighting
- Copy to clipboard action
- Uses InspectorPanel wrapper for consistent chrome

**What's Missing:**
- No editing capability (read-only display)
- No slot for embedded assistant
- No mutation hooks

### GroveObject Schema (src/core/schema/grove-object.ts)

Well-defined type system:
```typescript
interface GroveObjectMeta {
  id: string;
  type: GroveObjectType;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: GroveObjectProvenance;
  status?: GroveObjectStatus;
  tags?: string[];
  favorite?: boolean;
}

interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;
  payload: T;
}
```

**Implication:** Schema is already well-defined. Copilot can validate patches against known fields.

### Type-Specific Inspectors

Each object type has a converter function:
```typescript
// JourneyInspector.tsx
function journeyToGroveObject(journey: Journey): GroveObject { ... }
```

**Pattern:** Domain objects → GroveObject → ObjectInspector

This means Copilot edits will need to:
1. Accept patches against GroveObject structure
2. Transform back to domain-specific format
3. Persist via appropriate storage mechanism

### Workspace UI Context (src/workspace/WorkspaceUIContext.tsx)

Manages inspector state:
```typescript
interface InspectorState {
  isOpen: boolean;
  mode: InspectorMode;
}

type InspectorMode = 
  | { type: 'none' }
  | { type: 'lens'; lensId: string }
  | { type: 'journey'; journeyId: string }
  | { type: 'sprout'; sproutId: string }
  // ... etc
```

**Integration Point:** Copilot state could extend this or be managed separately within ObjectInspector.

---

## Integration Points

### 1. ObjectInspector Extension

The ObjectInspector component is the natural home for Copilot. It already:
- Receives the full GroveObject
- Has the InspectorPanel wrapper with actions slot
- Understands meta vs. payload structure

**Approach:** Add CopilotPanel as a fixed-bottom section within ObjectInspector.

### 2. InspectorPanel Actions Slot

Current actions slot is used for "Copy Full JSON" button. Copilot should be:
- A distinct section below the JSON viewer
- Fixed to bottom of panel (doesn't scroll away)
- Collapsible to minimize when not in use

### 3. Type-Specific Payload Schemas

Each object type has different payload fields:

| Type | Payload Fields |
|------|----------------|
| Journey | entryNode, targetAha, linkedHubId, estimatedMinutes |
| Lens | toneGuidance, arcEmphasis, vocabularyLevel, entryPoints |
| Node | label, contextSnippet, next, personas |
| Hub | tags, priority, commonMisconceptions, primarySource |
| Sprout | type, hubId, growthStage, content |

**Implication:** Copilot needs type-aware suggestions and validation.

### 4. Storage/Persistence

Currently no mutation infrastructure exists for most objects (they're loaded from static JSON/config).

**MVP Approach:** 
- Generate patches locally
- Show diff preview
- For MVP, apply to in-memory state only (changes lost on refresh)
- Future: wire to actual persistence layer

---

## UI Mockup Analysis

From the uploaded mockup (`stitch_chatbot_copilot_widget.zip`):

### Visual Structure
```
┌─────────────────────────────────────┐
│  Object Inspector                    │
│  ├─ META (collapsible)              │
│  │   └─ JSON fields                 │
│  ├─ PAYLOAD (collapsible)           │
│  │   └─ JSON fields                 │
│  └─ [Copy Full JSON]                │
├─────────────────────────────────────┤
│  ✨ Copilot Configurator    [Beta]  │  ← Fixed bottom panel
│  ───────────────────────────────────│
│  🤖 Assistant messages              │
│  👤 User messages                   │
│  🤖 Diff preview + [Apply][Retry]   │
│  ───────────────────────────────────│
│  [Input field]          ● Model: 7B │
└─────────────────────────────────────┘
```

### Key UI Elements from Mockup

1. **Header bar:** "✨ Copilot Configurator" with Beta badge, collapse toggle
2. **Message history:** Scrollable chat-style messages
3. **Suggested actions:** Clickable chips in assistant messages
4. **Diff preview:** `-` red strikethrough, `+` green new text
5. **Action buttons:** [Apply] primary, [Retry] secondary
6. **Input area:** Textarea with history button, send button
7. **Model indicator:** Green dot + "Model: GPT-4o" (we'll show "Local 7B")

---

## Technical Gaps

### Gap 1: No Mutation Infrastructure

Objects are currently read-only. Need:
- `useObjectMutation` hook or similar
- Optimistic update pattern
- Rollback capability

### Gap 2: No AI Integration Layer

No existing pattern for:
- Sending prompts to local/remote models
- Streaming responses
- Model selection

**MVP Solution:** Simulated responses with realistic delays.

### Gap 3: No JSON Patch Library

Need ability to:
- Generate patches from natural language
- Apply patches to objects
- Generate human-readable diffs

**Solution:** Use `fast-json-patch` or similar library.

### Gap 4: Schema Validation

Need runtime validation that patches are valid for object type.

**Solution:** Use existing TypeScript types + runtime checks.

---

## Files to Create

```
src/core/copilot/
├── schema.ts              # Types for copilot system
├── parser.ts              # Intent parsing
├── patch-generator.ts     # JSON patch generation
├── validator.ts           # Schema validation
├── simulator.ts           # Simulated model responses
└── index.ts               # Exports

src/shared/inspector/
├── ObjectInspector.tsx    # MODIFY: Add CopilotPanel slot
├── CopilotPanel.tsx       # NEW: Main copilot UI
├── CopilotMessage.tsx     # NEW: Message component
├── DiffPreview.tsx        # NEW: Diff visualization
├── SuggestedActions.tsx   # NEW: Quick action chips
└── hooks/
    └── useCopilot.ts      # NEW: Copilot state/actions
```

## Files to Modify

| File | Change |
|------|--------|
| `src/shared/inspector/ObjectInspector.tsx` | Add CopilotPanel at bottom |
| `src/app/globals.css` | Add `--copilot-*` token namespace |
| `package.json` | Add `fast-json-patch` dependency |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Simulated responses feel artificial | Medium | Low | Craft realistic response templates |
| Panel takes too much vertical space | Medium | Medium | Make collapsible, remember state |
| Users expect persistence | High | Medium | Clear messaging that changes are session-only |
| Type-specific validation complex | Low | Low | Start with common fields, expand |

---

## Recommendation

**Proceed with implementation.** The existing ObjectInspector provides a clean integration point, and the GroveObject schema gives us validation targets. The MVP can demonstrate the interaction pattern with simulated responses while infrastructure for real model integration is built separately.
