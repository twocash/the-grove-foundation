# Kinetic Experience v1: Architecture Decision Records

**Sprint:** kinetic-experience-v1
**Date:** December 28, 2025

---

## ADR-001: Hard Boundary Strategy

### Status
**Accepted**

### Context
Previous attempts to evolve Terminal into the Kinetic Stream vision failed because:
- Sprint stories referenced Terminal files for "enhancement"
- Bug fixes naturally flowed to existing code paths
- The 1,866-line monolith created gravitational pull
- New patterns became indistinguishable from old

### Decision
Create a completely new component tree at `src/surface/components/KineticStream/` with:
- Zero imports from `components/Terminal/`
- Separate route (`/explore`) to prevent contamination
- Fresh implementations even where Terminal has working code

### Consequences
**Positive:**
- Clean architecture without legacy debt
- Clear migration path (strangler fig pattern)
- Enables parallel development and A/B testing
- Forces intentional pattern decisions

**Negative:**
- Initial duplication of some functionality
- Two systems to maintain temporarily
- Risk of divergent bug fixes

**Mitigation:**
- Terminal frozen except critical bugs
- CI check blocks Terminal imports in KineticStream
- Planned deprecation after feature parity

---

## ADR-002: Kinetic Object Pattern

### Status
**Accepted**

### Context
The Kinetic Stream vision requires "objects, not messages" — interactive knowledge artifacts rather than chat bubbles. We need a presentation layer pattern that:
- Separates data (StreamItem) from presentation
- Enables rich interactions (click, hover, pivot)
- Supports polymorphic rendering by item type

### Decision
Introduce the Kinetic Object Pattern:

```
StreamItem (data) → KineticObject (presentation + interaction)
```

Components:
- `QueryObject` — User input display
- `ResponseObject` — AI response with glass, concepts, forks
- `NavigationObject` — Fork button group
- `SystemObject` — System messages

Each object:
- Receives a typed StreamItem
- Handles its own interaction callbacks
- Renders with appropriate visual treatment

### Consequences
**Positive:**
- Clean separation of concerns
- Type-safe component contracts
- Easy to add new object types
- Testable in isolation

**Negative:**
- More files than minimal implementation
- Callback prop drilling through renderer

**Mitigation:**
- Use React context for deeply shared callbacks if needed
- Keep object components focused and small

---

## ADR-003: Glass Effect Implementation

### Status
**Accepted**

### Context
The Grove visual identity includes glass morphism effects. Options considered:
1. Full `backdrop-filter: blur()` — expensive, can cause jank
2. CSS-only pseudo-glass — lightweight, consistent
3. Canvas-based effects — overkill for this use case

### Decision
Use CSS-only pseudo-glass via existing token system:
- `--glass-surface` backgrounds with transparency
- Subtle borders from `--glass-border`
- Optional very light `backdrop-blur-sm` (2px max)
- Box shadows for elevation

Intensity variants:
- `subtle` — 50% opacity surface
- `medium` — 85% opacity surface (default)
- `elevated` — solid elevated background

### Consequences
**Positive:**
- Performs well on low-end devices
- Consistent with existing design system
- No additional dependencies

**Negative:**
- Less dramatic than full backdrop blur
- May need adjustment for high-contrast themes

---

## ADR-004: Streaming with Sentence Hydration

### Status
**Proposed** (for future optimization)

### Context
Streaming responses character-by-character can cause layout thrashing and makes it hard to apply parsing until complete. Options:
1. Full streaming (current) — simple but can be janky
2. Sentence-boundary hydration — smoother, enables progressive parsing
3. Chunk-based (arbitrary sizes) — middle ground

### Decision
For MVP, use full streaming (option 1). Track performance metrics. If jank is detected, implement sentence-boundary hydration in a follow-up sprint.

Sentence hydration would:
- Buffer incoming characters
- Detect sentence boundaries (`.!?` followed by space/newline)
- Render complete sentences
- Parse rhetoric progressively

### Consequences
**Positive (MVP):**
- Simpler implementation
- Matches user expectations from ChatGPT-style interfaces

**Deferred:**
- Progressive parsing complexity
- Sentence boundary edge cases

---

## ADR-005: Pivot Context Propagation

### Status
**Accepted**

### Context
When a user clicks a concept to explore it, the follow-up query needs context about where it came from. This enables the LLM to:
- Continue the conversation thread
- Reference the source context
- Provide deeper explanation

### Decision
Introduce `PivotContext` attached to query items:

```typescript
interface PivotContext {
  sourceResponseId: string;    // Which response contained the concept
  sourceText: string;          // The concept text itself
  sourceContext?: string;      // Surrounding context (optional)
}
```

Flow:
1. User clicks concept in ResponseObject
2. ExploreShell creates PivotContext
3. useKineticStream attaches to QueryItem
4. chatService includes in API request
5. LLM receives context via system prompt

### Consequences
**Positive:**
- LLM can provide contextual follow-ups
- User journey is tracked
- Enables future "thread" visualization

**Negative:**
- Increased payload size
- System prompt complexity

---

## ADR-006: Fork Type Hierarchy

### Status
**Accepted**

### Context
Navigation forks need visual hierarchy to guide user attention. The Grove philosophy prioritizes depth over breadth — deep dives should be most prominent.

### Decision
Establish fork type hierarchy:

| Priority | Type | Visual | Purpose |
|----------|------|--------|---------|
| 1 | `deep_dive` | Primary (clay gradient) | Go deeper on current topic |
| 2 | `pivot` | Secondary (surface + border) | Related tangent |
| 3 | `apply` | Tertiary (ghost) | Practical application |
| 4 | `challenge` | Quaternary (subtle italic) | Counter-argument |

Rendering order: deep_dive → pivot → apply → challenge

### Consequences
**Positive:**
- Clear visual hierarchy
- Encourages deep exploration (Grove philosophy)
- Consistent with journey design

**Negative:**
- May need adjustment based on user behavior data
- Challenge forks might be under-noticed

---

## ADR-007: Concept Detection Strategy

### Status
**Accepted**

### Context
The Active Rhetoric system needs to identify "concepts" in LLM responses. Options:
1. LLM explicitly marks concepts with special syntax
2. Parse markdown bold (`**text**`) as concepts
3. NLP-based entity extraction
4. Hybrid approach

### Decision
Use markdown bold as concept indicator (option 2) for MVP:
- LLMs naturally use bold for emphasis
- No special training or prompting required
- Simple regex parsing
- Falls back gracefully (no bold = no concepts)

Future enhancement: Add explicit `<concept>` syntax for finer control.

### Consequences
**Positive:**
- Works immediately with any LLM
- No prompt engineering required
- Graceful degradation

**Negative:**
- False positives (not all bold is a concept)
- Limited semantic understanding
- Can't distinguish concept types

**Mitigation:**
- Accept some false positives (clicking non-concepts is harmless)
- Add concept type hints via prompt engineering later

---

## ADR-008: Component Import Restrictions

### Status
**Accepted**

### Context
The hard boundary strategy requires enforcement mechanisms. Developer discipline alone is insufficient — tooling must prevent drift.

### Decision
Implement multi-layer import restrictions:

1. **Directory structure** — KineticStream in separate path
2. **ESLint rule** — Block `components/Terminal` imports in surface/
3. **CI check** — Grep for violations, fail build
4. **Code review** — Explicit checklist item

ESLint configuration:
```javascript
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["**/components/Terminal/**"],
        "message": "Terminal imports forbidden in KineticStream. Use src/core/ instead."
      }]
    }]
  }
}
```

CI check:
```bash
if grep -r "from.*components/Terminal" src/surface/components/KineticStream/; then
  echo "ERROR: Terminal imports detected in KineticStream"
  exit 1
fi
```

### Consequences
**Positive:**
- Automated enforcement
- Fast feedback during development
- Clear error messages

**Negative:**
- Initial setup overhead
- May need exceptions for shared utilities

---

## ADR-009: State Management Approach

### Status
**Accepted**

### Context
KineticStream needs state management for:
- Stream items array
- Current streaming item
- Loading states
- User preferences (lens, journey)

Options:
1. Local useState in ExploreShell
2. Dedicated Zustand store
3. XState machine
4. React Query for API state

### Decision
Use local useState via custom hook (`useKineticStream`) for MVP:
- Stream state is component-local
- No cross-component state needed yet
- Simpler debugging
- Easy to lift to store later if needed

Engage with existing XState engagement machine for telemetry only.

### Consequences
**Positive:**
- Minimal complexity
- Fast implementation
- Easy testing

**Negative:**
- No persistence across remounts
- Limited cross-component coordination

**Future:**
- Add Zustand store when session persistence needed
- Consider React Query for API caching

---

## ADR-010: Accessibility Baseline

### Status
**Accepted**

### Context
KineticStream must be accessible to keyboard and screen reader users. The interactive nature (clickable concepts, fork buttons) requires attention to:
- Focus management
- Keyboard navigation
- ARIA labels
- Color contrast

### Decision
Implement accessibility baseline:

1. **ConceptSpan** — `role="button"`, `tabIndex={0}`, keyboard handler
2. **Fork buttons** — Native `<button>` elements
3. **CommandConsole** — Proper input labeling
4. **Focus visible** — Maintain browser defaults, enhance with focus ring
5. **Color contrast** — Use existing tokens (verified WCAG AA)

Not in MVP scope:
- Screen reader announcements for streaming
- Skip links
- High contrast mode

### Consequences
**Positive:**
- Keyboard users can navigate
- Screen readers identify interactive elements
- Builds on accessible token system

**Negative:**
- Streaming experience may be suboptimal for screen readers
- Testing burden increased

---

## Decision Log Summary

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Hard boundary with separate component tree | Accepted |
| 002 | Kinetic Object pattern for presentation | Accepted |
| 003 | CSS-only glass effects | Accepted |
| 004 | Full streaming for MVP, sentence hydration later | Proposed |
| 005 | PivotContext for concept click propagation | Accepted |
| 006 | Four-tier fork type hierarchy | Accepted |
| 007 | Markdown bold as concept indicator | Accepted |
| 008 | Multi-layer import restrictions | Accepted |
| 009 | Local useState via custom hook | Accepted |
| 010 | Accessibility baseline for MVP | Accepted |

---

*Architecture decisions recorded. Reference when making implementation choices.*
