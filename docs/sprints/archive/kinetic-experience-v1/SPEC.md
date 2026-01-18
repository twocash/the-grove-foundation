# Kinetic Experience v1: Vision, Strategy, and Specification

**Sprint:** kinetic-experience-v1
**Date:** December 28, 2025
**Status:** Planning
**Sprint Owner:** Jim Calhoun

---

## Executive Summary

This sprint creates a **completely new exploration surface** that implements the Kinetic Stream vision without modifying Terminal. The key architectural decision: **hard boundary, not incremental migration**.

**The Problem:** Previous sprints enhanced Terminal components, which caused bug fixes to pull development back into the legacy experience. The gravitational pull of 1,866 lines of monolithic code is too strong to escape incrementally.

**The Solution:** Create `src/surface/components/KineticStream/` as a new component tree with its own route. Terminal remains frozen. The new experience shares only core schema and transformers, not UI components.

**The Goal:** A functional exploration surface at `/explore` that demonstrates the Kinetic Stream vision: objects not messages, discovery over delivery, serendipity by design.

---

## Protected Scope

**The Genesis page right-rail Terminal is NOT touched by this sprint.**

| Component | Location | Status |
|-----------|----------|--------|
| Genesis marketing Terminal | `components/Terminal/` | ✅ Protected, unchanged |
| `/terminal` route | `pages/TerminalPage.tsx` | ✅ Protected, unchanged |
| New `/explore` route | `surface/components/KineticStream/` | 🆕 This sprint |

The Terminal component continues to power the Genesis marketing page. This sprint creates a parallel system that can evolve independently. Future sprints may migrate traffic from `/terminal` to `/explore` once parity is achieved.

---

## Structural Barriers (Context Window Gravity Prevention)

Verbal instructions alone won't prevent AI drift back to Terminal patterns. This sprint implements **structural barriers**:

### 1. The Firewall Files

Three files in `src/surface/components/KineticStream/` enforce the boundary:

| File | Purpose |
|------|---------|
| `README.md` | Clean room declaration visible in every directory listing |
| `types.ts` | Type facade that re-exports ONLY StreamItem types (no ChatMessage) |
| `.eslintrc.js` | Lint rule that fails build on Terminal imports |

### 2. Route-First Development

The `/explore` route is created as a blank canvas ("Hello Kinetic") BEFORE any components exist. This breaks the mental link to Terminal layouts.

### 3. No TerminalLayout

ExploreShell uses a plain `div` container, not `TerminalLayout`. This prevents inheritance of Terminal's chrome and dependencies.

### 4. Type Firewall

All type imports come from `./types.ts`, which explicitly excludes legacy types like `ChatMessage`. This prevents legacy type contamination.

---

## Part I: Architectural Decision

### The Hard Boundary Strategy

```
SHARED (src/core/)                    NEW (src/surface/components/KineticStream/)
├── schema/stream.ts      ────────→   ├── ExploreShell.tsx
├── schema/journey.ts     ────────→   ├── Stream/
├── transformers/                     │   ├── KineticRenderer.tsx
│   ├── NavigationParser.ts  ─────→   │   ├── blocks/
│   └── RhetoricalParser.ts  ─────→   │   │   ├── QueryBlock.tsx
├── engagement/machine.ts    ─────→   │   │   ├── ResponseBlock.tsx
└── engagement/hooks.ts      ─────→   │   │   └── NavigationBlock.tsx
                                      │   └── motion/
FROZEN (components/Terminal/)         │       └── GlassPanel.tsx
├── Terminal.tsx (1866 lines)         ├── CommandConsole/
├── TerminalChat.tsx                  │   └── index.tsx
├── Stream/                           └── LensPeek/
│   ├── StreamRenderer.tsx  ✗         └── index.tsx
│   └── blocks/             ✗
│       └── *.tsx           ✗         ROUTE
└── ...                               pages/ExplorePage.tsx → /explore
```

### Rules of Engagement

| Rule | Description |
|------|-------------|
| **No Terminal Imports** | KineticStream components MUST NOT import from `components/Terminal/` |
| **Core Only** | May import from `src/core/schema/`, `src/core/transformers/`, `src/core/engagement/` |
| **Fresh Implementations** | Even if Terminal has a working ResponseBlock, build a new one |
| **Terminal Frozen** | No modifications to Terminal except critical production bugs |
| **Separate Route** | `/explore` hosts the new experience; `/terminal` remains unchanged |

### Why Not Incremental Migration?

The previous sprint (`kinetic-stream-reset-v2`) attempted to enhance Terminal's Stream components. Result:

1. Every bug fix modified Terminal files
2. Claude Code naturally gravitated to existing code paths
3. The "new" experience became indistinguishable from the old
4. Terminal's architectural debt infected new work

The strangler fig pattern requires a hard perimeter. Inside the perimeter: new clean code. Outside: legacy frozen in amber.

---

## Part II: Pattern Check (Phase 0)

### Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Stream rendering | StreamItem schema | Reuse types from `src/core/schema/stream.ts` |
| Lens-reactive content | Quantum Interface | New components honor lens via existing hooks |
| State management | Engagement Machine | Extend with new events; machine lives in `src/core/` |
| Fork generation | NavigationParser | Reuse parser; new UI in KineticStream |
| Glass effects | CSS tokens | Reuse tokens from `styles/globals.css` |

### New Patterns Proposed

#### Proposed: Kinetic Object Pattern

**Why existing patterns are insufficient:**
Terminal's `ResponseBlock` mixes presentation with data transformation. The Kinetic experience requires clean separation:

- **StreamItem** = pure data (exists)
- **KineticObject** = presentation layer wrapping StreamItem with interaction handlers (NEW)

**DEX compliance:**
- Declarative Sovereignty: Fork labels from LLM, types from schema
- Capability Agnosticism: Works with any response format
- Provenance: Each object tracks source response ID
- Organic Scalability: Add new object types via schema extension

---

## Part III: Canonical Source Audit (Phase 0.5)

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|-------------------|----------------|------------------|----------------|
| StreamItem types | `src/core/schema/stream.ts` | Correct | Use as-is |
| Navigation parsing | `src/core/transformers/NavigationParser.ts` | Correct | Use as-is |
| Rhetoric parsing | `src/core/transformers/RhetoricalParser.ts` | Correct | Use as-is |
| Engagement machine | `src/core/engagement/machine.ts` | Correct | Extend with events |
| Glass CSS tokens | `styles/globals.css` | Correct | Use as-is |
| ResponseBlock | `components/Terminal/Stream/blocks/ResponseBlock.tsx` | DUPLICATION | **CREATE** new in KineticStream |
| NavigationBlock | `components/Terminal/Stream/blocks/NavigationBlock.tsx` | DUPLICATION | **CREATE** new in KineticStream |
| GlassPanel | `components/Terminal/Stream/motion/GlassPanel.tsx` | DUPLICATION | **CREATE** new in KineticStream |

**Decision:** Terminal components are *implementations*, not *canonical sources*. The canonical sources are the schemas and transformers in `src/core/`. UI components are implementations of those sources. KineticStream creates new implementations.

---

## Part IV: Technical Architecture

### Directory Structure

```
src/surface/
├── components/
│   ├── KineticStream/              # NEW - The exploration surface
│   │   ├── ExploreShell.tsx        # Main container (replaces Terminal.tsx)
│   │   ├── Stream/
│   │   │   ├── KineticRenderer.tsx # Routes StreamItems to blocks
│   │   │   ├── blocks/
│   │   │   │   ├── QueryObject.tsx     # User input (minimal)
│   │   │   │   ├── ResponseObject.tsx  # AI response (the heart)
│   │   │   │   ├── NavigationObject.tsx # Fork display
│   │   │   │   └── SystemObject.tsx    # Status messages
│   │   │   └── motion/
│   │   │       ├── GlassContainer.tsx  # Glass wrapper
│   │   │       └── variants.ts         # Framer variants
│   │   ├── ActiveRhetoric/
│   │   │   ├── ConceptSpan.tsx     # Orange highlight
│   │   │   └── LensPeek.tsx        # Hover card
│   │   ├── CommandConsole/
│   │   │   ├── index.tsx           # The floating input
│   │   │   └── CommandMode.tsx     # / command handling
│   │   └── hooks/
│   │       ├── useKineticStream.ts # Stream state management
│   │       └── useCommandConsole.ts # Input handling
│   └── genesis/                    # Existing genesis components
├── pages/
│   ├── ExplorePage.tsx             # NEW - hosts KineticStream
│   ├── GenesisPage.tsx
│   └── SurfacePage.tsx
└── hooks/
    └── useQuantumInterface.ts      # Existing, reused
```

### Component Contracts

#### ExploreShell

```typescript
interface ExploreShellProps {
  initialLens?: string;
  initialJourney?: string;
}
```

Responsibilities:
- Provide engagement machine context
- Manage stream state
- Coordinate between Stream and CommandConsole
- Handle lens/journey context

Does NOT:
- Render individual messages (delegates to KineticRenderer)
- Handle overlays (future sprint)
- Manage welcomes/reveals (future sprint)

#### KineticRenderer

```typescript
interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onConceptClick: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect: (fork: JourneyFork) => void;
}
```

Responsibilities:
- Route StreamItem types to appropriate Object components
- Handle animation presence
- Propagate interaction callbacks

#### ResponseObject

```typescript
interface ResponseObjectProps {
  item: ResponseStreamItem;
  onConceptClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
}
```

Responsibilities:
- Render glass container
- Render markdown content
- Render concept spans (orange highlights)
- Render navigation forks (inline at bottom)
- Handle streaming state gracefully

---

## Part V: Visual System

### Glass Tokens (Reused from globals.css)

```css
--glass-solid: rgba(17, 24, 39, 0.95);
--glass-surface: rgba(30, 41, 59, 0.85);
--glass-elevated: rgba(51, 65, 85, 0.9);
--glass-border: rgba(148, 163, 184, 0.15);
--glass-text-primary: rgba(248, 250, 252, 1);
--glass-text-body: rgba(203, 213, 225, 1);
```

### New Fork Button Styles (To Add)

```css
/* Navigation Fork Buttons */
.kinetic-fork {
  @apply px-4 py-2 rounded-full text-sm font-medium;
  @apply transition-all duration-200;
  @apply hover:scale-105 active:scale-95;
}

.kinetic-fork--primary {
  background: var(--clay-gradient);
  color: white;
  box-shadow: var(--glow-clay);
}

.kinetic-fork--secondary {
  background: var(--glass-surface);
  border: 1px solid var(--glass-border);
  color: var(--glass-text-body);
}

.kinetic-fork--tertiary {
  background: transparent;
  color: var(--glass-text-subtle);
}
```

### Concept Span Styles (To Add)

```css
.kinetic-concept {
  color: var(--grove-clay);
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: all 0.15s ease;
}

.kinetic-concept:hover {
  border-bottom-color: var(--grove-clay);
  text-shadow: 0 0 8px rgba(217, 119, 6, 0.3);
}
```

---

## Part VI: Scope Definition

### In Scope (This Sprint)

| Feature | Priority | Notes |
|---------|----------|-------|
| Route `/explore` | P0 | New page hosting KineticStream |
| ExploreShell container | P0 | Minimal orchestrator |
| KineticRenderer | P0 | Routes StreamItems to blocks |
| ResponseObject | P0 | Glass + markdown + streaming |
| QueryObject | P0 | User input display |
| NavigationObject | P0 | Fork buttons (inline) |
| CommandConsole | P0 | Floating input capsule |
| NavigationParser integration | P0 | Parse `<navigation>` blocks |
| RhetoricalParser integration | P1 | Parse bold concepts |
| ConceptSpan (orange highlights) | P1 | Clickable concepts |
| Pivot mechanic | P1 | Click concept → auto-query |
| Basic glass effects | P1 | CSS-only, no heavy blur |

### Out of Scope (Future Sprints)

| Feature | Reason |
|---------|--------|
| Lens picker | Requires overlay system |
| Journey picker | Requires overlay system |
| Welcome experience | Requires onboarding flow |
| Reveals system | Complex state machine |
| Cognitive Bridge | Requires journey context |
| Command palette (/ commands) | P2 feature |
| LensPeek hover cards | P2 polish |
| Session persistence | Requires backend |
| Mobile optimization | Future sprint |

---

## Part VII: Success Criteria

### MVP Definition

The sprint is complete when:

1. **Route works**: `/explore` loads without errors
2. **Chat functions**: User can submit query, receive streaming response
3. **Forks render**: Navigation blocks appear after responses (when LLM provides them)
4. **Concepts highlight**: Bold text renders as orange spans
5. **Concepts click**: Clicking a concept submits it as next query
6. **Glass looks right**: Responses have proper glass container styling
7. **No Terminal imports**: Zero imports from `components/Terminal/`

### Quality Gates

```bash
# Compiles
npm run build

# No Terminal imports (custom check)
grep -r "from.*components/Terminal" src/surface/components/KineticStream/
# Should return: empty

# Route accessible
curl -I http://localhost:5173/explore
# Should return: 200

# E2E smoke test
npx playwright test tests/e2e/explore-baseline.spec.ts
```

---

## Part VIII: Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicating Terminal patterns | Architectural debt | Hard import rule; code review |
| LLM not outputting `<navigation>` | No forks render | Fallback to generated suggestions |
| Streaming performance | Jittery text | Sentence-boundary hydration |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| CSS token mismatch | Visual inconsistency | Reuse existing tokens; no new ones |
| Engagement machine incompatibility | State errors | Keep machine changes minimal |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing features vs Terminal | User confusion | Clear "preview" labeling |
| Route conflicts | Navigation breaks | Use unique path `/explore` |

---

## Part IX: Advisory Council Perspective

### Park (Weight 10) - Technical Feasibility
> "Fresh implementation is correct. The cognitive load of understanding Terminal.tsx exceeds the effort of rebuilding the chat display. Just ensure StreamItem types remain canonical—don't fork the schema."

### Benet (Weight 10) - Distributed Systems
> "The hard boundary creates a clean migration path. When KineticStream is ready, Terminal can be deprecated without surgical extraction. Version the route, not the components."

### Adams (Weight 8) - Engagement Design
> "The exploration surface IS the product. Don't compromise on the 'objects not messages' principle just to ship faster. A mediocre kinetic experience is worse than a good chat experience."

### Short (Weight 8) - Narrative Craft
> "The fork labels are where voice lives. Ensure the system prompt generates labels that feel like Grove, not generic ChatGPT suggestions. 'Tell me more' is death; 'Trace the evolution of...' is life."

### Taylor (Weight 7) - Community Behavior
> "Watch what users actually click. The pivot mechanic creates behavioral data that Terminal never captured. Log concept clicks and fork selections from day one."

---

## Appendix: Reference Documents

- `KINETIC_STREAM_RESET_VISION_v2.md` — The experience vision
- `TERMINAL_LEGACY_ANALYSIS.md` — What we're escaping
- `PROJECT_PATTERNS.md` — Pattern catalog
- `src/core/schema/stream.ts` — StreamItem types
- `src/core/transformers/NavigationParser.ts` — Fork extraction
- `src/core/transformers/RhetoricalParser.ts` — Concept extraction

---

*Specification complete. Proceed to SPRINTS.md for epic/story breakdown.*
