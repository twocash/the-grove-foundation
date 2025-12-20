# v0.14 Reality Projector — EXECUTION_PROMPT

## For Claude Code CLI

Copy this entire prompt into Claude Code to execute the sprint.

---

## Context

You are implementing v0.14 "Reality Projector" for The Grove Foundation. This sprint transforms the static Quantum Interface (v0.13) into a generative system where custom lenses collapse reality via constrained LLM generation.

**Repository:** `C:\GitHub\the-grove-foundation`
**Previous Sprint:** v0.13 Quantum Interface (static lens-to-content mapping)
**Goal:** Custom lenses generate personalized landing page content via rhetorical skeleton constraints

## Pre-Flight Checklist

Before starting, verify:
```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean
npm run build  # Should pass
```

## Implementation Sequence

Execute these phases in order. Run `npm run build` after each phase to verify.

---

### Phase 1: Dependencies

```bash
npm install lz-string
npm install --save-dev @types/lz-string
npm run build
```

---

### Phase 2: Core Infrastructure

Create these files:

**1. `src/core/transformers/RhetoricalSkeleton.ts`**
```typescript
// Rhetorical constraints that enforce Grove's design language
export const RHETORICAL_SKELETON = {
  hero: {
    headline: {
      pattern: '[2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].',
      examples: [
        'LATENCY IS THE MIND KILLER.',
        'THE EPISTEMIC COMMONS.',
        'COMPOUNDING INTELLIGENCE.'
      ],
      maxLength: 40
    },
    subtext: {
      pattern: '"Not [X]. Not [Y]. Not [Z]." / "[Possessive]."',
      maxLines: 2
    }
  },
  problem: {
    tension: {
      pattern: '[What THEY do] vs [What WE do]',
      maxLines: 2
    },
    quotes: { count: 3 }
  }
};

export const COLLAPSE_SYSTEM_PROMPT = `You are the Grove's Reality Collapser. Your task is to perceive the Grove's landing page through a specific persona's worldview.

The Grove is distributed AI infrastructure. Core thesis: "Intelligence is a fluid resource shaped by the user, not the provider."

RHETORICAL CONSTRAINTS (follow EXACTLY):

HERO HEADLINE:
- Format: [2-4 WORDS]. [ABSTRACT NOUN]. [PERIOD].
- ALL CAPS, ends with period
- Examples: "LATENCY IS THE MIND KILLER." / "THE EPISTEMIC COMMONS."

HERO SUBTEXT:
- Line 1: "Not [X]. Not [Y]. Not [Z]." (what it ISN'T)
- Line 2: Single word/phrase of what it IS (e.g., "Yours." / "Open.")

TENSION:
- Line 1: What THEY (Big Tech) do
- Line 2: What WE do instead

QUOTES:
- 3 quotes from authorities the persona respects
- Author names ALL CAPS, short titles

OUTPUT (JSON only):
{
  "hero": {
    "headline": "HEADLINE.",
    "subtext": ["Not X. Not Y. Not Z.", "Word."]
  },
  "problem": {
    "quotes": [
      { "text": "...", "author": "NAME", "title": "TITLE" },
      { "text": "...", "author": "NAME", "title": "TITLE" },
      { "text": "...", "author": "NAME", "title": "TITLE" }
    ],
    "tension": ["What they do.", "What we do."]
  }
}`;
```

**2. `src/core/cache/RealityCache.ts`**
```typescript
import { LensReality } from '../../data/quantum-content';

const SESSION_PREFIX = 'grove-reality-';

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export class RealityCache {
  private memory: Map<string, LensReality> = new Map();

  getCacheKey(toneGuidance: string): string {
    return `persona-${hashString(toneGuidance)}`;
  }

  get(key: string): LensReality | null {
    if (this.memory.has(key)) return this.memory.get(key)!;
    try {
      const stored = sessionStorage.getItem(SESSION_PREFIX + key);
      if (stored) {
        const reality = JSON.parse(stored) as LensReality;
        this.memory.set(key, reality);
        return reality;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  set(key: string, reality: LensReality): void {
    this.memory.set(key, reality);
    try {
      sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(reality));
    } catch (e) { /* ignore */ }
  }

  has(key: string): boolean { return this.get(key) !== null; }
  
  clear(): void {
    this.memory.clear();
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith(SESSION_PREFIX))
        .forEach(k => sessionStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  }
}

export const realityCache = new RealityCache();
```

**3. `src/core/cache/index.ts`**
```typescript
export { RealityCache, realityCache } from './RealityCache';
```

**4. `src/core/transformers/RealityCollapser.ts`**
```typescript
import { LensReality, DEFAULT_REALITY } from '../../data/quantum-content';
import { CustomLens } from '../schema/lens';
import { Persona } from '../../data/narratives-schema';
import { realityCache } from '../cache';

type PersonaOrLens = Persona | CustomLens;

interface CollapseResult {
  reality: LensReality;
  fromCache: boolean;
  generationTimeMs?: number;
}

export class RealityCollapser {
  private pending: Map<string, Promise<LensReality>> = new Map();

  async collapse(
    persona: PersonaOrLens,
    options: { maxLatency?: number; forceRegenerate?: boolean } = {}
  ): Promise<CollapseResult> {
    const { maxLatency = 2000, forceRegenerate = false } = options;
    const cacheKey = realityCache.getCacheKey(persona.toneGuidance);

    if (!forceRegenerate) {
      const cached = realityCache.get(cacheKey);
      if (cached) return { reality: cached, fromCache: true };
    }

    if (this.pending.has(cacheKey)) {
      const reality = await this.pending.get(cacheKey)!;
      return { reality, fromCache: false };
    }

    const startTime = Date.now();
    const promise = this.generateWithTimeout(persona, maxLatency);
    this.pending.set(cacheKey, promise);

    try {
      const reality = await promise;
      realityCache.set(cacheKey, reality);
      return { reality, fromCache: false, generationTimeMs: Date.now() - startTime };
    } catch (error) {
      console.warn('[RealityCollapser] Fallback:', error);
      return { reality: DEFAULT_REALITY, fromCache: false };
    } finally {
      this.pending.delete(cacheKey);
    }
  }

  private async generateWithTimeout(persona: PersonaOrLens, maxLatency: number): Promise<LensReality> {
    return Promise.race([
      this.callAPI(persona),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), maxLatency))
    ]);
  }

  private async callAPI(persona: PersonaOrLens): Promise<LensReality> {
    const res = await fetch('/api/collapse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        persona: {
          publicLabel: persona.publicLabel,
          toneGuidance: persona.toneGuidance,
          narrativeStyle: persona.narrativeStyle,
          arcEmphasis: persona.arcEmphasis
        }
      })
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.reality;
  }
}

export const realityCollapser = new RealityCollapser();
```

**5. `src/core/transformers/index.ts`**
```typescript
export { RHETORICAL_SKELETON, COLLAPSE_SYSTEM_PROMPT } from './RhetoricalSkeleton';
export { RealityCollapser, realityCollapser } from './RealityCollapser';
```

**6. Update `src/core/index.ts`** - Add these exports:
```typescript
export * from './transformers';
export * from './cache';
```

```bash
npm run build  # Verify Phase 2
```

---

### Phase 3: Server Endpoint

Add to `server.js` after the `/api/generate-lens` endpoint (around line 1680):

```javascript
// ============================================================================
// Reality Collapse API (v0.14)
// ============================================================================

const REALITY_COLLAPSE_PROMPT = `You are the Grove's Reality Collapser. Generate content for a persona.

CONSTRAINTS:
- HERO HEADLINE: [2-4 WORDS]. [ABSTRACT NOUN]. ALL CAPS, period.
- HERO SUBTEXT: Line 1 "Not X. Not Y. Not Z." / Line 2 single word like "Yours."
- TENSION: Line 1 what THEY do / Line 2 what WE do
- QUOTES: 3 quotes, author ALL CAPS, short title

OUTPUT JSON ONLY:
{"hero":{"headline":"...","subtext":["...",".."]},"problem":{"quotes":[{"text":"...","author":"...","title":"..."}],"tension":["...","..."]}}`;

app.post('/api/collapse', async (req, res) => {
  const startTime = Date.now();
  try {
    const { persona } = req.body;
    if (!persona?.toneGuidance) {
      return res.status(400).json({ error: 'Missing toneGuidance', fallback: true });
    }

    const sanitizedTone = persona.toneGuidance.substring(0, 1000).replace(/[<>{}```]/g, '');
    const prompt = `${REALITY_COLLAPSE_PROMPT}

PERSONA: ${persona.publicLabel || 'Custom'}
TONE: ${sanitizedTone}
STYLE: ${persona.narrativeStyle || 'balanced'}

Generate collapsed reality. JSON only.`;

    console.log('[Collapse] Generating for:', persona.publicLabel || 'Custom');

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.7 }
    });

    let reality;
    try {
      reality = JSON.parse(result.text);
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON in response');
      reality = JSON.parse(match[0]);
    }

    if (!reality.hero?.headline || !reality.problem?.quotes) {
      throw new Error('Invalid structure');
    }

    console.log(`[Collapse] Done in ${Date.now() - startTime}ms`);
    res.json({ reality, cached: false, generationTimeMs: Date.now() - startTime });
  } catch (error) {
    console.error('[Collapse] Error:', error.message);
    res.status(500).json({ error: error.message, fallback: true });
  }
});
```

```bash
npm run build  # Verify Phase 3
```

---

### Phase 4: Update useQuantumInterface Hook

Replace `src/surface/hooks/useQuantumInterface.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { LensReality, DEFAULT_REALITY, SUPERPOSITION_MAP } from '../../data/quantum-content';
import { realityCollapser } from '../../core/transformers';

interface UseQuantumInterfaceReturn {
  reality: LensReality;
  activeLens: string | null;
  quantumTrigger: string | null;
  isCollapsing: boolean;
}

export const useQuantumInterface = (): UseQuantumInterfaceReturn => {
  const { session, getPersonaById } = useNarrativeEngine();
  const [reality, setReality] = useState<LensReality>(DEFAULT_REALITY);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [currentLensId, setCurrentLensId] = useState<string | null>(null);

  const resolveReality = useCallback(async (lensId: string | null) => {
    if (!lensId) {
      setReality(DEFAULT_REALITY);
      setIsCollapsing(false);
      return;
    }

    // Archetype = use pre-defined
    const archetypeReality = SUPERPOSITION_MAP[lensId as keyof typeof SUPERPOSITION_MAP];
    if (archetypeReality) {
      setReality(archetypeReality);
      setIsCollapsing(false);
      return;
    }

    // Custom = generate
    const persona = getPersonaById?.(lensId);
    if (!persona) {
      setReality(DEFAULT_REALITY);
      setIsCollapsing(false);
      return;
    }

    setIsCollapsing(true);
    try {
      const result = await realityCollapser.collapse(persona);
      setReality(result.reality);
    } catch {
      setReality(DEFAULT_REALITY);
    } finally {
      setIsCollapsing(false);
    }
  }, [getPersonaById]);

  useEffect(() => {
    if (session.activeLens !== currentLensId) {
      setCurrentLensId(session.activeLens);
      resolveReality(session.activeLens);
    }
  }, [session.activeLens, currentLensId, resolveReality]);

  useEffect(() => { resolveReality(session.activeLens); }, []);

  return { reality, activeLens: session.activeLens, quantumTrigger: session.activeLens, isCollapsing };
};

export default useQuantumInterface;
```

**Note:** Add `getPersonaById` to useNarrativeEngine's return. In `hooks/useNarrativeEngine.ts`:

```typescript
// Add to the hook's return object
const getPersonaById = useCallback((id: string) => {
  if (DEFAULT_PERSONAS[id]) return DEFAULT_PERSONAS[id];
  // Check ephemeral lenses from sessionStorage
  try {
    const ephemeral = sessionStorage.getItem(`grove-ephemeral-${id}`);
    if (ephemeral) return JSON.parse(ephemeral);
  } catch {}
  return undefined;
}, []);

// Add to UseNarrativeEngineReturn interface and return statement
```

```bash
npm run build  # Verify Phase 4
```

---

### Phase 5: Tuning Phase Visual

Update `src/surface/components/effects/WaveformCollapse.tsx`:

1. Add `isGenerating?: boolean` to props interface
2. Add tuning glyph animation:

```typescript
// Add to imports/constants
const TUNING_GLYPHS = ['▓', '▒', '░', '▒'];

// Add state
const [tuningIndex, setTuningIndex] = useState(0);

// Add effect for tuning animation
useEffect(() => {
  if (isGenerating) {
    const interval = setInterval(() => {
      setTuningIndex(prev => (prev + 1) % TUNING_GLYPHS.length);
    }, 200);
    return () => clearInterval(interval);
  }
}, [isGenerating]);

// Update cursor render to show tuning glyph when isGenerating
{(phase !== 'idle' || isGenerating) && (
  <span className="inline-block w-[0.5em] h-[1em] ml-0.5">
    {isGenerating ? TUNING_GLYPHS[tuningIndex] : '▌'}
  </span>
)}
```

Update `src/surface/components/genesis/HeroHook.tsx`:
- Add `isCollapsing?: boolean` to props
- Pass `isGenerating={isCollapsing}` to WaveformCollapse

Update `src/surface/pages/GenesisPage.tsx`:
- Destructure `isCollapsing` from `useQuantumInterface()`
- Pass `isCollapsing={isCollapsing}` to HeroHook

```bash
npm run build  # Verify Phase 5
```

---

### Phase 6: Lens Serializer (Sharing)

Create `src/utils/lensSerializer.ts`:

```typescript
import LZString from 'lz-string';
import { CustomLens, NarrativeStyle, PersonaColor } from '../types/lens';

interface SharePayload {
  v: '1';
  l: string;  // label
  t: string;  // tone (truncated)
  s: NarrativeStyle;
  c: PersonaColor | 'purple';
}

export function serializeLens(lens: CustomLens): string {
  const payload: SharePayload = {
    v: '1',
    l: lens.publicLabel,
    t: lens.toneGuidance.substring(0, 500),
    s: lens.narrativeStyle,
    c: lens.color
  };
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

export function deserializeLens(encoded: string): Partial<CustomLens> | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const p = JSON.parse(json) as SharePayload;
    if (p.v !== '1' || !p.l || !p.t) return null;
    return {
      publicLabel: p.l,
      toneGuidance: p.t,
      narrativeStyle: p.s,
      color: p.c || 'fig',
      isCustom: true,
      icon: 'Sparkles',
      enabled: true,
      arcEmphasis: { hook: 3, stakes: 3, mechanics: 2, evidence: 2, resolution: 3 },
      openingPhase: 'stakes',
      defaultThreadLength: 5,
      entryPoints: [],
      suggestedThread: []
    };
  } catch { return null; }
}

export function generateShareUrl(lens: CustomLens): string {
  return `${window.location.origin}/?share=${serializeLens(lens)}`;
}
```

```bash
npm run build  # Verify Phase 6
```

---

### Phase 7: Share URL Handling

Update `hooks/useNarrativeEngine.ts` - modify `getInitialLens()`:

```typescript
import { deserializeLens } from '../src/utils/lensSerializer';

// Add before getInitialLens
const getInitialShare = (): string | null => {
  if (typeof window === 'undefined') return null;
  const shareParam = new URLSearchParams(window.location.search).get('share');
  if (!shareParam) return null;
  
  const config = deserializeLens(shareParam);
  if (!config) return null;
  
  const ephemeralId = `shared-${Date.now()}`;
  sessionStorage.setItem(`grove-ephemeral-${ephemeralId}`, JSON.stringify({
    ...config,
    id: ephemeralId,
    isEphemeral: true,
    createdAt: new Date().toISOString()
  }));
  return ephemeralId;
};

// Update getInitialLens - add share check first
const getInitialLens = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // 1. Shared Reality (highest priority)
  const shared = getInitialShare();
  if (shared) return shared;
  
  // 2. Quantum deep link
  const lensParam = new URLSearchParams(window.location.search).get('lens');
  if (lensParam && DEFAULT_PERSONAS[lensParam]) return lensParam;
  
  // 3. localStorage
  try {
    return localStorage.getItem(STORAGE_KEY_LENS);
  } catch { return null; }
};
```

```bash
npm run build  # Verify Phase 7
```

---

### Phase 8: Final Verification

```bash
npm run build
npm run dev
```

**Manual Tests:**
1. Visit `/` → "YOUR AI." (Base Reality)
2. Visit `/?lens=engineer` → "LATENCY IS THE MIND KILLER." (instant)
3. Create custom lens → See tuning indicator (▓▒░) → Generated content
4. Refresh → Custom lens content instant (cached)
5. Share button copies URL → Open in incognito → Same generated experience

---

## Commit Sequence

```bash
git add -A && git commit -m "feat(v0.14): add lz-string dependency"
git add -A && git commit -m "feat(v0.14): implement reality collapse infrastructure"
git add -A && git commit -m "feat(v0.14): add /api/collapse endpoint"
git add -A && git commit -m "feat(v0.14): update useQuantumInterface for generative collapse"
git add -A && git commit -m "feat(v0.14): add tuning phase visual"
git add -A && git commit -m "feat(v0.14): implement lens serialization and sharing"
git add -A && git commit -m "feat(v0.14): handle ?share= URL parameter"
```

---

## Success Criteria

- [ ] Custom lens shows tuning indicator during generation
- [ ] Generated content follows rhetorical skeleton patterns
- [ ] Generation completes <2s or falls back to Base Reality
- [ ] Archetype lenses work instantly (no generation)
- [ ] Share URLs work for recipients
- [ ] `npm run build` passes
- [ ] No console errors in production

---

## Troubleshooting

**Build fails on LensReality import:**
Check that `src/data/quantum-content.ts` exports `LensReality` and `DEFAULT_REALITY`.

**API returns 500:**
Check server logs. Verify Gemini API key is set in environment.

**Tuning indicator doesn't show:**
Verify `isCollapsing` is wired through: `useQuantumInterface` → `GenesisPage` → `HeroHook` → `WaveformCollapse`.

**Share URL too long:**
LZ-String should compress to ~200 chars. If longer, check toneGuidance isn't bloated.
