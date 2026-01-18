# Sprintmaster Quick Commands

> Mobile-friendly command reference for SSH sessions.

---

## Pipeline Commands

| Command | Description |
|---------|-------------|
| `ready` | List sprints ready for execution |
| `active` | Show in-progress sprints |
| `blocked` | Show blocked items |
| `refresh` | Re-query Notion, update dashboard |

---

## Status Commands

| Command | Description |
|---------|-------------|
| `promote {sprint}` | Move sprint to next stage |
| `start {sprint}` | Begin sprint (updates Notion + shows developer prompt) |
| `review {sprint}` | Show REVIEW.html location + QA checklist |

---

## Agent Spawn Commands

| Command | Output |
|---------|--------|
| `spawn developer {sprint}` | Developer activation prompt |
| `spawn qa-reviewer {sprint}` | QA Reviewer activation prompt |
| `spawn mine-sweeper` | Mine Sweeper activation prompt |

### Examples

```
spawn developer results-wiring-v1
spawn qa-reviewer polish-demo-prep-v1
spawn mine-sweeper
```

---

## Status Progression

```
idea → draft-spec → needs-audit → ready → in-progress → complete
```

### Promote Examples

```
promote results-wiring-v1      # in-progress → complete
promote polish-demo-prep-v1    # ready → in-progress
```

---

## Notion Status Values

| Status | Emoji |
|--------|-------|
| idea | (none) |
| draft-spec | draft-spec |
| needs-audit | needs-audit |
| ready | ready |
| in-progress | in-progress |
| complete | complete |
| blocked | blocked |
| archived | archived |

---

## Reference Files

| File | Purpose |
|------|---------|
| `~/.claude/notes/grove-runbook.md` | Central reference |
| `~/.claude/notes/sprint-status-live.md` | Agent activity log |
| `.agent/roles/*.md` | Agent role definitions |
| `docs/sprints/{name}/EXECUTION_PROMPT.md` | Sprint handoff |

---

## Quick Workflows

### Start coding agent on ready sprint
```
start {sprint-name}
# → Updates Notion to in-progress
# → Outputs developer prompt
# → Copy to new window
```

### After sprint completes
```
review {sprint-name}
# → Check REVIEW.html
# → If all ACs pass: promote {sprint-name}
```

### Monitor parallel work
```
active
# → See all in-progress sprints
# → Check status log for updates
```
