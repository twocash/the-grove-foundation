# Status Entry Template

**Version:** 1.0
**Owner:** Randy (Chief of Staff)

---

## File Naming Convention

```
{NNN}-{timestamp}-{agent}.md
```

| Component | Format | Example |
|-----------|--------|---------|
| `{NNN}` | Zero-padded sequence (001-999) | `001` |
| `{timestamp}` | ISO 8601, colons→dashes | `2026-01-14T03-30-00Z` |
| `{agent}` | Role name, lowercase | `developer` |

**Example:** `001-2026-01-14T03-30-00Z-developer.md`

---

## Entry Schema

```yaml
---
# === REQUIRED FIELDS ===
timestamp: 2026-01-14T03:30:00Z      # ISO 8601 - when entry was written
sprint: results-wiring-v1            # Kebab-case sprint name
status: IN_PROGRESS                  # See Status State Machine below
agent: developer                     # Role: developer | sprintmaster | qa-reviewer | mine-sweeper
branch: main                         # Git branch name

# === TRACKING FIELDS ===
heartbeat: 2026-01-14T03:30:00Z      # Last activity - UPDATE IN-PLACE every 5 min
severity: INFO                       # INFO | WARN | URGENT | BLOCKER

# === NOTION SYNC FIELDS (Phase 3) ===
sprint_id:                           # Notion page UUID - backfilled by Sprintmaster
notion_synced: false                 # Flipped to true after successful Notion sync

# === OPTIONAL FIELDS ===
phase: Implementation                # Sprint phase name (if applicable)
commit:                              # Git commit hash (on COMPLETE)
---

## {timestamp} | {sprint} | {phase}

**Agent:** {agent} / {branch}
**Status:** {status}
**Summary:** {1-2 sentence description of what happened}
**Files:** {comma-separated list of key files changed}
**Tests:** {pass/total} or N/A
**Commit:** {hash} or TBD
**Unblocks:** {what this enables for other agents/sprints}
**Next:** {recommended next action}
```

---

## Status State Machine

```
Valid Transitions:
==================

  STARTED ──────────────► IN_PROGRESS ──────────────► COMPLETE
                               │
                               ▼
                           BLOCKED
                               │
                               ▼
                          IN_PROGRESS ──────────────► COMPLETE


State Definitions:
==================
  STARTED      Agent has begun work, initial entry written
  IN_PROGRESS  Active work underway, heartbeat should update
  BLOCKED      Cannot proceed - document blocker in Summary
  COMPLETE     All work done, tests pass, ready for sync
```

### Transition Rules

| From | To | Valid? | Notes |
|------|----|--------|-------|
| STARTED | IN_PROGRESS | ✅ | Normal flow |
| STARTED | COMPLETE | ⚠️ | Unusual - tiny fix? Log warning |
| IN_PROGRESS | COMPLETE | ✅ | Normal completion |
| IN_PROGRESS | BLOCKED | ✅ | Document blocker |
| BLOCKED | IN_PROGRESS | ✅ | Blocker resolved |
| COMPLETE | IN_PROGRESS | ⚠️ | Regression? Bug found? Log warning |

**⚠️ Warning transitions:** Not invalid, but Sprintmaster should flag for review.

---

## Severity Levels

| Level | When to Use | Sprintmaster Action |
|-------|-------------|---------------------|
| `INFO` | Normal progress | Display in log |
| `WARN` | Potential issue, not blocking | Highlight in dashboard |
| `URGENT` | Needs attention soon | Surface immediately at startup |
| `BLOCKER` | Cannot proceed, needs help | Alert + prevent new dispatches to this sprint |

---

## Heartbeat Protocol

**For IN_PROGRESS entries only:**

1. Write initial entry with current timestamp in `heartbeat`
2. Every 5 minutes of active work, update `heartbeat` field **in-place**
3. Only update the YAML frontmatter, not the markdown body
4. On status change, write a **new entry** (new sequence number)

**Staleness Detection:**
- Randy health check flags entries where `now - heartbeat > 30 minutes`
- Does NOT automatically change status - human review required

**Heartbeat Update (in-place):**
```yaml
# Only this line changes in the file:
heartbeat: 2026-01-14T03:35:00Z
```

---

## Notion Sync Fields

**sprint_id:**
- Leave empty if unknown
- Sprintmaster will match by sprint name against Feature Roadmap database
- Once matched, Sprintmaster backfills the UUID for future reference

**notion_synced:**
- Always start as `false`
- Sprintmaster sets to `true` after successful Notion API update
- Use `sync --force {sprint}` to re-sync if Notion state corrupted

---

## Example: Complete Entry

```yaml
---
timestamp: 2026-01-14T03:30:00Z
sprint: results-wiring-v1
status: COMPLETE
agent: developer
branch: main
heartbeat: 2026-01-14T03:30:00Z
severity: INFO
sprint_id: 2e8780a7-8eef-816d-a1da-fdbb73db9615
notion_synced: false
phase: Implementation
commit: 5b9e6e9
---

## 2026-01-14T03:30:00Z | Results Wiring v1 | Implementation

**Agent:** Developer / main
**Status:** COMPLETE
**Summary:** Real research results now display in GardenInspector instead of mock data. Multiple stability fixes for modal flashing and infinite loops.
**Files:** research-sprout.ts, ResearchSproutContext.tsx, GardenInspector.tsx, SproutRow.tsx, ExploreShell.tsx
**Tests:** 4/4 E2E tests pass
**Commit:** 5b9e6e9
**Unblocks:** Demo credibility - users see actual research findings
**Next:** Modal UX redesign (deferred to future sprint)
```

---

## Sequence Number Algorithm

```
When writing a new entry:
1. List files in .agent/status/current/
2. Extract highest sequence number (or 0 if empty)
3. next_seq = highest + 1
4. Attempt to create file: {next_seq}-{timestamp}-{agent}.md
5. If file exists (race condition):
   - Retry with next_seq + 1
   - Max 3 retries
   - If still failing, error: "Sequence collision after 3 retries"
```

---

*Entry Template v1.0 - Phase 2 of Coordination Infrastructure v2*
