# How to Use the Foundation Loop

This guide explains how to use the Foundation Loop methodology for planning and executing development work on Grove Terminal (or any software project).

## What Is the Foundation Loop?

The Foundation Loop is a structured approach to software development that:

1. **Plans before coding** — Creates 8 documentation artifacts that define what, why, and how
2. **Embeds testing** — Every sprint includes tests for critical paths
3. **Enables handoff** — Produces self-contained execution prompts for AI agents or developers
4. **Tracks progress** — Maintains dev logs for continuity across sessions

## When to Use It

**Use the Foundation Loop for:**
- New features that touch multiple files
- Refactoring existing systems
- Infrastructure changes
- Bug fixes requiring investigation
- Any work that benefits from planning

**Skip it for:**
- Typo fixes
- Single-line config changes
- Trivial updates

## Quick Start

### Option 1: Ask Claude

Say any of these:
- "Let's plan a sprint for [feature]"
- "Start a Foundation Loop for [task]"
- "Create a sprint for refactoring [system]"

Claude will guide you through the process.

### Option 2: Use the Script

```bash
node skills/scripts/init-sprint.js my-feature-v1
```

This creates all 8 artifact templates in `docs/sprints/my-feature-v1/`.

## The 8 Artifacts

Each sprint produces these files:

| File | What It Contains | When to Fill It |
|------|------------------|-----------------|
| `REPO_AUDIT.md` | Current state analysis | First — understand what exists |
| `SPEC.md` | Goals, acceptance criteria | After audit — define success |
| `ARCHITECTURE.md` | Target state design | After spec — design the solution |
| `MIGRATION_MAP.md` | File-by-file change plan | After architecture — plan the work |
| `DECISIONS.md` | ADRs explaining "why" | Throughout — document choices |
| `SPRINTS.md` | Stories and commits | After planning — break into tasks |
| `EXECUTION_PROMPT.md` | Self-contained handoff | Last — ready for execution |
| `DEVLOG.md` | Progress tracking | During execution — track work |

## The 9 Phases

### Phase 1: Repository Audit
Analyze what exists today. Document files, patterns, technical debt.

**Output:** `REPO_AUDIT.md`

### Phase 2: Specification
Define what you're building. Set goals, non-goals, and acceptance criteria.

**Output:** `SPEC.md`

### Phase 3: Architecture
Design the target state. Data structures, file organization, API contracts.

**Output:** `ARCHITECTURE.md`

### Phase 4: Migration Planning
Plan the path from current to target. Files to create, modify, delete.

**Output:** `MIGRATION_MAP.md`

### Phase 5: Decisions
Document key choices using ADR format. Explain why, not just what.

**Output:** `DECISIONS.md`

### Phase 6: Story Breakdown
Break work into epics and stories. Define commit sequence and build gates.

**Output:** `SPRINTS.md`

### Phase 7: Execution Prompt
Create a self-contained document that enables handoff to Claude Code or another developer.

**Output:** `EXECUTION_PROMPT.md`

### Phase 8: Testing (REQUIRED)
Every sprint MUST include tests:
- Schema changes → Schema validation tests
- API changes → Contract tests
- Frontend changes → E2E smoke tests
- Logic changes → Unit tests

### Phase 9: Execution
Hand off `EXECUTION_PROMPT.md` and track progress in `DEVLOG.md`.

## Working with Claude

### Starting a Sprint

```
You: Let's plan a sprint to add user authentication

Claude: I'll create a Foundation Loop sprint for user authentication.
        Let me start with the repository audit...
```

### Continuing Work

```
You: Continue the auth sprint

Claude: [Reads DEVLOG.md] I see we completed the REPO_AUDIT and SPEC.
        Let's continue with ARCHITECTURE.md...
```

### Handing Off to Execution

```
You: The sprint is planned. Hand it off to Claude Code.

Claude: Here's the EXECUTION_PROMPT.md ready for Claude Code.
        It contains everything needed to execute the sprint.
```

## Working with Claude Code

After planning is complete, give Claude Code the `EXECUTION_PROMPT.md`:

```
You: Execute this sprint [paste EXECUTION_PROMPT.md or point to file]

Claude Code: I'll follow the execution order. Starting with Phase 1...
```

Claude Code can:
- Read the sprint documentation
- Execute commands
- Create and modify files
- Verify build gates
- Update DEVLOG.md

## Naming Conventions

### Sprint Names
```
{domain}-{feature}-v{version}

Examples:
- user-auth-v1
- knowledge-architecture-v1
- automated-testing-v1
- terminal-ux-v2
```

### Commit Messages
```
{type}: {description}

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code restructuring
- test: Adding tests
- docs: Documentation
- chore: Maintenance
- ci: CI/CD changes

Examples:
- feat: add login endpoint
- test: add auth token validation tests
- refactor: extract user service from controller
```

## Build Gates

After each epic, verify:
```bash
npm run build    # TypeScript compiles
npm test         # Unit tests pass
npm run health   # Health check passes
```

Before deploy:
```bash
npm run test:all  # All tests including E2E
npm run health    # Final health check
```

## File Locations

```
the-grove-foundation/
├── SKILL.md                    # Main skill file (Claude reads this)
├── skills/
│   ├── references/
│   │   ├── templates.md        # All artifact templates
│   │   ├── testing-requirements.md
│   │   ├── health-report.md
│   │   └── examples.md
│   └── scripts/
│       └── init-sprint.js      # Sprint initializer
└── docs/
    └── sprints/
        ├── knowledge-architecture-v1/
        ├── automated-testing-v1/
        └── {your-sprint}/
```

## Tips for Success

1. **Don't skip phases** — Each builds on the previous
2. **Keep artifacts updated** — They're living documents
3. **Test critical paths** — Not everything, just what matters
4. **Document decisions** — Future you will thank present you
5. **Use the templates** — Consistency helps comprehension

## Troubleshooting

### "Claude isn't following the methodology"

Say explicitly: "Use the Foundation Loop" or "Follow the sprint methodology in SKILL.md"

### "The sprint is too big"

Break it into multiple sprints. Each should be completable in 1-3 sessions.

### "I'm stuck on a phase"

Skip ahead and come back. Sometimes architecture clarifies specification.

### "Execution diverged from plan"

Update the documentation. Plans are guides, not contracts.

## Reference Files

- **Full templates:** `skills/references/templates.md`
- **Testing guide:** `skills/references/testing-requirements.md`
- **Health report design:** `skills/references/health-report.md`
- **Real examples:** `skills/references/examples.md`
