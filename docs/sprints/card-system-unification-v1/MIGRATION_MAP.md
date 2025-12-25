# Migration Map: Card System Unification

**Sprint:** card-system-unification-v1  
**Total Files:** 6  
**Estimated Lines Changed:** ~150

---

## File 1: src/app/globals.css

**Purpose:** Add `--card-*` token namespace

**Location:** After existing `--grove-*` tokens (around line 80)

**Add:**
```css
/* ============================================
   CARD COMPONENT TOKENS
   Token namespace for card styling
   Sprint: card-system-unification-v1
   ============================================ */

:root {
  /* Card borders */
  --card-border-default: theme('colors.slate.200');
  --card-border-inspected: theme('colors.primary.DEFAULT');
  --card-border-active: rgba(16, 185, 129, 0.3);
  
  /* Card backgrounds */
  --card-bg-default: transparent;
  --card-bg-active: rgba(16, 185, 129, 0.05);
  
  /* Card rings (focus/selection indicators) */
  --card-ring-color: theme('colors.primary.DEFAULT');
  --card-ring-active: rgba(16, 185, 129, 0.2);
  
  /* Violet variant (custom lenses) */
  --card-ring-violet: theme('colors.violet.400');
  --card-border-violet: theme('colors.violet.400');
  --card-bg-violet-active: rgba(139, 92, 246, 0.05);
}

.dark {
  --card-border-default: theme('colors.slate.700');
  --card-bg-active: rgba(16, 185, 129, 0.1);
  --card-bg-violet-active: rgba(139, 92, 246, 0.1);
}
```

**Lines:** ~30

---

## File 2: src/explore/LensPicker.tsx

### Change 2.1: Add inspectedLensId derivation

**Location:** After `const activeLensId = lens;` (around line 310)

**Add:**
```typescript
// Derive inspected lens from workspace inspector state
const inspectedLensId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode?.type === 'lens'
) ? workspaceUI.inspector.mode.lensId : null;
```

### Change 2.2: Update LensCardProps interface

**Location:** Around line 178

**Before:**
```typescript
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;
  onView: () => void;
}
```

**After:**
```typescript
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  isInspected: boolean;
  onSelect: () => void;
  onView: () => void;
}
```

### Change 2.3: Update LensCard className

**Location:** Around line 190

**Before:**
```typescript
className={`
  group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
  ${isActive
    ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
    : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

**After:**
```typescript
className={`
  group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
  ${isInspected
    ? 'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'
    : isActive
      ? 'border-[var(--card-border-active)] bg-[var(--card-bg-active)] ring-1 ring-[var(--card-ring-active)]'
      : 'border-[var(--card-border-default)] dark:border-slate-700 bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

### Change 2.4: Update LensCard button

**Location:** Around line 230

**Before:**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
```

**After:**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
```

### Change 2.5: Pass isInspected to LensCard

**Location:** Around line 390 (grid render loop)

**Before:**
```typescript
<LensCard
  key={persona.id}
  persona={persona}
  isActive={activeLensId === persona.id}
  onSelect={() => handleSelect(persona.id)}
  onView={() => handleView(persona.id)}
/>
```

**After:**
```typescript
<LensCard
  key={persona.id}
  persona={persona}
  isActive={activeLensId === persona.id}
  isInspected={inspectedLensId === persona.id}
  onSelect={() => handleSelect(persona.id)}
  onView={() => handleView(persona.id)}
/>
```

### Change 2.6: Update CustomLensCardProps and styling

**Location:** Around line 240

Apply same pattern:
- Add `isInspected: boolean` to props
- Update className with inspected state (use `--card-ring-violet` variant)
- Update button to `bg-violet-500 text-white hover:bg-violet-500/90`
- Pass `isInspected` when rendering

**Lines total for LensPicker.tsx:** ~40

---

## File 3: src/explore/JourneyList.tsx

### Change 3.1: Add inspectedJourneyId derivation

**Location:** After `const activeJourneyId = engActiveJourney?.id ?? null;` (around line 155)

**Add:**
```typescript
// Derive inspected journey from workspace inspector state
const inspectedJourneyId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode?.type === 'journey'
) ? workspaceUI.inspector.mode.journeyId : null;
```

### Change 3.2: Update JourneyCardProps interface

**Location:** Around line 60

**Before:**
```typescript
interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  onStart: () => void;
  onView: () => void;
}
```

**After:**
```typescript
interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  isInspected: boolean;
  onStart: () => void;
  onView: () => void;
}
```

### Change 3.3: Update JourneyCard className

**Location:** Around line 73

**Before:**
```typescript
className={`
  p-5 rounded-xl border transition-all cursor-pointer
  ${isActive
    ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
    : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

**After:**
```typescript
className={`
  p-5 rounded-xl border transition-all cursor-pointer
  ${isInspected
    ? 'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'
    : isActive
      ? 'border-[var(--card-border-active)] bg-[var(--card-bg-active)] ring-1 ring-[var(--card-ring-active)]'
      : 'border-[var(--card-border-default)] dark:border-slate-700 bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

### Change 3.4: Pass isInspected to JourneyCard

**Location:** Around line 260 (grid render loop)

**Before:**
```typescript
<JourneyCard
  key={journey.id}
  journey={journey}
  isActive={activeJourneyId === journey.id}
  onStart={() => handleStart(journey.id)}
  onView={() => handleView(journey.id)}
/>
```

**After:**
```typescript
<JourneyCard
  key={journey.id}
  journey={journey}
  isActive={activeJourneyId === journey.id}
  isInspected={inspectedJourneyId === journey.id}
  onStart={() => handleStart(journey.id)}
  onView={() => handleView(journey.id)}
/>
```

**Lines total for JourneyList.tsx:** ~30

---

## File 4: src/core/schema/narrative.ts

**Purpose:** Add foundation.sectionLabels to LensReality type

**Location:** In LensReality interface definition

**Add:**
```typescript
interface LensReality {
  // ... existing fields (hero, systemPromptExtension, etc.)
  
  /** Foundation surface customization */
  foundation?: {
    /** Override sidebar section labels */
    sectionLabels?: {
      lenses?: string;    // Default: "Lenses"
      journeys?: string;  // Default: "Journeys"
      nodes?: string;     // Default: "Nodes"
    };
  };
}
```

**Lines:** ~10

---

## File 5: src/data/quantum-content.ts

**Purpose:** Wire nav labels for each persona

**Location:** In SUPERPOSITION_MAP entries

**Example for one persona:**
```typescript
'concerned-citizen': {
  hero: { /* existing */ },
  systemPromptExtension: '/* existing */',
  foundation: {
    sectionLabels: {
      lenses: 'Perspectives',
      journeys: 'Learning Paths',
      nodes: 'Topics'
    }
  }
}
```

**Note:** Most personas can omit this to use defaults. Only add for personas that need custom labels.

**Lines:** ~5-10 per persona that needs customization

---

## File 6: Foundation Sidebar Component

**Purpose:** Read section labels from reality

**Location:** Needs investigation — likely `src/surface/layouts/` or `src/explore/`

**Pattern:**
```typescript
const { reality } = useQuantumInterface();
const labels = reality?.foundation?.sectionLabels;

// In sidebar items
<SidebarSection label={labels?.lenses ?? 'Lenses'}>
  {/* ... */}
</SidebarSection>
```

**Lines:** ~15

---

## Files NOT Changed

| File | Reason |
|------|--------|
| `components/Terminal/LensGrid.tsx` | Genesis has no inspector; intentionally different |
| `src/explore/inspectors/*.tsx` | Already work correctly |
| `components/Terminal/TerminalHeader.tsx` | No changes needed |

---

## Migration Order

1. **globals.css** — Tokens must exist before components use them
2. **narrative.ts** — Types must exist before content uses them
3. **LensPicker.tsx** — Primary lens card fixes
4. **JourneyList.tsx** — Journey card fixes
5. **quantum-content.ts** — Wire nav labels (optional per persona)
6. **Foundation sidebar** — Read labels from reality

---

## Verification Checkpoints

After each file:

```bash
npm run build  # Must pass
npm run dev    # Manual visual check
```

After all files:
```bash
npm test       # All tests pass
```

---

*Migration map complete. File changes are surgical and isolated.*
