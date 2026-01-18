# Sprint v0.14 Reality Projector — Completed

**Completed:** 2025-12-20
**Status:** Ready for deployment

## Summary

Transformed the static Quantum Interface (v0.13) into a generative system where custom lenses collapse reality via constrained LLM generation. Pre-defined archetypes still use instant static content, but custom lenses now generate personalized landing page content following Grove's rhetorical skeleton.

## Features Delivered

### Phase 1: Dependencies
- Installed `lz-string` for URL compression
- Added TypeScript types

### Phase 2: Core Infrastructure
- Created `src/core/transformers/RhetoricalSkeleton.ts` - Rhetorical constraints
- Created `src/core/cache/RealityCache.ts` - Session-scoped cache with memory + sessionStorage
- Created `src/core/transformers/RealityCollapser.ts` - Client-side collapser with deduplication

### Phase 3: Server Endpoint
- Added `POST /api/collapse` endpoint to `server.js`
- Uses Gemini 2.0 Flash with JSON response mode
- Validates structure, falls back gracefully on error

### Phase 4: Hook Updates
- Added `getPersonaById` to `useNarrativeEngine` (includes ephemeral lenses)
- Updated `useQuantumInterface` to use RealityCollapser for custom lenses
- Returns `isCollapsing` state for loading UI

### Phase 5: Tuning Visual
- Added tuning glyphs (`▓▒░▒`) to `WaveformCollapse`
- Wired `isCollapsing` through: GenesisPage → HeroHook → WaveformCollapse
- Shows animated cursor during LLM generation

### Phase 6: Lens Serialization
- Created `src/utils/lensSerializer.ts`
- `serializeLens()` compresses lens config to URL-safe string
- `deserializeLens()` restores from compressed string
- `generateShareUrl()` creates full share URL

### Phase 7: Share URL Handling
- Added `getInitialShare()` to `useNarrativeEngine`
- `?share=` parameter takes highest priority
- Creates ephemeral lens in sessionStorage
- Ephemeral lens triggers generative collapse

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `src/core/transformers/RhetoricalSkeleton.ts` | Rhetorical constraints for LLM |
| `src/core/transformers/RealityCollapser.ts` | Client-side collapse orchestration |
| `src/core/transformers/index.ts` | Barrel export |
| `src/core/cache/RealityCache.ts` | Session cache with memory + storage |
| `src/core/cache/index.ts` | Barrel export |
| `src/utils/lensSerializer.ts` | LZ-String compression for sharing |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Added lz-string dependency |
| `server.js` | Added `/api/collapse` endpoint |
| `hooks/useNarrativeEngine.ts` | Added getPersonaById, getInitialShare |
| `src/surface/hooks/useQuantumInterface.ts` | Generative collapse for custom lenses |
| `src/surface/components/effects/WaveformCollapse.tsx` | Tuning glyph animation |
| `src/surface/components/genesis/HeroHook.tsx` | isCollapsing prop |
| `src/surface/pages/GenesisPage.tsx` | Wire isCollapsing through |
| `src/core/index.ts` | Export transformers and cache modules |

## API

### POST /api/collapse

Generates personalized landing page content for a custom lens.

**Request:**
```json
{
  "persona": {
    "publicLabel": "Custom Label",
    "toneGuidance": "Speak like a...",
    "narrativeStyle": "analytical",
    "arcEmphasis": { ... }
  }
}
```

**Response:**
```json
{
  "reality": {
    "hero": {
      "headline": "GENERATED HEADLINE.",
      "subtext": ["Not X. Not Y. Not Z.", "Custom."]
    },
    "problem": {
      "quotes": [...],
      "tension": ["...", "..."]
    }
  },
  "cached": false,
  "generationTimeMs": 1234
}
```

## Testing URLs

After deployment:
- **Default:** `/?lens=engineer` → Static archetype (instant)
- **Custom Lens:** Create via wizard → See tuning indicator → Generated content
- **Share Link:** `/?share=...` → Hydrates ephemeral lens → Generates content

## Architecture

```
User selects lens
       ↓
useQuantumInterface
       ↓
┌──────┴──────┐
│             │
Archetype?    Custom?
    ↓            ↓
SUPERPOSITION  realityCollapser.collapse()
   MAP              ↓
    ↓          Check cache
Instant!           ↓
              Hit?  Miss?
               ↓      ↓
            Cached   /api/collapse
               ↓         ↓
            Return    Gemini → Parse → Cache → Return
```

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Rhetorical skeleton constraints | Ensures generated content matches Grove's voice |
| Session cache (not localStorage) | Realities are ephemeral, recalculated per session |
| 2s timeout with fallback | UX > perfect content; fallback to Base Reality |
| LZ-String compression | ~90% reduction for share URLs |
| Ephemeral lens in sessionStorage | Share links don't pollute localStorage |

## Next Steps

1. Deploy to Cloud Run
2. Test custom lens wizard → see tuning indicator
3. Test share link flow in incognito
4. Monitor `/api/collapse` latency in logs
5. Add more rhetorical skeleton variations
