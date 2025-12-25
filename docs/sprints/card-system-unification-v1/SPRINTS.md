# Story Breakdown: Card System Unification

**Sprint:** card-system-unification-v1  
**Time Budget:** 4 hours  
**Epics:** 4

---

## Epic 1: Card Token Namespace (30 min)

### Story 1.1: Define card tokens in globals.css

**Task:**
Add `--card-*` token namespace to `src/app/globals.css`

**Location:** After existing `--grove-*` tokens

**Tokens to add:**
```css
:root {
  /* Card borders */
  --card-border-default: theme('colors.slate.200');
  --card-border-inspected: theme('colors.primary.DEFAULT');
  --card-border-active: rgba(16, 185, 129, 0.3);
  
  /* Card backgrounds */
  --card-bg-default: transparent;
  --card-bg-active: rgba(16, 185, 129, 0.05);
  
  /* Card rings */
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

**Commit:** `feat(tokens): add --card-* namespace for card styling`

### Build Gate
```bash
npm run build  # Tokens compile correctly
```

---

## Epic 2: LensPicker Visual State Matrix (90 min)

### Story 2.1: Add inspectedLensId derivation

**File:** `src/explore/LensPicker.tsx`

**Task:** After `const activeLensId = lens;` add:
```typescript
const inspectedLensId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode?.type === 'lens'
) ? workspaceUI.inspector.mode.lensId : null;
```

**Commit:** `feat(lens): derive inspected lens from workspace context`

### Story 2.2: Update LensCard with isInspected

**File:** `src/explore/LensPicker.tsx`

**Tasks:**
1. Add `isInspected: boolean` to LensCardProps interface
2. Update className with three-state logic:
```typescript
${isInspected
  ? 'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'
  : isActive
    ? 'border-[var(--card-border-active)] bg-[var(--card-bg-active)] ring-1 ring-[var(--card-ring-active)]'
    : 'border-[var(--card-border-default)] dark:border-slate-700 bg-surface-light dark:bg-surface-dark hover:shadow-lg hover:border-primary/30'
}
```
3. Pass `isInspected={inspectedLensId === persona.id}` in grid render

**Commit:** `feat(lens): add isInspected state to LensCard`

### Story 2.3: Fix LensCard button style

**File:** `src/explore/LensPicker.tsx`

**Task:** Replace button className:

**Before:**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ..."
```

**After:**
```typescript
className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
```

**Commit:** `style(lens): use primary button style for Select action`

### Story 2.4: Update CustomLensCard similarly

**File:** `src/explore/LensPicker.tsx`

**Tasks:**
1. Add `isInspected: boolean` to CustomLensCardProps
2. Update className with violet variant tokens
3. Fix button to `bg-violet-500 text-white hover:bg-violet-500/90`
4. Pass `isInspected` when rendering

**Commit:** `feat(lens): add isInspected state to CustomLensCard`

### Build Gate
```bash
npm run build
npm run dev
# Manual: Click lens card → ring appears
# Manual: Click different card → ring moves
# Manual: Button is primary colored
```

---

## Epic 3: JourneyList Visual State Matrix (45 min)

### Story 3.1: Add inspectedJourneyId derivation

**File:** `src/explore/JourneyList.tsx`

**Task:** After `const activeJourneyId` add:
```typescript
const inspectedJourneyId = (
  workspaceUI?.inspector?.isOpen && 
  workspaceUI.inspector.mode?.type === 'journey'
) ? workspaceUI.inspector.mode.journeyId : null;
```

**Commit:** `feat(journey): derive inspected journey from workspace context`

### Story 3.2: Update JourneyCard with isInspected

**File:** `src/explore/JourneyList.tsx`

**Tasks:**
1. Add `isInspected: boolean` to JourneyCardProps interface
2. Update className with three-state logic (same pattern as LensCard)
3. Pass `isInspected={inspectedJourneyId === journey.id}` in grid render

**Note:** Button style already correct (`bg-primary text-white`), no change needed.

**Commit:** `feat(journey): add isInspected state to JourneyCard`

### Build Gate
```bash
npm run build
npm run dev
# Manual: Click journey card → ring appears
# Manual: Click different card → ring moves
```

---

## Epic 4: Foundation Nav Labels (45 min)

### Story 4.1: Extend LensReality type

**File:** `src/core/schema/narrative.ts`

**Task:** Add to LensReality interface:
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

**Commit:** `feat(schema): add foundation.sectionLabels to LensReality`

### Story 4.2: Wire sidebar to read from reality

**File:** (needs discovery — likely in `src/surface/layouts/` or sidebar component)

**Task:**
1. Import useQuantumInterface hook
2. Read `reality?.foundation?.sectionLabels`
3. Apply with fallbacks: `labels?.lenses ?? 'Lenses'`

**Commit:** `feat(foundation): wire nav labels to LensReality`

### Story 4.3: Add sample label config (optional)

**File:** `src/data/quantum-content.ts`

**Task:** Add foundation section labels to one or two personas as examples:
```typescript
'concerned-citizen': {
  // ... existing
  foundation: {
    sectionLabels: {
      lenses: 'Perspectives',
      journeys: 'Learning Paths'
    }
  }
}
```

**Commit:** `feat(content): add example nav label customization`

### Build Gate
```bash
npm run build
npm run dev
# Manual: Switch to lens with custom labels → nav updates
# Manual: Switch to lens without → defaults shown
```

---

## Final Verification

### All Tests Pass
```bash
npm test
npm run lint
```

### Manual Test Matrix

| # | Scenario | Expected | Pass |
|---|----------|----------|------|
| 1 | Click lens card body | Ring-2 appears, inspector opens | ☐ |
| 2 | Click different lens card | Ring moves, inspector updates | ☐ |
| 3 | Click "Select" button | Lens activates, inspector closes | ☐ |
| 4 | View active lens card | Shows ring-1 + "Active" badge | ☐ |
| 5 | Click journey card body | Ring-2 appears, inspector opens | ☐ |
| 6 | Click "Start" button | Journey starts, inspector closes | ☐ |
| 7 | Select persona with custom nav labels | Sidebar labels update | ☐ |
| 8 | Select persona without custom labels | Default labels shown | ☐ |
| 9 | Genesis lens selection | Still works (unaffected) | ☐ |
| 10 | Dark mode | All states render correctly | ☐ |

---

## Commit Sequence

1. `feat(tokens): add --card-* namespace for card styling`
2. `feat(lens): derive inspected lens from workspace context`
3. `feat(lens): add isInspected state to LensCard`
4. `style(lens): use primary button style for Select action`
5. `feat(lens): add isInspected state to CustomLensCard`
6. `feat(journey): derive inspected journey from workspace context`
7. `feat(journey): add isInspected state to JourneyCard`
8. `feat(schema): add foundation.sectionLabels to LensReality`
9. `feat(foundation): wire nav labels to LensReality`
10. `feat(content): add example nav label customization` (optional)

**Or combined:**
1. `feat(tokens): add --card-* namespace for card styling`
2. `feat: implement Visual State Matrix for lens/journey cards`
3. `feat(foundation): lens-reactive nav labels`

---

## Time Summary

| Epic | Estimated | Stories |
|------|-----------|---------|
| 1: Token Namespace | 30 min | 1 |
| 2: LensPicker States | 90 min | 4 |
| 3: JourneyList States | 45 min | 2 |
| 4: Nav Labels | 45 min | 3 |
| 5: Pattern Docs | 15 min | 1 |
| **Total** | **3.75 hours** | 11 |

Buffer for testing/polish: 15 min
**Grand Total: 4 hours**

---

## Epic 5: Pattern Documentation (15 min)

### Story 5.1: Update PROJECT_PATTERNS.md

**File:** `PROJECT_PATTERNS.md` (repository root)

**Task:** Add card token guidance to Pattern 4 (Token Namespaces) section.

Add after the existing Token Namespaces content:

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

**Commit:** `docs: add card token pattern to PROJECT_PATTERNS.md`

### Build Gate
```bash
# Verify markdown renders correctly
cat PROJECT_PATTERNS.md | head -200
```

---

*Story breakdown complete. Ready for EXECUTION_PROMPT.*
