# Decisions: theme-system-foundation-v1

**Sprint:** theme-system-foundation-v1  
**Date:** December 24, 2024

---

## ADR-001: Additive Token Strategy

**Status:** ACCEPTED

**Decision:** Add new `theme-*` namespace alongside existing tokens rather than replacing them.

**Rationale:**
- Zero risk to Genesis demo
- Gradual migration possible
- Existing code continues to work

**Rejected:** Replace `grove-*` globally (breaks Genesis)

---

## ADR-002: Runtime Theme Loading

**Status:** ACCEPTED

**Decision:** Load themes at runtime via fetch() from `/data/themes/*.json`.

**Rationale:**
- Theme changes don't require rebuild
- Follows DEX "declarative sovereignty" principle
- Consistent with corpus/journey loading pattern

**Rejected:** Import JSON at build time (can't change without rebuild)

---

## ADR-003: Surface-Aware Theme Selection

**Status:** ACCEPTED

**Decision:** Detect surface from route pathname and load corresponding theme.

**Rationale:**
- Automatic theme switching on navigation
- No manual surface specification needed

---

## ADR-004: CSS Custom Properties

**Status:** ACCEPTED

**Decision:** Use CSS custom properties injected to `:root` by ThemeProvider.

**Rationale:**
- Works with Tailwind
- Fast mode switching (CSS only)
- DevTools friendly

---

## ADR-005: Theme Inheritance

**Status:** ACCEPTED

**Decision:** Support theme inheritance via `extends` field.

**Rationale:**
- DRY principle
- Easier to create variants

---

## ADR-006: Preserve Genesis Completely

**Status:** ACCEPTED

**Decision:** Genesis pages are protected — no token migration.

**Protected Files:**
- `src/surface/pages/GenesisPage.tsx`
- `src/surface/components/genesis/*`
- `src/surface/pages/SurfacePage.tsx`

---

## ADR-007: Behavior Testing

**Status:** ACCEPTED

**Decision:** Test user-visible behavior, not CSS implementation details.

```typescript
// RIGHT
await expect(element).toBeVisible();

// WRONG
expect(element).toHaveClass('bg-theme-bg-primary');
```

---

## ADR-008: Read-Only Reality Tuner

**Status:** ACCEPTED

**Decision:** This sprint: Reality Tuner is read-only (view current theme values).  
Future sprint: Full editing capabilities.

---

## ADR-009: Space Grotesk Typography

**Status:** ACCEPTED

**Decision:** Include Space Grotesk font for Foundation Quantum theme.

**Typography Stack:**
- Display: Space Grotesk, Inter, sans-serif
- Body: Inter, sans-serif
- Mono: JetBrains Mono, monospace

---

## ADR-010: No New Dependencies

**Status:** ACCEPTED

**Decision:** No new runtime dependencies. Schema validation is dev-only.

---

## Summary

| ADR | Decision | Impact |
|-----|----------|--------|
| 001 | Additive tokens | Preserves existing code |
| 002 | Runtime loading | DEX compliant |
| 003 | Route-based surface | Automatic switching |
| 004 | CSS custom properties | Web standard |
| 005 | Theme inheritance | DRY themes |
| 006 | Protect Genesis | Zero demo risk |
| 007 | Behavior testing | Maintainable tests |
| 008 | Read-only Reality Tuner | Smaller scope |
| 009 | Space Grotesk | Foundation typography |
| 010 | No dependencies | Light footprint |

---

*Decisions Complete — Proceed to SPRINTS.md*
