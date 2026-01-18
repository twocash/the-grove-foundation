# Phase 2: Status Log Hardening - Implementation Plan

**Owner:** Randy (Chief of Staff)
**Reviewer:** Sprintmaster
**Status:** DRAFT - Pending Review
**Created:** 2026-01-14

---

## Overview

Harden the status logging system to support:
- Concurrent agent writes (numbered files vs single file)
- Staleness detection (heartbeat + TTL)
- Notion sync preparation (sprint_id + notion_synced fields)
- Machine parsing (YAML frontmatter) + Human readability (markdown body)

---

## Decisions (From Sprintmaster Consultation)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Migration strategy | New entries only | Don't risk historical record |
| Format | Hybrid YAML + markdown | Both machine-parseable and human-readable |
| Notion sync mode | Confirmation-required | Batch review at Sprintmaster startup |
| Legacy log | Read-only archive | `sprint-status-live.md` stays as historical reference |

---

## Deliverables

### D1: Entry File Schema

**Location:** `.agent/status/current/{NNN}-{timestamp}-{agent}.md`

**Naming Convention:**
- `{NNN}` - Zero-padded sequence number (001, 002, etc.)
- `{timestamp}` - ISO 8601, colons replaced with dashes (2026-01-14T03-30-00Z)
- `{agent}` - Role name (developer, sprintmaster, etc.)

**Example:** `001-2026-01-14T03-30-00Z-developer.md`

**Schema:**

```yaml
---
# Required fields
timestamp: 2026-01-14T03:30:00Z      # ISO 8601
sprint: results-wiring-v1            # Kebab-case sprint name
status: COMPLETE                     # STARTED | IN_PROGRESS | COMPLETE | BLOCKED
agent: developer                     # Role name
branch: main                         # Git branch

# Tracking fields
heartbeat: 2026-01-14T03:30:00Z      # Last activity timestamp
severity: INFO                       # INFO | WARN | URGENT | BLOCKER

# Notion sync fields
sprint_id: 2e8780a7-8eef-816d-...    # Notion page UUID (optional until linked)
notion_synced: false                 # Flipped to true after Sprintmaster sync

# Optional fields
phase: Implementation                # Sprint phase name
commit: 5b9e6e9                      # Git commit hash
---

## {timestamp} | {sprint} | {phase}

**Agent:** {agent} / {branch}
**Status:** {status}
**Summary:** {1-2 sentence description}
**Files:** {comma-separated list}
**Tests:** {pass count}/{total count} or N/A
**Commit:** {hash}
**Unblocks:** {what this enables}
**Next:** {recommended action}
```

### D2: Sequence Number Management

**Problem:** Multiple agents need unique sequence numbers without collision.

**Solution:** Atomic file creation with retry.

```
Algorithm:
1. List files in .agent/status/current/
2. Extract highest sequence number (or 0 if empty)
3. Attempt to create file with next_seq = highest + 1
4. If file exists (race condition), retry with next_seq + 1
5. Max 3 retries, then fail with error
```

**Implementation:** Shell function in agent startup scripts, or inline logic in skill files.

### D3: Heartbeat Protocol

**For IN_PROGRESS entries:**

1. Agent writes entry with `status: IN_PROGRESS` and initial `heartbeat`
2. Every 5 minutes of active work, agent updates `heartbeat` field
3. On completion, agent writes new entry with `status: COMPLETE`

**Staleness Detection (Randy's health check):**

```
For each IN_PROGRESS entry:
  If (now - heartbeat) > 30 minutes:
    Flag as POTENTIALLY_STALE
    Report: "Agent {agent} on {sprint} - no heartbeat in {X} minutes"
```

**Note:** Heartbeat updates modify the existing file (same sequence number). This is the one case where we overwrite rather than append.

### D4: Notion Sync Fields

**Fields for sync:**

| Field | Purpose |
|-------|---------|
| `sprint_id` | Notion page UUID for direct API update |
| `notion_synced` | Boolean flag for sync status |

**Workflow:**

1. Developer writes COMPLETE entry with `notion_synced: false`
2. Sprintmaster startup scans for `status: COMPLETE` AND `notion_synced: false`
3. Sprintmaster displays batch confirmation UI
4. On user approval, Sprintmaster:
   - Updates Notion page status to "complete"
   - Updates entry file: `notion_synced: true`

**sprint_id population:**
- If agent knows the Notion page ID, include it
- If not, Sprintmaster can match by `sprint` name against Feature Roadmap database
- Once matched, Sprintmaster backfills `sprint_id` for future reference

### D5: Archive Rotation

**Trigger:** Sprint status changes to COMPLETE

**Action:**
1. Identify all entries where `sprint` matches completed sprint name
2. Move to `.agent/status/archive/{sprint-name}/`
3. Keep entry filenames intact for traceability

**Example:**
```
.agent/status/archive/results-wiring-v1/
├── 001-2026-01-14T02-15-00Z-developer.md
├── 002-2026-01-14T02-45-00Z-developer.md
└── 003-2026-01-14T03-30-00Z-developer.md
```

**Bounded current directory:**
- Keep only last 50 entries in `current/`
- Weekly rotation: entries older than 7 days → `archive/by-date/{YYYY-MM-DD}/`

---

## Migration Strategy

**Legacy file:** `~/.claude/notes/sprint-status-live.md`

**Approach:** Freeze, don't migrate.

1. Mark legacy file as read-only (add header comment)
2. All new entries go to `.agent/status/current/`
3. Legacy file remains as historical reference
4. Optional Phase 5 task: parse legacy entries into archive format

**Header to add to legacy file:**

```markdown
<!--
LEGACY STATUS LOG - READ ONLY
==============================
This file is archived as of 2026-01-14.
New status entries go to: .agent/status/current/

Do not append new entries here.
-->
```

---

## Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC1 | New entries use YAML frontmatter + markdown body | Inspect sample entry |
| AC2 | Entries have unique sequence numbers | Create 3 entries, verify no collision |
| AC3 | Heartbeat field present in IN_PROGRESS entries | Write IN_PROGRESS entry, check field |
| AC4 | Staleness detection flags entries > 30 min without heartbeat | Mock stale entry, run Randy health check |
| AC5 | `notion_synced: false` on new COMPLETE entries | Write COMPLETE entry, check field |
| AC6 | Legacy sprint-status-live.md marked read-only | Check header comment |
| AC7 | Archive rotation moves completed sprint entries | Complete a sprint, verify archive |

---

## Implementation Steps

### Step 1: Create Entry Template

Create `.agent/status/ENTRY_TEMPLATE.md` as reference for agents.

### Step 2: Update Agent Role Files

Update `.agent/roles/developer.md` and others with new status writing protocol.

### Step 3: Freeze Legacy Log

Add read-only header to `~/.claude/notes/sprint-status-live.md`.

### Step 4: Update Randy Health Check

Modify Randy skill to:
- Check `.agent/status/current/` instead of legacy file
- Implement staleness detection algorithm
- Report unsynced COMPLETE entries

### Step 5: Test with Sample Entries

Create 3 test entries to verify:
- Sequence numbering
- YAML parsing
- Heartbeat detection

### Step 6: Update Runbook

Document new status protocol in `~/.claude/notes/grove-runbook.md`.

---

## Open Questions

1. **Heartbeat update mechanism:** Should agents update heartbeat in-place, or write a new entry with same sprint/status?
   - Recommendation: In-place update (simpler, single file per active sprint)

2. **Sprint ID discovery:** How should we handle entries without sprint_id?
   - Recommendation: Sprintmaster matches by name, backfills ID

3. **Concurrent Sprintmaster sessions:** What if two Sprintmaster sessions try to sync same entry?
   - Recommendation: Check `notion_synced` before updating, skip if already true

---

## Timeline

**Dependency:** None (Phase 0 complete)

**Estimated effort:** 2-3 focused sessions

**Blocks:** Phase 3 (Notion sync automation)

---

*Phase 2 Plan v1.0 - Draft for Sprintmaster review*
