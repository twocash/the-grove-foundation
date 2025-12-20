# The Reality Projector: Architectural Vision

## The Meta-Thesis

The Grove isn't a website with a chatbot. It's a **demonstration of its own thesis**.

**The Claim:** "Intelligence is a fluid resource that should be shaped by the user, not the provider."

**The Problem:** A static landing page contradicts this claim. Fixed marketing copy says, "We decided how you should see us."

**The Solution:** When you define a worldview (Lens), the Grove doesn't just *tell* you it understands—it **demonstrates** understanding by rewriting its own existence through your eyes.

This is the Observer Effect made tangible. The act of looking changes what you see.

---

## What v0.13 Proved

v0.13 "Quantum Interface" established the **mechanical foundation**:

| Component | Status | Purpose |
|-----------|--------|---------|
| `WaveformCollapse.tsx` | ✅ Built | Typewriter animation with phase state machine |
| `useQuantumInterface.ts` | ✅ Built | State bridge between lens and reality |
| `quantum-content.ts` | ✅ Built | Static content map (to be replaced) |
| Deep linking | ✅ Built | `?lens=engineer` resolves before render |
| Trigger pattern | ✅ Built | Content morphs on lens change |

**What we proved:**
- The visual language works (un-type → pause → re-type)
- The architecture separates content from presentation
- Deep links enable viral distribution

**What we didn't prove:**
- That custom lenses produce coherent experiences
- That generative collapse maintains brand voice
- That the viral loop converts

---

## The v0.14 Architecture: Generative Collapse

### The Transformation

```
v0.13 (Static Collapse):
Lens ID → Hardcoded Map → Content → Render

v0.14 (Generative Collapse):
Persona Definition → Rhetorical Skeleton → LLM → Content → Cache → Render
         ↓
    [Fallback to Base Reality if generation fails or latency > 2s]
```

### The Key Insight: Rhetorical Skeletons

We're not asking an LLM to "write marketing copy." We're asking it to fill a **structural beat sheet** that enforces Grove's design language:

```typescript
interface RhetoricalSkeleton {
  hero: {
    headline: "[2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].",
    subtext: "Not [X]. Not [Y]. [Z]."
  },
  problem: {
    tensionFrame: "[INDUSTRY LIE] vs [SOVEREIGN TRUTH]",
    quotePattern: "[AUTHORITY VOICE] on [RELEVANT CONSTRAINT]"
  }
}
```

**Examples of valid collapse:**
- Engineer: "LATENCY IS THE MIND KILLER." / "Not centralized. Not rented. Yours."
- Academic: "THE EPISTEMIC COMMONS." / "Not enclosed. Not proprietary. Open."
- Poet: "THE GARDEN OF FORKING THOUGHTS." / "Not algorithmic. Not optimized. Alive."

The skeleton constrains; the LLM provides persona-appropriate vocabulary.

---

## System Architecture

### New Components

```
src/core/transformers/
├── RealityCollapser.ts     # Generative collapse service
├── RhetoricalSkeleton.ts   # Constraint definitions
└── index.ts

src/core/cache/
├── RealityCache.ts         # sessionStorage + in-memory
└── index.ts
```

### RealityCollapser Service

Key responsibilities:
1. Check cache before generation
2. Call `/api/collapse` with timeout
3. Deduplicate concurrent requests
4. Fallback to Base Reality on failure

### Visual State: The "Tuning" Indicator

When generation is in progress, the UI shows a distinct "tuning" state:

```typescript
type Phase = 'idle' | 'tuning' | 'collapsing' | 'observing' | 'forming';

// 'tuning' phase shows a scanning cursor (cycles through glyphs: ▓ ▒ ░)
// This indicates: "The AI is perceiving itself through your eyes"
```

The cursor doesn't just blink—it **scans**, suggesting the Grove is actively reprocessing itself.

---

## The Viral Loop: Shared Realities

### Stateless Sharing (v0.14 MVP)

```
URL Format: grove.foundation/?share=<base64_encoded_lens_config>

What's encoded:
- toneGuidance (the soul of the lens)
- narrativeStyle
- publicLabel
- color

What's NOT encoded (privacy):
- User inputs (encrypted fields)
- Personal identifiers
```

### The Experience

1. **Creator:** Makes a "Solarpunk Optimist" lens
2. **Creator:** Clicks "Share This View" → URL copied
3. **Recipient:** Opens `grove.foundation/?share=xyz...`
4. **Recipient sees:**
   - Headline morphing to: "THE FUTURE IS GROWN, NOT BUILT."
   - Badge: "Viewing Shared Lens: Solarpunk Optimist"
   - Option: "Save to My Library"

The recipient experiences the Grove through the sender's eyes. This isn't personalization—it's **perspectival transmission**.

---

## The Meta Point

This architecture demonstrates that:

1. **Intelligence is fluid** — The same content reshapes based on observer
2. **The user shapes the system** — Not the reverse
3. **Sharing is perspectival** — Not just links, but worldviews

If the Grove can rewrite its own marketing in real-time based on who's looking, imagine what it can do with your data, your research, your work.

**The landing page IS the product demo.**

---

## Implementation Sequence

### Phase 1: Foundation (1-2 days)
1. Create `RealityCollapser.ts` service
2. Create `/api/collapse` endpoint
3. Add "tuning" phase to `WaveformCollapse`

### Phase 2: Integration (1 day)
4. Update `useQuantumInterface` to use `RealityCollapser`
5. Implement sessionStorage caching
6. Add error boundaries with Base Reality fallback

### Phase 3: Viral Loop (1-2 days)
7. Create `serializeLens()` / `deserializeLens()` utilities
8. Add "Share This View" button to Terminal
9. Handle `?share=` param in `useNarrativeEngine`

### Phase 4: Polish (1 day)
10. Tune generation latency / timeout
11. Add analytics: `trackRealityGenerated`, `trackSharedRealityOpened`
12. Test edge cases: malformed shares, generation failures

---

## Success Criteria

1. **Custom lens creates coherent reality** — Not just different, but *resonant*
2. **Generation completes in <2s** — Or gracefully falls back
3. **Shared links work** — Recipient sees sender's reality without account
4. **Brand voice preserved** — Rhetorical skeleton prevents off-brand drift
5. **The "aha" moment lands** — "This isn't a website. The entire environment is a projection."

---

## What This Unlocks

**For users:**
- Create a worldview → See the Grove through it
- Share that view → Others experience your perspective
- Save interesting lenses → Build a library of perspectives

**For Grove:**
- Viral distribution via perspectival links
- Data on which worldviews resonate
- Proof of the core thesis: intelligence shaped by user, not provider

**For the project:**
- The landing page becomes the product demo
- Static marketing becomes impossible to copy (it's generative)
- The Observer Effect becomes tangible

---

## The Art of It

The Grove isn't just a platform. It's a **mirror that shows you yourself through the lens of distributed intelligence.**

When you create a lens, you're not customizing a product. You're teaching the Grove how you see. And then it shows you—itself, the world, your questions—through that vision.

This is what "meta experience bordering on art" means:

> The medium is the message.
> The interface is the thesis.
> The demonstration is the proof.

v0.13 built the mirror frame.
v0.14 makes it reflect.
