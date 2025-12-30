# Continuation Prompt: kinetic-stream-rendering-v1

**Use this prompt to resume work in a fresh context window.**

---

## Quick Resume

```bash
cd C:\GitHub\the-grove-foundation
git checkout kinetic-stream-feature
npm install
cat docs/sprints/kinetic-stream-rendering-v1/DEVLOG.md
```

---

## Project Location

```
C:\GitHub\the-grove-foundation\
├── docs/sprints/kinetic-stream-rendering-v1/  # Sprint artifacts
├── components/Terminal/                        # Implementation target
└── src/core/schema/stream.ts                   # Sprint 1 dependency
```

---

## Current Status Check

Run these commands to understand current state:

```bash
# Check which epics are complete
grep -A2 "^### Epic" docs/sprints/kinetic-stream-rendering-v1/DEVLOG.md

# Check if Stream directory exists
ls components/Terminal/Stream/

# Check if Sprint 1 schema exists
ls src/core/schema/stream.ts

# Check git status
git status
```

---

## Files to Read First

1. **DEVLOG.md** — Current progress and session notes
2. **SPEC.md** — Requirements and acceptance criteria
3. **EXECUTION_PROMPT.md** — Full implementation code

```bash
cat docs/sprints/kinetic-stream-rendering-v1/DEVLOG.md
cat docs/sprints/kinetic-stream-rendering-v1/SPEC.md
cat docs/sprints/kinetic-stream-rendering-v1/EXECUTION_PROMPT.md
```

---

## Key Decisions (Reference)

| ADR | Decision |
|-----|----------|
| 001 | Switch statement for polymorphic dispatch |
| 002 | Extract MarkdownRenderer as fallback |
| 003 | Pre-parsed span indices as source of truth |
| 004 | Inline Cognitive Bridge injection |
| 005 | Token-based span styling (`--chat-*`) |
| 009 | Defer animations to Sprint 3 |

---

## Dependencies

**Sprint 1 (kinetic-stream-schema-v1):**
- `StreamItem` type
- `RhetoricalSpan` type
- `streamHistory` in engagement context

If Sprint 1 incomplete, use stubs from EXECUTION_PROMPT.md.

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Build
npm run build

# Unit tests
npm test

# E2E tests
npx playwright test

# Visual regression
npx playwright test tests/e2e/terminal-baseline.spec.ts
```

---

## Next Actions

Check DEVLOG.md for current epic status, then:

### If Epic 1 incomplete:
1. Create `components/Terminal/Stream/` directory
2. Create barrel export
3. Extract MarkdownRenderer

### If Epic 2 incomplete:
1. Add tokens to `src/app/globals.css`

### If Epic 3 incomplete:
1. Implement SpanRenderer
2. Implement SpanElement

### If Epic 4 incomplete:
1. Create QueryBlock
2. Create ResponseBlock
3. Create NavigationBlock
4. Create SystemBlock

### If Epic 5 incomplete:
1. Create StreamRenderer with dispatch
2. Add Cognitive Bridge injection

### If Epic 6 incomplete:
1. Modify TerminalChat
2. Add click handlers
3. Run visual regression

### If Epic 7 incomplete:
1. Add unit tests
2. Capture visual baselines
3. Verify coverage ≥80%

---

## Sprint Context

This is **Sprint 2** of the Kinetic Stream trilogy:

1. ✅ **kinetic-stream-schema-v1** — Types and parser (Sprint 1)
2. 🔄 **kinetic-stream-rendering-v1** — Renderer components (THIS SPRINT)
3. 📋 **kinetic-stream-polish-v1** — Animations and glass (Sprint 3)

The branch `kinetic-stream-feature` contains all three sprints.

---

## Handoff Notes

- All implementation code is in EXECUTION_PROMPT.md
- Follow commit sequence from SPRINTS.md
- Update DEVLOG.md after each epic
- Run build gates after each story

---

*Use this prompt at the start of any new session to resume work.*
