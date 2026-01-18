# Sprintmaster Sync Algorithm

> Detailed reference for Notion sync ceremony implementation.
> Part of Sprintmaster v1.1 (Phase 3 of Coordination Infra v2)

---

## Overview

The sync ceremony runs at Sprintmaster startup to synchronize completed sprint entries from `.agent/status/current/` to the Notion Feature Roadmap database.

**Owner:** Sprintmaster (sync logic, Notion API calls)
**Infrastructure:** Randy/Chief of Staff (entry format, directories)

---

## Algorithm Steps

### Step 1: Scan Status Directory

```
SCAN: .agent/status/current/*.md
```

Use glob to find all markdown files in the status directory.

### Step 2: Parse and Filter

For each file:
1. Extract YAML frontmatter (between `---` markers)
2. Parse required fields: `status`, `notion_synced`, `sprint`, `sprint_id`, `phase`, `timestamp`
3. Filter: Keep only entries where:
   - `status: COMPLETE`
   - `notion_synced: false` (or missing/null)

```yaml
# Example entry that matches filter:
---
timestamp: 2026-01-14T06:00:00Z
sprint: coordination-infra-v2
sprint_id: 2e8780a78eef80558f58c754c9212b4e
phase: Phase 2 - Status Hardening
status: COMPLETE
notion_synced: false
---
```

### Step 3: Sprint ID Resolution

For each filtered entry:

**If `sprint_id` exists:** Use it directly

**If `sprint_id` is null/missing:**
1. Query Notion by sprint name:
   ```
   notion-search:
     query: {sprint name}
     data_source_url: collection://d94fde99-e81e-4a70-8cfa-9bc3317267c5
   ```

2. Evaluate results:
   - **1 match:** Use the page ID, mark for backfill
   - **0 matches:** Log error "Sprint not found in Notion", skip entry
   - **2+ matches:** Log error "Multiple matches - manual resolution needed", skip entry

### Step 4: Display Sync Ceremony

Show the ceremony UI with all syncable entries:

```
┌─────────────────────────────────────────────────────────────┐
│                 NOTION SYNC CEREMONY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Unsynced Completions: {count}                          │
│                                                             │
│  ┌───────────────────────┬─────────┬──────────┬───────┐    │
│  │ Sprint                │ Phase   │ Status   │ Time  │    │
│  ├───────────────────────┼─────────┼──────────┼───────┤    │
│  │ {sprint}              │ {phase} │ COMPLETE │ HH:MM │    │
│  └───────────────────────┴─────────┴──────────┴───────┘    │
│                                                             │
│  [Sync All]  [Dry Run]  [Skip]  [Details]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Wait for user response.

### Step 5: Execute Sync (on "Sync All")

For each entry in queue:

**5a. Update Notion Status:**
```
notion-update-page:
  page_id: {sprint_id}
  command: update_properties
  properties:
    Status: "✅ complete"
```

**5b. Append to Audit Notes:**
```
notion-update-page:
  page_id: {sprint_id}
  command: update_properties
  properties:
    Audit Notes: "{existing} + SYNCED {timestamp}: {phase} complete. Entry: {filename}"
```

Note: Read existing Audit Notes first, then append the sync record.

**5c. Handle Success:**
- Mark entry as synced
- Add to successes list

**5d. Handle Failure:**
- Log error message
- Add to failures list
- **Continue to next entry** (don't halt)

### Step 6: Update Local Entries

For each successful sync:

**6a. Set `notion_synced: true`:**
```yaml
notion_synced: true
```

**6b. Backfill `sprint_id` if resolved:**
```yaml
sprint_id: 2e8780a78eef80558f58c754c9212b4e
```

**6c. Write back to file:**
- Preserve markdown body unchanged
- Update only YAML frontmatter

### Step 7: Report Results

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC COMPLETE                             │
├─────────────────────────────────────────────────────────────┤
│  ✅ Synced: {N}                                             │
│  ❌ Failed: {M}                                             │
│                                                             │
│  {sprint-1} → ✅ complete                                   │
│  {sprint-2} → ❌ {error message}                            │
│                                                             │
│  Failed entries will retry on next startup.                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Flags

### `--dry-run`

Shows what would be synced without making any changes.

```
User: sync --dry-run

Sprintmaster:
Dry run - no changes will be made:

  Would sync: coordination-infra-v2
    Notion page: 2e8780a78eef80558f58c754c9212b4e
    Status: COMPLETE → ✅ complete

  Would sync: results-wiring-v1
    Notion page: (needs lookup by name)
    Status: COMPLETE → ✅ complete

2 entries would be synced. Run `sync` to execute.
```

### `--force`

Re-syncs entries even if `notion_synced: true`.

Use cases:
- Notion state got corrupted
- Need to re-apply status update
- Testing sync logic

```
User: sync --force

Sprintmaster:
Force sync - including already-synced entries:

  Re-syncing: coordination-infra-v2 (was synced 2026-01-14T06:15:00Z)

1 entry will be re-synced.
[Sync]  [Cancel]
```

### `sync {sprint-name}`

Syncs only the specified sprint.

```
User: sync results-wiring-v1

Sprintmaster:
Syncing 1 entry: results-wiring-v1

  results-wiring-v1 → ✅ complete

Done. 1/1 synced.
```

---

## Error Handling

| Error | Behavior | User Message |
|-------|----------|--------------|
| Sprint not found in Notion | Skip, continue | "Sprint not found in Notion" |
| Multiple Notion matches | Skip, continue | "Multiple matches - manual resolution needed" |
| Notion API error | Skip, continue | "{API error message}" |
| File read error | Skip, continue | "Could not read {filename}" |
| File write error | Log warning | "Synced to Notion but could not update local file" |

**Key principle:** Never halt on error. Sync what we can, report failures, retry next startup.

---

## Notion API Details

### Database Reference
- **Database ID:** `cb49453c-022c-477d-a35b-744531e7d161`
- **Data Source:** `collection://d94fde99-e81e-4a70-8cfa-9bc3317267c5`

### Fields Updated

| Field | Update |
|-------|--------|
| `Status` | Set to `"✅ complete"` |
| `Audit Notes` | Append sync record |

### Audit Notes Format

```
SYNCED {ISO timestamp}: {phase} complete. Entry: {filename}
```

Example:
```
SYNCED 2026-01-14T06:15:00Z: Phase 2 - Status Hardening complete. Entry: 003-2026-01-14T06-00-00Z-chief-of-staff.md
```

---

## Implementation Notes

### YAML Parsing

Use standard YAML frontmatter parsing:
1. Find first `---` line
2. Find second `---` line
3. Content between is YAML
4. Content after is markdown body

### File Writing

When updating local entry:
1. Parse existing file
2. Update only frontmatter fields
3. Preserve markdown body exactly
4. Write back with same formatting

### Idempotency

The sync is idempotent:
- If `notion_synced: true`, entry is skipped (unless `--force`)
- Re-running sync on same entries has no effect
- Safe to run multiple times

---

## Testing Checklist

Before marking Phase 3 complete:

- [ ] Scan finds entries in `.agent/status/current/`
- [ ] Filter correctly identifies COMPLETE + unsynced
- [ ] Sprint name lookup works
- [ ] Sprint ID backfill works
- [ ] Notion Status updates to "✅ complete"
- [ ] Audit Notes appended correctly
- [ ] Local `notion_synced` set to true
- [ ] `--dry-run` shows plan without changes
- [ ] `--force` re-syncs already-synced entries
- [ ] Errors logged and skipped, not halted
- [ ] Failed entries shown in report

---

*Sync Algorithm v1.0 - Part of Sprintmaster v1.1*
