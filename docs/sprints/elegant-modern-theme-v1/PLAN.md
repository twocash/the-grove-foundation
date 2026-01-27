# Product Brief: Elegant Modern Theme

**Version:** 1.0
**Status:** Draft
**Sprint Target:** S24-EMT
**PM:** Product Manager Agent
**Reviewed by:** UX Chief, UI/UX Designer

---

## Executive Summary

Replace the current "Quantum Glass" dark theme as the Grove's default with "Elegant Modern" - a refined light theme that presents a more professional, accessible, and visually appealing first impression. This addresses feedback that the current dark theme feels "pretty horrible" while leveraging our robust GroveSkin infrastructure.

## Problem Statement

The current default theme (Quantum Glass v1) is a dark theme with heavy glass morphism effects. While technically functional, it:
- Creates a harsh first impression for new users
- Has accessibility concerns with low contrast text on dark backgrounds
- Feels overly "techy" rather than welcoming for research/academic users
- Does not align with the editorial, "living research" brand identity

## Proposed Solution

Introduce "Elegant Modern" as a new light theme and make it the default. The theme features:
- Clean white/cream backgrounds with high contrast text
- Sophisticated teal accent color (`#005F73`) for professional feel
- Minimal shadows and subtle borders for visual hierarchy
- Typography optimized for extended reading (Inter, Playfair Display, Fira Code)

### User Value Proposition

Users will experience a more refined, accessible interface that:
- Reduces eye strain during extended research sessions
- Presents a credible, academic aesthetic
- Improves readability of research content
- Feels welcoming rather than intimidating

### Strategic Value

This establishes a visual identity that:
- Supports the "Living Research" brand concept
- Demonstrates declarative theming infrastructure maturity
- Creates a foundation for community-created themes
- Differentiates from typical dark-mode-first AI tools

---

## Scope

### In Scope (v1.0)

- Create `elegant-modern-skin.json` with proper GroveSkin schema
- Register theme in `THEME_REGISTRY`
- Add theme to `ThemeSwitcher` component
- Change default theme from `quantum-glass-v1` to `elegant-modern-v1`
- Verify CSS variable injection works correctly
- Test light mode Tailwind `dark:` variant compatibility

### Explicitly Out of Scope

- Modifying existing themes (Quantum Glass remains available)
- Creating additional themes beyond Elegant Modern
- Theme editor UI (existing infrastructure sufficient)
- Mobile-specific theme variants
- User theme preferences sync (localStorage already handles this)

---

## User Flows

### Flow 1: First-Time User Experience

1. User navigates to `/explore` (new Bedrock surface)
2. System loads default theme (now Elegant Modern)
3. User sees clean, light interface with teal accents
4. All UI components render with new CSS variables

### Flow 2: Theme Switching

1. User opens ThemeSwitcher (if exposed in UI)
2. User sees Elegant Modern and Quantum Glass options
3. User selects preferred theme
4. Theme persists to localStorage via `bedrock-active-skin` key
5. Subsequent visits use selected theme

---

## Technical Considerations

### Architecture Alignment

**GroveSkin System (Existing Infrastructure):**
- Themes defined as JSON files in `src/bedrock/themes/`
- Registered in `THEME_REGISTRY` (BedrockUIContext.tsx)
- CSS variables injected at runtime via `useEffect`
- `colorScheme` property syncs with Tailwind `dark:` variants

**No architectural changes required.** This is pure configuration.

### Schema Compliance

The user-provided JSON needs schema corrections to match `GroveSkin` interface:

| Missing Field | Required Value |
|---------------|----------------|
| `layout.density` | `"comfortable"` |
| `layout.spacingScale` | `1.0` |
| `tokens.effects.blur` | `"0px"` (light themes don't blur) |
| `tokens.effects.radius` | `"8px"` |
| `tokens.effects.glow` | `"none"` |
| `tokens.typography` | Full typography token structure |

### Hybrid Cognition Requirements

- **Local (routine):** All theme loading is client-side JavaScript
- **Cloud (pivotal):** N/A - no AI involvement in theme application

### Dependencies

- `src/bedrock/context/BedrockUIContext.tsx` - Theme registry
- `src/bedrock/components/ThemeSwitcher.tsx` - Theme switcher UI
- `src/bedrock/types/GroveSkin.ts` - Type definitions

---

## DEX Pillar Verification

| Pillar | Implementation | Evidence |
|--------|---------------|----------|
| Declarative Sovereignty | Theme is pure JSON config, no code changes to apply | `elegant-modern-skin.json` defines all visual tokens |
| Capability Agnosticism | Theme system has no LLM dependencies | Works regardless of connected model |
| Provenance as Infrastructure | Theme has `provenance` object with version, author, source | `authorId: "system"`, `version: "1.0.0"` |
| Organic Scalability | Adding theme = adding JSON + registry entry | No structural changes needed |

---

## Advisory Council Input

### Consulted Advisors

- **Park (feasibility):** Trivial implementation - just JSON config and registry entry. Theme infrastructure is mature.
- **Adams (engagement):** Light theme with teal accent creates more welcoming first impression. "First 5 seconds matter."
- **Short (narrative):** Clean typography (Inter for UI, Playfair for display) supports editorial voice of living research.

### Known Tensions

- **Dark mode users:** Some users prefer dark themes. Mitigation: Quantum Glass remains available, preference persisted.
- **Brand consistency:** New accent color (teal) differs from grove-forest green. Decision: Teal is professional evolution, original themes still available.

---

## Success Metrics

- Default theme loads correctly at `/explore` and `/bedrock/*`
- All semantic color tokens render correctly (success, warning, error, info)
- ThemeSwitcher shows both themes with accurate previews
- Theme preference persists across browser sessions
- Zero console errors during theme application
- Tailwind `dark:` variants respond correctly to `colorScheme: "light"`

---

## Corrected Theme File

Based on `GroveSkin` interface analysis, here is the schema-compliant JSON:

```json
{
  "id": "elegant-modern-v1",
  "name": "Elegant Modern",
  "colorScheme": "light",
  "provenance": {
    "authorId": "system",
    "authorType": "system",
    "createdAt": "2026-01-24T00:00:00Z",
    "source": "generated-v1",
    "version": "1.0.0"
  },
  "tokens": {
    "colors": {
      "void": "#F9F8F6",
      "panel": "#FFFFFF",
      "solid": "#FFFFFF",
      "elevated": "#FFFFFF",
      "border": "rgba(0, 0, 0, 0.06)",
      "foreground": "#1A1A1A",
      "muted": "#666666",
      "accent": "#005F73",
      "primary": "#005F73",
      "semantic": {
        "success": "#2E7D32",
        "successBg": "rgba(46, 125, 50, 0.08)",
        "successBorder": "rgba(46, 125, 50, 0.2)",
        "warning": "#ED6C02",
        "warningBg": "rgba(237, 108, 2, 0.08)",
        "warningBorder": "rgba(237, 108, 2, 0.2)",
        "error": "#D32F2F",
        "errorBg": "rgba(211, 47, 47, 0.08)",
        "errorBorder": "rgba(211, 47, 47, 0.2)",
        "info": "#0288D1",
        "infoBg": "rgba(2, 136, 209, 0.08)",
        "infoBorder": "rgba(2, 136, 209, 0.2)",
        "accentSecondary": "#005F73",
        "accentSecondaryBg": "rgba(0, 95, 115, 0.08)",
        "accentSecondaryBorder": "rgba(0, 95, 115, 0.2)"
      }
    },
    "effects": {
      "blur": "0px",
      "radius": "8px",
      "glow": "0 2px 8px rgba(0, 0, 0, 0.04)"
    },
    "typography": {
      "display": {
        "family": "'Playfair Display', serif",
        "weight": "600",
        "tracking": "-0.02em"
      },
      "heading": {
        "family": "'Inter', -apple-system, sans-serif",
        "weight": "600",
        "tracking": "-0.01em"
      },
      "body": {
        "family": "'Inter', -apple-system, sans-serif",
        "weight": "400"
      },
      "mono": {
        "family": "'Fira Code', monospace",
        "weight": "400"
      },
      "ui": {
        "family": "'Inter', -apple-system, sans-serif",
        "weight": "500"
      }
    }
  },
  "layout": {
    "density": "comfortable",
    "spacingScale": 1.0
  }
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/bedrock/themes/elegant-modern-skin.json` | CREATE - New theme file |
| `src/bedrock/context/BedrockUIContext.tsx` | ADD import + registry entry + change default |
| `src/bedrock/components/ThemeSwitcher.tsx` | ADD to `THEME_INFO` object |

---

## Implementation Phases

### Phase 1: Theme File (30 min)
- Create `elegant-modern-skin.json` with corrected schema
- Verify JSON syntax

### Phase 2: Registration (30 min)
- Import in `BedrockUIContext.tsx`
- Add to `THEME_REGISTRY`
- Change default theme import

### Phase 3: Switcher UI (30 min)
- Add entry to `THEME_INFO` in ThemeSwitcher
- Define preview colors

### Phase 4: Verification (1 hour)
- Visual verification at `/explore`
- Test theme switching
- Verify localStorage persistence
- Check Tailwind dark mode sync
- E2E screenshot capture

---

*This product brief is ready for review. It has passed DEX alignment verification.*
