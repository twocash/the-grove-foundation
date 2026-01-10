# Architecture Decision: dedupe-prompts-v1

## Decision

Add deduplication logic to `ResponseObject.tsx` at the fork merge point, using label-based matching with type priority ordering.

## Rationale

Two independent sources generate navigation forks:
1. **LLM Parsing** — Extracts prompts from response text
2. **4D Scoring** — Scores prompts from the prompt library

Both can produce the same prompt text with different `type` values. The merge happens in `ResponseObject.tsx` (line 70-72), making it the canonical deduplication point.

## Alternatives Considered

| Option | Rejected Because |
|--------|------------------|
| Dedupe in `useNavigationPrompts` | Only sees one source; can't compare across sources |
| Dedupe in `NavigationObject` | Violates "render what you receive" principle |
| Source coordination | Requires schema changes; out of scope |

## DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | `TYPE_PRIORITY` record defines preference order (config-like, not hardcoded conditionals) |
| **Capability Agnosticism** | Works regardless of LLM; observes labels, not model-specific metadata |
| **Provenance** | ⚠️ We lose source attribution; documented as TODO for future sprint |
| **Organic Scalability** | O(n) algorithm; scales with prompt count |

## Technical Notes

- **Key normalization:** `label.toLowerCase().trim()` handles minor formatting differences
- **Priority order:** `deep_dive` > `pivot` > `apply` > `challenge` (deep exploration preferred)
- **useMemo dependency:** Only `navigationForks`, ensuring recalculation when sources change

## Future Work

DEX-compliant solution would add `source: 'llm-parsed' | '4d-scored'` field to `JourneyFork` interface:
- Enables telemetry on which source performs better
- Requires schema change + updates to both prompt sources
- Estimated scope: separate sprint
