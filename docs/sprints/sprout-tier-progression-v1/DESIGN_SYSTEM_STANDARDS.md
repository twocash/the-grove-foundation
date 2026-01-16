# Design System Standards for Sprout Tier Progression

**Sprint:** S4-SL-TierProgression  
**Date:** 2026-01-15  
**Status:** MANDATORY REFERENCE

---

## ⚠️ CRITICAL: Which Design System to Use

### For ALL Phase 0 Implementation (Current Sprint)

**USE:** **Quantum Glass Design System**

**DO NOT USE:** Living Glass (future vision only)

---

## Quantum Glass = v1.0 Implementation Standard

### Why Quantum Glass?

1. **Already implemented** - Both `/explore` and `/bedrock` use these tokens
2. **Codebase consistency** - Avoid aesthetic drift between features
3. **Proven system** - Design tokens, components, patterns all established
4. **Ship faster** - No need to create new design assets

### Quantum Glass Core Tokens

```css
/* Colors - USE THESE */
--glass-void: #030712;                    /* Deepest background */
--glass-panel: rgba(17, 24, 39, 0.6);    /* Panel backgrounds */
--glass-solid: #111827;                   /* Solid panels */

/* Accent Colors - USE THESE */
--neon-green: #10b981;    /* Growth, success, primary accent */
--neon-cyan: #06b6d4;     /* System, processing, info */
--neon-amber: #f59e0b;    /* Warning, attention */

/* Text Hierarchy - USE THESE */
--text-primary: #ffffff;      /* Headlines */
--text-secondary: #e2e8f0;    /* Subheadings (slate-200) */
--text-body: #cbd5e1;         /* Body text (slate-300) */
--text-muted: #94a3b8;        /* Descriptions (slate-400) */
--text-subtle: #64748b;       /* Tertiary (slate-500) */

/* Borders - USE THESE */
--border-default: #1e293b;    /* Default borders (slate-800) */
--border-hover: #334155;      /* Hover state (slate-700) */

/* Glow Effects - USE THESE */
--glow-green: 0 0 20px -5px rgba(16, 185, 129, 0.4);
--glow-cyan: 0 0 20px -5px rgba(6, 182, 212, 0.4);

/* Typography - USE THESE */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Tier Badge Colors (Quantum Glass)

```typescript
export const TIER_COLORS_QUANTUM = {
  seed: {
    ring: 'rgba(120, 113, 108, 0.4)',     // Dim brown/gray
    glow: 'none',
    overlay: 'opacity-40 grayscale'
  },
  sprout: {
    ring: 'rgba(16, 185, 129, 0.5)',      // --neon-green/50
    glow: '0 0 12px rgba(16, 185, 129, 0.3)',
    overlay: 'none'
  },
  sapling: {
    ring: 'rgba(16, 185, 129, 0.6)',      // --neon-green/60
    glow: '0 0 12px rgba(16, 185, 129, 0.4)',
    overlay: 'none'
  },
  tree: {
    ring: 'rgba(5, 150, 105, 0.6)',       // Emerald-600/60
    glow: '0 0 12px rgba(5, 150, 105, 0.4)',
    overlay: 'none'
  },
  grove: {
    ring: 'rgba(4, 120, 87, 0.7)',        // Emerald-700/70
    glow: '0 0 12px rgba(4, 120, 87, 0.5)',
    overlay: 'none'
  }
};
```

### What NOT to Use in Phase 0

```css
/* ❌ DO NOT USE - These are Living Glass (v2 vision) */
--grove-forest: #2F5C3B;   /* ← NOT IN v1.0 */
--grove-clay: #D95D39;     /* ← NOT IN v1.0 */
--soil-dark: #0f172a;      /* ← NOT IN v1.0 */
--paper: #FBFBF9;          /* ← NOT IN v1.0 */
--ink: #1C1C1C;            /* ← NOT IN v1.0 */

/* ❌ DO NOT USE - These fonts are Living Glass */
--font-serif: 'Playfair Display';  /* ← NOT IN v1.0 */
--font-body: 'Lora';               /* ← NOT IN v1.0 */
```

**If you see these tokens in design mockups or specs, FLAG IT - they're from the wrong system.**

---

## Living Glass = v2 Vision (Post-1.0 Migration)

### Status: NOT IMPLEMENTED

Living Glass is a **future design direction** documented in:
- `docs/design-system/UI_VISION_LIVING_GLASS.md` (now marked as "v2 vision")

### When Will Living Glass Be Used?

**Not in Phase 0.** This requires:
1. Dedicated design sprint (post-1.0 MVP)
2. Full codebase audit of all components
3. New design tokens created
4. Migration of `/explore`, `/bedrock`, and all surfaces
5. Updated Tailwind config
6. Font loading changes

**Estimated timeline:** Q2 2026 or later (not current roadmap)

### Living Glass Core Palette (REFERENCE ONLY)

```css
/* DO NOT USE IN v1.0 - Reference for future migration */
--grove-forest: #2F5C3B;      /* Primary botanical accent */
--grove-clay: #D95D39;        /* Secondary warm accent */
--soil-dark: #0f172a;         /* Base background */
--paper: #FBFBF9;             /* Light mode base */
--ink: #1C1C1C;               /* Dark text */

/* Typography (NOT LOADED IN v1.0) */
--font-serif: 'Playfair Display';
--font-body: 'Lora';
--font-mono: 'JetBrains Mono';  /* Same as Quantum */
```

---

## How to Verify You're Using the Right System

### ✅ Checklist for Developers

Before implementing tier badges, verify:

- [ ] Using `--neon-green` (NOT `--grove-forest`)
- [ ] Using `--glass-void` background (NOT `--soil-dark`)
- [ ] Using `Inter` font (NOT `Playfair Display` or `Lora`)
- [ ] Using `--text-secondary` (#e2e8f0) for labels (NOT `--paper`)
- [ ] Glass panel backgrounds are `rgba(17, 24, 39, 0.6)` (NOT terrarium metaphors)

### ✅ Checklist for Designers

Before creating mockups, verify:

- [ ] Color picker shows `#10b981` for green accents (NOT `#2F5C3B`)
- [ ] Background is `#030712` void (NOT `#0f172a` soil)
- [ ] Font family is Inter (NOT Playfair Display)
- [ ] Design aesthetic is cyber/technical glass (NOT organic/botanical)

### 🚨 Red Flags (Wrong System)

If you see ANY of these in Phase 0 code/design, it's WRONG:

- "Grove Forest" color references
- "Grove Clay" color references  
- "Terrarium" metaphors in code comments
- Playfair Display font imports
- Lora font imports
- Paper/Ink color tokens
- "Botanical" or "organic" in CSS class names (Quantum is cyber/technical)

---

## Quick Reference: Quantum vs. Living Glass

| Element | Quantum Glass (v1.0 ✅) | Living Glass (v2 ❌) |
|---------|------------------------|---------------------|
| **Primary Accent** | `--neon-green` (#10b981) | `--grove-forest` (#2F5C3B) |
| **Background** | `--glass-void` (#030712) | `--soil-dark` (#0f172a) |
| **Header Font** | Inter (sans-serif) | Playfair Display (serif) |
| **Body Font** | Inter | Lora (serif) |
| **Aesthetic** | Cyber, technical, glass panels | Organic, botanical, terrariums |
| **Metaphor** | Quantum computing, reality projection | Living garden, cultivation |
| **Status** | IMPLEMENTED ✅ | VISION ONLY ❌ |

---

## Migration Path (Future)

When Living Glass migration occurs (post-1.0), this sprint's work will adapt like this:

### Tier Badge Component Migration

**Current (Quantum Glass):**
```tsx
<TierBadge 
  tier="sapling"
  className="text-lg ring-2 ring-neon-green/60"
/>
```

**Future (Living Glass):**
```tsx
<TierBadge 
  tier="sapling"
  className="text-lg ring-2 ring-grove-forest/60"
  theme="living-glass"  // ← New prop
/>
```

### Color Token Mapping

```typescript
// Phase 0 (Quantum Glass)
const TIER_COLORS = {
  sprout: '--neon-green'
};

// Post-migration (Living Glass)
const TIER_COLORS = {
  sprout: '--grove-forest'
};
```

**But this is NOT Phase 0 work.** Only document for future reference.

---

## Component Implementation Rules

### Phase 0 Tier Badge CSS

```css
/* ✅ CORRECT - Quantum Glass */
.tier-badge-sprout {
  color: var(--neon-green);
  box-shadow: var(--glow-green);
  background: var(--glass-panel);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* ❌ WRONG - Living Glass (don't use) */
.tier-badge-sprout {
  color: var(--grove-forest);  /* ← NO */
  background: var(--terrarium-glass);  /* ← NO */
  border: 1px solid var(--grove-forest);  /* ← NO */
}
```

### Phase 0 Typography

```css
/* ✅ CORRECT - Quantum Glass */
.tier-label {
  font-family: var(--font-sans);  /* Inter */
  font-weight: 500;
  letter-spacing: 0.01em;
}

/* ❌ WRONG - Living Glass */
.tier-label {
  font-family: var(--font-serif);  /* Playfair Display - NOT LOADED */
  font-family: 'Lora';             /* NOT LOADED */
}
```

---

## FAQ

### Q: Why not use Living Glass now if it's the future?

**A:** Because it's not implemented. Using Living Glass tokens now would:
1. Break visual consistency with existing `/explore` and `/bedrock` pages
2. Require loading new fonts (performance hit)
3. Create aesthetic drift (some features Quantum, some Living Glass)
4. Make the codebase harder to maintain

**Principle:** Ship with existing design system, migrate holistically later.

---

### Q: When will Living Glass migration happen?

**A:** Not in current roadmap. After 1.0 MVP ships, Product Manager will evaluate:
- User feedback on Quantum Glass aesthetic
- Design bandwidth for full migration
- Whether botanical metaphor still aligns with product direction

**Earliest:** Q2 2026  
**More likely:** Q3 2026 or later

---

### Q: Can I use Living Glass colors "just for tier badges"?

**A:** No. This creates:
- Visual inconsistency (tier badges look different from everything else)
- Maintenance burden (two color systems in codebase)
- Migration complexity (harder to update later)

**Use Quantum Glass for ALL Phase 0 work.**

---

### Q: What if design mockups show Grove Forest green?

**A:** Flag it as an error. Update the mockup to use `--neon-green` (#10b981).

The design spec may reference Living Glass as "future vision" - that's fine for documentation. But implementation MUST use Quantum Glass.

---

### Q: I found `--grove-forest` in the codebase. What do I do?

**A:** Check the file context:
- If it's in `UI_VISION_LIVING_GLASS.md` → OK (vision doc)
- If it's in `DESIGN_SPEC.md` or `DESIGN_DECISIONS.md` → OK if marked "future/v2"
- If it's in component code (`.tsx`, `.css`) → DELETE IT, replace with Quantum tokens

---

## Summary: One Rule to Remember

> **Use Quantum Glass for EVERYTHING in v1.0.**  
> **Living Glass is a vision, not an implementation.**

If in doubt, grep the codebase for existing components:
```bash
# See how GardenTray uses colors (it's Quantum Glass)
grep -r "neon-green" src/explore/components/GardenTray/

# See how Finishing Room uses colors (it's Quantum Glass)  
grep -r "glass-panel" src/surface/components/modals/SproutFinishingRoom/
```

**Match the existing patterns. Don't introduce new design systems.**

---

*Design System Standards by UI/UX Designer*  
*"One system for v1.0. Migrate together, not piecemeal."*  
*Last updated: 2026-01-15*
