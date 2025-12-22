# Sprint 7.1: LensPicker Layout Fix

**Version:** 2.0 (Revised)
**Status:** Ready for Execution
**Dependencies:** Sprint 7 (Terminal Flow Cleanup) - COMPLETE
**Priority:** HIGH

## Problem Statement

When `showLensPicker` is true, the LensPicker component takes over the entire viewport with legacy styling that doesn't match the workspace design language. Issues:

1. **"THE GROVE TERMINAL [V2.5.0]" header** - Legacy branding, doesn't fit workspace
2. **Full-width layout** - Bleeds across entire center column without proper constraints
3. **Gray bar at bottom** - Footer styling artifact
4. **Inspector context mismatch** - Shows wrong lens (previously viewed, not hovered/selected)
5. **No close/back affordance** - User can only exit by selecting a lens

## Target State

LensPicker should render as proper middle-column content that:
- Respects the workspace layout constraints
- Has a clean, minimal header (or none)
- Integrates with the Inspector panel (context-aware)
- Has clear navigation affordance (back to chat)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Sidebar │         Middle Column                      │    Inspector   │
│         │ ┌────────────────────────────────────────┐ │                │
│ Explore │ │ [← Back to Chat]      [Search...]      │ │  [Hovered]     │
│  Nodes  │ │                                        │ │  Concerned     │
│  Journeys│ │ YOUR CUSTOM LENSES                    │ │  Citizen       │
│ >Lenses │ │ ┌────────────────────────────────────┐ │ │                │
│         │ │ │ The Skeptical Pragmatist           │ │ │  "I'm worried  │
│ Do      │ │ └────────────────────────────────────┘ │ │  about Big     │
│         │ │                                        │ │  Tech's grip"  │
│ Cultivate│ │ STANDARD LENSES                       │ │                │
│         │ │ ┌────────────────────────────────────┐ │ │  [Config]      │
│ Village │ │ │ Freestyle                          │ │ │  Tone: High    │
│         │ │ │ Concerned Citizen      [ACTIVE]    │ │ │  Source: Acad  │
│         │ │ │ Academic                           │ │ │                │
│         │ │ │ Engineer                           │ │ │  [Activate]    │
│         │ │ └────────────────────────────────────┘ │ │                │
│         │ └────────────────────────────────────────┘ │                │
└────────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Task 1: Simplify LensPicker Header

**File:** `components/Terminal/LensPicker.tsx`

Remove legacy terminal branding, add back navigation:

```tsx
// BEFORE (lines 31-45):
<div className="px-4 py-6 border-b border-ink/5">
  <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-4">
    THE GROVE TERMINAL [v2.5.0]
  </div>
  <h2 className="font-display text-xl text-ink mb-2">
    Switch Lens
  </h2>
  ...
</div>

// AFTER:
<div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
  <button
    onClick={onClose}
    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Back to Chat
  </button>
  <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
    Switch Lens
  </h2>
  <div className="w-20" /> {/* Spacer for centering */}
</div>
```

**Add prop:** `onClose?: () => void`

### Task 2: Remove Footer

**File:** `components/Terminal/LensPicker.tsx`

Remove or simplify the footer (lines 56-60):

```tsx
// REMOVE THIS:
<div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
  <p className="text-[10px] text-ink-muted text-center">
    Your current lens shapes how we explore topics together.
  </p>
</div>
```

### Task 3: Add Dark Mode Styling

**File:** `components/Terminal/LensPicker.tsx`

Update container classes for dark mode:

```tsx
// BEFORE:
<div className="flex flex-col h-full">

// AFTER:
<div className="flex flex-col h-full bg-white dark:bg-slate-900">
```

### Task 4: Update LensGrid for Dark Mode

**File:** `components/Terminal/LensGrid.tsx`

Update button/card styling:

```tsx
// Replace light mode classes with dark mode variants
// bg-white → bg-white dark:bg-slate-800
// border-ink/10 → border-slate-200 dark:border-slate-700
// text-ink → text-slate-900 dark:text-slate-100
// text-ink-muted → text-slate-500 dark:text-slate-400
// bg-ink/5 → bg-slate-100 dark:bg-slate-700
```

Key changes in LensGrid:
- Line ~167: `bg-white border-ink/10` → `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700`
- Line ~186: `text-ink` → `text-slate-900 dark:text-slate-100`
- Line ~188: `text-ink-muted` → `text-slate-500 dark:text-slate-400`

### Task 5: Wire Up onClose in Terminal.tsx

**File:** `components/Terminal.tsx`

Add close handler to LensPicker:

```tsx
// BEFORE (~line 1054):
<LensPicker
  personas={enabledPersonas}
  customLenses={customLenses}
  onSelect={handleLensSelect}
  ...
/>

// AFTER:
<LensPicker
  personas={enabledPersonas}
  customLenses={customLenses}
  onSelect={handleLensSelect}
  onClose={() => setShowLensPicker(false)}  // ADD THIS
  ...
/>
```

### Task 6: CSS Override Cleanup in ExploreChat

**File:** `src/explore/ExploreChat.tsx`

Add overrides to ensure LensPicker renders correctly:

```css
/* Add after existing rules in <style> tag */

/* LensPicker dark mode background */
.explore-chat-container .bg-paper\\/50 {
  background: transparent !important;
}

/* Ensure border colors match */
.explore-chat-container .border-ink\\/5 {
  border-color: var(--grove-border, #1e2a36) !important;
}
```

### Task 7: Inspector Context Awareness (Optional Enhancement)

**File:** `components/Terminal.tsx`

Track hovered lens for Inspector:

```tsx
// Add state
const [hoveredLens, setHoveredLens] = useState<string | null>(null);

// Pass to LensPicker
<LensPicker
  ...
  onHover={(lensId) => setHoveredLens(lensId)}
/>

// Pass to Inspector (if exists in this context)
inspectorLens={hoveredLens || currentLens}
```

**Note:** This may require understanding how the Inspector panel is currently wired. Mark as optional if complex.

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `components/Terminal/LensPicker.tsx` | New header, remove footer, dark mode | HIGH |
| `components/Terminal/LensGrid.tsx` | Dark mode styling throughout | HIGH |
| `components/Terminal.tsx` | Wire onClose prop | HIGH |
| `src/explore/ExploreChat.tsx` | CSS override cleanup | MEDIUM |

## Acceptance Criteria

### Must Have
- [ ] LensPicker has "Back to Chat" button that works
- [ ] Legacy "THE GROVE TERMINAL" header removed
- [ ] Footer removed or minimal
- [ ] Dark mode styling consistent with workspace
- [ ] Build passes
- [ ] Tests pass

### Nice to Have
- [ ] Search/filter input above lens list
- [ ] Inspector shows hovered lens info
- [ ] Smooth transition when opening/closing

## Testing Checklist

1. **Open LensPicker:** Click lens pill → Picker opens with back button
2. **Close without selecting:** Click "Back to Chat" → Returns to chat
3. **Select lens:** Click a lens → Returns to chat with new lens active
4. **Dark mode:** All elements styled correctly, no white backgrounds
5. **Custom lenses:** Section visible and styled correctly
6. **Active badge:** Shows on currently active lens

## Design Reference

**Colors (dark mode):**
- Background: `--grove-surface: #121a22` or `slate-900`
- Text: `--grove-text: #e2e8f0` or `slate-100`
- Muted: `--grove-text-muted: #94a3b8` or `slate-400`
- Border: `--grove-border: #1e2a36` or `slate-700`
- Accent: `--grove-accent: #00d4aa` or `primary`

**Typography:**
- Section headers: `text-[10px] font-mono uppercase tracking-wider`
- Lens titles: `text-sm font-semibold`
- Descriptions: `text-xs italic`
