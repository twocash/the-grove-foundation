# Target Content — v0.12e Minimalist Orchard

## Typography Specification

### Font Stack

| Role | Primary | Fallback 1 | Fallback 2 |
|------|---------|------------|------------|
| Display (H1, H2) | Tenor Sans | Playfair Display | sans-serif |
| Body (p, prose) | EB Garamond | Lora | serif |
| UI (buttons, labels) | Inter | system-ui | sans-serif |
| Code | JetBrains Mono | Consolas | monospace |

### Google Fonts Import URL
```
https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Tenor+Sans&display=swap
```

### Font Weights

**EB Garamond:**
- 400: Body text
- 500: Emphasized text
- 600: Strong emphasis
- 400 italic: Quotes, pull quotes
- 500 italic: Emphasized quotes

**Tenor Sans:**
- 400 only (display font, single weight)

**Inter:**
- 300: Light UI elements
- 400: Default UI
- 500: Buttons, labels
- 600: Strong emphasis

---

## Color Specification

### Primary Palette

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| Warm Bone | `#F9F8F4` | rgb(249, 248, 244) | Page background |
| Paper Dark | `#F2F0E9` | rgb(242, 240, 233) | Card backgrounds |
| Forest Charcoal | `#1A2421` | rgb(26, 36, 33) | Primary text |
| Muted Green | `#4A5A50` | rgb(74, 90, 80) | Secondary text |
| Hunter Green | `#355E3B` | rgb(53, 94, 59) | Links, accents |
| Grove Clay | `#D95D39` | rgb(217, 93, 57) | CTAs, highlights |
| Light Border | `#E5E5E0` | rgb(229, 229, 224) | Dividers, borders |

### Color Contrast Verification

| Combination | Ratio | WCAG |
|-------------|-------|------|
| Forest Charcoal on Warm Bone | 12.5:1 | AAA |
| Muted Green on Warm Bone | 4.8:1 | AA |
| Hunter Green on Warm Bone | 5.2:1 | AA |
| Grove Clay on Warm Bone | 4.1:1 | AA |

---

## CSS Custom Properties

### Complete @theme Block
```css
@theme {
  /* ============================================================
     SURFACE TOKENS (Minimalist Orchard - v0.12e)
     ============================================================ */
  --color-paper: #F9F8F4;
  --color-paper-dark: #F2F0E9;

  --color-ink: #1A2421;
  --color-ink-muted: #4A5A50;
  --color-ink-border: #E5E5E0;

  --color-grove-cream: #F9F8F4;
  --color-grove-dark: #1A2421;
  --color-grove-forest: #355E3B;
  --color-grove-accent: #355E3B;
  --color-grove-clay: #D95D39;
  --color-grove-light: #E5E5E0;

  --color-terminal-bg: #FFFFFF;
  --color-terminal-phosphor: #1A2421;
  --color-terminal-border: #E5E5E0;
  --color-terminal-highlight: #D95D39;

  /* ============================================================
     FOUNDATION TOKENS (Unchanged)
     ============================================================ */
  --color-obsidian: #0D0D0D;
  --color-obsidian-raised: #141414;
  --color-obsidian-elevated: #1A1A1A;
  --color-obsidian-surface: #242424;

  --color-holo-cyan: #00D4FF;
  --color-holo-magenta: #FF00D4;
  --color-holo-lime: #00FF88;
  --color-holo-amber: #FFB800;
  --color-holo-red: #FF4444;

  /* ============================================================
     FONTS (Minimalist Orchard)
     ============================================================ */
  --font-serif: 'EB Garamond', 'Lora', serif;
  --font-display: 'Tenor Sans', 'Playfair Display', sans-serif;
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Smart Typography Block
```css
/* Smart typography features (Minimalist Orchard v0.12e) */
body {
  font-feature-settings: "kern" 1, "liga" 1, "onum" 1;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Editorial line height for readability */
.prose, p, .font-serif {
  line-height: 1.65;
}
```

---

## Tailwind Config

### Colors Block
```typescript
colors: {
  // ============================================================
  // SURFACE TOKENS (Minimalist Orchard - v0.12e)
  // ============================================================
  paper: {
    DEFAULT: '#F9F8F4',
    dark: '#F2F0E9',
  },
  ink: {
    DEFAULT: '#1A2421',
    muted: '#4A5A50',
    border: '#E5E5E0',
  },
  grove: {
    cream: '#F9F8F4',
    dark: '#1A2421',
    forest: '#355E3B',
    accent: '#355E3B',
    clay: '#D95D39',
    light: '#E5E5E0',
  },
  terminal: {
    bg: '#FFFFFF',
    phosphor: '#1A2421',
    border: '#E5E5E0',
    highlight: '#D95D39',
  },
  // ... Foundation tokens unchanged
},
```

### Font Family Block
```typescript
fontFamily: {
  // Surface fonts (Minimalist Orchard)
  serif: ['EB Garamond', 'Lora', 'serif'],
  display: ['Tenor Sans', 'Playfair Display', 'sans-serif'],
  // Shared fonts
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
```

---

## SurfaceRouter Logic

### Updated Component
```typescript
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
    if (!genesisEnabled) return 'classic';

    // 3. Default to genesis (production default as of v0.12e)
    return 'genesis';
  }, [searchParams, genesisEnabled]);

  // Render the appropriate experience
  if (experience === 'genesis') {
    return <GenesisPage />;
  }

  return <SurfacePage />;
};
```

---

## Visual Reference

### Before (Current)
- Background: Cool white (`#FBFBF9`)
- Text: Pure dark (`#1C1C1C`)
- Headers: Playfair Display (high contrast serif)
- Body: Lora (warm serif)

### After (Minimalist Orchard)
- Background: Warm bone (`#F9F8F4`) — slightly yellow undertone
- Text: Forest charcoal (`#1A2421`) — green undertone, softer
- Headers: Tenor Sans (elegant, modern sans)
- Body: EB Garamond (classic editorial serif)

### Mood
- Less stark contrast
- Warmer, more inviting
- "Well-designed book" feeling
- Professional but approachable
