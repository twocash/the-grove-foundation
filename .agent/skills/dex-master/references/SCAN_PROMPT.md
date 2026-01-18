# DEX Master Initial Scan — Grove Foundation

## Context

You are running a DEX Master scan on the grove-foundation codebase to populate the Fix Queue with atomic cleanup items and Strategic Notes with architecture observations.

## Codebase Location
```
C:\Github\the-grove-foundation
```

## Scope Rules

### PROTECTED — Do Not Touch (MVP Demo Code)
```
src/terminal/*
src/pages/index.*
src/app/page.tsx (if exists)
```
Issues found here → Strategic Notes only (category: tech-debt)

### ACTIVE REVIEW — Primary Targets
```
src/bedrock/*       # Reference 2.0 implementation  
src/explore/*       # Reference 2.0 implementation
src/core/*          # Shared primitives
src/lib/*           # Utilities
tests/*             # Test hygiene
components/*        # Careful with shared ones
hooks/*             # Custom hooks
```

## Analysis Checklist

### Pass 1: Dead Code
- [ ] Scan for unused imports in bedrock/* and explore/*
- [ ] Find functions with no call sites
- [ ] Identify commented-out code blocks
- [ ] Check for orphaned test files
- [ ] Find legacy Reference 1.0 patterns/imports

### Pass 2: Dependency Hygiene  
- [ ] Check for circular imports between bedrock ↔ explore
- [ ] Identify shared code that should be in core/
- [ ] Run `npm audit` for security issues
- [ ] Check package.json for deprecated dependencies

### Pass 3: Test Health
- [ ] Find tests with .skip without justification
- [ ] Find tests without assertions
- [ ] Identify deprecated Jest/Vitest patterns
- [ ] Note coverage gaps in active review zones

### Pass 4: Naming & Structure
- [ ] Check for inconsistent naming conventions
- [ ] Note module boundary violations
- [ ] Identify unclear file names (utils.ts, helpers.ts)

## Output Format

For each finding, determine if it's a Quick Fix or Strategic Note.

### Quick Fix (→ Notion Fix Queue)
```
QUICK FIX: [Title]
Type: cleanup | security | deprecation | test | dependency
Risk: low | medium | high
Confidence: [0-100]%
Affected Files: [paths]
Lines: [line numbers]
Contract Spec:
  1. [step]
  2. [step]
  3. Run: [test command]
  4. Verify: [visual check]
  5. Screenshot: [what to capture]
Rationale: [why this is safe]
Protected Check: ✓ Does not touch terminal/* or index.*
```

### Strategic Note (→ Notion Strategic Notes)
```
STRATEGIC NOTE: [Title]
Category: architecture | user-model | coupling | tech-debt | opportunity
Observation: [what you see]
Implication: [why it matters]
Opportunity: [what could be done]
Effort: trivial | small | medium-sprint | large-sprint
Related Files: [paths]
User Model Impact: [how this affects code clarity]
```

## Notion Database IDs

After analysis, write findings to:
- Fix Queue: `4342664c-be13-4a07-9ec5-8488a79ddcb1`
- Strategic Notes: `394db86c-01fa-44e4-842d-3de6dc09e08c`

## Start

Begin by listing the directory structure of src/ to understand the current state:

```bash
Get-ChildItem -Recurse -Name C:\Github\the-grove-foundation\src | Select-Object -First 200
```

Then systematically work through each analysis pass, documenting findings.
