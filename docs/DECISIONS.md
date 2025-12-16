# Architecture Decision Records (ADR)

> Key decisions for Surface vs. Substrate / Foundation Console
> Version 1.0 | 2025-12-16

---

## ADR-001: React Router Installation

### Status
**APPROVED** (per project instructions)

### Context
The codebase currently has no router. Navigation is handled via:
1. Query parameter detection (`?admin=true`) for admin mode (`App.tsx:24-29`)
2. Conditional rendering based on `isAdmin` state (`App.tsx:336-338`)
3. Section-based scrolling via Intersection Observer (`App.tsx:43-62`)

This pattern has limitations:
- No proper URL paths for admin routes
- Can't deep link to specific admin consoles
- Browser back/forward doesn't work intuitively
- SEO concerns (though less relevant for admin)

### Decision
Install `react-router-dom` v7.x and implement route-based navigation.

**Routes**:
- `/` - Surface (home page)
- `/#section-id` - Surface section anchors
- `/foundation` - Foundation dashboard
- `/foundation/narrative` - Narrative Architect
- `/foundation/engagement` - Engagement Bridge
- `/foundation/knowledge` - Knowledge Vault
- `/foundation/tuner` - Reality Tuner
- `/foundation/audio` - Audio Studio

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **React Router** | Industry standard, mature, good DX | Adds dependency |
| TanStack Router | Type-safe, modern | Less mature ecosystem |
| Next.js App Router | Full framework features | Major rewrite required |
| Keep query params | No new deps | Poor UX, no deep linking |

### Consequences
- **Positive**: Clean URLs, deep linking, browser nav works
- **Positive**: Clear separation of Surface/Foundation experiences
- **Negative**: Need to handle `?admin=true` redirect for backward compat
- **Negative**: Small bundle size increase (~15KB gzipped)

### Implementation Notes
- Create redirect from `?admin=true` to `/foundation` for existing users
- Preserve section anchor scrolling for Surface
- Use lazy loading for Foundation routes (code split)

---

## ADR-002: Tailwind CDN to npm Migration

### Status
**APPROVED** (per project instructions)

### Context
Tailwind CSS is currently loaded via CDN (`index.html:7`):
```html
<script src="https://cdn.tailwindcss.com"></script>
```

With inline config (`index.html:11-48`). This has limitations:
- No tree-shaking (full Tailwind CSS shipped)
- Limited customization capabilities
- Can't use `@apply` in CSS files
- No IntelliSense in IDE without config file
- Production builds include unused CSS

### Decision
Migrate to npm-based Tailwind with PostCSS:
- Install `tailwindcss`, `postcss`, `autoprefixer`
- Create `tailwind.config.ts` with full theme
- Create `postcss.config.js`
- Add `@tailwind` directives to CSS entry point

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **npm Tailwind** | Full features, tree-shaking, IDE support | Setup complexity |
| Keep CDN | Zero setup, works now | No tree-shaking, limited customization |
| UnoCSS | Faster, atomic CSS | Different syntax, migration effort |
| CSS Modules | Scoped by default | Lose utility-first benefits |

### Consequences
- **Positive**: Smaller production bundle (tree-shaking)
- **Positive**: Full customization for Foundation theme
- **Positive**: IDE IntelliSense support
- **Positive**: Can use `@apply` for complex styles
- **Negative**: More config files to maintain
- **Negative**: Migration risk (must preserve all existing styles)

### Implementation Notes
1. Extract current colors/fonts from `index.html:11-48` to `tailwind.config.ts`
2. Move custom CSS (grain, cursor-blink) to dedicated file
3. Test visual regression before/after
4. Keep `bg-grain` and `content-z` custom classes

---

## ADR-003: Core Module Extraction Strategy

### Status
**APPROVED**

### Context
Business logic is currently mixed with React:
- `useEngagementBus.ts` contains both singleton class and React hooks
- Types scattered across `types.ts`, `types/`, `data/narratives-schema.ts`
- Utils contain pure logic mixed with UI concerns

Goal: Create a pure TypeScript `core/` module that:
- Has zero React dependencies
- Contains all shared schema/types
- Implements engines as pure functions or singleton classes
- Can be tested without React

### Decision
Extract Core module with structure:
```
src/core/
├── schema/     # Type definitions only
├── engine/     # Pure logic (event bus, trigger evaluator)
└── config/     # Constants and defaults
```

**Extraction Rules**:
1. `core/` has NO React imports
2. `core/` has NO DOM/browser APIs
3. `core/` exports types and pure functions only
4. React hooks wrap `core/` for component consumption

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Separate core module** | Clear boundaries, testable | More files, indirection |
| Keep mixed | Less refactoring | Tangled dependencies |
| Monorepo packages | Maximum isolation | Overkill for this project |

### Consequences
- **Positive**: Engine logic is testable without React
- **Positive**: Clear dependency direction (core → hooks → components)
- **Positive**: Foundation and Surface share types without coupling
- **Negative**: More files to navigate
- **Negative**: Need to maintain barrel exports

### Implementation Notes
- Extract `EngagementBusSingleton` class (lines 48-373 of `useEngagementBus.ts`)
- Keep React hooks in `hooks/useEngagementBus.ts`, importing from core
- Add shims at old locations during migration

---

## ADR-004: Foundation Layout Architecture

### Status
**APPROVED**

### Context
The Foundation admin experience needs a distinct visual identity:
- Current admin: Light gray, minimal structure (`App.tsx:206`: `bg-gray-50`)
- Target: Dark "holodeck/HUD" aesthetic with dense information display

Need to decide on layout architecture for Foundation.

### Decision
Implement a fixed layout with three zones:
1. **HUD Header** (48px): Status, breadcrumb, version
2. **Nav Sidebar** (56px/200px): Icon-based navigation
3. **Grid Viewport** (remaining): Console content with grid overlay

Use nested `<Outlet />` for console content.

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Fixed HUD layout** | Consistent nav, clear structure | Less flexible |
| Full-page consoles | More screen real estate | No persistent nav |
| Tab-based (current) | Familiar pattern | Doesn't feel "holodeck" |
| Floating panels | Flexible arrangement | Complex state management |

### Consequences
- **Positive**: Consistent navigation across all consoles
- **Positive**: Clear visual hierarchy
- **Positive**: Grid overlay creates "control room" feel
- **Negative**: Fixed header/sidebar consume screen space
- **Negative**: Need responsive handling for smaller screens

### Implementation Notes
- Header and sidebar are always visible
- Sidebar collapses to icon-only on tablet
- Show "desktop required" message on mobile
- Use CSS Grid for layout structure

---

## ADR-005: Console Naming Convention

### Status
**APPROVED**

### Context
Current admin component names are functional but not evocative:
- `NarrativeConsole`
- `EngagementConsole`
- `AdminRAGConsole`
- `FeatureFlagPanel`
- `TopicHubPanel`
- `AdminAudioConsole`

Foundation should have names that reinforce the "control plane" metaphor.

### Decision
Rename consoles to evocative names that suggest power/control:

| Old Name | New Name | Rationale |
|----------|----------|-----------|
| NarrativeConsole | **NarrativeArchitect** | "Architect" = design/build |
| EngagementConsole | **EngagementBridge** | "Bridge" = ship's command center |
| AdminRAGConsole | **KnowledgeVault** | "Vault" = secure storage |
| FeatureFlags + TopicHubs | **RealityTuner** | "Tuner" = adjust reality |
| AdminAudioConsole | **AudioStudio** | "Studio" = production facility |

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Evocative names** | Memorable, fits theme | Learning curve |
| Keep functional names | Clear purpose | Boring, doesn't fit holodeck |
| Abstract code names | Cool factor | Confusing |

### Consequences
- **Positive**: Reinforces Foundation as "control plane"
- **Positive**: More memorable for operators
- **Negative**: Need to update documentation
- **Negative**: Small learning curve for existing admins

### Implementation Notes
- Create re-export shims at old names during migration
- Add deprecation warnings in development
- Update all documentation

---

## ADR-006: Feature Flag + Topic Hub Consolidation

### Status
**APPROVED**

### Context
Currently separate panels:
- `FeatureFlagPanel`: Toggle feature flags
- `TopicHubPanel`: Configure query routing

Both are "tuning" operations that adjust system behavior. Keeping them separate:
- Creates more nav items
- Doesn't leverage their conceptual similarity

### Decision
Merge into single **RealityTuner** console with tabs:
- **Flags** tab: Feature flag toggles
- **Routing** tab: Topic hub configuration
- **Settings** tab: Global settings (nudge behavior, etc.)

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Merged console** | Fewer nav items, conceptual unity | More complex single component |
| Keep separate | Simple components | More nav items |
| Full settings page | Everything in one place | Too much for one page |

### Consequences
- **Positive**: Cleaner navigation (5 items instead of 6)
- **Positive**: Related controls grouped together
- **Negative**: More complex component
- **Negative**: Need to implement tab interface

### Implementation Notes
- Use internal tabs within RealityTuner
- Each tab can be a child component
- Preserve existing component logic, just reorganize

---

## ADR-007: State Persistence Strategy

### Status
**APPROVED** (no change from current)

### Context
Current state persistence uses localStorage:
- `grove-engagement-state`: Engagement metrics
- `grove-event-history`: Event log
- `grove-terminal-lens`: Active lens
- `grove-terminal-session`: Session state
- `grove-custom-lenses`: Custom lenses (encrypted)

Should this change with the migration?

### Decision
**Keep current localStorage strategy unchanged.**

Rationale:
1. Works well for current scale
2. User data stays on device (privacy)
3. No server-side session management needed
4. Custom lens encryption provides security

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Keep localStorage** | Works, no migration needed | Limited to device |
| Server-side sessions | Cross-device, analytics | Privacy concerns, complexity |
| IndexedDB | More storage, structured | Migration effort |

### Consequences
- **Positive**: No migration of user data
- **Positive**: Privacy preserved
- **Negative**: Data doesn't sync across devices
- **Negative**: Lost if user clears browser data

### Implementation Notes
- Ensure all localStorage keys documented
- Consider adding export/import feature in future
- Monitor storage size (100 events cap helps)

---

## ADR-008: Shim Strategy for Migration

### Status
**APPROVED**

### Context
Moving files requires updating imports across the codebase. This is risky:
- Many files reference moved modules
- Typos in paths cause runtime errors
- Hard to review large import-update PRs

### Decision
Use **shim files** during migration:
1. Create new file at target location
2. Create re-export shim at old location
3. Add deprecation warning in development
4. Update imports incrementally
5. Remove shims after all imports updated

### Shim Template
```typescript
// OLD_PATH.ts (SHIM)
// @deprecated Import from 'NEW_PATH' instead
export * from 'NEW_PATH';

if (process.env.NODE_ENV === 'development') {
  console.warn(`Importing from ${__filename} is deprecated.`);
}
```

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Shim-based migration** | Safe, incremental | Extra files temporarily |
| Big-bang rename | Faster | Risky, hard to review |
| Auto-codemods | Automated | May miss edge cases |

### Consequences
- **Positive**: Zero breaking changes during migration
- **Positive**: Can verify each move works before proceeding
- **Positive**: Easy to rollback individual moves
- **Negative**: Temporary file duplication
- **Negative**: Need to track and remove shims

### Implementation Notes
- Create tracking list of all shims
- Remove shims in dedicated cleanup sprint
- Run typecheck after each move to verify

---

## ADR-009: No Theme Toggle (Fixed Themes)

### Status
**APPROVED**

### Context
Should Surface and Foundation have theme toggles (light/dark)?

### Decision
**No theme toggle.** Each experience has a fixed theme:
- Surface: Light (paper/ink)
- Foundation: Dark (obsidian/holo)

Rationale:
1. Themes are core to each experience's identity
2. Less complexity (no toggle state to manage)
3. Surface's "paper" aesthetic only works light
4. Foundation's "holodeck" aesthetic only works dark

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Fixed themes** | Strong identity, simpler | No user preference |
| Both dark/light | User choice | Design complexity |
| System preference | Automatic | May not fit aesthetic |

### Consequences
- **Positive**: Simpler implementation
- **Positive**: Consistent visual identity
- **Negative**: Can't accommodate user preference
- **Negative**: Foundation may be hard to use in bright environments

### Implementation Notes
- No `prefers-color-scheme` media queries
- Each experience sets its own background
- Document that Foundation is designed for dark rooms

---

## ADR-010: TypeScript Path Aliases

### Status
**APPROVED**

### Context
With new directory structure, imports could get verbose:
```typescript
import { SectionId } from '../../../core/schema/sections';
```

### Decision
Use TypeScript path aliases:
```typescript
import { SectionId } from '@core/schema';
```

**Aliases**:
- `@/*` → `./src/*`
- `@core/*` → `./src/core/*`
- `@surface/*` → `./src/surface/*`
- `@foundation/*` → `./src/foundation/*`
- `@hooks/*` → `./src/hooks/*`
- `@services/*` → `./src/services/*`

### Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Path aliases** | Clean imports, easy refactoring | Need to configure in multiple places |
| Relative imports | No config | Verbose, fragile |
| Barrel exports only | Some simplification | Still verbose for deep imports |

### Consequences
- **Positive**: Clean, readable imports
- **Positive**: Easy to move files (update alias, not all imports)
- **Negative**: Need to configure in tsconfig AND vite.config
- **Negative**: Some tooling may not understand aliases

### Implementation Notes
- Configure in `tsconfig.json` (for TypeScript)
- Configure in `vite.config.ts` (for Vite bundler)
- Ensure IDE recognizes aliases (usually auto-detects from tsconfig)

---

## Decision Log Summary

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Install react-router-dom | Approved |
| 002 | Migrate Tailwind to npm | Approved |
| 003 | Extract Core module | Approved |
| 004 | Fixed HUD layout for Foundation | Approved |
| 005 | Evocative console names | Approved |
| 006 | Merge flags + hubs into RealityTuner | Approved |
| 007 | Keep localStorage persistence | Approved |
| 008 | Use shims during migration | Approved |
| 009 | Fixed themes (no toggle) | Approved |
| 010 | TypeScript path aliases | Approved |

---

*Decisions Document Complete. See SPRINTS.md for implementation plan.*
