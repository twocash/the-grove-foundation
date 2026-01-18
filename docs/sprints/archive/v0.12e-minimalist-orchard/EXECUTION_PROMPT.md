# Execution Prompt — v0.12e Minimalist Orchard

## Context
This sprint is **infrastructure for the Chameleon** — not just aesthetic polish.

The shift to Paper UI (warm bone, serif fonts) creates a "manuscript" aesthetic where content feels natural to rewrite. This enables v0.13's adaptive landing surface that morphs based on lens selection.

**Deliverables:**
1. Typography: Tenor Sans (display) + EB Garamond (body)
2. Colors: Warm bone/forest charcoal palette
3. Genesis default with Classic escape hatch
4. **Component architecture prep** — Genesis components accept content props

## Documentation
All sprint documentation is in `docs/sprints/v0.12e-minimalist-orchard/`:
- `REPO_AUDIT.md` — Current design system state
- `SPEC.md` — Goals, strategic context, acceptance criteria
- `SPRINTS.md` — Story breakdown with line numbers
- `TARGET_CONTENT.md` — Exact CSS and config values
- `DECISIONS.md` — 7 ADRs including Chameleon prep

## Repository Intelligence

| Concern | File | Key Lines |
|---------|------|-----------|
| Font imports | `index.html` | 10 |
| CSS font families | `styles/globals.css` | 47-50 |
| CSS color tokens | `styles/globals.css` | 12-28 |
| Tailwind fonts | `tailwind.config.ts` | 69-75 |
| Tailwind colors | `tailwind.config.ts` | 15-38 |
| SurfaceRouter | `src/surface/pages/SurfaceRouter.tsx` | 1-44 |
| Feature flag (schema) | `data/narratives-schema.ts` | 271-276 |
| Feature flag (JSON) | `data/narratives.json` | 44-49 |
| HeroHook | `src/surface/components/genesis/HeroHook.tsx` | 1-74 |
| ProblemStatement | `src/surface/components/genesis/ProblemStatement.tsx` | 1-139 |

---

## Phase 1: Typography Update

### Step 1.1: Update Font Imports
1. Open `index.html`
2. Find line 10 (Google Fonts link)
3. Replace entire link with:
```html
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Tenor+Sans&display=swap" rel="stylesheet">
```

### Step 1.2: Update CSS Font Families
1. Open `styles/globals.css`
2. Find lines 47-50 (font definitions in @theme)
3. Replace with:
```css
--font-serif: 'EB Garamond', 'Lora', serif;
--font-display: 'Tenor Sans', 'Playfair Display', sans-serif;
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Step 1.3: Update Tailwind Font Config
1. Open `tailwind.config.ts`
2. Find lines 69-75 (fontFamily section)
3. Replace with:
```typescript
fontFamily: {
  serif: ['EB Garamond', 'Lora', 'serif'],
  display: ['Tenor Sans', 'Playfair Display', 'sans-serif'],
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

4. Run `npm run build`

---

## Phase 2: Color Update

### Step 2.1: Update CSS Color Tokens
1. Open `styles/globals.css`
2. Find lines 12-28 (color tokens in @theme)
3. Update these specific values:
```css
--color-paper: #F9F8F4;           /* Line 12 - was #FBFBF9 */
--color-paper-dark: #F0EFE9;      /* Line 13 - was #F2F0E9 */

--color-ink: #1A2421;             /* Line 15 - was #1C1C1C */
--color-ink-muted: #4A5A50;       /* Line 16 - was #575757 */

--color-grove-cream: #F9F8F4;     /* Line 19 - was #FBFBF9 */
--color-grove-dark: #1A2421;      /* Line 20 - was #1C1C1C */
--color-grove-forest: #355E3B;    /* Line 21 - was #2F5C3B */
--color-grove-accent: #355E3B;    /* Line 22 - was #2F5C3B */

--color-terminal-phosphor: #1A2421; /* Line 25 - was #1C1C1C */
```

### Step 2.2: Update Tailwind Color Config
1. Open `tailwind.config.ts`
2. Find lines 15-38 (colors section)
3. Update paper, ink, grove, terminal tokens to match globals.css

4. Run `npm run build`

---

## Phase 3: Typography Features

### Step 3.1: Add Smart Typography CSS
1. Open `styles/globals.css`
2. Find line 51 (after @theme block)
3. Insert:
```css
/* ============================================================
   SMART TYPOGRAPHY (Minimalist Orchard v0.12e)
   ============================================================ */
body {
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Editorial line height for readability */
.prose, p, .font-serif {
  line-height: 1.65;
}

/* Headings - Tenor Sans */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

/* Body Copy - EB Garamond */
p {
  font-family: var(--font-serif);
}
```

4. Run `npm run build`

---

## Phase 4: Genesis Default

### Step 4.1: Update SurfaceRouter Logic
1. Open `src/surface/pages/SurfaceRouter.tsx`
2. Replace entire file with:
```typescript
// src/surface/pages/SurfaceRouter.tsx
// Routes between Classic and Genesis landing experiences

import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';
import SurfacePage from './SurfacePage';
import GenesisPage from './GenesisPage';

type ExperienceType = 'classic' | 'genesis';

/**
 * SurfaceRouter determines which landing experience to show:
 * 1. URL param ?experience=genesis or ?experience=classic (highest priority)
 * 2. Feature flag 'genesis-landing' can DISABLE genesis (returns classic if false)
 * 3. Default to 'genesis' (v0.12e+)
 */
const SurfaceRouter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const genesisEnabled = useFeatureFlag('genesis-landing');

  const experience = useMemo((): ExperienceType => {
    // 1. Check URL param first (allows testing either experience)
    const urlExperience = searchParams.get('experience');
    if (urlExperience === 'genesis') return 'genesis';
    if (urlExperience === 'classic') return 'classic';

    // 2. Check feature flag (allows disabling genesis via Reality Tuner)
    if (genesisEnabled === false) return 'classic';

    // 3. Default to genesis (v0.12e)
    return 'genesis';
  }, [searchParams, genesisEnabled]);

  if (experience === 'classic') {
    return <SurfacePage />;
  }

  return <GenesisPage />;
};

export default SurfaceRouter;
```

### Step 4.2: Update Feature Flags
1. `data/narratives-schema.ts` line 275: `enabled: true`
2. `data/narratives.json` line 48: `"enabled": true`

3. Run `npm run build`

---

## Phase 5: Chameleon Prep (Component Architecture)

### Step 5.1: Refactor HeroHook for Dynamic Content
1. Open `src/surface/components/genesis/HeroHook.tsx`
2. Replace entire file with:

```typescript
// src/surface/components/genesis/HeroHook.tsx
// Screen 1: The Hook - Full viewport emotional hit
// DESIGN: Organic, warm, paper-textured - NOT futuristic
// v0.12e: Added content prop interface for Chameleon (v0.13)

import React, { useEffect, useState } from 'react';
import ScrollIndicator from './ScrollIndicator';

// Content interface for Chameleon (v0.13)
export interface HeroContent {
  headline: string;
  subtext: string[];
}

// Default content (preserves current behavior)
const DEFAULT_CONTENT: HeroContent = {
  headline: "YOUR AI.",
  subtext: [
    "Not rented. Not surveilled. Not theirs.",
    "Yours."
  ]
};

interface HeroHookProps {
  onScrollNext?: () => void;
  content?: HeroContent;  // Optional - enables Chameleon in v0.13
}

export const HeroHook: React.FC<HeroHookProps> = ({ 
  onScrollNext, 
  content = DEFAULT_CONTENT 
}) => {
  const [visibleSubtext, setVisibleSubtext] = useState<number[]>([]);

  // Fade-in sequence for subtext
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    content.subtext.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleSubtext(prev => [...prev, index]);
      }, 600 + (index * 800));
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  }, [content.subtext]);

  const handleScrollClick = () => {
    if (onScrollNext) {
      onScrollNext();
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
    }
  };

  return (
    <section className="min-h-screen bg-paper flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Subtle organic background texture */}
      <div className="absolute inset-0 bg-grain opacity-50 pointer-events-none" />

      <div className="text-center max-w-2xl relative z-10">
        {/* Main headline - from props */}
        <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-grove-forest mb-8 tracking-tight">
          {content.headline}
        </h1>

        {/* Subtext with fade-in sequence - from props */}
        <div className="space-y-4 mb-8">
          {content.subtext.map((text, index) => (
            <p
              key={index}
              className={`font-serif text-${index === content.subtext.length - 1 ? '2xl sm:text-3xl md:text-4xl font-semibold' : 'xl sm:text-2xl md:text-3xl'} text-ink transition-opacity duration-700 ${
                visibleSubtext.includes(index) ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {text}
            </p>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 flex justify-center">
          <ScrollIndicator onClick={handleScrollClick} />
        </div>
      </div>
    </section>
  );
};

export default HeroHook;
```

### Step 5.2: Refactor ProblemStatement for Dynamic Content
1. Open `src/surface/components/genesis/ProblemStatement.tsx`
2. At top of file, update interface and add default:

```typescript
// Quote interface (export for reuse in Chameleon)
export interface Quote {
  text: string;
  author: string;
  title: string;
}

// Default quotes (preserves current behavior)
const DEFAULT_QUOTES: Quote[] = [
  {
    text: "AI is the most profound technology humanity has ever worked on... People will need to adapt.",
    author: "SUNDAR PICHAI",
    title: "GOOGLE CEO"
  },
  {
    text: "This is the new version of [learning to code]... adaptability and continuous learning would be the most valuable skills.",
    author: "SAM ALTMAN",
    title: "OPENAI CEO"
  },
  {
    text: "People have adapted to past technological changes... I advise ordinary citizens to learn to use AI.",
    author: "DARIO AMODEI",
    title: "ANTHROPIC CEO"
  }
];

interface ProblemStatementProps {
  className?: string;
  quotes?: Quote[];  // Optional - enables Chameleon in v0.13
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ 
  className = '',
  quotes = DEFAULT_QUOTES  // Use prop or default
}) => {
  // ... update component to use quotes prop instead of hardcoded array
```

3. Replace `quotes.map(...)` references to use the prop

### Step 5.3: Update Genesis Barrel Export
1. Open `src/surface/components/genesis/index.ts`
2. Add type exports:

```typescript
// Component exports
export { HeroHook } from './HeroHook';
export { ProblemStatement } from './ProblemStatement';
export { ProductReveal } from './ProductReveal';
export { AhaDemo } from './AhaDemo';
export { Foundation } from './Foundation';
export { CallToAction } from './CallToAction';
export { ScrollIndicator } from './ScrollIndicator';

// Content interfaces for Chameleon (v0.13)
export type { HeroContent } from './HeroHook';
export type { Quote } from './ProblemStatement';
```

4. Run `npm run build`

---

## Phase 6: Verification

### Build Test
```bash
npm run build
```
Must pass with no errors.

### Manual Tests

**Test 1: Genesis Default**
1. Run `npm run dev`
2. Visit `http://localhost:5173/`
3. **Verify:** Genesis page loads (not Classic)
4. **Verify:** Warm bone background visible
5. **Verify:** Headers in Tenor Sans (elegant, modern)
6. **Verify:** Body text in EB Garamond (literary, warm)

**Test 2: Classic Escape Hatch**
1. Visit `http://localhost:5173/?experience=classic`
2. **Verify:** Classic page loads
3. **Verify:** Same new typography/colors apply

**Test 3: Terminal**
1. From Genesis, open Terminal
2. **Verify:** Text renders in new fonts
3. **Verify:** Colors match new palette
4. **Verify:** Chat functionality works

**Test 4: Foundation Isolation**
1. Visit `http://localhost:5173/foundation`
2. **Verify:** Dark mode unchanged
3. **Verify:** Holodeck aesthetic preserved

**Test 5: Console Check**
1. Open browser DevTools
2. Check Console tab
3. **Verify:** No errors related to fonts, colors, or components

**Test 6: Component Props (Chameleon Prep)**
1. Temporarily pass custom content to HeroHook in GenesisPage
2. **Verify:** Custom headline renders
3. Revert to default props
4. **Verify:** Original content renders

---

## Build Verification
Run after each phase:
```bash
npm run build
```

---

## Forbidden Actions
- Do NOT modify Foundation tokens (obsidian, holo-*)
- Do NOT change Terminal component internal structure
- Do NOT implement lens-to-content mapping (that's v0.13)
- Do NOT add text morphing animations (that's v0.13)
- Do NOT skip build verification between phases

---

## Next Sprint: v0.13 "The Chameleon"

With v0.12e complete, the canvas is ready. v0.13 will:

1. **Lens Content Map**: JSON mapping ArchetypeId to content variations
   ```typescript
   const LENS_CONTENT: Record<string, HeroContent> = {
     'engineer': { headline: "THE ARCHITECTURE.", subtext: [...] },
     'academic': { headline: "THE RESEARCH.", subtext: [...] },
     'skeptic': { headline: "THE CRITIQUE.", subtext: [...] },
   };
   ```

2. **Reactive Surface**: Connect GenesisPage to `useNarrativeEngine().activeLens`

3. **Morphing Effect**: When lens changes, text un-types and re-types itself

The "manuscript" aesthetic from v0.12e makes this morphing feel natural — like editing a living document.
