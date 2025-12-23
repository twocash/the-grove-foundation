# Active Grove Sprint - Execution Prompt

## Context

You are implementing the "Active Grove" sprint for Grove Foundation. This transforms the landing page from a static vertical scroll into a reactive split-screen experience where:

1. User clicks the Tree → page splits (content left, Terminal right)
2. User selects a lens in Terminal → headline morphs via WaveformCollapse
3. Navigation unlocks → user can scroll or continue in Terminal

## Prerequisite Complete

The `terminal-architecture-refactor-v1` sprint is merged. You now have:
- `TerminalShell.tsx` - Chrome wrapper with `TerminalShellHandle` for programmatic control
- `TerminalChat.tsx` - Message rendering component
- `TerminalFlow.tsx` - Flow states (interstitials, lens picker)
- `useTerminalState.ts` - Consolidated state management
- Lens-aware welcome via `getTerminalWelcome(lensId)`

## Your Task

Implement the sprint according to `docs/sprints/active-grove-v1/SPRINT_PLAN.md`.

Follow the **Migration Map phases in order**:
1. **Foundation** (Day 1): Layout states, fluid typography, content rail
2. **Integration** (Day 2): Terminal callbacks, flow state wiring
3. **Locking** (Day 3): ActiveTree states, navigation gating
4. **Polish** (Day 4): Animations, quote carousel
5. **Responsive** (Day 5): Mobile sheet, tablet layout, a11y

## Key Files to Modify

```
src/surface/pages/GenesisPage.tsx          # State machine, layout composition
src/surface/components/genesis/
├── ScrollIndicator.tsx → ActiveTree.tsx   # Rename, add mode prop
├── HeroHook.tsx                           # Container queries, onComplete callback
├── ProblemStatement.tsx                   # Add variant prop, carousel mode
└── WaveformCollapse.tsx                   # Ensure onComplete fires

components/Terminal/Terminal.tsx           # Add onLensSelected, variant props
styles/globals.css                         # Split animation, fluid typography
```

## State Machine

```typescript
type UIMode = 'hero' | 'split';

type FlowState = 
  | 'hero'           // Initial - Tree pulsing
  | 'split'          // Terminal visible, waiting for lens
  | 'selecting'      // LensPicker active
  | 'collapsing'     // WaveformCollapse animating
  | 'unlocked';      // Navigation enabled
```

## Build Gates

After each epic:
```bash
npm run build     # Must pass
npm run test      # Must pass  
npm run dev       # Manual test at localhost:3000
```

## Success Criteria

| ID | Criterion | How to Verify |
|----|-----------|---------------|
| AC1 | Tree click triggers split layout | Click tree, see page split |
| AC2 | Split animation 60fps | Chrome DevTools → Performance |
| AC3 | Lens selection morphs headline | Select lens, watch headline rewrite |
| AC4 | Navigation locked until unlocked | Try scrolling before lens selection |
| AC5 | Quotes carousel at 720px | Resize to 720px width |
| AC6 | Mobile shows sheet | Test at <768px |
| AC7 | Tablet shows 60/40 | Test at 768-1024px |
| AC8 | Desktop shows 50/50 | Test at >1024px |

## CSS Patterns to Use

### Clip-Path Split (not width transition)
```css
.content-rail {
  clip-path: inset(0 0 0 0);
  transition: clip-path 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.content-rail.split {
  clip-path: inset(0 50% 0 0);
}
```

### Container Query Typography
```css
.hero-container { container-type: inline-size; }

@container (max-width: 800px) {
  .hero-headline { font-size: clamp(2rem, 8cqw, 4rem); }
}
```

## Do NOT

- Modify lens definitions or content
- Change Terminal chat functionality  
- Add new landing page sections
- Break existing `/terminal` route
- Use width-based flex transitions (causes text reflow)

## Commit Strategy

One commit per epic:
```
feat(genesis): Epic 1 - layout state machine
feat(genesis): Epic 2 - ActiveTree component
feat(genesis): Epic 3 - event integration
feat(genesis): Epic 4 - quote carousel
feat(genesis): Epic 5 - responsive breakpoints
test(genesis): Epic 6 - E2E tests
```

## Reference

Full sprint documentation: `docs/sprints/active-grove-v1/SPRINT_PLAN.md`
