# Grove Sprint

**Version:** 1.0
**Consolidated from:** grove-foundation-loop + grove-execution-protocol
**Contract Reference:** Bedrock Sprint Contract v1.3

---

## DEX/Trellis Philosophy (REQUIRED)

**CRITICAL:** Before ANY sprint work, internalize these principles:

### DEX: Declarative Exploration (The "What")

| Principle | Meaning | Violation Example |
|-----------|---------|-------------------|
| **Declarative Sovereignty** | Behavior defined in config, not code | `if (type === 'foo')` conditionals |
| **Capability Agnosticism** | Works regardless of AI model | Model-specific prompts |
| **Provenance as Infrastructure** | Every artifact traces to source | Undocumented code changes |
| **Organic Scalability** | 8 → 80 features without restructuring | Monolithic files |

### Trellis: Separation of Exploration from Execution (The "How")

```
┌─────────────────────────────────────────────────────────────────┐
│ EXPLORATION (Sprintmaster)  │  EXECUTION (Developer)           │
├─────────────────────────────┼───────────────────────────────────┤
│ Read-only planning          │  Write code                       │
│ Spec analysis               │  Run tests                        │
│ Gate coordination           │  Capture screenshots              │
│ Bug report writing          │  Status updates                   │
│ Notion sync                 │  REVIEW.html completion           │
└─────────────────────────────┴───────────────────────────────────┘
```

**Gate:** You MUST identify which role you're operating in before proceeding.

---

## Tier Selection

Choose the appropriate tier based on your task:

### Tier 1: Foundation Loop (Planning)

**When to use:** Sprint planning, spec creation, story extraction

**Flow:**
```
User Request → Research Phase → Spec Generation → Story Extraction → Gate
```

**Artifacts produced:**
- SPEC.md with acceptance criteria
- User stories in Notion
- Dependency analysis
- EXECUTION_PROMPT.md (handoff to Tier 2)

**Invoke:** `/grove-foundation-loop` or "help me plan a sprint"

### Tier 2: Execution Protocol (Implementation)

**When to use:** Implementing a sprint with an existing spec

**Flow:**
```
EXECUTION_PROMPT.md → Phase execution → Visual verification → REVIEW.html → Gate
```

**Artifacts produced:**
- Code changes
- Test results
- Screenshots in `docs/sprints/{name}/screenshots/`
- REVIEW.html with AC evidence
- Status updates to `~/.claude/notes/sprint-status-live.md`

**Invoke:** `/grove-execution-protocol` or "execute sprint X"

---

## Contract Authority

The **Bedrock Sprint Contract v1.3** (`docs/BEDROCK_SPRINT_CONTRACT.md`) is the authoritative source for:

- Sprint structure requirements (Article I)
- Naming conventions (Article II)
- Spec writing standards (Article III)
- DEX compliance requirements (Section 3.3)
- Visual verification protocol (Article IX)
- Agent roles and coordination (Article X)
- Status update format (Section 6.4)

**Rule:** When this skill and the contract conflict, the CONTRACT wins.

---

## Architecture Rules Reference

See `references/grove-architecture-rules.md` for detailed rules on:

- Declarative over imperative patterns
- Config-driven behavior
- State machine usage
- Behavior testing vs implementation testing
- Single source of truth

**Pre-commit checklist:**
- [ ] No new `handle*` callbacks for domain logic
- [ ] No new `if (type === 'foo')` conditionals
- [ ] Behavior defined in config, not code
- [ ] Tests verify user behavior, not implementation

---

## Quick Reference

### Status Entry Format (Section 6.4)

```markdown
---
## {ISO Timestamp} | {Sprint Name} | {Phase}
**Agent:** {role} / {branch}
**Status:** STARTED | IN_PROGRESS | COMPLETE | BLOCKED
**Summary:** {1-2 sentences}
**Files:** {files changed}
**Tests:** {pass/fail or N/A}
**Unblocks:** {what this enables}
**Next:** {recommended action}
---
```

### Visual Verification (Article IX)

Every AC requires:
1. Screenshot evidence
2. Build verification (`npm run build` passes)
3. Test results documented

### Role Declaration

Start every session with role identification:

| Role | Mode | Can Write |
|------|------|-----------|
| Sprintmaster | Plan | Notes, plans, bug reports |
| Developer | Execute | Code, tests, screenshots |
| QA Reviewer | Review | QA reports only |

---

## Migration Notes

This skill consolidates:
- `grove-foundation-loop` (695 lines) → Tier 1
- `grove-execution-protocol` (746 lines) → Tier 2

The following are deprecated:
- `dex-master` - Function covered by Sprintmaster role

Preserved as-is:
- `user-story-refinery` - Standalone story extraction
