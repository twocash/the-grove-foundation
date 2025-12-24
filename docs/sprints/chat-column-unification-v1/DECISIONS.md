# Architectural Decisions: Chat Column Unification v1

**Sprint:** Chat Column Unification v1
**Date:** 2024-12-24

---

## ADR-001: Separate Chat Token Namespace

### Context

The Terminal component renders in multiple contexts with different surrounding aesthetics:
- **Workspace shell**: Cool slate palette (`--grove-*`)
- **Foundation consoles**: Dark holodeck (`--theme-*`)
- **Chat content**: Warm forest palette (currently hardcoded)

### Decision

Create a dedicated `--chat-*` token namespace for chat/Terminal UI, separate from workspace and Foundation tokens.

### Rationale

1. **Semantic clarity**: Chat has a distinct visual language (warm, organic) vs workspace (cool, professional)
2. **Independent evolution**: Chat tokens can change without affecting workspace shell
3. **Clear ownership**: Terminal components own `--chat-*`, workspace owns `--grove-*`
4. **No inheritance complexity**: Flat token structure, no cascading issues

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Unify on `--grove-*` | Would require Genesis to adopt cooler palette, losing organic warmth |
| Extend `--grove-*` with chat-specific values | Muddies namespace, unclear ownership |
| Conditional tokens based on context | Complex, error-prone, hard to debug |

### Consequences

- **Positive**: Clear separation, easy to maintain, preserves Genesis aesthetic
- **Negative**: Three token systems to maintain (acceptable given distinct surfaces)

---

## ADR-002: Container Queries for Responsive Chat

### Context

Chat content (messages, chips, input) needs to adapt to varying panel widths:
- Genesis split: 50% of viewport
- Workspace with inspector: ~40% of viewport
- Workspace without inspector: ~60% of viewport
- Mobile: 100% width

### Decision

Use CSS Container Queries (`@container`) instead of media queries for responsive chat layout.

### Rationale

1. **Component-centric**: Responds to container width, not viewport width
2. **Reusable**: Same rules work in Genesis, Workspace, or any future context
3. **Modern CSS**: Well-supported (Chrome 105+, Safari 16+, Firefox 110+)
4. **No JS required**: Pure CSS solution

### Implementation

```css
.chat-container {
  container-type: inline-size;
  container-name: chat;
}

@container chat (max-width: 359px) {
  .chat-content { --chat-padding-x: 0.75rem; }
}
```

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Media queries | Responds to viewport, not container - wrong for embedded component |
| ResizeObserver JS | More complex, requires state management |
| Fixed breakpoints | Doesn't adapt to dynamic panel widths |

### Consequences

- **Positive**: Elegant solution, pure CSS, works everywhere Terminal embeds
- **Negative**: Requires modern browser (acceptable for target audience)

---

## ADR-003: Preserve Overlay Mode Unchanged

### Context

Terminal has two render modes:
- **Embedded**: Used in Genesis split, Workspace - needs token migration
- **Overlay**: Used for mobile bottom sheet, legacy drawer - uses paper/ink aesthetic

### Decision

Do NOT modify the overlay render path in this sprint. Keep paper/ink aesthetic for overlay mode.

### Rationale

1. **Scope control**: Overlay mode is separate UX context (mobile, standalone)
2. **Risk reduction**: Fewer changes = less risk of regression
3. **User expectation**: Overlay has different visual context (light paper aesthetic)
4. **Future flexibility**: Can migrate overlay in separate sprint if needed

### Implementation

```tsx
if (variant === 'embedded') {
  // Uses --chat-* tokens (this sprint)
  return <div className="bg-[var(--chat-bg)]">...</div>;
}

// Overlay mode unchanged
return <TerminalShell>...</TerminalShell>;
```

### Consequences

- **Positive**: Reduced scope, lower risk, preserves mobile experience
- **Negative**: Two styling approaches in one component (acceptable, clearly separated)

---

## ADR-004: Delete ExploreChat CSS Hack Entirely

### Context

`ExploreChat.tsx` contains 100+ lines of CSS `!important` overrides to force Terminal's paper aesthetic into dark mode. This is technical debt.

### Decision

Delete the entire CSS hack block. Trust the token system to handle styling.

### Rationale

1. **Technical debt removal**: The hack is unmaintainable
2. **Token system validation**: Proves the token approach works
3. **Simplicity**: ExploreChat becomes a simple wrapper (~30 lines)
4. **Performance**: Fewer CSS rules to process

### Risk Mitigation

- Run Genesis baselines before deletion to establish known-good state
- Run baselines after deletion to verify no regression
- Manual testing at multiple viewports

### Consequences

- **Positive**: Major cleanup, validates token system, easier maintenance
- **Negative**: Must be done AFTER token migration (depends on Phase 2-5)

---

## ADR-005: Token Values Match Current Hardcoded Values

### Context

Genesis split panel currently uses specific hex values (e.g., `#1a2421`). We're extracting these to tokens.

### Decision

Token values MUST exactly match current hardcoded values. No design changes in this sprint.

### Rationale

1. **Zero visual regression**: Genesis baseline tests should pass unchanged
2. **Scope control**: This is a refactoring sprint, not a redesign
3. **Stakeholder trust**: Demonstrate tokens work before making design changes
4. **Easy validation**: Pixel-perfect comparison possible

### Token Mapping

| Current Value | Token | Purpose |
|---------------|-------|---------|
| `#1a2421` | `--chat-bg` | Primary background |
| `#243029` | `--chat-surface` | Elevated surfaces |
| `#2d3b32` | `--chat-border` | Borders |
| `#00D4AA` | `--chat-accent` | Primary accent |
| `rgba(255,255,255,0.9)` | `--chat-text` | Primary text |

### Consequences

- **Positive**: Safe refactoring, easy to verify, maintains current design
- **Negative**: Design improvements deferred (acceptable, can iterate later)

---

## ADR-006: Responsive Breakpoints Based on Panel Width

### Context

Need to define breakpoints for responsive chat content. Options:
- Standard viewport breakpoints (320, 768, 1024, 1440)
- Custom panel-specific breakpoints

### Decision

Use panel-centric breakpoints: 360px, 480px, 640px

### Rationale

1. **360px**: Minimum comfortable width for chat (narrower = compact mode)
2. **480px**: Standard mobile-to-tablet transition point
3. **640px**: Comfortable reading width for chat

These align with actual panel widths in:
- Genesis split (50% of 1024 = 512px)
- Workspace with inspector (1440 - 240 - 360 = 840px)
- Workspace without inspector (1440 - 240 = 1200px)

### Consequences

- **Positive**: Breakpoints match real usage, not arbitrary viewport sizes
- **Negative**: Different from standard Tailwind breakpoints (acceptable, container queries)

---

## ADR-007: Chip Layout Remains Single Column

### Context

Suggestion chips could be laid out in:
- Single column (current)
- Multi-column grid
- Horizontal scroll

### Decision

Keep single-column chip layout, with responsive padding adjustments.

### Rationale

1. **Scannability**: Vertical list is easier to scan
2. **Tap targets**: Full-width chips are easier to tap on mobile
3. **Content variability**: Chip text length varies, columns create awkward gaps
4. **Simplicity**: No complex grid logic needed

### Implementation

```css
.chat-chips {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
```

### Consequences

- **Positive**: Simple, accessible, works at all widths
- **Negative**: Takes more vertical space (acceptable, chips are valuable suggestions)

---

## Decision Log

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Separate `--chat-*` namespace | Approved |
| ADR-002 | Container queries for responsive | Approved |
| ADR-003 | Preserve overlay mode unchanged | Approved |
| ADR-004 | Delete ExploreChat CSS hack | Approved |
| ADR-005 | Token values match current hardcoded | Approved |
| ADR-006 | Panel-centric breakpoints (360/480/640) | Approved |
| ADR-007 | Single-column chip layout | Approved |
