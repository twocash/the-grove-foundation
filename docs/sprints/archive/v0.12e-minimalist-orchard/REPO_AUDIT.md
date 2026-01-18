# Repository Audit — v0.12e Minimalist Orchard

## Stack
- Framework: React 18 + Vite
- Language: TypeScript 5.x
- Build: Vite
- Styling: Tailwind v4 with CSS-based config
- Package Manager: npm

## Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
```

## Current Design System

### Font Imports (index.html:10)
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
```
**Current fonts:** Inter, JetBrains Mono, Lora, Playfair Display
**Need to add:** Tenor Sans, EB Garamond

### Font Family Definitions

**globals.css:47-50**
```css
--font-serif: 'Lora', serif;
--font-display: 'Playfair Display', serif;
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

**tailwind.config.ts:69-75**
```typescript
fontFamily: {
  // Surface fonts
  serif: ['Lora', 'serif'],
  display: ['Playfair Display', 'serif'],
  // Shared fonts
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

### Color Tokens

**globals.css:12-28 (Surface tokens)**
```css
--color-paper: #FBFBF9;
--color-paper-dark: #F2F0E9;

--color-ink: #1C1C1C;
--color-ink-muted: #575757;
--color-ink-border: #E5E5E0;

--color-grove-cream: #FBFBF9;
--color-grove-dark: #1C1C1C;
--color-grove-forest: #2F5C3B;
--color-grove-accent: #2F5C3B;
--color-grove-clay: #D95D39;
--color-grove-light: #E5E5E0;
```

**tailwind.config.ts:15-38 (Mirror of above)**
```typescript
paper: {
  DEFAULT: '#FBFBF9',
  dark: '#F2F0E9',
},
ink: {
  DEFAULT: '#1C1C1C',
  muted: '#575757',
  border: '#E5E5E0',
},
grove: {
  cream: '#FBFBF9',
  dark: '#1C1C1C',
  forest: '#2F5C3B',
  accent: '#2F5C3B',
  clay: '#D95D39',
  light: '#E5E5E0',
},
```

### Body Styling (index.html:15)
```html
<body class="bg-paper text-ink antialiased font-sans selection:bg-grove-forest selection:text-white">
```

## Landing Page Routing

### SurfaceRouter (src/surface/pages/SurfaceRouter.tsx)
**Lines 1-44**
```typescript
// Routes between Classic and Genesis landing experiences based on URL param or feature flag
// Priority: URL param > feature flag > default (classic)

const experience = useMemo((): ExperienceType => {
  // 1. Check URL param first (highest priority)
  const urlExperience = searchParams.get('experience');
  if (urlExperience === 'genesis') return 'genesis';
  if (urlExperience === 'classic') return 'classic';

  // 2. Fall back to feature flag
  if (genesisEnabled) return 'genesis';

  // 3. Default to classic
  return 'classic';
}, [searchParams, genesisEnabled]);
```

### Feature Flag: genesis-landing

**data/narratives-schema.ts:271-276**
```typescript
{
  id: 'genesis-landing',
  name: 'Genesis Landing Experience',
  description: 'Show the new Jobs-style landing page instead of Classic',
  enabled: false
},
```

**data/narratives.json:44-49**
```json
{
  "id": "genesis-landing",
  "name": "Genesis Landing Experience",
  "description": "Show the new Jobs-style landing page instead of Classic",
  "enabled": false
},
```

## Files to Modify

| File | Purpose | Changes Needed |
|------|---------|----------------|
| `index.html` | Font imports | Add Tenor Sans, EB Garamond |
| `styles/globals.css` | CSS custom properties | Update colors, add fonts, smart quotes |
| `tailwind.config.ts` | Tailwind theme | Mirror globals.css changes |
| `src/surface/pages/SurfaceRouter.tsx` | Landing routing | Flip default to genesis |
| `data/narratives-schema.ts` | Feature flag schema | Change default to true |
| `data/narratives.json` | Feature flag data | Change default to true |

## Minimalist Orchard Design Spec

### Typography
| Role | Font | Weight | Tracking |
|------|------|--------|----------|
| Headers (H1/H2) | Tenor Sans | 400 | 0 |
| Body Copy | EB Garamond | 400/500 | 0 |
| Labels/Buttons | Tenor Sans | 400 | +15% |
| Mono | JetBrains Mono | 400 | 0 |

### Colors
| Token | Current | New | Usage |
|-------|---------|-----|-------|
| Background | `#FBFBF9` | `#F9F8F4` | Warm Bone (paper) |
| Primary Text | `#1C1C1C` | `#1A2421` | Deep Forest Charcoal |
| Accent | `#2F5C3B` | `#355E3B` | Hunter Green |

### Spacing
- Body line height: 1.6 to 1.65
- Paragraph spacing: 32-48px
- Content max-width: 800px

### Smart Quotes
```css
body {
  font-feature-settings: "kern" 1, "liga" 1, "onum" 1;
  text-rendering: optimizeLegibility;
}
```

## Impact Analysis

### High Impact (Visual change across entire Surface)
- Background color shift: `#FBFBF9` → `#F9F8F4`
- Primary text color shift: `#1C1C1C` → `#1A2421`
- Accent color shift: `#2F5C3B` → `#355E3B`
- Font changes: Lora → EB Garamond, Playfair → Tenor Sans

### Medium Impact (Specific components)
- Line height changes affect text density
- Letter-spacing on buttons/labels

### Low Impact (Structural)
- Genesis default flip is configuration only
- URL param override preserved for testing

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Font loading regression | Low | Medium | Test font fallbacks |
| Color contrast issues | Low | High | Verify WCAG compliance |
| Genesis bugs exposed | Low | Medium | Classic still accessible via ?experience=classic |
| Foundation UI affected | Medium | Low | Foundation uses obsidian tokens (separate) |

## Testing Plan

1. **Visual regression:** Screenshot before/after
2. **Font loading:** Check network tab for new fonts
3. **Genesis default:** Visit root URL, verify Genesis loads
4. **Classic escape hatch:** Visit ?experience=classic, verify Classic loads
5. **Terminal styling:** Ensure Terminal inherits new typography
6. **Foundation isolation:** Verify Foundation dark mode unaffected
