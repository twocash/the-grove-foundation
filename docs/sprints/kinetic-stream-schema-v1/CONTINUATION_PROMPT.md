# Continuation Prompt: kinetic-stream-schema-v1

**Use this prompt to resume work in a fresh context window**

---

## Quick Resume

```
Read C:\GitHub\the-grove-foundation\docs\sprints\kinetic-stream-schema-v1\CONTINUATION_PROMPT.md and follow instructions to resume work.
```

---

## Project Location

```
C:\GitHub\the-grove-foundation
```

---

## What We're Building

**Sprint:** kinetic-stream-schema-v1

**Goal:** Transform chat from text log to typed DEX object stream by:
1. Defining StreamItem schema (extends ChatMessage)
2. Creating RhetoricalParser (extracts spans from markdown)
3. Wiring parser to engagement machine

**NOT building:** UI components (Sprint 2)

---

## Current Sprint Status

| Epic | Status |
|------|--------|
| Epic 1: Schema Foundation | [CHECK DEVLOG] |
| Epic 2: Rhetorical Parser | [CHECK DEVLOG] |
| Epic 3: Machine Integration | [CHECK DEVLOG] |
| Epic 4: Testing | [CHECK DEVLOG] |

---

## Files to Read First

1. `docs/sprints/kinetic-stream-schema-v1/DEVLOG.md` - Current status
2. `docs/sprints/kinetic-stream-schema-v1/SPEC.md` - Goals and acceptance criteria
3. `docs/sprints/kinetic-stream-schema-v1/EXECUTION_PROMPT.md` - Implementation guide

---

## Key Decisions Already Made

1. **ADR-001:** Extend ChatMessage, don't replace
2. **ADR-002:** Parse in action layer, not rendering
3. **ADR-003:** Use JourneyPath for navigation
4. **ADR-004:** Spans store indices, not React nodes
5. **ADR-005:** Unit + visual regression testing
6. **ADR-006:** Client-side span ID generation

See `DECISIONS.md` for full context.

---

## Files Being Created/Modified

| File | Action | Status |
|------|--------|--------|
| `src/core/schema/stream.ts` | CREATE | [CHECK] |
| `src/core/schema/index.ts` | MODIFY | [CHECK] |
| `src/core/transformers/RhetoricalParser.ts` | CREATE | [CHECK] |
| `src/core/transformers/index.ts` | MODIFY | [CHECK] |
| `src/core/engagement/types.ts` | MODIFY | [CHECK] |
| `src/core/engagement/actions.ts` | MODIFY | [CHECK] |
| `src/core/engagement/machine.ts` | MODIFY | [CHECK] |
| `tests/unit/RhetoricalParser.test.ts` | CREATE | [CHECK] |
| `tests/integration/engagement-stream.test.ts` | CREATE | [CHECK] |

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Unit tests
npm test

# Visual regression
npx playwright test tests/e2e/terminal-baseline.spec.ts

# Full build
npm run build
```

---

## Questions to Ask

1. What epic are we currently on?
2. Are there any failing tests?
3. Were there any issues in the last session?

---

## Next Actions

Read DEVLOG.md to determine current epic, then:

**If Epic 1 incomplete:** Create stream.ts schema file
**If Epic 2 incomplete:** Create RhetoricalParser.ts
**If Epic 3 incomplete:** Wire parser to engagement machine
**If Epic 4 incomplete:** Create and run tests
**If all complete:** Run final verification and document completion

---

## Related Context

- **Pattern Check:** All new code extends existing patterns (no new patterns created)
- **Canonical Sources:** Using GroveObjectMeta, JourneyPath, Engagement Machine
- **Advisory Guidance:** Park (10) validated parser approach; Benet (10) validated schema for distribution

---

## Sprint Follows

After this sprint:
- **Sprint 2:** `kinetic-stream-rendering-v1` - Build StreamRenderer component
- **Sprint 3:** `kinetic-stream-polish-v1` - Glass UX, animations

---

*Continuation prompt created: December 2024*
