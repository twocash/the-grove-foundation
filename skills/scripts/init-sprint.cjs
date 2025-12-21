#!/usr/bin/env node
/**
 * Initialize a new Foundation Loop sprint
 * 
 * Usage: node init-sprint.cjs <sprint-name> [--path <output-dir>]
 * 
 * Example: node init-sprint.cjs feature-flags-v1 --path ./docs/sprints
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const sprintName = args[0];
const pathIndex = args.indexOf('--path');
const outputDir = pathIndex !== -1 ? args[pathIndex + 1] : './docs/sprints';

if (!sprintName) {
  console.error('Usage: node init-sprint.cjs <sprint-name> [--path <output-dir>]');
  console.error('Example: node init-sprint.cjs feature-flags-v1 --path ./docs/sprints');
  process.exit(1);
}

const sprintDir = path.join(outputDir, sprintName);

// Create sprint directory
if (fs.existsSync(sprintDir)) {
  console.error(`Error: Sprint directory already exists: ${sprintDir}`);
  process.exit(1);
}

fs.mkdirSync(sprintDir, { recursive: true });

const today = new Date().toISOString().split('T')[0];

// Template files
const templates = {
  'REPO_AUDIT.md': `# Repository Audit — ${sprintName}

## Audit Date: ${today}

## Current State Summary
<!-- What exists today and why this sprint is needed -->

## File Structure Analysis

### Key Files
| File | Purpose | Lines |
|------|---------|-------|
| <!-- path --> | <!-- purpose --> | <!-- count --> |

### Dependencies
<!-- List relevant dependencies -->

## Technical Debt
<!-- What needs fixing -->

## Risk Assessment
| Area | Current Risk | Notes |
|------|--------------|-------|
| <!-- area --> | High/Medium/Low | <!-- notes --> |

## Recommendations
1. <!-- Recommendation -->
`,

  'SPEC.md': `# Specification — ${sprintName}

## Overview
<!-- One paragraph summary -->

## Goals
1. <!-- Primary goal -->
2. <!-- Secondary goal -->

## Non-Goals
- <!-- What we're NOT doing -->

## Success Criteria
After this sprint:
1. <!-- Measurable outcome -->

## Acceptance Criteria

### Must Have
- [ ] AC-1: <!-- Specific criterion -->
- [ ] AC-2: Tests pass: \`npm test\`
- [ ] AC-3: Health check passes: \`npm run health\`

### Should Have
- [ ] AC-4: <!-- Lower priority -->

### Nice to Have
- [ ] AC-5: <!-- Optional -->

## Dependencies
| Package | Purpose | Version |
|---------|---------|---------|

## Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|

## Out of Scope
- <!-- Explicit exclusion -->
`,

  'ARCHITECTURE.md': `# Architecture — ${sprintName}

## Overview
<!-- High-level description -->

## System Diagram
\`\`\`
<!-- ASCII diagram -->
\`\`\`

## Data Structures

### <!-- Entity Name -->
\`\`\`typescript
interface EntityName {
  // fields
}
\`\`\`

## File Organization
\`\`\`
<!-- Directory structure -->
\`\`\`

## API Contracts
<!-- Endpoint definitions -->

## Configuration
<!-- Config files, env vars -->
`,

  'MIGRATION_MAP.md': `# Migration Map — ${sprintName}

## Overview
<!-- Summary of changes -->

## Files to Create

### \`path/to/file.ts\`
**Purpose:** <!-- description -->
**Depends on:** <!-- dependencies -->

---

## Files to Modify

### \`path/to/existing.ts\`
**Lines:** X-Y
**Change:** <!-- description -->

---

## Files to Delete
<!-- List with reasons -->

---

## Execution Order
1. <!-- Step -->
2. <!-- Verify -->

## Rollback Plan
\`\`\`bash
# Commands to undo
\`\`\`

## Verification Checklist
- [ ] <!-- Check -->
`,

  'DECISIONS.md': `# Architectural Decision Records — ${sprintName}

## ADR-001: <!-- Decision Title -->

### Status
Proposed

### Context
<!-- Why we need this decision -->

### Options Considered
1. **Option A** — <!-- description -->
2. **Option B** — <!-- description -->

### Decision
<!-- What we decided -->

### Rationale
<!-- Why this option -->

### Consequences
**Positive:**
- <!-- benefit -->

**Negative:**
- <!-- tradeoff -->

---

## ADR-002: <!-- Next Decision -->
<!-- Repeat format -->
`,

  'SPRINTS.md': `# Sprint Stories — ${sprintName}

## Epic 1: <!-- Epic Name --> (Priority: Critical)

### Story 1.1: <!-- Story Title -->
**Task:** <!-- What to do -->
**File:** <!-- path -->
**Acceptance:** <!-- How to verify -->
**Commit:** \`feat: <!-- message -->\`

---

## Epic 2: <!-- Next Epic -->

---

## Commit Sequence
\`\`\`
1. <!-- type: message -->
\`\`\`

## Build Gates
- After Epic 1: \`npm run build && npm test\`
- Before deploy: \`npm run test:all && npm run health\`

## Smoke Test Checklist
- [ ] <!-- Verification -->
- [ ] Tests pass: \`npm test\`
- [ ] Health check passes: \`npm run health\`
`,

  'EXECUTION_PROMPT.md': `# Execution Prompt — ${sprintName}

## Context
<!-- Why this sprint exists -->

## Documentation
Sprint documentation in \`docs/sprints/${sprintName}/\`:
- \`REPO_AUDIT.md\` — Current state
- \`SPEC.md\` — Goals and criteria
- \`ARCHITECTURE.md\` — Target state
- \`MIGRATION_MAP.md\` — Change plan
- \`DECISIONS.md\` — ADRs
- \`SPRINTS.md\` — Stories

## Repository Intelligence
Key locations:
- <!-- path -->: <!-- purpose -->

## Execution Order

### Phase 1: <!-- Name -->
\`\`\`bash
# Commands
\`\`\`

Verify: \`<!-- command -->\`

---

## Build Verification
\`\`\`bash
npm run build
npm test
npm run health
\`\`\`

## Success Criteria
- [ ] <!-- Criterion -->
- [ ] Tests pass
- [ ] Health check passes

## Forbidden Actions
- Do NOT <!-- thing to avoid -->
`,

  'DEVLOG.md': `# Dev Log — ${sprintName}

## Sprint: ${sprintName}
## Started: ${today}
## Status: Planning

---

## Session Log

### Session 1: ${today} — Planning

**Completed:**
- [ ] REPO_AUDIT.md
- [ ] SPEC.md
- [ ] ARCHITECTURE.md
- [ ] MIGRATION_MAP.md
- [ ] DECISIONS.md
- [ ] SPRINTS.md
- [ ] EXECUTION_PROMPT.md

**Next:**
- Hand off to execution

---

## Execution Log

### Phase 1: <!-- Name -->
- [ ] <!-- Step -->

---

## Issues Encountered
<!-- Document issues and resolutions -->

---

## Final Checklist
- [ ] All acceptance criteria met
- [ ] Tests pass: \`npm test\`
- [ ] Health check passes: \`npm run health\`
- [ ] Documentation updated
`
};

// Write all template files
for (const [filename, content] of Object.entries(templates)) {
  const filepath = path.join(sprintDir, filename);
  fs.writeFileSync(filepath, content);
  console.log(`Created: ${filepath}`);
}

console.log(`\n✅ Sprint initialized: ${sprintDir}`);
console.log(`\nNext steps:`);
console.log(`1. Fill in REPO_AUDIT.md with current state analysis`);
console.log(`2. Define goals in SPEC.md`);
console.log(`3. Design target state in ARCHITECTURE.md`);
console.log(`4. Plan changes in MIGRATION_MAP.md`);
console.log(`5. Document decisions in DECISIONS.md`);
console.log(`6. Break into stories in SPRINTS.md`);
console.log(`7. Create EXECUTION_PROMPT.md for handoff`);
console.log(`8. Track progress in DEVLOG.md`);
