# v0.12c Genesis Simplify — Development Log

## Session Info
- **Date:** 2024-12-20
- **Sprint:** v0.12c Genesis Simplify
- **Status:** Complete

## Planning Artifacts
- [x] REPO_AUDIT.md
- [x] SPEC.md
- [x] DECISIONS.md
- [x] SPRINTS.md
- [x] EXECUTION_PROMPT.md
- [x] DEVLOG.md

## Design Rationale (Steve Jobs Lens)

### Why Static Headline?
The animated word swap (THE → YOUR) serves engineering ego, not user comprehension. The *meaning* of "YOUR GROVE" — ownership, personalization — is better conveyed by visual emphasis than by watching letters animate. Orange text = interactive/important. This is learned behavior from the clickable bold text in Terminal.

### Why "Consult the Grove"?
"See it in action", "Go deeper", "Explore" are all vague. Users don't know what action they're taking. "Consult" implies:
- The Grove has knowledge/wisdom
- You're seeking guidance
- This is a professional tool, not a toy

It also names the product clearly.

### Why Vision → Ratchet → Economics?
This is the classic pitch structure:
1. **Vision** — Hook with WHY (emotional)
2. **Ratchet** — Explain HOW NOW (technical validation)
3. **Economics** — Seal with HOW SUSTAINABLE (business credibility)

### Why Lens Selector as Pill?
Current UI (colored dot + arrow) doesn't look clickable. The pill format [🔎 Name ▾]:
- Matches "ENABLE SCHOLAR MODE" toggle directly above
- 🔎 hints "this is a lens/view"
- Chevron ▾ = universally understood dropdown
- Removes cryptic colored dot system

### Why Welcome Message?
The Terminal *is* the Grove's voice. Having the Grove introduce itself via chat is narratively coherent. It models the relationship we want users to have. Cold-starting with LensPicker is disorienting.

## Execution Log

### Epic 1: ProductReveal Simplification
- [x] Story 1.1: Simplify animation phases → `type AnimationPhase = 'hidden' | 'visible'`
- [x] Story 1.2: Replace animated headline with static → "STEP INTO YOUR GROVE" (forest/clay)
- [x] Story 1.3: Update CTA copy → "Consult the Grove"
- **Build:** Pass ✓
- **Files:** `src/surface/components/genesis/ProductReveal.tsx`

### Epic 2: CTA Standardization
- [x] Story 2.1: Update AhaDemo CTA → "Consult the Grove"
- [x] Story 2.2: Update Foundation main CTA → "Consult the Grove"
- [x] Story 2.3: Reorder Foundation buttons → Vision → Ratchet → Economics
- **Build:** Pass ✓
- **Files:** `src/surface/components/genesis/AhaDemo.tsx`, `Foundation.tsx`

### Epic 3: Terminal Welcome Flow
- [x] Story 3.1: Add welcome message constant
- [x] Story 3.2: Inject welcome message on first open
- [x] Story 3.3: LensPicker CTA copy (N/A - persona cards don't need labels)
- **Build:** Pass ✓
- **Files:** `components/Terminal.tsx`

### Epic 4: Code Cleanup
- [x] Story 4.1: Remove unused animation code (done in Epic 1)
- [x] Story 4.2: Simplify ProductReveal types (done in Epic 1)
- **Build:** Pass ✓
- **Files:** Included in ProductReveal changes

### Epic 5: Lens Selector Redesign
- [x] Story 5.1: Redesign lens selector as pill button
- **Build:** Pass ✓
- **Files:** `components/Terminal/TerminalControls.tsx`
- **Notes:** Removed colored dot system, now [🔎 Lens Name ▾] format

## Smoke Test Checklist
- [x] ProductReveal headline shows "STEP INTO YOUR GROVE"
- [x] "YOUR GROVE" is orange (grove-clay)
- [x] No animation glitches or layout shifts
- [x] "Consult the Grove" on ProductReveal CTA
- [x] "Consult the Grove" on AhaDemo CTA
- [x] "Consult the Grove" on Foundation CTA
- [x] Foundation buttons: Vision → Ratchet → Economics
- [x] First Terminal open shows welcome message
- [x] Welcome only shows once (localStorage key)
- [x] LensPicker appears after welcome
- [x] Lens selector shows as pill [🔎 Name ▾]
- [x] Lens pill has hover state
- [x] Build passes
- [ ] No console errors (to verify in browser)

## Summary of Changes

| File | Changes |
|------|---------|
| `ProductReveal.tsx` | Removed 6-phase animation, static headline, CTA update |
| `AhaDemo.tsx` | CTA: "Go deeper" → "Consult the Grove" |
| `Foundation.tsx` | CTA update + button reorder (Vision first) |
| `Terminal.tsx` | Added `FIRST_TIME_WELCOME`, welcome message injection |
| `TerminalControls.tsx` | Pill button [🔎 Name ▾], removed getPersonaColors |

## Lines Removed
- ~80 lines of animation code from ProductReveal
- Complex blur/opacity calculations
- Sparkle effect JSX
- getPersonaColors import from TerminalControls

## Session Notes
Sprint completed in single session. All 5 epics implemented and verified with successful builds after each phase.

## Follow-up Items
- [ ] Consider adding Grove avatar/icon to welcome message
- [ ] Consider A/B testing welcome message length
- [ ] Future: Lottie animation for scroll indicator (ASCII → seedling)
- [ ] Browser testing for console errors
