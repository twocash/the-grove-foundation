# v0.14 Reality Projector — SPEC

## Vision Statement

Transform The Grove from a static destination into a **generative mirror**. When users define a worldview (lens), the Grove doesn't just tell them it understands—it demonstrates understanding by rewriting its own existence through their eyes.

**The Meta-Thesis:** If we claim "intelligence is fluid," the landing page must prove it.

---

## Goals

### Primary Goal
Enable custom lenses to generate personalized landing page content via constrained LLM generation ("Reality Collapse").

### Secondary Goals
1. Enable viral sharing via "Projected Reality" URLs
2. Maintain brand voice through rhetorical constraints
3. Gracefully handle generation failures with instant fallback

---

## User Stories

### US-1: Custom Lens Reality Collapse
**As a** user who created a custom lens,  
**I want** the landing page to reshape itself to my worldview,  
**So that** I experience the Grove's thesis as demonstrated, not just claimed.

**Acceptance Criteria:**
- AC-1.1: Custom lens activates → tuning indicator appears
- AC-1.2: Generated headline follows `[2-4 WORDS]. [ABSTRACT NOUN].` pattern
- AC-1.3: Generated subtext follows "Not [X]. Not [Y]. [Z]." pattern
- AC-1.4: Generation completes in <2s or falls back to Base Reality
- AC-1.5: Generated content cached for session (no re-generation on revisit)

### US-2: Reality Sharing
**As a** user with a custom lens,  
**I want** to share my "reality" with others via URL,  
**So that** recipients experience the Grove through my eyes.

**Acceptance Criteria:**
- AC-2.1: "Share This View" button visible when custom lens active
- AC-2.2: Click copies URL to clipboard and shows confirmation toast
- AC-2.3: URL format: `grove.foundation/?share=<compressed_config>`
- AC-2.4: URL contains only: publicLabel, toneGuidance, narrativeStyle, color
- AC-2.5: URL does NOT contain encrypted userInputs (privacy)

### US-3: Shared Reality Reception
**As a** recipient of a shared reality URL,  
**I want** to see the Grove through the sender's lens,  
**So that** I understand their perspective without creating an account.

**Acceptance Criteria:**
- AC-3.1: `?share=` param detected → ephemeral lens created
- AC-3.2: Ephemeral lens triggers reality collapse
- AC-3.3: Badge shows "Viewing: [Sender's Label]"
- AC-3.4: Option to "Save to My Library" (creates persistent custom lens)
- AC-3.5: Invalid/malformed share param → graceful fallback to Base Reality

### US-4: Archetype Lens Backwards Compatibility
**As a** user selecting a built-in archetype (engineer, academic, etc.),  
**I want** the experience to work as before,  
**So that** v0.13 functionality is preserved.

**Acceptance Criteria:**
- AC-4.1: Archetype lenses use cached/pre-generated content (no LLM call)
- AC-4.2: Deep linking (`?lens=engineer`) works as before
- AC-4.3: Typewriter animation triggers on lens change
- AC-4.4: No visual regression from v0.13

### US-5: Generation Failure Graceful Degradation
**As a** user whose reality generation fails or times out,  
**I want** a seamless fallback experience,  
**So that** I don't see errors or broken UI.

**Acceptance Criteria:**
- AC-5.1: Timeout at 2000ms triggers fallback
- AC-5.2: API error triggers fallback
- AC-5.3: Fallback renders Base Reality instantly
- AC-5.4: No error UI shown to user (silent degradation)
- AC-5.5: Console logs failure for debugging

---

## Technical Requirements

### TR-1: Rhetorical Skeleton Constraints
The LLM MUST generate content that matches these patterns:

```
HERO:
  headline: [2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].
  subtext: ["Not [X]. Not [Y].", "[Z]."]

PROBLEM:
  tension: ["[What THEY do].", "[What WE do]."]
  quotes: [
    { text: "[Relevant constraint quote]", author: "[ALL CAPS NAME]", title: "[ROLE]" }
  ]
```

### TR-2: API Endpoint Specification

```
POST /api/collapse

Request:
{
  "persona": {
    "publicLabel": string,
    "toneGuidance": string,
    "narrativeStyle": "evidence-first" | "stakes-heavy" | "mechanics-deep" | "resolution-oriented",
    "arcEmphasis": { hook: 1-4, stakes: 1-4, mechanics: 1-4, evidence: 1-4, resolution: 1-4 }
  }
}

Response (success):
{
  "reality": {
    "hero": { "headline": string, "subtext": string[] },
    "problem": {
      "quotes": [{ "text": string, "author": string, "title": string }],
      "tension": string[]
    }
  },
  "cached": boolean,
  "generationTimeMs": number
}

Response (error):
{
  "error": string,
  "fallback": true
}
```

### TR-3: URL Encoding Specification

```
Share URL: grove.foundation/?share=<lz-string-compressed-base64>

Encoded payload:
{
  "v": "1",  // Version for forward compatibility
  "l": "The Pragmatic Optimist",  // publicLabel
  "t": "[PERSONA: Pragmatic Optimist]...",  // toneGuidance (first 500 chars)
  "s": "resolution-oriented",  // narrativeStyle
  "c": "fig"  // color
}

NOT encoded (privacy):
- userInputs (encrypted personal data)
- archetypeMapping (internal routing)
- createdAt, lastUsedAt (metadata)
```

### TR-4: Cache Strategy

| Cache Layer | Scope | TTL | Key Format |
|-------------|-------|-----|------------|
| Memory (Map) | Tab lifetime | None | `persona-{hash(toneGuidance)}` |
| sessionStorage | Session | None | `grove-reality-{hash}` |

### TR-5: Tuning Phase Visual

```typescript
// New phase in WaveformCollapse
type Phase = 'idle' | 'tuning' | 'collapsing' | 'observing' | 'forming';

// Tuning phase behavior:
// - Duration: Until generation completes (max 2s)
// - Visual: Cursor cycles through glyphs: ▓ ▒ ░ ▒ ▓
// - Trigger: When `isGenerating` prop is true
```

---

## Non-Functional Requirements

### NFR-1: Performance
- Generation MUST complete or timeout within 2000ms
- Cache hit MUST render within 50ms
- Fallback MUST render within 100ms

### NFR-2: Privacy
- Shared URLs MUST NOT contain encrypted user inputs
- Console logs MUST NOT expose personal data
- Server logs MUST NOT persist generated content

### NFR-3: Reliability
- System MUST function with API unavailable (fallback mode)
- Invalid URLs MUST NOT crash application
- Concurrent generation requests MUST be deduplicated

---

## Out of Scope

| Feature | Reason | Future Sprint |
|---------|--------|---------------|
| Lens marketplace | Requires backend storage | v0.16 |
| Multi-screen collapse | Hero + Problem sufficient for demo | v0.15 |
| Analytics on reality performance | Need baseline first | v0.15 |
| Edit shared lens before saving | Complexity | v0.16 |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Generation success rate | >95% | Server logs |
| P95 generation latency | <1500ms | Server timing |
| Fallback activation rate | <5% | Client analytics |
| Share URL click-through | Baseline | UTM tracking |

---

## Dependencies

### Internal
- v0.13 WaveformCollapse component
- Existing Gemini integration in server.js
- useNarrativeEngine hook

### External
- `lz-string` package for URL compression
- Gemini 2.0 Flash API availability

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Generated content off-brand | Medium | High | Strict rhetorical skeleton |
| API latency spikes | Medium | Medium | Aggressive 2s timeout |
| URL too long for sharing | Low | Medium | LZ-String compression |
| Prompt injection via toneGuidance | Low | High | Sanitize before prompt injection |
