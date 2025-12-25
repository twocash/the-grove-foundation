# SPRINTS.md — terminal-glass-v1

## Epic 1: Message Area Glass Styling

### Story 1.1: Update Messages Container
**File:** `components/Terminal.tsx` (~line 1089)

**Task:** Replace container classes with glass classes and dynamic width.

**Find:**
```tsx
<div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll bg-white dark:bg-background-dark">
  <div className="max-w-3xl mx-auto space-y-6">
```

**Replace:**
```tsx
<div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll glass-chat-container">
  <div className="w-full max-w-[min(90%,56rem)] mx-auto space-y-6">
```

**Tests:**
- Visual: Dark glass background visible
- Behavior: Messages still scroll properly

---

### Story 1.2: Update User Message Bubble
**File:** `components/Terminal.tsx` (~line 1121)

**Task:** Replace user message styling with glass class.

**Find:**
```tsx
<div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
```

**Replace:**
```tsx
<div className="glass-message glass-message-user">
```

**Tests:**
- Visual: User messages have elevated glass background
- Visual: Right-aligned with correct border radius

---

### Story 1.3: Update Assistant Message Bubble
**File:** `components/Terminal.tsx` (~line 1127-1131)

**Task:** Replace assistant message styling with glass class.

**Find:**
```tsx
<div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm ${
  isSystemError
    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark'
}`}>
```

**Replace:**
```tsx
<div className={`glass-message ${
  isSystemError
    ? 'glass-message-error'
    : 'glass-message-assistant'
}`}>
```

**Tests:**
- Visual: Assistant messages have panel glass background
- Visual: Error messages have red-tinted glass

---

### Story 1.4: Add Error Message CSS Class
**File:** `styles/globals.css` (after `.glass-message-assistant`)

**Task:** Add error message styling class.

**Add:**
```css
.glass-message-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 12px 12px 12px 4px;
}
```

**Tests:**
- Visual: Error messages render with red tint

---

### Story 1.5: Update Message Labels
**File:** `components/Terminal.tsx` (~line 1113-1118)

**Task:** Update label colors to use glass tokens.

**Find:**
```tsx
<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">You</span>
```
```tsx
<span className="text-xs font-semibold text-primary">The Grove</span>
```

**Replace:**
```tsx
<span className="text-xs font-semibold text-[var(--glass-text-subtle)]">You</span>
```
```tsx
<span className="text-xs font-semibold text-[var(--neon-green)]">The Grove</span>
```

**Tests:**
- Visual: Labels visible on glass background

---

### Build Gate: Epic 1
```bash
npm run build
# Manual: Open Terminal, verify message styling
```

---

## Epic 2: Input Area Glass Styling

### Story 2.1: Update CommandInput Container
**File:** `components/Terminal/CommandInput/CommandInput.tsx` (~line 176)

**Task:** Use glass classes for non-embedded mode.

**Find (non-embedded case):**
```tsx
'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50'
```

**Replace:**
```tsx
'glass-input-wrapper'
```

**Tests:**
- Visual: Input has glass solid background
- Behavior: Focus ring appears on focus

---

### Story 2.2: Update CommandInput Text Colors
**File:** `components/Terminal/CommandInput/CommandInput.tsx` (~line 189)

**Task:** Use glass text tokens for non-embedded mode.

**Find (non-embedded case):**
```tsx
'text-slate-900 dark:text-white placeholder-slate-500'
```

**Replace:**
```tsx
'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-subtle)]'
```

**Tests:**
- Visual: Input text visible, placeholder muted

---

### Story 2.3: Update Send Button
**File:** `components/Terminal/CommandInput/CommandInput.tsx` (~line 200)

**Task:** Use glass send button class for non-embedded mode.

**Find (non-embedded case):**
```tsx
'bg-primary text-white hover:bg-primary/90'
```

**Replace:**
```tsx
'glass-send-btn'
```

**Tests:**
- Visual: Send button is neon green
- Visual: Glow effect on hover

---

### Story 2.4: Add Input Focus Styling
**File:** `styles/globals.css` (after `.glass-input-wrapper`)

**Task:** Add focus-within styling for input wrapper.

**Add:**
```css
.glass-input-wrapper {
  border-radius: 12px;
}

.glass-input-wrapper:focus-within {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.15);
}
```

**Tests:**
- Visual: Cyan ring on input focus

---

### Build Gate: Epic 2
```bash
npm run build
# Manual: Test input focus, send button hover
```

---

## Epic 3: Footer & Panel Styling

### Story 3.1: Update Interactions Footer
**File:** `components/Terminal.tsx` (~line 1230)

**Task:** Update footer container to use glass tokens.

**Find:**
```tsx
<div className="border-t border-border-light dark:border-border-dark bg-surface-light/50 dark:bg-surface-dark/50">
```

**Replace:**
```tsx
<div className="border-t border-[var(--glass-border)] bg-[var(--glass-solid)]">
```

**Tests:**
- Visual: Footer has glass solid background

---

### Story 3.2: Update Scholar Mode Button
**File:** `components/Terminal.tsx` (~line 1300 area)

**Task:** Update Scholar Mode button to use glass tokens.

**Find (when OFF):**
```tsx
'bg-transparent text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary'
```

**Replace (when OFF):**
```tsx
'bg-transparent text-[var(--glass-text-subtle)] border border-[var(--glass-border)] hover:border-[var(--neon-green)] hover:text-[var(--neon-green)]'
```

**Find (when ON):**
```tsx
'bg-primary text-white shadow-sm'
```

**Replace (when ON):**
```tsx
'bg-[var(--neon-green)] text-white shadow-sm'
```

**Tests:**
- Visual: Scholar Mode toggle visible and interactive

---

### Story 3.3: Update Terminal Panel CSS
**File:** `styles/globals.css` (~line 250)

**Task:** Use glass token for terminal panel background.

**Find:**
```css
background: #1a2421;
```

**Replace:**
```css
background: var(--glass-void);
```

**Tests:**
- Visual: Terminal panel uses glass void color

---

### Build Gate: Epic 3
```bash
npm run build
# Manual: Verify footer, Scholar Mode, panel background
```

---

## Epic 4: TerminalHeader Review

### Story 4.1: Audit TerminalHeader Styling
**File:** `components/Terminal/TerminalHeader.tsx`

**Task:** Review and update header to use glass tokens where applicable.

**Updates needed:**
- Background: `var(--glass-solid)` or `var(--glass-panel)`
- Borders: `var(--glass-border)`
- Text: `var(--glass-text-primary)`, `var(--glass-text-subtle)`

**Note:** Be careful not to break lens badge or pill layouts.

**Tests:**
- Visual: Header consistent with glass theme
- Behavior: Lens/journey pills still work

---

### Build Gate: Epic 4
```bash
npm run build
npx playwright test tests/e2e/genesis-baseline.spec.ts
```

---

## Final Verification

```bash
# Full build
npm run build

# E2E tests
npx playwright test

# Manual verification checklist:
# [ ] Terminal in Genesis: Dark glass theme
# [ ] Terminal in Workspace: Same styling
# [ ] User messages: Elevated glass, right-aligned
# [ ] Assistant messages: Panel glass, left-aligned
# [ ] Error messages: Red-tinted glass
# [ ] Input: Glass solid with cyan focus
# [ ] Send button: Neon green with glow
# [ ] Messages breathe on wide screens
# [ ] Code blocks readable
```

## Commit Template

```
feat: Terminal Glass Styling (terminal-glass-v1)

- Apply Quantum Glass theme to Terminal chat interface
- User messages: glass-elevated background, right-aligned
- Assistant messages: glass-panel with backdrop blur
- Error messages: red-tinted glass styling
- Input field: glass-solid with neon-cyan focus
- Send button: neon-green with glow hover
- Dynamic width: messages breathe with container
- Terminal panel uses --glass-void background

Terminal now visually distinct from Genesis paper rail.
```
