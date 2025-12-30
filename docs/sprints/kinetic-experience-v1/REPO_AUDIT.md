# Kinetic Experience v1: Repository Audit

**Sprint:** kinetic-experience-v1
**Audit Date:** December 28, 2025

---

## Executive Summary

This audit identifies all codebase components relevant to the Kinetic Stream implementation. The key finding is that canonical sources exist in `src/core/` while implementations exist in `components/Terminal/`. Our hard boundary strategy means we **reuse canonical sources** and **ignore implementations**.

---

## Directory Structure Overview

```
src/
├── core/                          # ✅ CANONICAL - Reuse
│   ├── schema/
│   │   └── stream.ts              # StreamItem types, JourneyFork, RhetoricalSpan
│   ├── transformers/
│   │   ├── NavigationParser.ts    # Parses <navigation> blocks
│   │   └── RhetoricalParser.ts    # Parses bold text to spans
│   └── engagement/
│       ├── machine.ts             # XState engagement machine
│       └── hooks.ts               # useEngagement, useEngagementState
│
├── components/
│   └── Terminal/                  # ⛔ FORBIDDEN - Do not import
│       ├── Terminal.tsx           # 1,866 lines - the monolith
│       ├── Stream/
│       │   ├── StreamRenderer.tsx
│       │   ├── ResponseBlock.tsx
│       │   ├── NavigationBlock.tsx
│       │   └── GlassPanel.tsx
│       └── ...
│
├── surface/                       # ✅ TARGET - New implementation
│   ├── components/
│   │   └── KineticStream/         # NEW - Sprint target
│   └── pages/
│       ├── GenesisPage.tsx
│       └── SurfacePage.tsx
│
├── services/
│   └── chatService.ts             # ✅ REUSE - API integration
│
└── styles/
    └── globals.css                # ✅ EXTEND - Add kinetic tokens
```

---

## Canonical Sources (src/core/)

### 1. Stream Schema (`src/core/schema/stream.ts`)

**Status:** ✅ Reuse as-is

**Key Types:**
```typescript
// Base item
interface StreamItem {
  id: string;
  type: 'query' | 'response' | 'navigation' | 'system';
  timestamp: number;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdBy: 'user' | 'ai' | 'system';
}

// Query with pivot context
interface QueryStreamItem extends StreamItem {
  type: 'query';
  pivot?: PivotContext;
}

// Response with parsed data
interface ResponseStreamItem extends StreamItem {
  type: 'response';
  isGenerating: boolean;
  parsedSpans?: RhetoricalSpan[];
  navigation?: JourneyFork[];
}

// Rhetorical span (concept highlight)
interface RhetoricalSpan {
  text: string;
  startIndex: number;
  endIndex: number;
  type: 'concept' | 'term' | 'emphasis';
}

// Journey fork (navigation option)
interface JourneyFork {
  id: string;
  type: JourneyForkType;
  label: string;
  queryPayload?: string;
  targetWaypoint?: string;
}

type JourneyForkType = 'deep_dive' | 'pivot' | 'apply' | 'challenge';
```

**Helper Functions:**
```typescript
function hasSpans(item: StreamItem): item is ResponseStreamItem
function hasNavigation(item: StreamItem): item is ResponseStreamItem
```

**Usage in Kinetic Stream:**
- Import types for props interfaces
- Use helper functions for type guards
- Reference `JourneyForkType` for button styling

---

### 2. Navigation Parser (`src/core/transformers/NavigationParser.ts`)

**Status:** ✅ Reuse as-is

**API:**
```typescript
interface ParseNavigationResult {
  forks: JourneyFork[];
  cleanContent: string;
}

function parseNavigation(content: string): ParseNavigationResult
```

**Behavior:**
- Extracts `<navigation>` XML blocks from content
- Parses fork labels, types, and payloads
- Returns clean content with navigation removed
- Handles malformed XML gracefully

**Usage in Kinetic Stream:**
- Call after streaming completes
- Extract forks for NavigationObject
- Use cleanContent for display

---

### 3. Rhetorical Parser (`src/core/transformers/RhetoricalParser.ts`)

**Status:** ✅ Reuse as-is

**API:**
```typescript
interface ParseRhetoricResult {
  spans: RhetoricalSpan[];
  plainContent: string;
}

function parse(content: string): ParseRhetoricResult
```

**Behavior:**
- Identifies `**bold**` text as concepts
- Calculates start/end indices
- Preserves original content (doesn't strip markdown)

**Usage in Kinetic Stream:**
- Call after navigation parsing
- Use spans for RhetoricRenderer
- Display plainContent when no spans

---

### 4. Engagement Machine (`src/core/engagement/`)

**Status:** ✅ Reuse hooks, extend machine if needed

**Key Exports:**
```typescript
// Machine definition
const engagementMachine: StateMachine

// React hooks
function useEngagement(): EngagementContext
function useEngagementState(): EngagementState
function useEngagementSend(): (event: EngagementEvent) => void
```

**Event Types:**
```typescript
type EngagementEvent =
  | { type: 'QUERY_SUBMITTED'; query: string }
  | { type: 'RESPONSE_STARTED'; responseId: string }
  | { type: 'RESPONSE_COMPLETED'; responseId: string }
  | { type: 'CONCEPT_CLICKED'; span: RhetoricalSpan }
  | { type: 'FORK_SELECTED'; fork: JourneyFork }
  | { type: 'SESSION_ENDED' }
```

**Usage in Kinetic Stream:**
- Wrap ExploreShell in EngagementProvider (if not already global)
- Emit events on user actions
- Read state for telemetry

---

## Services (src/services/)

### Chat Service (`src/services/chatService.ts`)

**Status:** ✅ Reuse with potential extension

**API:**
```typescript
async function sendMessageStream(
  messages: Array<{ role: string; text: string }>,
  onChunk: (chunk: string) => void,
  options?: {
    signal?: AbortSignal;
    lensId?: string;
    pivotContext?: PivotContext;
  }
): Promise<void>
```

**Usage in Kinetic Stream:**
- Call from useKineticStream hook
- Pass abort signal for cancellation
- Include pivot context for follow-up queries

**Potential Extension:**
- May need to add journey context
- May need to add exploration mode flag

---

## Styles (src/styles/)

### Global CSS (`styles/globals.css`)

**Status:** ✅ Extend with kinetic tokens

**Existing Tokens Used:**
```css
/* Glass system */
--glass-void: #0a0a0f;
--glass-solid: #12121a;
--glass-surface: #1a1a24;
--glass-elevated: #22222e;
--glass-border: rgba(255, 255, 255, 0.08);
--glass-text-primary: rgba(255, 255, 255, 0.95);
--glass-text-body: rgba(255, 255, 255, 0.85);
--glass-text-subtle: rgba(255, 255, 255, 0.5);

/* Accent colors */
--neon-cyan: #06b6d4;
--neon-green: #10b981;
--grove-clay: #d97706;
--grove-terracotta: #c2410c;
```

**New Tokens to Add:**
```css
/* Kinetic-specific (see EXECUTION_PROMPT.md) */
.kinetic-fork
.kinetic-fork--primary
.kinetic-fork--secondary
.kinetic-fork--tertiary
.kinetic-fork--quaternary
.kinetic-concept
.kinetic-console
.kinetic-console-input
```

---

## Forbidden Zone (components/Terminal/)

### Why Forbidden

The Terminal directory contains **implementations** of the patterns we need, but importing them would:
1. Create coupling that prevents clean migration
2. Pull in 1,866+ lines of monolithic code
3. Contaminate new architecture with legacy patterns
4. Make incremental replacement impossible

### What Exists There (For Reference Only)

| File | Lines | Purpose | Kinetic Equivalent |
|------|-------|---------|-------------------|
| Terminal.tsx | 1,866 | Monolithic container | ExploreShell |
| Stream/StreamRenderer.tsx | ~200 | Item routing | KineticRenderer |
| Stream/ResponseBlock.tsx | ~150 | Response display | ResponseObject |
| Stream/NavigationBlock.tsx | ~100 | Fork buttons | NavigationObject |
| Stream/GlassPanel.tsx | ~80 | Glass wrapper | GlassContainer |

### Migration Path

After Kinetic Stream is stable:
1. Feature flag routes Terminal users to /explore
2. Verify feature parity
3. Archive Terminal components
4. Remove from build

---

## Router Configuration

### Current Routes (`src/router/index.tsx`)

```typescript
const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/genesis', element: <GenesisPage /> },
  { path: '/surface', element: <SurfacePage /> },
  { path: '/terminal', element: <TerminalPage /> },
  // NEW: Add this
  { path: '/explore', element: <ExplorePage /> }
];
```

### Route Strategy

- `/explore` — New Kinetic Stream (this sprint)
- `/terminal` — Legacy Terminal (frozen)
- Future: Feature flag to redirect /terminal → /explore

---

## Dependencies Check

### Required (Already Installed)

```json
{
  "framer-motion": "^10.x",
  "react": "^18.x",
  "react-dom": "^18.x",
  "xstate": "^4.x",
  "@xstate/react": "^3.x"
}
```

### Verify Installation

```bash
npm list framer-motion xstate @xstate/react
```

---

## File Creation Checklist

### New Files to Create

```
src/surface/components/KineticStream/
├── index.ts
├── ExploreShell.tsx
├── Stream/
│   ├── index.ts
│   ├── KineticRenderer.tsx
│   ├── blocks/
│   │   ├── index.ts
│   │   ├── QueryObject.tsx
│   │   ├── ResponseObject.tsx
│   │   ├── NavigationObject.tsx
│   │   └── SystemObject.tsx
│   └── motion/
│       ├── index.ts
│       ├── GlassContainer.tsx
│       └── variants.ts
├── ActiveRhetoric/
│   ├── index.ts
│   ├── ConceptSpan.tsx
│   └── RhetoricRenderer.tsx
├── CommandConsole/
│   └── index.tsx
└── hooks/
    ├── index.ts
    └── useKineticStream.ts

src/surface/pages/
└── ExplorePage.tsx
```

### Files to Modify

```
src/router/index.tsx          # Add /explore route
styles/globals.css            # Add kinetic tokens
```

### Files NOT to Touch

```
src/components/Terminal/*     # FROZEN
src/components/Terminal.tsx   # FROZEN
```

---

## Risk Assessment

### High Risk: Import Drift

**Risk:** Developer accidentally imports from Terminal.
**Mitigation:** 
- Add ESLint rule to block Terminal imports
- CI check: `grep -r "from.*components/Terminal" src/surface/`

### Medium Risk: Schema Mismatch

**Risk:** Core schema types don't match expected structure.
**Mitigation:**
- Read schema first, adapt component interfaces
- Add type guards at boundaries

### Low Risk: CSS Token Missing

**Risk:** CSS variable undefined in some contexts.
**Mitigation:**
- Use fallback values: `var(--grove-clay, #d97706)`
- Verify globals.css import chain

---

## Audit Conclusion

The codebase is ready for Kinetic Stream implementation:

1. **Canonical sources exist** in `src/core/` — reuse directly
2. **Chat service works** — integrate with streaming hook
3. **CSS tokens defined** — extend with kinetic classes
4. **Route structure clear** — add /explore alongside /terminal
5. **Hard boundary enforceable** — Terminal imports detectable

**Proceed to implementation with confidence.**

---

*Audit complete. Reference this document when uncertain about what to import.*
