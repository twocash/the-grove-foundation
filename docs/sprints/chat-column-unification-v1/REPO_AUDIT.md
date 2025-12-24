# Repository Audit: Chat Column Unification v1

**Sprint:** Chat Column Unification v1
**Date:** 2024-12-24
**Auditor:** Claude + Jim

---

## Executive Summary

The Terminal component tree contains **~2,400 lines** across **~18 files** with inconsistent color handling. Two surfaces (Genesis split panel, Workspace ExploreChat) both embed the Terminal but use different approaches to achieve dark theming. This audit maps all color usages to inform the token extraction strategy.

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TERMINAL EMBEDDING CONTEXTS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   GenesisPage.tsx                        ExploreChat.tsx                     │
│   ┌─────────────────────┐               ┌─────────────────────┐             │
│   │ variant="embedded"  │               │ variant="overlay"   │             │
│   │ Direct dark styling │               │ 100+ lines CSS hack │             │
│   │ bg-[#1a2421]       │               │ !important overrides│             │
│   └─────────────────────┘               └─────────────────────┘             │
│            │                                      │                          │
│            └──────────────┬───────────────────────┘                          │
│                           ▼                                                  │
│                  components/Terminal.tsx                                     │
│                  (1,445 lines, dual render paths)                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Inventory: Terminal Tree

| File | Lines | Color Pattern | Priority |
|------|-------|---------------|----------|
| `components/Terminal.tsx` | 1,445 | Hardcoded hex, inline | P0 |
| `components/Terminal/TerminalHeader.tsx` | ~150 | Mixed tokens/hardcoded | P0 |
| `components/Terminal/TerminalShell.tsx` | 125 | Paper/ink palette | P2 (overlay only) |
| `components/Terminal/CommandInput/index.tsx` | ~120 | Hardcoded | P0 |
| `components/Terminal/CommandInput/CommandInput.tsx` | ~80 | Hardcoded | P0 |
| `components/Terminal/JourneyCard.tsx` | 56 | Tailwind dark: variants | P1 |
| `components/Terminal/JourneyNav.tsx` | ~100 | Mixed | P1 |
| `components/Terminal/JourneyCompletion.tsx` | ~80 | Mixed | P1 |
| `components/Terminal/SuggestionChip.tsx` | ~50 | Hardcoded | P0 |
| `components/Terminal/CognitiveBridge.tsx` | ~200 | Hardcoded | P1 |
| `components/Terminal/WelcomeInterstitial.tsx` | ~150 | Paper/ink | P1 |
| `components/Terminal/LensBadge.tsx` | ~40 | Inline | P1 |
| `components/Terminal/LensGrid.tsx` | ~100 | Mixed | P1 |
| `components/Terminal/LoadingIndicator.tsx` | ~30 | Minimal | P2 |
| `components/Terminal/Modals/*` | ~300 | Mixed | P2 |
| `components/Terminal/Reveals/*` | ~200 | Mixed | P2 |
| `src/explore/ExploreChat.tsx` | 159 | CSS hack (DELETE) | P0 |
| `src/explore/LensPicker.tsx` | ~200 | Mixed | P1 |

**Total:** ~3,500 lines to review, ~2,400 lines to modify

---

## Color Audit: Hardcoded Values

### Background Colors

| Hex Value | Usage | Semantic Meaning | Target Token |
|-----------|-------|------------------|--------------|
| `#1a2421` | Terminal embedded bg | Primary background | `--chat-bg` |
| `#243029` | Raised panels, cards | Surface/elevated | `--chat-surface` |
| `#2d3b32` | Borders, dividers | Border default | `--chat-border` |
| `#0f172a` | Workspace (NOT Terminal) | Keep as `--grove-bg` | N/A |
| `white`, `#FFFFFF` | Overlay mode bg | Paper (overlay only) | Keep for overlay |
| `bg-white/5` | Message bubbles (model) | Glass effect | `--chat-glass` |
| `bg-white/10` | Hover states | Glass hover | `--chat-glass-hover` |

### Accent Colors

| Hex Value | Usage | Semantic Meaning | Target Token |
|-----------|-------|------------------|--------------|
| `#00D4AA` | Primary accent, buttons | Interactive elements | `--chat-accent` |
| `rgba(0,212,170,0.15)` | Accent backgrounds | Muted accent | `--chat-accent-muted` |
| `#00D4AA` with opacity | Glows, focus rings | Accent glow | `--chat-accent-glow` |
| `#4d7c0f` | Workspace accent | Keep as `--grove-accent` | N/A |

### Text Colors

| Pattern | Usage | Target Token |
|---------|-------|--------------|
| `text-white` | Primary text | `--chat-text` |
| `text-white/90` | Primary text (explicit) | `--chat-text` |
| `text-white/60` | Secondary text | `--chat-text-muted` |
| `text-white/40` | Tertiary/dim text | `--chat-text-dim` |
| `text-[#00D4AA]` | Accent text | `--chat-accent` |

### Semantic Colors

| Pattern | Usage | Target Token |
|---------|-------|--------------|
| `bg-red-900/30`, `text-red-300` | Error states | `--chat-error` |
| `#22c55e` | Success states | `--chat-success` |
| `#f59e0b` | Warning states | `--chat-warning` |

---

## Component-by-Component Audit

### Terminal.tsx (Embedded Branch, Lines 858-1100)

```typescript
// Line 863 - Primary background
<div className="flex flex-col h-full w-full bg-[#1a2421] text-white">

// Line 916-920 - Message sender labels
<span className={`text-xs font-medium ${msg.role === 'user' ? 'text-white/60' : 'text-[#00D4AA]'}`}>

// Line 924 - User message bubble
<div className="bg-[#00D4AA] text-[#1a2421] px-4 py-2.5 rounded-xl rounded-tr-sm text-sm">

// Line 928-931 - Model message bubble
<div className={`px-4 py-2.5 rounded-xl rounded-tl-sm text-sm ${
  isSystemError
    ? 'bg-red-900/30 text-red-300 border border-red-700/50'
    : 'bg-white/5 text-white/90 border border-white/10'
}`}>
```

**Issues:**
- Fixed `max-w-[85%]` / `max-w-[90%]` - doesn't adapt to panel width
- No container query support for responsive content

### TerminalHeader.tsx

```typescript
// Background
className="... bg-[#1a2421] border-b border-white/10 ..."

// Lens pill
className="... bg-white/10 hover:bg-white/20 text-white ..."

// Journey badge
className="... text-white/60 ..."

// Streak counter
className="... text-orange-400 ..."
```

**Issues:**
- All hardcoded, no token usage
- Good structure, just needs token swap

### SuggestionChip.tsx

```typescript
// Chip container
className="... bg-[#243029] border-[#2d3b32] hover:border-[#00D4AA]/50 ..."

// Chip text
className="... text-white/80 group-hover:text-[#00D4AA] ..."

// Arrow icon
className="... text-white/40 group-hover:text-[#00D4AA] ..."
```

**Issues:**
- Hardcoded throughout
- Fixed padding doesn't scale

### CommandInput

```typescript
// Input container
className="... bg-[#243029] border-[#2d3b32] ..."

// Input field
className="... bg-transparent text-white placeholder:text-white/40 ..."

// Send button
className="... bg-[#00D4AA] text-[#1a2421] hover:bg-[#00D4AA]/90 ..."
```

**Issues:**
- Fixed height/padding
- No responsive scaling

---

## Responsive Analysis

### Current Breakpoints (ExploreChat hack)

```css
/* None - all fixed widths */
.explore-chat-container .bg-white {
  background: var(--grove-surface, #121a22) !important;
}
```

### Genesis Panel Behavior

```css
/* From globals.css */
.terminal-panel {
  width: 50%;  /* Desktop */
}

@media (min-width: 768px) and (max-width: 1024px) {
  .terminal-panel { width: 40%; }  /* Tablet */
}

@media (max-width: 767px) {
  .terminal-panel { width: 100%; height: 80vh; }  /* Mobile sheet */
}
```

### Workspace Panel Behavior

```
Three-column layout:
- NavSidebar: 240px fixed
- Content (ExploreChat): flex-1
- Inspector: 360px (when open)

Chat panel width = viewport - 240px - 360px (if inspector open)
                 = viewport - 240px (if inspector closed)

At 1440px viewport:
- Inspector open: 840px for chat
- Inspector closed: 1200px for chat

At 1024px viewport:
- Inspector open: 424px for chat (cramped!)
- Inspector closed: 784px for chat
```

### Required Responsive Rules

| Panel Width | Mode | Content Behavior |
|-------------|------|------------------|
| < 360px | Compact | Stack chips vertically, tight padding |
| 360-480px | Narrow | 2-col chips, reduced padding |
| 480-640px | Standard | Current layout |
| > 640px | Comfortable | More breathing room, wider max-width |

---

## Dependencies

### Shared with Workspace (DO NOT TOUCH)

- `--grove-bg`, `--grove-surface`, `--grove-border` — Workspace shell
- `--grove-accent` — Workspace interactive elements
- `--grove-text`, `--grove-text-muted` — Workspace text

### Shared with Genesis (UNIFIED)

- Terminal embedded render path
- TerminalHeader component
- Message rendering
- Suggestion chips
- Command input

### Terminal Overlay Mode (SEPARATE)

- TerminalShell.tsx — Paper/ink aesthetic
- Floating action button
- Mobile bottom sheet
- Drawer animation

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Genesis visual regression | Low | High | Baseline tests exist, run after each epic |
| Workspace chat mismatch | Medium | Medium | Apply same tokens to both contexts |
| Overlay mode breaks | Low | Low | Separate render path, not touching |
| Responsive bugs | Medium | Medium | Test at multiple breakpoints |
| Token name conflicts | Low | Low | `--chat-*` namespace isolated |

---

## Success Criteria

1. **Genesis split panel unchanged visually** — Baseline tests pass
2. **Workspace chat matches Genesis** — Same forest palette
3. **ExploreChat hack deleted** — 0 lines of CSS overrides
4. **Responsive content** — Chat adapts to panel width
5. **All functionality preserved** — Header, chips, input work

---

## Next Steps

1. → SPEC.md: Define goals and acceptance criteria
2. → ARCHITECTURE.md: Design token system
3. → MIGRATION_MAP.md: File-by-file changes
4. → DECISIONS.md: Key architectural decisions
5. → SPRINTS.md: Epic and story breakdown
6. → EXECUTION_PROMPT.md: Claude Code handoff
