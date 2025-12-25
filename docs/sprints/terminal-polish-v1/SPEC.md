# Terminal Polish v1 — Specification

**Sprint:** terminal-polish-v1  
**Status:** Planning  
**Estimated effort:** 6-8 hours

---

## Phase 0: Pattern Check ✅

### Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Card visual states | **Pattern 4: Token Namespaces** | Implement missing `--card-*` tokens from Sprint 6 |
| JSON object display | **Pattern 7: Object Model** | Create ObjectInspector that consumes GroveObject |
| Inspector wrapper | InspectorPanel component | Compose ObjectInspector inside existing wrapper |
| Glass aesthetic | Foundation `.f-panel` utilities | Reference for styling, extend `--card-*` tokens |

### New Patterns Proposed

**None.** All requirements met by extending existing patterns.

### Warning Signs Checked

- ❌ ~~Creating new React Context~~ — Using existing components
- ❌ ~~Creating new JSON config~~ — Using existing GroveObject schema
- ❌ ~~Creating new hooks~~ — Using existing useGroveObjects
- ❌ ~~Hardcoded conditionals~~ — Using declarative token system
- ❌ ~~Parallel infrastructure~~ — Implementing documented-but-missing tokens

---

## Problem Statement

**Critical Discovery:** Sprint 6 documented `--card-*` tokens in PROJECT_PATTERNS.md but they were **never implemented in globals.css**. CardShell.tsx references undefined CSS variables:

```typescript
// CardShell.tsx uses these variables that don't exist:
'border-[var(--card-border-default)]'
'border-[var(--card-border-active)]'
'ring-[var(--card-ring-color)]'
```

Additionally, the Inspector panels (LensInspector, JourneyInspector) render fake config UI instead of actual object data.

---

## Requirements

### REQ-1: Implement Missing Card Tokens

Add the `--card-*` tokens documented in Sprint 6 to globals.css:

```css
:root {
  --card-border-default: #e7e5e4;
  --card-border-inspected: theme('colors.cyan.400');
  --card-border-active: theme('colors.emerald.400/50');
  --card-bg-active: rgba(16, 185, 129, 0.05);
  --card-ring-color: theme('colors.cyan.400');
  --card-ring-active: theme('colors.emerald.300/30');
}

.dark {
  --card-border-default: #334155;
  --card-bg-active: rgba(16, 185, 129, 0.1);
}
```

**Lines:** ~20  
**Pattern:** Extends Pattern 4 (Token Namespaces)

### REQ-2: Create ObjectInspector Component

New component that renders any GroveObject as collapsible JSON:

```typescript
interface ObjectInspectorProps {
  object: GroveObject;
  title?: string;
  onClose: () => void;
}
```

Features:
- Collapsible META section (id, type, status, provenance)
- Collapsible PAYLOAD section (type-specific data)
- JSON syntax highlighting
- Copy-to-clipboard for full JSON

**Files:** 
- `src/shared/inspector/ObjectInspector.tsx` (~120 lines)
- `src/shared/inspector/index.ts` (~5 lines)

**Pattern:** Extends Pattern 7 (Object Model)

### REQ-3: Replace LensInspector

Replace fake config UI with ObjectInspector:
- Convert Persona to GroveObject format
- Remove Toggle/Slider/Select imports
- Render ObjectInspector with converted data

**Modify:** `src/explore/LensInspector.tsx`  
**Lines changed:** ~80 (mostly deletion)

### REQ-4: Replace JourneyInspector

Same pattern as REQ-3.

**Modify:** `src/explore/JourneyInspector.tsx`  
**Lines changed:** ~80

---

## Out of Scope

- **Card grid layout changes** — Cards already use CardShell; tokens will fix styling
- **Left navigation** — Functional, defer redesign
- **Marketing split-view** — Isolated, unchanged
- **Terminal chat** — Separate sprint
- **Inline JSON editing** — Future enhancement (read-only in v1)
- **Grove Glass aesthetic extension** — Deferred to v1.1 after base tokens work

---

## Files Summary

### Create
| File | Lines | Purpose |
|------|-------|---------|
| `src/shared/inspector/ObjectInspector.tsx` | ~120 | JSON viewer |
| `src/shared/inspector/index.ts` | ~5 | Barrel |

### Modify
| File | Change | Lines |
|------|--------|-------|
| `styles/globals.css` | Add `--card-*` tokens | +20 |
| `src/explore/LensInspector.tsx` | Replace with ObjectInspector | ~80 |
| `src/explore/JourneyInspector.tsx` | Replace with ObjectInspector | ~80 |

**Total: ~305 lines** (much smaller than original estimate after focusing scope)

---

## DEX Compliance

### Declarative Sovereignty
Token values can be modified in CSS without code changes. ObjectInspector renders any object with GroveObjectMeta—no hardcoded type checks.

### Capability Agnosticism
ObjectInspector works regardless of content type. GroveObject interface is the contract.

### Provenance
ObjectInspector displays `createdBy` field from GroveObjectMeta, making provenance visible.

### Organic Scalability
Adding new object types to Inspector requires only a normalizer function (see Pattern 7). No component changes.

---

## Success Criteria

- [ ] `--card-*` tokens defined in globals.css
- [ ] CardShell visual states work (default, active, inspected)
- [ ] ObjectInspector component renders GroveObject JSON
- [ ] LensInspector shows actual Persona data
- [ ] JourneyInspector shows actual Journey data
- [ ] Build passes
- [ ] All 161 tests pass
- [ ] No visual regressions on marketing demo

---

## Test Matrix

| Screen | Action | Before | After |
|--------|--------|--------|-------|
| Lenses | View cards | Inconsistent borders | Token-based borders |
| Lenses | Click card | Fake sliders | JSON with Persona data |
| Lenses | Hover card | Works | No change |
| Journeys | Click card | Fake UI | JSON with Journey data |
| Marketing | Load page | Works | No change |

---

*Phase 0 Pattern Check complete. Proceed to ARCHITECTURE.md.*
