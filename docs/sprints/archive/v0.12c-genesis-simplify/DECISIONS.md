# Architectural Decisions — v0.12c Genesis Simplify

## ADR-001: ProductReveal Headline Simplification

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
The current ProductReveal headline uses a 6-phase animation to transition "STEP INTO THE GROVE" to "STEP INTO YOUR GROVE". In production, this animation:
- Renders illegibly at completion (YOUR/GROVE overlap)
- Is too fast to read
- Creates cognitive load rather than delight

**Options Considered:**

### Option A: Fix the Animation
- **Description:** Debug timing, fix positioning, slow down
- **Pros:** Preserves the "aha moment" of YOUR sprouting
- **Cons:** Complex code, more things to break, fundamental timing issues

### Option B: Static Headline with Color Highlight
- **Description:** Remove all animation. "STEP INTO " in forest, "YOUR GROVE" in clay (orange)
- **Pros:** Instant readability, matches clickable UX, zero timing bugs
- **Cons:** Loses the dynamic reveal

### Option C: Simpler Animation (Fade Only)
- **Description:** Just fade in the final text, no word swap
- **Pros:** Some motion, simpler code
- **Cons:** Still needs timing, doesn't add meaning

**Decision:**
Option B — Static headline with color highlight.

**Rationale:**
The animation serves engineering ego, not user comprehension. The *meaning* of "YOUR GROVE" (ownership, personalization) is better conveyed by visual emphasis (orange = interactive/important) than by watching letters sprout.

**Consequences:**
- Remove ~80 lines of animation code
- Simplify component significantly
- Consistent with clickable bold text UX (orange = action)
- No timing-related bugs possible

---

## ADR-002: Terminal Welcome Message Approach

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
First-time users see LensPicker immediately with no context about what Grove is or what Terminal does. This is disorienting.

**Options Considered:**

### Option A: Modal/Overlay Welcome
- **Description:** Full-screen modal before Terminal opens
- **Pros:** Prominent, can't be missed
- **Cons:** Blocking, feels like forced onboarding

### Option B: Inject Welcome as Chat Message
- **Description:** Add welcome message to chat history as "assistant" message
- **Pros:** Natural, conversational, fits Terminal mental model
- **Cons:** Needs careful timing with LensPicker

### Option C: Tooltip/Popover
- **Description:** Small hint tooltip on first open
- **Pros:** Non-blocking
- **Cons:** Easy to miss, not enough space for context

**Decision:**
Option B — Inject welcome as chat message.

**Rationale:**
The Terminal *is* the Grove's voice. Having the Grove introduce itself via chat is narratively coherent. It models the relationship we want users to have.

**Implementation:**
1. On first Terminal open (no localStorage flag)
2. Before showing LensPicker, inject welcome message into chat
3. Show LensPicker card at end of message (or as separate component below)
4. Set localStorage flag so it only happens once

**Consequences:**
- Modify Terminal.tsx welcome flow
- Welcome message appears as assistant message
- LensPicker appears after/within welcome flow
- Existing welcomed users unaffected (localStorage check)

---

## ADR-003: CTA Copy Standardization

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Current CTAs across Genesis screens:
- "See it in action" (ProductReveal)
- "Go deeper" (AhaDemo)
- "Explore" (Foundation)

These are vague. Users don't know what action they're taking.

**Options Considered:**

### Option A: Keep Varied CTAs
- **Description:** Different copy per context
- **Pros:** Context-specific
- **Cons:** Inconsistent, vague

### Option B: "Consult the Grove"
- **Description:** Single consistent CTA
- **Pros:** Names the product, implies action, professional
- **Cons:** Repetitive if users see multiple screens

### Option C: "Ask the Grove"
- **Description:** Conversational variant
- **Pros:** Friendly
- **Cons:** Less authoritative

### Option D: "Enter the Grove"
- **Description:** Spatial metaphor
- **Pros:** Poetic
- **Cons:** Doesn't imply what happens

**Decision:**
Option B — "Consult the Grove"

**Rationale:**
"Consult" implies:
- The Grove has knowledge/wisdom
- You're seeking guidance
- This is a professional tool, not a toy

It also names the product clearly.

**Consequences:**
- Update 3 components with same copy
- Consistent user expectation

---

## ADR-004: Foundation Button Order

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Current order: Ratchet → Economics → Vision

This is technically-first, not narratively-first.

**Options Considered:**

### Option A: Ratchet → Economics → Vision (current)
- **Cons:** Leads with mechanism before meaning

### Option B: Vision → Ratchet → Economics
- **Pros:** Hooks with WHY, explains HOW NOW, seals with HOW SUSTAINABLE
- **Cons:** None

### Option C: Economics → Ratchet → Vision
- **Cons:** Leads with money, feels mercenary

**Decision:**
Option B — Vision → Ratchet → Economics

**Rationale:**
This is the classic pitch structure:
1. **Vision** — The aspirational future (emotional hook)
2. **Ratchet** — Why this is possible now (technical validation)
3. **Economics** — How it sustains (business credibility)

**Consequences:**
- Reorder buttons in Foundation.tsx
- Matches narrative arc of the pitch

---

## ADR-005: Lens Selector UI Redesign

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
The current lens selector in TerminalControls uses a colored dot + label + small arrow (↔). Problems:
- Colored dot meaning is unclear (what does orange vs red mean?)
- Doesn't look clickable — reads as static label
- Inconsistent with "ENABLE SCHOLAR MODE" pill toggle above it

**Options Considered:**

### Option A: Pill with Magnifying Glass
- **Description:** `[🔎 Lens Name ▾]` — pill button with border, emoji, chevron
- **Pros:** Matches Scholar Mode toggle, obviously clickable, self-documenting (🔎 = lens)
- **Cons:** Slightly more visual weight

### Option B: Icon + Label + Explicit "Switch" Button
- **Description:** `🔎 Lens Name [Switch]`
- **Pros:** Very explicit
- **Cons:** Takes more space, two separate elements

### Option C: Keep Colored Dot, Improve Affordance
- **Description:** Keep dot but add border/pill styling
- **Pros:** Preserves color system
- **Cons:** Dot still doesn't communicate meaning

**Decision:**
Option A — Pill with magnifying glass: `[🔎 Lens Name ▾]`

**Rationale:**
- **Consistency:** Matches "ENABLE SCHOLAR MODE" pill directly above
- **Affordance:** Pill shape + chevron = universally understood as dropdown/selector
- **Self-documenting:** 🔎 hints "this is a lens/view you're looking through"
- **Simplicity:** Removes cryptic colored dot system

**Consequences:**
- Remove colored dot logic from TerminalControls
- Add pill border styling
- Add magnifying glass emoji
- Replace ↔ with ▾ (standard dropdown indicator)
- Hover state should match Scholar Mode toggle

---

## Quick Reference

| ADR | Decision | Rationale |
|-----|----------|-----------|
| 001 | Static headline, orange "YOUR GROVE" | Readability > animation |
| 002 | Welcome as chat message | Terminal IS the Grove's voice |
| 003 | "Consult the Grove" CTAs | Names product, implies action |
| 004 | Vision → Ratchet → Economics | Narrative arc: why → how now → how sustainable |
| 005 | Lens selector as pill [🔎 Name ▾] | Obvious affordance, matches Scholar Mode toggle |
