# Development Log — v0.12e Minimalist Orchard

## Sprint Status: PLANNED

## Objective
Evolve Surface design system to "Minimalist Orchard" aesthetic. Make Genesis the default landing experience. **Critically: Architect Genesis components for dynamic content injection, enabling the "Chameleon" adaptive surface in v0.13.**

## Strategic Context
> "The Medium is the Message"

This sprint is not aesthetic polish — it's **infrastructure for the Chameleon**.

- Sci-Fi UI = cockpit = rigid, can't be rewritten
- Paper UI = manuscript = made to be rewritten

The warm bone background and serif typography create a "living document" aesthetic where content morphing feels natural.

---

## Pre-Sprint Checklist
- [x] REPO_AUDIT.md — Current state documented
- [x] SPEC.md — Goals, strategic context, acceptance criteria
- [x] DECISIONS.md — 7 ADRs including Chameleon prep
- [x] SPRINTS.md — Stories with exact line numbers
- [x] TARGET_CONTENT.md — Exact CSS/config values
- [x] EXECUTION_PROMPT.md — 6-phase instructions
- [ ] Baseline build passes

---

## Execution Log

### Phase 1: Typography Update
**Status:** Not started

| Story | Status | Notes |
|-------|--------|-------|
| 1.1 Font imports | ⬜ | |
| 1.2 CSS font families | ⬜ | |
| 1.3 Tailwind font config | ⬜ | |

**Build gate:** ⬜

---

### Phase 2: Color Update
**Status:** Not started

| Story | Status | Notes |
|-------|--------|-------|
| 2.1 CSS color tokens | ⬜ | |
| 2.2 Tailwind color config | ⬜ | |

**Build gate:** ⬜

---

### Phase 3: Typography Features
**Status:** Not started

| Story | Status | Notes |
|-------|--------|-------|
| 3.1 Smart typography CSS | ⬜ | |

**Build gate:** ⬜

---

### Phase 4: Genesis Default
**Status:** Not started

| Story | Status | Notes |
|-------|--------|-------|
| 4.1 SurfaceRouter default | ⬜ | |
| 4.2 Flag in schema | ⬜ | |
| 4.3 Flag in JSON | ⬜ | |

**Build gate:** ⬜

---

### Phase 5: Chameleon Prep
**Status:** Not started

| Story | Status | Notes |
|-------|--------|-------|
| 5.1 HeroHook content prop | ⬜ | |
| 5.2 ProblemStatement quotes prop | ⬜ | |
| 5.3 Export interfaces | ⬜ | |

**Build gate:** ⬜

---

### Phase 6: Verification
**Status:** Not started

| Test | Status | Notes |
|------|--------|-------|
| Genesis loads at `/` | ⬜ | |
| Classic at `?experience=classic` | ⬜ | |
| Terminal typography | ⬜ | |
| Foundation unchanged | ⬜ | |
| Console errors | ⬜ | |
| Component props work | ⬜ | |

---

## Issues Encountered

*None yet*

---

## Files Modified

| File | Change Type | Commit |
|------|-------------|--------|
| | | |

---

## Post-Sprint

### Acceptance Criteria Status
- [ ] AC-1: Tenor Sans loads
- [ ] AC-2: EB Garamond loads
- [ ] AC-3: Font fallbacks work
- [ ] AC-4: JetBrains Mono unchanged
- [ ] AC-5: Background is warm bone
- [ ] AC-6: Text is forest charcoal
- [ ] AC-7: Accent is hunter green
- [ ] AC-8: Foundation unchanged
- [ ] AC-9: Line height 1.65
- [ ] AC-10: Smart quotes render
- [ ] AC-11: optimizeLegibility set
- [ ] AC-12: `/` loads Genesis
- [ ] AC-13: `?experience=classic` loads Classic
- [ ] AC-14: Flag shows true
- [ ] AC-15: HeroHook accepts content prop
- [ ] AC-16: ProblemStatement accepts quotes prop
- [ ] AC-17: Default content renders
- [ ] AC-18: Build passes
- [ ] AC-19: No console errors
- [ ] AC-20: Terminal functional

---

## Next Sprint: v0.13 "The Chameleon"

With the Paper Canvas established, v0.13 implements:

1. **Lens Content Map** — JSON mapping ArchetypeId to content variations
2. **Reactive Surface** — GenesisPage listens to `useNarrativeEngine().activeLens`
3. **Morphing Effect** — Un-type/re-type animation when lens changes

The manuscript aesthetic makes this feel natural — like editing a living document.

### Content Variations Preview
```typescript
// Example: Engineer lens
{ headline: "THE ARCHITECTURE.", subtext: ["Latency is the mind killer.", "Control yours."] }

// Example: Academic lens  
{ headline: "THE RESEARCH.", subtext: ["Beyond the walled gardens.", "Open inquiry."] }

// Example: Skeptic lens
{ headline: "THE QUESTION.", subtext: ["Who owns your intelligence?", "You should."] }
```
