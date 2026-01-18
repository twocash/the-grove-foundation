# Sprint: The Active Grove v1.0

> **Foundation Loop Sprint Package**
> Transform the landing page from static scroll to reactive two-stage experience.

---

## Sprint Overview

**Name:** `active-grove-v1`  
**Priority:** P1  
**Estimated Effort:** 5 days  
**Risk Level:** Medium-High (layout transformation, animation coordination)  
**Prerequisite:** ✅ `terminal-architecture-refactor-v1` (completed)

### The User Story

> "As a user, I start with a simple, intriguing view of the 'Tree.' Clicking it physically alters the page layout, revealing the Terminal. I am then required to choose a 'Lens' which visibly rewrites the main headline on the left, proving to me that the system is reactive. Only then does the Tree allow me to move forward into the content, and can dive into the chat experience in the exposed Grove Terminal."

### What the Terminal Refactor Enabled

The `terminal-architecture-refactor-v1` sprint extracted:
- `TerminalShell.tsx` — Chrome wrapper with programmatic control via `TerminalShellHandle`
- `TerminalChat.tsx` — Message rendering (standalone)
- `TerminalFlow.tsx` — Interstitials, lens picker, bridges
- `useTerminalState.ts` — Consolidated state management
- Lens-aware welcome messages via `getTerminalWelcome(lensId)`

This means GenesisPage can now:
1. Embed Terminal in a split layout (not just overlay)
2. Control Terminal focus programmatically
3. Listen for lens selection events via `onLensSelected` callback
4. Synchronize flow states with page-level state machine

---

## 1. Repository Audit

### Current State (Post-Terminal-Refactor)

```
src/surface/pages/GenesisPage.tsx       # ~400 lines - 6-section vertical scroll
src/surface/components/genesis/
├── HeroHook.tsx                        # Dynamic headline sizing (char-count based)
├── ProblemStatement.tsx                # CEO quotes - stacked cards
├── ScrollIndicator.tsx                 # Floating seedling → becomes ActiveTree
├── WaveformCollapse.tsx                # Text morphing animation
└── ... (other sections)

components/Terminal/
├── Terminal.tsx                        # Refactored composition root
├── TerminalShell.tsx                   # ✅ NEW - Chrome wrapper
├── TerminalChat.tsx                    # ✅ NEW - Message rendering
├── TerminalFlow.tsx                    # ✅ NEW - Flow states
├── useTerminalState.ts                 # ✅ NEW - Consolidated state
└── types.ts                            # ✅ NEW - Shared types

src/surface/hooks/
├── useQuantumInterface.ts              # Lens-reactive content
├── useNarrativeEngine.ts               # Session/lens management
└── useEngagementBridge.ts              # Event coordination
```

### Key Integration Points

| Component | Current Behavior | Target Behavior |
|-----------|------------------|-----------------|
| GenesisPage | Vertical scroll, Terminal overlay | Split layout, embedded Terminal |
| ScrollIndicator | Pulsing seedling with down arrow | ActiveTree with mode-aware states |
| HeroHook | Character-based sizing | + Viewport-aware fluid typography |
| ProblemStatement | Stacked cards | + Compressed carousel at 720px |
| Terminal | Overlay drawer | Inline split panel |

---

## 2. Specification

### Goals

| ID | Goal | Success Metric |
|----|------|----------------|
| G1 | Implement `uiMode` state machine | Tree click toggles hero↔split |
| G2 | Implement `flowState` synchronized with Terminal | Lens selection triggers headline morph |
| G3 | Transform ScrollIndicator → ActiveTree | Visual states for pulsing/stabilized/directional |
| G4 | Add fluid typography with container queries | Headlines scale elegantly at 720px |
| G5 | Create compressed quote carousel | CEO quotes work in split view |
| G6 | Implement clip-path split animation | Smooth 60fps "camera pan" reveal |
| G7 | Support responsive breakpoints | Mobile sheet, tablet 60/40, desktop 50/50 |

### Non-Goals

- **NG1:** Changing Terminal chat functionality
- **NG2:** Modifying lens definitions or content
- **NG3:** Adding new sections to landing page
- **NG4:** Changing the WaveformCollapse animation mechanics

### Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC1 | Tree click triggers split layout | Manual |
| AC2 | Split animation is smooth (60fps) | Chrome DevTools |
| AC3 | Lens selection in Terminal triggers headline morph | Manual |
| AC4 | Flow state gates navigation (can't scroll until unlocked) | Manual |
| AC5 | CEO quotes render as carousel at <800px container width | Responsive test |
| AC6 | Mobile (<768px) shows bottom sheet, not split | Device test |
| AC7 | Tablet (768-1024px) shows 60/40 split | Responsive test |
| AC8 | Desktop (>1024px) shows 50/50 split | Manual |
| AC9 | No layout shift or jank during transitions | Lighthouse |
| AC10 | Keyboard navigation works (Tab through Tree → Terminal) | a11y audit |

---

## 3. Architecture

### 3.1 State Machine Design

```typescript
// src/surface/pages/GenesisPage.tsx

type UIMode = 'hero' | 'split';

type FlowState = 
  | 'hero'           // Initial state, Tree pulsing
  | 'split'          // Terminal visible, waiting for lens
  | 'selecting'      // LensPicker active in Terminal
  | 'collapsing'     // Lens chosen, WaveformCollapse animating
  | 'unlocked';      // Headline rewritten, navigation enabled

// State transitions:
// 'hero' → Tree click → 'split'
// 'split' → LensPicker opens → 'selecting'
// 'selecting' → Lens chosen → 'collapsing'
// 'collapsing' → WaveformCollapse complete → 'unlocked'
```

### 3.2 Event Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         GenesisPage                              │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐ │
│  │ ActiveTree  │    │  HeroHook   │    │      Terminal        │ │
│  │             │    │             │    │                      │ │
│  │  onClick ───┼────┼─→ setUIMode │    │  onLensSelected ─────┼─┤
│  │             │    │   ('split') │    │                      │ │
│  │  mode ←─────┼────┼── flowState │    │                      │ │
│  └─────────────┘    │             │    └──────────────────────┘ │
│                     │             │              │               │
│                     │  trigger ←──┼──────────────┘               │
│                     │             │    (quantumTrigger)          │
│                     │             │                              │
│                     │  onComplete─┼─→ setFlowState('unlocked')  │
│                     └─────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Layout Structure

```tsx
// Conceptual JSX structure
<main className="relative h-screen overflow-hidden">
  {/* Content Rail - Left Side */}
  <div className={cn(
    "content-rail transition-all duration-1000",
    uiMode === 'split' ? 'w-1/2' : 'w-full'
  )}>
    <HeroHook 
      trigger={quantumTrigger}
      onAnimationComplete={() => setFlowState('unlocked')}
    />
    {flowState === 'unlocked' && (
      <div className="sections-container">
        <ProblemStatement variant={uiMode === 'split' ? 'compressed' : 'full'} />
        {/* ... other sections */}
      </div>
    )}
  </div>

  {/* Terminal Panel - Right Side */}
  <div className={cn(
    "terminal-panel fixed right-0 top-0 h-screen",
    uiMode === 'split' ? 'translate-x-0' : 'translate-x-full'
  )}>
    <Terminal 
      variant="embedded"
      onLensSelected={(lensId) => setFlowState('collapsing')}
    />
  </div>

  {/* ActiveTree - Floating Control */}
  <ActiveTree 
    mode={getTreeMode(flowState)}
    onClick={handleTreeClick}
  />
</main>
```

### 3.4 Responsive Strategy

| Breakpoint | Layout | Terminal Behavior |
|------------|--------|-------------------|
| < 768px (Mobile) | Full-width hero | Bottom sheet (80vh), dims hero behind |
| 768-1024px (Tablet) | 60/40 split | Collapsible right panel |
| > 1024px (Desktop) | 50/50 split | Fixed right panel |

```css
/* Responsive split ratios */
@media (min-width: 768px) and (max-width: 1024px) {
  .content-rail.split { width: 60%; }
  .terminal-panel { width: 40%; }
}

@media (min-width: 1024px) {
  .content-rail.split { width: 50%; }
  .terminal-panel { width: 50%; }
}
```

---

## 4. Decisions (ADRs)

### ADR-001: Clip-Path Animation Over Flex Transition

**Context:** The split animation needs to feel like a "camera pan" or mask reveal, not a responsive re-layout that causes text reflow.

**Decision:** Use `clip-path: inset()` for the content rail transition instead of width-based flexbox.

**Rationale:**
- Width transitions cause text to reflow during animation (ugly)
- Clip-path masks content without changing layout
- GPU-accelerated, maintains 60fps
- Content remains at full width, just progressively revealed

**Implementation:**
```css
.content-rail {
  width: 100%;  /* Always full width internally */
  clip-path: inset(0 0 0 0);
  transition: clip-path 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.content-rail.split {
  clip-path: inset(0 50% 0 0);  /* Mask right half */
}
```

**Consequence:** Content must be centered within its container, not left-aligned, for the mask to look natural.

---

### ADR-002: Flow State in GenesisPage, Not Context

**Context:** The flow state machine could live in React Context for global access, or local to GenesisPage.

**Decision:** Keep flow state local to GenesisPage with prop drilling to children.

**Rationale:**
- Flow state is page-specific (only GenesisPage needs it)
- Prop drilling is explicit and debuggable
- Avoids context re-render cascade
- Terminal communicates via callback, not shared state

**Consequence:** ActiveTree, HeroHook receive `flowState` as prop. Terminal receives `onLensSelected` callback.

---

### ADR-003: Container Queries for Typography

**Context:** Headlines need to scale based on available space, not viewport width (since split mode changes available space).

**Decision:** Use CSS Container Queries with `@container` rules.

**Rationale:**
- Container queries respond to parent width, not viewport
- When split happens, container shrinks → font shrinks automatically
- No JavaScript required for responsive typography
- Well-supported in modern browsers

**Implementation:**
```css
.hero-container {
  container-type: inline-size;
}

@container (max-width: 800px) {
  .hero-headline {
    font-size: clamp(2rem, 8cqw, 4rem);
  }
}
```

---

### ADR-004: Quote Carousel as Progressive Enhancement

**Context:** CEO quotes need to work in compressed space but also look good at full width.

**Decision:** ProblemStatement accepts `variant` prop ('full' | 'compressed') rather than auto-detecting.

**Rationale:**
- Explicit control from parent based on `uiMode`
- No ResizeObserver complexity
- Easier to test both variants
- Can animate between variants if desired

**Implementation:**
```tsx
<ProblemStatement variant={uiMode === 'split' ? 'compressed' : 'full'} />
```

---

### ADR-005: Mobile Uses Sheet, Not Split

**Context:** 50/50 split is unusable on mobile (<768px). Need alternative interaction pattern.

**Decision:** Mobile uses bottom sheet modal for Terminal (80vh height).

**Rationale:**
- Familiar mobile pattern (Maps, social apps)
- Hero content remains visible but dimmed
- Sheet can be dragged to expand/dismiss
- No layout transformation needed

**Implementation:**
- Add `variant="sheet"` prop to Terminal
- Use Radix or Vaul sheet primitive
- Tree click opens sheet instead of triggering split

---

## 5. Migration Map

### Phase 1: Foundation (Day 1)

| Step | File | Change |
|------|------|--------|
| 1.1 | `GenesisPage.tsx` | Add `uiMode` and `flowState` state variables |
| 1.2 | `GenesisPage.tsx` | Wrap content in `.content-rail` container |
| 1.3 | `globals.css` | Add clip-path transition styles |
| 1.4 | `ScrollIndicator.tsx` | Rename to `ActiveTree.tsx`, add `mode` prop |
| 1.5 | `HeroHook.tsx` | Add container query wrapper |
| 1.6 | `globals.css` | Add fluid typography rules |

### Phase 2: Integration (Day 2)

| Step | File | Change |
|------|------|--------|
| 2.1 | `Terminal.tsx` | Add `onLensSelected` callback prop |
| 2.2 | `Terminal.tsx` | Add `variant="embedded"` prop for split mode |
| 2.3 | `GenesisPage.tsx` | Wire `onLensSelected` → `setFlowState('collapsing')` |
| 2.4 | `GenesisPage.tsx` | Wire `quantumTrigger` to lens selection |
| 2.5 | `useEngagementBridge.ts` | Add split-mode event emission |

### Phase 3: Locking (Day 3)

| Step | File | Change |
|------|------|--------|
| 3.1 | `ActiveTree.tsx` | Implement visual states (pulsing/stabilized/directional) |
| 3.2 | `ActiveTree.tsx` | Add shake animation for locked state |
| 3.3 | `GenesisPage.tsx` | Gate scroll/navigation on `flowState === 'unlocked'` |
| 3.4 | `HeroHook.tsx` | Add `onAnimationComplete` callback to WaveformCollapse |

### Phase 4: Polish (Day 4)

| Step | File | Change |
|------|------|--------|
| 4.1 | `globals.css` | Tune animation bezier curves |
| 4.2 | `ProblemStatement.tsx` | Add `variant` prop and carousel mode |
| 4.3 | `ProblemStatement.tsx` | Implement 180x180px square cards |
| 4.4 | `ProblemStatement.tsx` | Add drag/swipe carousel behavior |
| 4.5 | `GenesisPage.tsx` | Add `will-change` performance guards |

### Phase 5: Responsive (Day 5)

| Step | File | Change |
|------|------|--------|
| 5.1 | `Terminal.tsx` | Add `variant="sheet"` for mobile |
| 5.2 | `GenesisPage.tsx` | Detect breakpoint, choose split vs sheet |
| 5.3 | `GenesisPage.tsx` | Tablet 60/40 layout styles |
| 5.4 | `ActiveTree.tsx` | Add `aria-expanded`, focus management |
| 5.5 | E2E tests | `active-grove-flow.spec.ts` |

---

## 6. Stories (Epic Breakdown)

### Epic 1: Layout State Machine (~4 hours)

**1.1 Define State Types**
- Add `UIMode` and `FlowState` types
- Initialize state in GenesisPage
- Add debug logging for state transitions

**1.2 Content Rail Container**
- Wrap HeroHook in `.content-rail` div
- Add clip-path CSS rules
- Wire `uiMode` to class toggle

**1.3 Terminal Panel**
- Position Terminal as fixed right panel
- Add transform-based slide transition
- Wire `uiMode` to visibility

**1.4 Fluid Typography**
- Add container query wrapper to HeroHook
- Create `clamp()` rules for headlines
- Test at 720px width

### Epic 2: ActiveTree Component (~3 hours)

**2.1 Rename & Refactor**
- Rename ScrollIndicator → ActiveTree
- Add `mode: 'pulsing' | 'stabilized' | 'directional'` prop
- Keep backward compatibility

**2.2 Visual States**
- Pulsing: Intensified glow, faster animation
- Stabilized: Solid, waiting indicator
- Directional: Down arrow variant

**2.3 Interaction Logic**
- Tree click in hero → trigger split
- Tree click when locked → shake animation
- Tree click when unlocked → scroll to content

### Epic 3: Event Integration (~4 hours)

**3.1 Terminal Callbacks**
- Add `onLensSelected(lensId)` prop to Terminal
- Emit from LensPicker selection
- Pass through TerminalFlow props

**3.2 Flow State Wiring**
- GenesisPage listens for lens selection
- Trigger `quantumTrigger` on selection
- Set flowState to 'collapsing'

**3.3 Animation Completion**
- WaveformCollapse emits `onComplete`
- HeroHook forwards to parent
- GenesisPage sets flowState to 'unlocked'

### Epic 4: Quote Carousel (~4 hours)

**4.1 Variant Prop**
- Add `variant: 'full' | 'compressed'` to ProblemStatement
- Pass from GenesisPage based on uiMode

**4.2 Compressed Layout**
- 180x180px square cards
- Horizontal scroll container
- Dot indicators

**4.3 Carousel Behavior**
- Drag/swipe navigation
- Click to expand full quote
- Auto-pause on hover

### Epic 5: Responsive Breakpoints (~4 hours)

**5.1 Mobile Sheet**
- Add sheet variant to Terminal
- Tree click opens sheet (not split)
- 80vh height, drag to dismiss

**5.2 Tablet Layout**
- 60/40 split ratio
- Collapsible Terminal panel
- Adjust typography scale

**5.3 Accessibility**
- aria-expanded on Terminal
- Focus management on split
- Keyboard navigation through Tree

### Epic 6: E2E Tests (~3 hours)

**6.1 `active-grove-flow.spec.ts`**
- Tree click triggers split
- Lens selection triggers headline morph
- Navigation unlocks after animation

**6.2 Responsive Tests**
- Mobile sheet behavior
- Tablet split ratio
- Desktop 50/50

---

## 7. Execution Prompt

```markdown
# Active Grove Sprint - Execution Prompt

## Context
You are implementing the "Active Grove" sprint for Grove Foundation.
This transforms the landing page from static scroll to reactive split experience.

## Prerequisite
The terminal-architecture-refactor-v1 sprint is complete.
TerminalShell, TerminalChat, TerminalFlow are extracted and available.

## Your Task
Implement the sprint according to SPRINT_PLAN.md in this directory.
Follow the Migration Map phases in order (Foundation → Integration → Locking → Polish → Responsive).

## Build Gates
After each phase:
1. `npm run build` - Must pass
2. `npm run test` - Must pass
3. Manual test at http://localhost:3000

## Key Files to Modify
- src/surface/pages/GenesisPage.tsx
- src/surface/components/genesis/ScrollIndicator.tsx → ActiveTree.tsx
- src/surface/components/genesis/HeroHook.tsx
- src/surface/components/genesis/ProblemStatement.tsx
- components/Terminal/Terminal.tsx
- styles/globals.css

## Success Criteria
1. Tree click splits page
2. Lens selection morphs headline
3. Navigation locked until morph complete
4. Smooth 60fps animations
5. Responsive at all breakpoints

## Do NOT
- Modify lens definitions
- Change Terminal chat functionality
- Add new landing page sections
- Break existing /terminal route
```

---

## 8. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Clip-path animation jank | Medium | High | Test on low-end devices, add will-change |
| Flow state race conditions | Medium | Medium | Use useCallback, add transition guards |
| Typography scale breaks | Low | Medium | Container query fallbacks |
| Mobile sheet conflicts with FAB | Medium | Low | Z-index audit, position adjustment |
| WaveformCollapse callback timing | Low | High | Add explicit animation end detection |

---

## Appendix: CSS Reference

### Split Animation Styles

```css
/* Content Rail */
.content-rail {
  position: relative;
  width: 100%;
  min-height: 100vh;
  clip-path: inset(0 0 0 0);
  transition: clip-path 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.content-rail.split {
  clip-path: inset(0 50% 0 0);
}

@media (min-width: 768px) and (max-width: 1024px) {
  .content-rail.split {
    clip-path: inset(0 40% 0 0);
  }
}

/* Terminal Panel */
.terminal-panel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 50%;
  transform: translateX(100%) scale(0.95);
  opacity: 0;
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.terminal-panel.visible {
  transform: translateX(0) scale(1);
  opacity: 1;
}

@media (min-width: 768px) and (max-width: 1024px) {
  .terminal-panel { width: 40%; }
}

@media (max-width: 767px) {
  .terminal-panel {
    width: 100%;
    height: 80vh;
    top: auto;
    bottom: 0;
    transform: translateY(100%);
  }
  .terminal-panel.visible {
    transform: translateY(0);
  }
}
```

### Fluid Typography

```css
.hero-container {
  container-type: inline-size;
}

.hero-headline {
  font-size: clamp(2.5rem, 5vw + 1rem, 6rem);
  line-height: clamp(1.0, calc(1 + 0.1vw), 1.2);
}

@container (max-width: 800px) {
  .hero-headline {
    font-size: clamp(2rem, 8cqw, 4rem);
  }
}
```

### ActiveTree States

```css
.active-tree {
  transition: all 0.3s ease;
}

.active-tree.pulsing {
  animation: pulse-glow 2s ease-in-out infinite;
}

.active-tree.stabilized {
  animation: none;
  filter: drop-shadow(0 0 8px var(--color-accent));
}

.active-tree.directional {
  animation: bounce-down 1s ease-in-out infinite;
}

.active-tree.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

---

*Sprint plan complete. Ready for CLI handoff.*
