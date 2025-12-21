---
name: grove-foundation-loop
description: Sprint planning and execution methodology for software development projects. Use when the user wants to plan a sprint, refactor code, add features, or execute any multi-phase development work. Triggers on phrases like "let's plan a sprint", "Foundation Loop", "refactor", "add feature", "create sprint", "start a sprint", "plan development work", or when development work requires structured planning with documentation, testing, and execution handoff.
---

# Grove Foundation Loop — Sprint Methodology

A structured approach to software development that produces 8 planning artifacts, embeds automated testing, and enables clean handoff to execution agents.

## When to Use

**Use for:**
- Refactoring work
- New feature development  
- Infrastructure changes
- Bug fixes touching multiple files
- Any work benefiting from planning

**Skip for:** Trivial changes (typo fixes, single-line config tweaks)

## The 8 Artifacts

Every sprint produces these in `docs/sprints/{sprint-name}/`:

| Artifact | Purpose |
|----------|---------|
| `REPO_AUDIT.md` | Current state analysis |
| `SPEC.md` | Goals, non-goals, acceptance criteria |
| `ARCHITECTURE.md` | Target state, schemas, data flows |
| `MIGRATION_MAP.md` | File-by-file change plan |
| `DECISIONS.md` | ADRs explaining "why" |
| `SPRINTS.md` | Epic/story breakdown |
| `EXECUTION_PROMPT.md` | Self-contained handoff |
| `DEVLOG.md` | Execution tracking |

## Sprint Phases

### Phase 1: Repository Audit
Analyze current state: files, architecture, patterns, technical debt.
→ Output: `REPO_AUDIT.md`

### Phase 2: Specification  
Define goals, non-goals, acceptance criteria (including test requirements).
→ Output: `SPEC.md`

### Phase 3: Architecture
Design target state: data structures, file organization, API contracts.
→ Output: `ARCHITECTURE.md`

### Phase 4: Migration Planning
Plan path: files to create/modify/delete, execution order, rollback plan.
→ Output: `MIGRATION_MAP.md`

### Phase 5: Decisions
Document choices using ADR format with rejected alternatives.
→ Output: `DECISIONS.md`

### Phase 6: Story Breakdown
Create executable plan: epics, stories, commit sequence, build gates.
→ Output: `SPRINTS.md`

### Phase 7: Execution Prompt
Create self-contained handoff with context, code samples, verification commands.
→ Output: `EXECUTION_PROMPT.md`

### Phase 8: Testing (REQUIRED)
Every sprint MUST include tests for critical paths. See `skills/references/testing-requirements.md`.

### Phase 9: Execution
Hand off `EXECUTION_PROMPT.md`, track progress in `DEVLOG.md`.

## Quick Reference

**Sprint naming:** `{domain}-{feature}-v{version}` (e.g., `automated-testing-v1`)

**Commit format:** `{type}: {description}` where type is feat|fix|refactor|test|docs|chore|ci

**Build gates after each epic:**
```bash
npm run build    # Compiles
npm test         # Unit tests pass
npm run health   # Health check passes (if implemented)
```

## Templates and References

- **Artifact templates:** See `skills/references/templates.md`
- **Testing requirements:** See `skills/references/testing-requirements.md`
- **Health report system:** See `skills/references/health-report.md`
- **Example sprints:** See `skills/references/examples.md`

## Key Principles

1. **Plan before coding** — Artifacts save more time than they cost
2. **Test critical paths** — Impact over coverage percentage
3. **Document decisions** — Future you will thank present you
4. **Health checks are mandatory** — Human-readable status at all times
5. **Sprints are replayable** — EXECUTION_PROMPT is self-contained
