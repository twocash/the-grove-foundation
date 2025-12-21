# Artifact Templates

## REPO_AUDIT.md Template

```markdown
# Repository Audit — {Sprint Name}

## Audit Date: {YYYY-MM-DD}

## Current State Summary
{Brief description of what exists today and why this sprint is needed}

## File Structure Analysis

### Key Files
| File | Purpose | Lines |
|------|---------|-------|
| {path} | {purpose} | {count} |

### Dependencies
{List relevant dependencies and versions}

## Technical Debt
{What needs fixing, what patterns are problematic}

## Risk Assessment
| Area | Current Risk | Notes |
|------|--------------|-------|
| {area} | High/Medium/Low | {explanation} |

## Recommendations
1. {Recommendation 1}
2. {Recommendation 2}
```

---

## SPEC.md Template

```markdown
# Specification — {Sprint Name}

## Overview
{One paragraph summary of what this sprint accomplishes}

## Goals
1. {Primary goal}
2. {Secondary goal}

## Non-Goals
- {What we're explicitly NOT doing}
- {Scope boundary}

## Success Criteria
After this sprint:
1. {Measurable outcome 1}
2. {Measurable outcome 2}

## Acceptance Criteria

### Must Have
- [ ] AC-1: {Specific, testable criterion}
- [ ] AC-2: {Include test requirement}
- [ ] AC-3: Tests pass: `npm test`
- [ ] AC-4: Health check passes: `npm run health`

### Should Have
- [ ] AC-5: {Lower priority criterion}

### Nice to Have
- [ ] AC-6: {Optional enhancement}

## Dependencies
| Package | Purpose | Version |
|---------|---------|---------|
| {name} | {why needed} | {version} |

## Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| {risk} | High/Med/Low | High/Med/Low | {mitigation} |

## Out of Scope
- {Explicit exclusion 1}
- {Explicit exclusion 2}
```

---

## ARCHITECTURE.md Template

```markdown
# Architecture — {Sprint Name}

## Overview
{High-level description of the target architecture}

## System Diagram
```
{ASCII diagram showing components and data flow}
```

## Data Structures

### {Entity Name}
```typescript
interface EntityName {
  id: string;
  // fields with types and comments
}
```

## File Organization
```
{directory structure showing new/modified files}
```

## API Contracts

### {Endpoint Name}
- **Method:** GET/POST/PUT/DELETE
- **Path:** /api/{path}
- **Request:** {shape}
- **Response:** {shape}

## Configuration
{Any configuration files or environment variables}

## Integration Points
{How this integrates with existing systems}
```

---

## MIGRATION_MAP.md Template

```markdown
# Migration Map — {Sprint Name}

## Overview
{Summary of what's being migrated/changed}

## Files to Create

### `{path/to/file.ts}`
**Purpose:** {what this file does}
**Depends on:** {other files that must exist first}
**Content summary:** {brief description}

---

## Files to Modify

### `{path/to/existing.ts}`
**Lines:** {start}-{end}
**Change Type:** Add/Modify/Remove
**Before:**
```typescript
{current code}
```
**After:**
```typescript
{new code}
```
**Reason:** {why this change}

---

## Files to Delete
- `{path}` — {reason for deletion}

---

## Execution Order
1. {First step}
2. {Second step}
3. {Verify: command to run}
4. {Continue...}

## Rollback Plan

### If {specific failure}:
1. {Recovery step}
2. {Verification}

### Full rollback:
```bash
{commands to undo all changes}
```

## Verification Checklist
- [ ] {Check 1}
- [ ] {Check 2}
```

---

## DECISIONS.md Template

```markdown
# Architectural Decision Records — {Sprint Name}

## ADR-001: {Decision Title}

### Status
Accepted | Proposed | Deprecated | Superseded by ADR-XXX

### Context
{Why we need to make this decision. What forces are at play.}

### Options Considered
1. **{Option A}** — {brief description}
2. **{Option B}** — {brief description}
3. **{Option C}** — {brief description}

### Decision
{What we decided to do}

### Rationale
{Why we chose this option over the alternatives}

### Consequences

**Positive:**
- {Benefit 1}
- {Benefit 2}

**Negative:**
- {Tradeoff 1}
- {Tradeoff 2}

**Neutral:**
- {Side effect}

---

## ADR-002: {Next Decision}
{Repeat format}
```

---

## SPRINTS.md Template

```markdown
# Sprint Stories — {Sprint Name}

## Epic 1: {Epic Name} (Priority: Critical/High/Medium/Low)

### Story 1.1: {Story Title}
**Task:** {What to do}
**File:** {path/to/file} or Create `{path}`
**Commands:** (if applicable)
```bash
{commands}
```
**Acceptance:** {How to verify completion}
**Commit:** `{type}: {message}`

### Story 1.2: {Next Story}
{Repeat format}

---

## Epic 2: {Next Epic}
{Repeat format}

---

## Commit Sequence
```
1. {type}: {message}
2. {type}: {message}
...
```

## Build Gates
- After Epic 1: `{verification command}`
- After Epic 2: `{verification command}`
- Before deploy: `npm run test:all && npm run health`

## Smoke Test Checklist
- [ ] {Manual verification 1}
- [ ] {Manual verification 2}
- [ ] Tests pass: `npm test`
- [ ] Health check passes: `npm run health`
```

---

## EXECUTION_PROMPT.md Template

```markdown
# Execution Prompt — {Sprint Name}

## Context
{Why this sprint exists, what problem it solves}

## Documentation
Sprint documentation in `docs/sprints/{sprint-name}/`:
- `REPO_AUDIT.md` — {one-line summary}
- `SPEC.md` — {one-line summary}
- `ARCHITECTURE.md` — {one-line summary}
- `MIGRATION_MAP.md` — {one-line summary}
- `DECISIONS.md` — {one-line summary}
- `SPRINTS.md` — {one-line summary}

## Repository Intelligence
Key locations:
- {Important file 1}: `{path}` (lines {X}-{Y})
- {Important file 2}: `{path}`

## Execution Order

### Phase 1: {Phase Name}
```bash
{commands}
```

{Code samples if helpful}

Verify: `{verification command}`

### Phase 2: {Next Phase}
{Repeat format}

---

## Build Verification
After each phase:
```bash
npm run build
npm test
```

## Success Criteria
- [ ] {Criterion 1}
- [ ] {Criterion 2}
- [ ] Tests pass: `npm test`
- [ ] Health check: `npm run health`

## Forbidden Actions
- Do NOT {thing to avoid}
- Do NOT {another thing to avoid}
```

---

## DEVLOG.md Template

```markdown
# Dev Log — {Sprint Name}

## Sprint: {sprint-name}
## Started: {YYYY-MM-DD}
## Status: {Planning | In Progress | Complete | Blocked}

---

## Session Log

### Session 1: {Date} — {Focus Area}

**Completed:**
- [x] {Task 1}
- [x] {Task 2}

**Blocked:**
- {Blocker description}

**Next:**
- {Next task}

---

## Execution Log

### Phase 1: {Phase Name}
- [ ] {Step 1}
- [ ] {Step 2}
- [ ] Verified: `{command}`

### Phase 2: {Phase Name}
{Repeat}

---

## Issues Encountered

### Issue 1: {Title}
**Symptom:** {What happened}
**Cause:** {Root cause}
**Resolution:** {How it was fixed}

---

## Final Checklist
- [ ] All acceptance criteria met
- [ ] Tests pass: `npm test`
- [ ] Health check passes: `npm run health`
- [ ] Documentation updated
- [ ] Ready for deploy
```
