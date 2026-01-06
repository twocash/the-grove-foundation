# Hotfix: Inspector Input Race Condition

**ID:** HOTFIX-002-inspector-input-race
**Priority:** High
**Sprint:** inspector-input-fix-v1
**Date:** January 6, 2025
**Status:** Resolved

---

## Problem Statement

Text inputs in Bedrock inspector panels exhibit a race condition where rapid typing causes characters to be lost, duplicated, or overwritten. This happens consistently and makes the inspector unusable for editing titles, descriptions, and execution prompts.

**Root Cause:** The console factory's version tracking (see `console-factory.tsx:~329`) triggers inspector re-renders when `updatedAt` changes. Since every edit patch updates `updatedAt`, each keystroke causes:

1. User types character
2. `onChange` calls `onEdit([patch])`
3. Parent state updates, changing `updatedAt`
4. Version tracking detects change
5. `updateInspector()` re-renders editor
6. Input value is overwritten with prop value (potentially stale)

**Symptoms:**
- Characters appear then disappear
- Only 1-2 characters of rapid typing survive
- Cursor jumps unexpectedly
- Need to type very slowly for input to work

---

## Solution: Buffered Input Components

Created reusable `BufferedInput` and `BufferedTextarea` components that isolate input state from parent props.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BufferedInput                                │
│                                                                      │
│  ┌──────────────────────┐      ┌──────────────────────┐             │
│  │     localValue       │      │    isFocused         │             │
│  │  (immediate update)  │      │  (prevents sync)     │             │
│  └──────────────────────┘      └──────────────────────┘             │
│                                                                      │
│  User typing ──► setLocalValue (instant)                            │
│                                                                      │
│  Sync to parent happens ONLY when:                                  │
│    • User blurs (leaves field)                                      │
│    • Debounce timer fires (400ms after typing stops)               │
│                                                                      │
│  Parent prop changes are accepted ONLY when:                        │
│    • !isFocused (user not currently editing)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| 400ms debounce | Long enough to not interrupt typing, short enough to feel responsive |
| Sync on blur | Ensures data is saved when user moves to another field |
| Reject props while focused | Prevents race condition entirely |
| Use `lastSyncedRef` | Track what we sent to parent to avoid echo updates |

---

## Files Changed

| File | Change |
|------|--------|
| `src/bedrock/primitives/BufferedInput.tsx` | **New file** - BufferedInput and BufferedTextarea components |
| `src/bedrock/primitives/index.ts` | Added exports |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Replaced native inputs with buffered versions |
| `src/bedrock/patterns/console-factory.tsx` | Added architecture note |

---

## Usage

### For New Editors

Always use `BufferedInput` and `BufferedTextarea` for text fields in inspector editors:

```tsx
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';

// Instead of:
<textarea
  value={object.field}
  onChange={(e) => patchField('field', e.target.value)}
/>

// Use:
<BufferedTextarea
  value={object.field}
  onChange={(v) => patchField('field', v)}
  debounceMs={400}
  rows={3}
/>
```

### For Existing Editors

When adding text inputs to any Bedrock editor that uses the console factory pattern:

1. Import buffered components
2. Replace `<input>` with `<BufferedInput>`
3. Replace `<textarea>` with `<BufferedTextarea>`
4. Change `onChange={(e) => ...e.target.value}` to `onChange={(v) => ...}`
5. Add `debounceMs={400}` (optional, defaults to 300)

---

## Testing

Verified fix works by:
1. Navigating to Prompt Workshop
2. Selecting a prompt from Review Queue
3. Rapidly typing "Test Title Input Here 12345" into Title field
4. All 27 characters captured correctly
5. Repeated for Description and Execution Prompt fields

---

## Why This Keeps Happening

This race condition will recur whenever:
- A new editor uses native `<input>` or `<textarea>`
- The editor is rendered by the console factory
- The parent's `onEdit` triggers state updates

**Prevention:** The architecture note in `console-factory.tsx` documents the issue and solution. All new editors should reference this documentation.

---

## Related

- `HOTFIX-001-inspector-pattern.md` - Inspector context pattern
- `console-factory.tsx` - Where version tracking creates the race condition
- `BufferedInput.tsx` - The solution components

---

## Definition of Done

- [x] BufferedInput and BufferedTextarea components created
- [x] PromptEditor uses buffered components for all text fields
- [x] Architecture note added to console-factory.tsx
- [x] This hotfix document created
- [x] Tested in browser - rapid typing works correctly
