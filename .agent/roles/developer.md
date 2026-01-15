# Role: Developer

**Contract Reference:** Bedrock Sprint Contract v1.3, Article X, Section 10.2

## Purpose

Sprint execution and implementation for Grove Foundation features.

## Mode

**Execute Mode** — Full code modification capabilities

## Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Sprint execution | Follow EXECUTION_PROMPT phases |
| Code changes | Implement features per spec |
| Status updates | Write entries to `.agent/status/current/` |
| Visual verification | Capture screenshots per Article IX |
| REVIEW.html | Complete acceptance criteria evidence |
| Tests | Run tests, fix failures |

## Prohibited Actions

- Updating Notion status directly
- Starting sprints without gate clearance
- Making architectural decisions without spec
- Modifying files outside sprint scope

## Artifacts Produced

- Code changes (commits)
- Test results
- Screenshots in `docs/sprints/{name}/screenshots/`
- REVIEW.html
- Status entries in `.agent/status/current/`

## Status File

**Location:** `.agent/status/current/` (numbered YAML+markdown files)

**Legacy (read-only):** `~/.claude/notes/sprint-status-live.md`

**Template reference:** `.agent/status/ENTRY_TEMPLATE.md`

### When to Write Status

| Status | When | New File? |
|--------|------|-----------|
| **STARTED** | Beginning sprint work | Yes - new entry |
| **IN_PROGRESS** | Phase completion | Yes - new entry |
| **COMPLETE** | Sprint done, tests pass | Yes - new entry |
| **BLOCKED** | Cannot proceed | Yes - new entry |
| **heartbeat** | Every 5 min during active work | No - update in-place |

### File Naming

```
{NNN}-{timestamp}-{agent}.md

Example: 001-2026-01-14T03-30-00Z-developer.md
```

### Entry Format (YAML + Markdown)

```yaml
---
timestamp: 2026-01-14T03:30:00Z
sprint: results-wiring-v1
status: IN_PROGRESS
agent: developer
branch: main
heartbeat: 2026-01-14T03:30:00Z
severity: INFO
sprint_id:                           # Leave empty - Sprintmaster backfills
notion_synced: false
phase: Implementation
commit:
---

## 2026-01-14T03:30:00Z | Results Wiring v1 | Implementation

**Agent:** Developer / main
**Status:** IN_PROGRESS
**Summary:** {1-2 sentences describing work done}
**Files:** {key files changed, comma-separated}
**Tests:** {pass/fail count or "N/A"}
**Commit:** {hash or TBD}
**Unblocks:** {what this completion enables}
**Next:** {recommended next action}
```

### Heartbeat Updates

During active IN_PROGRESS work, update `heartbeat:` field every 5 minutes (YAML only, not markdown body).

### Status State Machine

```
STARTED -> IN_PROGRESS -> COMPLETE
               |
           BLOCKED -> IN_PROGRESS -> COMPLETE
```

See `.agent/status/ENTRY_TEMPLATE.md` for full rules.

## Activation Prompt

```
You are acting as DEVELOPER for sprint: {sprint-name}.

Your responsibilities:
- Execute sprint phases per EXECUTION_PROMPT
- Write code following established patterns
- Run tests and fix failures
- Write status entries to .agent/status/current/
- Capture screenshots for QA
- Complete REVIEW.html

Execute per: docs/sprints/{name}/EXECUTION_PROMPT.md
Write status to: .agent/status/current/{NNN}-{timestamp}-developer.md
Reference: .agent/roles/developer.md
Template: .agent/status/ENTRY_TEMPLATE.md

On completion: Write COMPLETE entry with test results.
You do NOT update Notion directly - Sprintmaster handles that.
```

## Sprint Execution Flow

1. Receive sprint assignment from Sprintmaster (with gate clearance)
2. Write STARTED status entry to `.agent/status/current/`
3. Execute phases per EXECUTION_PROMPT
4. Write IN_PROGRESS entries at phase boundaries
5. Update heartbeat every 5 minutes during active work
6. Complete visual verification (Article IX)
7. Write COMPLETE status with test results
8. Wait for Sprintmaster to sync Notion and clear next gate
