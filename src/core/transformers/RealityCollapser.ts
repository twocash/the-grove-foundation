// src/core/transformers/RealityCollapser.ts
// Client-side reality generation with caching
// v0.14: Reality Projector

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
