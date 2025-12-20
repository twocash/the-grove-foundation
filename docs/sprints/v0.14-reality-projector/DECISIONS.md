# v0.14 Reality Projector — DECISIONS (ADRs)

## ADR-001: Server-Side Generation

**Status:** Accepted

**Context:**  
Reality collapse requires LLM calls. These could happen client-side (browser) or server-side (API).

**Decision:** Server-side generation via `/api/collapse` endpoint.

**Rationale:**
- API key security: Client-side exposes key in network tab
- Consistent with existing `/api/chat` and `/api/generate-lens` patterns
- Enables server-side caching in future
- Rate limiting can be enforced server-side

**Consequences:**
- Additional network hop adds latency (~100-200ms)
- Server becomes single point of failure (mitigated by fallback)

---

## ADR-002: Rhetorical Skeleton as Constraint

**Status:** Accepted

**Context:**  
Generated content must feel "on brand" without manual review.

**Decision:** Structural prompting with explicit pattern requirements.

**Rationale:**
- Fill-in-the-blank too rigid (loses persona voice)
- Post-hoc validation requires regeneration loop
- Structural prompting balances constraint with creativity

**The Skeleton:**
```
HERO.headline:  [2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].
HERO.subtext:   "Not [X]. Not [Y]." / "[Z]."
PROBLEM.tension: "[What THEY do]." / "[What WE do]."
```

---

## ADR-003: Dual-Layer Cache Strategy

**Status:** Accepted

**Context:**  
Generated realities are expensive (~500ms-1500ms). How do we avoid redundant generation?

**Decision:** Dual-layer cache (memory + sessionStorage).

**Rationale:**
- Memory provides instant response for in-session switches
- sessionStorage survives page refresh within session
- localStorage inappropriate (generated content shouldn't persist indefinitely)

**Cache Key Format:**
```
Memory: persona-${hash(toneGuidance).toString(36)}
Session: grove-reality-${hash(toneGuidance).toString(36)}
```

---

## ADR-004: 2-Second Timeout with Silent Fallback

**Status:** Accepted

**Context:**  
Generation can fail or be slow. How do we handle this without degrading UX?

**Decision:** 2-second timeout with silent fallback to Base Reality.

**Rationale:**
- 2s is user attention threshold for perceived responsiveness
- Silent fallback prevents error UI (user may not notice)
- Base Reality is coherent experience (not a broken state)

**Implementation:**
```typescript
const reality = await Promise.race([
  collapser.generateReality(persona),
  timeout(2000)
]).catch(() => BASE_REALITY);
```

---

## ADR-005: LZ-String Compression for Share URLs

**Status:** Accepted

**Context:**  
Shared reality URLs encode lens configuration. Raw JSON is too long.

**Decision:** LZ-String compression with Base64 URI-safe encoding.

**Rationale:**
- LZ-String achieves ~60-70% compression on JSON
- No server-side storage required (stateless)
- URI-safe encoding works in all contexts

**URL Format:**
```
grove.foundation/?share=N4IgJg...
```

---

## ADR-006: Tuning Phase with Scanning Cursor

**Status:** Accepted

**Context:**  
During generation, user sees a delay. How do we communicate "AI is thinking"?

**Decision:** Scanning cursor that cycles through density glyphs.

**Rationale:**
- Distinct from blinking (user knows this is different)
- Maintains typewriter aesthetic
- Suggests "scanning/perceiving" (aligned with reality collapse metaphor)

**Visual Sequence:**
```
▓ → ▒ → ░ → ▒ → ▓ (repeating, ~200ms per glyph)
```

---

## ADR-007: Share Payload Privacy Constraints

**Status:** Accepted

**Context:**  
Custom lenses contain encrypted `userInputs` with potentially sensitive information.

**Decision:** Filtered lens with only narrative-relevant fields.

**Included Fields:**
- `publicLabel`, `toneGuidance` (truncated), `narrativeStyle`, `color`, `v` (version)

**Excluded Fields:**
- `userInputs`, `archetypeMapping`, `createdAt`, `lastUsedAt`, `journeysCompleted`

---

## ADR-008: Ephemeral Lens for Shared Realities

**Status:** Accepted

**Context:**  
When a user opens a shared reality URL, they don't have the sender's custom lens.

**Decision:** Create ephemeral lens with option to save.

**Implementation:**
```typescript
const ephemeralId = `shared-${timestamp}`;
const ephemeralLens: CustomLens = {
  ...deserializedConfig,
  id: ephemeralId,
  isEphemeral: true
};
```

**UI Behavior:**
- Badge: "Viewing: [Sender's Label]"
- Button: "Save to My Library"

---

## ADR-009: Archetype Content Strategy

**Status:** Accepted

**Context:**  
Built-in archetypes have hardcoded content in v0.13. Should they use generation?

**Decision:** Hybrid approach—archetypes use pre-defined content, custom lenses generate.

**Rationale:**
- Archetype content is carefully crafted for brand
- Generation introduces variability (acceptable for custom, not archetypes)
- Avoids API costs for common paths

**Implementation:**
```typescript
const getReality = async (lens: PersonaOrLens): Promise<LensReality> => {
  if (!('isCustom' in lens) || !lens.isCustom) {
    return SUPERPOSITION_MAP[lens.id] || BASE_REALITY;
  }
  return collapser.collapse(lens);
};
```

---

## Decision Summary

| ADR | Decision | Key Rationale |
|-----|----------|---------------|
| 001 | Server-side generation | API key security |
| 002 | Rhetorical skeleton constraints | Balance brand voice with persona creativity |
| 003 | Dual-layer cache (memory + session) | Instant response + refresh persistence |
| 004 | 2s timeout, silent fallback | User attention threshold |
| 005 | LZ-String compression | Shareable URL length |
| 006 | Scanning cursor for tuning | Distinct "perceiving" visual |
| 007 | Filtered share payload | Privacy protection |
| 008 | Ephemeral lens for shares | Low-friction experience |
| 009 | Hybrid archetype/custom strategy | Brand control + generation flexibility |
