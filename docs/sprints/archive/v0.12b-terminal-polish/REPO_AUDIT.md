# Repository Audit — v0.12b Terminal Polish

## Stack
- Framework: React 18 + Vite
- Language: TypeScript 5.x
- Styling: Tailwind v4 with custom design tokens
- Animation: CSS keyframes + Tailwind utilities

## Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
```

## Key Locations for This Sprint

| Concern | File | Lines | Notes |
|---------|------|-------|-------|
| Markdown Renderer | `components/Terminal.tsx` | 52-175 | parseInline + MarkdownRenderer |
| Bold Click Handler | `components/Terminal.tsx` | 53-75 | ✅ Already implemented with clickable bold |
| Suggestion Chip | `components/Terminal/SuggestionChip.tsx` | 1-32 | Component exists |
| CognitiveBridge | `components/Terminal/CognitiveBridge.tsx` | 1-143 | Needs typing animation |
| Terminal Drawer | `components/Terminal.tsx` | 905-906 | duration-500 animation |
| Terminal Pill | `components/Terminal/TerminalPill.tsx` | 1-50 | Uses terminal-slide-up |
| CSS Animations | `styles/globals.css` | 162-195 | Terminal animations |
| ProductReveal | `src/surface/components/genesis/ProductReveal.tsx` | 1-276 | CTA + scroll indicator + YOUR animation |
| HeroHook | `src/surface/components/genesis/HeroHook.tsx` | 64-80 | Scroll indicator |
| ProblemStatement | `src/surface/components/genesis/ProblemStatement.tsx` | 126-136 | Scroll indicator |
| AhaDemo | `src/surface/components/genesis/AhaDemo.tsx` | 76-108 | CTA arrow + scroll indicator |
| Foundation | `src/surface/components/genesis/Foundation.tsx` | 77-129 | Multiple CTA arrows + scroll indicator |

## v0.12 Features Already Implemented

### ✅ Clickable Bold Text (lines 53-75)
```typescript
const parseInline = (text: string, onBoldClick?: (phrase: string) => void) => {
  // Bold text now renders as clickable button when handler provided
  if (onBoldClick) {
    return (
      <button
        onClick={() => onBoldClick(phrase)}
        className="text-grove-clay font-bold hover:underline..."
      >
        {phrase}
      </button>
    );
  }
  // ...
}
```

### ✅ MarkdownRenderer uses handleSuggestion (line 988)
```typescript
<MarkdownRenderer
  content={msg.text}
  onPromptClick={handleSuggestion}  // ← Tracks telemetry
/>
```

### ✅ handleSuggestion with telemetry (lines 813-816)
```typescript
const handleSuggestion = (hint: string) => {
  trackSuggestionClicked(hint);
  handleSend(hint);
};
```

## Gaps Identified

### 1. Animation Inconsistency
- Drawer: `transition-transform duration-500 ease-in-out` (line 906)
- Pill: `terminal-slide-up` with `cubic-bezier(0.32, 0.72, 0, 1)` (globals.css:166)
- **Issue:** Different timing curves, drawer doesn't use spring-like easing

### 2. CTA Right Arrows (6 instances)
All use same SVG path: `M17 8l4 4m0 0l-4 4m4-4H3`
- `ProductReveal.tsx:248-253` — "See it in action →"
- `AhaDemo.tsx:80-82` — "Go deeper →"
- `Foundation.tsx:81-82` — "The Ratchet →"
- `Foundation.tsx:90-91` — "The Economics →"
- `Foundation.tsx:99-100` — "The Vision →"
- `Foundation.tsx:115-117` — "Explore →"

### 3. Bouncy Scroll Indicators (5 instances)
All use `animate-bounce` with chevron SVG
- `HeroHook.tsx:66-77`
- `ProblemStatement.tsx:129-136`
- `ProductReveal.tsx:259-267`
- `AhaDemo.tsx:101-108`
- `Foundation.tsx:122-129`

### 4. CognitiveBridge Static Copy
Current (lines 95-100):
```jsx
<p className="font-serif text-sm text-ink/80">
  This connects to the{' '}
  <strong className="text-grove-forest">{journeyInfo.title}</strong>{' '}
  sequence. To fully map this dependency, I can switch to a structured path.
</p>
```
**Issue:** Stiff, not conversational, no typing animation

### 5. ProductReveal "YOUR" Animation (lines 108-158)
- Uses fixed-width container causing layout gap
- THE→YOUR transition leaves awkward spacing
- Screenshot confirms visual issue

## Design Tokens (for reference)
```css
--color-paper: #FBFBF9
--color-ink: #1C1C1C
--color-grove-forest: #2F5C3B
--color-grove-clay: #D95D39
```

## Dependencies to Add
- `lottie-react` — For ASCII→seedling scroll indicator animation
