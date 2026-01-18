# Phase 4: Dispatch Safety (MVP)

**Owner:** Randy (Chief of Staff)
**Consumer:** Sprintmaster
**Status:** DRAFT - PENDING APPROVAL

---

## Goal

Prevent agent collisions through pre-dispatch scanning with heartbeat-aware warnings.

---

## Scope (MVP)

| In Scope | Out of Scope (Future) |
|----------|----------------------|
| Pre-dispatch scan | Branch collision detection |
| Heartbeat-aware warnings | Automated queue processing |
| `--force` override flag | Capability verification |
| Sprint-level collision | Cross-sprint resource locks |

---

## Pre-Dispatch Flow

```
User: spawn developer {sprint}
           │
           ▼
┌──────────────────────────────┐
│   SCAN .agent/status/current │
│   Filter: sprint={sprint}    │
│   Filter: status=IN_PROGRESS │
└──────────────────────────────┘
           │
     ┌─────┴─────┐
     │           │
  No match    Match found
     │           │
     ▼           ▼
  DISPATCH   CHECK HEARTBEAT
     │           │
     │     ┌─────┴─────────┬────────────────┐
     │     │               │                │
     │   < 30 min      30-120 min       > 2 hours
     │     │               │                │
     │     ▼               ▼                ▼
     │  ⚠️ STRONG      ⚠️ SOFT          ℹ️ STALE
     │  "Active"       "May be stale"   "Likely abandoned"
     │     │               │                │
     │     └───────┬───────┴────────────────┘
     │             │
     │             ▼
     │     USER DECISION
     │     [Spawn Anyway] [Check Status] [Cancel]
     │             │
     │       spawn --force
     │             │
     └─────────────┴──────────────────────────────┐
                                                  │
                                                  ▼
                                           DISPATCH WITH
                                           TAKEOVER NOTICE
```

---

## Warning Severity Tiers

| Heartbeat Age | Severity | Message | Recommended Action |
|---------------|----------|---------|-------------------|
| < 30 min | ⚠️ STRONG | "Agent appears active" | Check status first |
| 30 min - 2 hr | ⚠️ SOFT | "Agent may be stale" | Proceed with caution |
| > 2 hours | ℹ️ INFO | "Agent likely abandoned" | Safe to takeover |

---

## UI: Pre-Dispatch Warning

### Strong Warning (< 30 min)

```
⚠️  DISPATCH BLOCKED: Active agent detected

Sprint: results-wiring-v1
Entry: 005-2026-01-14T08-00-00Z-developer.md
Status: IN_PROGRESS
Heartbeat: 5 minutes ago

This agent appears to be actively working.
Dispatching another agent may cause:
  - Merge conflicts
  - Wasted work
  - Git state corruption

[Check Status]  [Spawn Anyway (--force)]  [Cancel]
```

### Soft Warning (30 min - 2 hr)

```
⚠️  WARNING: Possibly stale agent detected

Sprint: results-wiring-v1
Entry: 005-2026-01-14T08-00-00Z-developer.md
Status: IN_PROGRESS
Heartbeat: 45 minutes ago

This agent may have crashed or been abandoned.
No heartbeat update in 45 minutes.

[Check Status]  [Spawn Anyway]  [Cancel]
```

### Info Notice (> 2 hr)

```
ℹ️  NOTE: Stale agent entry found

Sprint: results-wiring-v1
Entry: 005-2026-01-14T08-00-00Z-developer.md
Status: IN_PROGRESS
Heartbeat: 3 hours ago

This agent is likely abandoned. Safe to takeover.

[Spawn (takeover)]  [Clean up entry first]  [Cancel]
```

---

## --force Flag

Explicit override for dispatch warnings:

```
spawn developer results-wiring-v1 --force
```

Behavior:
- Skips warning prompt
- Logs override decision
- Adds takeover notice to activation prompt

### Activation Prompt with Takeover Notice

```
You are acting as DEVELOPER for sprint: results-wiring-v1.

⚠️ TAKEOVER NOTICE: Previous agent may still be active.
Entry: 005-2026-01-14T08-00-00Z-developer.md
Last heartbeat: 2026-01-14T08:25:00Z

If you encounter conflicts, check with Sprintmaster before proceeding.

Execute per: docs/sprints/results-wiring-v1/EXECUTION_PROMPT.md
Write status to: .agent/status/current/{NNN}-{timestamp}-developer.md
...
```

---

## Algorithm: Pre-Dispatch Scan

```javascript
function preDispatchCheck(sprintName) {
  // 1. Scan current status entries
  const entries = glob('.agent/status/current/*.md')

  // 2. Filter for this sprint + IN_PROGRESS
  const conflicts = entries.filter(entry => {
    const yaml = parseYaml(entry)
    return yaml.sprint === sprintName &&
           yaml.status === 'IN_PROGRESS'
  })

  // 3. If no conflicts, allow dispatch
  if (conflicts.length === 0) {
    return { clear: true }
  }

  // 4. Calculate heartbeat age
  const conflict = conflicts[0] // Most recent
  const heartbeatAge = now() - parseDate(conflict.heartbeat)
  const ageMinutes = heartbeatAge / (1000 * 60)

  // 5. Return warning with severity
  return {
    clear: false,
    entry: conflict,
    ageMinutes: ageMinutes,
    severity: ageMinutes < 30 ? 'strong' :
              ageMinutes < 120 ? 'soft' : 'info'
  }
}
```

---

## Implementation Location

This logic lives in **Sprintmaster skill** (spawn command handler).

### Files to Modify

| File | Change |
|------|--------|
| `~/.claude/skills/sprintmaster/skill.md` | Add pre-dispatch check to spawn command |

### Integration Points

1. `spawn developer {sprint}` - Add pre-dispatch scan before output
2. `spawn developer {sprint} --force` - Override with logging
3. Activation prompt template - Add takeover notice when --force

---

## Acceptance Criteria

- [ ] `spawn developer X` scans for IN_PROGRESS entries on sprint X
- [ ] Warning shown if conflict found (heartbeat-aware severity)
- [ ] `--force` flag bypasses warning with takeover notice
- [ ] Activation prompt includes takeover notice when --force used
- [ ] No new infrastructure needed (uses existing status entries)

---

## Dependencies

- Phase 2 complete (status entries with heartbeat field) ✅
- Sprintmaster skill v1.1 (spawn command exists) ✅

---

## Future Enhancements (Not MVP)

| Enhancement | Rationale |
|-------------|-----------|
| Branch collision detection | Lower frequency issue |
| Auto-cleanup stale entries | Requires careful design |
| Parallel dispatch suggestions | Needs worktree integration |
| Capability verification | Nice-to-have |

---

*Phase 4 Plan v1.0 — Randy (Chief of Staff)*
