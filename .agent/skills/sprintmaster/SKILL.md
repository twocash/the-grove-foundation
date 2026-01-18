---
name: sprintmaster
description: Sprint warmup and pipeline dashboard for quick session starts. Triggers on "sprintmaster", "let's roll", "sprint status", "what's cooking", "production setup". Perfect for mobile/remote SSH sessions. Provides agent dispatch commands for multi-window workflows.
version: 1.2
---

# Sprintmaster Skill

> Quick session warmup for Grove Foundation sprint coordination.
> Mobile-optimized. SSH-friendly. Multi-window dispatch.
> **v1.1:** Added Notion sync ceremony on startup.
> **v1.2:** Added dispatch safety protocol with heartbeat-aware warnings.

---

## Warmup Protocol

When this skill is invoked, follow these steps:

### Step 1: Load Context

Read the Grove Runbook for reference:
```
~/.claude/notes/grove-runbook.md
```

### Step 2: Check Agent Activity (v2 Format)

**Primary:** Scan the new status directory:
```
.agent/status/current/*.md
```

Parse YAML frontmatter from each entry. Report:
- Recent activity (last 24 hours)
- Any IN_PROGRESS entries with stale heartbeats (>30 min)
- Any BLOCKED entries needing attention

**Fallback:** If no entries in new format, read legacy log:
```
~/.claude/notes/sprint-status-live.md (READ-ONLY - FROZEN)
```

### Step 3: Notion Sync Ceremony

**Before querying Notion, check for unsynced completions.**

Scan `.agent/status/current/*.md` for entries where:
- `status: COMPLETE`
- `notion_synced: false`

If unsynced entries found, display sync ceremony:

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

**User responses:**
- `sync all` or `sync` → Execute sync (see Sync Algorithm below)
- `dry run` → Show what would sync without writes
- `skip` → Continue to pipeline dashboard
- `details` → Show full entry content for each

### Step 4: Query Pipeline Status

Query the **Grove Feature Roadmap** database for:

1. **In Progress** - Sprints currently being worked
   - Filter: Status = "in-progress"

2. **Ready Queue** - Sprints ready to start
   - Filter: Status = "ready"

3. **Blocked Items** - Sprints needing attention
   - Filter: Status = "blocked"

4. **Draft Specs** - Sprints being planned
   - Filter: Status = "draft-spec"

5. **Product Specs** - Sprints being planned by the Product Pod
   - Filter: Status = "product-spec"

### Step 5: Display Dashboard

Show a mobile-friendly status dashboard:

```
GROVE SPRINTMASTER - Pipeline Status
=====================================

IN PROGRESS (count)
└── {sprint name} [{domain}]
    Last activity: {timestamp from status log}

READY (count)
└── {sprint name} [{priority}]
└── {sprint name} [{priority}]

BLOCKED (count)
└── {sprint name}: {audit notes}

DRAFT (count)
└── {sprint name}

PRODUCT (count)
└── {sprint name}

-------------------------------------
RECOMMENDED: {specific next action}
=====================================
```

### Step 6: Recommend Action

Based on pipeline state, recommend ONE of:
- "Monitor {sprint} - coding agent executing"
- "QA review {sprint} - REVIEW.html ready"
- "Start {sprint} - next in ready queue"
- "Unblock {sprint} - needs {dependency}"
- "Promote {sprint} - artifacts complete"

---

## Notion Sync Algorithm

Reference: `~/.claude/skills/sprintmaster/sync.md`

### Quick Reference

**Sync All Flow:**
```
1. For each unsynced COMPLETE entry:
   a. If sprint_id missing → query Notion by sprint name → backfill
   b. Update Notion Status → "✅ complete"
   c. Append to Notion Audit Notes
   d. Update local entry: notion_synced=true
   e. Report success/failure

2. Continue to next entry on failure (don't halt)

3. Show final report:
   ✅ Synced: N
   ❌ Failed: M (will retry next startup)
```

**Notion Update Format:**
```
Properties to update:
  Status: "✅ complete"

Audit Notes append:
  SYNCED {timestamp}: {phase} complete. Entry: {filename}
```

### Flags

| Flag | Behavior |
|------|----------|
| `sync --dry-run` | Show plan without writes |
| `sync --force` | Re-sync even if notion_synced=true |
| `sync {sprint}` | Sync specific sprint only |

---

## Dispatch Safety Protocol

**Before outputting any spawn command**, perform a pre-dispatch safety check.

### Pre-Dispatch Scan

```
1. Scan .agent/status/current/*.md
2. Filter: entries where sprint matches AND status IN (STARTED, IN_PROGRESS)
3. If matches found → show warning based on heartbeat age
4. If --force flag → skip warning, proceed with takeover notice
```

### Heartbeat-Aware Warning Tiers

| Heartbeat Age | Warning Level | Message |
|---------------|---------------|---------|
| < 30 min | 🔴 **STRONG** | "ACTIVE agent on this sprint. Last heartbeat: {time}" |
| 30 min - 2 hr | 🟡 **MEDIUM** | "Stale session detected. Last heartbeat: {time}" |
| > 2 hr | 🟢 **LIGHT** | "Abandoned session? Last heartbeat: {time}" |

### Warning Display

```
┌─────────────────────────────────────────────────────────────┐
│              ⚠️  DISPATCH SAFETY CHECK                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sprint: {sprint-name}                                      │
│  Existing Agent: {agent-role} (entry: {filename})          │
│  Status: {IN_PROGRESS|STARTED}                             │
│  Last Heartbeat: {timestamp} ({age} ago)                   │
│                                                             │
│  {Warning message based on tier}                           │
│                                                             │
│  [Proceed Anyway]  [Cancel]  [View Entry]                  │
│                                                             │
│  Tip: Use `spawn {role} {sprint} --force` to skip warning  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### --force Flag

`spawn {role} {sprint} --force` bypasses the warning dialog but:
- Still logs the takeover event
- Adds TAKEOVER NOTICE to activation prompt
- Does NOT mark previous entry as abandoned (agent may still write COMPLETE)

### Takeover Notice (in activation prompt)

When dispatching over an existing session, append to activation prompt:

```
---
⚠️ TAKEOVER NOTICE: Previous {role} session detected.
Previous entry: {filename}
Last heartbeat: {timestamp}
If previous agent completes, coordination may be needed.
---
```

---

## Quick Commands

After warmup, respond to these commands:

| Command | Action |
|---------|--------|
| `ready` | List sprints with Status = "ready" |
| `active` | List sprints with Status = "in-progress" |
| `blocked` | List sprints with Status = "blocked" |
| `promote {sprint}` | Update Notion status to next stage |
| `start {sprint}` | Update to "in-progress" + output developer prompt |
| `review {sprint}` | Show REVIEW.html location + QA checklist |
| `spawn developer {sprint}` | Output activation prompt for Developer agent (with safety check) |
| `spawn developer {sprint} --force` | Skip safety warning, include takeover notice |
| `spawn qa-reviewer {sprint}` | Output activation prompt for QA Reviewer (with safety check) |
| `spawn qa-reviewer {sprint} --force` | Skip safety warning, include takeover notice |
| `spawn mine-sweeper` | Output activation prompt for Mine Sweeper |
| `spawn product-pod {sprint}` | Assemble the Product Pod for a new initiative |
| `refresh` | Re-query Notion and update dashboard |
| `sync` | Run Notion sync ceremony |
| `sync --dry-run` | Show sync plan without executing |
| `sync --force` | Re-sync already-synced entries |

---

## Agent Dispatch (spawn commands)

When user says `spawn {role} {sprint}`, perform the **Dispatch Safety Protocol** first, then output a ready-to-paste activation prompt.

**Safety Check Flow:**
1. Run pre-dispatch scan (see Dispatch Safety Protocol)
2. If conflict found and no `--force` → show warning, wait for user response
3. If `--force` or user confirms → output prompt with TAKEOVER NOTICE if applicable
4. If no conflict → output prompt normally

### spawn developer {sprint-name}

```
You are acting as DEVELOPER for sprint: {sprint-name}.

Your responsibilities:
- Execute sprint phases per EXECUTION_PROMPT
- Implement code changes per specification
- Write status updates to .agent/status/current/
- Capture screenshots for visual verification
- Complete REVIEW.html with acceptance criteria evidence
- Run tests and fix failures

Execute per: docs/sprints/{sprint-name}/EXECUTION_PROMPT.md
Write status to: .agent/status/current/{NNN}-{timestamp}-developer.md
Template: .agent/status/ENTRY_TEMPLATE.md
Reference: .agent/roles/developer.md

On completion: Write COMPLETE entry with test results.
You do NOT update Notion directly - Sprintmaster handles that.

{TAKEOVER_NOTICE if applicable - see Dispatch Safety Protocol}
```

### spawn qa-reviewer {sprint-name}

```
You are acting as QA REVIEWER for sprint: {sprint-name}.

Your responsibilities:
- Review REVIEW.html against SPEC.md
- Verify screenshots match acceptance criteria
- Check test coverage
- Write bug reports with reproduction steps
- Verify all ACs are PASS (not PENDING)

Review: docs/sprints/{sprint-name}/REVIEW.html against SPEC.md
Reference: .agent/roles/qa-reviewer.md

You do NOT fix bugs directly - write bug reports for Developer.
You do NOT update Notion - Sprintmaster handles that.

{TAKEOVER_NOTICE if applicable - see Dispatch Safety Protocol}
```

### spawn mine-sweeper

```
You are acting as MINE SWEEPER for Grove Foundation test health.

Your mission:
- Clear test debt without introducing regressions
- Respect strangler fig boundaries (FROZEN vs ACTIVE zones)
- Provide visual evidence for every fix
- Archive legacy tests properly

Protocol: Daily Sweep (Survey -> Triage -> Disarm -> Archive -> Report)
Evidence: screenshots + REVIEW.html for every change
Write status to: .agent/status/current/{NNN}-{timestamp}-mine-sweeper.md
Template: .agent/status/ENTRY_TEMPLATE.md
Reference: .agent/roles/mine-sweeper.md

FROZEN ZONES (Legacy - Do Not Touch):
- src/components/Terminal/*
- src/foundation/*
- pages/TerminalPage.tsx

ACTIVE BUILD ZONES (Where We Work):
- src/bedrock/*
- src/explore/*
- src/core/*

On explosions (regressions): HALT immediately, document, and revert.
```

### spawn product-pod {initiative-name}

```
You are assembling the PRODUCT POD for initiative: {initiative-name}.

This pod consists of three agents working collaboratively:
1. User Experience Chief — Guardian of DEX alignment, takes first draft
2. Product Manager — Reviews for details, UX elegance, roadmap fit
3. UI/UX Designer — Owns the "how" (user interaction)

**WORKFLOW:**
1. UX Chief drafts Product Brief with Advisory Council input
2. PM reviews for missing details, UX elegance, roadmap priorities
3. Designer creates wireframes within approved constraints
4. UX Chief gives final approval
5. Present to user for review
6. Handoff to user-story-refinery

---
**TERMINAL 1: User Experience Chief**
---
You are acting as USER EXPERIENCE CHIEF for initiative: {initiative-name}.

Your mission: Lead the pod by drafting an initial DEX-aligned Product Brief.

**Before drafting:**
1. Consult Advisory Council (Park for feasibility, Adams for engagement)
2. Identify DEX pillar requirements for this feature
3. Include "fertile soil" analysis — how does this enable future agentic work?

**Your authority:**
- VETO features that violate DEX principles
- ENFORCE GroveObject model and Kinetic Framework patterns
- APPROVE final package before user presentation

**Output:** Initial Product Brief per template in skill
**Reference:** ~/.claude/skills/PRODUCT_POD_PLAYBOOK.md
---
**TERMINAL 2: Product Manager**
---
You are acting as PRODUCT MANAGER for initiative: {initiative-name}.

Your mission: Review the UX Chief's draft brief for completeness and strategic fit.

**Review checklist:**
- Missing details or unclear requirements?
- Practical and elegant user experience?
- Roadmap priority alignment — does this make sense now?
- "Fertile soil" — how does this enable future agentic work?

**Output:** Review feedback or approval to proceed to design
**Reference:** ~/.claude/skills/PRODUCT_POD_PLAYBOOK.md
---
**TERMINAL 3: UI/UX Designer**
---
You are acting as UI/UX DESIGNER for initiative: {initiative-name}.

Your mission: Translate the approved brief into an intuitive, philosophically-consistent user experience.

**Core principles to defend:**
- Objects Not Messages (Kinetic Framework)
- Lenses Shape Reality (persona-reactive rendering)
- Configuration Over Code (declarative customization)

**Before designing:**
1. Review existing patterns (GroveCard, StatusBadge, etc.)
2. Consult Short (narrative) and Adams (engagement) for UI guidance

**Output:** Wireframe package with accessibility checklist
**Reference:** ~/.claude/skills/PRODUCT_POD_PLAYBOOK.md
---

Copy the activation prompt for each role into a new terminal to start the pod.
```

---

## Notion Integration

### Database: Grove Feature Roadmap
- **ID:** `cb49453c-022c-477d-a35b-744531e7d161`
- **Data Source:** `collection://d94fde99-e81e-4a70-8cfa-9bc3317267c5`

### Status Updates

To promote a sprint:
```
notion-update-page:
  page_id: {sprint page id}
  command: update_properties
  properties:
    Status: "{new status}"
```

Status progression:
```
idea → draft-spec → needs-audit → ready → in-progress → complete
```

---

## Reference Files

For detailed information, read:
- `~/.claude/notes/grove-runbook.md` - Central reference
- `.agent/roles/*.md` - Agent role definitions
- `.agent/status/ENTRY_TEMPLATE.md` - Status entry format
- `~/.claude/skills/sprintmaster/sync.md` - Sync algorithm details
- `docs/BEDROCK_SPRINT_CONTRACT.md` - Binding contract

---

## Example Session

```
User: sprintmaster

Agent: [Reads runbook, scans status entries]

┌─────────────────────────────────────────────────────────────┐
│                 NOTION SYNC CEREMONY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 Unsynced Completions: 1                                │
│                                                             │
│  ┌───────────────────────┬─────────┬──────────┬───────┐    │
│  │ coordination-infra-v2 │ Phase 2 │ COMPLETE │ 06:00 │    │
│  └───────────────────────┴─────────┴──────────┴───────┘    │
│                                                             │
│  [Sync All]  [Dry Run]  [Skip]  [Details]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

User: sync all

Agent: [Syncs to Notion]

┌─────────────────────────────────────────────────────────────┐
│                    SYNC COMPLETE                             │
├─────────────────────────────────────────────────────────────┤
│  ✅ Synced: 1                                               │
│  ❌ Failed: 0                                               │
│                                                             │
│  coordination-infra-v2 → ✅ complete                        │
└─────────────────────────────────────────────────────────────┘

[Queries Notion]

GROVE SPRINTMASTER - Pipeline Status
=====================================

IN PROGRESS (0)

READY (0)

BLOCKED (0)

DRAFT (2)
└── GardenInspector Modal Redesign [explore]
└── Dev Team Infrastructure [infrastructure]

COMPLETE (recent)
└── Coordination Infra v2 [infrastructure] ✅

-------------------------------------
RECOMMENDED: Promote "GardenInspector Modal Redesign" to ready
=====================================

User: spawn developer modal-redesign-v1

Agent: Here's the activation prompt for a Developer agent:

---
You are acting as DEVELOPER for sprint: modal-redesign-v1.

Execute per: docs/sprints/modal-redesign-v1/EXECUTION_PROMPT.md
Write status to: .agent/status/current/{NNN}-{timestamp}-developer.md
Template: .agent/status/ENTRY_TEMPLATE.md
Reference: .agent/roles/developer.md

On completion: Write COMPLETE entry with test results.
---

Copy this to a new terminal window to start the Developer agent.
```

---

*Sprintmaster v1.2 - Mobile-optimized sprint coordination with Notion sync + dispatch safety*
