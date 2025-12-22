# Sprint 6: Chat Styling - STORIES

**Version:** 1.0
**Date:** 2025-12-22

---

## Story Overview

| ID | Story | Priority | Effort | Status |
|----|-------|----------|--------|--------|
| S1 | Add message container max-width | P0 | S | Pending |
| S2 | Update user message bubble styling | P0 | S | Pending |
| S3 | Update AI message bubble styling | P0 | M | Pending |
| S4 | Update input area styling | P0 | M | Pending |
| S5 | Add dark mode support | P0 | S | Pending |
| S6 | Verify no regressions | P1 | S | Pending |

**Effort:** S = Small (<30 min), M = Medium (30-60 min), L = Large (>60 min)

---

## S1: Add Message Container Max-Width

**Priority:** P0 (Critical)
**Effort:** Small
**File:** `components/Terminal.tsx`

### Description

Wrap the messages area with a max-width container to cap message width at 768px for readability on wide screens.

### Acceptance Criteria

- [ ] Messages max out at 768px width on screens >1024px
- [ ] Messages center horizontally when container is wider
- [ ] Mobile (<768px) uses full width with padding

### Implementation

Find the messages container (around line 1104):
```tsx
// Current
<div className="flex-1 overflow-y-auto p-6 space-y-8 terminal-scroll bg-white">

// Change to
<div className="flex-1 overflow-y-auto p-6 terminal-scroll bg-white dark:bg-background-dark">
  <div className="max-w-3xl mx-auto space-y-8">
```

Don't forget to close the new wrapper div before the messages container closes.

---

## S2: Update User Message Bubble Styling

**Priority:** P0 (Critical)
**Effort:** Small
**File:** `components/Terminal.tsx`

### Description

Replace the current user message bubble styling with high-contrast green-on-white design.

### Acceptance Criteria

- [ ] User messages have `bg-primary text-white`
- [ ] Bubble shape is `rounded-2xl rounded-tr-sm`
- [ ] Messages are right-aligned
- [ ] Max width is 70% on desktop, 85% on mobile

### Implementation

Find user message rendering (around line 1117):
```tsx
// Current
<div className="bg-paper-dark px-4 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-xl text-ink font-serif border border-ink/5">
  {msg.text.replace(' --verbose', '')}
</div>

// Change to
<div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
  <p className="text-sm md:text-base leading-relaxed">
    {msg.text.replace(' --verbose', '')}
  </p>
</div>
```

Also update the container to constrain width:
```tsx
// Current
<div className={`max-w-[95%] text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>

// Change to
<div className={`${msg.role === 'user' ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[90%] md:max-w-[85%]'}`}>
```

---

## S3: Update AI Message Bubble Styling

**Priority:** P0 (Critical)
**Effort:** Medium
**File:** `components/Terminal.tsx`

### Description

Replace the border-left style with proper message bubble for AI messages, with visible background in dark mode.

### Acceptance Criteria

- [ ] AI messages have visible background in both modes
- [ ] Light mode: `bg-slate-100 text-slate-900`
- [ ] Dark mode: `bg-surface-dark text-slate-100`
- [ ] Bubble shape is `rounded-2xl rounded-tl-sm`
- [ ] Has visible border in dark mode

### Implementation

Find AI message rendering (around line 1121):
```tsx
// Current
<div className={`pl-4 border-l-2 ${isSystemError ? 'border-red-500 text-red-700 bg-red-50/50 py-2 pr-2' : 'border-grove-forest/30'}`}>
  <MarkdownRenderer content={msg.text} onPromptClick={handleSuggestion} />
  {/* ... suggestion chips ... */}
</div>

// Change to
<div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm ${
  isSystemError
    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark'
}`}>
  <MarkdownRenderer content={msg.text} onPromptClick={handleSuggestion} />
  {/* ... suggestion chips ... */}
</div>
```

---

## S4: Update Input Area Styling

**Priority:** P0 (Critical)
**Effort:** Medium
**File:** `components/Terminal/CommandInput/CommandInput.tsx`

### Description

Update the input area to have visible background/border with proper focus states.

### Acceptance Criteria

- [ ] Input has visible background (`bg-surface-light dark:bg-surface-dark`)
- [ ] Input has visible border
- [ ] Focus shows primary-colored ring
- [ ] Send button has `bg-primary` background
- [ ] Works in both light and dark modes

### Implementation

Update the input container (around line 188-210):
```tsx
// Current structure
<div className="relative">
  {/* Toast */}
  {/* Autocomplete */}
  <input className="..." />
  <button className="absolute right-3 ...">...</button>
</div>

// New structure
<div className="relative">
  {/* Toast - keep as is */}
  {toast && (...)}

  {/* Autocomplete - keep as is */}
  {showAutocomplete && (...)}

  {/* Input container - NEW WRAPPER */}
  <div className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark rounded-xl p-2
                  border border-border-light dark:border-border-dark
                  focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50
                  transition-all shadow-sm">
    <input
      ref={inputRef}
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Write a query or type /help"
      className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white
                 placeholder-slate-500 focus:ring-0 focus:outline-none py-2 px-2 text-sm"
      disabled={disabled}
      autoComplete="off"
    />
    <button
      onClick={handleSubmit}
      className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shrink-0"
      disabled={disabled}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</div>
```

---

## S5: Add Dark Mode Support

**Priority:** P0 (Critical)
**Effort:** Small
**File:** `components/Terminal.tsx`

### Description

Ensure all chat elements support dark mode using Tailwind's `dark:` prefix.

### Acceptance Criteria

- [ ] Terminal drawer background supports dark mode
- [ ] All text colors support dark mode
- [ ] Labels support dark mode

### Implementation

Update Terminal drawer container (around line 1036):
```tsx
// Current
<div className={`fixed inset-y-0 right-0 z-[60] w-full md:w-[480px] bg-white border-l border-ink/10 ...`}>

// Change to
<div className={`fixed inset-y-0 right-0 z-[60] w-full md:w-[480px] bg-white dark:bg-background-dark border-l border-border-light dark:border-border-dark ...`}>
```

Update message labels (around line 1111):
```tsx
// Current
<div className="text-[10px] font-mono text-ink-muted mb-2 uppercase tracking-widest">
  {msg.role === 'user' ? 'You' : 'The Grove'}
</div>

// Change to
<div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
  {msg.role === 'user' ? (
    <>
      <span className="text-xs text-slate-500 dark:text-slate-400">{formatTime()}</span>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">You</span>
    </>
  ) : (
    <>
      <span className="text-xs font-bold text-primary">The Grove</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{formatTime()}</span>
    </>
  )}
</div>
```

Note: `formatTime()` is a placeholder - you may want to just remove timestamps initially if they're not currently tracked on messages.

---

## S6: Verify No Regressions

**Priority:** P1 (High)
**Effort:** Small
**File:** N/A (Testing)

### Description

Verify all existing functionality still works after styling changes.

### Test Checklist

- [ ] Terminal drawer opens/closes properly
- [ ] Can send messages
- [ ] Receive AI responses
- [ ] Command palette (`/help`) works
- [ ] Autocomplete suggestions appear
- [ ] Suggestion chips are clickable
- [ ] MarkdownRenderer displays code blocks
- [ ] Links are clickable
- [ ] Lens picker opens
- [ ] No console errors

### Test Steps

1. Open browser dev tools (Console tab)
2. Open Terminal drawer
3. Type `/help` → Verify autocomplete appears
4. Submit `/help` → Verify modal opens
5. Close modal
6. Send "What is Grove?" → Verify response renders
7. Click suggestion chip → Verify message sends
8. Resize window → Verify messages stay readable
9. Check console for errors

---

## Implementation Order

Execute stories in this order:

```
S1 (Container)
  ↓
S5 (Dark mode base)
  ↓
S2 (User bubbles)
  ↓
S3 (AI bubbles)
  ↓
S4 (Input)
  ↓
S6 (Testing)
```

**Rationale:** Container and dark mode changes establish the foundation. User bubbles are simplest (no MarkdownRenderer). AI bubbles are more complex. Input requires restructuring. Testing validates everything.

---

## Quick Reference: Key Line Numbers

| Element | File | Approximate Lines |
|---------|------|-------------------|
| Drawer container | Terminal.tsx | ~1036 |
| Messages container | Terminal.tsx | ~1104 |
| Message labels | Terminal.tsx | ~1111 |
| User bubble | Terminal.tsx | ~1117 |
| AI bubble | Terminal.tsx | ~1121 |
| Input area | CommandInput.tsx | ~188-210 |

---

## Definition of Done

Sprint is complete when:

1. All P0 stories are completed
2. All acceptance criteria are met
3. No console errors
4. All regression tests pass
5. Both light and dark modes work (if dark mode toggle exists)
