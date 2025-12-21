---
name: grove-foundation-loop
description: Sprint planning and execution methodology for Grove Terminal development. Use when Jim wants to plan a sprint, refactor code, add features, or execute any multi-phase development work. Triggers on phrases like "let's plan a sprint", "Foundation Loop", "refactor", "add feature", "create sprint", or when development work requires structured planning.
---

# Grove Foundation Loop — Sprint Methodology

## Overview

The Foundation Loop is a structured approach to Grove Terminal development that ensures:
- Clear requirements before coding
- Architectural decisions documented
- Migration paths planned
- Tests written for critical paths
- Human-readable health checks

## When to Use

Use the Foundation Loop for:
- Any refactoring work
- New feature development
- Infrastructure changes
- Bug fixes that touch multiple files
- Any work that would benefit from planning

**Skip** for trivial changes (typo fixes, config tweaks).

## The 8 Artifacts

Every sprint produces these artifacts in `docs/sprints/{sprint-name}/`:

| Artifact | Purpose | When Created |
|----------|---------|--------------|
| `REPO_AUDIT.md` | Current state analysis | First |
| `SPEC.md` | Goals, non-goals, acceptance criteria | After audit |
| `ARCHITECTURE.md` | Target state, data flows, schemas | After spec |
| `MIGRATION_MAP.md` | File-by-file change plan | After architecture |
| `DECISIONS.md` | ADRs explaining "why" | During planning |
| `SPRINTS.md` | Epic/story breakdown with commits | After decisions |
| `EXECUTION_PROMPT.md` | Self-contained handoff for Claude Code | Last planning artifact |
| `DEVLOG.md` | Execution tracking, issues encountered | During execution |

## Sprint Phases

### Phase 0: Sprint Setup
```
1. Create sprint folder: docs/sprints/{sprint-name}/
2. Name format: {feature}-v{version} (e.g., automated-testing-v1)
```

### Phase 1: Repository Audit
```
Analyze current state:
- What files exist?
- What's the current architecture?
- What patterns are established?
- What technical debt exists?

Output: REPO_AUDIT.md
```

### Phase 2: Specification
```
Define scope:
- Goals (what we're doing)
- Non-goals (what we're NOT doing)
- Acceptance criteria (how we know we're done)

Output: SPEC.md
```

### Phase 3: Architecture
```
Design target state:
- Data structures
- File organization
- API contracts
- Component relationships

Output: ARCHITECTURE.md
```

### Phase 4: Migration Planning
```
Plan the path:
- Files to create
- Files to modify (with line numbers)
- Files to delete
- Execution order
- Rollback plan

Output: MIGRATION_MAP.md
```

### Phase 5: Decisions
```
Document choices:
- ADR format (Status, Context, Decision, Rationale, Consequences)
- One ADR per significant decision
- Include rejected alternatives

Output: DECISIONS.md
```

### Phase 6: Story Breakdown
```
Create executable plan:
- Epics (major themes)
- Stories (individual tasks)
- Commit sequence
- Build gates (verify after each phase)

Output: SPRINTS.md
```

### Phase 7: Execution Prompt
```
Create self-contained handoff:
- Context summary
- Repository intelligence (key file locations)
- Step-by-step execution order
- Code samples where helpful
- Build verification commands
- Forbidden actions

Output: EXECUTION_PROMPT.md
```

### Phase 8: Testing (REQUIRED)
```
Every sprint MUST include:
- Tests for new/modified functionality
- Health check verification
- Update to test counts if applicable

Test requirements by change type:

| Change Type | Required Tests |
|-------------|----------------|
| Schema change | Schema validation tests |
| API change | API contract tests |
| UI change | E2E smoke test |
| Logic change | Unit tests |
| New feature | All applicable above |

Acceptance criteria MUST include:
- "Tests pass: npm test"
- "Health check passes: npm run health"
- Specific test assertions for the feature

Output: Test files in tests/, updated SPRINTS.md with test stories
```

### Phase 9: Execution
```
Hand off EXECUTION_PROMPT.md to Claude Code
Track progress in DEVLOG.md
Run build gates after each phase
Verify smoke tests before marking complete
```

## Quick Commands

Jim may say:
- "Start a sprint for X" → Create sprint folder, begin REPO_AUDIT
- "Continue the sprint" → Resume from last DEVLOG entry
- "Sprint status" → Show current phase and blockers
- "Show execution prompt" → Present EXECUTION_PROMPT.md
- "Handoff to Claude Code" → Confirm EXECUTION_PROMPT is ready

## Sprint Naming Convention

```
{domain}-{feature}-v{version}

Examples:
- knowledge-architecture-v1
- automated-testing-v1
- terminal-ux-v2
- rag-orchestration-v1
```

## Commit Message Format

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
- feat: add health check CLI
- test: add schema validation tests
- refactor: extract hubs to knowledge/hubs.json
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

## Health Check Integration

The health check (`npm run health`) is a first-class tool that:
- Validates schema integrity
- Checks API contracts
- Verifies journey navigation
- Reports failures with IMPACT and INSPECT guidance

Every sprint's smoke test checklist MUST include:
- [ ] `npm run health` passes
- [ ] Health report shows no regressions

## Test Requirements

### Minimum Test Coverage by Sprint Type

| Sprint Type | Required Tests |
|-------------|----------------|
| Schema/Data changes | Schema validation, cross-reference tests |
| API changes | Contract tests for affected endpoints |
| Frontend changes | E2E smoke tests |
| Logic changes | Unit tests for new/modified functions |
| Refactoring | Existing tests still pass, no regressions |

### Test File Locations

```
tests/
├── unit/           # Pure logic, no I/O
├── integration/    # API calls, data flows
├── e2e/            # Browser tests
├── fixtures/       # Test data
└── utils/          # Test helpers
```

### Adding Tests Checklist

When adding tests to a sprint:

1. [ ] Identify what can break
2. [ ] Write test that would catch it
3. [ ] Include in SPRINTS.md as story
4. [ ] Include in EXECUTION_PROMPT.md
5. [ ] Verify test passes before marking epic complete

## Artifact Templates

### REPO_AUDIT.md Template
```markdown
# Repository Audit — {Sprint Name}

## Audit Date: {date}

## Current State Summary
{What exists today}

## File Structure Analysis
{Key files and their purposes}

## Technical Debt
{What needs fixing}

## Recommendations
{What to do about it}
```

### SPEC.md Template
```markdown
# Specification — {Sprint Name}

## Overview
{One paragraph summary}

## Goals
1. {Goal 1}
2. {Goal 2}

## Non-Goals
- {What we're NOT doing}

## Acceptance Criteria
- [ ] AC-1: {Specific, testable criterion}
- [ ] AC-2: {Include test requirements}
```

### DECISIONS.md Template (per ADR)
```markdown
## ADR-{N}: {Title}

### Status
{Proposed|Accepted|Deprecated}

### Context
{Why we need to make this decision}

### Decision
{What we decided}

### Rationale
{Why this option over alternatives}

### Consequences
{What follows from this decision}
```

## Example Sprint Structure

```
docs/sprints/automated-testing-v1/
├── REPO_AUDIT.md      # No tests exist, bugs from last sprint
├── SPEC.md            # Goals: catch bugs before deploy
├── ARCHITECTURE.md    # Test pyramid, health report system
├── MIGRATION_MAP.md   # Files to create, execution order
├── DECISIONS.md       # Why Vitest, why Playwright, etc.
├── SPRINTS.md         # 9 epics, 32 stories
├── EXECUTION_PROMPT.md # Ready for Claude Code
└── DEVLOG.md          # Execution tracking
```

## Current Sprints

| Sprint | Status | Location |
|--------|--------|----------|
| knowledge-architecture-v1 | Complete | `docs/sprints/knowledge-architecture-v1/` |
| automated-testing-v1 | Ready for execution | `docs/sprints/automated-testing-v1/` |

## Key Principles

1. **Plan before coding** — The artifacts save more time than they cost
2. **Test critical paths** — Not coverage percentage, but impact
3. **Document decisions** — Future you will thank present you
4. **Health checks are mandatory** — Human-readable status at all times
5. **Sprints are replayable** — EXECUTION_PROMPT is self-contained
