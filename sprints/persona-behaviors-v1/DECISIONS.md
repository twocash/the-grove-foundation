# Architectural Decisions: persona-behaviors-v1

**Sprint:** persona-behaviors-v1
**Date:** 2025-01-02

---

## ADR-001: Behavioral Flags vs Custom System Prompts

### Context
Wayne Turner lens needs different structural behaviors than the default Terminal experience. Two approaches were considered:

1. **Custom systemPrompt field** - Each persona can completely replace the base system prompt
2. **Behavioral flags** - Personas set declarative flags that modify prompt assembly

### Decision
**Behavioral flags** (Option 2)

### Rationale
- **DEX Compliance:** Flags are declarative; custom prompts are imperative
- **Testability:** Finite set of flags is testable; infinite prompt variations are not
- **Consistency:** All personas share core identity; only structure varies
- **Maintainability:** Changes to base prompt propagate; custom prompts drift
- **Pattern Alignment:** Extends Pattern 3 (Narrative Schema) rather than creating parallel system

### Consequences
- Limited to predefined response modes and closing behaviors
- Cannot handle truly custom persona behaviors (acceptable for MVP)
- May need expansion later for specialized lenses

---

## ADR-002: Response Mode Definitions

### Context
Need to define what each response mode means structurally.

### Decision
Three modes with clear behavioral distinctions:

| Mode | Characteristics |
|------|-----------------|
| `architect` | Brief (~100 words), hooks curiosity, leaves threads |
| `librarian` | Comprehensive, technical depth, structured |
| `contemplative` | Sits with problem, thinks aloud, no rush to solutions |

### Rationale
- **Architect:** Current default behavior, optimized for exploration
- **Librarian:** Requested for technical personas (engineers, Dr. Chiang)
- **Contemplative:** Designed specifically for Wayne Turner's narrative voice

### Consequences
- Future personas may need additional modes
- Mode definitions live in server.js as prompt fragments

---

## ADR-003: Bold Clickability as Platform Feature

### Context
Should personas be able to disable bold text formatting?

### Decision
**No.** Bold clickability is a platform-level feature, not persona-configurable.

### Rationale
- Bold text drives exploration (engagement metrics)
- UI depends on bold text for click detection
- Disabling would break core interaction model
- Wayne's concern is navigation blocks and closing behavior, not inline formatting

### Consequences
- All personas get bold text highlighting
- UI interaction model remains consistent
- If future persona truly needs no bold, reconsider

---

## ADR-004: Default Behavior Preservation

### Context
What happens to personas without a `behaviors` field?

### Decision
**All defaults = current behavior:**
- `responseMode: 'architect'`
- `closingBehavior: 'navigation'`
- `useBreadcrumbTags: true`
- `useTopicTags: true`
- `useNavigationBlocks: true`

### Rationale
- Non-breaking change to existing personas
- Explicit opt-in to new behaviors
- "Concerned Citizen" and others work unchanged

### Consequences
- Must update Wayne/Chiang explicitly
- New personas must consciously choose behaviors

---

## ADR-005: Frontend Passes Behaviors Object

### Context
How should behaviors flow from frontend to backend?

### Decision
Pass `personaBehaviors` as separate field alongside `personaTone`.

```typescript
{
  personaTone: activeLensData?.toneGuidance,
  personaBehaviors: activeLensData?.behaviors
}
```

### Rationale
- Clean separation of voice (string) and structure (object)
- Backend can apply defaults if behaviors undefined
- No changes to personaTone handling

### Consequences
- Two fields instead of one (acceptable complexity)
- Backend must handle undefined behaviors gracefully

---

## ADR-006: Server-Side Prompt Assembly

### Context
Where should behavioral flags be interpreted?

### Decision
**Server-side only.** `buildSystemPrompt()` in server.js.

### Rationale
- API key security (prompts never exposed to frontend)
- Single source of truth for prompt logic
- Frontend is purely data transport
- Matches existing architecture

### Consequences
- Cannot preview prompts on frontend (acceptable)
- All prompt changes require server deployment
