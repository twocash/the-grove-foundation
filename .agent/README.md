# Grove Foundation Agent Context

This directory contains agent coordination artifacts for the Grove Foundation project.

## Purpose

Standardized location for agent-related context, inspired by the Navigator plugin ecosystem but customized for Grove's sprint-aligned workflow.

## Structure

```
.agent/
├── README.md              # This file
├── config/                # Coordination configuration (Phase 1)
│   └── .gitkeep           # Placeholder - populated in Phase 1
├── roles/
│   ├── chief-of-staff.md  # Infrastructure owner (runs first)
│   ├── sprintmaster.md    # Pipeline coordination
│   ├── developer.md       # Sprint execution
│   ├── qa-reviewer.md     # Quality assurance
│   └── mine-sweeper.md    # Test debt cleanup
└── status/                # Status logging (Phase 2)
    ├── current/           # Active status entries (numbered files)
    └── archive/           # Completed sprints, rotated logs
```

## Startup Sequence

Agents activate in this order:

```
1. randy / chief-of-staff  # Validate infrastructure health
2. sprintmaster            # Pipeline dashboard, agent dispatch
3. developer(s)            # As dispatched per sprint queue
4. qa-reviewer             # When sprints complete
5. mine-sweeper            # Test debt cleanup (as needed)
```

**Randy (Chief of Staff) runs first.** If infrastructure is unhealthy, fix it before spawning other agents.

## Status Log

**Legacy:** `~/.claude/notes/sprint-status-live.md` (read-only archive)

**New (Phase 2+):** `.agent/status/current/` with numbered YAML+markdown entries

Entry format:
```yaml
---
timestamp: 2026-01-14T03:30:00Z
sprint: results-wiring-v1
sprint_id: <notion-page-id>
phase: Implementation
agent: developer
branch: main
status: COMPLETE
severity: INFO
heartbeat: 2026-01-14T03:30:00Z
notion_synced: false
---

## 2026-01-14T03:30:00Z | Results Wiring v1 | Implementation

**Agent:** Developer / main
**Status:** COMPLETE
**Summary:** ...
```

See Bedrock Sprint Contract Article X (Section 6.4) for the status protocol.

## Role Activation

Reference the appropriate role file when starting a session:

```
# Randy / Chief of Staff (first!)
"Act as Randy (Chief of Staff) per .agent/roles/chief-of-staff.md"

# Sprintmaster
"Act as Sprintmaster per .agent/roles/sprintmaster.md"

# Developer
"Act as Developer for sprint X per .agent/roles/developer.md"

# QA Reviewer
"Act as QA Reviewer for sprint X per .agent/roles/qa-reviewer.md"

# Mine Sweeper
"Act as Mine Sweeper per .agent/roles/mine-sweeper.md"
```

## Skills

Skills define agent behaviors and protocols. Source of truth for skills:
- **Repo:** `.agent/skills/` (future - Phase 1 of Coordination Infra v2)
- **Local:** `~/.claude/skills/` (Claude CLI reads from here)

Current skills:
- `chief-of-staff` (Randy) - Infrastructure validation and maintenance
- `sprintmaster` - Pipeline dashboard and agent dispatch
- `grove-foundation-loop` - Sprint planning methodology
- `grove-execution-protocol` - Execution contracts
- `user-story-refinery` - Generate acceptance criteria
- `mine-sweeper` - Test debt cleanup
- `dex-master` - Code review automation

## Related Documents

- `docs/BEDROCK_SPRINT_CONTRACT.md` - Governing contract (Article X defines roles)
- `~/.claude/notes/sprint-status-live.md` - Legacy status log (read-only)
- `~/.claude/notes/grove-runbook.md` - Central reference
- `~/.claude/plans/` - Active sprint plans

## Version

Protocol Version: 1.2
Contract Version: 1.3
