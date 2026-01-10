# Sprout Research System v1

**Codename:** `sprout-research-v1`
**Status:** In Progress
**Branch:** `feature/sprout-research-v1`
**Baseline Checkpoint:** `checkpoint-pre-sprout-research-20260110` (commit `ae1e4fd`)
**Started:** January 10, 2026

---

## Phase Checklist

### Phase 0: Setup & Audit ✅ COMPLETE

- [x] 0.0: Create checkpoint tag and sprint branch
- [x] 0.1: Create sprint documentation structure
- [x] 0.25: Route verification - trace /explore render path
- [x] 0.5: Audit System Prompt pattern (singleton reference)

### Phase 1: Configuration Schema

- [ ] 1a: Interface definitions (PromptArchitectConfig, mirror System Prompt singleton pattern)
- [ ] 1b: JSON schema files (mirror System Prompt versioning)
- [ ] 1c: Inference rule engine (no UI)
- [ ] 1d: Quality gate logic (no UI)
- [ ] **GATE:** Unit tests pass, npm run build succeeds

### Phase 2: Object Model & Storage

- [ ] 2a: ResearchSprout interface (no UI)
- [ ] 2b: research-sprouts.json registry (no UI)
- [ ] 2c: ResearchSproutContext (no UI)
- [ ] 2d: Supabase table migrations (no UI)
- [ ] 2e: Context provider integration
- [ ] 2f: Migration rollback test
- [ ] **GATE:** Storage round-trip test passes; DOWN migration verified

### Phase 3: Prompt Architect Agent

- [ ] 3a: Command detection for sprout: (no UI change)
- [ ] 3b: Config loader implementation (no UI change)
- [ ] 3c: Inference pipeline (no UI change)
- [ ] 3d: Confirmation flow logic (no UI change)
- [ ] 3e: Feature flag: SPROUT_RESEARCH_ENABLED
- [ ] 3f: Wire flag=true path (UI change, flagged)
- [ ] 3g: Visual verification: flag=true vs flag=false
- [ ] **GATE:** Screenshot both paths, behavior correct

### Phase 4: Garden Inspector Panel

- [ ] 4a: GardenInspector component (isolated)
- [ ] 4b: Status grouping logic (no integration)
- [ ] 4c: Pulsing badge animation (isolated CSS)
- [ ] 4d: Toast notification system (isolated)
- [ ] 4e: Feature flag: GARDEN_INSPECTOR_ENABLED
- [ ] 4f: Wire into Explore layout (flagged)
- [ ] 4g: Visual verification: inspector states
- [ ] **GATE:** Screenshot collapsed, expanded, pulsing states

### Phase 5: Research Agent

- [ ] 5a: Queue consumer for pending status (no UI)
- [ ] 5b: Research execution logic (no UI)
- [ ] 5c: Results population (no UI)
- [ ] 5d: Child manifest spawning (no UI)
- [ ] 5e: System-level QA agent flag (no UI)
- [ ] 5f: Integration test: sprout -> agent -> results
- [ ] 5g: Visual verification: end-to-end flow
- [ ] **GATE:** Complete sprout lifecycle works

### Phase 6: Deprecation & Isolation

- [ ] 6a: Feature flag: LEGACY_SPROUT_DISABLED
- [ ] 6b: Verify sprout-command-parser.ts intercepts 'sprout:' in /explore
- [ ] 6c: Verify legacy Terminal command files unreachable from /explore
- [ ] 6d: Confirm PlantSelectionTooltip not rendered in /explore
- [ ] 6e: Document legacy files as "dead code in Explore context"
- [ ] 6f: Update help documentation
- [ ] **GATE:** Legacy commands isolated; FROZEN ZONE UNTOUCHED

---

## Hard Constraints

1. **Strangler Fig Compliance:** NO modifications to /terminal, /foundation, /journeys, /hubs routes or src/surface/components/Terminal/*
2. **Visual Verification Gates:** Screenshot evidence required before commits
3. **Feature Flags Before Wiring:** No new code in render path without flag
4. **Schema-First Development:** Interfaces before UI
5. **Test-Behavior Parity:** Tests verify user-visible behavior

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Route verification, pattern documentation |
| [DEVLOG.md](./DEVLOG.md) | Session-by-session progress log |
| [CONTINUATION_PROMPT.md](./CONTINUATION_PROMPT.md) | Context handoff for session changes |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions made |

---

## Emergency Recovery

```bash
# Return to checkpoint
git checkout checkpoint-pre-sprout-research-20260110

# Or reset branch
git checkout feature/sprout-research-v1
git reset --hard checkpoint-pre-sprout-research-20260110
```
