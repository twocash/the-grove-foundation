# Sprint: Card System Unification v1

**Sprint ID:** card-system-unification-v1  
**Status:** Planning  
**Time Budget:** 4 hours  
**Predecessor:** declarative-ui-config-v1 (Sprint 5)  

---

## Sprint Navigation

| Artifact | Purpose | Status |
|----------|---------|--------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis | ✅ |
| [SPEC.md](./SPEC.md) | Requirements & scope | ✅ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical approach | ✅ |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes | ✅ |
| [DECISIONS.md](./DECISIONS.md) | ADRs for key choices | ✅ |
| [SPRINTS.md](./SPRINTS.md) | Story breakdown | ✅ |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff | ✅ |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking | ⏳ |

---

## Problem Statement

The Visual State Matrix was documented in Sprint 3 planning but never fully implemented. Card components exist in three fragmented implementations with inconsistent styling:

1. **LensGrid** (Genesis) - Full-width rows, click-to-select, no inspector
2. **LensPicker** (Foundation) - 2-column grid, click-to-inspect, wrong button styles
3. **JourneyList** (Foundation) - 2-column grid, missing isInspected prop

This creates a "Frankensteined" experience where the same conceptual element (a lens card) looks and behaves differently depending on context.

## Solution

Enforce the existing Visual State Matrix specification across all card implementations through:

1. **Token-based styling** - Card states defined by CSS custom properties
2. **Shared state derivation** - `isInspected` derived from Engagement Machine
3. **Pattern compliance** - Extend Quantum Interface for any lens-reactive styling

## Success Criteria

- [ ] All cards implement the Visual State Matrix (Default → Inspected → Active)
- [ ] Button styles match documented spec (`bg-primary text-white`)
- [ ] Genesis and Foundation cards share visual language
- [ ] Styling changes require only CSS token updates, not code changes

---

*Created: December 2024*
*Sprint Series: UI/UX Unification (Sprint 6 of initiative)*
