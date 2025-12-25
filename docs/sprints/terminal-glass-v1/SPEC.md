# SPEC.md — terminal-glass-v1

## Overview

Apply Quantum Glass design system to Terminal chat interface, restoring visual consistency and dynamic width behavior.

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Glass theme for Terminal | Pattern 4: Styling (Token Namespaces) | Wire existing `--glass-*` tokens to Terminal.tsx |
| Message bubbles | Pattern 4 + glass-message classes | Apply `.glass-message-user` / `.glass-message-assistant` |
| Input styling | Pattern 4 + glass-input classes | Apply `.glass-input-wrapper` / `.glass-send-btn` |
| Dynamic width | Pattern 4 | CSS calc/min for responsive container |
| Error messages | Pattern 4 | Add `.glass-message-error` variant |

## New Patterns Proposed

**None required.** All needs met by extending existing Pattern 4 (Styling/Token Namespaces) with the `--glass-*` token namespace already defined in globals.css.

## Requirements

### R1: Glass Theme Application
All Terminal UI elements must use `--glass-*` CSS custom properties instead of Tailwind utility classes.

**Acceptance Criteria:**
- [ ] Messages container uses `.glass-chat-container`
- [ ] User messages use `.glass-message-user`
- [ ] Assistant messages use `.glass-message-assistant`
- [ ] Input uses `.glass-input-wrapper` and `.glass-input-field`
- [ ] Send button uses `.glass-send-btn`
- [ ] No `bg-white`, `bg-slate-*`, `bg-primary` in message/input areas

### R2: Dynamic Width Restoration
Messages should expand naturally with container rather than fixed `max-w-3xl` (768px).

**Acceptance Criteria:**
- [ ] Container uses `max-w-[min(90%, 56rem)]` for breathing
- [ ] Wide screens (>1280px) allow up to 64rem
- [ ] Code blocks can utilize full message width
- [ ] Readable line length maintained (~65-75 characters)

### R3: Genesis Context Differentiation
Terminal must be visually distinct from Genesis paper-textured left rail.

**Acceptance Criteria:**
- [ ] Terminal panel uses `var(--glass-void)` background
- [ ] Clear visual boundary between content rail and terminal
- [ ] No paper/warm textures bleeding into terminal

### R4: Error Message Styling
System errors must be styled consistently with glass theme.

**Acceptance Criteria:**
- [ ] Error messages use `.glass-message-error` class
- [ ] Red-tinted glass effect (not opaque red)
- [ ] Readable error text on glass background

## Component Mapping

| Component | Current | Target |
|-----------|---------|--------|
| Messages container | `bg-white dark:bg-background-dark` | `.glass-chat-container` |
| User bubble | `bg-primary text-white` | `.glass-message.glass-message-user` |
| Assistant bubble | `bg-slate-100 dark:bg-surface-dark` | `.glass-message.glass-message-assistant` |
| Input wrapper | Tailwind classes | `.glass-input-wrapper` |
| Input field | Tailwind classes | `.glass-input-field` |
| Send button | `bg-primary` | `.glass-send-btn` |
| Label "You" | `text-slate-600` | `text-[var(--glass-text-subtle)]` |
| Label "The Grove" | `text-primary` | `text-[var(--neon-green)]` |

## Out of Scope

- TerminalShell drawer behavior (already works)
- LensPicker styling (separate component)
- CognitiveBridge styling (uses its own patterns)
- Journey navigation components
