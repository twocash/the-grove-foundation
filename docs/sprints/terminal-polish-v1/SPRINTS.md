# Terminal Polish v1 — Sprint Breakdown

**Sprint:** terminal-polish-v1  
**Total Stories:** 4  
**Estimated Time:** 6-8 hours

---

## Epic 1: Card Token Implementation

**Goal:** Implement the missing `--card-*` tokens so CardShell visual states work.

### Story 1.1: Add Card Tokens to globals.css

**Task:** Add CSS custom properties for card states

**File:** `styles/globals.css`

**Changes:**
```css
/* Add after --chat-* tokens in :root */
:root {
  /* Card tokens (Sprint 6 implementation) */
  --card-border-default: #e7e5e4;
  --card-border-inspected: theme('colors.cyan.400');
  --card-border-active: rgba(16, 185, 129, 0.5);
  --card-bg-active: rgba(16, 185, 129, 0.05);
  --card-ring-color: theme('colors.cyan.400');
  --card-ring-active: rgba(16, 185, 129, 0.3);
  
  /* Violet variant for custom lenses */
  --card-ring-violet: theme('colors.violet.400');
  --card-border-violet: theme('colors.violet.400');
  --card-bg-violet-active: rgba(139, 92, 246, 0.05);
}

.dark {
  --card-border-default: #334155;
  --card-bg-active: rgba(16, 185, 129, 0.1);
  --card-bg-violet-active: rgba(139, 92, 246, 0.1);
}
```

**Lines:** ~20

**Tests:**
- Build passes: `npm run build`
- Visual: Load /terminal → Lenses, verify card borders visible

### Build Gate

```bash
npm run build    # Must pass
npm run test     # All 161 tests pass
```

---

## Epic 2: ObjectInspector Component

**Goal:** Create reusable JSON viewer for GroveObjects.

### Story 2.1: Create ObjectInspector Component

**Task:** Build JSON viewer with collapsible sections

**Files:**
- `src/shared/inspector/ObjectInspector.tsx` (new)
- `src/shared/inspector/index.ts` (new)

**Features:**
- Collapsible META section
- Collapsible PAYLOAD section
- JSON syntax highlighting (cyan keys, green strings, amber numbers)
- Copy JSON button

**Implementation:**
```typescript
// src/shared/inspector/ObjectInspector.tsx

import { useState } from 'react';
import { GroveObject } from '@core/schema/grove-object';
import { InspectorPanel } from '../layout/InspectorPanel';

interface ObjectInspectorProps {
  object: GroveObject;
  title?: string;
  onClose: () => void;
}

export function ObjectInspector({ object, title, onClose }: ObjectInspectorProps) {
  const [metaExpanded, setMetaExpanded] = useState(true);
  const [payloadExpanded, setPayloadExpanded] = useState(true);
  
  // ... collapsible sections and JSON renderer
}
```

**Lines:** ~120

**Tests:**
- Build passes
- Manual: Import in test file, render with sample GroveObject

### Story 2.2: Add JSON Syntax Highlighting CSS

**Task:** Add CSS classes for JSON rendering

**File:** `styles/globals.css`

**Changes:**
```css
/* JSON syntax highlighting (for ObjectInspector) */
.json-key { color: #06b6d4; }      /* cyan */
.json-string { color: #10b981; }   /* emerald */
.json-number { color: #f59e0b; }   /* amber */
.json-boolean { color: #8b5cf6; }  /* violet */
.json-null { color: #64748b; }     /* slate muted */
```

**Lines:** ~10

### Build Gate

```bash
npm run build
npm run test
```

---

## Epic 3: LensInspector Integration

**Goal:** Replace fake config UI with ObjectInspector.

### Story 3.1: Create Persona Normalizer

**Task:** Convert Persona to GroveObject format

**File:** `src/explore/LensInspector.tsx`

**Implementation:**
```typescript
function personaToGroveObject(persona: Persona, isActive: boolean): GroveObject {
  return {
    meta: {
      id: persona.id,
      type: 'lens',
      title: persona.publicLabel,
      description: persona.description,
      status: isActive ? 'active' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
    },
    payload: {
      systemPrompt: persona.systemPrompt,
      tone: persona.tone,
      contentFilters: persona.contentFilters,
      prioritizedThemes: persona.prioritizedThemes,
      journeyOrder: persona.journeyOrder,
    },
  };
}
```

**Lines:** ~25

### Story 3.2: Replace LensInspector UI

**Task:** Swap fake controls for ObjectInspector

**File:** `src/explore/LensInspector.tsx`

**Before (remove):**
```typescript
import { Toggle, Slider, Select, Checkbox } from '../shared/forms';
// ... fake config state and UI
```

**After:**
```typescript
import { ObjectInspector } from '../shared/inspector';

export function LensInspector({ personaId }: LensInspectorProps) {
  // ... get persona from NarrativeEngine
  const groveObject = personaToGroveObject(persona, isActive);
  
  return (
    <ObjectInspector
      object={groveObject}
      title={persona.publicLabel}
      onClose={closeInspector}
    />
  );
}
```

**Lines changed:** ~80 (mostly deletion)

**Tests:**
- Build passes
- Manual: Click lens card → Inspector shows JSON

### Build Gate

```bash
npm run build
npm run test
```

---

## Epic 4: JourneyInspector Integration

**Goal:** Apply same pattern to JourneyInspector.

### Story 4.1: Create Journey Normalizer

**Task:** Convert Journey to GroveObject format

**Note:** Journey already implements GroveObjectMeta partially, so normalizer is simpler.

**File:** `src/explore/JourneyInspector.tsx`

**Lines:** ~20

### Story 4.2: Replace JourneyInspector UI

**Task:** Swap fake controls for ObjectInspector

**File:** `src/explore/JourneyInspector.tsx`

**Lines changed:** ~80

**Tests:**
- Build passes
- Manual: Click journey card → Inspector shows JSON

### Build Gate

```bash
npm run build
npm run test
```

---

## Final Validation

### Manual Test Matrix

| Screen | Action | Expected |
|--------|--------|----------|
| Lenses | Load page | Card borders visible (not undefined) |
| Lenses | Hover card | Border color changes |
| Lenses | Click card (inspected) | Cyan ring appears |
| Lenses | Inspector | Shows Persona JSON with META/PAYLOAD |
| Lenses | Copy JSON | Valid JSON in clipboard |
| Journeys | Click card | Inspector shows Journey JSON |
| Journeys | Copy JSON | Valid JSON in clipboard |
| Marketing | Load page | No changes (isolated) |

### Final Build Gate

```bash
npm run build              # Compiles
npm run test               # 161/161 pass
npm run dev                # Visual verification
```

---

## Commit Sequence

| Commit | Type | Message |
|--------|------|---------|
| 1 | feat | add --card-* tokens to globals.css |
| 2 | feat | create ObjectInspector component |
| 3 | refactor | replace LensInspector with ObjectInspector |
| 4 | refactor | replace JourneyInspector with ObjectInspector |
| 5 | docs | update sprint devlog |

---

## Rollback Plan

If issues arise:

1. **Token issues:** Remove :root additions from globals.css
2. **ObjectInspector issues:** Delete `src/shared/inspector/` directory
3. **Inspector integration:** Revert LensInspector.tsx and JourneyInspector.tsx from git

Each component can be rolled back independently.

---

*Sprint breakdown complete. Proceed to EXECUTION_PROMPT.md.*
