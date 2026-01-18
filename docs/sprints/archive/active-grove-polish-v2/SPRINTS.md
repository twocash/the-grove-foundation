# Sprint Plan: Active Grove Polish v2

## Epic Overview

| Epic | Name | Files | Risk | Est. |
|------|------|-------|------|------|
| 1 | Reload State Fix | GenesisPage.tsx | HIGH | 30min |
| 2 | Quote Carousel Polish | ProblemStatement.tsx | LOW | 15min |
| 3 | Diary Entry Redesign | AhaDemo.tsx, GenesisPage.tsx, globals.css | MEDIUM | 45min |
| 4 | Foundation Layout | Foundation.tsx, globals.css | LOW | 20min |

**Total Estimate:** ~2 hours

---

## Epic 1: Reload State Fix (CRITICAL)

### Story 1.1: Update handleTreeClick Logic
**File:** `src/surface/pages/GenesisPage.tsx`

**Task:**
- Locate `handleTreeClick` callback (~line 125)
- Add `activeLens` to dependency array
- Add conditional: if `activeLens` exists, skip to 'unlocked'

**Acceptance:**
- Console shows `[ActiveGrove] Tree clicked → unlocked (lens exists: xxx)`
- User can navigate to Section 2

### Story 1.2: Verify Fresh Visit Still Works
**Task:**
- Clear localStorage
- Test complete flow: hero → tree click → lens picker → select → morph → unlock

**Acceptance:**
- Fresh visit shows lens picker
- Headline morphs after selection
- Sections unlock after animation

### Build Gate
```bash
npm run build
# Manual test: both flows work
```

---

## Epic 2: Quote Carousel Polish

### Story 2.1: Increase Carousel Interval
**File:** `src/surface/components/genesis/ProblemStatement.tsx`

**Task:**
- Find interval constant (search for `setInterval`, `3000`, `4000`)
- Change to `6000`

### Story 2.2: Add Section Headline (if missing)
**File:** `src/surface/components/genesis/ProblemStatement.tsx`

**Task:**
- Add `<h2>` above carousel in compressed variant
- Text: "The People Building AI Have a Message"
- Styling: `text-xl md:text-2xl font-display text-grove-forest mb-6 text-center`

### Build Gate
```bash
npm run build
# Manual test: cards advance every ~6 seconds
```

---

## Epic 3: Diary Entry Redesign

### Story 3.1: Update Diary Copy
**File:** `src/surface/components/genesis/AhaDemo.tsx`

**Task:**
- Replace diary content with new copy:
```
I've been digging into Wang et al.'s research on hierarchical reasoning, which is informative as we build the Foundation: knowing things compresses well; thinking hard doesn't. That's why the hybrid works—your laptop handles the conversation, the memory; the cloud handles the breakthroughs. We're on the right path. Doing more research.

— Leah
```

### Story 3.2: Remove Secondary CTA
**File:** `src/surface/components/genesis/AhaDemo.tsx`

**Task:**
- Delete or comment out "Keep Exploring" button
- Only primary CTA remains

### Story 3.3: Restyle Primary CTA
**File:** `src/surface/components/genesis/AhaDemo.tsx`

**Task:**
- Update button text to: "Ask The Grove: How does Grove know when to call for backup?"
- Ensure button styling is prominent (bg-grove-forest, white text, rounded)

### Story 3.4: Update CTA Handler with ExternalQuery
**File:** `src/surface/pages/GenesisPage.tsx`

**Task:**
- Find `handleAhaDemoCTA` callback
- Change from simple string to externalQuery object:
  - display: "How does Grove know when to call for backup?"
  - query: [Full underlying prompt about hybrid routing]

### Story 3.5: Add Diary Scaling CSS
**File:** `styles/globals.css`

**Task:**
- Add split-mode scaling for diary/blockquote elements
- Use clamp() for responsive font sizing

### Build Gate
```bash
npm run build
# Manual test: diary fits viewport, CTA opens Terminal correctly
```

---

## Epic 4: Foundation Layout

### Story 4.1: Reorder JSX Elements
**File:** `src/surface/components/genesis/Foundation.tsx`

**Task:**
- Move "Want to go deeper?" text ABOVE the button row
- Ensure sapling is BELOW buttons
- Remove any strikethrough styling

### Story 4.2: Apply Accent Styling to CTA Text
**File:** `src/surface/components/genesis/Foundation.tsx`

**Task:**
- Add className: `text-grove-accent text-center font-medium text-lg mb-4`
- Remove pink/strikethrough classes

### Story 4.3: Add CSS Class (if needed)
**File:** `styles/globals.css`

**Task:**
- Add `.foundation-cta-text` class if reusable styling needed

### Build Gate
```bash
npm run build
# Manual test: layout matches spec, orange text, no strikethrough
```

---

## Commit Sequence

```
fix(genesis): skip to unlocked for return visitors with existing lens
feat(problem): increase carousel interval to 6s, add section headline
refactor(aha): update diary copy and streamline to single CTA
feat(aha): implement external query pattern for diary CTA
style(aha): add split-mode scaling for diary text
refactor(foundation): reorder layout, apply accent styling to CTA
docs: add Active Grove Polish v2 sprint documentation
```

---

## Definition of Done

- [ ] All acceptance criteria pass
- [ ] Both fresh and return visit flows work
- [ ] No console errors
- [ ] Build succeeds
- [ ] Manual QA on desktop viewport
- [ ] Committed and pushed to origin
