# Development Log

> Surface vs. Substrate / Foundation Console
> Running log of changes, decisions, and discoveries

---

## 2025-12-30 | Selection Model Fix v1 - Complete

### Objective
Fix broken text selection behavior in the Sprout capture system. Selection was unreliable: pill would bounce away from cursor, selection would clear on pill click, and visual highlight would disappear during capture flow.

### Root Cause Analysis

The original implementation used continuous `selectionchange` event listening, which caused:
1. **Pill bounce**: Selection rect kept updating as cursor moved, making pill jump
2. **Focus theft**: Clicking pill would trigger focus changes that cleared browser selection
3. **Visual feedback loss**: Browser's native highlight disappeared when focus shifted to capture UI

### Solution Architecture

| Problem | Solution |
|---------|----------|
| Continuous `selectionchange` updates | Mouseup-based capture (only capture on mouse release) |
| Focus theft on pill click | `onMouseDown={(e) => e.preventDefault()}` on all capture UI |
| Selection clear on outside click | `data-capture-ui` attribute to identify capture elements |
| Highlight disappears | Custom `SelectionHighlight` overlay with persistent `highlightRects` state |
| Magnetic scaling causes perceived jump | Disabled magnetic effect (`magneticScale: 1.0`) |

### Key Implementation Details

#### Mouseup-Based Selection (replaces selectionchange)
```typescript
// Track selection via mousedown/mouseup instead of continuous selectionchange
const handleMouseDown = (e: MouseEvent) => {
  if (container.contains(target) && !target.closest('[data-capture-ui]')) {
    isSelectingRef.current = true;
    if (!isLocked) setSelection(null);
  }
};

const handleMouseUp = (e: MouseEvent) => {
  if (!isSelectingRef.current) return;
  isSelectingRef.current = false;
  requestAnimationFrame(() => captureSelection());
};
```

#### Selection Locking Pattern
- `lockSelection()`: Called when capture starts, prevents updates during flow
- `unlockSelection()`: Called on cancel/complete, re-enables selection
- Selection state frozen during entire capture flow

#### Persistent Highlight Overlay
- `highlightRects` state syncs from `selection.rects` when not capturing
- Freezes in place during capture (sync effect skipped when `isCapturing`)
- Clears only on explicit `clearHighlight()` call (cancel/complete)

### Files Created

| File | Purpose |
|------|---------|
| `Capture/components/SelectionHighlight.tsx` | Custom highlight overlay for selected text |

### Files Modified

| File | Changes |
|------|---------|
| `Capture/hooks/useTextSelection.ts` | Complete rewrite: mouseup-based capture, locking, rects array |
| `Capture/components/MagneticPill.tsx` | Added `data-capture-ui="pill"` |
| `Capture/components/ActionMenu.tsx` | Added `data-capture-ui="menu"` |
| `Capture/components/SproutCaptureCard.tsx` | Added `data-capture-ui="card"`, `onMouseDown` |
| `Capture/components/ResearchManifestCard.tsx` | Added `data-capture-ui="card"`, `onMouseDown` |
| `Capture/config/sprout-capture.config.ts` | Disabled magnetic scaling (`magneticScale: 1.0`) |
| `Capture/index.ts` | Export `SelectionHighlight`, `SelectionRect` type |
| `ExploreShell.tsx` | Added `highlightRects` state, `clearHighlight()`, updated render logic |

### Learnings

1. **Browser Selection API limitations**: Native selection highlight disappears when focus shifts. For persistent visual feedback, a custom overlay is required.

2. **Event timing matters**: `selectionchange` fires during drag, not just on completion. For stable UI, capture state only on `mouseup`.

3. **Focus prevention**: `e.preventDefault()` on `mousedown` prevents focus shift but must be on ALL interactive elements in the capture UI.

4. **State isolation for animations**: Magnetic scaling (spring animation) combined with position changes creates perceived "jumping". Disable animation when precision matters.

### Test Results
- All 376 tests pass
- Build succeeds

---

## 2025-12-29 | Kinetic Cultivation v1 - Complete

### Objective
Add Sprout capture functionality to the Kinetic Stream at `/explore`, enabling users to select text and save valuable LLM responses as "sprouts" with full provenance tracking.

### Deviations from Original Plan

| Planned | Actual | Rationale |
|---------|--------|-----------|
| Create Zustand `sproutStore` | Reused existing `useSproutStorage` | Avoid parallel state systems (Anti-Pattern 1) |
| Visual baseline screenshots | Not captured | Feature completed but baseline tests not run |
| Flight animation (orb to tray) | Simplified transition | Kept scope focused; can add later |

### Surprises & Discoveries

1. **Vite Glob Import Caching**: JSON files loaded via `import.meta.glob` are cached at build time. Editing `.moment.json` files requires dev server restart to pick up changes. The cache bust comment in `moment-loader.ts` helps force re-evaluation.

2. **React State Isolation**: Two separate calls to `useSproutStorage()` create independent hook instances that don't share state. Fixed by lifting state to parent and passing props (SproutTray now receives `sprouts` as prop from ExploreShell).

3. **Auto-scroll Timing**: `useLayoutEffect` prevents flicker but `isAtBottom` can get stuck `false` due to forced reflow timing between state updates. Fixed by always scrolling and resetting `isAtBottom` to `true` when `items.length` changes.

4. **Moment Action Variants**: Secondary actions in MomentObject require `variant: "secondary"` in the JSON. Added "Choose Existing" button to custom-lens-offer moment with proper navigation wiring.

### Learnings

1. **Selection Action Pattern**: Text selection + floating pill + capture card is a reusable pattern for content capture. Key elements:
   - `useTextSelection` hook with debounce and container filtering
   - `MagneticPill` with spring physics and viewport collision
   - `SproutCaptureCard` with context auto-fill from hooks

2. **Props vs Hook Instances**: When child components need to react to parent state changes, pass data as props rather than having child call the same hook (creates separate instance).

3. **E2E Test Robustness**: Playwright tests should use `data-testid` selectors and verify button existence before testing behavior. Flexible locators prevent false failures from text changes.

### Work Completed

#### Epic 1: The Grasp (Text Selection + MagneticPill)
- Created `useTextSelection.ts` hook for detecting text selection within a container
- Created `MagneticPill.tsx` - Floating button that appears near selection with magnetic scale effect
- Created `sprout-capture.config.ts` with UI dimensions, animation settings, and default action
- Added `data-message-id` attribute to ResponseObject for selection context

**Key Pattern**: Selection detection uses `selectionchange` event with debounce and `containsNode` check

#### Epic 2: The Seed Packet (Capture Card)
- Created `useCaptureState.ts` hook for managing capture modal state
- Created `SproutCaptureCard.tsx` - Modal card with selection preview, tag input, context badges
- Integrated with existing `useSproutStorage` hook for persistence
- Added XState telemetry via `SPROUT_CAPTURED` event

**XState Integration**: All telemetry flows through `actor.send()` instead of legacy engagement bus

#### Epic 3: The Tray (Sprout Store + Tray)
- Created `SproutCard.tsx` - Individual sprout display with delete action
- Created `SproutTray.tsx` - Collapsible side tray showing captured sprouts
- Added CSS tokens for tray styling in globals.css
- Tray expands on hover, shows sprout count badge when collapsed

#### Epic 4: Pilot's Controls (Keyboard Shortcuts)
- Created `useKineticShortcuts.ts` - Platform-aware keyboard shortcut handler
- Created `KeyboardHUD.tsx` - Overlay showing available shortcuts
- Added shortcuts: Cmd/Ctrl+S (capture selection), Cmd/Ctrl+/ (show help)

**Platform Detection**: Uses `navigator.platform` for Mac vs Windows modifier keys

#### Epic 5: Polish (Adapter + Final Tests)
- Created `sproutAdapter.ts` with flattenSprout, nestSprout, migrateSprout utilities
- Provides backward compatibility for legacy flat provenance format
- All 376 existing tests continue to pass

### Files Created (12 TypeScript files)

| File | Purpose |
|------|---------|
| `src/surface/components/KineticStream/Capture/config/sprout-capture.config.ts` | UI and animation configuration |
| `src/surface/components/KineticStream/Capture/hooks/useTextSelection.ts` | Text selection detection |
| `src/surface/components/KineticStream/Capture/hooks/useCaptureState.ts` | Capture modal state |
| `src/surface/components/KineticStream/Capture/hooks/useKineticShortcuts.ts` | Keyboard shortcuts |
| `src/surface/components/KineticStream/Capture/components/MagneticPill.tsx` | Floating capture button |
| `src/surface/components/KineticStream/Capture/components/SproutCaptureCard.tsx` | Capture form card |
| `src/surface/components/KineticStream/Capture/components/SproutCard.tsx` | Sprout display card |
| `src/surface/components/KineticStream/Capture/components/SproutTray.tsx` | Collapsible sprout tray |
| `src/surface/components/KineticStream/Capture/components/KeyboardHUD.tsx` | Shortcuts help overlay |
| `src/surface/components/KineticStream/Capture/utils/sproutAdapter.ts` | Legacy format adapter |
| `src/surface/components/KineticStream/Capture/index.ts` | Barrel exports |

### Files Modified

| File | Changes |
|------|---------|
| `src/surface/components/KineticStream/ExploreShell.tsx` | Full capture flow integration |
| `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx` | Added data-message-id |
| `styles/globals.css` | Added tray CSS tokens |
| `hooks/useSproutCapture.ts` | Fixed XState dependency (emit→actor) |

### Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| XState over engagement bus | All telemetry via `actor.send()` per project direction |
| Existing useSproutStorage | Reuse proven localStorage persistence |
| Platform-aware shortcuts | Cmd on Mac, Ctrl on Windows for native feel |
| Tray hover expansion | Keeps primary content area unobstructed |

### Verification
- ✅ Build passes (54.12s)
- ✅ All 376 tests pass
- ✅ Text selection triggers MagneticPill
- ✅ Capture card saves sprout with provenance
- ✅ Tray shows captured sprouts
- ✅ Keyboard shortcuts work on both platforms

---

## 2025-12-29 | Moment UI Integration Sprint

### Session Summary
- **Branch**: `kinetic-stream-feature`
- **Objective**: Wire Moment system to Kinetic Stream UI surfaces

### Work Completed

#### 1. Custom Lens Wizard Integration
- Fixed wizard navigation breaking `/explore` experience
- Previously: clicking "Create My Lens" did `window.location.href = '/?lens=custom&wizard=true'`
- Now: wizard opens as overlay within ExploreShell (follows LensPicker pattern)
- Added `handleWizardComplete` callback to save lens and set `customLensCreated` flag
- Lens pill now updates after wizard completion (checks both preset personas AND custom lenses)

**Files Modified**:
- `src/surface/components/KineticStream/ExploreShell.tsx` - Wizard overlay integration
- `src/data/moments/core/custom-lens-offer.moment.json` - Added `customLensCreated` flag check

#### 2. Journey Offer Moment
- Fixed trigger that never fired (entropy was always 0, never calculated)
- Removed `entropy: { min: 0.4 }` requirement (entropy infrastructure not implemented)
- Changed `exchangeCount` from `{ min: 5 }` to `{ min: 3 }`
- Changed surface from `overlay` to `inline` (appears in stream like custom-lens-offer)
- Added `stage: ["EXPLORING", "ENGAGED"]` requirement

**Files Modified**:
- `src/data/moments/engagement/entropy-journey-offer.moment.json` - Trigger simplification

#### 3. Journey Picker Overlay
- Created new journey picker overlay in ExploreShell
- Uses `glass-card` styling to match LensPicker
- Lists all 6 journeys with title, description, estimated time
- `handleJourneySelect` starts journey and sets `journeyOfferShown` flag

**Key Code**:
```typescript
const handleJourneySelect = useCallback((journeyId: string) => {
  const journey = journeys.find(j => j.id === journeyId);
  if (journey) {
    engStartJourney(journey);
    actor.send({ type: 'SET_FLAG', key: 'journeyOfferShown', value: true });
  }
  setOverlay({ type: 'none' });
}, [engStartJourney, actor]);
```

#### 4. Debug Logging
- Added evaluation context logging to `useMoments.ts`
- Logs `exchangeCount`, `stage`, `flags` on each evaluation
- Helps diagnose why moments aren't triggering

#### 5. Infrastructure Ticket Created
- Created `docs/sprints/entropy-calculation-v1/TICKET.md`
- Documents that entropy is never calculated (always 0)
- Includes 5-step implementation plan
- Defines what entropy should represent (conversation divergence)

### Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Wizard as overlay, not route | Preserves stream state, follows existing LensPicker pattern |
| Remove entropy from journey trigger | Entropy not implemented; would block journey offers forever |
| Journey picker inline | Consistent with other moment interactions |
| Use `glass-card` class | Design consistency across all picker overlays |

### Known Issues
- Entropy calculation not implemented (ticket created)
- Engagement bridge deprecated but still used in legacy Terminal.tsx

---

## 2025-12-16 | Phase 0: Documentation & Planning

### Session Start
- **Branch**: `goofy-lumiere`
- **Git Status**: Clean
- **Objective**: Create comprehensive documentation for Surface/Foundation migration

### Work Completed

#### 1. Repository Audit (`docs/REPO_AUDIT.md`)
- Analyzed build tooling: Vite 6.2.0, TypeScript 5.8.2
- Documented routing approach: No router, query-param based admin
- Documented styling: Tailwind via CDN (not npm)
- Catalogued all components, hooks, services
- Identified technical debt and migration risks

**Key Findings**:
- `App.tsx:24-29`: Admin detection via `?admin=true`
- `index.html:7`: Tailwind CDN load
- `index.html:11-48`: Inline Tailwind config
- 47 TSX components, 32 TS modules
- Engagement bus singleton pattern in `useEngagementBus.ts`

#### 2. Specification Document (`docs/SPEC.md`)
- Defined functional requirements (FR-1 through FR-5)
- Defined non-functional requirements
- Created architecture overview
- Specified design tokens for both Surface and Foundation
- Established acceptance criteria for each sprint

**Key Requirements**:
- FR-1: Install `react-router-dom`
- FR-2: Migrate Tailwind from CDN to npm
- FR-3: Create Foundation layout (HUD, sidebar, grid viewport)
- FR-4: Port all admin consoles
- FR-5: Extract Core module

#### 3. Architecture Document (`docs/ARCHITECTURE.md`)
- Defined three-layer architecture: Core → Hooks → Experiences
- Specified target directory structure
- Documented module boundaries and dependency rules
- Outlined state management architecture
- Defined routing structure

**Key Architectural Decisions**:
- `core/` has zero React dependencies
- `surface/` and `foundation/` never import from each other
- Hooks bridge Core to React components
- Path aliases for clean imports

#### 4. Migration Map (`docs/MIGRATION_MAP.md`)
- Mapped all file moves from current to target structure
- Documented shim strategy for backward compatibility
- Listed breaking changes and import updates
- Specified cleanup steps for Sprint 4

**Migration Phases**:
1. Sprint 1: Routing + Tailwind (no file moves)
2. Sprint 2: Core extraction
3. Sprint 3: Surface/Foundation organization
4. Sprint 4: Shim removal + cleanup

#### 5. Foundation UI Specification (`docs/FOUNDATION_UI.md`)
- Defined color system (obsidian backgrounds, holo accents)
- Specified typography (JetBrains Mono primary)
- Detailed layout system (48px header, 56px sidebar, grid viewport)
- Specified all components: DataPanel, MetricCard, DataGrid, EventLog, etc.
- Documented interaction patterns and animations
- Created CSS variables reference

**Key Design Tokens**:
- `obsidian-DEFAULT`: #0D0D0D (deepest background)
- `holo-cyan`: #00D4FF (primary accent)
- Grid: 40px cells, 0.1 opacity cyan lines

#### 6. Architecture Decision Records (`docs/DECISIONS.md`)
- ADR-001: React Router installation (approved)
- ADR-002: Tailwind CDN to npm migration (approved)
- ADR-003: Core module extraction strategy (approved)
- ADR-004: Fixed HUD layout for Foundation (approved)
- ADR-005: Evocative console naming (approved)
- ADR-006: Feature flag + Topic hub consolidation (approved)
- ADR-007: Keep localStorage persistence (approved)
- ADR-008: Shim strategy for migration (approved)
- ADR-009: No theme toggle (fixed themes) (approved)
- ADR-010: TypeScript path aliases (approved)

#### 7. Sprint Plan (`docs/SPRINTS.md`)
- Detailed 4 sprints with epics and stories
- Each story has acceptance criteria and tasks
- Test commands documented
- Definition of Done for each sprint

**Sprint Overview**:
- Sprint 1: Routing + Tailwind Migration
- Sprint 2: Foundation Layout + Basic Consoles
- Sprint 3: Console Migration (all 5 consoles)
- Sprint 4: Core Extraction + Cleanup

### Searches Performed

| Search | Purpose | Result |
|--------|---------|--------|
| `Glob **/*.ts` | Find all TypeScript files | 32 files |
| `Glob **/*.tsx` | Find all React components | 47 files |
| `Glob docs/**/*` | Find existing documentation | 6 files |
| `Read App.tsx` | Understand routing/admin | 651 lines, query-param routing |
| `Read index.html` | Understand Tailwind setup | CDN at line 7 |
| `Read useEngagementBus.ts` | Understand state management | Singleton pattern |

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `docs/REPO_AUDIT.md` | ~450 | Comprehensive codebase audit |
| `docs/SPEC.md` | ~350 | Requirements and architecture |
| `docs/ARCHITECTURE.md` | ~400 | Target state and boundaries |
| `docs/MIGRATION_MAP.md` | ~400 | File moves and shims |
| `docs/FOUNDATION_UI.md` | ~500 | Layout and component specs |
| `docs/DECISIONS.md` | ~400 | ADR-style decisions |
| `docs/SPRINTS.md` | ~500 | Sprint planning with stories |
| `docs/DEVLOG.md` | This file | Running development log |

### Next Steps

1. **Review documentation** with stakeholders
2. **Get approval** on ADRs
3. **Begin Sprint 1, Story 1.1.1**: Install React Router
4. **Create screenshots** of current Surface for visual regression testing

### Build Verification

**Build Status**: SUCCESS (13.68s)
```bash
npm run build
# ✓ 2389 modules transformed
# dist/index.html: 3.29 kB (gzip: 1.35 kB)
# dist/assets/index-C1cI8fLD.js: 872.95 kB (gzip: 248.68 kB)
```

**TypeScript Status**: 39 PRE-EXISTING ERRORS
- These errors exist in the codebase prior to this work
- Vite builds successfully despite tsc errors (it doesn't enforce strict checking)
- Errors are in: `AdminAudioConsole.tsx`, `AudioPlayer.tsx`, `NarrativeGraphView.tsx`, `funnelAnalytics.ts`, etc.
- **Recommendation**: Fix these as part of Sprint 4 cleanup or as a separate tech debt sprint

### Open Questions

1. Should we support mobile for Foundation? (Current decision: No, desktop only)
2. Should Foundation have a different favicon? (Not discussed)
3. Should we add analytics to Foundation? (Not discussed)
4. Should we fix pre-existing TypeScript errors before or during migration? (Not discussed)

---

## 2025-12-18 | V2.1 Journey Plan Refresh

### Session Start
- **Branch**: `work`
- **Git Status**: Clean prior to edits
- **Objective**: Replace legacy Surface/Foundation migration plan with V2.1 journey restoration documents and align sprint plan.

### Work Completed
- Rewrote repo audit to focus on V2.0/V2.1 dual-model risks and runtime boundaries.【F:docs/REPO_AUDIT.md†L1-L31】
- Authored V2.1 journey restoration spec, architecture, migration map, and ADR updates aligned to journey/node runtime.【F:docs/SPEC.md†L1-L43】【F:docs/ARCHITECTURE.md†L1-L29】【F:docs/MIGRATION_MAP.md†L1-L20】【F:docs/DECISIONS.md†L1-L17】
- Created two-sprint plan with execution prompt for coding agents to deliver the V2.1 refactor in phases.【F:docs/SPRINTS.md†L1-L38】

### Notes
- No automated tests run (documentation-only work).【F:docs/SPEC.md†L40-L54】
- Git remote is not configured; pushing to origin will require adding the remote URL before `git push`.【d8b710†L1-L1】

## Template for Future Entries

```markdown
## YYYY-MM-DD | Sprint X, Story X.X.X

### Session Start
- **Branch**: branch-name
- **Git Status**: clean/dirty
- **Objective**: What are we doing

### Work Completed

#### Task Description
- What was done
- Key findings
- Issues encountered

### Files Changed/Created

| File | Action | Notes |
|------|--------|-------|
| path/to/file | Created/Modified/Deleted | Description |

### Commands Run

```bash
command 1
command 2
```

### Test Results

- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Feature works

### Blockers/Issues

- Issue description and status

### Next Steps

1. What's next
```

---

## 2025-12-16 | Sprint 1: Routing + Tailwind Migration

### Session Start
- **Branch**: `goofy-lumiere`
- **Git Status**: Clean (docs uncommitted)
- **Objective**: Complete Sprint 1 - Install React Router and migrate Tailwind

### Work Completed

#### Story 1.1.1: Install and Configure React Router
- Installed `react-router-dom` v7.1.5
- Created `src/router/index.tsx` - Router provider wrapper
- Created `src/router/routes.tsx` - Route configuration with lazy loading
- Routes implemented:
  - `/` → SurfacePage (home)
  - `/foundation` → FoundationLayout (admin dashboard)
  - `/foundation/*` → FoundationLayout (nested routes)
  - `*` → Redirect to `/`

#### Story 1.1.2: Legacy Redirect
- Updated `src/App.tsx` with `LegacyAdminRedirect` component
- Detects `?admin=true` query param and redirects to `/foundation`
- Cleans URL via `history.replaceState` before redirect

#### Story 1.1.3: Surface Section Anchors
- Created `src/surface/pages/SurfacePage.tsx`
- Preserved Intersection Observer for section detection
- Hash-based scrolling works via browser native behavior

#### Story 1.2.1: Install Tailwind and PostCSS
- Installed `tailwindcss` v4.1.8, `autoprefixer`, `@tailwindcss/postcss`
- Created `postcss.config.js` with `@tailwindcss/postcss` plugin
- Note: Tailwind v4 uses `@tailwindcss/postcss` not `tailwindcss` directly

#### Story 1.2.2: Remove CDN from index.html
- Removed `<script src="https://cdn.tailwindcss.com">` from `index.html`
- Removed inline `<script>tailwind.config = {...}</script>` (lines 11-48)
- Created `styles/globals.css` with Tailwind v4 CSS-based config

#### Story 1.2.3: Foundation Theme Tokens
- Added Foundation design tokens to `@theme {}` block:
  - `--color-obsidian`, `--color-obsidian-raised`, `--color-obsidian-elevated`
  - `--color-holo-cyan`, `--color-holo-magenta`, `--color-holo-lime`, `--color-holo-amber`
- Added Foundation utility classes:
  - `.f-grid-overlay` - 40px cyan grid background
  - `.f-glow`, `.f-glow-strong` - Holographic glow effects
  - `.f-panel` - Panel with hover glow
  - `.f-scrollbar` - Dark scrollbar styling

### Files Created/Modified

| File | Action | Notes |
|------|--------|-------|
| `src/router/index.tsx` | Created | Router provider |
| `src/router/routes.tsx` | Created | Route definitions with lazy loading |
| `src/App.tsx` | Modified | Added router integration, legacy redirect |
| `src/surface/pages/SurfacePage.tsx` | Created | Extracted Surface content |
| `src/foundation/layout/FoundationLayout.tsx` | Created | Placeholder Foundation shell |
| `index.html` | Modified | Removed Tailwind CDN |
| `index.tsx` | Modified | Updated CSS import |
| `postcss.config.js` | Created | PostCSS configuration |
| `styles/globals.css` | Created | Tailwind v4 config + custom styles |

### Build Results

```
dist/index.html                           1.08 kB │ gzip:   0.60 kB
dist/assets/index-FN55Y1vk.css           72.55 kB │ gzip:  12.61 kB
dist/assets/FoundationLayout-7TRbGpIE.js  3.11 kB │ gzip:   0.91 kB
dist/assets/index-DKLz0c8-.js           896.08 kB │ gzip: 264.65 kB
✓ built in 19.41s
```

**Code Splitting Working**: FoundationLayout is in separate chunk (3.11 kB)

### Test Results

- [x] TypeScript compiles (pre-existing errors remain)
- [x] Build succeeds
- [x] React Router installed and configured
- [x] Tailwind CSS migrated to npm
- [x] Foundation theme tokens available
- [x] Lazy loading working (separate chunk)

### Next Steps

1. **Sprint 2, Story 2.1.1**: Implement Foundation layout shell (HUD, sidebar, viewport)
2. **Sprint 2, Story 2.1.2**: Create Foundation navigation component
3. **Sprint 2, Story 2.2.1**: Create Dashboard console

---

## 2025-12-16 | Sprint 2: Foundation Layout + EngagementBridge

### Session Start
- **Branch**: `goofy-lumiere`
- **Git Status**: Modified (Sprint 1 changes uncommitted)
- **Objective**: Create Foundation layout shell and port EngagementBridge console

### Work Completed

#### Story 2.1.1-2.1.4: Foundation Layout Components
Created the Foundation layout system per FOUNDATION_UI.md specs:

- **HUDHeader** (`src/foundation/layout/HUDHeader.tsx`)
  - 48px height, obsidian-raised background
  - Logo, breadcrumb from route, status indicator, version
  - Route-aware breadcrumb display

- **NavSidebar** (`src/foundation/layout/NavSidebar.tsx`)
  - 56px collapsed / 200px expanded
  - Lucide React icons for all consoles
  - Active route highlighting with cyan accent
  - Expand/collapse toggle
  - "Exit to Surface" link at bottom

- **GridViewport** (`src/foundation/layout/GridViewport.tsx`)
  - Cyan grid overlay (40px cells)
  - Foundation scrollbar styling
  - Flexible content container

- **FoundationLayout** (`src/foundation/layout/FoundationLayout.tsx`)
  - Composes header, sidebar, viewport
  - Dashboard placeholder for `/foundation` root
  - Outlet for nested console routes

#### Story 2.2.1-2.2.3: Foundation Base Components
Created reusable Foundation-styled components:

- **DataPanel** (`src/foundation/components/DataPanel.tsx`)
  - Panel with title, optional icon, actions slot
  - Hover glow effect per spec

- **GlowButton** (`src/foundation/components/GlowButton.tsx`)
  - Variants: primary, secondary, danger, ghost
  - Sizes: sm, md, lg
  - Icon support left/right
  - Loading and disabled states

- **MetricCard** (`src/foundation/components/MetricCard.tsx`)
  - Label, value, optional trend
  - Highlight mode for important metrics
  - Mono typography for values

#### Story 2.3.1: Port EngagementBridge Console
Ported EngagementConsole to Foundation styling:

- **EngagementBridge** (`src/foundation/consoles/EngagementBridge.tsx`)
  - Three tabs: Monitor, Triggers, Simulate
  - Uses DataPanel, GlowButton, MetricCard components
  - Live metrics display (exchanges, journeys, topics, minutes)
  - Reveal queue status panel
  - Event log with cyan grid styling
  - Trigger enable/disable toggles
  - Simulation buttons for testing

#### Routes Configuration
Updated `src/router/routes.tsx`:
- Nested routes under `/foundation`
- Lazy loading for consoles (code splitting)
- Console loading fallback component

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/foundation/layout/HUDHeader.tsx` | ~70 | Status header component |
| `src/foundation/layout/NavSidebar.tsx` | ~95 | Navigation sidebar |
| `src/foundation/layout/GridViewport.tsx` | ~25 | Main viewport wrapper |
| `src/foundation/layout/index.ts` | ~5 | Barrel export |
| `src/foundation/components/DataPanel.tsx` | ~40 | Panel/card component |
| `src/foundation/components/GlowButton.tsx` | ~80 | Button component |
| `src/foundation/components/MetricCard.tsx` | ~55 | Metric display |
| `src/foundation/components/index.ts` | ~5 | Barrel export |
| `src/foundation/consoles/EngagementBridge.tsx` | ~235 | Engagement console |

### Files Modified

| File | Changes |
|------|---------|
| `src/foundation/layout/FoundationLayout.tsx` | Full implementation with components |
| `src/router/routes.tsx` | Added nested routes, lazy loading |

### Build Results

```
dist/index.html                           1.08 kB │ gzip:   0.60 kB
dist/assets/index-90Jyn2x5.css           77.05 kB │ gzip:  13.18 kB
dist/assets/zap-CshCQvyP.js               0.44 kB │ gzip:   0.31 kB
dist/assets/FoundationLayout-B8V1JCM_.js  8.07 kB │ gzip:   2.33 kB
dist/assets/EngagementBridge-BEkS6qIp.js 11.48 kB │ gzip:   3.48 kB
dist/assets/index-tJecd0rx.js           897.11 kB │ gzip: 265.08 kB
✓ built in 23.76s
```

**Code Splitting**:
- FoundationLayout: 8.07 kB (separate chunk)
- EngagementBridge: 11.48 kB (separate chunk)
- Icons chunk: 0.44 kB

### Test Results

- [x] TypeScript compiles (pre-existing errors remain)
- [x] Build succeeds
- [x] Foundation layout renders at `/foundation`
- [x] HUD header displays status and breadcrumb
- [x] Sidebar navigation links work
- [x] Grid viewport displays correctly
- [x] EngagementBridge accessible at `/foundation/engagement`
- [x] Code splitting working (separate chunks)

### Backward Compatibility

- Old `components/Admin/EngagementConsole.tsx` preserved for Surface admin
- Foundation uses new `EngagementBridge` at `/foundation/engagement`
- Both can coexist during migration

### Next Steps

1. **Sprint 3, Story 3.1**: Port NarrativeArchitect console
2. **Sprint 3, Story 3.2**: Port KnowledgeVault console
3. **Sprint 3, Story 3.3**: Create RealityTuner (merged flags + hubs)
4. **Sprint 3, Story 3.4**: Port AudioStudio console

---

## 2025-12-16 | Sprint 3: Console Migration

### Session Start
- **Branch**: `goofy-lumiere`
- **Git Status**: Modified (Sprints 1-2 uncommitted)
- **Objective**: Port all 5 admin consoles to Foundation

### Work Completed

#### Story 3.1: NarrativeArchitect Console
Created Foundation-styled Narrative Engine console:
- Two-column layout (Navigation + Cards Grid/Editor)
- Metrics row: Total Cards, Active Personas, Orphaned Cards, Entry Points
- View toggle: Library / Personas
- Card search functionality
- Card quick-edit panel
- Save to Production button

**File**: `src/foundation/consoles/NarrativeArchitect.tsx` (~350 lines)

#### Story 3.2: KnowledgeVault Console
Created Foundation-styled RAG management console:
- Upload area with drag/drop styling
- Active documents list with delete
- Combined context preview panel
- Metrics: Documents, Total Characters, Est. Tokens

**File**: `src/foundation/consoles/KnowledgeVault.tsx` (~200 lines)

#### Story 3.3: RealityTuner Console (Merged)
Per ADR-006, merged FeatureFlags + TopicHubs into single console:
- Three tabs: Feature Flags, Topic Routing, Settings
- Feature flag toggles with status indicators
- Topic hub list with create/edit/delete
- Query match tester
- Nudge configuration settings

**File**: `src/foundation/consoles/RealityTuner.tsx` (~450 lines)

#### Story 3.4: AudioStudio Console
Created Foundation-styled TTS generation console:
- Track creator with voice selection
- Script input with generation button
- Placement management
- Track library with metadata

**File**: `src/foundation/consoles/AudioStudio.tsx` (~250 lines)

#### Story 3.5: Route Wiring
Updated `src/router/routes.tsx`:
- All 5 consoles lazy loaded
- Proper Suspense fallbacks
- Nested routes under `/foundation`

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/foundation/consoles/NarrativeArchitect.tsx` | ~350 | Narrative Engine v2 |
| `src/foundation/consoles/KnowledgeVault.tsx` | ~200 | RAG management |
| `src/foundation/consoles/RealityTuner.tsx` | ~450 | Flags + Hubs + Settings |
| `src/foundation/consoles/AudioStudio.tsx` | ~250 | TTS generation |

### Build Results

```
dist/assets/FoundationLayout-*.js    7.10 kB │ gzip:  2.15 kB
dist/assets/NarrativeArchitect-*.js 10.15 kB │ gzip:  3.30 kB
dist/assets/EngagementBridge-*.js    6.41 kB │ gzip:  2.30 kB
dist/assets/KnowledgeVault-*.js      5.18 kB │ gzip:  2.08 kB
dist/assets/RealityTuner-*.js       14.38 kB │ gzip:  4.10 kB
dist/assets/AudioStudio-*.js         7.46 kB │ gzip:  2.42 kB
dist/assets/MetricCard-*.js          3.49 kB │ gzip:  1.32 kB
dist/assets/index-*.js             897.84 kB │ gzip: 265.37 kB
✓ built in 24.18s
```

**Code Splitting**: All consoles in separate chunks, loaded on-demand.

### Routes

| Route | Console | Status |
|-------|---------|--------|
| `/foundation` | Dashboard | Working |
| `/foundation/narrative` | NarrativeArchitect | Working |
| `/foundation/engagement` | EngagementBridge | Working |
| `/foundation/knowledge` | KnowledgeVault | Working |
| `/foundation/tuner` | RealityTuner | Working |
| `/foundation/audio` | AudioStudio | Working |

### Test Results

- [x] TypeScript compiles
- [x] Build succeeds
- [x] All 5 consoles created
- [x] All routes accessible
- [x] Code splitting working
- [x] Foundation styling applied

### Console Feature Summary

| Console | Key Features |
|---------|--------------|
| NarrativeArchitect | Cards, personas, search, quick-edit |
| EngagementBridge | Metrics, event log, triggers, simulate |
| KnowledgeVault | Upload, documents, context preview |
| RealityTuner | Flags toggle, hub editor, settings |
| AudioStudio | Voice select, script, generate, library |

### Next Steps

1. **Sprint 4, Story 4.1**: Extract Core schema
2. **Sprint 4, Story 4.2**: Extract Core engine
3. **Sprint 4, Story 4.3**: Update imports with path aliases
4. **Sprint 4, Story 4.4**: Remove shims and cleanup

---

## 2025-12-16 | Sprint 4: Core Extraction

### Session Start
- **Branch**: `goofy-lumiere`
- **Git Status**: Modified (Sprints 1-3 uncommitted)
- **Objective**: Extract Core module with types, engines, and config

### Work Completed

#### Story 4.1: Create Core Directory Structure
Created the `src/core/` module with three subdirectories per ARCHITECTURE.md:

**Schema (`src/core/schema/`)**:
- `base.ts` - SectionId, ChatMessage, TerminalState, ArchitectureNode, NarrativeNode, AudioManifest
- `narrative.ts` - Persona, Card, GlobalSettings, TopicHub, FeatureFlag, TerminalSession
- `engagement.ts` - EngagementState, Events, Triggers, Reveals, Bus API types
- `lens.ts` - CustomLens, Archetype, UserInputs, WizardState, ConversionPath
- `index.ts` - Barrel export for all schema types

**Engine (`src/core/engine/`)**:
- `triggerEvaluator.ts` - Pure trigger condition evaluation logic
- `topicRouter.ts` - Query-to-hub routing logic
- `index.ts` - Barrel export for engine modules

**Config (`src/core/config/`)**:
- `defaults.ts` - All DEFAULT_* values (engagement state, reveal state, triggers, topic hubs, feature flags)
- `index.ts` - Barrel export for config

**Root**:
- `src/core/index.ts` - Main barrel export combining schema, engine, config

#### Story 4.2: Configure TypeScript Path Aliases
Updated `tsconfig.json` and `vite.config.ts` with path aliases:
- `@core` → `./src/core`
- `@surface` → `./src/surface`
- `@foundation` → `./src/foundation`

#### Story 4.3: Create Backward Compatibility Shims
Per ADR-008, created shims at original locations for backward compatibility:
- `types.ts` → Re-exports from `@core/schema`
- `types/engagement.ts` → Re-exports engagement types + defaults
- `types/lens.ts` → Re-exports lens types + defaults
- `utils/engagementTriggers.ts` → Re-exports engine + config
- `utils/topicRouter.ts` → Re-exports engine

Existing imports continue to work without modification.

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/schema/base.ts` | ~80 | Base types (SectionId, ChatMessage, etc.) |
| `src/core/schema/narrative.ts` | ~180 | Narrative v2 types |
| `src/core/schema/engagement.ts` | ~160 | Engagement bus types |
| `src/core/schema/lens.ts` | ~230 | Custom lens types |
| `src/core/schema/index.ts` | ~70 | Schema barrel export |
| `src/core/engine/triggerEvaluator.ts` | ~150 | Trigger evaluation |
| `src/core/engine/topicRouter.ts` | ~120 | Topic routing |
| `src/core/engine/index.ts` | ~20 | Engine barrel export |
| `src/core/config/defaults.ts` | ~300 | All defaults |
| `src/core/config/index.ts` | ~30 | Config barrel export |
| `src/core/index.ts` | ~10 | Main Core export |

### Files Modified (Shims)

| File | Changes |
|------|---------|
| `types.ts` | Re-export from `@core/schema` |
| `types/engagement.ts` | Re-export from `@core/schema` + config |
| `types/lens.ts` | Re-export from `@core/schema` + config |
| `utils/engagementTriggers.ts` | Re-export from `@core/engine` + config |
| `utils/topicRouter.ts` | Re-export from `@core/engine` |
| `tsconfig.json` | Added path aliases |
| `vite.config.ts` | Added resolve aliases |

### Build Results

```
dist/index.html                           1.08 kB │ gzip:   0.60 kB
dist/assets/index-*.css                  80.12 kB │ gzip:  13.52 kB
dist/assets/KnowledgeVault-*.js           5.18 kB │ gzip:   2.08 kB
dist/assets/EngagementBridge-*.js         6.41 kB │ gzip:   2.30 kB
dist/assets/FoundationLayout-*.js         7.10 kB │ gzip:   2.15 kB
dist/assets/AudioStudio-*.js              7.46 kB │ gzip:   2.42 kB
dist/assets/NarrativeArchitect-*.js      10.15 kB │ gzip:   3.30 kB
dist/assets/RealityTuner-*.js            14.37 kB │ gzip:   4.10 kB
dist/assets/index-*.js                  898.02 kB │ gzip: 265.41 kB
✓ built in 22.15s
```

### Test Results

- [x] TypeScript compiles
- [x] Build succeeds
- [x] Core module created with zero React dependencies
- [x] All shims work (existing imports unaffected)
- [x] Path aliases configured

### Core Module Validation

The `src/core/` module:
- Has NO React imports ✓
- Has NO DOM APIs ✓
- Contains only pure TypeScript types and functions ✓
- Can be imported from anywhere ✓

### Architecture Achieved

```
src/core/
├── schema/                 # Type definitions only
│   ├── base.ts            # Foundation types
│   ├── narrative.ts       # Narrative Engine v2
│   ├── engagement.ts      # Engagement Bus
│   ├── lens.ts            # Custom Lens
│   └── index.ts           # Barrel export
├── engine/                 # Pure logic functions
│   ├── triggerEvaluator.ts
│   ├── topicRouter.ts
│   └── index.ts
├── config/                 # Constants and defaults
│   ├── defaults.ts
│   └── index.ts
└── index.ts               # Main export
```

### Remaining Work

Sprint 4 is structurally complete. Optional cleanup tasks:
1. Update remaining imports to use `@core` directly (optional, shims work)
2. Delete old type/util files (wait until stable)
3. Add more engines to `src/core/engine/` (threadGenerator, etc.)

---

*Sprint 4 Complete. Core module extracted with backward compatibility.*

## 2025-12-18 23:27:59Z
- Reviewed V2.1 migration open items and current V2.0 dependencies to scope audit deliverables. Sources: docs/V21_MIGRATION_OPEN_ITEMS.md, hooks/useNarrativeEngine.ts, components/Terminal.tsx.
- Planned documentation updates (REPO_AUDIT, SPEC, ARCHITECTURE, MIGRATION_MAP, DECISIONS, SPRINTS) to align with V2.1 journey graph plan.

---

## 2025-12-27 | Tech Debt Cleanup v1 - Session 1

### Objective
Execute safe deletions of deprecated code identified during codebase audit.

### Work Completed

#### Task 1: Delete GardenModal.tsx
**Context**: GardenModal was deprecated in favor of `src/widget/views/GardenView.tsx`. The `/garden` command now switches to garden mode instead of opening a modal.

**Files Modified**:
| File | Changes |
|------|---------|
| `components/Terminal.tsx` | Removed import, modal state, rendering, handlers |
| `components/Terminal/TerminalFlow.tsx` | Removed import, props, handlers, rendering |
| `components/Terminal/overlay-registry.ts` | Removed import and 'garden' registry entry |
| `components/Terminal/types.ts` | Removed 'garden' from TerminalOverlay, ModalStates, TerminalFlowProps |
| `components/Terminal/Modals/index.ts` | Removed GardenModal export |
| `components/Terminal/index.ts` | Removed GardenModal from barrel export |
| `hooks/useSproutStats.ts` | Updated JSDoc comment |

**File Deleted**:
- `components/Terminal/Modals/GardenModal.tsx` (178 lines)

#### Task 2: Remove Legacy Route Aliases
**Context**: Legacy route patterns (`explore.nodes`, `explore.journeys`, `explore.lenses`) were superseded by namespaced versions (`explore.groveProject.*`).

**File Modified**:
- `src/workspace/ContentRouter.tsx` - Removed 4 lines of legacy route mappings

### Verification
- ✅ Build passes (no TypeScript errors)
- ✅ All 227 tests pass
- ✅ No broken imports

### Metrics
- **Files Changed**: 9
- **Lines Added**: 8
- **Lines Deleted**: 226
- **Net Reduction**: ~218 lines of deprecated code

### Commit
```
595dee2 chore: remove deprecated GardenModal and legacy route aliases
```

### Next Sessions (Not in Scope)
- Session 2: TerminalFlowState migration
- Session 3: Legacy thread methods cleanup
- Session 4: Cognitive Bridge decision + NarrativeEngineContext extraction

---

## 2025-12-28 | Kinetic Experience v1 - Complete

### Objective
Create a new exploration surface at `/explore` implementing the Kinetic Stream vision as a fresh implementation independent from Terminal components.

### Work Completed

#### Epic 1: Foundation & Route
- Created `src/surface/components/KineticStream/` directory structure
- Implemented `ExploreShell.tsx` - Main container with header, stream area, command console
- Implemented `useKineticStream.ts` hook - Stream state management with chat API integration
- Created `ExplorePage.tsx` route handler
- Added `/explore` route to `src/router/routes.tsx`

#### Epic 2: Stream Rendering
- **Motion System**: `variants.ts` with block, stagger, and reduced-motion variants
- **GlassContainer**: Blur/glass effect wrapper with intensity and variant props
- **KineticRenderer**: Polymorphic renderer using discriminated union pattern
- **Block Components**:
  - `QueryObject.tsx` - User query display with pivot indicator
  - `ResponseObject.tsx` - AI response with glass styling, concepts, and navigation forks
  - `NavigationObject.tsx` - Fork button groups (deep_dive, pivot, apply, challenge)
  - `SystemObject.tsx` - System message display
- **CommandConsole**: Floating input at bottom with loading state

#### Epic 3: Active Rhetoric
- `ConceptSpan.tsx` - Clickable concept highlight with keyboard support
- `RhetoricRenderer.tsx` - Content renderer that injects concept spans at parsed positions

#### Typography Unification
- Switched all Kinetic Stream components to Inter (`font-sans`) at 13px
- Updated global typography to deprecate EB Garamond
- Set `body`, `h1-h6`, and `p` to use Inter globally
- Updated CSS tokens for kinetic-fork, kinetic-concept, kinetic-console

### Files Created (18 TypeScript files)
| File | Purpose |
|------|---------|
| `src/surface/pages/ExplorePage.tsx` | Route handler |
| `src/surface/components/KineticStream/index.ts` | Main exports |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Container shell |
| `src/surface/components/KineticStream/hooks/useKineticStream.ts` | Stream state |
| `src/surface/components/KineticStream/hooks/index.ts` | Hook exports |
| `src/surface/components/KineticStream/Stream/KineticRenderer.tsx` | Polymorphic renderer |
| `src/surface/components/KineticStream/Stream/index.ts` | Stream exports |
| `src/surface/components/KineticStream/Stream/motion/variants.ts` | Framer Motion variants |
| `src/surface/components/KineticStream/Stream/motion/GlassContainer.tsx` | Glass wrapper |
| `src/surface/components/KineticStream/Stream/motion/index.ts` | Motion exports |
| `src/surface/components/KineticStream/Stream/blocks/QueryObject.tsx` | User query |
| `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx` | AI response |
| `src/surface/components/KineticStream/Stream/blocks/NavigationObject.tsx` | Fork buttons |
| `src/surface/components/KineticStream/Stream/blocks/SystemObject.tsx` | System messages |
| `src/surface/components/KineticStream/Stream/blocks/index.ts` | Block exports |
| `src/surface/components/KineticStream/ActiveRhetoric/ConceptSpan.tsx` | Concept highlight |
| `src/surface/components/KineticStream/ActiveRhetoric/RhetoricRenderer.tsx` | Span injector |
| `src/surface/components/KineticStream/ActiveRhetoric/index.ts` | Rhetoric exports |
| `src/surface/components/KineticStream/CommandConsole/index.tsx` | Input console |

### Files Modified
| File | Changes |
|------|---------|
| `src/router/routes.tsx` | Added `/explore` route with lazy loading |
| `styles/globals.css` | Added kinetic tokens, switched global typography to Inter |

### Verification
- ✅ No Terminal imports in KineticStream (`grep` returns empty)
- ✅ TypeScript check passes for KineticStream files
- ✅ Build succeeds (`ExplorePage-Bo4gXori.js` - 9.67 kB)
- ✅ Route `/explore` accessible and functional
- ✅ Chat flow works end-to-end with streaming

### Architecture Highlights
- **Zero Terminal Dependencies**: Complete isolation from `components/Terminal/`
- **Reuses Core**: `@core/schema/stream`, `@core/transformers/*`
- **Discriminated Unions**: Type-safe StreamItem handling
- **Glass Design System**: Consistent with Quantum Glass tokens
- **Accessibility**: Keyboard support on concept spans

### Typography Decision
Deprecated EB Garamond globally in favor of Inter for consistency:
- Body text: Inter 13px
- Headings: Inter with -0.02em letter-spacing
- Fork buttons: Inter 13px (0.8125rem)
- Console input: Inter 14px (0.875rem)

---

## 2025-12-28 | Lens Offer v1 - Complete

### Objective
Add inline lens recommendation cards to the Kinetic Stream at `/explore`, allowing the LLM to suggest perspective changes during conversation.

### Work Completed

#### Epic 1: Schema & Parser
- Extended `src/core/schema/stream.ts` with:
  - `LensOfferStatus` type (`'pending' | 'accepted' | 'dismissed'`)
  - `LensOfferStreamItem` interface
  - `isLensOfferItem` type guard
  - Updated `StreamItemType` and `StreamItem` unions
- Created `src/core/transformers/LensOfferParser.ts`:
  - Parses `<lens_offer id="..." name="..." reason="..." preview="..." />` tags
  - Returns `ParsedLensOffer` with offer and cleaned content
- Exported from `src/core/transformers/index.ts`

#### Epic 2: Component & Renderer
- Created `LensOfferObject.tsx` component:
  - Glass card with lens badge, name, reason, preview text
  - Accept/dismiss button actions
  - Accepted state shows checkmark confirmation, then fades out
  - Dismissed state hides immediately
- Added to `blocks/index.ts` exports
- Wired into `KineticRenderer.tsx`:
  - Added `lens_offer` case to switch statement
  - Added `onLensAccept` and `onLensDismiss` props

#### Epic 3: Hook & Shell Integration
- Extended `useKineticStream.ts`:
  - Added `activeLensId` state tracking
  - Chained `parseLensOffer` into parsing pipeline
  - Added `acceptLensOffer` handler that:
    - Marks offer as accepted
    - Sets active lens
    - Re-submits last query with new lens (600ms delay for UI feedback)
  - Added `dismissLensOffer` handler
  - Passes `personaTone` option to chatService for lens context
- Wired handlers in `ExploreShell.tsx`

#### Documentation
- Created `docs/prompts/lens-offer-instruction.md`:
  - System prompt language for LLM to output lens offers
  - Syntax reference and available lens IDs
  - When to offer / when not to offer guidelines
  - Formatting rules

### Files Created
| File | Purpose |
|------|---------|
| `src/core/transformers/LensOfferParser.ts` | Parse `<lens_offer>` tags from LLM output |
| `src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx` | Lens suggestion card component |
| `docs/prompts/lens-offer-instruction.md` | LLM system prompt instructions |

### Files Modified
| File | Changes |
|------|---------|
| `src/core/schema/stream.ts` | Added LensOfferStatus, LensOfferStreamItem, type guard |
| `src/core/transformers/index.ts` | Added LensOfferParser export |
| `src/surface/components/KineticStream/Stream/blocks/index.ts` | Added LensOfferObject export |
| `src/surface/components/KineticStream/Stream/KineticRenderer.tsx` | Added lens_offer case and props |
| `src/surface/components/KineticStream/hooks/useKineticStream.ts` | Added lens parsing, state, handlers |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Wired lens offer handlers |

### Verification
- ✅ TypeScript compiles (no errors in lens-offer files)
- ✅ Build succeeds
- ✅ Lens offer cards render correctly
- ✅ Accept shows confirmation, then re-submits query with new lens
- ✅ Dismiss hides the card
- ✅ Lens persists for subsequent queries

### Behavior Flow
1. LLM outputs `<lens_offer id="academic" name="Academic Lens" reason="..." preview="..." />`
2. Parser extracts offer, cleans content
3. `LensOfferObject` renders as interactive card
4. User clicks "Explore with Academic Lens"
5. Card shows "Switched to Academic Lens" ✓
6. After 600ms, last query re-submits with `personaTone: 'academic'`
7. All future queries use academic lens until changed

---

## 2025-12-28 | Kinetic Scroll v1 - Complete

### Objective
Implement "Sticky-Release" scroll physics for the Kinetic Stream to prevent jitter during LLM streaming while giving users control to review history.

### The Problem
Streaming text pushes content down. Without scroll management:
- User loses reading position
- Auto-scroll on every token causes "jitter"
- No way to review history while AI is talking

### The Solution: Sticky-Release Model
1. **Magnet** - User at bottom (within 50px) stays locked to bottom
2. **Release** - Scroll up past threshold breaks the lock
3. **Re-engage** - Scroll to bottom, click FAB, or submit new query

### Work Completed

#### useKineticScroll Hook
- Created `src/surface/components/KineticStream/hooks/useKineticScroll.ts`
- Tracks scroll position relative to 50px bottom threshold
- Uses `useLayoutEffect` for flicker-free auto-scroll during streaming
- Returns `scrollRef`, `bottomRef`, `isAtBottom`, `showScrollButton`, `scrollToBottom`

#### ScrollAnchor Component
- Created `src/surface/components/KineticStream/Stream/ScrollAnchor.tsx`
- Invisible 1px element at stream end for reliable `scrollIntoView`

#### ScrollToBottomFab Component
- Created `src/surface/components/KineticStream/CommandConsole/ScrollToBottomFab.tsx`
- Floating action button with ArrowDown icon
- Pulsing green dot indicator when streaming is active
- Animated entrance/exit with Framer Motion

#### Integration
- Updated `KineticRenderer` with optional `bottomRef` prop and `ScrollAnchor`
- Updated `CommandConsole` with FAB props (`showScrollButton`, `onScrollToBottom`, `isStreaming`)
- Updated `ExploreShell` with full scroll integration:
  - `scrollRef` on main container
  - `bottomRef` passed to renderer
  - Instant scroll on new query submission
  - Smooth scroll on FAB click

### Files Created
| File | Purpose |
|------|---------|
| `src/surface/components/KineticStream/hooks/useKineticScroll.ts` | Sticky-release scroll physics hook |
| `src/surface/components/KineticStream/Stream/ScrollAnchor.tsx` | Invisible scroll target |
| `src/surface/components/KineticStream/CommandConsole/ScrollToBottomFab.tsx` | Floating scroll button |

### Files Modified
| File | Changes |
|------|---------|
| `src/surface/components/KineticStream/hooks/index.ts` | Added useKineticScroll export |
| `src/surface/components/KineticStream/Stream/KineticRenderer.tsx` | Added bottomRef prop and ScrollAnchor |
| `src/surface/components/KineticStream/CommandConsole/index.tsx` | Added FAB integration |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Full scroll integration |

### Verification
- ✅ TypeScript compiles (no errors in scroll files)
- ✅ Build succeeds (ExplorePage: 17.32 kB)
- ✅ Auto-scroll during streaming without jitter
- ✅ User can scroll up to break lock
- ✅ FAB appears with pulsing indicator during streaming
- ✅ FAB click smooth-scrolls to bottom
- ✅ New query submission instant-scrolls to bottom
