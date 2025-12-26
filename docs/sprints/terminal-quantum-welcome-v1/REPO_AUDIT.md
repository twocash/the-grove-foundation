# Repository Audit: Terminal Quantum Welcome

**Date:** 2024-12-25
**Sprint:** terminal-quantum-welcome-v1

## Executive Summary

The Quantum Interface pattern is fully implemented for Genesis/Surface pages but Terminal does NOT consume it. The welcome experience is disconnected from lens reality—explaining why the Terminal welcome card looks different from the rest of the glass-themed UI.

## Current Architecture

### What Exists (Working)

```
src/surface/hooks/useQuantumInterface.ts
├── Observes lens changes from engagement state machine
├── Resolves reality from:
│   ├── schema.lensRealities (GCS-backed, takes precedence)
│   └── SUPERPOSITION_MAP (hardcoded fallback)
├── Returns: { reality, activeLens, isCollapsing, isLensHydrated }
└── reality.terminal = TerminalWelcome type (defined, populated)
```

### What Exists (Not Used by Terminal)

```typescript
// src/core/schema/narrative.ts - The type exists!
interface TerminalWelcome {
  heading: string;
  thesis: string;
  prompts: string[];
  footer: string;
  placeholder?: string;
}

// src/data/quantum-content.ts - Data exists!
'concerned-citizen': {
  terminal: {
    heading: "The Terminal.",
    thesis: "Plain-language explanations...",
    prompts: ["Why should I care...", ...],
    footer: "No jargon. Just answers.",
    placeholder: "Ask me anything..."
  }
}
```

### The Gap

```
Terminal.tsx
├── Does NOT import useQuantumInterface
├── Does NOT consume reality.terminal
├── Welcome state comes from... nowhere specific
└── Renders a disconnected UI when messages.length === 0
```

## File Analysis

### Files to Modify

| File | Current State | Required Change |
|------|---------------|-----------------|
| `components/Terminal.tsx` | No Quantum Interface | Add import, consume reality.terminal |
| `styles/globals.css` | Has glass-* tokens | Add glass-welcome-* classes |

### Files to Create

| File | Purpose |
|------|---------|
| `components/Terminal/TerminalWelcome.tsx` | Declarative welcome card |

### Files Already Correct (No Changes Needed)

| File | Status |
|------|--------|
| `src/surface/hooks/useQuantumInterface.ts` | ✅ Returns reality.terminal |
| `src/data/quantum-content.ts` | ✅ Has terminal content per lens |
| `src/core/schema/narrative.ts` | ✅ TerminalWelcome type defined |

## Data Flow (Current vs Target)

### Current (Broken)

```
Lens Selected → Terminal doesn't know → Shows generic/nothing
```

### Target (Fixed)

```
Lens Selected 
    ↓
useQuantumInterface() observes
    ↓
resolveReality() returns LensReality
    ↓
reality.terminal = { heading, thesis, prompts, footer }
    ↓
<TerminalWelcome welcome={reality.terminal} />
    ↓
Glass-styled card with lens-specific content
```

## Pattern Verification

**Pattern 1 (Quantum Interface) Status:**
- ✅ Type defined: `TerminalWelcome`
- ✅ Data populated: `SUPERPOSITION_MAP[lens].terminal`
- ✅ Hook working: `useQuantumInterface()` returns `reality.terminal`
- ❌ Consumer missing: Terminal doesn't call the hook

**This is purely a wiring issue.** The architecture is correct; Terminal just needs to plug in.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Import path issues | Low | Low | Verify hook export path |
| Missing terminal data for some lenses | Medium | Low | Fallback to DEFAULT_TERMINAL_WELCOME |
| Glass styling not applied | Low | Low | Use existing --glass-* tokens |
| Custom lens welcome generation | Low | Medium | realityCollapser already handles this |

## Dependencies

- `useQuantumInterface` hook (exists, working)
- `--glass-*` CSS tokens (exist, defined)
- `TerminalWelcome` type (exists, defined)
- Engagement state machine (exists, provides lens)

## Conclusion

This is a **Pattern Extension** sprint, not new infrastructure. All the pieces exist—Terminal just needs to consume them. Estimated effort: 2-3 hours including testing.
