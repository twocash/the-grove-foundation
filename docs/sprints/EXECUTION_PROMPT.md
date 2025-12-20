# EXECUTION PROMPT — Grove Main Page Voice Revision

Copy this entire block into Claude Code, Cursor, or another agentic coding tool.

---

## CONTEXT

You are executing a content revision sprint for The Grove Foundation landing page. All planning is complete. Your job is to implement the changes documented in the spec files.

**Documentation location:** `docs/sprints/`

Read these files first:
1. `docs/sprints/REPO_AUDIT.md` — Codebase structure
2. `docs/sprints/SPEC.md` — Goals and acceptance criteria
3. `docs/sprints/MIGRATION_MAP.md` — File-by-file changes
4. `docs/sprints/grove-main-page-revision.md` — All target content

---

## REPO INTELLIGENCE — TRIPWIRES

**CRITICAL: Read these before any implementation.**

1. **Schema location:** Types are in `src/core/schema/` — the root `types.ts` is a shim that re-exports. Always import from `./types` or `./src/core/schema`.

2. **SectionId enum:** Located at `src/core/schema/base.ts:9-18`. Do NOT modify the enum values.

3. **Content locations:**
   - `constants.ts` — `SECTION_HOOKS` (lines 28-125), `INITIAL_TERMINAL_MESSAGE` (lines 127-137)
   - `App.tsx` — Section JSX (lines 246-575)
   - `components/WhatIsGroveCarousel.tsx` — Carousel slides (lines 11-228)

4. **Telemetry pattern:** Follow existing functions in `utils/funnelAnalytics.ts`. All tracking functions call `trackFunnelEvent(eventType, properties)`.

5. **PromptHooks dual-source:** `components/PromptHooks.tsx` uses narrative nodes if available, falls back to `SECTION_HOOKS`. Preserve both paths.

6. **Admin boundary:** `App.tsx:22-27` checks `?admin=true`. Do NOT modify admin detection or AdminDashboard.

---

## CITATION RULES

For every change you make, cite the file and line numbers:
- Format: `path:lineStart-lineEnd`
- Example: `constants.ts:28-40`

---

## IMPLEMENTATION ORDER

Execute in this exact sequence:

### 1. Telemetry Infrastructure

**File:** `utils/funnelAnalytics.ts`

Add after line 162:
```typescript
// Prompt hook clicks from landing page
export const trackPromptHookClicked = (data: {
  sectionId: string;
  hookText: string;
  nodeId?: string;
}): void => {
  trackFunnelEvent('prompt_hook_clicked', {
    sectionId: data.sectionId,
    hookText: data.hookText,
    nodeId: data.nodeId || null,
    source: 'landing_page'
  });
};
```

Add `trackPromptHookClicked` to the default export object.

### 2. App.tsx Telemetry Integration

**File:** `App.tsx`

a) Add import at top:
```typescript
import { trackPromptHookClicked } from './utils/funnelAnalytics';
```

b) Update `handlePromptHook` (around line 87):
```typescript
const handlePromptHook = (data: { nodeId?: string; display: string; query: string }, sectionId?: SectionId) => {
  trackPromptHookClicked({
    sectionId: sectionId || 'unknown',
    hookText: data.display,
    nodeId: data.nodeId
  });
  setTerminalState(prev => ({ ...prev, isOpen: true }));
  setExternalQuery(data);
};
```

c) Update all `<PromptHooks onHookClick=...>` calls to pass sectionId:
```tsx
<PromptHooks sectionId={SectionId.STAKES} onHookClick={(data) => handlePromptHook(data, SectionId.STAKES)} />
```

Find and update all instances (approximately 8 locations).

### 3. constants.ts Content Updates

**File:** `constants.ts`

a) Replace `SECTION_HOOKS` object with content from `docs/sprints/grove-main-page-revision.md`.

b) Replace `INITIAL_TERMINAL_MESSAGE` with the target from the revision doc.

### 4. App.tsx Section Content

**File:** `App.tsx`

Update section content per `docs/sprints/grove-main-page-revision.md`:

| Section | Lines (approx) | Key Change |
|---------|----------------|------------|
| Hero | 246-282 | Headline: "Against Ownership." |
| Ratchet | 286-327 | Lead: "The smart money assumes..." |
| Architecture | 330-358 | Headline: "Your thinking. Your hardware. Your history." |
| Economics | 361-386 | Headline: "A business model that shrinks." |
| Network | 453-513 | Headline: "A civilization that learns." |
| Get Involved | 516-575 | Headline: "The Terminal is open." |

Preserve all JSX structure, classes, and event handlers. Only change text content.

### 5. Carousel Content

**File:** `components/WhatIsGroveCarousel.tsx`

Update 6 slides per revision doc. Preserve JSX structure.

### 6. Verification

```bash
npm run build
```

Must complete with no errors.

---

## RESPONSE FORMAT

For each change, respond with:

```
## What I Found
- [File and line citations]

## What I'm Changing
- [Specific changes with before/after]

## Diff Summary
- [Files modified, lines changed]

## Tests Run
- [Commands executed, results]

## Risks / Follow-ups
- [Any concerns or incomplete items]
```

---

## FORBIDDEN ACTIONS

1. Do NOT modify component structure or layout
2. Do NOT add new dependencies
3. Do NOT change the admin console
4. Do NOT modify the Terminal component itself
5. Do NOT implement without citing specific line numbers

---

## START

Begin with Story 1.1: Add `trackPromptHookClicked` to `utils/funnelAnalytics.ts`.

Cite the file location, show the exact insertion point, and provide the complete code to add.
