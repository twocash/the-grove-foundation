# Architectural Decisions — v0.12b Terminal Polish

## ADR-001: Scroll Indicator Animation Approach

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Current scroll indicators use generic `animate-bounce` with chevron SVG. User requested "stream of ASCII characters swirling into a bud/plant/green shoot, sparkling and bouncing."

**Options Considered:**

### Option A: Pure CSS/SVG
- **Pros:** No dependencies, performant
- **Cons:** Complex keyframe math for particle convergence, limited expressiveness

### Option B: Canvas/JS
- **Pros:** Full control, fluid particle physics
- **Cons:** More code, performance tuning needed, not declarative

### Option C: Lottie Animation
- **Pros:** Designer-friendly, smooth, proven, can be very organic
- **Cons:** Requires creating/sourcing animation, adds ~40kb dependency

### Option D: CSS Animation with Simplified "Rain to Bloom"
- **Pros:** No dependencies, simpler than full swirl
- **Cons:** Less magical than full vision

**Decision:**
Option C (Lottie) with Option D as fallback. The ASCII→seedling animation is a brand moment worth investing in. Lottie provides the smoothest path to organic, polished animation.

**Consequences:**
- Add `lottie-react` dependency
- Create or commission Lottie animation file
- If Lottie proves too complex for timeline, fall back to CSS "rain to bloom"

---

## ADR-002: ProductReveal "YOUR" Animation Fix

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Current animation uses fixed-width container to swap THE→YOUR. This creates a visible gap after "YOUR" settles because the words are different widths.

**Options Considered:**

### Option A: Static "YOUR GROVE" (no animation)
- **Pros:** Safe, no layout issues
- **Cons:** Loses the "personal transformation" emotional moment

### Option B: Fade Transition (THE fades out, YOUR fades in)
- **Pros:** Simple, reliable, no layout shift
- **Cons:** Less dramatic than original intent

### Option C: Cross-fade with Scale
- **Pros:** More visual interest than simple fade
- **Cons:** Requires careful timing to avoid overlap issues

### Option D: Highlight Animation
- **Pros:** Different emotional beat (emphasis vs transformation)
- **Cons:** Doesn't communicate "personalization" as clearly

**Decision:**
Option B (simple fade). The fade approach maintains the emotional beat of "this becomes yours" while eliminating all layout issues. The sparkle particles can remain for visual interest.

**Consequences:**
- Remove fixed-width container
- THE and YOUR occupy same position
- Crossfade via opacity transition
- Keep sparkle effect during transition

---

## ADR-003: CognitiveBridge Enhancement Approach

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
CognitiveBridge card appears stiff with static copy. User wants terminal to "type" a contextual invitation with warm copy.

**Options Considered:**

### Option A: Full Replacement with Typed Message
- **Pros:** Maximum warmth, feels like conversation
- **Cons:** More complex state management, longer reveal time

### Option B: Typed Introduction + Existing Card
- **Pros:** Adds warmth while keeping proven card UI
- **Cons:** Two sequential animations may feel slow

### Option C: Dynamic Copy Update Only
- **Pros:** Simple change, faster execution
- **Cons:** Misses the "typing" effect that sells the warmth

**Decision:**
Option B with tuned timing. Show typing animation for warm invitation text, then reveal the existing journey card. Total sequence should be ~2.5s (800ms resolve + 1.5s typing + card fade-in).

**Consequences:**
- Add typing animation state to CognitiveBridge
- Update copy to warm, conversational tone
- Preserve existing card UI (it works well)
- Tune timing so it doesn't feel slow

---

## ADR-004: Animation Timing Unification

**Status:** Accepted

**Date:** 2024-12-20

**Context:**
Drawer uses `duration-500 ease-in-out` while pill uses `300ms cubic-bezier(0.32, 0.72, 0, 1)`. Drawer feels sluggish by comparison.

**Options Considered:**

### Option A: Unify to Pill Timing (300ms + cubic-bezier)
- **Pros:** Snappy, modern feel, consistent
- **Cons:** May feel abrupt on larger surface area

### Option B: Keep Different Timings
- **Pros:** No risk of breaking drawer UX
- **Cons:** Inconsistent feel persists

### Option C: Hybrid (same curve, different durations)
- **Pros:** Drawer gets spring feel but slightly slower
- **Cons:** Adds complexity for marginal benefit

**Decision:**
Option A. Apply same 300ms + cubic-bezier to drawer. The spring curve naturally handles the larger surface area well. Test during implementation; can bump to 350ms if needed.

**Consequences:**
- Update `Terminal.tsx:906` class
- Test on mobile to ensure drawer feels good

---

## Quick Reference

| ADR | Decision | Rationale |
|-----|----------|-----------|
| 001 | Lottie for scroll indicator | Best path to organic animation |
| 002 | Fade transition for YOUR | Eliminates layout gap, keeps emotion |
| 003 | Typed intro + existing card | Adds warmth without full redesign |
| 004 | Unify to 300ms cubic-bezier | Snappy, consistent feel |
