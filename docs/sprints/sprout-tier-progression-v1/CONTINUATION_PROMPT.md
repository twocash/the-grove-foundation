# Continuation Prompt: S4-SL-TierProgression

## Instant Orientation

| Field | Value |
|-------|-------|
| **Project** | `C:\GitHub\the-grove-foundation` |
| **Sprint** | S4-SL-TierProgression |
| **Current Phase** | Ready for Execution |
| **Status** | 🟢 All artifacts complete |
| **Next Action** | Run `/grove-execution-protocol` then implement |

---

## Context Reconstruction

### Read These First (In Order)

1. **SPEC.md** — Live Status + Attention Anchor + Goals
2. **EXECUTION_PROMPT.md** — Self-contained implementation guide
3. **DEVLOG.md** — Current progress (check last entry)

### Key Decisions Made

1. **UI-layer tier mapping** — 8 stages → 5 tiers (display only)
2. **Emoji-first badges** — 🌰🌱🌿🌳🌲
3. **Optional promotedAt** — No schema migration needed
4. **Fail-soft promotion** — Warn but don't fail if stage update fails
5. **Quantum Glass tokens** — Stay on current design system
6. **300ms animation** — Subtle glow on tier change
7. **Default = sprout** — Legacy sprouts show as 🌱

### What's Done

- [x] REPO_AUDIT.md created
- [x] SPEC.md with Live Status + Attention Anchor
- [x] ARCHITECTURE.md with target state
- [x] MIGRATION_MAP.md with file-by-file plan
- [x] DECISIONS.md with 7 ADRs
- [x] SPRINTS.md with 5 epics, 8 stories
- [x] EXECUTION_PROMPT.md with code samples
- [x] USER_STORIES.md with Gherkin acceptance criteria
- [x] DESIGN_SPEC.md (from Designer)
- [x] DESIGN_DECISIONS.md (from Designer)
- [x] DEX Compliance Review APPROVED

### What's Pending

- [ ] Run `/grove-execution-protocol` for execution contract
- [ ] Epic 1: Create TierBadge component
- [ ] Epic 2: Add promotedAt field to schema
- [ ] Epic 3: Fix handlePromote stage update (CRITICAL)
- [ ] Epic 4: Integrate badges in GardenTray + Header + Provenance
- [ ] Epic 5: Add animation and tooltips

---

## Resume Instructions

1. **Read SPEC.md** — Understand goals and acceptance criteria
2. **Run protocol:**
   ```
   /grove-execution-protocol S4-SL-TierProgression
   ```
3. **Follow EXECUTION_PROMPT.md** — Step-by-step implementation
4. **Update DEVLOG.md** — After each epic

---

## Attention Anchor

**We are building:** Tier badges showing sprout maturity in UI

**Success looks like:** User promotes sprout → sees 🌱 change to 🌿

**We are NOT:**
- Building filtering (Phase 1)
- Building auto-advancement (Phase 2)
- Using Living Glass tokens (Phase 5)

---

## Critical Path

The most important fix is in **Epic 3: Promotion Wiring**

```typescript
// ActionPanel.tsx - FIX THIS:
updateSprout(sprout.id, {
  stage: 'established',
  promotedAt: new Date().toISOString(),
});
```

Without this fix, promotions don't update the tier.

---

## File Quick Reference

| Purpose | Path |
|---------|------|
| Execution guide | `docs/sprints/sprout-tier-progression-v1/EXECUTION_PROMPT.md` |
| Progress log | `docs/sprints/sprout-tier-progression-v1/DEVLOG.md` |
| User stories | `docs/sprints/sprout-tier-progression-v1/USER_STORIES.md` |
| Design spec | `docs/sprints/sprout-tier-progression-v1/DESIGN_SPEC.md` |
| Bug location | `src/surface/components/modals/SproutFinishingRoom/ActionPanel.tsx:47-68` |

---

## Verification Commands

```bash
# Check current state
cd C:\GitHub\the-grove-foundation
git status

# Build and test
npm run build && npm test

# Run specific E2E tests
npx playwright test tests/e2e/sprout-finishing-room.spec.ts
```

---

*Continuation prompt for S4-SL-TierProgression*
*Use this to resume work in a fresh context window*
