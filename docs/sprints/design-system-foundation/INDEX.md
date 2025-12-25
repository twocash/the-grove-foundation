# Sprint: Design System Foundation

**Sprint ID:** design-system-foundation  
**Status:** Planning  
**Time Budget:** 6-8 hours  
**Predecessor:** grove-object-model-v1.1-hub

---

## Sprint Navigation

| Artifact | Purpose | Status |
|----------|---------|--------|
| [DESIGN_SYSTEM.md](../../design-system/DESIGN_SYSTEM.md) | Token Reference | ✅ |
| [SPEC.md](./SPEC.md) | Requirements & Scope | ✅ |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes | ✅ |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff | ✅ |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking | ✅ |

---

## Vision

**"Make Grove look like professionals built it."**

This sprint establishes the visual foundation extracted from the Trellis mock—a "Quantum Glass" aesthetic that communicates living cognitive infrastructure.

---

## What Changes

### Phase 1: Token Foundation
- Color palette (void, glass, neon accents, slate scale)
- Typography (Inter + JetBrains Mono)
- Spacing rhythm
- Glow effects

### Phase 2: Card System Polish
- Glass panel treatment for cards
- Status badge styling (GROWTH, PROCESSING, ARCHIVED)
- Corner accent option
- Hover lift effect

### Phase 3: Global Surface
- Void background with optional grid pattern
- Header bar refinement
- Consistent border/divider treatment

---

## What Doesn't Change (Yet)

- Left navigation pattern (deferred until core surfaces polished)
- Terminal/Command Dock (directionally planned, not this sprint)
- Page-specific layouts
- Interaction flows

---

## Success Criteria

- [ ] Design tokens exist in `globals.css`
- [ ] Fonts load (Inter, JetBrains Mono)
- [ ] GroveObjectCard uses glass panel pattern
- [ ] Status badges render with correct styling
- [ ] Hover states feel premium (subtle lift, border transitions)
- [ ] Dark mode looks intentional, not accidental
- [ ] Build passes, no visual regressions

---

## Design Philosophy Reminders

From DESIGN_SYSTEM.md:

> **Alive** — Subtle animations, glows, and state changes suggest ongoing activity
> **Deep** — Dark backgrounds with layered glass panels create depth
> **Technical but Approachable** — Monospace accents for system feel, but readable prose for content

---

*Reference: docs/design-system/DESIGN_SYSTEM.md*
