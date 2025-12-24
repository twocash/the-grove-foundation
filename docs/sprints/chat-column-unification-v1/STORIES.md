# Stories: Chat Column Unification v1

**Sprint:** Chat Column Unification v1
**Date:** 2024-12-24

---

## Epic Overview

| Epic | Name | Stories | Estimate |
|------|------|---------|----------|
| E1 | Token Definition | 2 | 0.5 day |
| E2 | Terminal Core Migration | 3 | 1 day |
| E3 | Header & Input Migration | 3 | 0.5 day |
| E4 | Chat Component Migration | 4 | 0.5 day |
| E5 | Supporting Component Migration | 4 | 0.5 day |
| E6 | Responsive System | 3 | 1 day |
| E7 | Cleanup & Validation | 3 | 0.5 day |

**Total:** 22 stories, ~4.5 days

---

## Epic 1: Token Definition

### E1-S1: Define Chat Token Variables

**Description:** Add `--chat-*` CSS custom properties to globals.css

**Acceptance Criteria:**
- [ ] All background tokens defined (`--chat-bg`, `--chat-surface`, etc.)
- [ ] All border tokens defined
- [ ] All text tokens defined
- [ ] All accent tokens defined
- [ ] All glass effect tokens defined
- [ ] All semantic tokens defined (success, warning, error)
- [ ] Tokens visible in browser DevTools

**Files:**
- `styles/globals.css`

**Estimate:** 1 hour

---

### E1-S2: Verify Token Values Match Hardcoded

**Description:** Confirm token values exactly match current Genesis styling

**Acceptance Criteria:**
- [ ] `--chat-bg` = `#1a2421`
- [ ] `--chat-surface` = `#243029`
- [ ] `--chat-border` = `#2d3b32`
- [ ] `--chat-accent` = `#00D4AA`
- [ ] Screenshot comparison shows no visual difference

**Files:**
- `styles/globals.css` (verification only)

**Estimate:** 30 minutes

---

## Epic 2: Terminal Core Migration

### E2-S1: Add Chat Container Wrapper

**Description:** Wrap embedded Terminal content in `.chat-container` class

**Acceptance Criteria:**
- [ ] `.chat-container` wraps embedded mode content
- [ ] Container has `container-type: inline-size`
- [ ] No visual change to Genesis

**Files:**
- `components/Terminal.tsx`

**Estimate:** 30 minutes

---

### E2-S2: Migrate Terminal Background Colors

**Description:** Replace hardcoded background colors with tokens

**Acceptance Criteria:**
- [ ] `bg-[#1a2421]` → `bg-[var(--chat-bg)]`
- [ ] All surface colors use tokens
- [ ] Genesis baseline test passes

**Files:**
- `components/Terminal.tsx` (embedded branch, ~lines 858-900)

**Estimate:** 1 hour

---

### E2-S3: Migrate Message Rendering Colors

**Description:** Replace message bubble colors with tokens

**Acceptance Criteria:**
- [ ] User message: `bg-[var(--chat-accent)]` `text-[var(--chat-accent-text)]`
- [ ] Model message: `bg-[var(--chat-glass)]` `border-[var(--chat-glass-border)]`
- [ ] Error message: `bg-[var(--chat-error-bg)]` `border-[var(--chat-error-border)]`
- [ ] Sender labels use text tokens
- [ ] Genesis baseline test passes

**Files:**
- `components/Terminal.tsx` (embedded branch, ~lines 900-1000)

**Estimate:** 1.5 hours

---

## Epic 3: Header & Input Migration

### E3-S1: Migrate TerminalHeader

**Description:** Replace all hardcoded colors in TerminalHeader

**Acceptance Criteria:**
- [ ] Header background uses `--chat-bg`
- [ ] Border uses `--chat-border`
- [ ] Lens pill uses glass tokens
- [ ] Journey badge uses text tokens
- [ ] Streak counter keeps orange (semantic)
- [ ] All click handlers still work

**Files:**
- `components/Terminal/TerminalHeader.tsx`

**Estimate:** 1 hour

---

### E3-S2: Migrate CommandInput Container

**Description:** Replace colors in CommandInput wrapper

**Acceptance Criteria:**
- [ ] Container bg: `--chat-input-bg`
- [ ] Border: `--chat-border`
- [ ] Focus border: `--chat-border-focus`

**Files:**
- `components/Terminal/CommandInput/index.tsx`

**Estimate:** 30 minutes

---

### E3-S3: Migrate CommandInput Field

**Description:** Replace colors in input field and send button

**Acceptance Criteria:**
- [ ] Input text: `--chat-text`
- [ ] Placeholder: `--chat-text-dim`
- [ ] Send button bg: `--chat-accent`
- [ ] Send button text: `--chat-accent-text`
- [ ] Send button hover: `--chat-accent-hover`

**Files:**
- `components/Terminal/CommandInput/CommandInput.tsx`

**Estimate:** 30 minutes

---

## Epic 4: Chat Component Migration

### E4-S1: Migrate SuggestionChip

**Description:** Replace all hardcoded colors in suggestion chips

**Acceptance Criteria:**
- [ ] Chip bg: `--chat-surface`
- [ ] Chip border: `--chat-border`
- [ ] Chip hover border: `--chat-border-accent`
- [ ] Chip text: `--chat-text-muted`
- [ ] Chip hover text: `--chat-accent`
- [ ] Arrow icon uses same pattern

**Files:**
- `components/Terminal/SuggestionChip.tsx`

**Estimate:** 30 minutes

---

### E4-S2: Migrate JourneyCard

**Description:** Replace Tailwind dark: variants with tokens

**Acceptance Criteria:**
- [ ] Remove all `dark:` variant classes
- [ ] Card bg: `--chat-surface`
- [ ] Card border: `--chat-border`
- [ ] Card text: `--chat-text`

**Files:**
- `components/Terminal/JourneyCard.tsx`

**Estimate:** 30 minutes

---

### E4-S3: Migrate JourneyNav

**Description:** Replace mixed styles with tokens

**Acceptance Criteria:**
- [ ] Nav container uses tokens
- [ ] Nav items use tokens
- [ ] Active state uses accent tokens

**Files:**
- `components/Terminal/JourneyNav.tsx`

**Estimate:** 30 minutes

---

### E4-S4: Migrate JourneyCompletion

**Description:** Replace mixed styles with tokens

**Acceptance Criteria:**
- [ ] Completion card uses surface tokens
- [ ] Text uses text tokens
- [ ] Success states use semantic tokens

**Files:**
- `components/Terminal/JourneyCompletion.tsx`

**Estimate:** 30 minutes

---

## Epic 5: Supporting Component Migration

### E5-S1: Migrate CognitiveBridge

**Description:** Replace hardcoded colors with tokens

**Acceptance Criteria:**
- [ ] Bridge container uses tokens
- [ ] All text uses text tokens
- [ ] Accent elements use accent tokens

**Files:**
- `components/Terminal/CognitiveBridge.tsx`

**Estimate:** 45 minutes

---

### E5-S2: Migrate WelcomeInterstitial

**Description:** Update for embedded mode context

**Acceptance Criteria:**
- [ ] Card backgrounds use surface tokens
- [ ] Text uses text tokens
- [ ] Only affects embedded mode rendering

**Files:**
- `components/Terminal/WelcomeInterstitial.tsx`

**Estimate:** 30 minutes

---

### E5-S3: Migrate LensBadge

**Description:** Replace inline styles with tokens

**Acceptance Criteria:**
- [ ] Badge bg uses glass tokens
- [ ] Badge text uses text tokens

**Files:**
- `components/Terminal/LensBadge.tsx`

**Estimate:** 15 minutes

---

### E5-S4: Migrate LensGrid

**Description:** Replace mixed styles with tokens

**Acceptance Criteria:**
- [ ] Grid items use surface tokens
- [ ] Selected state uses accent tokens
- [ ] Hover states work correctly

**Files:**
- `components/Terminal/LensGrid.tsx`

**Estimate:** 30 minutes

---

## Epic 6: Responsive System

### E6-S1: Add Container Query CSS

**Description:** Define container query rules in globals.css

**Acceptance Criteria:**
- [ ] `.chat-container` has `container-type: inline-size`
- [ ] Breakpoints defined: 360px, 480px, 640px
- [ ] Custom properties for padding and max-width
- [ ] Chip layout rules defined

**Files:**
- `styles/globals.css`

**Estimate:** 1 hour

---

### E6-S2: Apply Responsive Classes to Terminal

**Description:** Use responsive custom properties in Terminal

**Acceptance Criteria:**
- [ ] Content area uses `--chat-padding-x`
- [ ] Messages use `--chat-message-max-width`
- [ ] Chips container has `.chat-chips` class

**Files:**
- `components/Terminal.tsx`

**Estimate:** 1 hour

---

### E6-S3: Test Responsive Behavior

**Description:** Verify responsive behavior at all breakpoints

**Acceptance Criteria:**
- [ ] Compact mode (< 360px): tight padding, stacked chips
- [ ] Narrow mode (360-480px): slightly wider padding
- [ ] Standard mode (480-640px): current layout
- [ ] Comfortable mode (640px+): more breathing room
- [ ] Test in Genesis split panel
- [ ] Test in Workspace with/without inspector

**Files:**
- None (testing only)

**Estimate:** 1 hour

---

## Epic 7: Cleanup & Validation

### E7-S1: Delete ExploreChat CSS Hack

**Description:** Remove the 100+ line CSS override block

**Acceptance Criteria:**
- [ ] `<style>` block deleted from ExploreChat.tsx
- [ ] ExploreChat reduced to simple wrapper (~30 lines)
- [ ] Terminal receives `variant="embedded"` prop
- [ ] Workspace chat renders correctly

**Files:**
- `src/explore/ExploreChat.tsx`

**Estimate:** 30 minutes

---

### E7-S2: Run Genesis Baseline Tests

**Description:** Verify no visual regression on Genesis

**Acceptance Criteria:**
- [ ] All 4 baseline tests pass
- [ ] No pixel differences beyond threshold
- [ ] Screenshots saved for reference

**Files:**
- `tests/e2e/genesis-baseline.spec.ts`

**Estimate:** 30 minutes

---

### E7-S3: Manual Verification Matrix

**Description:** Complete manual testing at all viewports

**Acceptance Criteria:**
- [ ] 1440px Genesis - split panel correct
- [ ] 1440px Workspace - chat matches Genesis
- [ ] 1024px Genesis - tablet split works
- [ ] 1024px Workspace - narrow panel works
- [ ] 768px both - responsive behavior
- [ ] 375px both - mobile/compact mode
- [ ] All header functionality works (lens, journey, streak)

**Files:**
- None (testing only)

**Estimate:** 1 hour

---

## Story Dependencies

```
E1-S1 ─────┬───────────────────────────────────────────┐
           │                                           │
E1-S2 ─────┤                                           │
           │                                           │
           ▼                                           │
E2-S1 → E2-S2 → E2-S3                                  │
                  │                                    │
                  ├─────────────────┬──────────────────┤
                  ▼                 ▼                  │
            E3-S1 → E3-S2 → E3-S3                      │
                              │                        │
                              ▼                        │
            E4-S1 → E4-S2 → E4-S3 → E4-S4              │
                                     │                 │
                                     ▼                 │
            E5-S1 → E5-S2 → E5-S3 → E5-S4              │
                                     │                 │
                                     ▼                 ▼
                              E6-S1 → E6-S2 → E6-S3
                                              │
                                              ▼
                              E7-S1 → E7-S2 → E7-S3
```

---

## Definition of Done

For each story:
- [ ] Code changes complete
- [ ] TypeScript compiles (`npm run build`)
- [ ] No lint errors
- [ ] Self-review complete
- [ ] Committed with descriptive message

For sprint:
- [ ] All stories complete
- [ ] Genesis baseline tests pass
- [ ] Manual verification complete
- [ ] ExploreChat hack deleted
- [ ] PR ready for review
