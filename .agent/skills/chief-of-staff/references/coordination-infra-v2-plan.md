# Sprint: Agent Coordination Infrastructure v2

**Sprint ID:** `coordination-infra-v2`
**Owner:** Chief of Staff
**Created:** 2026-01-14
**Status:** Phase 0 - In Progress

---

## Problem Statement

The agent coordination system works but has grown organically without ownership. Key issues:

1. **No owner** – Changes happen ad-hoc, no review process
2. **Not source-controlled** – Lives in `~/.claude`, not versioned with project
3. **Concurrency risks** – Status log can corrupt under parallel writes
4. **No staleness detection** – Crashed agents show IN_PROGRESS forever
5. **Cruft accumulation** – 280+ empty todo files, unbounded log growth
6. **Manual Notion sync** – Source of truth drifts from dashboard
7. **No conflict detection** – Can accidentally dispatch two agents to same sprint
8. **No urgency signals** – All status entries equal priority

---

## Solution Overview

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Create Chief of Staff role and consultation protocol | ✅ In Progress |
| 1 | Source-control the coordination layer | Planned |
| 2 | Harden status logging (concurrency, staleness, rotation) | Planned |
| 3 | Automate Notion sync on status transitions | Planned |
| 4 | Add dispatch safety (conflict detection, capability verification) | Planned |
| 5 | Clean up cruft and document startup sequence | Planned |

---

## Phase 0: Chief of Staff Role

**Deliverables:**
- [x] `~/.claude/skills/chief-of-staff/skill.md`
- [x] `~/.claude/skills/chief-of-staff/references/coordination-infra-v2-plan.md`
- [ ] `.agent/roles/chief-of-staff.md` (repo)
- [ ] Initial Sprintmaster consultation completed
- [ ] Runbook updated with startup sequence

**Acceptance Criteria:**
- [ ] Can invoke `/chief-of-staff` in fresh CLI
- [ ] Health check runs and reports status
- [ ] Consultation protocol documented and tested

---

## Phase 1: Source Control the Coordination Layer

**Target structure:**
```
the-grove-foundation/
├── .agent/
│   ├── config/
│   │   ├── coordination.yaml      # Central config
│   │   └── notion-sync.yaml       # Database IDs, sync rules
│   ├── roles/
│   │   ├── chief-of-staff.md
│   │   ├── sprintmaster.md
│   │   ├── developer.md
│   │   ├── qa-reviewer.md
│   │   └── mine-sweeper.md
│   ├── skills/                    # Source of truth for skills
│   │   ├── sprintmaster/
│   │   ├── chief-of-staff/
│   │   └── ...
│   ├── status/
│   │   ├── current/               # Active status entries
│   │   └── archive/               # Completed sprints, rotated logs
│   └── runbook.md
```

**Migration tasks:**
- [ ] Create `.agent/` structure in repo
- [ ] Move role definitions from `~/.claude` to repo
- [ ] Create sync script (repo ↔ local)
- [ ] Document sync workflow in runbook

**Acceptance Criteria:**
- [ ] Coordination config is versioned in git
- [ ] `git diff` shows changes to agent infrastructure
- [ ] Fresh clone + sync script = working coordination system

---

## Phase 2: Harden Status Logging

### 2A: Concurrency Safety

Replace single file with numbered entry files:
```
.agent/status/current/
├── 001-2026-01-14T03-45-00Z-sprintmaster.md
├── 002-2026-01-14T04-00-00Z-developer.md
└── ...
```

### 2B: Staleness Detection

Add to entry format:
```yaml
heartbeat: 2026-01-14T04:30:00Z
ttl_minutes: 30
```

Sprintmaster flags entries where `now - heartbeat > ttl_minutes`.

### 2C: Log Rotation

- On sprint COMPLETE: Move entries to `.agent/status/archive/{sprint-name}/`
- Weekly: Archive entries older than 7 days
- Keep max 50 entries in `current/`

**Acceptance Criteria:**
- [ ] Parallel writes don't corrupt
- [ ] Stale IN_PROGRESS entries flagged within 30 min
- [ ] Archive contains historical entries, current stays bounded

---

## Phase 3: Automate Notion Sync

**Trigger:** Status entry with `Status: COMPLETE`

**Implementation:** Sprintmaster scans for unsynced COMPLETEs on startup, updates Notion.

**Acceptance Criteria:**
- [ ] Notion status matches status log within one Sprintmaster session
- [ ] Sync failures logged, don't block agent work

---

## Phase 4: Dispatch Safety

### 4A: Conflict Detection

Before `spawn developer {sprint}`:
- Scan for IN_PROGRESS without matching COMPLETE
- Require `--force` flag to override

### 4B: Capability Verification

Add preflight check to spawn prompts:
- Verify file access
- Verify required skills loaded
- STOP and report if checks fail

### 4C: Severity Levels

Extend entry format:
```yaml
severity: INFO | WARN | URGENT | BLOCKER
```

**Acceptance Criteria:**
- [ ] Cannot accidentally spawn duplicate agent on same sprint
- [ ] Agents validate prerequisites before executing
- [ ] Urgent entries surface immediately in dashboard

---

## Phase 5: Cleanup and Documentation

### 5A: Delete Cruft
- Remove empty `~/.claude/todos/*.json` files
- Document or delete the UUID cross-reference system

### 5B: Startup Sequence
Document in runbook:
```
1. chief-of-staff → validate infrastructure
2. sprintmaster → pipeline dashboard
3. developer(s) → as dispatched
4. qa-reviewer → when sprints complete
```

### 5C: Structured Status Format

YAML frontmatter + markdown body:
```markdown
---
timestamp: 2026-01-14T04:30:00Z
sprint: results-wiring-v1
agent: developer
status: COMPLETE
severity: INFO
heartbeat: 2026-01-14T04:30:00Z
---
## 2026-01-14T04:30:00Z | Results Wiring v1 | Implementation
**Agent:** Developer / main
**Status:** COMPLETE
...
```

**Acceptance Criteria:**
- [ ] `~/.claude/todos/` cleaned up
- [ ] Runbook documents startup sequence
- [ ] Status entries parseable AND human-readable

---

## Consultation Log

Record Sprintmaster consultations here:

### Consultation 1: [Pending]
**Date:** TBD
**Questions asked:** TBD
**Key insights:** TBD

---

## Decision Log

Record architectural decisions here:

### Decision 1: Numbered files over lockfile
**Context:** Need to prevent concurrent write corruption
**Options:** Lockfile pattern vs numbered files
**Decision:** Numbered files - simpler, no cleanup on crash, natural ordering
**Rationale:** Lockfiles require cleanup if agent crashes while holding lock

---

*Plan maintained by Chief of Staff*
