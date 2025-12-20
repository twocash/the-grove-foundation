# Architectural Decisions — v0.12e Minimalist Orchard

## ADR-001: Paper Canvas as Chameleon Infrastructure

**Status:** Accepted

**Context:**
The shift to "Minimalist Orchard" (warm bone background, serif typography) was initially framed as aesthetic polish. Strategic review revealed it's actually infrastructure for the "Chameleon" — an adaptive landing surface that morphs based on lens selection.

**Decision:**
Frame v0.12e as **infrastructure**, not polish. The Paper UI aesthetic enables text-morphing effects that would feel jarring on a rigid sci-fi interface.

**Rationale:**
- Sci-Fi UI = cockpit = rigid, you can't "rewrite" a cockpit
- Paper UI = manuscript = made to be written and rewritten
- The warm, organic aesthetic creates psychological permission for content to adapt

**Consequences:**
- Sprint includes component architecture prep (prop interfaces)
- v0.13 "Chameleon" sprint follows immediately
- Documentation references strategic connection

---

## ADR-002: Genesis Components Accept Content Props

**Status:** Accepted

**Context:**
Currently, HeroHook, ProblemStatement, and other Genesis components have hardcoded content. For the Chameleon to work, they need to accept dynamic content tied to the active lens.

**Decision:**
Add optional content props to key Genesis components:
- `HeroHook`: `content?: { headline: string; subtext: string[]; }`
- `ProblemStatement`: `quotes?: Quote[]`
- Other components: similar optional props

Default values preserve current behavior (backward compatible).

**Rationale:**
- Prop drilling is simpler than context for this use case
- Optional props with defaults = zero breaking changes
- Enables v0.13 to inject lens-specific content

**Consequences:**
- Small refactor to extract hardcoded strings into default props
- TypeScript interfaces document expected content shapes
- GenesisPage becomes the "content injector" in v0.13

---

## ADR-003: Preserve Dual Token System (Surface + Foundation)

**Status:** Accepted

**Context:**
Grove has two distinct design systems:
- **Surface** (paper/ink tokens): Light mode, organic, user-facing
- **Foundation** (obsidian/holo tokens): Dark mode, holodeck, admin-facing

Minimalist Orchard changes affect only Surface tokens.

**Decision:**
Modify only Surface tokens (`paper`, `ink`, `grove-*`). Foundation tokens (`obsidian`, `holo-*`) remain untouched.

**Rationale:**
- Clear separation of concerns
- Foundation dark mode is intentionally futuristic — distinct from Surface aesthetic
- Reduces regression risk

**Consequences:**
- Must verify Foundation pages still render correctly after build
- Any shared components using Surface tokens will get new styling

---

## ADR-004: Flip Genesis Default via Feature Flag AND Code Logic

**Status:** Accepted

**Context:**
Currently, SurfaceRouter defaults to `classic` when:
1. No URL param is present
2. Feature flag `genesis-landing` is `false`

The code explicitly returns `'classic'` as the final fallback.

**Decision:**
Change default behavior in two ways:
1. Set `genesis-landing: true` in both schema and JSON files
2. Change SurfaceRouter fallback from `'classic'` to `'genesis'`

**Rationale:**
- Feature flag alone isn't enough — code has hardcoded `'classic'` fallback
- Both changes ensure Genesis is truly the default
- URL param override still works for testing

**Consequences:**
- Clean URLs (`/`) now show Genesis
- `?experience=classic` becomes the escape hatch
- Must update documentation and testing URLs

---

## ADR-005: Additive Font Import (Preserve Existing Fonts)

**Status:** Accepted

**Context:**
Current fonts (Lora, Playfair Display, Inter, JetBrains Mono) may still be used in some components. New fonts (Tenor Sans, EB Garamond) are being added.

**Decision:**
Add new fonts to the Google Fonts import without removing existing fonts. Update font-family definitions to prioritize new fonts.

**Rationale:**
- Safer migration — any hardcoded font references still work
- Allows gradual component-by-component transition if needed
- Minimal risk of breaking existing layouts

**Consequences:**
- Slightly larger font bundle (acceptable tradeoff)
- Old font variables become secondary fallbacks
- Future cleanup sprint could remove unused fonts

---

## ADR-006: Smart Quotes via CSS Feature Settings

**Status:** Accepted

**Context:**
Smart quotes ("curly quotes") improve typographic quality. Options:
1. CSS `font-feature-settings` — automatic, no content changes
2. JavaScript replacement — explicit, more control
3. Build-time transformation — most reliable, complex setup

**Decision:**
Use CSS `font-feature-settings: "kern" 1, "liga" 1, "calt" 1` with `text-rendering: optimizeLegibility` to enable smart typography features.

**Rationale:**
- Zero content changes required
- Works globally across all text
- EB Garamond has good OpenType feature support
- Industry standard approach

**Consequences:**
- Depends on font supporting OpenType features
- Some edge cases (code blocks, JSON) may need exclusion
- May slightly impact render performance (negligible)

---

## ADR-007: Content Prop Interface Design

**Status:** Accepted

**Context:**
For Chameleon to work, Genesis components need consistent content interfaces. Need to decide on shape and naming conventions.

**Decision:**
Use TypeScript interfaces with clear naming:
```typescript
interface HeroContent {
  headline: string;
  subtext: string[];
}

interface QuoteContent {
  text: string;
  author: string;
  title: string;
}
```

Components accept optional `content` or `quotes` props with these shapes.

**Rationale:**
- Explicit types catch errors at compile time
- Arrays for subtext/quotes enable variable-length content
- Optional props preserve backward compatibility

**Consequences:**
- v0.13 will define a LensContentMap with these interfaces
- Content variations can be validated at build time
- Easy to extend with additional fields (e.g., `variant`, `emphasis`)
