# Terminal Polish v1 — Repository Audit

**Sprint:** terminal-polish-v1  
**Audit Date:** 2024-12-25  
**Auditor:** Claude (via Foundation Loop)

---

## Executive Summary

This audit discovered that **Sprint 6 (card-system-unification-v1) documented `--card-*` tokens but they were never added to globals.css**. The CardShell component references undefined CSS variables. This sprint must first implement the missing tokens before any polish work.

---

## Critical Finding: Missing Token Implementation

### Evidence

**CardShell.tsx (lines 28-31) references:**
```typescript
'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'
'bg-[var(--card-bg-active)] border-[var(--card-border-active)] ring-1 ring-[var(--card-ring-active)]'
'border-[var(--card-border-default)] hover:border-primary/30'
```

**globals.css search result:**
```
grep -n "card-" globals.css → "not found"
```

**Impact:** Card visual states (default, active, inspected) are not rendering correctly because CSS variables are undefined.

---

## Token Namespace Inventory

### Currently Defined in globals.css

| Namespace | Purpose | Location |
|-----------|---------|----------|
| `--color-*` | Generic colors (primary, surface, etc.) | @theme block |
| `--color-grove-*` | Grove brand colors (cream, forest, clay) | @theme block |
| `--color-holo-*` | Foundation/holodeck accents (cyan, magenta) | @theme block |
| `--color-obsidian-*` | Foundation dark surfaces | @theme block |
| `--chat-*` | Chat/terminal column styling | :root block |

### Documented but NOT Implemented

| Namespace | Documented In | Status |
|-----------|---------------|--------|
| `--card-*` | Sprint 6 SPEC.md, PROJECT_PATTERNS.md | ❌ Missing |

### Utility Classes Defined

| Class | Purpose |
|-------|---------|
| `.f-panel` | Foundation glass panel |
| `.f-glow` | Holographic glow effect |
| `.f-grid-overlay` | Foundation grid background |

---

## Component Inventory: Card Grids

### LensPicker.tsx (529 lines)

**Location:** `src/explore/LensPicker.tsx`

**Card styling:** Inline Tailwind classes, not using tokens

```typescript
// Current (line ~210)
className={`
  group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative
  ${isInspected
    ? 'ring-2 ring-[var(--card-ring-color)] border-[var(--card-border-inspected)]'  // BROKEN
    : isActive
      ? 'border-[var(--card-border-active)] bg-[var(--card-bg-active)]'  // BROKEN
      : 'border-[var(--card-border-default)] dark:border-slate-700'  // BROKEN
  }
`}
```

**Finding:** References `--card-*` tokens but they don't exist. Fallback to hardcoded slate colors.

### JourneyList.tsx

**Location:** `src/explore/JourneyList.tsx`

**Status:** Similar pattern — uses inline classes with token references

### NodeGrid.tsx

**Location:** `src/explore/NodeGrid.tsx`

**Status:** Similar pattern — inline classes

---

## Component Inventory: Inspectors

### LensInspector.tsx (155 lines)

**Location:** `src/explore/LensInspector.tsx`

**Finding:** Renders fake config UI (Toggle, Slider, Select) instead of object data.

```typescript
// Current imports (line ~10)
import { Toggle, Slider, Select, Checkbox } from '../shared/forms';

// Renders
<Toggle checked={isActive} ... />
<Slider value={toneIntensity} ... />
<Select options={sourceOptions} ... />
```

**Problem:** This is mockup UI. The Inspector should show actual object JSON for developer/admin use.

### JourneyInspector.tsx

**Status:** Similar mockup UI pattern

### ObjectInspector Component

**Status:** Does not exist. Need to create for JSON rendering.

---

## Existing Patterns to Extend

| Pattern | Files | Extension Approach |
|---------|-------|-------------------|
| **Card Tokens (Pattern 4)** | globals.css, CardShell.tsx | Implement missing `--card-*` tokens |
| **Object Model (Pattern 7)** | grove-object.ts, GroveObjectCard/ | Use for Inspector data source |
| **Foundation Styling** | globals.css (f-panel, f-glow) | Reference for glass aesthetic |

---

## Files Requiring Changes

### Must Modify

| File | Lines | Change |
|------|-------|--------|
| `styles/globals.css` | +40-60 | Add `--card-*` tokens |
| `src/explore/LensInspector.tsx` | Replace | Use ObjectInspector |
| `src/explore/JourneyInspector.tsx` | Replace | Use ObjectInspector |

### Must Create

| File | Purpose |
|------|---------|
| `src/shared/inspector/ObjectInspector.tsx` | JSON viewer component |
| `src/shared/inspector/index.ts` | Barrel export |

### May Modify (Card Polish)

| File | Change |
|------|--------|
| `src/explore/LensPicker.tsx` | Verify token usage works after implementation |
| `src/explore/JourneyList.tsx` | Same |
| `src/explore/NodeGrid.tsx` | Same |

---

## Dependencies & Blockers

### Blocking Issues

1. **Missing CSS tokens** — CardShell references undefined variables
2. **No JSON inspector component** — Cannot show object data

### No External Dependencies

- No new packages required
- No schema changes needed
- No state machine changes needed

---

## Test Coverage Status

```
npm run test → 161/161 passing
npm run build → ✅
```

**Note:** Tests pass but visual states are broken due to missing tokens.

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Token naming conflicts | Low | Check all namespaces first |
| Breaking existing cards | Medium | Test all card views after token add |
| Inspector type mismatch | Low | Use GroveObject interface |

---

## Recommendations

1. **Immediate:** Implement `--card-*` tokens in globals.css
2. **Then:** Verify CardShell visual states work
3. **Then:** Create ObjectInspector component
4. **Then:** Replace fake inspector UI
5. **Optional:** Extend tokens with Grove Glass aesthetic

---

*Audit complete. Proceed to SPEC.md with Pattern Check.*
