# Sprint: Terminal Quantum Welcome v1

**Sprint ID:** `terminal-quantum-welcome-v1`
**Pattern Extended:** Pattern 1 (Quantum Interface)
**Status:** Planning Complete
**Estimated Duration:** 2-3 hours

## Summary

Wire Terminal's welcome experience to consume `useQuantumInterface()`, making the welcome card fully declarative and lens-reactive. Currently, Terminal doesn't consume the Quantum Interface pattern—the welcome content is disconnected from lens reality.

## The Fix

```
Lens Selection → useQuantumInterface() → reality.terminal → TerminalWelcome component
```

## Artifacts

| Artifact | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [SPEC.md](./SPEC.md) | Requirements & patterns extended |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Component design & data flow |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File change plan |
| [DECISIONS.md](./DECISIONS.md) | ADRs for design choices |
| [SPRINTS.md](./SPRINTS.md) | Story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff (self-contained) |
| [DEVLOG.md](./DEVLOG.md) | Progress tracking |

## Quick Start

```bash
# For Claude Code CLI:
cat C:\GitHub\the-grove-foundation\docs\sprints\terminal-quantum-welcome-v1\EXECUTION_PROMPT.md
```

## DEX Compliance

- **Declarative Sovereignty:** ✅ Welcome content defined in config (LensReality.terminal)
- **Capability Agnosticism:** ✅ Works regardless of model
- **Provenance:** ✅ Content traces to lens selection
- **Organic Scalability:** ✅ New lenses automatically get welcome treatment
