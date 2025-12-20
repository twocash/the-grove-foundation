// src/core/cache/RealityCache.ts
// Session-scoped cache for generated realities
// v0.14: Reality Projector

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
