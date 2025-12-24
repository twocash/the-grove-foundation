# Specification: Chat Column Unification v1

**Sprint:** Chat Column Unification v1
**Date:** 2024-12-24
**Status:** Planning

---

## Problem Statement

The Terminal component renders in two contexts (Genesis split panel, Workspace ExploreChat) with inconsistent styling approaches:

1. **Genesis**: Direct hardcoded colors (`bg-[#1a2421]`) in embedded render path
2. **Workspace**: 100+ lines of CSS `!important` hacks overriding Terminal's default paper aesthetic

This creates:
- Maintenance burden (changes require updates in multiple places)
- Visual inconsistency risk (colors drift between contexts)
- No responsive behavior (chat content doesn't adapt to panel width)
- Technical debt (the CSS hack is unmaintainable)

---

## Goals

| ID | Goal | Success Metric |
|----|------|----------------|
| G1 | Create unified `--chat-*` token system | Token file exists, all values documented |
| G2 | Apply tokens to Terminal embedded mode | Zero hardcoded colors in embedded path |
| G3 | Preserve all TerminalHeader functionality | Lens, journey, streak all work |
| G4 | Fix responsive chat content | Content adapts at 360/480/640px breakpoints |
| G5 | Delete ExploreChat CSS hack | ExploreChat.tsx < 50 lines |
| G6 | Zero visual regression on Genesis | Baseline tests pass |

---

## Non-Goals

- Changing the Terminal overlay mode (paper/ink aesthetic)
- Modifying workspace shell tokens (`--grove-*`)
- Adding new features to Terminal
- Changing Genesis page layout or flow
- Foundation console styling (separate sprint)

---

## Acceptance Criteria

### AC1: Token System
- [ ] `--chat-*` CSS variables defined in `globals.css`
- [ ] Tokens scoped to embedded context (not global override)
- [ ] Documentation of all token values and usage

### AC2: Terminal Embedded Mode
- [ ] All `bg-[#...]` replaced with `bg-[var(--chat-*)]`
- [ ] All `text-[#...]` replaced with token equivalents
- [ ] All `border-[#...]` replaced with token equivalents
- [ ] Message bubbles use tokens
- [ ] Suggestion chips use tokens
- [ ] Input bar uses tokens

### AC3: TerminalHeader
- [ ] Header background uses `--chat-bg`
- [ ] Lens pill uses `--chat-*` tokens
- [ ] Journey badge uses `--chat-*` tokens
- [ ] Streak counter styling preserved
- [ ] All click handlers work (lens picker, stats modal)

### AC4: Responsive Content
- [ ] Container queries or width-based classes defined
- [ ] Compact mode (< 360px): chips stack, tight padding
- [ ] Narrow mode (360-480px): 2-col chips
- [ ] Standard mode (480-640px): current layout
- [ ] Comfortable mode (> 640px): wider content

### AC5: ExploreChat Cleanup
- [ ] CSS style block deleted (100+ lines removed)
- [ ] ExploreChat uses simple wrapper only
- [ ] Terminal receives correct variant prop
- [ ] No `!important` overrides remain

### AC6: Visual Regression
- [ ] Genesis baseline tests pass (initial, split, expanded)
- [ ] Manual verification at 1440px, 1024px, 768px, 375px
- [ ] Dark mode appearance matches design intent

---

## Token Specification

### Primary Palette

```css
:root {
  /* Backgrounds */
  --chat-bg: #1a2421;                    /* Primary background */
  --chat-surface: #243029;                /* Raised elements */
  --chat-surface-hover: #2d3b32;          /* Hover state */
  
  /* Borders */
  --chat-border: #2d3b32;                 /* Default border */
  --chat-border-strong: #3d4b42;          /* Emphasized border */
  --chat-border-accent: var(--chat-accent); /* Interactive border */
  
  /* Text */
  --chat-text: rgba(255, 255, 255, 0.9);  /* Primary text */
  --chat-text-muted: rgba(255, 255, 255, 0.6); /* Secondary */
  --chat-text-dim: rgba(255, 255, 255, 0.4);   /* Tertiary */
  
  /* Accent */
  --chat-accent: #00D4AA;                 /* Primary accent (teal) */
  --chat-accent-muted: rgba(0, 212, 170, 0.15); /* Muted accent */
  --chat-accent-hover: #00E4BA;           /* Hover state */
  --chat-accent-text: #1a2421;            /* Text on accent bg */
  
  /* Glass effects */
  --chat-glass: rgba(255, 255, 255, 0.05);     /* Subtle glass */
  --chat-glass-hover: rgba(255, 255, 255, 0.1); /* Glass hover */
  --chat-glass-border: rgba(255, 255, 255, 0.1); /* Glass border */
  
  /* Semantic */
  --chat-success: #22c55e;
  --chat-warning: #f59e0b;
  --chat-error: #ef4444;
  --chat-error-bg: rgba(239, 68, 68, 0.15);
}
```

### Responsive Breakpoints

```css
/* Container query approach */
.chat-container {
  container-type: inline-size;
  container-name: chat;
}

/* Compact: < 360px */
@container chat (max-width: 359px) {
  .chat-content { --chat-padding: 0.75rem; }
  .chat-chips { flex-direction: column; }
}

/* Narrow: 360-479px */
@container chat (min-width: 360px) and (max-width: 479px) {
  .chat-content { --chat-padding: 1rem; }
  .chat-chips { grid-template-columns: 1fr 1fr; }
}

/* Standard: 480-639px */
@container chat (min-width: 480px) and (max-width: 639px) {
  .chat-content { --chat-padding: 1rem; }
  .chat-message-max-width: 90%;
}

/* Comfortable: 640px+ */
@container chat (min-width: 640px) {
  .chat-content { --chat-padding: 1.5rem; }
  .chat-message-max-width: 85%;
}
```

---

## Out of Scope (Future Sprints)

1. **Terminal overlay mode** — Keep paper/ink for mobile
2. **Foundation consoles** — Separate "Foundation Theme Migration" sprint
3. **Workspace shell** — Keep `--grove-*` tokens
4. **New Terminal features** — No feature work in this sprint

---

## Dependencies

- Genesis baseline tests must exist (PR #33)
- No active development on Terminal components during sprint
- Theme system foundation merged to main

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Genesis visual break | Low | High | Run baselines after each epic |
| Token conflicts | Low | Low | Isolated `--chat-*` namespace |
| Responsive bugs | Medium | Medium | Test at all breakpoints |
| Overlay mode break | Low | Low | Separate render path untouched |

---

## Timeline Estimate

| Epic | Estimate | Dependencies |
|------|----------|--------------|
| Epic 1: Token Definition | 0.5 day | None |
| Epic 2: Terminal.tsx Migration | 1 day | Epic 1 |
| Epic 3: TerminalHeader Migration | 0.5 day | Epic 1 |
| Epic 4: Child Component Migration | 1 day | Epic 1 |
| Epic 5: Responsive System | 1 day | Epic 2-4 |
| Epic 6: ExploreChat Cleanup | 0.5 day | Epic 2-5 |
| Epic 7: Testing & Polish | 0.5 day | Epic 6 |

**Total:** ~5 days

---

## References

- [REPO_AUDIT.md](./REPO_AUDIT.md) — Color inventory
- [Genesis Baseline Tests](../../tests/e2e/genesis-baseline.spec.ts)
- [ExploreChat.tsx](../../src/explore/ExploreChat.tsx) — The CSS hack
- [Terminal.tsx](../../components/Terminal.tsx) — Main component
