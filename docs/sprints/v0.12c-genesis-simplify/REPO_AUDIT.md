# Repository Audit — v0.12c Genesis Simplify

## Stack
- Framework: React 19 / Vite 6
- Language: TypeScript 5.8
- Build: Vite
- Styling: Tailwind v4
- Package Manager: npm

## Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
```

## Key Locations for This Sprint

| Concern | File | Lines | Notes |
|---------|------|-------|-------|
| ProductReveal | `src/surface/components/genesis/ProductReveal.tsx` | 1-247 | Animation + CTA |
| Foundation | `src/surface/components/genesis/Foundation.tsx` | 1-120 | Deep dive buttons + main CTA |
| AhaDemo | `src/surface/components/genesis/AhaDemo.tsx` | 1-107 | "Go deeper" CTA |
| Terminal Welcome | `components/Terminal.tsx` | 348-395 | First-time flow |
| Terminal Messages | `components/Terminal.tsx` | 460-550 | Chat message rendering |
| TerminalControls | `components/Terminal/TerminalControls.tsx` | 1-72 | Lens badge + controls |
| LensPicker | `components/Terminal/LensPicker.tsx` | 1-200 | Lens selection UI |
| ScrollIndicator | `src/surface/components/genesis/ScrollIndicator.tsx` | 1-30 | New seedling component |

## ProductReveal Analysis

**Animation Phases (lines 31):**
```typescript
type AnimationPhase = 'hidden' | 'pixelating' | 'revealed' | 'sprouting' | 'knocking' | 'settled';
```

**Current Animation Sequence (lines 57-87):**
- pixelating → revealed (1500ms)
- revealed → sprouting (2200ms)
- sprouting → knocking (2800ms)
- knocking → settled

**Headline Rendering (lines 115-156):**
- Complex THE/YOUR swap with absolute positioning
- Uses `textBlur` and `textOpacity` transforms
- YOUR overlays THE with opacity fade

**CTA (lines 189-196):**
```typescript
<button className="px-8 py-4 bg-grove-forest text-white...">
  See it in action
</button>
```

## Foundation Analysis

**Deep Dive Button Order (lines 78-96):**
1. The Ratchet
2. The Economics
3. The Vision

**Main CTA (lines 101-107):**
```typescript
<button onClick={handleExplore} className="...bg-grove-forest...">
  Explore
</button>
```

## AhaDemo Analysis

**CTA (lines 78-83):**
```typescript
<button className="...bg-grove-forest...">
  Go deeper
</button>
```

## Terminal Welcome Flow

**First-time Detection (lines 353-360):**
```typescript
const hasSelectedLens = localStorage.getItem('grove-terminal-lens') !== null ||
                        localStorage.getItem('grove-terminal-welcomed') === 'true';

if (terminalState.isOpen && !hasSelectedLens && !hasShownWelcome) {
  setShowLensPicker(true);
  setHasShownWelcome(true);
}
```

**Current Behavior:**
- First-time users see LensPicker modal
- No welcome message in chat
- No explanation of what Grove is

## Design Tokens (from globals.css)

```css
--color-grove-forest: #1B4332
--color-grove-clay: #C65D3B (orange - used for clickable/highlighted text)
--color-ink: #2D2A26
--color-paper: #F5F0E6
```

## Gaps Identified

1. **ProductReveal headline** is animated but illegible at completion
2. **No welcome message** when Terminal first opens
3. **CTA copy is vague** ("See it in action", "Explore", "Go deeper")
4. **Button order in Foundation** doesn't follow narrative arc
5. **Rain animation code** exists in ScrollIndicator but doesn't render
6. **Lens selector UI** uses cryptic colored dot, doesn't look clickable
