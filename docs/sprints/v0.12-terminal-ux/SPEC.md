# Terminal UX Modernization — Specification v0.12

## Overview
Transform the Terminal from a "feature-rich chat interface" into "Your Grove" — warm, responsive, intelligent, always available but never intrusive. Apple design ethos: organic yet modern.

## The Vision
> "This is what AI feels like when it's yours."

---

## Goals

1. **Minimize Capability** — Users can collapse Terminal to a pill at viewport bottom without losing state
2. **Simplified Header** — Replace cluttered header with clean "Your Grove" identity
3. **Controls Below Input** — Move lens/journey controls below the query input for discoverability
4. **Clickable Suggestions** — AI response prompts render as tappable buttons, not just styled text
5. **Rename to "Your Grove"** — Rebrand from "The Terminal" to match product positioning
6. **Smooth Animations** — Spring-based transitions for open/close/minimize states
7. **Progressive Disclosure** — Show features when relevant, not all at once

---

## Non-Goals

- No changes to LensPicker internal UI (separate sprint)
- No changes to CustomLensWizard (separate sprint)
- No backend changes
- No changes to reveal system (SimulationReveal, etc.)
- No new personas or journeys
- No changes to Classic landing page
- No changes to Genesis landing page

---

## Current State

### Header (`Terminal.tsx:889-901`)
- **Title:** "The Terminal 🌱"
- **Badge:** Scholar Mode (conditional)
- **Right:** "CTX: {SECTION_NAME}"
- **Issues:** Three elements competing; CTX unclear to users

### Controls Location
- **JourneyNav:** Top of Terminal (lens, progress, streak) — `Terminal.tsx:904-924`
- **Scholar Mode:** Below messages, above input — `Terminal.tsx:1128-1144`
- **Input:** Bottom — `Terminal.tsx:1146-1165`
- **Issues:** Important controls hidden at top; scroll needed to find them

### State Management
- **Open/Closed:** `terminalState.isOpen` boolean
- **No minimize state** — binary open/closed only
- **Session preserved:** Messages survive close/reopen

### Drawer Behavior (`Terminal.tsx:864-872`)
- Slides from right
- 480px desktop, full mobile
- 500ms ease-in-out transition

---

## Target State

### New Component Structure
```
Terminal.tsx (simplified orchestrator)
├── TerminalPill.tsx (NEW)      — Minimized state at viewport bottom
├── TerminalDrawer.tsx          — Extracted drawer container
├── TerminalHeader.tsx (NEW)    — Clean "Your Grove" header
├── TerminalMessages.tsx        — Message list with clickable prompts
├── TerminalControls.tsx (NEW)  — Controls bar below input
└── TerminalInput.tsx           — Input with send button
```

### Header
```
┌──────────────────────────────────────────────────────────┐
│  [≡]                Your Grove                     [–]   │
└──────────────────────────────────────────────────────────┘
```
- Left: Menu button (future: settings, reset)
- Center: "Your Grove"
- Right: Minimize button

### Minimized State (Pill)
```
┌─────────────────────────────────────────────────────────────────┐
│  🌱 Your Grove                                           [↑]   │
└─────────────────────────────────────────────────────────────────┘
```
- Fixed to viewport bottom
- Shows thinking status during loading
- Click to expand

### Controls Below Input
```
┌──────────────────────────────────────────────────────────┐
│  [ Ask your Grove...                              ] [→]  │
│                                                          │
│  🎭 Concerned Citizen  ·  📍 Step 3/7  ·  🔥 5 days     │
└──────────────────────────────────────────────────────────┘
```
- Lens badge (clickable to switch)
- Journey progress
- Streak display

### Clickable Suggestions
AI responses with `→ prompt` render as:
```tsx
<button className="suggestion-chip">
  Explore the economics →
</button>
```
- Full-width subtle button
- Hover: lift + grove-green border
- Click: sends as user message

---

## Acceptance Criteria

### Minimize (P0)
- [ ] AC-1: Clicking `[–]` collapses Terminal to pill at viewport bottom
- [ ] AC-2: Clicking pill expands Terminal to full drawer
- [ ] AC-3: Message history preserved during minimize/expand
- [ ] AC-4: Pill shows "thinking..." when AI is responding
- [ ] AC-5: Smooth animation (300-400ms spring) for transitions

### Header (P0)
- [ ] AC-6: Header displays "Your Grove" centered
- [ ] AC-7: Menu button `[≡]` on left (non-functional for v0.12)
- [ ] AC-8: Minimize button `[–]` on right
- [ ] AC-9: Scholar Mode badge appears when active (below title or inline)

### Controls Relocation (P1)
- [ ] AC-10: Lens badge appears below input
- [ ] AC-11: Clicking lens badge opens LensPicker
- [ ] AC-12: Journey progress appears below input when journey active
- [ ] AC-13: Streak display appears below input when streak > 0
- [ ] AC-14: JourneyNav component removed from top position

### Clickable Suggestions (P1)
- [ ] AC-15: Prompts starting with `→` render as buttons
- [ ] AC-16: Clicking suggestion sends it as user message
- [ ] AC-17: Telemetry tracks suggestion clicks

### Quality
- [ ] AC-18: Build passes without errors
- [ ] AC-19: No console errors in browser
- [ ] AC-20: Mobile responsive (full width pill, full height drawer)
- [ ] AC-21: Animations smooth (60fps target)

---

## Feature Flags

| Flag ID | Name | Default | Description |
|---------|------|---------|-------------|
| `terminal-minimize` | Terminal Minimize | `true` | Enable minimize to pill |
| `terminal-controls-below` | Controls Below Input | `true` | Move lens/journey below input |

---

## Dependencies

- Genesis landing page complete (v0.11) ✓
- No backend changes required
- No new npm dependencies

---

## Risks

### Risk 1: State Management Complexity
**Description:** Adding minimize state complicates TerminalState
**Mitigation:** Add `isMinimized: boolean` to existing state; preserve all other state during minimize

### Risk 2: Animation Performance
**Description:** Spring animations may jank on low-end devices
**Mitigation:** Use CSS transforms (GPU-accelerated); test on mobile

### Risk 3: Breaking Existing Flows
**Description:** Moving JourneyNav may break journey progression UX
**Mitigation:** Preserve all functionality, just relocate; thorough smoke testing

---

## Success Metrics

- Qualitative: Terminal feels "Apple-like" — responsive, warm, modern
- Quantitative: Track `terminal_minimized` and `terminal_expanded` events
- Usability: Users discover lens switching without prompting
