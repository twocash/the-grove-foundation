# Specification: lens-hover-fix-v1

## Problem Statement

Lens cards in WelcomeInterstitial lack hover affordance. Users cannot tell cards are interactive until they click. The current highlight state also uses inline styling that violates Pattern 4 (Token Namespaces).

## Goals

1. Add ghost "Select" button on hover to indicate interactivity
2. Align card styling with Quantum Glass design system
3. Preserve persona colors for Active (selected) state only
4. Create reusable button token classes

## Non-Goals

- Changing the lens selection flow (preview → select)
- Modifying WelcomeInterstitial copy or layout
- Adding new interaction patterns
- Touching LensPicker (modal version)—only LensGrid

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Card hover styling | Pattern 4 (Token Namespaces) | Use `--glass-*` tokens |
| Interactive card states | `.glass-card` in globals.css | Add lens-specific variant |
| Select button appearance | None defined | Create `.glass-select-button` classes |

## Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| Lens card rendering | `LensGrid.tsx` | ✅ Canonical | Keep |
| Card styling tokens | `globals.css` | Not used | **REFACTOR** |
| Button styling | None | Inline classes | **CREATE** |

## New Patterns Proposed

None. All needs met by extending Pattern 4 (Token Namespaces).

## Visual Specification

### State Matrix

| State | Border | Background | Button |
|-------|--------|------------|--------|
| Default | `--glass-border` | `--glass-panel` | Hidden |
| Hover | `--glass-border-hover` | `--glass-elevated` | Ghost (outline) |
| Preview | `--neon-green` | `--glass-elevated` | Solid green |
| Active | Persona color | Persona tint | "Active" badge |

### Button Variants

**Ghost (hover state):**
- Background: transparent
- Border: `--glass-border-hover`
- Text: `--glass-text-muted`
- Hover: border/text → `--neon-green`

**Solid (preview state):**
- Background: `--neon-green`
- Border: `--neon-green`
- Text: `--glass-void` (dark)

## Acceptance Criteria

- [ ] Hovering over a lens card shows ghost "Select" button
- [ ] Ghost button has subtle border, transitions to green on button hover
- [ ] Clicking lens card enters preview state with solid green "Select" button
- [ ] Clicking "Select" button activates lens and closes preview
- [ ] Active lens shows persona-colored "Active" badge (unchanged)
- [ ] Non-active states use `--glass-*` tokens exclusively
- [ ] Transitions are smooth (150ms)
- [ ] Custom lenses follow same pattern as standard lenses
- [ ] Build passes with no regressions

## Out of Scope

- External highlight state ("Shared with you" badge)—unchanged
- Delete button on custom lenses—unchanged
- "Create your own lens" card—unchanged
- WelcomeInterstitial wrapper—unchanged

## Test Plan

1. Manual: Hover each lens, verify ghost button appears
2. Manual: Click lens, verify solid button appears
3. Manual: Click Select, verify lens activates
4. Manual: Verify Active state retains persona colors
5. Build: `npm run build` passes
6. Lint: No new warnings
