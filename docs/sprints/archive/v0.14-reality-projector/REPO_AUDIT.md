# v0.14 Reality Projector — REPO_AUDIT

## Sprint Context

**Previous:** v0.13 "Quantum Interface" established static lens-to-content mapping with typewriter animation  
**Current:** v0.14 "Reality Projector" replaces static map with generative collapse  
**Goal:** Custom lenses generate personalized landing page realities via constrained LLM generation

---

## Current State Analysis

### What v0.13 Built (Foundation to Build On)

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `WaveformCollapse.tsx` | `src/surface/components/effects/` | ✅ Ready | 4-phase state machine, configurable speeds |
| `useQuantumInterface.ts` | `src/surface/hooks/` | 🔄 Modify | Currently reads from static map |
| `quantum-content.ts` | `src/data/` | ⚠️ Replace | Static SUPERPOSITION_MAP → RealityCollapser |
| Deep linking | `hooks/useNarrativeEngine.ts` | ✅ Ready | `getInitialLens()` handles `?lens=` param |
| Trigger pattern | `HeroHook.tsx`, `ProblemStatement.tsx` | ✅ Ready | Accept `trigger` prop for animation restart |

### Existing Infrastructure to Leverage

| Component | Location | Purpose | Reuse Plan |
|-----------|----------|---------|------------|
| Gemini client | `server.js` | Initialized `@google/genai` | Use for `/api/collapse` |
| `/api/generate-lens` | `server.js:1609` | Generates lens personas | Pattern for collapse endpoint |
| `LENS_GENERATOR_PROMPT` | `server.js:1565` | System prompt for lens gen | Adapt for rhetorical skeleton |
| `useCustomLens.ts` | `hooks/` | Manages custom lens storage | Read custom lenses for collapse |
| `LensReality` interface | `src/data/quantum-content.ts` | Content shape | Keep as output interface |

### Files to CREATE

| File | Purpose | Dependencies |
|------|---------|--------------|
| `src/core/transformers/RealityCollapser.ts` | Main collapse service | fetch, LensReality |
| `src/core/transformers/RhetoricalSkeleton.ts` | Constraint definitions | None |
| `src/core/transformers/index.ts` | Barrel export | Above files |
| `src/core/cache/RealityCache.ts` | Session + memory cache | None |
| `src/core/cache/index.ts` | Barrel export | Above file |
| `src/utils/lensSerializer.ts` | Encode/decode lens for URL | CustomLens type |
| Server: `/api/collapse` endpoint | `server.js` addition | Gemini, prompt |

### Files to MODIFY

| File | Change | Lines Affected |
|------|--------|----------------|
| `src/surface/hooks/useQuantumInterface.ts` | Use RealityCollapser instead of getReality() | ~30 lines |
| `src/surface/components/effects/WaveformCollapse.tsx` | Add 'tuning' phase with scanning cursor | ~20 lines |
| `hooks/useNarrativeEngine.ts` | Handle `?share=` param for shared realities | ~15 lines |
| `components/Terminal/TerminalHeader.tsx` | Add "Share This View" button | ~10 lines |
| `server.js` | Add `/api/collapse` endpoint | ~80 lines |

### Dependencies Verified

```json
{
  "@google/genai": "✅ Already installed",
  "base64-js": "✅ Already installed (via other deps)",
  "lz-string": "❌ Need to install (for URL compression)"
}
```

---

## Architecture Decisions Required

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Generation location | Client-side vs Server-side | **Server-side** (API key security) |
| Cache strategy | sessionStorage vs memory vs both | **Both** (memory for instant, session for refresh) |
| Fallback trigger | Timeout only vs error-based | **Timeout + error** (2s max, any failure) |
| Share URL encoding | Base64 vs LZ-String compressed | **LZ-String** (shorter URLs) |
| Tuning indicator | Blinking cursor vs scanning glyphs | **Scanning** (shows AI activity) |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Generation latency >2s | Medium | High | Aggressive timeout + instant fallback |
| Off-brand generated content | Medium | High | Rhetorical skeleton constraints |
| Malformed shared URLs | Low | Medium | Validation + graceful fallback |
| API rate limits | Low | Medium | Cache aggressively |
| Custom lens privacy leak | Low | High | Strip userInputs from serialization |

---

## Test Matrix

| Scenario | Expected Behavior |
|----------|-------------------|
| Default lens load | Base Reality renders instantly |
| Archetype lens (engineer) | Cached if visited before, else generate |
| Custom lens first visit | Show tuning → generate → cache → render |
| Custom lens revisit | Instant from cache |
| Generation timeout | Fall back to Base Reality within 2s |
| Shared URL valid | Inflate lens → generate/cache → render |
| Shared URL malformed | Fall back to Base Reality |
| Share button click | Copy URL to clipboard, show toast |

---

## Sprint Scope Boundaries

### IN SCOPE (v0.14)
- RealityCollapser service with rhetorical constraints
- `/api/collapse` endpoint
- Tuning phase visual
- Share URL generation and parsing
- Cache layer (session + memory)
- "Share This View" button in Terminal

### OUT OF SCOPE (Future)
- Lens marketplace / registry
- Saved shared lenses to library
- A/B testing of generated content
- Analytics on which realities convert
- Multi-screen collapse (only Hero + Problem for now)

---

## Definition of Done

- [ ] Custom lens generates coherent Hero + Problem content
- [ ] Generation completes <2s or falls back gracefully
- [ ] Tuning indicator visible during generation
- [ ] Share URL works for recipient (no account needed)
- [ ] Brand voice preserved via rhetorical skeleton
- [ ] All v0.13 functionality preserved (archetypes still work)
- [ ] Production build passes
- [ ] Manual verification of all test scenarios
