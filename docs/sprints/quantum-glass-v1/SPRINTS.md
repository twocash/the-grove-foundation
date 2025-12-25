# SPRINTS: Quantum Glass v1

**Sprint:** quantum-glass-v1  
**Date:** 2025-12-25

---

## Sprint Overview

**Goal:** Transform flat UI into Quantum Glass aesthetic
**Total Estimated Lines:** ~600  
**Phases:** 8  
**Can Ship After:** Phase 4 (cards transformed)

---

## Phase 1: Token Foundation

**Status:** 🔲 Not Started  
**Estimate:** ~220 lines CSS  
**Risk:** Low

### Stories

#### 1.1 Add Quantum Glass Tokens
**File:** `styles/globals.css`  
**Lines:** ~60

Add to `:root`:
- `--glass-void`, `--glass-panel`, `--glass-solid`, `--glass-elevated`
- `--glass-border`, `--glass-border-hover`, `--glass-border-active`, `--glass-border-selected`
- `--neon-green`, `--neon-cyan`, `--neon-amber`, `--neon-violet`
- `--glass-text-primary` through `--glass-text-faint`
- `--glow-green`, `--glow-cyan`, `--glow-ambient`
- `--ease-out-expo`, `--duration-fast`, `--duration-normal`

**Acceptance:** Tokens visible in DevTools Elements panel.

---

#### 1.2 Add Glass Panel Utilities
**File:** `styles/globals.css`  
**Lines:** ~40

Add classes:
- `.glass-panel` — blur container with fallback
- `.glass-panel-solid` — no-blur dark panel

**Acceptance:** `.glass-panel` shows blur in supported browsers.

---

#### 1.3 Add Glass Card Utilities
**File:** `styles/globals.css`  
**Lines:** ~60

Add classes:
- `.glass-card` — base interactive card
- `.glass-card:hover` — lift + shadow
- `.glass-card[data-selected]` — cyan ring
- `.glass-card[data-active]` — green gradient
- `.glass-card[data-active][data-selected]` — combined

Add corner accent pseudo-elements.

**Acceptance:** Test div with class shows all four states.

---

#### 1.4 Add Glass Viewport Utility
**File:** `styles/globals.css`  
**Lines:** ~20

Add class:
- `.glass-viewport` — void background with grid overlay

**Acceptance:** Full-page void with grid visible.

---

#### 1.5 Add Status Badge Utilities
**File:** `styles/globals.css`  
**Lines:** ~30

Add classes:
- `.status-badge` — base
- `.status-badge-active` — green with pulse
- `.status-badge-draft` — gray
- `.status-badge-system` — cyan

**Acceptance:** Badge pulse animation works.

---

#### 1.6 Add Animation Utilities
**File:** `styles/globals.css`  
**Lines:** ~20

Add:
- `@keyframes fade-up`, `@keyframes slide-in-right`
- `.animate-fade-up`, `.animate-slide-in`
- `.hover-lift`
- `.glass-section-header`, `.glass-nav-item`

**Acceptance:** Animations trigger correctly.

---

### Phase 1 Checkpoint
- [ ] Build passes
- [ ] All tokens in DevTools
- [ ] Glass-card hover lifts (test in isolation)

---

## Phase 2: Workspace Background

**Status:** 🔲 Not Started  
**Estimate:** ~5 lines TSX  
**Risk:** Low

### Stories

#### 2.1 Apply Glass Viewport to Workspace
**File:** `src/workspace/GroveWorkspace.tsx`  
**Lines:** ~5

Replace container class with `glass-viewport`.

**Acceptance:** Background is #030712 with grid overlay.

---

### Phase 2 Checkpoint
- [ ] Void background visible
- [ ] Grid fades at edges
- [ ] No visual regression on content

---

## Phase 3: Navigation Sidebar

**Status:** 🔲 Not Started  
**Estimate:** ~50 lines TSX  
**Risk:** Medium (many class changes)

### Stories

#### 3.1 Update Nav Container
**File:** `src/workspace/NavigationSidebar.tsx`  
**Lines:** ~5

Apply `glass-panel-solid` to aside element.

**Acceptance:** Nav has solid dark background.

---

#### 3.2 Update Nav Item States
**File:** `src/workspace/NavigationSidebar.tsx`  
**Lines:** ~30

Update `getItemClasses()`:
- Default: `--glass-text-muted`
- Hover: `--glass-elevated` background
- Active: green border-left, green text

**Acceptance:** Active item has green indicator.

---

#### 3.3 Update Nav Footer
**File:** `src/workspace/NavigationSidebar.tsx`  
**Lines:** ~10

Update footer to use glass tokens.

**Acceptance:** Footer matches nav styling.

---

### Phase 3 Checkpoint
- [ ] Nav rail is dark
- [ ] Active state shows green
- [ ] Hover states work
- [ ] Footer styled

---

## Phase 4: CardShell Transformation

**Status:** 🔲 Not Started  
**Estimate:** ~50 lines TSX  
**Risk:** Medium (affects all cards)

### Stories

#### 4.1 Add Data Attributes
**File:** `src/surface/components/GroveObjectCard/CardShell.tsx`  
**Lines:** ~10

Create data attributes object for state.

**Acceptance:** data-selected and data-active render in HTML.

---

#### 4.2 Apply Glass Card Class
**File:** `src/surface/components/GroveObjectCard/CardShell.tsx`  
**Lines:** ~20

Replace existing state classes with `glass-card` class.

**Acceptance:** Cards use glass styling.

---

#### 4.3 Update Card Text Colors
**File:** `src/surface/components/GroveObjectCard/CardShell.tsx`  
**Lines:** ~15

Update title, description, footer text colors.

**Acceptance:** Text readable on dark background.

---

### Phase 4 Checkpoint
- [ ] Cards have glass background
- [ ] Hover lift works
- [ ] Selected state shows cyan ring
- [ ] Active state shows green
- [ ] Corner accents visible on hover

**🎯 CAN SHIP AFTER THIS PHASE** — Core visual transformation complete.

---

## Phase 5: StatusBadge Component

**Status:** 🔲 Not Started  
**Estimate:** ~30 lines TSX  
**Risk:** Low

### Stories

#### 5.1 Create StatusBadge Component
**File:** `src/shared/ui/StatusBadge.tsx` (NEW)  
**Lines:** ~25

Create component with variant prop.

**Acceptance:** Component renders three variants.

---

#### 5.2 Create Barrel Export
**File:** `src/shared/ui/index.ts` (NEW)  
**Lines:** ~3

Export StatusBadge.

**Acceptance:** Can import from `@shared/ui`.

---

### Phase 5 Checkpoint
- [ ] StatusBadge renders
- [ ] Pulse animation works
- [ ] All three variants display correctly

---

## Phase 6: Inspector Panel

**Status:** 🔲 Not Started  
**Estimate:** ~50 lines TSX  
**Risk:** Low

### Stories

#### 6.1 Update InspectorPanel Container
**File:** `src/shared/layout/InspectorPanel.tsx`  
**Lines:** ~10

Apply `glass-panel-solid`, update header/footer.

**Acceptance:** Inspector has glass styling.

---

#### 6.2 Update InspectorPanel Typography
**File:** `src/shared/layout/InspectorPanel.tsx`  
**Lines:** ~20

Update title, subtitle, close button colors.

**Acceptance:** Typography uses glass tokens.

---

#### 6.3 Update InspectorSection
**File:** `src/shared/layout/InspectorPanel.tsx`  
**Lines:** ~10

Apply `.glass-section-header` to section titles.

**Acceptance:** Section headers are monospace/uppercase.

---

### Phase 6 Checkpoint
- [ ] Inspector is dark
- [ ] Header has dark overlay
- [ ] Sections have proper typography
- [ ] Dividers use glass border

---

## Phase 7: ObjectInspector

**Status:** 🔲 Not Started  
**Estimate:** ~20 lines TSX  
**Risk:** Low

### Stories

#### 7.1 Update Copy Button
**File:** `src/shared/inspector/ObjectInspector.tsx`  
**Lines:** ~10

Apply glass styling with hover glow.

**Acceptance:** Button glows cyan on hover.

---

#### 7.2 Update Collapsible Headers
**File:** `src/shared/inspector/ObjectInspector.tsx`  
**Lines:** ~10

Apply `.glass-section-header` styling.

**Acceptance:** Headers are monospace/uppercase.

---

### Phase 7 Checkpoint
- [ ] Copy button has glass styling
- [ ] Button glows on hover
- [ ] Section headers styled

---

## Phase 8: Collection Views

**Status:** 🔲 Not Started  
**Estimate:** ~100 lines TSX  
**Risk:** Medium (three files)

### Stories

#### 8.1 Update LensPicker
**File:** `src/explore/LensPicker.tsx`  
**Lines:** ~40

- Import StatusBadge
- Add to active lens cards
- Ensure glass-card states work

**Acceptance:** Active lens shows badge with pulse.

---

#### 8.2 Update JourneyList
**File:** `src/explore/JourneyList.tsx`  
**Lines:** ~30

Same pattern as LensPicker.

**Acceptance:** Consistent with LensPicker.

---

#### 8.3 Update NodeGrid
**File:** `src/explore/NodeGrid.tsx`  
**Lines:** ~30

Same pattern as LensPicker.

**Acceptance:** Consistent with LensPicker.

---

### Phase 8 Checkpoint
- [ ] All three views use glass-card
- [ ] StatusBadge appears on active items
- [ ] Visual consistency across views

---

## Final Verification

- [ ] Build passes
- [ ] All 161 tests pass
- [ ] Lenses view: glass cards, states work
- [ ] Journeys view: glass cards, states work
- [ ] Nodes view: glass cards, states work
- [ ] Inspector: glass styling
- [ ] Navigation: active state green
- [ ] Background: void with grid
- [ ] Before/after screenshot comparison

---

## Commit Strategy

| Phase | Commit Message |
|-------|----------------|
| 1 | `feat(styles): add quantum glass token foundation` |
| 2 | `feat(workspace): apply glass viewport background` |
| 3 | `feat(nav): apply glass styling to navigation sidebar` |
| 4 | `feat(cards): transform CardShell to quantum glass` |
| 5 | `feat(ui): add StatusBadge component` |
| 6 | `feat(inspector): apply glass styling to inspector panel` |
| 7 | `feat(inspector): update ObjectInspector glass styling` |
| 8 | `feat(explore): apply glass cards to collection views` |

---

*Story breakdown complete. Ready for EXECUTION_PROMPT.md.*
