# Phase 3: Notion Sync Automation

**Owner:** Randy (Chief of Staff)
**Consumer:** Sprintmaster
**Status:** READY FOR IMPLEMENTATION

---

## Goal

Automate sync between `.agent/status/current/` entries and Notion Feature Roadmap database, eliminating manual Notion updates and drift.

---

## Sprintmaster Sync Ceremony

### Trigger
Sprintmaster startup (every session)

### Flow

```
1. Scan .agent/status/current/*.md
2. Parse YAML frontmatter
3. Filter: status=COMPLETE AND notion_synced=false
4. Display sync prompt with entry list
5. On [Sync All]: Execute sync, update entries
6. Report results
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│                 NOTION SYNC CEREMONY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Unsynced Completions: 2                                │
│                                                             │
│  ┌───────────────────────┬─────────┬──────────┬───────┐    │
│  │ Sprint                │ Phase   │ Status   │ Time  │    │
│  ├───────────────────────┼─────────┼──────────┼───────┤    │
│  │ coordination-infra-v2 │ Phase 2 │ COMPLETE │ 06:00 │    │
│  │ results-wiring-v1     │ Impl    │ COMPLETE │ 03:30 │    │
│  └───────────────────────┴─────────┴──────────┴───────┘    │
│                                                             │
│  [Sync All]  [Dry Run]  [Skip]  [Details]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Algorithm Detail

### Step 1: Scan

```javascript
const files = glob('.agent/status/current/*.md')
```

### Step 2: Parse

```javascript
for (file of files) {
  const content = read(file)
  const { frontmatter, body } = parseYaml(content)

  if (frontmatter.status === 'COMPLETE' &&
      frontmatter.notion_synced === false) {
    queue.push({ file, frontmatter, body })
  }
}
```

### Step 3: Match sprint_id

```javascript
for (entry of queue) {
  if (!entry.frontmatter.sprint_id) {
    // Query Notion by sprint name
    const results = await notion.search({
      query: entry.frontmatter.sprint,
      database: 'cb49453c-022c-477d-a35b-744531e7d161'
    })

    if (results.length === 1) {
      entry.frontmatter.sprint_id = results[0].id
      entry.needsBackfill = true
    } else if (results.length === 0) {
      entry.error = 'Sprint not found in Notion'
    } else {
      entry.error = 'Multiple matches - manual resolution needed'
    }
  }
}
```

### Step 4: Sync to Notion

```javascript
for (entry of queue) {
  if (entry.error) {
    failures.push(entry)
    continue
  }

  try {
    // Update Status property
    await notion.updatePage({
      page_id: entry.frontmatter.sprint_id,
      properties: {
        'Status': '✅ complete'
      }
    })

    // Append to Audit Notes
    const auditNote = `\n\n---\n**${entry.frontmatter.timestamp}** | Phase: ${entry.frontmatter.phase} | Agent: ${entry.frontmatter.agent}\n${entry.body.summary}`

    await notion.updatePage({
      page_id: entry.frontmatter.sprint_id,
      command: 'insert_content_after',
      // Append to existing content
    })

    entry.synced = true
    successes.push(entry)

  } catch (err) {
    entry.error = err.message
    failures.push(entry)
  }
}
```

### Step 5: Update Local Entry

```javascript
for (entry of successes) {
  // Update YAML frontmatter
  entry.frontmatter.notion_synced = true

  // Backfill sprint_id if matched
  if (entry.needsBackfill) {
    // sprint_id already set in Step 3
  }

  // Write back to file
  writeYamlEntry(entry.file, entry.frontmatter, entry.body)
}
```

### Step 6: Report

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC COMPLETE                             │
├─────────────────────────────────────────────────────────────┤
│  ✅ Synced: 2                                               │
│  ❌ Failed: 0                                               │
│                                                             │
│  coordination-infra-v2 → ✅ complete                        │
│  results-wiring-v1     → ✅ complete                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Flags

| Flag | Behavior |
|------|----------|
| `--dry-run` | Show what would sync, no writes to Notion or files |
| `--force` | Re-sync even if notion_synced=true (recovery) |

---

## Failure Handling

| Scenario | Behavior |
|----------|----------|
| Sprint not found | Log error, skip, continue |
| Multiple matches | Log error, skip, require manual resolution |
| Notion API error | Log error, skip, continue |
| File write error | Log error, skip, continue |
| Any failure | Retry on next Sprintmaster startup |

### End Report with Failures

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNC COMPLETE                             │
├─────────────────────────────────────────────────────────────┤
│  ✅ Synced: 1                                               │
│  ❌ Failed: 1                                               │
│                                                             │
│  coordination-infra-v2 → ✅ complete                        │
│  unknown-sprint-v1     → ❌ Sprint not found in Notion      │
│                                                             │
│  Failed entries will retry on next startup.                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Location

This logic lives in **Sprintmaster skill**, not Randy.

Randy owns the infrastructure (entry format, directories).
Sprintmaster owns the ceremony (sync logic, Notion API calls).

### Files to Create/Modify

| File | Change |
|------|--------|
| `~/.claude/skills/sprintmaster/skill.md` | Add sync ceremony to startup protocol |
| `~/.claude/skills/sprintmaster/sync.md` | New file: sync algorithm reference |

---

## Acceptance Criteria

- [ ] Sprintmaster startup scans `.agent/status/current/`
- [ ] Unsynced COMPLETE entries displayed in ceremony UI
- [ ] [Sync All] updates Notion Status to "complete"
- [ ] [Sync All] appends completion context to Audit Notes
- [ ] sprint_id backfilled to YAML on successful match
- [ ] notion_synced set to true on successful sync
- [ ] --dry-run shows plan without writes
- [ ] --force re-syncs already-synced entries
- [ ] Failures logged, skipped, reported at end
- [ ] Failed entries retry on next startup

---

## Dependencies

- Phase 2 complete (entry format with notion_synced field) ✅
- Notion MCP tools available ✅
- Feature Roadmap database ID known ✅

---

*Phase 3 Plan v1.0 — Randy (Chief of Staff)*
