// src/utils/lensSerializer.ts
// Lens compression and URL sharing
// v0.14: Reality Projector

import LZString from 'lz-string';
import { CustomLens, NarrativeStyle, PersonaColor } from '../../types/lens';

interface SharePayload {
  v: '1';
  l: string;  // label
  t: string;  // tone (truncated)
  s: NarrativeStyle;
  c: PersonaColor | 'purple';
}

/**
 * Compress a custom lens into a URL-safe string
 */
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

/**
 * Decompress a shared lens string back into lens config
 */
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
  } catch {
    return null;
  }
}

/**
 * Generate a full share URL for a custom lens
 */
export function generateShareUrl(lens: CustomLens): string {
  return `${window.location.origin}/?share=${serializeLens(lens)}`;
}
