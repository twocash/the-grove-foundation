# Field Architecture Quick Reference

*For full specification, see [FIELD_ARCHITECTURE.md](./FIELD_ARCHITECTURE.md)*

---

## Core Concepts

**Field** = Knowledge domain with RAG + exploration tools + Sprouts

**Namespace** = Prefix identifying entity origin (`legal.`, `grove.`, `legal-grove.`)

**Composite Field** = Merged from 2+ parent Fields, inherits their namespaced entities

---

## MVP Requirements

All code must:
1. Include `fieldId` on every Sprout
2. Include `fieldId` on every TerminalSession  
3. Show Field indicator in Terminal header
4. Support Field filter in Cultivate (even if single option)

---

## Key Schema Points

```typescript
// Every Sprout must have Field context
interface Sprout {
  fieldId: string;        // REQUIRED
  fieldSlug: string;      // For URL routing
  fieldName: string;      // Denormalized for display
  // ...
}

// Every Session must be Field-scoped
interface TerminalSession {
  fieldId: string;        // REQUIRED, immutable per session
  fieldSlug: string;
  fieldName: string;
  // ...
}

// Field switching = new session (clean break)
```

---

## UX Rules

| Surface | Field Behavior |
|---------|----------------|
| **Explore/Terminal** | Workspace-style: always "in" a Field |
| **Cultivate** | Filter-style: see across Fields, filter by Field |
| **Foundation Console** | Admin: manage Field config, view analytics |

---

## Namespace Examples

```
grove.strategic-insight          // Card from Grove Field
legal.contract-clause            // Card from Legal Field
legal-grove.regulatory-risk      // Card created in composite
```

---

## What NOT to Do

❌ Create Sprouts without `fieldId`  
❌ Allow sessions to span multiple Fields  
❌ Query across Fields without explicit composite  
❌ Use entity IDs without namespace prefix  

---

## Phase Roadmap

| Phase | Features |
|-------|----------|
| **MVP** | Single Field (Grove Foundation), schema ready |
| **Phase 2** | Multi-Field, Field creation, switching |
| **Phase 2+** | Composite Fields, marketplace |
| **Phase 3** | Attribution credits, federation |
