# Terminal Polish v1 — Decisions

**Sprint:** terminal-polish-v1

---

## ADR-001: Implement Missing Tokens vs. Create New System

### Context

Sprint 6 documented `--card-*` tokens but they were never added to globals.css. We have two options:

1. **Implement the documented tokens** as specified
2. **Create a new `--grove-*` system** with different naming

### Decision

**Implement the documented tokens** exactly as specified in Sprint 6.

### Rationale

- PROJECT_PATTERNS.md already references `--card-*` as the canonical pattern
- CardShell.tsx already uses these variable names
- Creating a parallel system violates DEX Anti-Pattern 1 (The Parallel System)
- Less code change: implement ~20 lines vs. rename references in multiple files

### Consequences

- Card styling will work immediately after token implementation
- No component changes needed for basic functionality
- Future Grove Glass aesthetic extends this system rather than replacing it

---

## ADR-002: ObjectInspector as Read-Only in v1

### Context

The Inspector could be:
1. **Read-only JSON viewer** — Display object data
2. **Editable JSON editor** — Allow inline modifications

### Decision

**Read-only in v1.** Editing deferred to future sprint.

### Rationale

- Simpler implementation: ~120 lines vs. ~300+ for editing
- Editing requires validation, undo/redo, conflict handling
- Primary use case is inspection/debugging, not configuration
- Can add editing later without changing component interface (just add optional `onEdit` prop)

### Consequences

- Users can view and copy data but not modify inline
- Configuration changes require code/config file edits
- Clear upgrade path: add `onEdit` prop when ready

---

## ADR-003: Normalizer Functions vs. Interface Extension

### Context

Persona objects don't implement GroveObjectMeta. We can:

1. **Create normalizer functions** that convert Persona → GroveObject
2. **Extend Persona interface** to implement GroveObjectMeta directly

### Decision

**Create normalizer functions.** Keep Persona interface unchanged.

### Rationale

- Persona schema is shared with NarrativeEngine and may be used elsewhere
- Normalizers are isolated (~20 lines each) and easy to test
- Pattern 7 already establishes normalizers as the approach (see normalizeHub in useGroveObjects)
- No breaking changes to existing code

### Consequences

- Each object type needs a small normalizer function
- Slight runtime overhead (object conversion)
- Clear separation: schema types vs. display types

### Implementation

```typescript
function personaToGroveObject(persona: Persona, isActive: boolean): GroveObject {
  return {
    meta: {
      id: persona.id,
      type: 'lens',
      title: persona.publicLabel,
      description: persona.description,
      status: isActive ? 'active' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
    },
    payload: {
      systemPrompt: persona.systemPrompt,
      tone: persona.tone,
      contentFilters: persona.contentFilters,
      // ... other fields
    },
  };
}
```

---

## ADR-004: JSON Syntax Highlighting Approach

### Context

JSON display could use:

1. **Custom CSS classes** for syntax colors
2. **Existing library** (react-syntax-highlighter, prism)
3. **Tailwind utilities** inline

### Decision

**Custom CSS classes** matching existing Foundation palette.

### Rationale

- No new dependencies
- Colors match existing `--color-holo-*` tokens
- Simple recursive renderer (~60 lines)
- Full control over styling

### Implementation

```css
.json-key { color: var(--color-holo-cyan); }
.json-string { color: #10b981; }  /* emerald */
.json-number { color: #f59e0b; }  /* amber */
.json-boolean { color: #8b5cf6; } /* violet */
.json-null { color: var(--chat-text-muted); }
```

### Consequences

- Consistent with Foundation aesthetic
- No bundle size increase
- Easy to modify colors later

---

## ADR-005: Scope Reduction — Defer Card Grid Changes

### Context

Original SPEC included card grid styling changes. Audit revealed:

1. Cards already use token variables
2. Problem is missing token definitions, not component code
3. Card grid layout is functional

### Decision

**Defer card grid changes.** Focus on tokens + inspector.

### Rationale

- Implementing tokens will fix card styling without component changes
- Reduces sprint scope by ~60 lines of component modifications
- Can verify token effectiveness before additional changes
- Lower risk of regressions

### Consequences

- Sprint is smaller and more focused
- Card grid polish (Grove Glass aesthetic) becomes v1.1
- Clear separation of concerns: tokens first, aesthetics second

---

## Decision Summary

| Decision | Choice | Key Rationale |
|----------|--------|---------------|
| Token approach | Implement documented `--card-*` | Avoid parallel systems |
| Inspector editing | Read-only v1 | Simpler, clear upgrade path |
| Data conversion | Normalizer functions | Don't modify shared schemas |
| Syntax highlighting | Custom CSS classes | No dependencies, matches palette |
| Scope | Tokens + Inspector only | Cards will auto-fix |

---

*Decisions documented. Proceed to SPRINTS.md.*
