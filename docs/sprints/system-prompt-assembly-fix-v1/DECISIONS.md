# Decisions: system-prompt-assembly-fix-v1

**Sprint:** system-prompt-assembly-fix-v1  
**Date:** January 10, 2026

---

## ADR-001: Return Full Config Object from fetchActiveSystemPrompt()

### Status
ACCEPTED

### Context
The `fetchActiveSystemPrompt()` function currently returns only the assembled text content (string). Behavioral settings stored in Supabase (`responseMode`, `closingBehavior`, etc.) are extracted by `assemblePromptContent()` but never returned to callers.

### Decision
Modify `fetchActiveSystemPrompt()` to return a `SystemPromptConfig` object containing both content and behavioral metadata.

### Alternatives Considered

**Alternative A: Frontend Fetches Behaviors Separately**
- Frontend makes separate call to get behavioral settings
- Rejected: Adds network request, duplicates Supabase access, violates DRY

**Alternative B: Store Behaviors in Different Table**
- Separate `system_prompt_behaviors` table
- Rejected: Adds complexity, behaviors are inherently part of system prompt

**Alternative C: Hardcode Behaviors in buildSystemPrompt()**
- Different defaults based on route
- Rejected: Violates Declarative Sovereignty, requires code changes for behavior updates

### Consequences
- Callers must handle object return instead of string
- Cache structure expands to include behavioral fields
- GCS and fallback paths return objects with default behaviors
- Type safety improves (explicit interface)

### DEX Compliance
- ✅ Declarative Sovereignty: Behaviors come from config, not code
- ✅ Provenance: Source tracked in returned object

---

## ADR-002: Always Apply Behavioral Instructions

### Status
ACCEPTED

### Context
Current `buildSystemPrompt()` only applies `RESPONSE_MODES` and `CLOSING_BEHAVIORS` when `hasCustomBehaviors = true` (i.e., when frontend sends non-empty `personaBehaviors`). When no lens is active, behaviors are not applied.

### Decision
Always apply behavioral instructions using resolved values from:
1. Frontend `personaBehaviors` (highest priority - lens overlay)
2. Supabase `systemConfig` (default from active system prompt)
3. Hardcoded defaults (fallback)

### Alternatives Considered

**Alternative A: Keep Conditional Application**
- Only apply when frontend sends behaviors
- Rejected: Breaks /explore route where no lens is active

**Alternative B: Always Use IDENTITY_PROMPT**
- Replace base content with identity prompt when applying behaviors
- Rejected: Loses carefully crafted system prompt content from Supabase

### Consequences
- Every response gets behavioral instructions
- Slight increase in prompt length (~200 tokens)
- Consistent behavior across routes
- Lens-based overrides still work

### DEX Compliance
- ✅ Capability Agnosticism: System works regardless of model interpretation
- ✅ Organic Scalability: New modes work without code changes

---

## ADR-003: Preserve Backward Compatibility for Lens Overrides

### Status
ACCEPTED

### Context
The Terminal route uses lens-based `personaBehaviors` to customize agent behavior. This must continue working after the fix.

### Decision
Frontend `personaBehaviors` takes precedence over Supabase defaults using nullish coalescing:

```javascript
const closingBehavior = personaBehaviors.closingBehavior ?? systemConfig.closingBehavior;
```

### Alternatives Considered

**Alternative A: Supabase Always Wins**
- System config overrides frontend
- Rejected: Breaks lens customization feature

**Alternative B: Merge Objects**
- Deep merge personaBehaviors with systemConfig
- Rejected: Overly complex, unclear precedence

### Consequences
- Lens-specific behaviors override system defaults
- Non-lens routes use Supabase defaults
- Clear precedence: frontend > config > hardcoded

### DEX Compliance
- ✅ Organic Scalability: Layered configuration supports multiple use cases

---

## ADR-004: Default Behaviors for Legacy Paths

### Status
ACCEPTED

### Context
GCS legacy path and static fallback don't have behavioral settings stored. Need sensible defaults.

### Decision
Use `DEFAULT_SYSTEM_PROMPT_BEHAVIORS` constant for all paths that lack behavioral settings:

```javascript
const DEFAULT_SYSTEM_PROMPT_BEHAVIORS = {
  responseMode: 'architect',
  closingBehavior: 'navigation',
  useBreadcrumbTags: true,
  useTopicTags: true,
  useNavigationBlocks: true
};
```

### Rationale
- `architect` mode is the original/default Grove voice
- `navigation` closing matches existing behavior before bug
- Tag booleans default to true (opt-out rather than opt-in)

### Consequences
- Legacy deployments maintain familiar behavior
- Consistent fallback chain
- Explicit defaults make behavior predictable

---

## ADR-005: Single File Change (Strangler Fig Compliance)

### Status
ACCEPTED

### Context
This fix affects the /explore route which is part of the Bedrock architecture. Per the Bedrock Sprint Contract, we must not couple to legacy code in `src/foundation/`.

### Decision
All changes confined to `server.js`. No frontend changes, no Terminal-specific code, no new files.

### Rationale
- `server.js` is shared infrastructure, not legacy-specific
- Fix applies to all routes equally
- Minimal blast radius for testing

### Consequences
- Easy rollback (single file revert)
- No frontend deployment needed
- Terminal route unaffected

### DEX Compliance
- ✅ Strangler Fig: No legacy coupling introduced

---

*Decisions documented. Ready for SPRINTS.md phase.*
