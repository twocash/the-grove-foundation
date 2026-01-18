# Grove Foundation Loop Skill

A Claude skill for structured sprint planning implementing the **Trellis Architecture** and **DEX (Declarative Exploration)** standard. Produces 9 planning artifacts, embeds testing as continuous process, supports domain-specific contracts, and enables clean handoff to execution agents.

## Quick Start

1. Copy this skill to your Claude project's skills folder
2. In conversation, say: "Let's start a Foundation Loop for {feature}"
3. Claude will generate all 9 artifacts with test requirements

## Core Principles

### 1. Trellis Architecture
- **Declarative Sovereignty** — Domain logic in config, not code
- **Capability Agnosticism** — Structure provides validity, not the model
- **Provenance as Infrastructure** — Attribution chains on all artifacts

### 2. Testing as Process
Testing is not a phase—it's continuous:
```
Code → Tests → Health Report → Unified Dashboard
```

### 3. Behavior Over Implementation
```typescript
// ❌ WRONG
expect(element).toHaveClass('translate-x-0');

// ✅ RIGHT
await expect(terminal).toBeVisible();
```

## The 9 Artifacts

| Artifact | Purpose |
|----------|---------|
| `REPO_AUDIT.md` | Current state + test coverage analysis |
| `SPEC.md` | Goals + acceptance criteria + test requirements |
| `ARCHITECTURE.md` | Target design + test architecture |
| `MIGRATION_MAP.md` | File changes + test changes |
| `DECISIONS.md` | ADRs including testing strategy |
| `SPRINTS.md` | Stories with test tasks per epic |
| `EXECUTION_PROMPT.md` | Handoff with test commands |
| `DEVLOG.md` | Execution + test result tracking |
| `CONTINUATION_PROMPT.md` | Session handoff for context window continuity |

## Domain-Specific Contracts

Some branches or domains have additional binding requirements beyond base Foundation Loop. Check for applicable contracts before starting work.

| Branch/Domain | Contract | Additional Requirements |
|---------------|----------|------------------------|
| `bedrock` | `bedrock-sprint-contract.md` | Console pattern, Copilot mandate, GroveObject compliance |

**Contract hierarchy:** Foundation Loop (base) → Domain Contract (overlay) → Sprint Artifacts (satisfy both)

See `references/bedrock-sprint-contract.md` for the full Bedrock contract.

## Grove Architecture Rules

When working on Grove codebase:

| Rule | Violation | Correct |
|------|-----------|---------|
| No new handlers | `handleFoo()` | Config → Engine |
| No hardcoded behavior | `if (type === 'x')` | Config lookup |
| Behavior tests | `toHaveClass()` | `toBeVisible()` |

See `references/grove-architecture-rules.md` for details.

## File Structure

```
grove-foundation-loop-skill/
├── SKILL.md                              # Main skill definition
├── README.md                             # This file
├── references/
│   ├── bedrock-sprint-contract.md        # Bedrock domain contract
│   ├── templates.md                      # Artifact templates
│   ├── testing-requirements.md           # Testing philosophy + patterns
│   ├── health-report.md                  # Health system integration
│   ├── grove-architecture-rules.md       # Declarative patterns
│   ├── project-patterns.md               # Pattern check reference
│   └── examples.md                       # Real sprint examples
└── scripts/
    └── init-sprint.js                    # Sprint folder initialization
```

## Testing Integration

Every sprint includes:

### SPRINTS.md Test Tasks
```markdown
### Story 1.2: Write tests for {feature}
**Task:** Add behavior-focused E2E tests
**Tests:**
- [ ] Use `toBeVisible()`, not `toHaveClass()`
- [ ] Test user outcomes, not implementation
```

### Build Gates
```bash
npm run build
npm test
npx playwright test  # Reports to Health
npm run health       # Unified check
```

### Health Integration
```json
{
  "type": "e2e-behavior",
  "test": "feature.spec.ts:user can do thing"
}
```

## Usage Triggers

The skill activates on:
- "Let's plan a sprint"
- "Foundation Loop"
- "Trellis" / "DEX"
- "Refactor {thing}"
- "Add feature {thing}"
- "Create sprint for {thing}"
- "Start a sprint"

## References

- **Domain Contract (Bedrock)**: `references/bedrock-sprint-contract.md`
- **Testing Philosophy**: `references/testing-requirements.md`
- **Architecture Rules**: `references/grove-architecture-rules.md`
- **Health System**: `references/health-report.md`
- **Templates**: `references/templates.md`
- **Examples**: `references/examples.md`

## License

MIT
