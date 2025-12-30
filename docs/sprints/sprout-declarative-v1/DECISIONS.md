# Architecture Decision Records: sprout-declarative-v1

**Sprint:** sprout-declarative-v1  
**Date:** December 30, 2024  

---

## ADR-001: Extend Sprout Rather Than Create Research Type

### Status
Accepted

### Context
We need to capture research intent alongside captured insights. Two approaches:
1. Create new `ResearchDirective` type parallel to `Sprout`
2. Extend `Sprout` with optional `researchManifest` field

### Decision
**Extend Sprout with optional `researchManifest` field.**

### Rationale
- Honors Pattern 11 (Selection Action) — extend, don't duplicate
- Research sprouts share provenance, storage, display infrastructure
- Simpler mental model: everything captured is a sprout, some have research intent
- Avoids parallel storage systems (`grove-sprouts` vs `grove-research`)
- Stage lifecycle applies uniformly

### Consequences
- Sprout type becomes larger (optional fields)
- SproutCard must handle both display modes
- Type guards needed for research-specific operations

---

## ADR-002: 8-Stage Botanical Lifecycle Over 3-Stage MVP

### Status
Accepted

### Context
Current MVP uses `'sprout' | 'sapling' | 'tree'`. Foundation Refactor Spec documents 8 botanical stages. Options:
1. Keep 3-stage MVP
2. Implement full 8-stage lifecycle
3. Implement 8-stage with only 4 active initially

### Decision
**Implement full 8-stage lifecycle in schema, activate stages incrementally.**

### Rationale
- Schema defines what's possible; UI reveals what's ready
- Avoids future migration from 3 → 8
- `sprout-stages.json` can hide stages via `active: false`
- Backward compatible: existing `'sprout'` maps to `'tender'`

### Consequences
- More complex stage badge rendering
- Transition validation needed
- Future sprints activate dormant stages

---

## ADR-003: JSON Config Over TypeScript Constants

### Status
Accepted

### Context
Current `sprout-capture.config.ts` exports TypeScript constants. Options:
1. Keep TypeScript constants
2. Extract to JSON with TypeScript types
3. Full JSON schema with runtime validation

### Decision
**Extract to JSON files with TypeScript type inference.**

### Rationale
- Honors DEX Declarative Sovereignty
- JSON editable by non-engineers
- Build-time import = no runtime fetch
- TypeScript types generated from JSON schema
- Pattern established by existing journey/hub configs

### Consequences
- Need JSON schema files for validation
- Build step to generate types (or manual sync)
- IDE autocomplete requires generated types

---

## ADR-004: Prompt Template as Markdown with Handlebars

### Status
Accepted

### Context
Research prompts need templating. Options:
1. String concatenation in code
2. Template literals with interpolation
3. Handlebars/Mustache template file
4. MDX with components

### Decision
**Markdown file with Handlebars syntax.**

### Rationale
- Markdown readable by non-engineers
- Handlebars is minimal, no logic in templates
- Template lives in `data/` with other configs
- Easy to add new templates per purpose type
- No build step required (runtime rendering)

### Consequences
- Add `handlebars` dependency (3KB gzipped)
- Template errors surface at runtime
- Need template preview in dev tools

---

## ADR-005: ActionMenu Component Over Pill Variants

### Status
Accepted

### Context
Multiple actions available on selection. Options:
1. Multiple pills (one per action)
2. Single pill with dropdown menu
3. Single pill that cycles actions on click
4. Pill opens dedicated ActionMenu component

### Decision
**Single MagneticPill opens ActionMenu component.**

### Rationale
- Single interaction point (less visual noise)
- ActionMenu reads from `selection-actions.json`
- Scales to N actions without UI changes
- Keyboard navigation possible in menu
- Matches existing capture card pattern (pill → card)

### Consequences
- Two-click flow (pill → menu → card)
- Need keyboard shortcut for power users
- ActionMenu needs focus management

---

## ADR-006: Fix MagneticPill Bug In-Sprint

### Status
Accepted

### Context
MagneticPill has inverted scale behavior (repels instead of attracts). Options:
1. Fix in separate bug-fix sprint
2. Fix as part of this sprint
3. Document and defer

### Decision
**Fix as Epic 1 of this sprint.**

### Rationale
- Bug affects core interaction
- Fix is isolated (single file)
- Sprint touches MagneticPill anyway (multi-action)
- Clean foundation before extending

### Consequences
- Slightly larger sprint scope
- E2E tests must verify correct behavior
- Visual baseline update required

---

## ADR-007: Research Clue Types as Enum

### Status
Accepted

### Context
Clues have types (URL, citation, author, etc.). Options:
1. Free-form string type
2. Fixed enum in TypeScript
3. Configurable via JSON
4. Enum in JSON with TypeScript inference

### Decision
**Enum defined in `research-purposes.json`, TypeScript type inferred.**

### Rationale
- Common types are predictable (URL, citation, author, concept, question)
- Enum enables type-specific icons and validation
- JSON allows adding types without code change
- TypeScript inference provides type safety

### Consequences
- Need union type generation from JSON
- UI must handle unknown types gracefully
- Validation at capture time

---

## ADR-008: Copy-to-Clipboard Over Direct Execution

### Status
Accepted

### Context
Generated prompts need to reach an LLM. Options:
1. Direct API call to Claude/GPT
2. Open in new Terminal session
3. Copy to clipboard, user pastes
4. Integration with external tools (Raycast, etc.)

### Decision
**Copy to clipboard with visual feedback. User pastes into preferred tool.**

### Rationale
- No API key management
- Works with any LLM (Claude, GPT, local)
- Preserves user choice of execution context
- Minimal infrastructure
- Clear MVP scope boundary

### Consequences
- Manual step required
- No automatic harvest back into sprout
- Future sprint can add direct execution

---

## ADR-009: Stage Transitions in JSON Config

### Status
Accepted

### Context
Stage transitions need validation. Options:
1. Hardcode in TypeScript
2. State machine (XState)
3. Transition map in JSON
4. No validation (any transition allowed)

### Decision
**Transition map in `sprout-stages.json`.**

### Rationale
- Transitions are domain logic → belongs in config
- Simple map sufficient (not full state machine)
- Allows future stage additions without code
- Runtime validation throws on invalid transition

### Consequences
- Must validate before stage change
- Error handling for invalid transitions
- UI can disable invalid transition buttons

---

## ADR-010: Preserve Deprecated `status` Field

### Status
Accepted

### Context
Existing sprouts have `status` field. Options:
1. Remove `status`, migrate to `stage`
2. Keep both, `status` deprecated
3. Alias `status` to `stage`

### Decision
**Keep both fields. `status` marked @deprecated, computed from `stage`.**

### Rationale
- Zero breaking changes for existing code
- Gradual migration path
- Storage migration handles existing data
- TypeScript deprecation warning guides developers

### Consequences
- Dual fields until full migration
- Getter computes `status` from `stage`
- Future sprint removes `status`

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | Jim + Claude | Initial ADRs |
