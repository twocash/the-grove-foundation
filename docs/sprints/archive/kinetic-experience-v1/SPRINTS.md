# Kinetic Experience v1: Sprint Breakdown

**Sprint:** kinetic-experience-v1
**Duration:** 2 weeks (3 epics)
**Start Date:** December 28, 2025

---

## Sprint Overview

| Epic | Focus | Duration | Deliverable |
|------|-------|----------|-------------|
| Epic 1 | Foundation & Route | 3 days | `/explore` route with shell |
| Epic 2 | Stream Rendering | 4 days | Chat functionality with glass |
| Epic 3 | Active Rhetoric | 3 days | Concepts + forks + pivot |

**Total:** 10 working days

---

## Protected Scope

**The Genesis page right-rail Terminal is NOT touched by this sprint.**

The Terminal component at `components/Terminal/` powers the Genesis marketing page and will continue to work unchanged. This sprint creates a parallel system at `surface/components/KineticStream/` that can evolve independently.

---

## Epic 1: Foundation & Route

**Goal:** Establish structural barriers and the blank canvas route BEFORE any UI components.

### Story 1.0: Create the Firewall (EXECUTE FIRST)

**Task:** Establish structural barriers that prevent context window gravity from pulling back to Terminal patterns.

**Why First:** If the AI starts by building components, it will try to slot them into existing layouts. The firewall forces acknowledgment of constraints in code, not just documentation.

**Files to CREATE:**

**1. README.md (Clean Room Declaration)**
```
src/surface/components/KineticStream/README.md
```

```markdown
# KineticStream - Clean Room Implementation

⛔ **THIS DIRECTORY IS A CLEAN ROOM IMPLEMENTATION**

## Import Rules (Enforced by Lint)

**ALLOWED:**
- `./types` — Local type facade
- `@core/schema/stream` — Via types.ts only
- `@core/transformers/*` — Parsers
- `@core/engagement/*` — Machine and hooks
- `@/services/*` — API services

**FORBIDDEN:**
- `@/components/Terminal/*` — ANY import is a BUILD FAILURE
- `@/components/Terminal.tsx` — The monolith
- `TerminalLayout` — Use plain div containers
- `ChatMessage` — Use StreamItem only

**When in doubt:** `grep -r "Terminal" . — must return only this README`
```

**2. types.ts (Type Firewall)**
```
src/surface/components/KineticStream/types.ts
```

```typescript
/**
 * KineticStream Type Facade
 * 
 * Re-exports ONLY the types needed for KineticStream.
 * Acts as a firewall preventing legacy types from leaking in.
 * 
 * RULE: Import types from this file, not directly from @core
 * RULE: Never add ChatMessage or other legacy types here
 */

export type {
  StreamItem,
  QueryStreamItem,
  ResponseStreamItem,
  NavigationStreamItem,
  SystemStreamItem,
  RhetoricalSpan,
  JourneyFork,
  JourneyForkType,
  PivotContext,
} from '@core/schema/stream';

export {
  hasSpans,
  hasNavigation,
} from '@core/schema/stream';

// DO NOT ADD: ChatMessage, TerminalState, or any Terminal types
```

**3. .eslintrc.js (Import Enforcer)**
```
src/surface/components/KineticStream/.eslintrc.js
```

```javascript
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['**/components/Terminal/**', '**/components/Terminal', '**/components/Terminal.tsx'],
          message: '⛔ CLEAN ROOM VIOLATION: KineticStream cannot import from Terminal.'
        },
        {
          group: ['**/TerminalLayout*'],
          message: '⛔ CLEAN ROOM VIOLATION: Do not use TerminalLayout. Use plain div containers.'
        }
      ]
    }]
  }
};
```

**Acceptance Criteria:**
- [ ] README.md exists with clean room declaration
- [ ] types.ts exports ONLY StreamItem family types
- [ ] .eslintrc.js blocks Terminal imports
- [ ] `grep -r "Terminal" src/surface/components/KineticStream/` returns only README.md

**Tests:** None (structure only, verified by grep)

---

### Story 1.1: Create Route FIRST (Blank Canvas)

**Task:** Create the `/explore` route with a blank canvas BEFORE any components exist.

**Why First:** If the route doesn't exist, the AI will try to integrate into existing pages. Creating the blank canvas first breaks the mental link to Terminal layouts.

**Files to CREATE:**
- `src/surface/pages/ExplorePage.tsx`

**Files to MODIFY:**
- `src/router/index.tsx` (add route)

**Implementation:**

```typescript
// src/surface/pages/ExplorePage.tsx
// NOTE: This is a BLANK CANVAS. Do not import ExploreShell yet.
import React from 'react';

const ExplorePage: React.FC = () => {
  return (
    <div className="h-screen w-full bg-slate-950 flex items-center justify-center">
      <h1 className="text-2xl text-white">Hello Kinetic</h1>
    </div>
  );
};

export default ExplorePage;
```

```typescript
// src/router/index.tsx - Add this route
{
  path: '/explore',
  element: <ExplorePage />
}
```

**Acceptance Criteria:**
- [ ] Route `/explore` renders "Hello Kinetic"
- [ ] Page has dark background (bg-slate-950)
- [ ] No 404 or routing errors
- [ ] NO imports from KineticStream yet

**Verification (MUST PASS before proceeding):**
```bash
npm run dev &
curl -s http://localhost:5173/explore | grep -q "Hello Kinetic" && echo "✅ PASS" || echo "❌ FAIL"
```

**Tests:**
- E2E: `tests/e2e/explore-route.spec.ts` — route loads

---

### Story 1.2: Create Directory Structure

**Task:** Create the KineticStream component directory structure.

**Files to CREATE:**
```
src/surface/components/KineticStream/
├── README.md           (from Story 1.0)
├── types.ts            (from Story 1.0)
├── .eslintrc.js        (from Story 1.0)
├── index.ts
├── ExploreShell.tsx
├── Stream/
│   ├── index.ts
│   ├── KineticRenderer.tsx
│   ├── blocks/
│   │   └── index.ts
│   └── motion/
│       └── index.ts
├── ActiveRhetoric/
│   └── index.ts
├── CommandConsole/
│   └── index.ts
└── hooks/
    └── index.ts
```

**Acceptance Criteria:**
- [ ] All directories exist
- [ ] Index files export empty placeholders
- [ ] Firewall files from Story 1.0 are in place
- [ ] `grep -r "Terminal" .` returns only README.md

**Tests:** None (structure only)

---

### Story 1.3: Create ExploreShell Container

**Task:** Create the main orchestrator component that manages stream state.

**⚠️ CRITICAL:** ExploreShell must NOT use `TerminalLayout`. It must use a generic `div` container with `h-screen w-full bg-slate-950` to start. We will introduce the Layout system later.

**Files to CREATE:**
- `src/surface/components/KineticStream/ExploreShell.tsx`

**Implementation Notes:**
- Import types from `./types` (NOT from @core directly)
- Use plain `div` container (NOT TerminalLayout)
- Manage `StreamItem[]` state locally
- Render placeholder KineticRenderer
- Render placeholder CommandConsole

**Props Interface:**
```typescript
interface ExploreShellProps {
  initialLens?: string;
  initialJourney?: string;
}
```

**Layout Pattern (REQUIRED):**
```typescript
// ⛔ WRONG - Do not do this
import { TerminalLayout } from '@/components/layouts/TerminalLayout';
return <TerminalLayout>...</TerminalLayout>;

// ✅ CORRECT - Use plain div
return (
  <div className="h-screen w-full bg-slate-950 flex flex-col">
    <header className="flex-none p-4 border-b border-white/10">...</header>
    <main className="flex-1 overflow-y-auto">...</main>
    <CommandConsole />
  </div>
);
```

**Acceptance Criteria:**
- [ ] Component renders without errors
- [ ] Uses `./types` for type imports
- [ ] Uses plain div container (NO TerminalLayout)
- [ ] Manages `StreamItem[]` state
- [ ] No imports from `components/Terminal/`

**Tests:**
- Unit: `tests/unit/ExploreShell.test.tsx` — renders, manages state

---

### Story 1.4: Create useKineticStream Hook

**Task:** Create the hook that manages stream state and chat submission.

**Files to CREATE:**
- `src/surface/components/KineticStream/hooks/useKineticStream.ts`

**Implementation Notes:**
- Import types from `../types` (the type firewall)
- Manages `StreamItem[]` array
- Handles message submission via `chatService`
- Converts responses to StreamItem format
- Parses navigation and rhetoric on completion

**Interface:**
```typescript
interface UseKineticStreamReturn {
  items: StreamItem[];
  currentItem: StreamItem | null;
  isLoading: boolean;
  submit: (query: string, pivot?: PivotContext) => Promise<void>;
  clear: () => void;
}
```

**Acceptance Criteria:**
- [ ] Submit adds query item immediately
- [ ] Response streams into current item
- [ ] Completion triggers parsing
- [ ] Uses parsers from `@core/transformers/`
- [ ] Types imported from `../types`

**Tests:**
- Unit: `tests/unit/useKineticStream.test.ts` — submit flow, parsing

---

### Story 1.5: Wire ExploreShell to Route

**Task:** Update ExplorePage to use ExploreShell.

**Files to MODIFY:**
- `src/surface/pages/ExplorePage.tsx`

**Implementation:**
```typescript
// src/surface/pages/ExplorePage.tsx
import React from 'react';
import { ExploreShell } from '../components/KineticStream';

const ExplorePage: React.FC = () => {
  return <ExploreShell />;
};

export default ExplorePage;
```

**Acceptance Criteria:**
- [ ] Route `/explore` renders ExploreShell
- [ ] No "Hello Kinetic" placeholder visible
- [ ] Shell renders with header and command console

**Tests:**
- E2E: `tests/e2e/explore-shell.spec.ts` — shell renders

---

### Epic 1 Build Gate

```bash
# 1. Firewall check (CRITICAL)
grep -r "Terminal" src/surface/components/KineticStream/
# Expected: Only README.md

# 2. No TerminalLayout
grep -r "TerminalLayout" src/surface/components/KineticStream/
# Expected: empty

# 3. Build passes
npm run build

# 4. Route works
npm run dev &
curl -s http://localhost:5173/explore | head -20
```

---

## Epic 2: Stream Rendering

**Goal:** Implement the polymorphic renderer and object blocks with glass effects.

### Story 2.1: Create Motion Variants

**Task:** Create Framer Motion animation variants.

**Files to CREATE:**
- `src/surface/components/KineticStream/Stream/motion/variants.ts`

**Acceptance Criteria:**
- [ ] `blockVariants` for enter/exit animations
- [ ] `staggerContainer` for staggered children
- [ ] `staggerItem` for staggered items
- [ ] `reducedMotionVariants` for accessibility

**Tests:** None (pure data)

---

### Story 2.2: Create GlassContainer

**Task:** Create the glass effect wrapper component.

**Files to CREATE:**
- `src/surface/components/KineticStream/Stream/motion/GlassContainer.tsx`

**Implementation Notes:**
- CSS-only glass effect (no heavy backdrop-blur)
- Support intensity variants: `subtle`, `medium`, `elevated`
- Support semantic variants: `default`, `user`, `assistant`, `error`

**Interface:**
```typescript
interface GlassContainerProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'elevated';
  variant?: 'default' | 'user' | 'assistant' | 'error';
  className?: string;
}
```

**Acceptance Criteria:**
- [ ] Renders with proper glass background
- [ ] Supports all intensity levels
- [ ] Variant changes border/accent color
- [ ] No layout shift on hover

**Tests:**
- Visual: Playwright snapshot test

---

### Story 2.3: Create KineticRenderer

**Task:** Create the component that routes StreamItems to appropriate block components.

**Files to CREATE:**
- `src/surface/components/KineticStream/Stream/KineticRenderer.tsx`

**Implementation Notes:**
- Use `AnimatePresence` from framer-motion
- Switch on `item.type` to render appropriate block
- Pass interaction callbacks down
- Import types from `../types`

**Interface:**
```typescript
interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
}
```

**Acceptance Criteria:**
- [ ] Routes all StreamItem types correctly
- [ ] AnimatePresence handles enter/exit
- [ ] Callbacks propagate to children
- [ ] Types from `../types`

**Tests:**
- Unit: `tests/unit/KineticRenderer.test.tsx` — routing logic

---

### Story 2.4: Create QueryObject

**Task:** Create the user message display component.

**Files to CREATE:**
- `src/surface/components/KineticStream/Stream/blocks/QueryObject.tsx`

**Implementation Notes:**
- Minimal styling (user messages are secondary)
- Right-aligned or subtle treatment
- Show pivot context if present
- Import types from `../../types`

**Acceptance Criteria:**
- [ ] Renders user text
- [ ] Shows pivot indicator if `item.pivot` exists
- [ ] Visually distinct from assistant messages

**Tests:**
- Unit: Basic render test

---

### Story 2.5: Create ResponseObject

**Task:** Create the AI response display component with streaming support.

**Files to CREATE:**
- `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx`

**Implementation Notes:**
- Wrap in GlassContainer
- Render markdown when complete
- Show streaming indicator when `isGenerating`
- Render navigation forks at bottom
- Render concept spans via RhetoricRenderer

**Interface:**
```typescript
interface ResponseObjectProps {
  item: ResponseStreamItem;
  onConceptClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
}
```

**Acceptance Criteria:**
- [ ] Glass container renders correctly
- [ ] Markdown renders for complete responses
- [ ] Streaming shows character-by-character reveal
- [ ] Loading indicator shows when no content yet
- [ ] Forks render at bottom when present

**Tests:**
- Unit: Render states (loading, streaming, complete)
- E2E: Submit and see response

---

### Story 2.6: Create NavigationObject

**Task:** Create the fork button display component.

**Files to CREATE:**
- `src/surface/components/KineticStream/Stream/blocks/NavigationObject.tsx`

**Implementation Notes:**
- Group forks by type (deep_dive, pivot, apply, challenge)
- Style buttons by priority
- Trigger `onForkSelect` callback on click

**Button Hierarchy:**
| Type | Style | Icon |
|------|-------|------|
| deep_dive | Primary (amber gradient) | ↓ |
| pivot | Secondary (surface) | → |
| apply | Tertiary (ghost) | ✓ |
| challenge | Quaternary (subtle) | ? |

**Acceptance Criteria:**
- [ ] Forks grouped by type
- [ ] Correct styling per type
- [ ] Click triggers callback with fork data
- [ ] Empty state returns null

**Tests:**
- Unit: Grouping logic, click handling

---

### Story 2.7: Create SystemObject

**Task:** Create system message display.

**Files to CREATE:**
- `src/surface/components/KineticStream/Stream/blocks/SystemObject.tsx`

**Acceptance Criteria:**
- [ ] Renders centered, subtle text
- [ ] Visually distinct from user/assistant

**Tests:**
- Unit: Basic render

---

### Story 2.8: Create CommandConsole

**Task:** Create the floating input component.

**Files to CREATE:**
- `src/surface/components/KineticStream/CommandConsole/index.tsx`

**Implementation Notes:**
- Fixed position at bottom
- Glass styling for input area
- Submit on Enter
- Show loading state during generation

**Interface:**
```typescript
interface CommandConsoleProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}
```

**Acceptance Criteria:**
- [ ] Input captures text
- [ ] Enter submits (unless Shift+Enter)
- [ ] Disabled during loading
- [ ] Visual feedback on submit

**Tests:**
- Unit: Submit handling
- E2E: Type and submit

---

### Epic 2 Build Gate

```bash
# Firewall check
grep -r "Terminal" src/surface/components/KineticStream/
# Expected: Only README.md

# Build passes
npm run build

# Unit tests pass
npm test -- --grep "Kinetic"

# E2E: Basic chat flow works
npx playwright test tests/e2e/explore-chat.spec.ts
```

---

## Epic 3: Active Rhetoric

**Goal:** Implement concept highlighting and the pivot mechanic.

### Story 3.1: Create ConceptSpan Component

**Task:** Create the clickable concept highlight component.

**Files to CREATE:**
- `src/surface/components/KineticStream/ActiveRhetoric/ConceptSpan.tsx`

**Implementation Notes:**
- Wraps text in styled span
- Amber/orange color for visibility
- Click triggers callback with span data
- Keyboard accessible (role="button", tabIndex, onKeyDown)

**Interface:**
```typescript
interface ConceptSpanProps {
  span: RhetoricalSpan;
  onClick?: (span: RhetoricalSpan) => void;
}
```

**Acceptance Criteria:**
- [ ] Renders with orange styling
- [ ] Hover shows underline
- [ ] Click triggers callback
- [ ] Keyboard accessible

**Tests:**
- Unit: Click handling, keyboard handling

---

### Story 3.2: Create RhetoricRenderer

**Task:** Create the component that injects ConceptSpans into content.

**Files to CREATE:**
- `src/surface/components/KineticStream/ActiveRhetoric/RhetoricRenderer.tsx`

**Implementation Notes:**
- Takes content string and spans array
- Splits content at span boundaries
- Renders plain text and ConceptSpans
- Handles overlapping spans gracefully

**Interface:**
```typescript
interface RhetoricRendererProps {
  content: string;
  spans: RhetoricalSpan[];
  onSpanClick?: (span: RhetoricalSpan) => void;
}
```

**Acceptance Criteria:**
- [ ] Plain text renders between spans
- [ ] Spans render as ConceptSpan components
- [ ] Content order preserved
- [ ] Edge cases handled (empty spans, overlaps)

**Tests:**
- Unit: Span injection logic

---

### Story 3.3: Integrate Rhetoric into ResponseObject

**Task:** Wire RhetoricRenderer into ResponseObject.

**Files to MODIFY:**
- `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx`

**Implementation Notes:**
- When `item.parsedSpans` exists, use RhetoricRenderer
- Otherwise, use plain markdown rendering
- Pass `onConceptClick` through

**Acceptance Criteria:**
- [ ] Concepts render when spans present
- [ ] Falls back to plain markdown
- [ ] Click callback works

**Tests:**
- E2E: See orange text, click triggers action

---

### Story 3.4: Implement Pivot Mechanic

**Task:** Make concept clicks submit as new queries with pivot context.

**Files to MODIFY:**
- `src/surface/components/KineticStream/ExploreShell.tsx`

**Implementation Notes:**
- `handleConceptClick` creates PivotContext
- Submits concept text as new query
- Query item shows pivot indicator

**Flow:**
```
User clicks "epistemic capture" in response
    ↓
ExploreShell.handleConceptClick(span, sourceId)
    ↓
Create PivotContext { sourceResponseId, sourceText, sourceContext }
    ↓
useKineticStream.submit("epistemic capture", pivotContext)
    ↓
QueryItem renders with pivot indicator
```

**Acceptance Criteria:**
- [ ] Click submits concept as query
- [ ] Pivot context attached to query
- [ ] Visual indicator shows it's a pivot
- [ ] New response generates

**Tests:**
- E2E: Click concept → see new query → see response

---

### Story 3.5: Implement Fork Selection

**Task:** Make fork button clicks submit appropriate actions.

**Files to MODIFY:**
- `src/surface/components/KineticStream/ExploreShell.tsx`

**Implementation Notes:**
- `handleForkSelect` in ExploreShell
- Fork type determines action:
  - `deep_dive`: Submit `queryPayload` as query
  - `pivot`: Submit with context
  - `apply`: Submit application prompt
  - `challenge`: Submit challenge prompt

**Acceptance Criteria:**
- [ ] Fork click triggers appropriate action
- [ ] Deep dive submits query
- [ ] UI responds to selection
- [ ] Loading state during generation

**Tests:**
- E2E: Click fork → see response

---

### Epic 3 Build Gate

```bash
# Firewall check (final)
grep -r "Terminal" src/surface/components/KineticStream/
# Expected: Only README.md

grep -r "TerminalLayout" src/surface/components/KineticStream/
# Expected: empty

# All tests pass
npm run build
npm test
npx playwright test tests/e2e/explore*.spec.ts
```

---

## Final Sprint Gate

### Completion Checklist

- [ ] Firewall files exist (README.md, types.ts, .eslintrc.js)
- [ ] Route `/explore` loads without errors
- [ ] User can submit query via CommandConsole
- [ ] Response streams with glass styling
- [ ] Concepts render as orange spans (when parsed)
- [ ] Forks render at response bottom (when present)
- [ ] Concept click submits as pivot query
- [ ] Fork click submits appropriate query
- [ ] **NO imports from `components/Terminal/`**
- [ ] **NO use of `TerminalLayout`**
- [ ] All tests pass

### Verification Commands

```bash
# 1. Firewall check (CRITICAL)
grep -r "Terminal" src/surface/components/KineticStream/
# Must return: Only README.md

grep -r "TerminalLayout" src/surface/components/KineticStream/
# Must return: empty

# 2. Full build
npm run build

# 3. All tests
npm test
npx playwright test

# 4. Route check
curl -I http://localhost:5173/explore
# Must return: 200
```

### Definition of Done

The sprint is **complete** when:

1. A user can navigate to `/explore`
2. Submit a question
3. See a streaming response in a glass container
4. See orange concept highlights (if LLM includes bold text)
5. Click a concept to pivot
6. See navigation forks (if LLM includes `<navigation>` block)
7. Click a fork to continue exploration

**The experience works end-to-end without touching Terminal.**

**Genesis page Terminal continues to work unchanged.**

---

## Post-Sprint: Migration Path

Once Kinetic Experience v1 is stable:

1. **Feature flag:** Route `/terminal` to `/explore` for beta users
2. **Telemetry:** Compare engagement metrics
3. **Polish sprint:** Add missing features (lens, journey, overlays)
4. **Deprecation:** Archive `components/Terminal/` when parity achieved

---

*Sprint breakdown complete. Execute Story 1.0 (Firewall) first, then Story 1.1 (Route), then proceed sequentially.*
