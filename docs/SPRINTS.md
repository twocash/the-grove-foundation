# Sprint Plan

> Surface vs. Substrate / Foundation Console Implementation
> Version 1.0 | 2025-12-16

---

## Sprint Overview

| Sprint | Focus | Duration Estimate |
|--------|-------|-------------------|
| **Sprint 1** | Routing + Tailwind Migration | Foundation setup |
| **Sprint 2** | Foundation Layout + Basic Consoles | Layout & scaffolding |
| **Sprint 3** | Console Migration | Port all admin panels |
| **Sprint 4** | Core Extraction + Cleanup | Refactor & shim removal |

---

## Sprint 1: Routing + Tailwind Migration

### Goal
Establish the infrastructure for dual experiences (Surface + Foundation) without breaking existing functionality.

### Epic 1.1: React Router Installation

#### Story 1.1.1: Install and Configure React Router
**As a** developer
**I want** React Router installed and configured
**So that** we can implement proper route-based navigation

**Acceptance Criteria**:
- [ ] `react-router-dom` v7.x added to `package.json`
- [ ] Basic router configuration created
- [ ] `/` route renders existing Surface content
- [ ] `/foundation` route renders placeholder
- [ ] TypeScript compiles without errors

**Tasks**:
1. Run `npm install react-router-dom`
2. Create `src/router/routes.ts` with route definitions
3. Create `src/router/index.tsx` with router setup
4. Update `App.tsx` to use `RouterProvider`
5. Verify Surface renders at `/`

**Test Commands**:
```bash
npm run dev        # Start dev server
# Visit http://localhost:3000 - should see Surface
# Visit http://localhost:3000/foundation - should see placeholder
```

#### Story 1.1.2: Implement Legacy Redirect
**As a** user who bookmarked `?admin=true`
**I want** to be redirected to `/foundation`
**So that** my existing workflow isn't broken

**Acceptance Criteria**:
- [ ] `?admin=true` query param redirects to `/foundation`
- [ ] Redirect happens immediately (no flash)
- [ ] Query param is removed after redirect

**Tasks**:
1. Add route loader to check for `admin` query param
2. If found, redirect to `/foundation`
3. Test with `http://localhost:3000?admin=true`

#### Story 1.1.3: Surface Section Anchors
**As a** user
**I want** section anchors to work (`/#economics`)
**So that** I can deep link to specific sections

**Acceptance Criteria**:
- [ ] Hash-based routing works for sections
- [ ] Intersection Observer still updates activeSection
- [ ] Internal scroll buttons still work

**Tasks**:
1. Verify hash routing behavior with React Router
2. Test all section anchors
3. Verify `scrollIntoView` still works

---

### Epic 1.2: Tailwind npm Migration

#### Story 1.2.1: Install Tailwind and PostCSS
**As a** developer
**I want** Tailwind installed via npm
**So that** we can customize themes and enable tree-shaking

**Acceptance Criteria**:
- [ ] `tailwindcss`, `postcss`, `autoprefixer` installed
- [ ] `tailwind.config.ts` created with current theme
- [ ] `postcss.config.js` created
- [ ] CSS entry point created with `@tailwind` directives
- [ ] Build succeeds

**Tasks**:
1. Run `npm install -D tailwindcss postcss autoprefixer`
2. Create `tailwind.config.ts` (extract from `index.html:11-48`)
3. Create `postcss.config.js`
4. Create `styles/tailwind.css` with directives
5. Import CSS in `index.tsx`

#### Story 1.2.2: Remove CDN Script
**As a** developer
**I want** the CDN Tailwind script removed
**So that** we use only the npm version

**Acceptance Criteria**:
- [ ] CDN script tag removed from `index.html`
- [ ] Inline config script removed from `index.html`
- [ ] All existing styles still work
- [ ] No visual regressions

**Tasks**:
1. Remove `<script src="https://cdn.tailwindcss.com">` from `index.html`
2. Remove inline `tailwind.config` script
3. Move custom CSS (grain, cursor-blink) to separate file
4. Visual regression test (screenshot comparison)

**Test Commands**:
```bash
npm run build      # Build production
npm run preview    # Preview production build
# Visually compare to before screenshots
```

#### Story 1.2.3: Add Foundation Theme Tokens
**As a** designer
**I want** Foundation design tokens in Tailwind config
**So that** we can style Foundation components

**Acceptance Criteria**:
- [ ] Obsidian color palette added (`obsidian-DEFAULT`, etc.)
- [ ] Holo accent colors added (`holo-cyan`, etc.)
- [ ] Grid/border tokens added
- [ ] Config is well-organized with comments

**Tasks**:
1. Add `obsidian` color scale to config
2. Add `holo` color scale to config
3. Add `grid` tokens to config
4. Add CSS variables for Foundation (see FOUNDATION_UI.md)
5. Verify colors render correctly

---

### Sprint 1 Definition of Done

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes
- [ ] `/` renders Surface (visual parity)
- [ ] `/foundation` renders placeholder
- [ ] `?admin=true` redirects to `/foundation`
- [ ] No Tailwind CDN in production bundle
- [ ] Foundation color tokens available

---

## Sprint 2: Foundation Layout + Basic Consoles

### Goal
Create the Foundation layout shell and port the first console to validate the pattern.

### Epic 2.1: Foundation Layout Components

#### Story 2.1.1: Create FoundationLayout
**As a** developer
**I want** a Foundation layout wrapper
**So that** all Foundation pages have consistent structure

**Acceptance Criteria**:
- [ ] `FoundationLayout.tsx` created with HUD header, sidebar, viewport
- [ ] Dark obsidian background applied
- [ ] Grid overlay visible in viewport
- [ ] Layout is responsive (collapses sidebar on smaller screens)
- [ ] `<Outlet />` renders child routes

**Tasks**:
1. Create `src/foundation/layout/FoundationLayout.tsx`
2. Implement CSS Grid structure
3. Add obsidian background colors
4. Add grid overlay CSS
5. Test with placeholder content

#### Story 2.1.2: Create HUD Header
**As an** operator
**I want** a status header
**So that** I can see system health at a glance

**Acceptance Criteria**:
- [ ] Header shows logo, breadcrumb, status, version
- [ ] Breadcrumb updates based on current route
- [ ] Status indicator pulses (healthy state)
- [ ] Version displays from package.json or env

**Tasks**:
1. Create `src/foundation/layout/HUDHeader.tsx`
2. Implement breadcrumb from route path
3. Add pulsing status indicator
4. Style per FOUNDATION_UI.md specs

#### Story 2.1.3: Create Navigation Sidebar
**As an** operator
**I want** a navigation sidebar
**So that** I can switch between consoles

**Acceptance Criteria**:
- [ ] Sidebar shows icons for all consoles
- [ ] Active route highlighted
- [ ] Sidebar can expand/collapse
- [ ] Icons use Lucide React
- [ ] Exit to Surface link at bottom

**Tasks**:
1. Create `src/foundation/layout/NavSidebar.tsx`
2. Define nav items with icons and routes
3. Implement expand/collapse toggle
4. Add active state styling
5. Link to `/` for "Exit to Surface"

#### Story 2.1.4: Create GridViewport
**As an** operator
**I want** the main content area with grid overlay
**So that** content has the "holodeck" feel

**Acceptance Criteria**:
- [ ] Grid lines visible (40px cells)
- [ ] Content scrolls within viewport
- [ ] Padding applied per spec

**Tasks**:
1. Create `src/foundation/layout/GridViewport.tsx`
2. Apply grid CSS background
3. Handle scroll behavior
4. Test with various content heights

---

### Epic 2.2: Foundation Base Components

#### Story 2.2.1: Create DataPanel Component
**As a** developer
**I want** a reusable panel component
**So that** consoles have consistent card styling

**Acceptance Criteria**:
- [ ] Panel has title, optional icon, optional actions
- [ ] Hover state with glow effect
- [ ] Proper padding and borders

**Tasks**:
1. Create `src/foundation/components/DataPanel.tsx`
2. Implement props interface
3. Add hover glow animation
4. Export from index

#### Story 2.2.2: Create GlowButton Component
**As a** developer
**I want** a Foundation-styled button
**So that** actions have consistent appearance

**Acceptance Criteria**:
- [ ] Supports variants: primary, secondary, danger, ghost
- [ ] Supports sizes: sm, md, lg
- [ ] Supports icon left/right
- [ ] Has loading and disabled states

**Tasks**:
1. Create `src/foundation/components/GlowButton.tsx`
2. Implement all variants
3. Add hover/active animations
4. Test all combinations

#### Story 2.2.3: Create MetricCard Component
**As a** developer
**I want** a metric display component
**So that** stats are consistently formatted

**Acceptance Criteria**:
- [ ] Shows label, value, optional trend
- [ ] Highlight mode for important metrics
- [ ] Proper typography (mono for values)

**Tasks**:
1. Create `src/foundation/components/MetricCard.tsx`
2. Style per FOUNDATION_UI.md
3. Add trend indicator styling

---

### Epic 2.3: First Console Port (Proof of Concept)

#### Story 2.3.1: Port EngagementConsole to EngagementBridge
**As an** operator
**I want** the Engagement Console in Foundation
**So that** I can monitor engagement in the new UI

**Acceptance Criteria**:
- [ ] Engagement state visible
- [ ] Event log displays
- [ ] Trigger list shows
- [ ] All existing functionality works
- [ ] Uses Foundation components (DataPanel, etc.)

**Tasks**:
1. Create `src/foundation/consoles/EngagementBridge.tsx`
2. Copy logic from `components/Admin/EngagementConsole.tsx`
3. Replace styling with Foundation classes
4. Use DataPanel for sections
5. Test all features

#### Story 2.3.2: Create Shim for EngagementConsole
**As a** developer
**I want** backward compatibility during migration
**So that** imports don't break

**Acceptance Criteria**:
- [ ] Old import path still works
- [ ] Deprecation warning in development
- [ ] Re-exports from new location

**Tasks**:
1. Update `components/Admin/EngagementConsole.tsx` to re-export
2. Add deprecation warning
3. Verify old imports work

---

### Sprint 2 Definition of Done

- [ ] Foundation layout renders at `/foundation`
- [ ] HUD header shows status and breadcrumb
- [ ] Sidebar navigation works
- [ ] Grid viewport displays correctly
- [ ] EngagementBridge console is functional
- [ ] All existing features work (no regressions)
- [ ] TypeScript compiles without errors
- [ ] Build succeeds

---

## Sprint 3: Console Migration

### Goal
Port all remaining admin consoles to Foundation with proper naming.

### Epic 3.1: Narrative Architect

#### Story 3.1.1: Port NarrativeConsole
**As an** operator
**I want** the Narrative console in Foundation
**So that** I can manage personas and cards

**Acceptance Criteria**:
- [ ] 3-column layout preserved
- [ ] Persona selection works
- [ ] Card editing works
- [ ] Save to production works
- [ ] Uses Foundation styling

**Tasks**:
1. Create `src/foundation/consoles/NarrativeArchitect.tsx`
2. Port from `components/Admin/NarrativeConsole.tsx`
3. Port related: `CardEditor.tsx`, `PersonaSettings.tsx`, `GlobalSettingsModal.tsx`
4. Restyle with Foundation classes
5. Test full workflow

#### Story 3.1.2: Port Graph Visualization
**As an** operator
**I want** the narrative graph visualization
**So that** I can see card relationships

**Acceptance Criteria**:
- [ ] Graph renders in Foundation style
- [ ] Node selection works
- [ ] Connection lines visible

**Tasks**:
1. Port `NarrativeGraphView.tsx`
2. Port `NarrativeNodeCard.tsx`
3. Restyle with Foundation colors

---

### Epic 3.2: Knowledge Vault

#### Story 3.2.1: Port AdminRAGConsole
**As an** operator
**I want** the RAG console in Foundation
**So that** I can manage knowledge base

**Acceptance Criteria**:
- [ ] File list displays
- [ ] Upload works
- [ ] Delete works
- [ ] Context preview works

**Tasks**:
1. Create `src/foundation/consoles/KnowledgeVault.tsx`
2. Port from `components/AdminRAGConsole.tsx`
3. Restyle with Foundation classes
4. Test all operations

---

### Epic 3.3: Reality Tuner (Merged Console)

#### Story 3.3.1: Create RealityTuner with Tabs
**As an** operator
**I want** flags and hubs in one console
**So that** related controls are together

**Acceptance Criteria**:
- [ ] Tab interface for Flags/Routing/Settings
- [ ] Feature flags tab works
- [ ] Topic hubs tab works
- [ ] Global settings tab works
- [ ] Save to production works

**Tasks**:
1. Create `src/foundation/consoles/RealityTuner.tsx`
2. Create internal tab component
3. Port FeatureFlagPanel as tab content
4. Port TopicHubPanel as tab content
5. Add global settings tab
6. Test all save operations

---

### Epic 3.4: Audio Studio

#### Story 3.4.1: Port AdminAudioConsole
**As an** operator
**I want** the Audio console in Foundation
**So that** I can manage TTS

**Acceptance Criteria**:
- [ ] Track list displays
- [ ] Generation works
- [ ] Playback works
- [ ] Manifest save works

**Tasks**:
1. Create `src/foundation/consoles/AudioStudio.tsx`
2. Port from `components/AdminAudioConsole.tsx`
3. Restyle with Foundation classes
4. Test generation and playback

---

### Epic 3.5: Shims and Routes

#### Story 3.5.1: Create All Console Shims
**As a** developer
**I want** shims for all moved consoles
**So that** nothing breaks during migration

**Acceptance Criteria**:
- [ ] All old import paths work
- [ ] Deprecation warnings show
- [ ] TypeScript types correct

**Tasks**:
1. Create shims for each moved console
2. Add to barrel export
3. Test old imports

#### Story 3.5.2: Wire Up All Foundation Routes
**As an** operator
**I want** routes to all consoles
**So that** I can navigate directly

**Acceptance Criteria**:
- [ ] `/foundation/narrative` works
- [ ] `/foundation/engagement` works
- [ ] `/foundation/knowledge` works
- [ ] `/foundation/tuner` works
- [ ] `/foundation/audio` works
- [ ] Default redirect to `/foundation/narrative`

**Tasks**:
1. Add all routes to router config
2. Update sidebar links
3. Test navigation

---

### Sprint 3 Definition of Done

- [ ] All 5 consoles functional in Foundation
- [ ] All API calls work (no regressions)
- [ ] localStorage persistence works
- [ ] All routes accessible
- [ ] Shims in place for backward compatibility
- [ ] TypeScript compiles without errors
- [ ] Build succeeds

---

## Sprint 4: Core Extraction + Cleanup

### Goal
Extract Core module, update all imports, remove shims.

### Epic 4.1: Core Module Extraction

#### Story 4.1.1: Create Core Schema
**As a** developer
**I want** all types in `core/schema`
**So that** types have a single source of truth

**Acceptance Criteria**:
- [ ] `src/core/schema/` created
- [ ] All types moved with shims at old locations
- [ ] Barrel export working
- [ ] TypeScript compiles

**Tasks**:
1. Create `src/core/schema/` structure
2. Move types from `types.ts`, `types/`, `data/narratives-schema.ts`
3. Create shims at old locations
4. Update barrel exports

#### Story 4.1.2: Create Core Engine
**As a** developer
**I want** engine logic in `core/engine`
**So that** logic is separate from React

**Acceptance Criteria**:
- [ ] `src/core/engine/` created
- [ ] EngagementBusSingleton extracted (no React)
- [ ] Trigger evaluator extracted
- [ ] React hooks updated to import from core

**Tasks**:
1. Create `src/core/engine/` structure
2. Extract singleton from `useEngagementBus.ts`
3. Extract evaluator from `engagementTriggers.ts`
4. Update hooks to use core

#### Story 4.1.3: Create Core Config
**As a** developer
**I want** config in `core/config`
**So that** defaults are centralized

**Acceptance Criteria**:
- [ ] `src/core/config/` created
- [ ] DEFAULT_* values moved
- [ ] PERSONA_COLORS moved
- [ ] Constants moved

**Tasks**:
1. Create `src/core/config/` structure
2. Move defaults from various files
3. Update imports

---

### Epic 4.2: Import Updates

#### Story 4.2.1: Update Surface Imports
**As a** developer
**I want** Surface to use path aliases
**So that** imports are clean

**Acceptance Criteria**:
- [ ] All Surface components use `@core/*`, `@hooks/*`, `@services/*`
- [ ] No relative `../..` paths to core/hooks/services
- [ ] TypeScript compiles

**Tasks**:
1. Update imports in all Surface components
2. Verify no broken imports
3. Run typecheck

#### Story 4.2.2: Update Foundation Imports
**As a** developer
**I want** Foundation to use path aliases
**So that** imports are clean

**Acceptance Criteria**:
- [ ] All Foundation components use `@core/*`, `@hooks/*`, `@services/*`
- [ ] No imports from `@surface/*`
- [ ] TypeScript compiles

**Tasks**:
1. Update imports in all Foundation components
2. Verify no cross-imports Surface ↔ Foundation
3. Run typecheck

---

### Epic 4.3: Cleanup

#### Story 4.3.1: Remove Deprecation Warnings
**As a** developer
**I want** shims to stop warning
**So that** console is clean

**Acceptance Criteria**:
- [ ] All imports updated to new paths
- [ ] Shims no longer used
- [ ] No deprecation warnings in dev

**Tasks**:
1. Search for old import paths
2. Update any remaining
3. Verify no warnings

#### Story 4.3.2: Delete Shim Files
**As a** developer
**I want** shims removed
**So that** codebase is clean

**Acceptance Criteria**:
- [ ] All shim files deleted
- [ ] Old directories cleaned up
- [ ] `src/types.ts` deleted (duplicate)
- [ ] Build still works

**Tasks**:
1. Delete shim files (see MIGRATION_MAP.md)
2. Delete empty directories
3. Run full build
4. Test application

#### Story 4.3.3: Delete Deprecated Code
**As a** developer
**I want** deprecated code removed
**So that** codebase is clean

**Acceptance Criteria**:
- [ ] `useRevealState.ts` deleted
- [ ] `AdminNarrativeConsole.tsx` (legacy v1) deleted
- [ ] No unused files remain

**Tasks**:
1. Delete deprecated files
2. Search for any remaining usages
3. Update documentation

---

### Epic 4.4: Documentation Update

#### Story 4.4.1: Update CLAUDE.md
**As a** developer
**I want** documentation updated
**So that** it reflects new structure

**Acceptance Criteria**:
- [ ] Architecture diagram updated
- [ ] File references updated
- [ ] Commands still accurate

**Tasks**:
1. Update architecture section
2. Update key files table
3. Verify commands work

#### Story 4.4.2: Clean Up Migration Docs
**As a** developer
**I want** migration docs archived
**So that** they don't clutter active docs

**Acceptance Criteria**:
- [ ] MIGRATION_MAP.md marked as complete
- [ ] DEVLOG.md has final entry
- [ ] Active docs are current

**Tasks**:
1. Add completion notes to migration docs
2. Final DEVLOG entry
3. Review all docs for accuracy

---

### Sprint 4 Definition of Done

- [ ] `src/core/` contains all shared types and logic
- [ ] No React in `core/` (verified by import search)
- [ ] Surface uses `@core/*` imports
- [ ] Foundation uses `@core/*` imports
- [ ] No Surface ↔ Foundation imports
- [ ] All shims removed
- [ ] All deprecated code removed
- [ ] Documentation updated
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes
- [ ] All features work (full regression test)

---

## Test Commands

### Throughout All Sprints

```bash
# TypeScript check
npx tsc --noEmit

# Development server
npm run dev

# Production build
npm run build

# Preview production
npm run preview

# Start backend (in separate terminal)
node server.js
```

### Verification Checklist

After each sprint:
1. [ ] Visit `/` - Surface loads correctly
2. [ ] Visit `/foundation` - Foundation loads correctly
3. [ ] Navigate all Foundation consoles
4. [ ] Test one full workflow per console
5. [ ] Check browser console for errors
6. [ ] Check network tab for failed requests
7. [ ] Verify localStorage data persists

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Visual regression | Screenshot before/after, visual diff |
| Import breakage | Shim files, incremental updates |
| localStorage migration | Don't change keys, test persistence |
| Large file refactors | Commit frequently, small PRs |
| Build failures | Run build after each story |

---

## Commit Prefixes

Use these prefixes for commit messages:

- `routing:` Router installation and configuration
- `build:` Tailwind, PostCSS, Vite config changes
- `foundation:` Foundation layout and components
- `surface:` Surface component changes
- `core:` Core module extraction
- `docs:` Documentation updates
- `cleanup:` Shim removal, deprecated code deletion

---

*Sprint Plan Complete. Begin with Sprint 1, Story 1.1.1.*
