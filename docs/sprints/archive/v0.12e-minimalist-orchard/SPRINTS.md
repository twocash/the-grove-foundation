# Sprint Stories — v0.12e Minimalist Orchard

## Epic 1: Typography Update

### Story 1.1: Add Font Imports
**File:** `index.html`
**Line:** 10

**Current:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

**New:**
```html
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Tenor+Sans&display=swap" rel="stylesheet">
```

**Acceptance:** Fonts load in Network tab, no 404s

---

### Story 1.2: Update CSS Font Families
**File:** `styles/globals.css`
**Lines:** 47-50

**Current:**
```css
--font-serif: 'Lora', serif;
--font-display: 'Playfair Display', serif;
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**New:**
```css
--font-serif: 'EB Garamond', 'Lora', serif;
--font-display: 'Tenor Sans', 'Playfair Display', sans-serif;
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**Acceptance:** Headers render in Tenor Sans, body in EB Garamond

---

### Story 1.3: Update Tailwind Font Config
**File:** `tailwind.config.ts`
**Lines:** 69-75

**Current:**
```typescript
fontFamily: {
  serif: ['Lora', 'serif'],
  display: ['Playfair Display', 'serif'],
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

**New:**
```typescript
fontFamily: {
  serif: ['EB Garamond', 'Lora', 'serif'],
  display: ['Tenor Sans', 'Playfair Display', 'sans-serif'],
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

**Acceptance:** Tailwind classes `font-serif` and `font-display` use new fonts

---

## Epic 2: Color Update

### Story 2.1: Update CSS Color Tokens
**File:** `styles/globals.css`
**Lines:** 12-28

**Changes:**
```css
/* Line 12 */ --color-paper: #F9F8F4;        /* Was #FBFBF9 */
/* Line 13 */ --color-paper-dark: #F0EFE9;   /* Was #F2F0E9 - slightly warmer */

/* Line 15 */ --color-ink: #1A2421;          /* Was #1C1C1C */
/* Line 16 */ --color-ink-muted: #4A5A50;    /* Was #575757 - green-tinted */

/* Line 19 */ --color-grove-cream: #F9F8F4;  /* Was #FBFBF9 */
/* Line 20 */ --color-grove-dark: #1A2421;   /* Was #1C1C1C */
/* Line 21 */ --color-grove-forest: #355E3B; /* Was #2F5C3B */
/* Line 22 */ --color-grove-accent: #355E3B; /* Was #2F5C3B */
```

**Acceptance:** Page has warmer cream background, forest green accent

---

### Story 2.2: Update Tailwind Color Config
**File:** `tailwind.config.ts`
**Lines:** 15-38

**Changes:**
```typescript
paper: {
  DEFAULT: '#F9F8F4',     // Was #FBFBF9
  dark: '#F0EFE9',        // Was #F2F0E9
},
ink: {
  DEFAULT: '#1A2421',     // Was #1C1C1C
  muted: '#4A5A50',       // Was #575757
  border: '#E5E5E0',      // Unchanged
},
grove: {
  cream: '#F9F8F4',       // Was #FBFBF9
  dark: '#1A2421',        // Was #1C1C1C
  forest: '#355E3B',      // Was #2F5C3B
  accent: '#355E3B',      // Was #2F5C3B
  clay: '#D95D39',        // Unchanged
  light: '#E5E5E0',       // Unchanged
},
```

**Acceptance:** Color classes reflect new values

---

## Epic 3: Typography Features

### Story 3.1: Add Smart Typography CSS
**File:** `styles/globals.css`
**Location:** After line 50 (after font definitions)

**Add:**
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
  @apply font-display tracking-tight;
}

/* Body Copy - EB Garamond */
p {
  @apply font-serif;
}
```

**Acceptance:** Smart quotes render, text is crisp

---

## Epic 4: Genesis Default

### Story 4.1: Update SurfaceRouter Default
**File:** `src/surface/pages/SurfaceRouter.tsx`
**Lines:** 12-32

**Replace entire file with:**
```typescript
// src/surface/pages/SurfaceRouter.tsx
// Routes between Classic and Genesis landing experiences based on URL param or feature flag

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
    // 1. Check URL param first (highest priority - allows testing either experience)
    const urlExperience = searchParams.get('experience');
    if (urlExperience === 'genesis') return 'genesis';
    if (urlExperience === 'classic') return 'classic';

    // 2. Check feature flag (allows disabling genesis via Reality Tuner)
    if (genesisEnabled === false) return 'classic';

    // 3. Default to genesis (production default as of v0.12e)
    return 'genesis';
  }, [searchParams, genesisEnabled]);

  // Render the appropriate experience
  if (experience === 'classic') {
    return <SurfacePage />;
  }

  return <GenesisPage />;
};

export default SurfaceRouter;
```

**Acceptance:** Visiting `/` shows Genesis page

---

### Story 4.2: Update Feature Flag in Schema
**File:** `data/narratives-schema.ts`
**Line:** 275

**Current:**
```typescript
enabled: false
```

**New:**
```typescript
enabled: true
```

**Acceptance:** Flag shows `true` in Reality Tuner

---

### Story 4.3: Update Feature Flag in JSON
**File:** `data/narratives.json`
**Line:** 48

**Current:**
```json
"enabled": false
```

**New:**
```json
"enabled": true
```

**Acceptance:** API returns `true` for genesis-landing flag

---

## Epic 5: Chameleon Prep (Component Architecture)

### Story 5.1: Add Content Prop Interface to HeroHook
**File:** `src/surface/components/genesis/HeroHook.tsx`

**Add interface and update component:**
```typescript
// Content interface for Chameleon (v0.13)
interface HeroContent {
  headline: string;
  subtext: string[];
}

// Default content (current hardcoded values)
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
  // ... existing animation logic

  return (
    <section className="...">
      {/* Main headline - now from props */}
      <h1 className="...">
        {content.headline}
      </h1>

      {/* Subtext - now from props array */}
      <div className="space-y-4 mb-8">
        {content.subtext.map((text, index) => (
          <p
            key={index}
            className={`font-serif ... ${
              index === 0 ? (showSubtext1 ? 'opacity-100' : 'opacity-0') :
              (showSubtext2 ? 'opacity-100' : 'opacity-0')
            }`}
          >
            {text}
          </p>
        ))}
      </div>
      {/* ... rest unchanged */}
    </section>
  );
};
```

**Acceptance:** Component renders with default content; accepts optional content prop

---

### Story 5.2: Add Quotes Prop Interface to ProblemStatement
**File:** `src/surface/components/genesis/ProblemStatement.tsx`

**Update interface and component:**
```typescript
// Quote interface (export for reuse)
export interface Quote {
  text: string;
  author: string;
  title: string;
}

// Default quotes (current hardcoded values)
const DEFAULT_QUOTES: Quote[] = [
  {
    text: "AI is the most profound technology humanity has ever worked on... People will need to adapt.",
    author: "SUNDAR PICHAI",
    title: "GOOGLE CEO"
  },
  // ... other existing quotes
];

interface ProblemStatementProps {
  className?: string;
  quotes?: Quote[];  // Optional - enables Chameleon in v0.13
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ 
  className = '',
  quotes = DEFAULT_QUOTES
}) => {
  // ... use quotes instead of hardcoded array
};
```

**Acceptance:** Component renders with default quotes; accepts optional quotes prop

---

### Story 5.3: Export Content Interfaces
**File:** `src/surface/components/genesis/index.ts`

**Add exports:**
```typescript
// Existing exports
export { HeroHook } from './HeroHook';
export { ProblemStatement } from './ProblemStatement';
// ... other components

// Content interfaces for Chameleon (v0.13)
export type { HeroContent } from './HeroHook';
export type { Quote } from './ProblemStatement';
```

**Acceptance:** Interfaces importable from genesis barrel export

---

## Epic 6: Build Verification

### Story 6.1: Build and Test
**Commands:**
```bash
npm run build
npm run dev
```

**Manual Tests:**
1. Visit `http://localhost:5173/` → Genesis loads
2. Visit `http://localhost:5173/?experience=classic` → Classic loads
3. Open Terminal → Typography renders correctly
4. Visit `/foundation` → Dark mode unchanged
5. Check console → No errors

**Acceptance:** All tests pass

---

## Commit Sequence

```
1. feat(fonts): add Tenor Sans and EB Garamond to Google Fonts import
2. style(theme): update CSS font families to Minimalist Orchard
3. style(theme): sync Tailwind font config with CSS
4. style(theme): update Surface color tokens to warm bone/forest charcoal
5. style(theme): sync Tailwind color config with CSS
6. style(theme): add smart typography CSS features
7. feat(surface): make Genesis the default landing experience
8. config(flags): enable genesis-landing flag by default
9. refactor(genesis): add content prop interface to HeroHook
10. refactor(genesis): add quotes prop interface to ProblemStatement
11. refactor(genesis): export content interfaces from barrel
12. docs: update DEVLOG with v0.12e completion
```
