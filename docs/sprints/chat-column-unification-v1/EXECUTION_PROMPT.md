# Execution Prompt: Chat Column Unification v1

**Sprint:** Chat Column Unification v1
**Date:** 2024-12-24
**Handoff To:** Claude Code CLI

---

## Context

You are executing a styling unification sprint for The Grove Terminal component. The Terminal renders in two contexts (Genesis split panel, Workspace ExploreChat) that currently use different styling approaches. This sprint creates a unified `--chat-*` token system and applies it consistently.

## Required Reading

Before making ANY changes, read these files in order:

1. `docs/sprints/chat-column-unification-v1/REPO_AUDIT.md` - Color inventory
2. `docs/sprints/chat-column-unification-v1/SPEC.md` - Goals and acceptance criteria
3. `docs/sprints/chat-column-unification-v1/ARCHITECTURE.md` - Token system design
4. `docs/sprints/chat-column-unification-v1/MIGRATION_MAP.md` - File-by-file changes
5. `docs/sprints/chat-column-unification-v1/DECISIONS.md` - Architectural decisions
6. `docs/sprints/chat-column-unification-v1/STORIES.md` - Story breakdown

## Critical Constraints

1. **PRESERVE GENESIS VISUAL EXACTLY** - Token values must match current hardcoded values
2. **EMBEDDED MODE ONLY** - Do not touch overlay render path (TerminalShell)
3. **RUN BASELINES AFTER EACH EPIC** - `npx playwright test tests/e2e/genesis-baseline.spec.ts`
4. **BUILD AFTER EACH PHASE** - `npm run build` must pass

## Execution Order

Execute in this exact order. Do not skip phases.

### Phase 1: Token Definition

```bash
# Location: styles/globals.css
# Add after line ~530 (after existing :root block)
```

Add this CSS block:

```css
/* ============================================================
   CHAT COLUMN TOKENS (Terminal Embedded Mode)
   Forest-dark palette for chat/conversation UI
   Sprint: Chat Column Unification v1
   ============================================================ */
:root {
  /* Backgrounds */
  --chat-bg: #1a2421;
  --chat-surface: #243029;
  --chat-surface-hover: #2d3b32;
  --chat-input-bg: #243029;
  
  /* Borders */
  --chat-border: #2d3b32;
  --chat-border-strong: #3d4b42;
  --chat-border-accent: #00D4AA;
  --chat-border-focus: #00D4AA;
  
  /* Text */
  --chat-text: rgba(255, 255, 255, 0.9);
  --chat-text-muted: rgba(255, 255, 255, 0.6);
  --chat-text-dim: rgba(255, 255, 255, 0.4);
  --chat-text-accent: #00D4AA;
  
  /* Accent */
  --chat-accent: #00D4AA;
  --chat-accent-hover: #00E4BA;
  --chat-accent-muted: rgba(0, 212, 170, 0.15);
  --chat-accent-text: #1a2421;
  
  /* Glass effects */
  --chat-glass: rgba(255, 255, 255, 0.05);
  --chat-glass-hover: rgba(255, 255, 255, 0.1);
  --chat-glass-border: rgba(255, 255, 255, 0.1);
  
  /* Semantic */
  --chat-success: #22c55e;
  --chat-warning: #f59e0b;
  --chat-error: #ef4444;
  --chat-error-bg: rgba(239, 68, 68, 0.15);
  --chat-error-border: rgba(239, 68, 68, 0.3);
}

/* Chat container for responsive queries */
.chat-container {
  container-type: inline-size;
  container-name: chat;
}

/* Responsive custom properties */
.chat-content {
  --chat-padding-x: 1rem;
  --chat-message-max-width: 90%;
}

@container chat (max-width: 359px) {
  .chat-content {
    --chat-padding-x: 0.75rem;
    --chat-message-max-width: 95%;
  }
  .chat-chips {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@container chat (min-width: 360px) and (max-width: 479px) {
  .chat-content {
    --chat-padding-x: 0.875rem;
    --chat-message-max-width: 92%;
  }
}

@container chat (min-width: 480px) and (max-width: 639px) {
  .chat-content {
    --chat-padding-x: 1rem;
    --chat-message-max-width: 90%;
  }
}

@container chat (min-width: 640px) {
  .chat-content {
    --chat-padding-x: 1.5rem;
    --chat-message-max-width: 85%;
  }
}
```

**Verify:** `npm run build` passes

---

### Phase 2: Terminal.tsx Embedded Branch

**File:** `components/Terminal.tsx`
**Scope:** Lines ~858-1100 (embedded render branch only)

**Find and replace patterns:**

| Find | Replace |
|------|---------|
| `bg-[#1a2421]` | `bg-[var(--chat-bg)]` |
| `text-white` (in embedded branch) | `text-[var(--chat-text)]` |
| `text-white/90` | `text-[var(--chat-text)]` |
| `text-white/60` | `text-[var(--chat-text-muted)]` |
| `text-white/40` | `text-[var(--chat-text-dim)]` |
| `text-[#00D4AA]` | `text-[var(--chat-text-accent)]` |
| `bg-[#00D4AA]` | `bg-[var(--chat-accent)]` |
| `text-[#1a2421]` (on accent bg) | `text-[var(--chat-accent-text)]` |
| `bg-white/5` | `bg-[var(--chat-glass)]` |
| `border-white/10` | `border-[var(--chat-glass-border)]` |
| `bg-red-900/30` | `bg-[var(--chat-error-bg)]` |
| `border-red-700/50` | `border-[var(--chat-error-border)]` |

**Add wrapper class:** Change the outer div of embedded branch to:
```tsx
<div className="chat-container flex flex-col h-full w-full bg-[var(--chat-bg)] text-[var(--chat-text)]">
```

**Add content class:** Add `.chat-content` to the scrollable content area.

**Verify:**
```bash
npm run build
npx playwright test tests/e2e/genesis-baseline.spec.ts
```

---

### Phase 3: TerminalHeader.tsx

**File:** `components/Terminal/TerminalHeader.tsx`

**Apply same replacement patterns as Phase 2.**

Key areas:
- Header container background
- Border bottom
- Lens pill (use glass tokens)
- Journey badge text
- Keep streak counter orange (semantic)

**Verify:** `npm run build`

---

### Phase 4: CommandInput Components

**Files:**
- `components/Terminal/CommandInput/index.tsx`
- `components/Terminal/CommandInput/CommandInput.tsx`

**Patterns:**

| Element | Token |
|---------|-------|
| Container bg | `bg-[var(--chat-input-bg)]` |
| Border | `border-[var(--chat-border)]` |
| Focus border | `focus:border-[var(--chat-border-focus)]` |
| Input text | `text-[var(--chat-text)]` |
| Placeholder | `placeholder:text-[var(--chat-text-dim)]` |
| Send button bg | `bg-[var(--chat-accent)]` |
| Send button text | `text-[var(--chat-accent-text)]` |
| Send button hover | `hover:bg-[var(--chat-accent-hover)]` |

**Verify:** `npm run build`

---

### Phase 5: Chat Components

**Files:**
- `components/Terminal/SuggestionChip.tsx`
- `components/Terminal/JourneyCard.tsx`
- `components/Terminal/JourneyNav.tsx`
- `components/Terminal/JourneyCompletion.tsx`

**SuggestionChip patterns:**

| Element | Token |
|---------|-------|
| Chip bg | `bg-[var(--chat-surface)]` |
| Chip border | `border-[var(--chat-border)]` |
| Hover border | `hover:border-[var(--chat-border-accent)]` |
| Text | `text-[var(--chat-text-muted)]` |
| Hover text | `group-hover:text-[var(--chat-accent)]` |

**JourneyCard/Nav/Completion:**
- Remove all `dark:` variant classes
- Replace with direct token usage

**Verify:** `npm run build`

---

### Phase 6: Supporting Components

**Files:**
- `components/Terminal/CognitiveBridge.tsx`
- `components/Terminal/WelcomeInterstitial.tsx`
- `components/Terminal/LensBadge.tsx`
- `components/Terminal/LensGrid.tsx`

**Apply same token patterns. Focus on embedded mode rendering only.**

**Verify:**
```bash
npm run build
npx playwright test tests/e2e/genesis-baseline.spec.ts
```

---

### Phase 7: ExploreChat Cleanup

**File:** `src/explore/ExploreChat.tsx`

**DELETE the entire `<style>` block** (approximately lines 27-150)

**Simplify to:**

```tsx
'use client';

import { useState } from 'react';
import { Terminal } from '@/components/Terminal';
import { SectionId } from '@/data/sectionContent';
import { INITIAL_TERMINAL_MESSAGE } from '@/lib/constants';
import type { TerminalState } from '@/types/terminal';

export function ExploreChat() {
  const [activeSection] = useState<SectionId>(SectionId.STAKES);
  const [terminalState, setTerminalState] = useState<TerminalState>({
    isOpen: true,
    messages: [{ id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }],
    isLoading: false
  });

  return (
    <div className="h-full w-full">
      <Terminal
        activeSection={activeSection}
        terminalState={terminalState}
        setTerminalState={setTerminalState}
        variant="embedded"
      />
    </div>
  );
}
```

**Verify:**
```bash
npm run build
npx playwright test tests/e2e/genesis-baseline.spec.ts
```

---

### Phase 8: Final Validation

1. **Run full test suite:**
```bash
npm test
npx playwright test
```

2. **Manual verification at viewports:**
- 1440px Genesis split
- 1440px Workspace chat
- 1024px both
- 768px both
- 375px both

3. **Functionality check:**
- Lens picker opens and changes lens
- Journey status displays
- Streak counter visible
- Suggestion chips clickable
- Messages send and receive
- Input accepts text

---

## Commit Strategy

One commit per phase:

```
git add -A && git commit -m "feat(terminal): add --chat-* token definitions"
git add -A && git commit -m "feat(terminal): migrate Terminal.tsx to chat tokens"
git add -A && git commit -m "feat(terminal): migrate TerminalHeader to chat tokens"
git add -A && git commit -m "feat(terminal): migrate CommandInput to chat tokens"
git add -A && git commit -m "feat(terminal): migrate chat components to tokens"
git add -A && git commit -m "feat(terminal): migrate supporting components to tokens"
git add -A && git commit -m "fix(terminal): delete ExploreChat CSS hack"
git add -A && git commit -m "test(terminal): verify chat column unification"
```

---

## Rollback

If any phase fails:

```bash
git checkout -- <file>        # Single file
git reset --hard HEAD~1       # Last commit
git reset --hard origin/main  # Full reset
```

---

## Success Criteria

- [ ] All `--chat-*` tokens defined and used
- [ ] Zero hardcoded colors in Terminal embedded branch
- [ ] Genesis baseline tests pass (4/4)
- [ ] ExploreChat.tsx < 40 lines
- [ ] Responsive behavior works at all breakpoints
- [ ] All header functionality preserved

---

## Log Output

Update `docs/sprints/chat-column-unification-v1/DEV_LOG.md` with:
- Start/end times
- Any issues encountered
- Decisions made during execution
- Final test results
