# Grove Sprint Skill

Consolidated sprint skill for the Grove Foundation implementing DEX/Trellis architecture.

## Usage

```
/grove-sprint          # Main skill - shows tier selection
```

## Tiers

| Tier | Purpose | Trigger |
|------|---------|---------|
| Foundation Loop | Sprint planning, spec creation | "plan a sprint", "create spec" |
| Execution Protocol | Sprint implementation | "execute sprint X", "implement spec" |

## Key Principles

1. **DEX Compliance** - Declarative over imperative
2. **Trellis Architecture** - Separation of exploration from execution
3. **Contract Authority** - Bedrock Sprint Contract v1.3 is authoritative

## References

- `references/grove-architecture-rules.md` - Detailed architecture patterns
- `docs/BEDROCK_SPRINT_CONTRACT.md` - Binding contract

## Migration

This skill consolidates:
- `grove-foundation-loop` (deprecated)
- `grove-execution-protocol` (deprecated)

See SKILL.md for full documentation.
