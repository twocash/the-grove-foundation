# Sprint Package: theme-system-foundation-v1

## Quick Start

```bash
# 1. Capture baseline before any changes
cd C:/GitHub/the-grove-foundation
npx playwright test --update-snapshots tests/e2e/genesis-baseline.spec.ts

# 2. Execute via Claude Code CLI
# Reference: docs/sprints/theme-system-foundation-v1/EXECUTION_PROMPT.md
```

---

## Package Contents

| File | Purpose | Read When |
|------|---------|-----------|
| **ROADMAP.md** | Big picture, sprint sequence | Lost or need context |
| **grove-theme-system-vision.md** | Full strategic vision | Deep dive on architecture |
| **REPO_AUDIT.md** | Current state analysis | Understanding what exists |
| **SPEC.md** | Goals and acceptance criteria | Validating completion |
| **ARCHITECTURE.md** | Technical design | Implementation details |
| **MIGRATION_MAP.md** | File change plan | Tracking progress |
| **DECISIONS.md** | Design rationale (ADRs) | Understanding "why" |
| **SPRINTS.md** | Epic/story breakdown | Day-to-day execution |
| **EXECUTION_PROMPT.md** | Claude Code handoff | Starting implementation |
| **DEVLOG.md** | Progress tracking | Recording work done |

---

## Key Numbers

| Metric | Value |
|--------|-------|
| **Estimated Duration** | 4 days |
| **New Files to Create** | 12 |
| **Files to Modify** | 8 |
| **Protected Files** | 10+ |
| **Test Files to Add** | 6 |
| **Total Stories** | 23 |

---

## Critical Constraints

1. **Genesis MUST NOT CHANGE** — Paper aesthetic preserved exactly
2. **Additive approach** — New `theme-*` tokens, don't replace existing
3. **DEX compliant** — Behavior from JSON, not code
4. **Tests required** — Every epic has build gate

---

## Sprint Sequence

```
Sprint 1: theme-system-foundation-v1 ◄── YOU ARE HERE
    │
    ▼
Sprint 2: foundation-component-refactor-v1
    │
    ▼
Sprint 3: terminal-theme-adoption-v1
    │
    ▼
Sprint 4: reality-tuner-v1
    │
    ▼
Sprint 5: component-schema-v1 (Future)
```

---

## Decisions Confirmed

- ✅ Space Grotesk font for Foundation: **YES**
- ✅ Terminal theme: **Sprint 3** (not this sprint)
- ✅ Reality Tuner scope: **Read-only preview** (full UI in Sprint 4)

---

## Success = 

✅ Foundation shows Quantum Grove aesthetic  
✅ Genesis shows paper aesthetic (unchanged)  
✅ Mode toggle works (light/dark)  
✅ Theme loads from JSON files  
✅ All tests pass  

---

*Package ready for execution*
