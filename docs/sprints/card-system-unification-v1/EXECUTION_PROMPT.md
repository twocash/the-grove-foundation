# Execution Prompt: Card System Unification

**Sprint:** card-system-unification-v1  
**Target:** Claude Code CLI  
**Time Budget:** 4 hours  
**Repository:** C:\GitHub\the-grove-foundation

---

## Mission

Implement the Visual State Matrix for card components. This enforces styling patterns that were documented in Sprint 3 but never implemented. After this sprint, changing card colors requires only CSS token edits—no component code changes.

---

## Pre-Flight Checklist

```bash
cd C:\GitHub\the-grove-foundation
git status                    # Clean working directory
git checkout -b feat/card-system-unification-v1
npm install
npm run build                 # Baseline passes
npm run dev                   # App runs
```

---

## Epic 1: Card Token Namespace

### File: src/app/globals.css

**Location:** After existing token definitions (search for `--grove-` tokens)

**Add this block:**

```css
/* ============================================
   CARD COMPONENT TOKENS
   Sprint: card-system-unification-v1
   
   Usage:
   - --card-border-* for border colors
   - --card-bg-* for backgrounds
   - --card-ring-* for focus/selection rings
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

**Verify:**
```bash
npm run build
```

**Commit:**
```bash
git add src/app/globals.css
git commit -m "feat(tokens): add --card-* namespace for card styling"
```

---

## Epic 2: LensPicker Visual State Matrix

### File: src/explore/LensPicker.tsx

### Step 2.1: Add inspectedLensId derivation

**Find this line (around line 310):**
```typescript
const activeLensId = lens;
```

**Add immediately after:**
```typescript
// Derive inspected lens from workspace inspector state
const inspectedLensId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode?.type === 'lens'
) ? workspaceUI.inspector.mode.lensId : null;
```

### Step 2.2: Update LensCardProps interface

**Find (around line 178):**
```typescript
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;
  onView: () => void;
}
```

**Replace with:**
```typescript
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  isInspected: boolean;
  onSelect: () => void;
  onView: () => void;
}
```

### Step 2.3: Update LensCard function signature

**Find:**
```typescript
function LensCard({ persona, isActive, onSelect, onView }: LensCardProps) {
```

**Replace with:**
```typescript
function LensCard({ persona, isActive, isInspected, onSelect, onView }: LensCardProps) {
```

### Step 2.4: Update LensCard className

**Find the className in LensCard (around line 190):**
```typescript
className={`
  group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
  ${isActive
    ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
    : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

**Replace with:**
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

### Step 2.5: Fix LensCard button style

**Find the Select button className (around line 230):**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
```

**Replace with:**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
```

### Step 2.6: Pass isInspected to LensCard

**Find the LensCard render in the grid (around line 390):**
```typescript
<LensCard
  key={persona.id}
  persona={persona}
  isActive={activeLensId === persona.id}
  onSelect={() => handleSelect(persona.id)}
  onView={() => handleView(persona.id)}
/>
```

**Replace with:**
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

### Step 2.7: Update CustomLensCardProps

**Find (around line 240):**
```typescript
interface CustomLensCardProps {
  lens: CustomLens;
  isActive: boolean;
  onSelect: () => void;
  onView: () => void;
  onDelete?: () => void;
}
```

**Add isInspected:**
```typescript
interface CustomLensCardProps {
  lens: CustomLens;
  isActive: boolean;
  isInspected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDelete?: () => void;
}
```

### Step 2.8: Update CustomLensCard function and className

**Update signature:**
```typescript
function CustomLensCard({ lens, isActive, isInspected, onSelect, onView, onDelete }: CustomLensCardProps) {
```

**Update className (find the current one and replace):**
```typescript
className={`
  group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
  ${isInspected
    ? 'ring-2 ring-[var(--card-ring-violet)] border-[var(--card-border-violet)]'
    : isActive
      ? 'border-violet-400/50 bg-[var(--card-bg-violet-active)] ring-1 ring-violet-300/30'
      : 'border-[var(--card-border-default)] dark:border-slate-700 bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-violet-300'
  }
`}
```

### Step 2.9: Fix CustomLensCard button

**Find the Select button and update className:**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-violet-500 text-white hover:bg-violet-500/90 transition-colors shadow-sm"
```

### Step 2.10: Pass isInspected to CustomLensCard

**Find CustomLensCard render and add isInspected prop:**
```typescript
<CustomLensCard
  key={lens.id}
  lens={lens}
  isActive={activeLensId === lens.id}
  isInspected={inspectedLensId === lens.id}
  onSelect={() => handleSelect(lens.id)}
  onView={() => handleView(lens.id)}
  onDelete={() => deleteCustomLens(lens.id)}
/>
```

**Verify:**
```bash
npm run build
npm run dev
# Manual: Open Lenses → click card → ring-2 appears
# Manual: Click different card → ring moves
# Manual: Button is primary colored
```

**Commit:**
```bash
git add src/explore/LensPicker.tsx
git commit -m "feat(lens): implement Visual State Matrix with isInspected"
```

---

## Epic 3: JourneyList Visual State Matrix

### File: src/explore/JourneyList.tsx

### Step 3.1: Add inspectedJourneyId derivation

**Find (around line 155):**
```typescript
const activeJourneyId = engActiveJourney?.id ?? null;
```

**Add immediately after:**
```typescript
// Derive inspected journey from workspace inspector state
const inspectedJourneyId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode?.type === 'journey'
) ? workspaceUI.inspector.mode.journeyId : null;
```

### Step 3.2: Update JourneyCardProps

**Find (around line 60):**
```typescript
interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  onStart: () => void;
  onView: () => void;
}
```

**Replace with:**
```typescript
interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  isInspected: boolean;
  onStart: () => void;
  onView: () => void;
}
```

### Step 3.3: Update JourneyCard signature

```typescript
function JourneyCard({ journey, isActive, isInspected, onStart, onView }: JourneyCardProps) {
```

### Step 3.4: Update JourneyCard className

**Find (around line 73):**
```typescript
className={`
  p-5 rounded-xl border transition-all cursor-pointer
  ${isActive
    ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20'
    : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
  }
`}
```

**Replace with:**
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

### Step 3.5: Pass isInspected to JourneyCard

**Find render (around line 260):**
```typescript
<JourneyCard
  key={journey.id}
  journey={journey}
  isActive={activeJourneyId === journey.id}
  onStart={() => handleStart(journey.id)}
  onView={() => handleView(journey.id)}
/>
```

**Replace with:**
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

**Verify:**
```bash
npm run build
npm run dev
# Manual: Open Journeys → click card → ring-2 appears
```

**Commit:**
```bash
git add src/explore/JourneyList.tsx
git commit -m "feat(journey): implement Visual State Matrix with isInspected"
```

---

## Epic 4: Foundation Nav Labels

### Step 4.1: Extend LensReality type

**File:** `src/core/schema/narrative.ts`

**Find LensReality interface and add:**
```typescript
/** Foundation surface customization */
foundation?: {
  /** Override sidebar section labels */
  sectionLabels?: {
    lenses?: string;
    journeys?: string;
    nodes?: string;
  };
};
```

**Commit:**
```bash
git add src/core/schema/narrative.ts
git commit -m "feat(schema): add foundation.sectionLabels to LensReality"
```

### Step 4.2: Wire sidebar (requires discovery)

**First, find the sidebar component:**
```bash
# Search for where "Lenses" label is rendered
grep -r "Lenses" src/surface/ src/explore/
```

**Then update to read from reality:**
```typescript
import { useQuantumInterface } from '@surface/hooks/useQuantumInterface';

// In component
const { reality } = useQuantumInterface();
const labels = reality?.foundation?.sectionLabels;

// Replace hardcoded "Lenses" with:
{labels?.lenses ?? 'Lenses'}
```

**Commit:**
```bash
git add [sidebar-file]
git commit -m "feat(foundation): wire nav labels to LensReality"
```

### Step 4.3: Add sample config (optional)

**File:** `src/data/quantum-content.ts`

**Add to one persona as example:**
```typescript
'concerned-citizen': {
  // ... existing fields
  foundation: {
    sectionLabels: {
      lenses: 'Perspectives',
      journeys: 'Learning Paths'
    }
  }
}
```

---

## Final Verification

```bash
# All builds pass
npm run build

# All tests pass
npm test

# No lint errors
npm run lint

# Manual test matrix
npm run dev
```

---

## Epic 5: Pattern Documentation

### File: PROJECT_PATTERNS.md (repository root)

**Task:** Add card token guidance after Pattern 4 (Token Namespaces) section.

**Find the end of Pattern 4 section and add:**

```markdown
### Card Components (Added Sprint 6)

All card-based UI uses the `--card-*` token namespace. This is THE canonical pattern for card styling across Foundation, Genesis, and future admin interfaces.

| Token | Purpose |
|-------|---------|
| `--card-border-default` | Default border color |
| `--card-border-inspected` | Border when inspector shows this card |
| `--card-border-active` | Border when card is currently applied |
| `--card-bg-active` | Background when active |
| `--card-ring-color` | Ring color for inspected state |
| `--card-ring-active` | Subtle ring for active state |

**Visual State Matrix:**
- Default → `border-[var(--card-border-default)]`
- Inspected → `ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]`
- Active → `bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1`

**For new card components:**
1. Use `--card-*` tokens for all styling
2. Implement appropriate states (isInspected, isActive, isSelected)
3. Add variant tokens if needed (e.g., `--card-ring-violet`)

**DO NOT:**
- ❌ Hardcode colors in new card components
- ❌ Create parallel card styling systems
- ❌ Use different token namespaces for cards
```

**Commit:**
```bash
git add PROJECT_PATTERNS.md
git commit -m "docs: add card token pattern to PROJECT_PATTERNS.md"
```

---

## Manual Test Checklist

| # | Test | Expected | ✓ |
|---|------|----------|---|
| 1 | Click lens card body | Ring-2, inspector opens | |
| 2 | Click different lens card | Ring moves | |
| 3 | Click "Select" button | Lens activates, inspector closes | |
| 4 | View active lens | Ring-1 + badge | |
| 5 | Click journey card body | Ring-2, inspector opens | |
| 6 | Click "Start" button | Journey starts | |
| 7 | Switch to lens with custom labels | Nav updates | |
| 8 | Genesis lens selection | Still works | |
| 9 | Dark mode toggle | All states correct | |
| 10 | Custom lens card | Violet ring-2 when inspected | |

---

## Merge

```bash
git push origin feat/card-system-unification-v1
# Create PR, review, merge
```

---

## Troubleshooting

### Token not applying
- Check globals.css is imported in layout
- Verify no typo in `var(--card-*)`
- Check dark mode class is on html element

### TypeScript errors
- Ensure isInspected added to both interface AND function params
- Check all render sites pass the prop

### Ring not visible
- Verify workspaceUI context is available
- Check inspector.mode has correct type field
- Console.log inspectedLensId to verify derivation

---

## Success Criteria

After this sprint:
1. ✓ Cards show ring-2 when inspected
2. ✓ Buttons are primary colored
3. ✓ Changing `--card-ring-color` in globals.css updates ALL cards
4. ✓ No component code changes needed for color tweaks
5. ✓ PROJECT_PATTERNS.md documents `--card-*` as THE canonical card pattern
6. ✓ Future card components (admin, nodes, etc.) will inherit this system

**The styling system is now declarative. Future card layouts are CSS-only.**

---

*Execution prompt complete. Hand off to Claude Code CLI.*
