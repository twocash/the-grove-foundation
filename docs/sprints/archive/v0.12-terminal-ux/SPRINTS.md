# Sprint Stories — Terminal UX v0.12

## Epic 1: State & Types (P0)

### Story 1.1: Extend TerminalState with isMinimized
**File:** `src/core/schema/base.ts`
**Lines:** 27-32
**Task:** Add `isMinimized?: boolean` to TerminalState interface
**Commit:** `feat(types): add isMinimized to TerminalState`

### Story 1.2: Add Feature Flags to Schema
**File:** `data/narratives.json`
**Location:** `globalSettings.featureFlags` array
**Task:** Add flags:
```json
{
  "id": "terminal-minimize",
  "name": "Terminal Minimize",
  "description": "Enable minimize to pill functionality",
  "enabled": true
},
{
  "id": "terminal-controls-below",
  "name": "Controls Below Input",
  "description": "Move lens/journey controls below input",
  "enabled": true
}
```
**Commit:** `feat(flags): add terminal UX feature flags`

---

## Epic 2: Pill Component (P0)

### Story 2.1: Create TerminalPill Component
**File:** Create `components/Terminal/TerminalPill.tsx`
**Task:** New component with props:
- `isLoading: boolean` — show thinking indicator
- `onExpand: () => void` — click handler
**Styling:**
- Fixed bottom-4 left-4 right-4
- Paper background, subtle shadow
- Grove emoji + "Your Grove" text
- Expand arrow on right
**Commit:** `feat(terminal): add TerminalPill component`

### Story 2.2: Export TerminalPill
**File:** `components/Terminal/index.ts`
**Lines:** 10
**Task:** Add export for TerminalPill
**Commit:** `chore(terminal): export TerminalPill`

---

## Epic 3: Header Redesign (P0)

### Story 3.1: Create TerminalHeader Component
**File:** Create `components/Terminal/TerminalHeader.tsx`
**Task:** New component with props:
- `onMenuClick: () => void` — future menu
- `onMinimize: () => void` — minimize handler
- `isScholarMode: boolean` — badge display
**Layout:** `[≡] Your Grove [Scholar?] [–]`
**Commit:** `feat(terminal): add TerminalHeader component`

### Story 3.2: Export TerminalHeader
**File:** `components/Terminal/index.ts`
**Task:** Add export for TerminalHeader
**Commit:** `chore(terminal): export TerminalHeader`

### Story 3.3: Replace Inline Header in Terminal.tsx
**File:** `components/Terminal.tsx`
**Lines:** 889-901
**Task:** Replace inline header JSX with `<TerminalHeader />` component
**Commit:** `refactor(terminal): use TerminalHeader component`

---

## Epic 4: Minimize Behavior (P0)

### Story 4.1: Add Minimize State Logic
**File:** `components/Terminal.tsx`
**Lines:** Around 250-280 (state declarations)
**Task:** 
- Add `const [isMinimized, setIsMinimized] = useState(false)`
- Create `handleMinimize` function
- Create `handleExpand` function
- Update `toggleTerminal` to handle all three states
**Commit:** `feat(terminal): add minimize state management`

### Story 4.2: Conditional Rendering Pill vs Drawer
**File:** `components/Terminal.tsx`
**Lines:** 846-1267 (return statement)
**Task:** 
- When `isMinimized && terminalState.isOpen`: render TerminalPill
- When `!isMinimized && terminalState.isOpen`: render drawer
- When `!terminalState.isOpen`: render FAB only
**Commit:** `feat(terminal): render pill when minimized`

### Story 4.3: Wire Header Minimize Button
**File:** `components/Terminal.tsx`
**Task:** Pass `onMinimize={handleMinimize}` to TerminalHeader
**Commit:** `feat(terminal): wire minimize button`

### Story 4.4: Add Minimize Telemetry
**File:** `utils/funnelAnalytics.ts`
**Task:** Add tracking functions:
- `trackTerminalMinimized()`
- `trackTerminalExpanded()`
**Commit:** `telemetry: add minimize/expand tracking`

---

## Epic 5: Controls Relocation (P1)

### Story 5.1: Create TerminalControls Component
**File:** Create `components/Terminal/TerminalControls.tsx`
**Task:** New component with props:
- `persona: Persona | null`
- `onSwitchLens: () => void`
- `currentPosition: number`
- `totalSteps: number`
- `currentStreak: number`
- `showStreak: boolean`
- `showJourney: boolean`
**Layout:** Horizontal bar, single line
**Commit:** `feat(terminal): add TerminalControls component`

### Story 5.2: Export TerminalControls
**File:** `components/Terminal/index.ts`
**Task:** Add export for TerminalControls
**Commit:** `chore(terminal): export TerminalControls`

### Story 5.3: Add Controls Below Input
**File:** `components/Terminal.tsx`
**Lines:** After input area (~1165)
**Task:** Render `<TerminalControls />` below input, gated by feature flag
**Commit:** `feat(terminal): render controls below input`

### Story 5.4: Remove JourneyNav from Top (Feature Flagged)
**File:** `components/Terminal.tsx`
**Lines:** 904-924
**Task:** Gate JourneyNav rendering with inverse of `terminal-controls-below` flag
**Commit:** `refactor(terminal): gate JourneyNav with feature flag`

---

## Epic 6: Suggestion Chips (P1)

### Story 6.1: Create SuggestionChip Component
**File:** Create `components/Terminal/SuggestionChip.tsx`
**Task:** New component with props:
- `prompt: string`
- `onClick: (prompt: string) => void`
**Styling:**
- Full width
- Subtle paper-dark background
- Grove-forest border on hover
- Arrow icon on right
- Scale 1.01 on hover
**Commit:** `feat(terminal): add SuggestionChip component`

### Story 6.2: Export SuggestionChip
**File:** `components/Terminal/index.ts`
**Task:** Add export for SuggestionChip
**Commit:** `chore(terminal): export SuggestionChip`

### Story 6.3: Update MarkdownRenderer to Use SuggestionChip
**File:** `components/Terminal.tsx`
**Lines:** 115-130 (flushPrompts function)
**Task:** Replace inline button with SuggestionChip component
**Commit:** `refactor(terminal): use SuggestionChip in MarkdownRenderer`

### Story 6.4: Add Suggestion Click Telemetry
**File:** `utils/funnelAnalytics.ts`
**Task:** Add `trackSuggestionClicked(prompt: string, messageId: string)`
**File:** `components/Terminal.tsx`
**Task:** Call tracking when suggestion clicked
**Commit:** `telemetry: track suggestion chip clicks`

---

## Epic 7: Animations & Polish (P1)

### Story 7.1: Add CSS Animations
**File:** `styles/globals.css`
**Task:** Add keyframes:
```css
@keyframes slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
@keyframes slide-down {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
```
**Commit:** `style: add Terminal slide animations`

### Story 7.2: Apply Animations to Pill/Drawer Transitions
**File:** `components/Terminal.tsx`
**Task:** Apply animation classes during state transitions
**Commit:** `ux: animate pill/drawer transitions`

### Story 7.3: Mobile Responsiveness
**File:** `components/Terminal/TerminalPill.tsx`, `TerminalControls.tsx`
**Task:** Ensure proper display on mobile breakpoints
**Commit:** `fix: Terminal mobile responsiveness`

---

## Commit Sequence

```
1. feat(types): add isMinimized to TerminalState
2. feat(flags): add terminal UX feature flags
3. feat(terminal): add TerminalPill component
4. chore(terminal): export TerminalPill
5. feat(terminal): add TerminalHeader component
6. chore(terminal): export TerminalHeader
7. refactor(terminal): use TerminalHeader component
8. feat(terminal): add minimize state management
9. feat(terminal): render pill when minimized
10. feat(terminal): wire minimize button
11. telemetry: add minimize/expand tracking
12. feat(terminal): add TerminalControls component
13. chore(terminal): export TerminalControls
14. feat(terminal): render controls below input
15. refactor(terminal): gate JourneyNav with feature flag
16. feat(terminal): add SuggestionChip component
17. chore(terminal): export SuggestionChip
18. refactor(terminal): use SuggestionChip in MarkdownRenderer
19. telemetry: track suggestion chip clicks
20. style: add Terminal slide animations
21. ux: animate pill/drawer transitions
22. fix: Terminal mobile responsiveness
23. docs: update DEVLOG with sprint completion
```

---

## Build Gates
- After Epic 1: `npm run build` ✓ (types + flags)
- After Epic 2: `npm run build` ✓ (pill component)
- After Epic 3: `npm run build` ✓ (header component)
- After Epic 4: `npm run build` ✓ (minimize works)
- After Epic 5: `npm run build` ✓ (controls relocated)
- After Epic 6: `npm run build` ✓ (suggestion chips)
- After Epic 7: `npm run build` ✓ (polish complete)

---

## Smoke Test Checklist

### Minimize Flow
- [ ] FAB opens Terminal
- [ ] `[–]` minimizes to pill
- [ ] Pill shows "Your Grove"
- [ ] Pill shows "thinking..." during loading
- [ ] Clicking pill expands Terminal
- [ ] Messages preserved through minimize/expand
- [ ] FAB hidden when Terminal open or minimized

### Header
- [ ] Header shows "Your Grove" centered
- [ ] Scholar badge appears when Scholar Mode active
- [ ] Menu button visible (non-functional OK)
- [ ] Minimize button works

### Controls Below Input
- [ ] Lens badge appears below input
- [ ] Clicking lens badge opens LensPicker
- [ ] Journey progress shows when in journey
- [ ] Streak shows when streak > 0
- [ ] JourneyNav hidden when flag enabled

### Suggestion Chips
- [ ] Prompts render as buttons
- [ ] Hover shows green border
- [ ] Click sends message
- [ ] Multiple suggestions stack vertically

### Mobile
- [ ] Pill full width on mobile
- [ ] Drawer full height on mobile
- [ ] Controls don't overflow
- [ ] Touch targets adequate (44px min)
