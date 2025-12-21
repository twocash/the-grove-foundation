# Architectural Decisions — Sprout System

## ADR-001: localStorage for MVP Storage

**Status:** Accepted

**Date:** 2024-12-21

**Context:**
Sprouts need persistence across sessions. Options range from simple localStorage to server-side storage with GCS.

**Options Considered:**

### Option A: localStorage Only
- **Pros:** Zero infrastructure, instant implementation, works offline
- **Cons:** Lost if user clears browser, no cross-device sync

### Option B: Server API + GCS
- **Pros:** Durable, enables admin review, cross-device
- **Cons:** Requires auth, API development, storage costs

### Option C: IndexedDB
- **Pros:** More storage than localStorage, structured queries
- **Cons:** Overkill for MVP, more complex API

**Decision:**
localStorage for MVP. Sprouts are JSON-serialized to `grove-sprouts` key.

**Consequences:**
- Fast implementation, can ship in one sprint
- Must design schema to be forward-compatible with server sync
- Include `sessionId` for future anonymous-to-authenticated migration

---

## ADR-002: Verbatim Preservation (No Synthesis)

**Status:** Accepted

**Date:** 2024-12-21

**Context:**
When capturing sprouts, should we preserve the exact response or allow editing/synthesis?

**Options Considered:**

### Option A: Verbatim Only
- **Pros:** Clear provenance, supports attribution, immutable record
- **Cons:** May capture imperfect responses

### Option B: Allow Editing
- **Pros:** User can improve before saving
- **Cons:** Breaks provenance chain, unclear attribution

### Option C: AI Summary
- **Pros:** Consistent format
- **Cons:** Loses original voice, adds latency, breaks attribution

**Decision:**
Verbatim preservation. The sprout IS the artifact, exactly as generated.

**Consequences:**
- Attribution chains remain clear
- Derivative work happens through NEW sprouts that reference originals
- Matches Knowledge Commons "preprint model" philosophy

---

## ADR-003: Modal vs Page for Garden View

**Status:** Accepted

**Date:** 2024-12-21

**Context:**
Where should users view their sprouts? Quick modal or dedicated page?

**Options Considered:**

### Option A: Modal Only
- **Pros:** Fast access, stays in flow, matches existing patterns
- **Cons:** Limited space for rich detail

### Option B: Page Only
- **Pros:** Full screen, detailed views possible
- **Cons:** Breaks conversation flow

### Option C: Both (Modal + Page Link)
- **Pros:** Quick view for common case, detail when needed
- **Cons:** Two implementations to maintain

**Decision:**
Both. `/garden` opens quick modal, "View Full Stats" links to extended stats page.

**Consequences:**
- Modal shows session sprouts (quick feedback loop)
- Stats page shows full history with lifecycle view
- Consistent with existing modal patterns

---

## ADR-004: Command Context Extension

**Status:** Accepted

**Date:** 2024-12-21

**Context:**
The `/sprout` command needs access to the last response and session context. Current `CommandContext` doesn't expose this.

**Options Considered:**

### Option A: Extend CommandContext Interface
- **Pros:** Clean API, type-safe
- **Cons:** Requires Terminal.tsx changes

### Option B: Global State (Zustand/Context)
- **Pros:** Decoupled from Terminal
- **Cons:** Adds dependency, overengineered for this case

### Option C: Ref-based Access
- **Pros:** No interface changes
- **Cons:** Breaks encapsulation, fragile

**Decision:**
Extend `CommandContext` with `getLastResponse()` and `getSessionContext()`.

**Consequences:**
- Commands gain access to conversation state
- Terminal.tsx must pass these through to command execution
- Pattern can be reused for future commands

---

## ADR-005: Sprout Status Model

**Status:** Accepted

**Date:** 2024-12-21

**Context:**
Sprouts have a lifecycle: capture → review → publication. How to model this?

**Options Considered:**

### Option A: Simple Status Enum
- **Pros:** Easy to implement, clear states
- **Cons:** May need extension later

### Option B: State Machine
- **Pros:** Enforces valid transitions
- **Cons:** Overkill for MVP

**Decision:**
Simple enum with forward-compatible values: `'sprout' | 'sapling' | 'tree' | 'rejected'`. MVP only uses `'sprout'`.

**Consequences:**
- Schema ready for full lifecycle
- MVP keeps it simple
- No migration needed when adding review workflow

---

## Quick Reference

| ADR | Decision | Rationale |
|-----|----------|-----------|
| 001 | localStorage | Fast MVP, forward-compatible schema |
| 002 | Verbatim preservation | Clear attribution, Knowledge Commons alignment |
| 003 | Modal + Page | Quick view in flow, detail when needed |
| 004 | Extend CommandContext | Clean API for command access to state |
| 005 | Simple status enum | Forward-compatible, MVP-simple |
