# Repository Audit: Active Grove Polish v2

## Sprint Context
Follow-up sprint to Active Grove v1, addressing bugs and UX polish discovered during production testing.

## Current State Analysis

### State Machine (GenesisPage.tsx)
```
flowState: 'hero' → 'split' → 'collapsing' → 'unlocked'
uiMode: 'hero' | 'split'
```

**Critical Issue Found:** The useEffect watching `activeLens` fires when lens EXISTS, not just when it CHANGES:
```tsx
useEffect(() => {
  if (activeLens && flowState === 'split') {
    setFlowState('collapsing');
  }
}, [activeLens, flowState]);
```

On return visits with persisted lens, this triggers 'collapsing' but WaveformCollapse never animates (no trigger change), so `onComplete` never fires → stuck forever.

### Key Files & Current State

| File | Purpose | Issues |
|------|---------|--------|
| `src/surface/pages/GenesisPage.tsx` | State machine, layout | Reload bug in lens detection |
| `src/surface/components/genesis/ProblemStatement.tsx` | Quote carousel | Cards advance too fast (~3s) |
| `src/surface/components/genesis/AhaDemo.tsx` | Diary entry section | Text overflow, outdated copy, redundant CTA |
| `src/surface/components/genesis/Foundation.tsx` | Why This Works | Layout order wrong, styling issues |
| `styles/globals.css` | Active Grove CSS | Missing split-mode scaling for diary |

### ProblemStatement.tsx Analysis
- Carousel auto-advance interval: Likely 3000-4000ms
- Missing section headline above quote cards
- Carousel logic working correctly otherwise (Fix #9 resolved horizontal scroll)

### AhaDemo.tsx Analysis
- Two CTAs: "Go Deeper" + "Keep Exploring"
- "Keep Exploring" is redundant (sapling does this)
- Diary text uses fixed sizing, doesn't scale in split mode
- Current copy references generic research, needs specific Wang et al. citation

### Foundation.tsx Analysis
- Current layout: headline → body → buttons → "want to go deeper" text → sapling
- Desired layout: headline → body → "want to go deeper" → buttons → sapling
- Pink strikethrough styling on CTA text is jarring

### Session Persistence (NarrativeEngine)
- `activeLens` persists across page reloads via localStorage/session
- This is correct behavior for UX continuity
- But GenesisPage state machine doesn't account for "lens already set" case

## Technical Debt Identified

1. **State machine edge case** - No handling for return visits with existing lens
2. **Magic numbers** - Carousel interval hardcoded without constant
3. **Inconsistent CTA patterns** - Some sections have redundant navigation
4. **CSS scaling gaps** - Not all sections have split-mode typography rules

## Dependencies

- WaveformCollapse.tsx - `onComplete` callback (working correctly)
- useQuantumInterface.ts - `activeLens` value (working correctly)
- useNarrativeEngine.ts - Session persistence (working correctly)
- externalQuery pattern - For Terminal integration (existing, proven)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Reload fix breaks fresh visits | Medium | High | Test both flows explicitly |
| CSS changes affect other sections | Low | Medium | Scope selectors carefully |
| Copy changes need review | Low | Low | Copy provided in spec |
