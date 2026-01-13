# Grove Foundation Agent Context

This directory contains agent coordination artifacts for the Grove Foundation project.

## Purpose

Standardized location for agent-related context, inspired by the Navigator plugin ecosystem but customized for Grove's sprint-aligned workflow.

## Structure

```
.agent/
├── README.md           # This file
└── roles/
    ├── sprintmaster.md # Sprintmaster role definition
    ├── developer.md    # Developer role definition
    └── qa-reviewer.md  # QA Reviewer role definition
```

## Status Log

Agent status updates are logged to: `~/.claude/notes/sprint-status-live.md`

See Bedrock Sprint Contract Article X (Section 6.4) for the status protocol.

## Role Activation

Reference the appropriate role file when starting a session:

```
# Sprintmaster
"Act as Sprintmaster per .agent/roles/sprintmaster.md"

# Developer
"Act as Developer for sprint X per .agent/roles/developer.md"

# QA Reviewer
"Act as QA Reviewer for sprint X per .agent/roles/qa-reviewer.md"
```

## Related Documents

- `docs/BEDROCK_SPRINT_CONTRACT.md` - Governing contract (Article X defines roles)
- `~/.claude/notes/sprint-status-live.md` - Live status log
- `~/.claude/plans/` - Active sprint plans

## Version

Protocol Version: 1.0
Contract Version: 1.3
