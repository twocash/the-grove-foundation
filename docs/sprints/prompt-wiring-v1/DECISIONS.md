# DECISIONS.md - prompt-wiring-v1

> **Sprint**: prompt-wiring-v1
> **Created**: 2026-01-06

---

## ADR-001: Prepend Command vs. Diff Preview

**Status**: DECIDED

**Context**: The Refine button currently generates `set execution to [prefix][entire prompt]`, which replaces the whole execution prompt even when fixing one aspect.

**Options Considered**:

| Option | Pros | Cons |
|--------|------|------|
| A: Prepend command | Simple, fits pattern | User doesn't see result |
| B: Diff preview | User sees before/after | Complex UI, more code |
| C: Modal confirmation | Clear UX | Interrupts flow |

**Decision**: Option A - Prepend command

**Rationale**:
- Minimal code change (add one pattern)
- User can undo easily (Ctrl+Z or re-edit)
- Fits existing command parser pattern
- Diff preview deferred to future sprint if needed

---

## ADR-002: Copilot Action Registration

**Status**: DECIDED

**Context**: Need to wire `/make-compelling` and `/suggest-targeting` actions.

**Options Considered**:

| Option | Pros | Cons |
|--------|------|------|
| A: Add to PromptCopilotActions.ts | Existing file, console-specific | File getting large |
| B: Create new action files | Clean separation | More files |
| C: Generic action router | Flexible | Over-engineering |

**Decision**: Option A - Add to existing PromptCopilotActions.ts

**Rationale**:
- File exists and is the canonical location
- Actions are prompt-specific, belong together
- Refactoring can happen later if file grows too large

---

## ADR-003: Extraction Targeting - Always Infer vs. Optional

**Status**: DECIDED

**Context**: When extracting prompts, should we always call `inferTargetingFromSalience()` or make it optional?

**Options Considered**:

| Option | Pros | Cons |
|--------|------|------|
| A: Always infer | Consistent, no empty stages | May override user intent |
| B: Conditional on flag | Flexible | Another config option |
| C: Infer only if empty | Safe default | May miss updates |

**Decision**: Option A - Always infer during extraction

**Rationale**:
- Extraction creates NEW prompts, no existing user data to override
- Users can always edit stages in Inspector
- Better UX: prompts arrive with reasonable defaults
- Aligns with "auto-suggest, human confirms" pattern

---

## ADR-004: Title Variant Count

**Status**: DECIDED

**Context**: How many title variants should `/make-compelling` generate?

**Decision**: 3 variants

**Rationale**:
- Enough choice without overwhelming
- Fits in Copilot response without scrolling
- `generateVariants(title, 3)` already designed for this
- Can increase later based on user feedback

---

## ADR-005: Import Strategy for Server.js

**Status**: DECIDED

**Context**: server.js is CommonJS, TargetingInference.ts is ESM. How to import?

**Options Considered**:

| Option | Pros | Cons |
|--------|------|------|
| A: Dynamic import | Works with ESM | Async, uglier syntax |
| B: Compile to CJS | No async | Build complexity |
| C: Move to ESM server | Clean | Breaking change |

**Decision**: Option A - Dynamic import

**Rationale**:
- Already used elsewhere in server.js
- No build changes needed
- Pattern: `const { fn } = await import('./path.js')`
- Server-side async is fine

---

## Open Questions

None. All decisions made.

---

## Dependencies on Other Decisions

| This Decision | Depends On |
|---------------|------------|
| ADR-001 (Prepend) | Existing command parser structure |
| ADR-002 (Registration) | Existing Copilot infrastructure |
| ADR-003 (Always Infer) | Extraction pipeline ownership |
| ADR-005 (Dynamic Import) | Server.js module system |
