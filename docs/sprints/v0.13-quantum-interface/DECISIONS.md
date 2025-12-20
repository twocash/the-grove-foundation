# Architecture Decisions — v0.13 Quantum Interface

## ADR-001: Content Storage Location

### Context
Lens-specific content (headlines, quotes, tension text) needs a home. Options:
1. Store in `narratives.json` / schema (admin-editable)
2. Store in dedicated TypeScript file (code-managed)
3. Store inline in components (hardcoded)

### Decision
**Store in `src/data/quantum-content.ts`** — a dedicated TypeScript file.

### Rationale
- Content is **stable** — not expected to change frequently
- Content is **type-safe** — interfaces ensure structure
- Content is **version-controlled** — Git history for changes
- Admin editing is **not needed** for MVP — this is developer-managed copy
- Keeps `narratives.json` focused on journey/node navigation

### Consequences
- Content changes require code deploy
- Type safety catches content shape errors at build time
- Future: Could migrate to schema if admin editing needed

---

## ADR-002: Hook Location and Name

### Context
The hook that maps lens → reality could live in:
1. `hooks/` (root hooks folder)
2. `src/surface/hooks/` (surface-specific)
3. `src/core/hooks/` (core module)

### Decision
**Place in `src/surface/hooks/useQuantumInterface.ts`**

### Rationale
- Hook is **surface-specific** — only Genesis uses it
- Follows pattern of `useScrollAnimation.ts` already in that folder
- "Quantum Interface" name matches sprint naming and metaphor
- Keeps core module focused on engine/schema concerns

### Consequences
- Import path: `../hooks/useQuantumInterface` from GenesisPage
- If Foundation page needs similar feature, may need to lift up

---

## ADR-003: Animation Strategy

### Context
When lens changes, content morphs. Options for animation:
1. **Hard swap** — instant change (jarring)
2. **Fade transition** — opacity crossfade (generic)
3. **Typewriter** — un-type/re-type (thematic)
4. **Scramble** — letter randomization before resolving (Matrix-style)

### Decision
**Typewriter animation** — un-type → pause → re-type

### Rationale
- Reinforces "manuscript" aesthetic from v0.12e
- Creates sense of "the page being rewritten"
- Blinking cursor = "machine thought" metaphor
- More memorable than fade, less chaotic than scramble

### Consequences
- Need WaveformCollapse component
- Animation timing needs tuning (backspace speed, pause duration, typing speed)
- Components need `trigger` prop to restart animation

---

## ADR-004: Trigger Prop Pattern

### Context
Genesis components need to know when to restart animations. Options:
1. Pass entire `reality` object and compare deep equality
2. Pass lens ID as trigger value
3. Pass dedicated `trigger` prop (any value change triggers)

### Decision
**Dedicated `trigger` prop** — components restart animation when trigger value changes.

### Rationale
- Clean separation: content is data, trigger is signal
- Avoids deep comparison overhead
- Pattern works with any future trigger source (not just lens)
- React's useEffect dependency is simple: `[trigger]`

### Consequences
- Components need `trigger?: any` prop
- Hook must return `quantumTrigger` (currently the lens ID)
- Animation restarts on any lens change, including to same lens

---

## ADR-005: Custom Lens Handling

### Context
Custom lenses have IDs like `custom-1703...`. They don't map to archetypes. Options:
1. Map to 'freestyle' reality (generic alternative content)
2. Fall back to DEFAULT_REALITY
3. Use archetype mapping from custom lens creation

### Decision
**Fall back to DEFAULT_REALITY** for custom lenses.

### Rationale
- Custom lenses are already personalized via tone/style
- Creating "freestyle" content is stretch goal, not MVP
- `archetypeMapping` in custom lens could be used later for smarter fallback
- Simplest path: unknown ID → default

### Consequences
- Custom lens users see default Genesis content (acceptable for MVP)
- Future: Could use `customLens.archetypeMapping` to select closest archetype reality

---

## ADR-006: Content Scope for MVP

### Context
Six archetypes exist. How many get custom realities in v0.13?

### Decision
**Three archetypes for MVP:** `engineer`, `academic`, `family-office`

### Rationale
- These three represent the most distinct audience segments
- Engineer = technical infrastructure angle
- Academic = knowledge/epistemics angle
- Family-office = investment/market angle
- Other three (`concerned-citizen`, `geopolitical`, `big-ai-exec`) can use default or be added in v0.14

### Consequences
- `geopolitical`, `concerned-citizen`, `big-ai-exec` fall back to DEFAULT_REALITY
- Content gap is acceptable — default content is still good
- v0.14 can complete the matrix

---

## ADR-007: ProblemStatement Tension Text

### Context
The tension text ("They're building the future... What if there was another way?") could:
1. Stay hardcoded (not part of LensReality)
2. Become part of LensReality as `tension: string[]`

### Decision
**Add `tension: string[]` to LensReality** — make it dynamic.

### Rationale
- Tension text is as important as the quotes for emotional hook
- Different audiences have different "enemy" framings
- Engineers: "They build moats around data centers."
- Academics: "The enclosure of the digital commons is accelerating."
- Keeps the full "problem" section cohesive

### Consequences
- ProblemStatement needs additional `tension` prop
- Content map grows slightly larger
- More powerful customization per lens

---

## ADR-008: Animation Component Isolation

### Context
The typewriter animation could be:
1. Inline in each Genesis component
2. A reusable component in `src/surface/components/effects/`
3. A utility hook

### Decision
**Reusable component in `effects/` folder**

### Rationale
- Animation logic is complex enough to warrant isolation
- Could be reused in future screens (ProductReveal, etc.)
- Follows component-based architecture
- Easier to test and tune in isolation

### Consequences
- New folder: `src/surface/components/effects/`
- WaveformCollapse is a composable text animation component
- Components wrap their text in `<WaveformCollapse>` where needed

---

## Decision Summary

| ADR | Decision | Risk Level |
|-----|----------|------------|
| 001 | Content in TypeScript file | Low |
| 002 | Hook in `src/surface/hooks/` | Low |
| 003 | Typewriter animation | Medium (needs tuning) |
| 004 | Dedicated trigger prop pattern | Low |
| 005 | Custom lenses → DEFAULT_REALITY | Low |
| 006 | Three archetypes for MVP | Low |
| 007 | Tension text is dynamic | Low |
| 008 | Animation in effects/ folder | Low |
