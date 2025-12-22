# Sprint 6: Chat Styling + Foundation Console Migration

**Copy and paste this entire message into a new Claude Code session.**

---

## Context

You are continuing work on The Grove Foundation, a distributed AI exploration platform. This sprint focuses on:
1. Fixing critical chat UX issues (readability, contrast, styling)
2. Migrating Foundation Console to unified design system
3. Implementing the Sprout Queue moderation workflow

## Foundation Loop Required

**This sprint requires the full Foundation Loop:**

```
Phase 0.1: REPO_AUDIT.md      — Current state of chat components, styling, Foundation console
Phase 0.2: SPEC.md            — Requirements for chat fixes + console migration  
Phase 0.3: ARCHITECTURE.md    — Component structure, shared patterns, color system updates
Phase 0.4: STORIES.md         — Prioritized implementation tasks
Phase 0.5: Execute            — Build it
```

## Sprint Goals

### Priority 1: Chat UX Fixes (Critical)
- **Readability:** Cap message width at ~768px for comfortable reading
- **Contrast:** Fix zero-contrast user messages in dark mode
- **Styling:** Proper message bubbles, input area, metadata display

### Priority 2: Foundation Console Unification
- Apply three-column workspace pattern to `/foundation/*`
- Migrate from holo-* to unified color tokens
- Implement Sprout Queue moderation workflow

## Reference Materials

### Design Mockups
Design mockups showing the target chat styling are in:
```
docs/sprints/sprint-6-chat-styling/mockups/
├── mockup_4_dark.html   — Dark mode chat (working HTML)
├── mockup_4_dark.png    — Dark mode screenshot
├── mockup_3_light.html  — Light mode chat (working HTML)
├── mockup_3_light.png   — Light mode screenshot
```

**Important:** Read the HTML files to extract exact Tailwind classes. The mockups are fully working — open them in a browser to see the target styling.

### Key Design Decisions from Mockups

**Color System:**
```typescript
colors: {
  "primary": "#197fe6",           // Vibrant blue
  "background-dark": "#111921",   // Deep slate
  "surface-dark": "#1E293B",      // Elevated surfaces
  "border-dark": "#293038",       // Subtle borders
}
```

**Message Bubbles:**
- User: `bg-primary text-white rounded-2xl rounded-tr-sm`
- AI: `bg-surface-dark text-slate-100 border border-border-dark rounded-2xl rounded-tl-sm`

**Chat Container:**
- Max width: `max-w-3xl` (~768px)
- Centered: `mx-auto`
- Responsive: Full width on mobile

### Previous Sprint Context

Sprint 5 delivered:
- `src/shared/` — Layout, forms, controls, feedback components
- `src/foundation/FoundationWorkspace.tsx` — Three-column shell
- `src/foundation/FoundationNav.tsx` — Navigation tree
- `src/foundation/FoundationInspector.tsx` — Inspector panel

### Repository Location
```
C:\GitHub\the-grove-foundation
```

### Existing Documentation
```
C:\GitHub\the-grove-foundation\docs\sprints\foundation-ux-unification-v1\
├── SPRINT_5_KICKOFF.md          — Previous sprint (Foundation workspace)
├── SPRINT_6_KICKOFF.md          — Draft spec (use as reference for Phase 0.2)
├── PATTERN_VERSIONED_ARTIFACT.md — Provenance schema
```

## Your First Task

**Run the Foundation Loop starting with Phase 0.1: REPO_AUDIT**

Audit:
1. Current chat implementation (`src/explore/` or wherever chat lives)
2. Current styling/color tokens (`tailwind.config.ts`, CSS files)
3. Foundation Console current state (`src/foundation/`)
4. Message components and their current issues

Output: `REPO_AUDIT.md` in `docs/sprints/sprint-6-chat-styling/`

Then proceed through SPEC → ARCHITECTURE → STORIES → Execute.

---

## Success Criteria

By end of sprint:
- [ ] Chat messages readable on wide screens (768px max)
- [ ] User messages have high contrast (white on blue)
- [ ] AI messages readable in dark mode
- [ ] Input area properly styled with focus states
- [ ] Foundation Console uses unified color tokens
- [ ] Sprout Queue route exists with moderation UI
- [ ] Both light and dark modes work correctly

Begin with the repo audit.
