# Continuation Prompt: kinetic-stream-polish-v1

**Use this prompt to resume work on Sprint 3 after a session break.**

---

## Quick Resume

```bash
# Navigate to project
cd C:\GitHub\the-grove-foundation

# Ensure on correct branch
git checkout kinetic-stream-feature

# Check current status
git status

# Install dependencies if needed
npm install

# Start dev server
npm run dev
```

---

## Project Location

```
C:\GitHub\the-grove-foundation\
├── docs/sprints/kinetic-stream-polish-v1/   # Sprint documentation
├── components/Terminal/                      # Implementation target
│   ├── Stream/
│   │   ├── motion/                          # Animation utilities
│   │   ├── blocks/                          # Block components
│   │   └── StreamingText.tsx                # Streaming animation
│   ├── TerminalChat.tsx                     # Container component
│   ├── FloatingInput.tsx                    # Floating input
│   └── NewMessagesIndicator.tsx             # Scroll indicator
└── app/globals.css                          # Token definitions
```

---

## Current Status Check

Run these commands to assess progress:

```bash
# Check if motion directory exists
ls components/Terminal/Stream/motion/

# Check if glass tokens exist
grep "glass-bg" app/globals.css

# Check if components exist
ls components/Terminal/FloatingInput.tsx
ls components/Terminal/NewMessagesIndicator.tsx
ls components/Terminal/Stream/StreamingText.tsx

# Run type check
npm run typecheck
```

---

## Files to Read First

1. **DEVLOG.md** — Current sprint status and completed work
2. **SPEC.md** — Requirements and acceptance criteria
3. **EXECUTION_PROMPT.md** — Implementation details for current phase

---

## Key Decisions (Quick Reference)

| # | Decision | Choice |
|---|----------|--------|
| 001 | Animation library | Framer Motion |
| 002 | Glass implementation | CSS tokens + classes |
| 003 | Scroll behavior | Custom useScrollAnchor hook |
| 004 | Streaming animation | React state batching |
| 005 | Floating input | CSS sticky positioning |
| 006 | Variants organization | Shared variants.ts file |
| 007 | Reduced motion | CSS + JS dual approach |

---

## Dependencies

### Sprint Dependencies
- **Sprint 1 (schema):** Must be complete — provides StreamItem types
- **Sprint 2 (rendering):** Must be complete — provides block components

### Verify Dependencies
```bash
# Check for Sprint 2 components
ls components/Terminal/Stream/blocks/
# Should see: QueryBlock.tsx, ResponseBlock.tsx, NavigationBlock.tsx, SystemBlock.tsx

# Check for types
grep "StreamItem" types/terminal.ts
```

---

## Verification Commands

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Build
npm run build
```

---

## Next Actions by Epic Status

### If Epic 1 (Motion Infrastructure) is incomplete:
1. Create `components/Terminal/Stream/motion/` directory
2. Create `motion/index.ts` and `motion/variants.ts`
3. Update `Stream/index.ts` with motion exports
4. Run build gate: `npm run typecheck`

### If Epic 2 (Glass Tokens) is incomplete:
1. Add glass tokens to `app/globals.css` `:root` section
2. Add glass utility classes to `app/globals.css`
3. Run build gate: Visual inspection in browser

### If Epic 3 (Glass Components) is incomplete:
1. Create `motion/GlassPanel.tsx`
2. Create `FloatingInput.tsx`
3. Run build gate: `npm run typecheck`

### If Epic 4 (Smart Scroll) is incomplete:
1. Create `motion/useScrollAnchor.ts`
2. Create `NewMessagesIndicator.tsx`
3. Run build gate: Hook returns expected state

### If Epic 5 (Streaming Animation) is incomplete:
1. Create `Stream/StreamingText.tsx`
2. Integrate with ResponseBlock
3. Run build gate: Characters reveal correctly

### If Epic 6 (Block Animations) is incomplete:
1. Add motion to QueryBlock
2. Add glass and motion to ResponseBlock
3. Add stagger to NavigationBlock
4. Add fade to SystemBlock
5. Run build gate: Blocks animate on entrance

### If Epic 7 (Container Integration) is incomplete:
1. Add AnimatePresence to StreamRenderer
2. Integrate scroll anchor into TerminalChat
3. Replace static input with FloatingInput
4. Run build gate: Full E2E integration

### If Epic 8 (Testing) is incomplete:
1. Create unit tests for StreamingText
2. Create unit tests for useScrollAnchor
3. Create E2E visual regression tests
4. Run accessibility audit
5. Run build gate: All tests pass

---

## Sprint Context

### Sprint Trilogy
```
Sprint 1: Schema (kinetic-stream-schema-v1)
    ↓ Provides: StreamItem, RhetoricalSpan types
Sprint 2: Rendering (kinetic-stream-rendering-v1)
    ↓ Provides: Block components, SpanRenderer
Sprint 3: Polish (kinetic-stream-polish-v1) ← YOU ARE HERE
    → Delivers: Glass effects, animations, smart scroll
```

### What This Sprint Adds
- Glassmorphism effects on response blocks
- Entrance/exit animations for all blocks
- Character-by-character streaming animation
- Smart scroll that respects user intent
- Floating input always visible
- New messages indicator

### What This Sprint Does NOT Change
- StreamItem schema (Sprint 1)
- Block component structure (Sprint 2)
- SpanRenderer logic (Sprint 2)
- Machine state management

---

## Common Issues

### "Cannot find module './motion/variants'"
**Solution:** Ensure motion directory and files exist. Check imports match file names exactly.

### "AnimatePresence not working"
**Solution:** Ensure children have unique `key` props. Check mode is set to "popLayout".

### "Glass effect not visible"
**Solution:** Verify backdrop-filter support. Check element has content behind it. Verify tokens in :root.

### "Scroll anchor not detecting bottom"
**Solution:** Check threshold value (default 100px). Verify ref attached to correct container.

### "Streaming cursor stuck"
**Solution:** Check interval cleanup on unmount. Verify isStreaming prop updates.

---

## Advisory Council Contacts

For design questions during implementation:

| Domain | Primary Advisor | Weight |
|--------|-----------------|--------|
| Animation performance | Park | 10 |
| Narrative timing | Short | 8 |
| Drama/engagement | Adams | 8 |
| Accessibility | Vallor | 6 |

---

## Handoff Notes

[Add any specific notes for the next session here]

---

*Use this prompt at the start of each work session to quickly restore context.*
