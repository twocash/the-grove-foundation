# Feature: Prompt Journey Mode Toggle

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 7: Ready for Execution |
| **Status** | 🟢 All Artifacts Complete |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-05T17:30:00Z |
| **Next Action** | Hand to Claude CLI |
| **Attention Anchor** | Re-read before any code changes |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** A toggle that lets users switch between LLM-driven navigation (Path A/B forks) and 4D library-driven prompt journeys
- **Success looks like:** User clicks JOURNEY toggle → LLM responses end with questions (no nav blocks) → 4D prompts appear below responses → clicking a prompt shows the label (not executionPrompt) in chat
- **We are NOT:** Creating new prompts, modifying the 4D scoring system, or changing the core chat service architecture
- **Current phase:** Story breakdown / Execution prep
- **Next action:** Hand EXECUTION_PROMPT.md to Claude CLI

---

## Pattern Check (Abbreviated)

**Existing pattern to extend:** RAG toggle in KineticHeader + useKineticStream
**Canonical home for this feature:**
- Toggle UI: `src/surface/components/KineticStream/KineticHeader.tsx`
- State: `src/surface/components/KineticStream/ExploreShell.tsx`
- Schema: `src/core/schema/stream.ts` (QueryStreamItem)
- Service: `src/services/chatService.ts`

---

## Goal

Enable users to toggle between two navigation paradigms:

1. **Path Mode (Journey OFF)** - Default. LLM generates responses with navigation blocks (`[[BREADCRUMB:...]]`, fork suggestions). This is the current behavior.

2. **Journey Mode (Journey ON)** - LLM generates open-ended responses ending with reflective questions. 4D Context Fields system surfaces curated prompts from the library. Wayne Turner lens already demonstrates this pattern.

Additionally, fix the bug where clicking a suggested prompt shows the `executionPrompt` (detailed LLM instructions) in the chat instead of just the `label` (user-friendly text).

---

## Non-Goals

- NOT creating new prompt objects (prompt library expansion is a separate task)
- NOT modifying the 4D scoring/selection pipeline
- NOT changing how personaBehaviors are defined in personas
- NOT implementing Supabase persistence (localStorage only for v1)
- NOT adding feature flag infrastructure (using existing system)

---

## Acceptance Criteria

- [ ] **AC1:** JOURNEY toggle pill appears in KineticHeader (styled like RAG toggle)
- [ ] **AC2:** Toggle state persists across page reloads via localStorage
- [ ] **AC3:** When Journey Mode ON:
  - [ ] LLM responses end with questions, no `[[BREADCRUMB:...]]` or `[[TOPIC:...]]` tags
  - [ ] LLM responses have no inline navigation blocks
  - [ ] 4D library prompts appear below responses (via existing `useNavigationPrompts`)
- [ ] **AC4:** When Journey Mode OFF:
  - [ ] LLM responses include navigation tags and fork suggestions (current behavior)
- [ ] **AC5:** BUG FIX: Clicking a 4D prompt shows `label` in chat, sends `executionPrompt` to LLM
- [ ] **AC6:** Feature gated behind `journey-mode` feature flag

---

## Implementation Notes

### Bug Analysis

**Current flow (broken):**
```
User clicks fork → ResponseObject.handleForkSelect 
  → onPromptSubmit(fork.queryPayload)  // ← queryPayload = executionPrompt
  → submit(query)
  → QueryStreamItem { content: query }  // ← This is displayed AND sent
```

**Fix:** Separate display text from execution prompt:
1. Add `executionPrompt?: string` to `QueryStreamItem` schema
2. Modify `submit()` to accept `{ displayText, executionPrompt }` 
3. Display `displayText` in chat, send `executionPrompt` to LLM
4. When fork selected: `displayText = fork.label`, `executionPrompt = fork.queryPayload`

### Journey Mode Override

When Journey Mode is ON, override personaBehaviors:
```typescript
const journeyBehaviors = {
  closingBehavior: 'question',
  useBreadcrumbTags: false,
  useTopicTags: false,
  useNavigationBlocks: false
};
```

This matches the Wayne Turner persona behavior pattern that already works correctly.

### Files to Modify

| File | Change |
|------|--------|
| `src/core/schema/stream.ts` | Add `executionPrompt?: string` to QueryStreamItem |
| `src/surface/components/KineticStream/hooks/useKineticStream.ts` | Modify submit() signature |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Add journey mode state + toggle handler |
| `src/surface/components/KineticStream/KineticHeader.tsx` | Add JOURNEY toggle UI |
| `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx` | Fix fork selection to pass label + executionPrompt |
| `src/services/chatService.ts` | Accept journeyMode flag (optional) |
| `data/infrastructure/feature-flags.json` | Add `journey-mode` flag |

---

## Key Decisions

1. **localStorage only (no Supabase)** - Simpler for v1, can add persistence later
2. **Feature flag gated** - Safe rollout, can disable if issues
3. **journeyMode as behavior override** - Clean separation, doesn't modify persona definitions
4. **Separate displayText from executionPrompt in schema** - Clean fix for the bug, enables future features
