# S24-EMT: Elegant Modern Theme - Execution Prompt

**Sprint:** elegant-modern-theme-v1
**Alias:** S24-EMT
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `feat/prompt-template-architecture-v1`
**Date:** 2026-01-24

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1 - Font Loading |
| **Status** | 🚀 Executing |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-24 |
| **Next Action** | Create theme files |

---

## Attention Anchor

**We are building:** High-contrast, accessible themes (Elegant Modern light, Elegant Dark) with frozen zone protection.

**Success looks like:** `/explore` loads with light theme by default, `/foundation` stays dark, theme switching works.

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH (ALWAYS DARK)
├── /foundation route
├── /terminal route
└── These must KEEP dark class regardless of theme

ACTIVE BUILD ZONE — WHERE THEMES APPLY
├── /explore route
├── /bedrock route
└── These can use new Elegant Modern default
```

### Critical UX Chief Audit Finding

**BLOCKING ISSUE:** BedrockUIContext's dark class toggle would break frozen zones:

```typescript
// CURRENT BEHAVIOR (DANGEROUS):
if (skin.colorScheme === 'dark') {
  root.classList.add('dark');
} else {
  root.classList.remove('dark');  // ← BREAKS /foundation and /terminal!
}
```

**REQUIRED MITIGATION:** Add frozen zone protection before toggling dark class.

---

## Execution Architecture

### Phase 1: Font Loading (5 min)

**File:** `src/styles/globals.css`

Add Google Fonts import for Inter, Playfair Display, Fira Code:

```css
/* S24-EMT: Theme-configurable fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&family=Fira+Code:wght@400;500&display=swap');
```

**Gate:** Fonts load without CORS errors

---

### Phase 2: Theme Files (15 min)

**Create:** `src/bedrock/themes/elegant-modern-skin.json`
**Create:** `src/bedrock/themes/elegant-dark-skin.json`

Both themes must follow GroveSkin schema with:
- `provenance` object
- `tokens.colors` (including semantic)
- `tokens.effects` (blur, radius, glow)
- `tokens.typography` (display, heading, body, mono, ui)
- `layout` (density, spacingScale)

**Gate:** JSON files parse without errors

---

### Phase 3: Theme Registration + Frozen Zone Protection (20 min)

**Modify:** `src/bedrock/context/BedrockUIContext.tsx`

1. Add imports for new themes
2. Update THEME_REGISTRY with new themes FIRST in order
3. Change default theme to elegant-modern-v1
4. **CRITICAL:** Add frozen zone protection in useEffect:

```typescript
// FROZEN ZONE PROTECTION: Never remove dark class on frozen routes
const isFrozenZone =
  window.location.pathname.startsWith('/foundation') ||
  window.location.pathname.startsWith('/terminal');

if (isFrozenZone) {
  // Force dark class for frozen zones regardless of theme
  root.classList.add('dark');
  return; // Skip theme-based toggle
}

// V1.0 routes: Normal theme-based toggle
if (skin.colorScheme === 'dark') {
  root.classList.add('dark');
} else {
  root.classList.remove('dark');
}
```

**Gate:** Build passes, frozen zone protection verified

---

### Phase 4: ThemeSwitcher UI (10 min)

**Modify:** `src/bedrock/components/ThemeSwitcher.tsx`

Add THEME_INFO entries for:
- `elegant-modern-v1` (light theme with high contrast)
- `elegant-dark-v1` (warm charcoal night mode)

**Gate:** ThemeSwitcher shows all themes with correct previews

---

### Phase 5: Verification (20 min)

1. **Build check:** `npm run build`
2. **Visual verification at `/explore`:**
   - Default theme should be Elegant Modern (light)
   - Text should have high contrast (#1A1A1A on #F9F8F6)
3. **Frozen zone protection:**
   - Navigate to `/foundation`
   - Verify `<html>` still has `class="dark"`
   - Verify Foundation console renders correctly
4. **Theme switching:**
   - Open ThemeSwitcher
   - Switch between all themes
   - Verify persistence via localStorage
5. **Cross-route navigation:**
   - Start at `/explore` (light theme)
   - Navigate to `/foundation` (should stay dark)
   - Navigate back to `/explore` (should return to light)

**Gate:** All verification checks pass, screenshots captured

---

## DEX Compliance Matrix

| Pillar | Implementation | Evidence |
|--------|---------------|----------|
| **Declarative Sovereignty** | Themes are pure JSON config | `elegant-modern-skin.json` |
| **Capability Agnosticism** | No LLM dependencies | Works without any model |
| **Provenance** | Each theme has provenance object | `authorId`, `version`, `source` |
| **Organic Scalability** | Add themes via JSON + registry entry | No structural changes |

---

## Success Criteria

### Sprint Complete When:
- [ ] Google Fonts loading correctly
- [ ] Both theme JSON files created and valid
- [ ] Themes registered in THEME_REGISTRY
- [ ] Elegant Modern is default for /explore and /bedrock/*
- [ ] Frozen zone protection verified (/foundation stays dark)
- [ ] Theme switching works in ThemeSwitcher
- [ ] Build passes
- [ ] Screenshots captured

### Sprint Failed If:
- ❌ Frozen zones lose dark class
- ❌ /foundation or /terminal visually break
- ❌ Theme files don't match GroveSkin schema
- ❌ Build errors

---

## Files Summary

| File | Action |
|------|--------|
| `src/styles/globals.css` | ADD Google Fonts import |
| `src/bedrock/themes/elegant-modern-skin.json` | CREATE |
| `src/bedrock/themes/elegant-dark-skin.json` | CREATE |
| `src/bedrock/context/BedrockUIContext.tsx` | MODIFY - imports, registry, frozen zone protection |
| `src/bedrock/components/ThemeSwitcher.tsx` | MODIFY - THEME_INFO entries |

---

*This contract is binding. Deviation requires explicit human approval.*
