---
name: grove-foundation-loop
description: Sprint planning methodology implementing the Trellis Architecture's DEX (Declarative Exploration) standard. Use when the user wants to plan a sprint, refactor code, add features, or execute any multi-phase development work. Triggers on phrases like "let's plan a sprint", "Foundation Loop", "Trellis", "DEX", "refactor", "add feature", "create sprint", "start a sprint", or when development work requires structured planning with documentation, testing, and execution handoff.
---

# Grove Foundation Loop — Sprint Methodology

A structured approach to software development implementing the **Trellis Architecture** and **DEX (Declarative Exploration)** standard. Produces 8 planning artifacts, embeds automated testing, and enables clean handoff to execution agents.

## Trellis Architecture Alignment

The Foundation Loop implements the four DEX Stack Standards:

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Domain logic in config (JSON/YAML), not code |
| **Capability Agnosticism** | Structure provides validity, not the model |
| **Provenance as Infrastructure** | Attribution chains on all artifacts |
| **Organic Scalability** | Structure precedes growth but doesn't inhibit it |

**The First Order Directive:** *Separation of Exploration Logic from Execution Capability.*
- Build the engine that reads the map; do not build the map into the engine.
- If you're hardcoding domain behavior, you're violating the architecture.

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

| Artifact | Purpose | DEX Layer |
|----------|---------|-----------|
| `REPO_AUDIT.md` | Current state analysis | Corpus assessment |
| `SPEC.md` | Goals, non-goals, acceptance criteria | Configuration intent |
| `ARCHITECTURE.md` | Target state, schemas, data flows | Engine + Config design |
| `MIGRATION_MAP.md` | File-by-file change plan | Execution plan |
| `DECISIONS.md` | ADRs explaining "why" | Provenance |
| `SPRINTS.md` | Epic/story breakdown | Execution plan |
| `EXECUTION_PROMPT.md` | Self-contained handoff | Execution capability |
| `DEVLOG.md` | Execution tracking | Attribution chain |

## Sprint Phases

### Phase 1: Repository Audit
Analyze current state: files, architecture, patterns, technical debt.
**DEX Check:** Identify what's hardcoded that should be declarative.
→ Output: `REPO_AUDIT.md`

### Phase 2: Specification  
Define goals, non-goals, acceptance criteria (including test requirements).
**DEX Check:** Can acceptance be verified without code changes?
→ Output: `SPEC.md`

### Phase 3: Architecture
Design target state: data structures, file organization, API contracts.
**DEX Check:** Is domain logic in configuration? Is the engine corpus-agnostic?
→ Output: `ARCHITECTURE.md`

### Phase 4: Migration Planning
Plan path: files to create/modify/delete, execution order, rollback plan.
→ Output: `MIGRATION_MAP.md`

### Phase 5: Decisions
Document choices using ADR format with rejected alternatives.
**DEX Check:** Do decisions preserve capability agnosticism?
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

## DEX Compliance Checklist

Before finalizing any sprint, verify:

- [ ] **Declarative Sovereignty:** Domain behavior defined in config files, not hardcoded
- [ ] **Capability Agnosticism:** System works regardless of model capability
- [ ] **Provenance:** All artifacts include attribution (who, when, why)
- [ ] **Progressive Enhancement:** Works with minimal config, improves with more

**The Test:** Can a non-technical domain expert alter behavior by editing a schema file, without recompiling the application? If no, the feature is incomplete.

## Quick Reference

**Sprint naming:** `{domain}-{feature}-v{version}` (e.g., `health-dashboard-v1`)

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

1. **Trellis First** — Structure precedes growth; build the frame before the vine
2. **Declarative Sovereignty** — Domain logic in config, engine logic in code
3. **Provenance as Infrastructure** — A fact without a root is a weed
4. **Test Critical Paths** — Impact over coverage percentage
5. **Sprints are Replayable** — EXECUTION_PROMPT is self-contained

## Terminology

| Term | Definition |
|------|------------|
| **Trellis** | The structural framework (architecture) supporting the DEX stack |
| **DEX** | Declarative Exploration — methodology separating intent from inference |
| **Sprout** | Atomic unit of captured insight |
| **Grove** | Accumulated, refined knowledge base |
| **Vine** | Execution capability (LLM, RAG) — interchangeable and ephemeral |
| **Gardener** | Human applying judgment (pruning) to AI-generated possibilities (growth) |
