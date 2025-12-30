# Kinetic Experience v1: Foundation Loop Complete

**Sprint:** kinetic-experience-v1
**Status:** Ready for Execution
**Date:** December 28, 2025

---

## Executive Summary

This sprint creates a new exploration surface at `/explore` that implements the Kinetic Stream vision. Using a **hard boundary strategy** with **structural barriers**, we build fresh components without any Terminal dependencies.

**The Mission:** Build the exploration surface that Terminal was trying to become.

**Core Insight:** Previous attempts to evolve Terminal failed because sprint tasks referenced Terminal files. The solution is architectural, not disciplinary — create a completely separate component tree with enforced boundaries.

---

## Protected Scope

**The Genesis page right-rail Terminal is NOT touched by this sprint.**

| Component | Status |
|-----------|--------|
| Genesis marketing Terminal | ✅ Protected |
| `/terminal` route | ✅ Protected |
| `/explore` route | 🆕 This sprint |

---

## Structural Barriers (NEW)

Three mechanisms prevent context window gravity from pulling back to Terminal:

| Barrier | File | Purpose |
|---------|------|---------|
| Clean Room Declaration | `README.md` | Visible warning in directory |
| Type Firewall | `types.ts` | Re-exports only StreamItem types |
| Import Enforcer | `.eslintrc.js` | Build fails on Terminal imports |
| Route-First | Story 1.1 | Blank canvas before components |
| No TerminalLayout | Story 1.3 | Plain div containers only |

---

## Foundation Loop Artifacts

| Document | Purpose | Status |
|----------|---------|--------|
| [SPEC.md](./SPEC.md) | Technical specification with structural barriers | ✅ Complete |
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Codebase analysis and import map | ✅ Complete |
| [ARCH_DECISIONS.md](./ARCH_DECISIONS.md) | Architecture decision records (10 ADRs) | ✅ Complete |
| [TEST_STRATEGY.md](./TEST_STRATEGY.md) | Testing approach and E2E specs | ✅ Complete |
| [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) | Strangler fig migration phases | ✅ Complete |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown with firewall stories | ✅ Complete |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Claude Code handoff with Step 0 Firewall | ✅ Complete |

---

## Quick Start: Execution Handoff

### For Claude Code CLI

```bash
# Navigate to project
cd C:\GitHub\the-grove-foundation

# Read the execution prompt
cat docs/sprints/kinetic-experience-v1/EXECUTION_PROMPT.md

# CRITICAL: Execute Step 0 (Firewall) FIRST
# Then Step 1 (Route)
# Then proceed sequentially
```

### Execution Order

1. **Step 0: Firewall** — Create README.md, types.ts, .eslintrc.js
2. **Step 1: Route** — Create blank "Hello Kinetic" page
3. **Step 2: Directory** — Create component structure
4. **Step 3+: Components** — Build ExploreShell, renderer, blocks

### Critical Verification

```bash
# After every file save:
grep -r "Terminal" src/surface/components/KineticStream/
# Must return: Only README.md

grep -r "TerminalLayout" src/surface/components/KineticStream/
# Must return: empty
```

---

## Sprint Scope

### In Scope (MVP)

| Component | Description |
|-----------|-------------|
| Firewall files | README.md, types.ts, .eslintrc.js |
| `/explore` route | New exploration surface |
| ExploreShell | Main container (plain div, NO TerminalLayout) |
| KineticRenderer | Polymorphic StreamItem router |
| ResponseObject | Glass-styled AI responses |
| QueryObject | User message display |
| NavigationObject | Fork button groups |
| CommandConsole | Floating input |
| ConceptSpan | Orange clickable concepts |
| RhetoricRenderer | Content with injected spans |
| Pivot mechanic | Concept click → new query |

### Out of Scope (Future)

- Lens picker UI
- Journey selection
- Session persistence
- Welcome experience
- LensPeek hover cards
- Command palette
- Mobile optimization

---

## Key Decisions

1. **Hard Boundary** — No imports from `components/Terminal/`
2. **Structural Barriers** — Firewall files enforce at build time
3. **Route First** — Blank canvas before any components
4. **No TerminalLayout** — Plain div containers only
5. **Type Firewall** — Import from `./types.ts`, not `@core` directly
6. **Kinetic Object Pattern** — StreamItem → presentation component
7. **CSS-Only Glass** — Lightweight, performant
8. **Bold = Concept** — Markdown bold parsed as interactive spans
9. **Fork Hierarchy** — deep_dive > pivot > apply > challenge
10. **Local State** — useState hook, no global store for MVP

---

## Success Criteria

The sprint is **complete** when a user can:

1. Navigate to `/explore`
2. Submit a question
3. See streaming response in glass container
4. See orange concept highlights (when LLM uses bold)
5. Click a concept to pivot
6. See navigation forks (when LLM includes them)
7. Click a fork to continue exploration

**And:**
- Zero Terminal imports in KineticStream
- Zero TerminalLayout usage
- Genesis page Terminal continues working

---

## Timeline

| Epic | Focus | Duration |
|------|-------|----------|
| Epic 1 | Foundation & Route | 3 days |
| Epic 2 | Stream Rendering | 4 days |
| Epic 3 | Active Rhetoric | 3 days |

**Total:** 10 working days (2 weeks)

---

## Advisory Council Alignment

Per the Grove Advisory Council routing:

| Advisor | Weight | Input |
|---------|--------|-------|
| **Park** | 10 | Fresh implementation correct — cognitive load of Terminal exceeds rebuild |
| **Benet** | 10 | Hard boundary creates clean migration path |
| **Adams** | 8 | Exploration surface IS the product — don't compromise on "objects not messages" |
| **Short** | 8 | Fork labels are where voice lives — ensure Grove tone |
| **Taylor** | 7 | Log concept clicks and fork selections from day one |
| **Vallor** | 6 | Clickable concepts respect user agency — explicit not hidden |

---

## Post-Sprint: Migration Path

After Kinetic Experience v1 is stable:

| Phase | Duration | Traffic | Goal |
|-------|----------|---------|------|
| Phase 1 | Complete | 0% | MVP functional |
| Phase 2 | 2 weeks | Beta | User validation |
| Phase 3 | 2-4 weeks | 25% → 100% | Full rollout |
| Phase 4 | 1 week | 100% | Terminal route archived |

**Note:** Genesis page Terminal may remain indefinitely as a simpler marketing demo.

---

## Verification Commands

```bash
# 1. Firewall check (CRITICAL)
grep -r "Terminal" src/surface/components/KineticStream/
# Must return: Only README.md

grep -r "TerminalLayout" src/surface/components/KineticStream/
# Must return: empty

# 2. Build passes
npm run build

# 3. Route works
curl -I http://localhost:5173/explore

# 4. All tests pass
npm test
npx playwright test tests/e2e/explore*.spec.ts
```

---

## Next Actions

1. **Hand off to Claude Code** — Use EXECUTION_PROMPT.md
2. **Execute Step 0** — Create firewall files FIRST
3. **Execute Step 1** — Create blank route, verify it works
4. **Execute Steps 2-10** — Build components sequentially
5. **Verify success criteria** — Run all checks
6. **Begin Phase 2** — Beta testing

---

*Foundation Loop complete. Execute Step 0 (Firewall) first — the structural barriers are the innovation.*
