# Migration Map: Chat Column Unification v1

**Sprint:** Chat Column Unification v1
**Date:** 2024-12-24

---

## Execution Order

```
Phase 1: Token Definition
├── 1.1 globals.css (add tokens)
│
Phase 2: Core Terminal
├── 2.1 Terminal.tsx (embedded branch)
│
Phase 3: Header & Input
├── 3.1 TerminalHeader.tsx
├── 3.2 CommandInput/index.tsx
├── 3.3 CommandInput/CommandInput.tsx
│
Phase 4: Chat Components
├── 4.1 SuggestionChip.tsx
├── 4.2 JourneyCard.tsx
├── 4.3 JourneyNav.tsx
├── 4.4 JourneyCompletion.tsx
│
Phase 5: Supporting Components
├── 5.1 CognitiveBridge.tsx
├── 5.2 WelcomeInterstitial.tsx
├── 5.3 LensBadge.tsx
├── 5.4 LensGrid.tsx
│
Phase 6: Responsive System
├── 6.1 globals.css (container queries)
├── 6.2 Terminal.tsx (responsive classes)
│
Phase 7: Cleanup
├── 7.1 ExploreChat.tsx (delete hack)
│
Phase 8: Testing
├── 8.1 Run Genesis baselines
├── 8.2 Manual verification
└── 8.3 Create Workspace baseline
```

---

## Phase 1: Token Definition

### 1.1 styles/globals.css

**Location:** After existing `:root` block (around line 530)

**Add:**
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
```

**Test:** Verify tokens appear in browser DevTools under `:root`

---

## Phase 2: Core Terminal

### 2.1 components/Terminal.tsx

**Scope:** Embedded render branch only (lines ~858-1100)

**Changes:**

| Line | Before | After |
|------|--------|-------|
| ~863 | `bg-[#1a2421] text-white` | `bg-[var(--chat-bg)] text-[var(--chat-text)]` |
| ~916 | `text-white/60` | `text-[var(--chat-text-muted)]` |
| ~916 | `text-[#00D4AA]` | `text-[var(--chat-text-accent)]` |
| ~924 | `bg-[#00D4AA] text-[#1a2421]` | `bg-[var(--chat-accent)] text-[var(--chat-accent-text)]` |
| ~929 | `bg-red-900/30 text-red-300 border border-red-700/50` | `bg-[var(--chat-error-bg)] text-red-300 border border-[var(--chat-error-border)]` |
| ~930 | `bg-white/5 text-white/90 border border-white/10` | `bg-[var(--chat-glass)] text-[var(--chat-text)] border border-[var(--chat-glass-border)]` |

**Add wrapper class:**
```tsx
// Line ~862
if (variant === 'embedded') {
  return (
    <div className="chat-container flex flex-col h-full w-full bg-[var(--chat-bg)] text-[var(--chat-text)]">
```

**Test:** Genesis split panel should look identical

---

## Phase 3: Header & Input

### 3.1 components/Terminal/TerminalHeader.tsx

**Changes:**

| Pattern | Before | After |
|---------|--------|-------|
| Background | `bg-[#1a2421]` | `bg-[var(--chat-bg)]` |
| Border | `border-white/10` | `border-[var(--chat-border)]` |
| Text primary | `text-white` | `text-[var(--chat-text)]` |
| Text muted | `text-white/60` | `text-[var(--chat-text-muted)]` |
| Lens pill bg | `bg-white/10` | `bg-[var(--chat-glass)]` |
| Lens pill hover | `hover:bg-white/20` | `hover:bg-[var(--chat-glass-hover)]` |
| Accent | `text-orange-400` (streak) | Keep as-is (semantic) |

### 3.2 components/Terminal/CommandInput/index.tsx

**Changes:**

| Pattern | Before | After |
|---------|--------|-------|
| Container bg | `bg-[#243029]` | `bg-[var(--chat-input-bg)]` |
| Border | `border-[#2d3b32]` | `border-[var(--chat-border)]` |
| Focus border | `focus:border-[#00D4AA]` | `focus:border-[var(--chat-border-focus)]` |

### 3.3 components/Terminal/CommandInput/CommandInput.tsx

**Changes:**

| Pattern | Before | After |
|---------|--------|-------|
| Input text | `text-white` | `text-[var(--chat-text)]` |
| Placeholder | `placeholder:text-white/40` | `placeholder:text-[var(--chat-text-dim)]` |
| Send button bg | `bg-[#00D4AA]` | `bg-[var(--chat-accent)]` |
| Send button text | `text-[#1a2421]` | `text-[var(--chat-accent-text)]` |
| Send button hover | `hover:bg-[#00D4AA]/90` | `hover:bg-[var(--chat-accent-hover)]` |

---

## Phase 4: Chat Components

### 4.1 components/Terminal/SuggestionChip.tsx

**Full replacement pattern:**

```tsx
// Before
className="... bg-[#243029] border-[#2d3b32] hover:border-[#00D4AA]/50 ..."
className="... text-white/80 group-hover:text-[#00D4AA] ..."
className="... text-white/40 group-hover:text-[#00D4AA] ..."

// After
className="... bg-[var(--chat-surface)] border-[var(--chat-border)] hover:border-[var(--chat-accent)]/50 ..."
className="... text-[var(--chat-text-muted)] group-hover:text-[var(--chat-accent)] ..."
className="... text-[var(--chat-text-dim)] group-hover:text-[var(--chat-accent)] ..."
```

### 4.2 components/Terminal/JourneyCard.tsx

**Changes:**

| Pattern | Before | After |
|---------|--------|-------|
| `text-primary` | Keep | Keep (uses CSS var) |
| `dark:border-slate-700` | Remove | `border-[var(--chat-border)]` |
| `dark:bg-slate-800/50` | Remove | `bg-[var(--chat-surface)]` |
| `dark:text-slate-200` | Remove | `text-[var(--chat-text)]` |

### 4.3 components/Terminal/JourneyNav.tsx

**Same pattern as JourneyCard** - replace Tailwind dark: variants with tokens

### 4.4 components/Terminal/JourneyCompletion.tsx

**Same pattern** - replace dark: variants with tokens

---

## Phase 5: Supporting Components

### 5.1 components/Terminal/CognitiveBridge.tsx

**Changes:**

| Pattern | Before | After |
|---------|--------|-------|
| Background | Hardcoded | `bg-[var(--chat-surface)]` |
| Border | Hardcoded | `border-[var(--chat-border)]` |
| Text | Hardcoded | `text-[var(--chat-text)]` |
| Accent | Hardcoded | `text-[var(--chat-accent)]` |

### 5.2 components/Terminal/WelcomeInterstitial.tsx

**Note:** This shows in lens picker context - update for embedded mode only

| Pattern | Before | After |
|---------|--------|-------|
| Card bg | Paper/ink | `bg-[var(--chat-surface)]` |
| Card border | Paper/ink | `border-[var(--chat-border)]` |
| Text | Paper/ink | Token equivalents |

### 5.3 components/Terminal/LensBadge.tsx

**Changes:**

| Pattern | Before | After |
|---------|--------|-------|
| Badge bg | Inline style | `bg-[var(--chat-glass)]` |
| Badge text | Inline | `text-[var(--chat-text)]` |

### 5.4 components/Terminal/LensGrid.tsx

**Changes:**

| Pattern | Before | After |
|---------|--------|-------|
| Grid item bg | Mixed | `bg-[var(--chat-surface)]` |
| Grid item border | Mixed | `border-[var(--chat-border)]` |
| Selected state | Mixed | `border-[var(--chat-accent)]` |

---

## Phase 6: Responsive System

### 6.1 styles/globals.css (add after tokens)

```css
/* ============================================================
   CHAT RESPONSIVE SYSTEM
   Container queries for adaptive chat layout
   ============================================================ */

/* Container definition */
.chat-container {
  container-type: inline-size;
  container-name: chat;
}

/* Default responsive properties */
.chat-content {
  --chat-padding-x: 1rem;
  --chat-message-max-width: 90%;
}

/* Compact: < 360px */
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

/* Narrow: 360-479px */
@container chat (min-width: 360px) and (max-width: 479px) {
  .chat-content {
    --chat-padding-x: 0.875rem;
    --chat-message-max-width: 92%;
  }
}

/* Standard: 480-639px */
@container chat (min-width: 480px) and (max-width: 639px) {
  .chat-content {
    --chat-padding-x: 1rem;
    --chat-message-max-width: 90%;
  }
}

/* Comfortable: 640px+ */
@container chat (min-width: 640px) {
  .chat-content {
    --chat-padding-x: 1.5rem;
    --chat-message-max-width: 85%;
  }
}
```

### 6.2 components/Terminal.tsx (update embedded branch)

Add responsive classes to content area:

```tsx
// Content Area
<div className="chat-content flex-1 overflow-y-auto px-[var(--chat-padding-x)]">
  {/* Messages */}
  <div className="max-w-[var(--chat-message-max-width)]">
    {/* message content */}
  </div>
</div>

// Chips container
<div className="chat-chips flex flex-col gap-2">
  {suggestions.map(...)}
</div>
```

---

## Phase 7: Cleanup

### 7.1 src/explore/ExploreChat.tsx

**DELETE entire `<style>` block** (lines ~27-150)

**Before (159 lines):**
```tsx
export function ExploreChat() {
  // ... state setup ...
  
  return (
    <div className="explore-chat-container">
      <style>{`
        .explore-chat-container { ... }
        // 100+ lines of CSS hacks
      `}</style>
      
      <Terminal ... />
    </div>
  );
}
```

**After (~30 lines):**
```tsx
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

---

## Phase 8: Testing

### 8.1 Genesis Baseline Tests

```bash
cd C:\GitHub\the-grove-foundation
npx playwright test tests/e2e/genesis-baseline.spec.ts
```

**Expected:** All 4 baselines pass (initial, hero, split, expanded)

### 8.2 Manual Verification Matrix

| Viewport | Route | Check | Pass? |
|----------|-------|-------|-------|
| 1440px | `/` (Genesis) | Split panel matches design | |
| 1440px | `/terminal` | Chat matches Genesis | |
| 1024px | `/` | Tablet split works | |
| 1024px | `/terminal` | Narrow panel works | |
| 768px | Both | Responsive behavior | |
| 375px | Both | Mobile/compact mode | |

### 8.3 Create Workspace Baseline (New)

```typescript
// tests/e2e/workspace-chat-baseline.spec.ts
test('Workspace chat matches Genesis styling', async ({ page }) => {
  await page.goto('/terminal');
  await page.waitForSelector('.chat-container');
  await expect(page).toHaveScreenshot('workspace-chat-baseline.png');
});
```

---

## Build Gates

After each phase:

```bash
npm run build          # TypeScript compiles
npm test               # Unit tests pass
npx tsc --noEmit       # No type errors
```

After Phase 7:

```bash
npx playwright test    # All E2E tests pass
```

---

## Rollback Points

| Phase | Rollback Command |
|-------|------------------|
| 1 | `git checkout -- styles/globals.css` |
| 2 | `git checkout -- components/Terminal.tsx` |
| 3-5 | `git checkout -- components/Terminal/` |
| 6 | `git checkout -- styles/globals.css components/Terminal.tsx` |
| 7 | `git checkout -- src/explore/ExploreChat.tsx` |

Full rollback: `git reset --hard HEAD~1` (after commit)
