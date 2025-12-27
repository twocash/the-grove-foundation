# Continuation Prompt — adaptive-engagement-v1

**Purpose:** Enable fresh context windows to resume this sprint with full context.

---

## Project Location

```
C:\GitHub\the-grove-foundation
```

---

## Sprint Status

| Artifact | Status |
|----------|--------|
| INDEX.md | ✅ Complete |
| REPO_AUDIT.md | ✅ Complete |
| SPEC.md | ✅ Complete |
| ARCHITECTURE.md | ✅ Complete |
| MIGRATION_MAP.md | ✅ Complete |
| DECISIONS.md | ✅ Complete |
| SPRINTS.md | ✅ Complete |
| EXECUTION_PROMPT.md | ✅ Complete |
| DEVLOG.md | 🔄 In Progress |
| CONTINUATION_PROMPT.md | ✅ Complete |

**Planning:** Complete  
**Execution:** Not Started

---

## What Was Accomplished

1. Full Foundation Loop planning completed (9 artifacts)
2. Pattern 11 (Session Engagement Telemetry) proposed and approved
3. Canonical Source Audit completed — no duplication issues
4. 6 ADRs documented covering all major design decisions
5. File-by-file migration map with build gates

---

## Key Decisions Made

| Decision | Summary |
|----------|---------|
| ADR-001 | Session Telemetry is Pattern 11 |
| ADR-002 | Stage thresholds: 3 exchanges → ORIENTED, etc. |
| ADR-003 | Journeys support both explicit and implicit entry |
| ADR-004 | Prompt selection: filter by stage + lens, sort by weight |
| ADR-005 | Server sync: 30s debounce with localStorage fallback |
| ADR-006 | Three-layer testing: unit, integration, E2E |

---

## Dependencies

**server-side-capture-v1** must be verified complete before execution:

```bash
# Check files exist
ls lib/supabase.js lib/embeddings.js src/lib/session.ts

# Check build passes
npm run build
```

---

## Next Actions

### To Continue Planning

If planning needs adjustment:
1. Read `docs/sprints/adaptive-engagement-v1/SPEC.md`
2. Review `docs/sprints/adaptive-engagement-v1/DECISIONS.md`
3. Make changes as needed
4. Update DEVLOG.md with decisions

### To Begin Execution

```bash
cd C:\GitHub\the-grove-foundation

# In Claude CLI, paste:
# Read and execute docs/sprints/adaptive-engagement-v1/EXECUTION_PROMPT.md
```

### Execution Order

1. **Pre-check:** Verify server-side-capture-v1
2. **Phase 1:** Session Telemetry (files 1.1-1.6)
3. **Phase 2:** Adaptive Prompts (files 2.1-2.4)
4. **Phase 3:** Journey Framework (files 3.1-3.6)
5. **Phase 4:** Server Persistence (4.0a, 4.0b, 4.1-4.3)
6. **Phase 5:** Lens Integration (5.1-5.3)
7. **Phase 6:** Chat Integration (6.1-6.3)

---

## Files to Read First

In this order:
1. `docs/sprints/adaptive-engagement-v1/INDEX.md` — Overview
2. `docs/sprints/adaptive-engagement-v1/DEVLOG.md` — Current state
3. `docs/sprints/adaptive-engagement-v1/EXECUTION_PROMPT.md` — Execution guide
4. `PROJECT_PATTERNS.md` — Pattern catalog (if needed)

---

## Questions to Ask User

If resuming after delay:

1. "Was server-side-capture-v1 validated as complete?"
2. "Any changes to stage thresholds or prompt strategy?"
3. "Ready to begin execution, or need planning adjustments?"

---

## Sprint Context Summary

**Goal:** Transform static welcome prompts into adaptive system responding to engagement.

**Core Components:**
- **Session Telemetry:** Track visits, exchanges, topics, sprouts
- **Session Stages:** ARRIVAL → ORIENTED → EXPLORING → ENGAGED
- **Adaptive Prompts:** Stage-aware prompts with dynamic variables
- **Journey Framework:** Declarative paths with implicit entry
- **Server Persistence:** Supabase sync for cross-device continuity

**Patterns Extended:**
- Quantum Interface (add stage dimension)
- Schema System (new telemetry + journey schemas)

**New Pattern:**
- Pattern 11: Session Engagement Telemetry

**Estimated Effort:** ~19 hours across 6 phases

---

## How to Use This Document

1. Start fresh Claude context window
2. Say: "Read C:\GitHub\the-grove-foundation\docs\sprints\adaptive-engagement-v1\CONTINUATION_PROMPT.md and resume the sprint"
3. Claude reconstructs context from artifacts
4. Work continues from last checkpoint

---

*Foundation Loop v2.0 — Session Continuity*
