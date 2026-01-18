# Architectural Decisions: Active Grove Polish v2

## ADR-014: Skip to Unlocked for Return Visitors

### Status
Proposed

### Context
Users who previously selected a lens return to find themselves stuck after clicking the sapling. The state machine transitions to 'collapsing' but WaveformCollapse never fires `onComplete` because there's no trigger change.

### Decision
When a user clicks the sapling and `activeLens` already exists in session, skip the 'split' → 'collapsing' → 'unlocked' sequence and go directly to 'unlocked'.

### Alternatives Considered

**Option A: Clear lens on page load**
- Pros: Simpler logic, forces fresh selection
- Cons: Bad UX, loses user's preference, extra clicks

**Option B: Track lens changes with previousLens state**
- Pros: Only triggers collapsing on actual change
- Cons: More state to manage, still requires animation

**Option C: Skip to unlocked when lens exists (CHOSEN)**
- Pros: Instant experience for returning users, minimal code change
- Cons: No morphing animation on return (acceptable tradeoff)

### Consequences
- Return visitors get faster experience
- They miss the headline morph animation (acceptable—they've seen it before)
- Must ensure Terminal still shows correct lens-specific content

---

## ADR-015: Single CTA Pattern for Sections

### Status
Proposed

### Context
Several sections have two CTAs: one to engage with Terminal, one to continue scrolling. The sapling at the bottom already handles "continue" navigation, making the second CTA redundant.

### Decision
Remove secondary "Keep Exploring" / "Continue" CTAs from sections. Let the sapling be the consistent "next section" affordance throughout the experience.

### Consequences
- Cleaner visual hierarchy
- Sapling becomes the universal navigation element
- Primary CTA can be more prominent and descriptive

---

## ADR-016: External Query Pattern for Display vs. Underlying Prompt

### Status
Existing (documenting for clarity)

### Context
When a section CTA triggers a Terminal query, we need:
1. A user-friendly display string (what they see typed)
2. A rich underlying prompt (what actually goes to the LLM)

### Decision
Use the existing `externalQuery` pattern:
```typescript
interface ExternalQuery {
  nodeId?: string;      // Optional journey node
  display: string;      // Visible in Terminal
  query: string;        // Sent to LLM
}
```

### Application
For AhaDemo diary CTA:
- Display: "How does Grove know when to call for backup?"
- Query: Full context about hybrid routing, efficiency-enlightenment loop, etc.

---

## ADR-017: Carousel Timing at 6 Seconds

### Status
Proposed

### Context
Quote cards were advancing every ~3 seconds, too fast for users to read CEO quotes meaningfully.

### Decision
Increase carousel auto-advance interval to 6000ms (6 seconds).

### Rationale
- Average reading speed: 200-250 WPM
- Longest quote: ~40 words = ~12 seconds to read
- 6 seconds allows quick scan + key phrase absorption
- Users can manually advance if impatient

### Alternatives Considered
- 8 seconds: Too slow, loses momentum
- 4 seconds: Still too fast for longer quotes
- Variable timing based on quote length: Over-engineered for MVP

---

## ADR-018: Foundation Layout Hierarchy

### Status
Proposed

### Context
The "Why This Works" section had visual hierarchy issues:
- CTA text appeared after action buttons (backwards)
- Pink strikethrough styling was jarring
- Sapling position was unclear

### Decision
Establish consistent layout pattern:
1. Section headline
2. Body content
3. CTA invitation text ("Want to go deeper?")
4. Action buttons
5. Navigation sapling

This follows the natural reading flow: understand → invitation → action → continue.

### Styling
- CTA text uses `text-grove-accent` (orange) for warmth
- No strikethrough or gimmicky styling
- Centered for balance with button row below
