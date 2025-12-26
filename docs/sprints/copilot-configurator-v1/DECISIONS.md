# Architectural Decisions: Copilot Configurator v1

**Sprint:** copilot-configurator-v1

---

## ADR-001: Embed Copilot in ObjectInspector

**Status:** Accepted

**Context:**
The Copilot needs a home in the UI. Options:
1. Floating panel (separate from inspector)
2. Sidebar tab (alongside existing inspector)
3. Embedded section (within ObjectInspector)

**Decision:** Embed as fixed-bottom section within ObjectInspector.

**Rationale:**
- Copilot operates on the inspected object—co-location makes the relationship clear
- No new UI chrome needed; uses existing InspectorPanel wrapper
- Collapsible design respects users who don't want the feature
- Pattern 8 (Canonical Source): One place to edit objects, not two surfaces

**Consequences:**
- ObjectInspector grows in complexity
- May need to adjust max-height on smaller screens
- Scrolling behavior needs careful design

---

## ADR-002: Simulated Responses for MVP

**Status:** Accepted

**Context:**
Real local model integration requires:
- Ollama or llama.cpp setup
- Model download (~4GB for 7B)
- GPU/CPU inference infrastructure
- Error handling for model failures

**Decision:** Use pattern-matched simulated responses for MVP.

**Rationale:**
- Demonstrates the interaction pattern without infrastructure overhead
- Allows UX iteration before committing to model integration
- Ratchet thesis: today's simulation becomes tomorrow's reality
- Users understand "Simulated" label—no deception

**Consequences:**
- Limited to predefined intent patterns
- Cannot handle creative rewrites (e.g., "make description more mysterious")
- Clear path to real model integration in future sprint

---

## ADR-003: JSON Patch (RFC 6902) for Changes

**Status:** Accepted

**Context:**
Need a standard way to represent object mutations. Options:
1. Custom diff format
2. JSON Patch (RFC 6902)
3. Immer patches
4. Full object replacement

**Decision:** Use JSON Patch (RFC 6902) operations.

**Rationale:**
- Industry standard with good library support (`fast-json-patch`)
- Operations are atomic and reversible
- Path-based addressing works with nested structures
- Maps cleanly to undo/redo in future
- Human-readable for debugging

**Consequences:**
- Dependency on `fast-json-patch` library
- Path syntax requires careful construction
- Array operations can be tricky (index shifts)

---

## ADR-004: Pattern-Based Intent Parsing

**Status:** Accepted

**Context:**
How to extract user intent from natural language. Options:
1. LLM-based parsing (even simulated)
2. Rule-based pattern matching
3. Hybrid approach

**Decision:** Rule-based pattern matching with regex.

**Rationale:**
- Deterministic behavior for MVP
- No model latency for parsing
- Explicit patterns are debuggable and testable
- Sufficient for common edit operations
- Can add LLM parsing layer later without changing interface

**Consequences:**
- Limited to patterns we define
- Rigid—"set the title" works but "change title" might not
- Need comprehensive pattern library

---

## ADR-005: Session-Only State (No Persistence)

**Status:** Accepted

**Context:**
Should Copilot message history persist? Options:
1. Persist to localStorage
2. Persist to backend
3. Session-only (lost on refresh)

**Decision:** Session-only state for MVP.

**Rationale:**
- Simplifies implementation significantly
- Objects themselves aren't persisted yet (static JSON)
- Avoids privacy concerns about storing conversations
- Clear mental model: "Copilot helps now, doesn't remember"

**Consequences:**
- No conversation continuity across sessions
- Users may repeat themselves
- Future sprint can add persistence if valuable

---

## ADR-006: Fixed-Bottom Panel Layout

**Status:** Accepted

**Context:**
Where should Copilot panel appear? Options:
1. Inline with JSON (scrolls together)
2. Fixed bottom (always visible)
3. Floating overlay

**Decision:** Fixed to bottom of inspector panel.

**Rationale:**
- Always accessible regardless of JSON length
- Mimics familiar chat interfaces (Intercom, etc.)
- Collapsible to minimize footprint
- Clear visual hierarchy: view → edit

**Consequences:**
- Reduces visible JSON area
- May feel cramped on small screens
- Collapse state needs persistence (session storage)

---

## ADR-007: Type-Specific Suggestions

**Status:** Accepted

**Context:**
Should Copilot suggest actions? If so, how?

**Decision:** Show clickable suggestion chips based on object type.

**Rationale:**
- Reduces friction for new users
- Demonstrates capabilities
- DEX alignment: suggestions defined in config, not hardcoded
- Template strings guide user toward successful patterns

**Consequences:**
- Need to maintain suggestion config per type
- UI complexity increases
- Must keep suggestions current with capabilities

---

## ADR-008: Model Indicator Transparency

**Status:** Accepted

**Context:**
Should we show which model is powering responses?

**Decision:** Yes, prominently display model name and status.

**Rationale:**
- Transparency about AI capabilities
- Supports Grove's thesis (local models are sufficient)
- Helps users understand latency expectations
- Educational: shows progression from simulated → local → frontier

**Consequences:**
- UI element needs design attention
- Must update when model changes
- "Simulated" might reduce perceived value (mitigated by "Beta" badge)

---

## ADR-009: Collapsible by Default

**Status:** Rejected in favor of Expanded by Default

**Context:**
Should Copilot panel start collapsed or expanded?

**Decision:** Start expanded on first view; remember user preference.

**Rationale:**
- New feature needs visibility to be discovered
- Collapsed by default would hide the innovation
- After user collapses once, respect that choice
- "Collapsed by default" was rejected because it defeats the demo purpose

**Consequences:**
- May feel intrusive to some users
- Need session storage for collapse state
- Consider user preference setting in future

---

## ADR-010: Apply/Retry Pattern (Not Auto-Apply)

**Status:** Accepted

**Context:**
Should changes apply automatically or require confirmation?

**Decision:** Require explicit [Apply] click after diff preview.

**Rationale:**
- Safety: users see exactly what will change
- Control: users can reject unwanted changes
- Trust: no surprises, no "AI did something I didn't want"
- Pattern matches familiar PR review workflows

**Consequences:**
- Extra click for every change
- [Retry] gives option to get alternative suggestion
- Applied message confirms success

---

## Decision Summary

| # | Decision | Pattern Alignment |
|---|----------|-------------------|
| 001 | Embed in ObjectInspector | Pattern 8: Canonical Source |
| 002 | Simulated responses MVP | Capability Agnosticism |
| 003 | JSON Patch RFC 6902 | Industry standard |
| 004 | Pattern-based parsing | Declarative Sovereignty |
| 005 | Session-only state | Simplicity for MVP |
| 006 | Fixed-bottom layout | UX convention |
| 007 | Type-specific suggestions | Declarative Sovereignty |
| 008 | Model indicator | Transparency |
| 009 | Expanded by default | Feature discovery |
| 010 | Apply/Retry pattern | User control |
