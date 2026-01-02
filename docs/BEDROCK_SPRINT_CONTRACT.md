# Bedrock Sprint Contract

**Version:** 1.0  
**Status:** BINDING FOR ALL BEDROCK DEVELOPMENT  
**Effective:** December 30, 2025  
**Branch:** `bedrock`

---

## Preamble

This contract governs all development work on the `bedrock` branch. It operates as a **binding overlay** to the Foundation Loop methodology. Every Bedrock sprint must satisfy both:

1. The Foundation Loop requirements (Phases 0-8)
2. This Bedrock Sprint Contract (additional constraints)

**Violation of this contract blocks merge to `bedrock` branch.**

---

## Article I: Constitutional Compliance

### Section 1.1: Document Hierarchy

Every Bedrock sprint acknowledges this document hierarchy:

| Document | Authority | Must Reference |
|----------|-----------|----------------|
| `The_Trellis_Architecture__First_Order_Directives.md` | Constitutional | Yes, in every SPEC.md |
| `Bedrock_Architecture_Specification.md` | Architectural | Yes, for pattern decisions |
| `Trellis_Architecture_Bedrock_Addendum.md` | Implementation | Yes, for compliance tests |
| `copilot-configurator-vision.md` | Feature spec | When implementing Copilot |
| `grove-object.ts` | Data model | When creating/modifying objects |

### Section 1.2: DEX Compliance Tests

Every feature in a Bedrock sprint MUST pass all four DEX tests. Document results in SPEC.md:

```markdown
## DEX Compliance Matrix

### Feature: [Feature Name]

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | [ ] | Can non-technical user modify via config? How? |
| Capability Agnosticism | [ ] | What happens if model hallucinates? |
| Provenance as Infrastructure | [ ] | Can every fact trace to source? |
| Organic Scalability | [ ] | Can new types use this without code changes? |

**Blocking issues:** [List any failures that must be resolved]
```

**A feature that fails any DEX test cannot ship.**

---

## Article II: The Canonical Console Pattern

### Section 2.1: Structure Mandate

Every Bedrock console MUST implement this exact structure:

```
┌──────────────────────────────────────────────────────────────┐
│ Console Header (title, description, actions)                 │
├──────────────────────────────────────────────────────────────┤
│ Metrics Row (4-6 key stats, always visible)                 │
├────────────┬─────────────────────────┬──────────────────────┤
│ Navigation │ Content Area            │ Inspector + Copilot  │
│ (240px)    │ (flex)                  │ (360px)              │
└────────────┴─────────────────────────┴──────────────────────┘
```

**No exceptions.** If a console cannot fit this pattern, escalate to architectural review before proceeding.

### Section 2.2: Required Components

Every console MUST use these shared components:

| Component | Location | Required For |
|-----------|----------|--------------|
| `BedrockLayout` | `src/bedrock/primitives/` | Console shell |
| `BedrockNav` | `src/bedrock/primitives/` | Navigation column |
| `BedrockInspector` | `src/bedrock/primitives/` | Inspector column |
| `BedrockCopilot` | `src/bedrock/primitives/` | Copilot panel |
| `StatCard` | `src/bedrock/components/` | Metrics display |
| `ObjectList` | `src/bedrock/components/` | Collection navigation |
| `ObjectGrid` | `src/bedrock/components/` | Content display |

**Creating new structural components requires architectural review.**

### Section 2.3: Console Checklist

Every console implementation MUST complete this checklist in SPEC.md:

```markdown
## Console Implementation Checklist

- [ ] Uses `BedrockLayout` as shell
- [ ] Header displays: title, description, primary action
- [ ] Metrics row shows 4-6 relevant stats
- [ ] Navigation column uses `ObjectList` or equivalent
- [ ] Content area uses `ObjectGrid` or appropriate view
- [ ] Inspector uses `BedrockInspector` shell
- [ ] Copilot panel integrated with console context
- [ ] Navigation declaratively configured in `navigation.ts`
- [ ] All object types use `GroveObject` schema
```

---

## Article III: Copilot Integration

### Section 3.1: Copilot Mandate

Every Bedrock console MUST include a Copilot. No console ships without AI assistance.

### Section 3.2: Context Protocol

Every Copilot implementation MUST provide context following this interface:

```typescript
interface BedrockCopilotContext {
  // Identity
  consoleId: string;
  
  // Current selection
  selectedObject?: GroveObject;
  selectedObjectType?: GroveObjectType;
  
  // View state
  filters: FilterState;
  sortOrder: SortState;
  
  // Schema for validation
  schema?: ObjectSchema;
  
  // Related objects for reference resolution
  relatedObjects: Record<GroveObjectType, GroveObject[]>;
}
```

### Section 3.3: Required Copilot Capabilities

Every console Copilot MUST support these baseline capabilities:

| Capability | Description | Implementation |
|------------|-------------|----------------|
| Schema awareness | Knows valid fields for current object | Load schema on selection |
| Patch generation | Produces JSON patches from natural language | Structured output prompt |
| Validation | Rejects invalid patches before display | Schema validation layer |
| Diff preview | Shows changes before applying | Standard diff component |
| Model indicator | Shows which model is active | UI indicator |

### Section 3.4: Console-Specific Actions

Each console MUST define its specific Copilot actions in SPEC.md:

```markdown
## Copilot Actions

| Action | Trigger | Output | Model Preference |
|--------|---------|--------|------------------|
| [Action name] | [User intent] | [What Copilot produces] | [local/hybrid/cloud] |
```

---

## Article IV: Object Model Compliance

### Section 4.1: GroveObject Mandate

Every entity in Bedrock MUST use the `GroveObject` schema:

```typescript
interface GroveObject<T = unknown> {
  meta: GroveObjectMeta;  // id, type, title, timestamps, provenance
  payload: T;             // Type-specific data
}
```

**No raw objects.** If data doesn't fit GroveObject, escalate to architectural review.

### Section 4.2: Object Model Boundary

Respect the object model boundary:

| Category | Object Types | Console Group |
|----------|--------------|---------------|
| Sprouts (Write Path) | Sprout, SproutClaim, SproutProposal | Knowledge Garden |
| DEX Objects (Read Path) | Hub, Journey, Node, Lens, Moment, Persona | Experience Design |
| System Objects | FeatureFlag, SystemVoice, AudioTrack, HealthCheck | System Configuration |

**Sprouts are the atomic unit of knowledge change.** DEX objects organize how Sprouts surface. Do not conflate.

### Section 4.3: Type Registration

Every new object type MUST be:

1. Added to `GroveObjectType` union in `grove-object.ts`
2. Documented in `BEDROCK_OBJECT_CATALOG.md`
3. Given a schema definition
4. Given default Copilot actions

---

## Article V: Strangler Fig Awareness

### Section 5.1: No Legacy Coupling

Bedrock code MUST NOT:

- Import from `src/foundation/` (legacy)
- Share state with legacy components
- Assume legacy behavior or data structures
- Use legacy component patterns

**Bedrock is a clean-room implementation.**

### Section 5.2: Feature Parity Tracking

Every sprint MUST update the feature parity checklist:

```markdown
## Feature Parity Status

| Feature | Legacy Location | Bedrock Status | Parity? |
|---------|-----------------|----------------|---------|
| Sprout moderation | SproutQueue.tsx | [status] | [ ] |
| Journey editing | NarrativeArchitect.tsx | [status] | [ ] |
| ... | ... | ... | ... |
```

### Section 5.3: Migration Path

When implementing a feature that exists in legacy:

1. **Audit legacy** — Document what exists, what works, what's broken
2. **Design fresh** — Apply Bedrock patterns, ignore legacy implementation
3. **Verify parity** — Ensure all legacy capabilities are covered
4. **Document differences** — Note intentional deviations from legacy

---

## Article VI: Sprint Artifacts

### Section 6.1: Required Sections

Every Bedrock sprint SPEC.md MUST include:

```markdown
# Sprint: [name]

## Constitutional Reference
- [ ] Read: The_Trellis_Architecture__First_Order_Directives.md
- [ ] Read: Bedrock_Architecture_Specification.md
- [ ] Read: Relevant object schemas

## DEX Compliance Matrix
[Per Section 1.2]

## Console Implementation Checklist
[Per Section 2.3]

## Copilot Actions
[Per Section 3.4]

## Object Types Used
[List all GroveObject types touched]

## Feature Parity Status
[Per Section 5.2]

## Patterns Extended
[Standard Foundation Loop requirement]
```

### Section 6.2: EXECUTION_PROMPT Additions

Every Bedrock EXECUTION_PROMPT.md MUST include:

```markdown
## Bedrock Verification

Before starting:
- [ ] On `bedrock` branch
- [ ] No imports from `src/foundation/`
- [ ] BedrockLayout available

After each epic:
- [ ] Console pattern checklist passes
- [ ] Copilot receives correct context
- [ ] GroveObject schema used for all entities
- [ ] DEX compliance tests documented

Final verification:
- [ ] Feature parity checklist updated
- [ ] No legacy coupling introduced
- [ ] All DEX tests pass
```

---

## Article VII: Enforcement

### Section 7.1: Pre-Merge Checklist

Before any PR merges to `bedrock`:

```markdown
## Bedrock Merge Checklist

- [ ] SPEC.md includes all required sections (Article VI)
- [ ] DEX compliance matrix shows all passes (Article I)
- [ ] Console pattern checklist complete (Article II)
- [ ] Copilot integrated with context (Article III)
- [ ] All objects use GroveObject schema (Article IV)
- [ ] No imports from src/foundation/ (Article V)
- [ ] Feature parity status updated (Article V)
- [ ] Tests pass (Foundation Loop requirement)
- [ ] Visual baselines updated if applicable
```

### Section 7.2: Architectural Review Triggers

These situations require architectural review before proceeding:

1. Console doesn't fit canonical pattern
2. New structural component needed
3. Object doesn't fit GroveObject schema
4. DEX test fails and workaround proposed
5. Legacy coupling seems necessary
6. New object type proposed

### Section 7.3: Contract Amendments

This contract may be amended via:

1. Proposal documented in sprint SPEC.md
2. Architectural review approval
3. Contract version increment
4. All team members notified

---

## Article VIII: Quick Reference

### The Bedrock Mantra

> Features are proven. Patterns are established. Now we produce them correctly.

### The Four Questions

Before shipping any Bedrock feature:

1. **Does it use BedrockLayout?** (Console pattern)
2. **Does it have a Copilot?** (AI assistance)
3. **Does it use GroveObject?** (Data model)
4. **Does it pass DEX tests?** (Constitutional compliance)

### The Build Sequence

```
Sprint 0: Infrastructure (BedrockLayout, Nav, Inspector, Copilot)
Sprint 1: Sprout Queue (first complete console, proves pattern)
Sprint 2+: Feature conveyor (one console per sprint)
```

### File Locations

```
src/bedrock/
├── primitives/          # BedrockLayout, Nav, Inspector, Copilot
├── components/          # Shared components (StatCard, ObjectList, etc.)
├── consoles/            # Individual console implementations
├── config/              # Declarative configuration (navigation.ts, etc.)
├── copilot/             # Copilot context and actions
└── types/               # TypeScript interfaces
```

---

## Signatures

By commencing work on the `bedrock` branch, contributors agree to this contract.

**Effective Date:** December 30, 2025  
**Version:** 1.0

---

*This contract ensures Bedrock delivers on the architectural vision. Deviations fragment the reference implementation. When in doubt, escalate to architectural review.*
