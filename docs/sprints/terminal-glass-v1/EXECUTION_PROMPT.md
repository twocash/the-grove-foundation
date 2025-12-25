# EXECUTION_PROMPT.md — terminal-glass-v1

## Context

Sprint `terminal-glass-v1` applies Quantum Glass theme to Terminal chat interface. Glass CSS classes exist in `globals.css` but aren't wired to `Terminal.tsx`. The Terminal uses light-mode Tailwind classes that clash with the dark glass design system.

**Project:** `C:\GitHub\the-grove-foundation`
**Pattern:** Pattern 4: Styling (Token Namespaces) — extending `--glass-*` tokens

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation
npm run build
```

---

## Epic 1: Message Area Glass Styling

### Step 1.1: Update Messages Container

**File:** `components/Terminal.tsx`

Find (~line 1089):
```tsx
<div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll bg-white dark:bg-background-dark">
  <div className="max-w-3xl mx-auto space-y-6">
```

Replace with:
```tsx
<div className="flex-1 overflow-y-auto p-4 md:p-6 terminal-scroll glass-chat-container">
  <div className="w-full max-w-[min(90%,56rem)] mx-auto space-y-6">
```

### Step 1.2: Update User Message Bubble

**File:** `components/Terminal.tsx`

Find (~line 1121):
```tsx
<div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
```

Replace with:
```tsx
<div className="glass-message glass-message-user">
```

### Step 1.3: Update Assistant Message Bubble

**File:** `components/Terminal.tsx`

Find the assistant message div with isSystemError ternary (~line 1127-1131):
```tsx
<div className={`px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm ${
  isSystemError
    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
    : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark'
}`}>
```

Replace with:
```tsx
<div className={`glass-message ${
  isSystemError
    ? 'glass-message-error'
    : 'glass-message-assistant'
}`}>
```

### Step 1.4: Add Error Message CSS Class

**File:** `styles/globals.css`

Find the `.glass-message-assistant` block (around line 1195) and add AFTER it:

```css
.glass-message-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 12px 12px 12px 4px;
}
```

### Step 1.5: Update Message Labels

**File:** `components/Terminal.tsx`

Find (~line 1113):
```tsx
<span className="text-xs font-semibold text-slate-600 dark:text-slate-400">You</span>
```

Replace with:
```tsx
<span className="text-xs font-semibold text-[var(--glass-text-subtle)]">You</span>
```

Find (~line 1116):
```tsx
<span className="text-xs font-semibold text-primary">The Grove</span>
```

Replace with:
```tsx
<span className="text-xs font-semibold text-[var(--neon-green)]">The Grove</span>
```

### Build Gate 1
```bash
npm run build
```

---

## Epic 2: Input Area Glass Styling

### Step 2.1: Update CommandInput Container

**File:** `components/Terminal/CommandInput/CommandInput.tsx`

Find the input container div (~line 176). The non-embedded case currently uses:
```tsx
'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50'
```

Replace the entire ternary for container className:
```tsx
<div className={`flex items-center gap-2 rounded-xl p-2 transition-all shadow-sm ${
  embedded
    ? 'bg-[var(--chat-input-bg)] border border-[var(--chat-border)] focus-within:border-[var(--chat-border-focus)] focus-within:ring-1 focus-within:ring-[var(--chat-accent)]/30'
    : 'glass-input-wrapper'
}`}>
```

### Step 2.2: Update CommandInput Text Colors

**File:** `components/Terminal/CommandInput/CommandInput.tsx`

Find the input className (~line 189). Update the non-embedded text styling:
```tsx
<input
  className={`flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none py-2 px-2 text-sm ${
    embedded
      ? 'text-[var(--chat-text)] placeholder:text-[var(--chat-text-dim)]'
      : 'text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-subtle)]'
  }`}
```

### Step 2.3: Update Send Button

**File:** `components/Terminal/CommandInput/CommandInput.tsx`

Find the submit button className (~line 200). Update non-embedded styling:
```tsx
<button
  className={`p-2 rounded-lg transition-colors shrink-0 disabled:opacity-50 ${
    embedded
      ? 'bg-[var(--chat-accent)] text-[var(--chat-accent-text)] hover:bg-[var(--chat-accent-hover)]'
      : 'glass-send-btn'
  }`}
```

### Step 2.4: Add Input Focus Styling

**File:** `styles/globals.css`

Find `.glass-input-wrapper` (around line 1223) and update/add:
```css
.glass-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--glass-solid);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  transition: border-color var(--duration-fast);
}

.glass-input-wrapper:focus-within {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.15);
}
```

### Build Gate 2
```bash
npm run build
```

---

## Epic 3: Footer & Panel Styling

### Step 3.1: Update Interactions Footer

**File:** `components/Terminal.tsx`

Find (~line 1230):
```tsx
<div className="border-t border-border-light dark:border-border-dark bg-surface-light/50 dark:bg-surface-dark/50">
```

Replace with:
```tsx
<div className="border-t border-[var(--glass-border)] bg-[var(--glass-solid)]">
```

### Step 3.2: Update Scholar Mode Button

**File:** `components/Terminal.tsx`

Find the Scholar Mode button className (search for "Scholar Mode"). Update the ternary:

When ON (isVerboseMode true):
```tsx
'bg-[var(--neon-green)] text-white shadow-sm'
```

When OFF (isVerboseMode false):
```tsx
'bg-transparent text-[var(--glass-text-subtle)] border border-[var(--glass-border)] hover:border-[var(--neon-green)] hover:text-[var(--neon-green)]'
```

### Step 3.3: Update Terminal Panel CSS

**File:** `styles/globals.css`

Find (~line 250):
```css
background: #1a2421;  /* Terminal dark bg */
```

Replace with:
```css
background: var(--glass-void);
```

### Build Gate 3
```bash
npm run build
```

---

## Epic 4: TerminalHeader Review

### Step 4.1: Audit and Update TerminalHeader

**File:** `components/Terminal/TerminalHeader.tsx`

Review the file and update any hardcoded colors:
- `bg-white` / `dark:bg-*` → `bg-[var(--glass-solid)]` or `bg-[var(--glass-panel)]`
- `border-slate-*` / `border-border-*` → `border-[var(--glass-border)]`
- `text-slate-*` → `text-[var(--glass-text-primary)]` or `text-[var(--glass-text-subtle)]`

**Note:** Be careful with lens badge colors - those should keep their semantic colors.

### Build Gate 4
```bash
npm run build
npx playwright test tests/e2e/genesis-baseline.spec.ts
```

---

## Final Verification

```bash
# Full test suite
npm run build
npx playwright test

# Start dev server for manual verification
npm run dev
```

### Manual Verification Checklist

1. **Genesis Context:**
   - [ ] Click Tree (🌱) to open Terminal
   - [ ] Terminal has dark glass background (distinct from paper left)
   - [ ] User messages: elevated glass, right-aligned
   - [ ] Assistant messages: panel glass with blur, left-aligned
   - [ ] Input has glass solid background
   - [ ] Input shows cyan focus ring on click
   - [ ] Send button is neon green with glow on hover

2. **Workspace Context:**
   - [ ] Navigate to /foundation
   - [ ] Open Terminal via inspector
   - [ ] Same glass styling as Genesis

3. **Dynamic Width:**
   - [ ] On wide screen (>1280px): messages expand
   - [ ] Messages don't exceed readable width
   - [ ] Code blocks utilize available width

4. **Error Handling:**
   - [ ] Trigger an error (e.g., network offline)
   - [ ] Error message has red-tinted glass styling

---

## Commit

```bash
git add -A
git commit -m "feat: Terminal Glass Styling (terminal-glass-v1)

- Apply Quantum Glass theme to Terminal chat interface
- User messages: glass-elevated background, right-aligned
- Assistant messages: glass-panel with backdrop blur
- Error messages: red-tinted glass styling
- Input field: glass-solid with neon-cyan focus
- Send button: neon-green with glow hover
- Dynamic width: messages breathe with container (90%, max 56rem)
- Terminal panel uses --glass-void background

Extends Pattern 4 (Token Namespaces) per PROJECT_PATTERNS.md.
Terminal now visually distinct from Genesis paper-textured rail."

git push origin main
```

---

## Troubleshooting

### Glass classes not applying
- Verify `globals.css` is imported in `_app.tsx` or layout
- Check browser dev tools for CSS specificity conflicts
- Ensure no inline styles overriding classes

### Focus ring not visible
- Check `--neon-cyan` token is defined
- Verify `.glass-input-wrapper:focus-within` rule exists
- Check z-index isn't hiding the ring

### Colors look wrong
- Ensure `--glass-*` tokens are defined in `:root`
- Check for dark mode overrides conflicting
- Verify no Tailwind `dark:` classes remaining

### Build fails
- Check for typos in CSS custom property names
- Verify bracket syntax: `text-[var(--token)]` not `text-var(--token)`
- Run `npm run lint` for syntax errors
