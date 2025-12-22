# Grove Foundation Refactor: Design Sprint Kickoff Prompt

**Use this prompt to start a new Claude thread for the design sprint.**

---

## Copy This Prompt

```
I'm kicking off a design sprint for the Grove Foundation Refactor. Here's the context:

## Project Summary

Grove is a distributed AI infrastructure project. The current implementation has:
- A Terminal interface for exploring knowledge journeys
- A Foundation Console for backend configuration
- A nascent Sprout System for knowledge capture and crystallization

## The Refactor Vision

We're unifying these into a single **Grove Widget** — a chat-first, mode-fluid interface where:
- **Explore mode** = Current Terminal (journey-based knowledge discovery)
- **Garden mode** = Sprout System user view (see your planted sprouts grow)
- **Chat mode** = Coming Soon placeholder (future daily AI assistant)

The widget uses **slash commands** (`/explore`, `/garden`, `/plant`, `/stats`) as the power-user interaction model.

## Key Documents

The sprint docs are in: `docs/sprints/foundation-ux-unification-v1/`
- **VISION.md** — Complete architectural vision
- Other Foundation Loop artifacts to be generated

Reference implementation: `C:\GitHub\symbol-garden-2` (Symbol Garden pattern)

## Design Sprint Goals

**Week 1: Grove Widget Shell**
- Create unified container with mode switching
- Command palette on `/` keystroke
- Ambient status bar (session timer, sprout count, mode indicator)
- Footer mode toggle

**Week 2: Garden Mode**
- Sprout cards grouped by growth stage
- Integration with `/plant` command from Explore
- Knowledge Commons preview

**Week 3: Explore Mode Refinement**
- Integrate current Terminal into widget shell
- "🌱 Plant this" inline selection action
- Journey progress indicator

**Week 4: Foundation Console Pattern**
- Component grammar for backstage modules
- Narrative Architect refactored as canonical example

## Working Branch

I'll be working on a `feature/foundation-refactor` branch since the current Terminal is nearly working and I don't want to break it.

## What I Need From You

1. **Repository Audit** — Analyze the current codebase structure
2. **Component Inventory** — List what exists vs. what we need to build
3. **Sprint Plan** — Break down Week 1 deliverables into specific tasks
4. **Start Building** — Create the GroveWidget shell component

The codebase is at: C:\GitHub\the-grove-foundation

Let's begin with the repository audit and produce the Foundation Loop artifacts.
```

---

## Context Files to Reference

When starting the sprint, load these into context:

### Primary Spec
- `docs/sprints/foundation-ux-unification-v1/VISION.md`

### Existing Architecture
- `docs/ARCHITECTURE.md`
- `docs/specs/` (various specs)
- `SKILL.md` (Grove Foundation Loop methodology)

### Pattern Reference
- Symbol Garden 2.0: `C:\GitHub\symbol-garden-2`

---

## Foundation Loop Artifacts to Generate

Follow the Grove Foundation Loop methodology to produce:

| Artifact | Purpose | Status |
|----------|---------|--------|
| `VISION.md` | Architectural vision | ✅ Complete |
| `REPO_AUDIT.md` | Current state analysis | ⏳ Pending |
| `SPEC.md` | Goals, non-goals, acceptance criteria | ⏳ Pending |
| `ARCHITECTURE.md` | Target state, schemas, data flows | ⏳ Pending |
| `MIGRATION_MAP.md` | File-by-file change plan | ⏳ Pending |
| `DECISIONS.md` | ADRs explaining "why" | ⏳ Pending |
| `SPRINTS.md` | Epic/story breakdown | ⏳ Pending |
| `EXECUTION_PROMPT.md` | Self-contained handoff | ⏳ Pending |
| `DEVLOG.md` | Execution tracking | ⏳ Pending |

---

## Key Decisions Already Made

These decisions are locked in from the vision session:

1. **Single Widget, Multiple Modes** — Not separate pages/apps
2. **Slash Commands** — The primary power-user interaction model
3. **Garden Embedded in Terminal** — Not a separate route
4. **Chat Mode Placeholder** — Communicate vision, don't fake the feature
5. **Component Grammar from Symbol Garden** — UIContext pattern, inspector pattern

---

## Visual References

### Widget Layout
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🌳 The Grove                              47m │ 🌱 3 │ ◐ Exploring     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                         [Content Area]                                  │
│                                                                         │
│                    Adapts based on mode                                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  / Type a message or command...                              ⌘K        │
├─────────────────────────────────────────────────────────────────────────┤
│   Explore ──●── Garden ──○── Chat (Soon)              ⚙ │ ? │ ···     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Color Palette
```css
--grove-bg: #0a0f14;
--grove-surface: #121a22;
--grove-border: #1e2a36;
--grove-accent: #00d4aa;
--grove-text: #e2e8f0;
--grove-text-muted: #94a3b8;
```

---

## Success Criteria for Week 1

By end of Week 1, we should have:

- [ ] `GroveWidget.tsx` container component
- [ ] `WidgetUIContext.tsx` for mode/inspector state
- [ ] `WidgetHeader.tsx` with session timer, sprout count, mode indicator
- [ ] `CommandInput.tsx` with `/` trigger for palette
- [ ] `CommandPalette.tsx` with command matching
- [ ] `ModeToggle.tsx` for Explore/Garden/Chat switching
- [ ] Mode switching works (even if content areas are stubs)
- [ ] Current Terminal still works on main branch

---

## Notes for the Sprint

1. **Branch Strategy:** Work on `feature/foundation-refactor` to avoid breaking current Terminal
2. **Incremental Progress:** Get shell working before filling in content areas
3. **Test Mode Switching:** This is the critical UX flow to nail
4. **Preserve Terminal:** The current explore experience should still work
5. **Design System:** Use existing Tailwind classes + CSS variables for consistency

---

*This prompt captures the vision while we have momentum. Use it to continue the work in a focused design sprint.*
