# Sprint 7.1: Execution Prompt (Revised)

Copy this entire prompt into Claude Code to execute the implementation.

---

## EXECUTION PROMPT

```
I need to implement Sprint 7.1: LensPicker Layout Fix for The Grove Foundation project.

## Foundation Loop Protocol

Follow the Foundation Loop methodology:
1. Read the sprint spec first
2. Audit relevant files before making changes  
3. Make minimal, focused changes
4. Test after each significant change
5. Document decisions in DEVLOG.md

## Context

Read the sprint documentation:
- `docs/sprints/sprint-7-terminal-flow-cleanup/sprint-7.1/SPEC.md` - Full specification
- `docs/sprints/sprint-7-terminal-flow-cleanup/sprint-7.1/FILE_REFERENCE.md` - Current file contents

## The Problem

The LensPicker component has legacy styling that doesn't fit the workspace:
1. "THE GROVE TERMINAL [V2.5.0]" header - legacy branding
2. No way to close without selecting a lens
3. Footer with redundant text
4. Light mode styling (bg-white, text-ink) doesn't match dark workspace

## Implementation Order

### Step 1: Update LensPicker.tsx

**File:** `components/Terminal/LensPicker.tsx`

1. Add `onClose` prop to interface:
```tsx
interface LensPickerProps {
  // ... existing props
  onClose?: () => void;  // ADD THIS
}
```

2. Replace the header (lines 31-45) with:
```tsx
{/* Minimal Header with Back Button */}
<div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
  {onClose && (
    <button
      onClick={onClose}
      className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Chat
    </button>
  )}
  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
    Switch Lens
  </span>
  <div className="w-24" /> {/* Spacer for centering */}
</div>
```

3. Remove the footer entirely (lines 56-60)

4. Add dark mode to container:
```tsx
<div className="flex flex-col h-full bg-white dark:bg-slate-900">
```

### Step 2: Update LensGrid.tsx Dark Mode

**File:** `components/Terminal/LensGrid.tsx`

Replace these class patterns throughout the file:

| Find | Replace |
|------|---------|
| `bg-white border-ink/10` | `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700` |
| `hover:border-ink/20` | `hover:border-slate-300 dark:hover:border-slate-600` |
| `hover:shadow-sm` | `hover:shadow-sm dark:hover:shadow-none` |
| `text-ink` (standalone) | `text-slate-900 dark:text-slate-100` |
| `text-ink-muted` | `text-slate-500 dark:text-slate-400` |
| `bg-ink/5` | `bg-slate-100 dark:bg-slate-700` |
| `border-ink/5` | `border-slate-200 dark:border-slate-700` |

**Key locations to update:**
- Line ~167: Custom lens card button
- Line ~186: Custom lens title text
- Line ~188: Custom lens description text  
- Line ~236: Standard lens card button
- Line ~168: Section header text

### Step 3: Wire onClose in Terminal.tsx

**File:** `components/Terminal.tsx`

Find the LensPicker usage (~line 1054) and add onClose:

```tsx
) : showLensPicker ? (
  <LensPicker
    personas={enabledPersonas}
    customLenses={customLenses}
    onSelect={handleLensSelect}
    onClose={() => setShowLensPicker(false)}  // ADD THIS LINE
    onCreateCustomLens={handleCreateCustomLens}
    onDeleteCustomLens={handleDeleteCustomLens}
    currentLens={session.activeLens}
    highlightedLens={urlLensId}
    showCreateOption={showCustomLensInPicker}
  />
) : (
```

### Step 4: CSS Cleanup in ExploreChat.tsx

**File:** `src/explore/ExploreChat.tsx`

Add these rules inside the <style> tag (after existing rules):

```css
/* LensPicker cleanup */
.explore-chat-container .bg-paper\\/50 {
  background: transparent !important;
}

.explore-chat-container .border-ink\\/5 {
  border-color: var(--grove-border, #1e2a36) !important;
}

/* Ensure dark backgrounds work */
.explore-chat-container .dark\\:bg-slate-900 {
  background: var(--grove-surface, #121a22) !important;
}

.explore-chat-container .dark\\:bg-slate-800 {
  background: rgba(30, 41, 59, 0.8) !important;
}
```

### Step 5: Test

1. `npm run dev`
2. Navigate to /explore or workspace with Terminal
3. Click on lens pill (or trigger LensPicker)
4. Verify:
   - [ ] "Back to Chat" button visible and works
   - [ ] No "THE GROVE TERMINAL" header
   - [ ] No footer
   - [ ] Dark mode styling matches workspace
   - [ ] Selecting a lens still works
   - [ ] Custom lenses section visible (if any exist)

5. `npm run build` - must pass
6. `npm test` - must pass

## Constraints

- Keep changes focused on LensPicker and LensGrid
- Don't modify WelcomeInterstitial (different flow, can update later)
- Preserve all existing functionality (lens selection, custom lens creation)
- Use Tailwind dark: variants, not CSS variables where possible

## Acceptance Criteria

- [ ] LensPicker has "Back to Chat" button
- [ ] Legacy "THE GROVE TERMINAL" header removed
- [ ] Footer removed
- [ ] Dark mode styling consistent
- [ ] Lens selection still works
- [ ] Custom lens section styled correctly
- [ ] Build passes
- [ ] Tests pass

## Output

Create or update `DEVLOG.md` in the sprint folder with:
1. Changes made to each file
2. Any issues encountered
3. Test results
4. Screenshots if relevant
```

---

## After Execution

Return to the original Claude context and share:
1. Screenshots of the updated LensPicker
2. DEVLOG.md contents  
3. Confirmation of build/test status
4. Any unexpected issues or decisions
