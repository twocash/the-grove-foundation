# Sprint: terminal-overlay-machine-v1

**Version:** 1.0  
**Status:** Planning  
**Created:** 2024-12-25  
**Author:** Claude (Planning Agent) + Jim Calhoun

---

## Purpose

Refactor Terminal's overlay state from imperative boolean flags to a declarative state machine with registry-based component rendering. This sprint converts technical debt (duplicate state sources) into a Trellis-compliant pattern that enables organic scalability.

## The Problem

Terminal currently has **two sources of truth** for overlay visibility:

```typescript
// Source 1: flowState enum
type TerminalFlowState = 'idle' | 'welcome' | 'selecting' | 'wizard' | 'active';

// Source 2: Boolean flags (partially duplicating flowState)
showLensPicker: boolean;       // Duplicates 'selecting'
showJourneyPicker: boolean;    // Not in flowState at all!
showCustomLensWizard: boolean; // Duplicates 'wizard'
showWelcomeInterstitial: boolean; // Duplicates 'welcome'
```

This causes:
- Manual sync logic in `setFlowState()` that's error-prone
- Adding new overlays requires touching 5+ locations
- No enforcement of mutual exclusivity
- Input visibility logic scattered across conditions

## The Solution

Single discriminated union type + declarative registry:

```typescript
type TerminalOverlay = 
  | { type: 'none' }
  | { type: 'welcome' }
  | { type: 'lens-picker' }
  | { type: 'journey-picker' }
  | { type: 'wizard'; wizardId?: string };

// New overlays: add to type + registry. Done.
```

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Overlay configs in registry, not hardcoded |
| **Capability Agnosticism** | Same pattern works regardless of model |
| **Provenance** | Overlay transitions logged to analytics |
| **Organic Scalability** | New overlays = type + registry entry |

## Artifacts

| Document | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [SPEC.md](./SPEC.md) | Requirements and patterns |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical design |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes |
| [SPRINTS.md](./SPRINTS.md) | Epic and story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Handoff to execution agent |
| [DEVLOG.md](./DEVLOG.md) | Execution journal |

## Success Criteria

- [ ] Single `overlay` state replaces 4 boolean flags
- [ ] `TerminalOverlayRenderer` handles all overlay rendering
- [ ] Adding new overlay requires only type + registry entry
- [ ] All existing tests pass
- [ ] No visual regression in Terminal UI
- [ ] Build succeeds with no TypeScript errors
