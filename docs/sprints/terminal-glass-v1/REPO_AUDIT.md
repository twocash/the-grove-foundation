# REPO_AUDIT.md — terminal-glass-v1

## Executive Summary

Sprint 6A + Quantum Glass v1.2 defined CSS classes for chat interfaces but **did not wire them to Terminal.tsx**. The Terminal still uses light-mode Tailwind classes that clash with the Quantum Glass design system. Additionally, the elegant dynamic width behavior was lost in recent refactors.

## Current State

### Terminal.tsx (1475 lines)

**Location:** `components/Terminal.tsx`

**Message Styling (Lines 1105-1135):**
```tsx
// User message - uses light-mode primary color
<div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">

// Assistant message - uses light-mode Tailwind
<div className="bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark">
```

**Width Constraint (Line 1089):**
```tsx
<div className="max-w-3xl mx-auto space-y-6">
  {/* Messages constrained to fixed 768px max */}
</div>
```

### Glass CSS Classes (globals.css lines 1108-1231)

**Available but not wired:**
- `.glass-chat-container` — Background: `var(--glass-void)`
- `.glass-message-user` — Background: `var(--glass-elevated)`, right-aligned styling
- `.glass-message-assistant` — Background: `var(--glass-panel)`, left-aligned styling
- `.glass-input-wrapper` — Background: `var(--glass-solid)`
- `.glass-input-field` — Background: `var(--glass-void)`
- `.glass-send-btn` — Background: `var(--neon-green)`

### Terminal Panel CSS (globals.css lines 239-291)

```css
.terminal-panel {
  background: #1a2421;  /* Hardcoded, should use --glass-void */
}
```

### CommandInput.tsx (242 lines)

**Location:** `components/Terminal/CommandInput/CommandInput.tsx`

Has `embedded` prop for conditional styling but non-embedded case uses Tailwind:
```tsx
// Non-embedded uses: bg-surface-light dark:bg-surface-dark
// Should use: glass-input-wrapper
```

## Files to Modify

| File | Lines | Changes |
|------|-------|---------|
| `components/Terminal.tsx` | ~1475 | Message bubbles, container, labels, footer |
| `components/Terminal/CommandInput/CommandInput.tsx` | ~242 | Input wrapper, field, button |
| `components/Terminal/TerminalHeader.tsx` | ~TBD | Background, border, text colors |
| `styles/globals.css` | ~1282 | Terminal panel bg, error message class, input focus |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TerminalHeader styling breaks pill layout | Medium | Medium | Review before changing |
| Streaming cursor visibility on glass | Low | Low | Verify cursor-blink animation |
| Code block readability | Low | Medium | Test with actual code blocks |
| Genesis left rail affected | Low | High | Terminal panel is isolated |

## Dependencies

| Dependency | Status |
|------------|--------|
| Glass CSS tokens (globals.css 970-1050) | ✅ Exists |
| Glass chat classes (globals.css 1108-1231) | ✅ Exists |
| Terminal.tsx | ✅ Ready |
| CommandInput.tsx | ✅ Ready |
