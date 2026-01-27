# GroveSkins Modal Styling Plan

> Sprint: S23-SFR-UX-Redesign
> Issue: Research content in SproutFinishingRoom modal is invisible/poorly styled
> Root Cause: CSS variables not properly consumed; hardcoded hex values cause drift
> Status: **PLAN - AWAITING APPROVAL**

---

## Problem Statement

The SproutFinishingRoom modal (and future modals) display markdown content via ReactMarkdown with Tailwind's `prose` plugin. The content is invisible or poorly styled because:

1. **Hardcoded hex values** in `evidence-registry.tsx` cause drift from GroveSkins
2. **Tailwind Typography's prose modifiers** don't reliably work with CSS variables in arbitrary value syntax (e.g., `prose-h1:text-[var(--glass-text-primary)]`)
3. **No GroveSkins integration** for prose/markdown content styling

---

## Current Architecture (How GroveSkins Works)

| Component | Location | Purpose |
|-----------|----------|---------|
| Theme JSON files | `src/bedrock/themes/*.json` | Define tokens (colors, effects, typography) |
| SKIN_CSS_MAP | `src/bedrock/types/GroveSkin.ts` | Maps token keys to CSS variable names |
| BedrockUIContext | `src/bedrock/context/BedrockUIContext.tsx` | Injects CSS variables into `document.documentElement` |
| globals.css | `styles/globals.css` | Contains theme-aware CSS rules for `.bedrock-app` |

**Flow:**
```
Theme JSON → BedrockUIContext → document.documentElement.style.setProperty() → CSS variables available globally
```

**Key CSS Variables (quantum-glass):**
| Variable | Value | Usage |
|----------|-------|-------|
| `--glass-text-primary` | #ffffff | Headings, high contrast |
| `--glass-text-secondary` | #e2e8f0 | Subheadings |
| `--glass-text-body` | #cbd5e1 | Body text |
| `--glass-text-muted` | #94a3b8 | Meta text, timestamps |
| `--neon-cyan` | #06b6d4 | Links, accents |
| `--neon-green` | #10b981 | Success, active |
| `--neon-amber` | #f59e0b | Warning |
| `--glass-border` | #1e293b | Borders |
| `--glass-panel` | rgba(17,24,39,0.6) | Panel backgrounds |

---

## The CORRECT Fix: Extend GroveSkins for Prose Content

### Strategy: Add Theme-Aware CSS Rules to globals.css

Instead of hardcoding hex values in component files, we add CSS rules in `globals.css` that:
1. Target `.prose` content within `.bedrock-app` context
2. Use GroveSkins CSS variables (which respond to theme changes)
3. Override Tailwind Typography's default colors

### Why This Works:
- **Single source of truth**: Colors come from GroveSkins theme JSON
- **Theme-aware**: When user switches themes, prose content updates automatically
- **Future-proof**: ANY modal or component using `.prose` gets correct styling
- **No drift**: No hardcoded hex values in component files

---

## Implementation Plan

### Step 1: Add Prose Theme Rules to globals.css

Add a new section to `styles/globals.css`:

```css
/* ============================================================
   GROVESKINS PROSE CONTENT STYLING (S23-SFR)
   Theme-aware rules for markdown/prose content in modals
   Uses CSS variables from BedrockUIContext injection
   ============================================================ */

/* Prose content within Bedrock UI (modals, panels, etc.) */
.bedrock-app .prose,
.bedrock-app .prose-invert {
  /* Body text uses theme variable */
  --tw-prose-body: var(--glass-text-body, #cbd5e1);
  --tw-prose-headings: var(--glass-text-primary, #ffffff);
  --tw-prose-lead: var(--glass-text-secondary, #e2e8f0);
  --tw-prose-links: var(--neon-cyan, #06b6d4);
  --tw-prose-bold: var(--glass-text-primary, #ffffff);
  --tw-prose-counters: var(--glass-text-muted, #94a3b8);
  --tw-prose-bullets: var(--neon-cyan, #06b6d4);
  --tw-prose-hr: var(--glass-border, #1e293b);
  --tw-prose-quotes: var(--glass-text-secondary, #e2e8f0);
  --tw-prose-quote-borders: var(--neon-cyan, #06b6d4);
  --tw-prose-captions: var(--glass-text-muted, #94a3b8);
  --tw-prose-code: var(--glass-text-secondary, #e2e8f0);
  --tw-prose-pre-code: var(--glass-text-body, #cbd5e1);
  --tw-prose-pre-bg: var(--glass-panel, rgba(17, 24, 39, 0.6));
  --tw-prose-th-borders: var(--glass-border, #1e293b);
  --tw-prose-td-borders: var(--glass-border, #1e293b);
}

/* Ensure headings have proper contrast */
.bedrock-app .prose h1,
.bedrock-app .prose h2,
.bedrock-app .prose h3,
.bedrock-app .prose h4 {
  color: var(--glass-text-primary, #ffffff) !important;
}

/* Body paragraphs use body color */
.bedrock-app .prose p,
.bedrock-app .prose li {
  color: var(--glass-text-body, #cbd5e1);
}

/* Links use accent color */
.bedrock-app .prose a {
  color: var(--neon-cyan, #06b6d4);
}

/* Strong text is primary (white) */
.bedrock-app .prose strong {
  color: var(--glass-text-primary, #ffffff);
}

/* Blockquotes styled with accent border */
.bedrock-app .prose blockquote {
  border-left-color: var(--neon-cyan, #06b6d4);
  color: var(--glass-text-secondary, #e2e8f0);
}
```

### Step 2: Simplify evidence-registry.tsx

Remove all hardcoded hex values from SynthesisBlock. The component becomes:

```tsx
SynthesisBlock: ({ element }) => {
  const props = element.props as SynthesisBlockProps;

  return (
    <article className="mb-6">
      {/* GroveSkins prose styling from globals.css handles colors */}
      <div className="prose prose-invert max-w-none text-[15px] leading-relaxed">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
          {props.content}
        </ReactMarkdown>
      </div>
    </article>
  );
},
```

### Step 3: Update Other Components

Replace hex values with CSS variable references:

| Before | After |
|--------|-------|
| `text-[#ffffff]` | `text-[var(--glass-text-primary)]` |
| `text-[#cbd5e1]` | `text-[var(--glass-text-body)]` |
| `text-[#94a3b8]` | `text-[var(--glass-text-muted)]` |
| `text-[#06b6d4]` | `text-[var(--neon-cyan)]` |
| `text-[#10b981]` | `text-[var(--neon-green)]` |
| `text-[#f59e0b]` | `text-[var(--neon-amber)]` |
| `border-[#1e293b]` | `border-[var(--glass-border)]` |
| `bg-[rgba(17,24,39,0.6)]` | `bg-[var(--glass-panel)]` |

**Alternative (if arbitrary value syntax is unreliable):**
Create utility classes in globals.css:

```css
.text-glass-primary { color: var(--glass-text-primary); }
.text-glass-body { color: var(--glass-text-body); }
.text-glass-muted { color: var(--glass-text-muted); }
.text-neon-cyan { color: var(--neon-cyan); }
.text-neon-green { color: var(--neon-green); }
.border-glass { border-color: var(--glass-border); }
.bg-glass-panel { background: var(--glass-panel); }
```

---

## Verification Checklist

After implementation, verify:

- [ ] All tabs render correctly (Summary, Full Report, Sources)
- [ ] Headings are WHITE (#ffffff), not cyan or invisible
- [ ] Body text is readable (#cbd5e1)
- [ ] Links are cyan (#06b6d4)
- [ ] Theme switching (if available) updates modal colors
- [ ] No hardcoded hex values remain in evidence-registry.tsx

---

## Files to Modify

| File | Change |
|------|--------|
| `styles/globals.css` | Add GroveSkins prose section (Step 1) |
| `evidence-registry.tsx` | Remove hex values, use CSS vars or utility classes (Steps 2-3) |

---

## Design Principle: No Hardcoded Colors

**NEVER set a specific color value in code.** All colors must be user-configurable via GroveSkins.

Why:
- **Pure white (#ffffff) is harsh** - difficult to read, causes eye strain
- **User preference matters** - some users need softer contrast
- **Theme switching** - colors must respond to theme changes
- **Accessibility** - hardcoded values can't adapt to user needs
- **Maintainability** - one source of truth (theme JSON) vs scattered hex values

The correct approach: Components consume CSS variables, theme JSON defines the values.

---

## Why NOT These Approaches

| Approach | Problem |
|----------|---------|
| Hardcoded hex in components | Drift from theme; doesn't update on theme switch; ignores user preference |
| `#ffffff` for "white" text | Too harsh; not accessible; not user-configurable |
| Tailwind prose modifiers with arbitrary values | Unreliable; specificity issues |
| Custom heading components in ReactMarkdown | Removes semantic structure; complex maintenance |
| Inline styles | No theme awareness; maintenance nightmare |

---

## Diagnostic: What's Blocking the Styles?

Before implementing fixes, we need to identify what CSS is currently being applied to problematic elements.

### Known Problem Elements (from DevTools inspection):
- `<strong>` - styles not applied correctly
- `<p>` - styles not applied correctly
- `<h1>`, `<h2>`, `<h3>` - headings invisible or wrong color

### Diagnostic Component

Add this temporary diagnostic to `evidence-registry.tsx` SynthesisBlock:

```tsx
// DIAGNOSTIC: Log computed styles for problematic elements
useEffect(() => {
  const container = document.querySelector('.synthesis-diagnostic');
  if (!container) return;

  const elements = {
    h1: container.querySelector('h1'),
    h2: container.querySelector('h2'),
    h3: container.querySelector('h3'),
    p: container.querySelector('p'),
    strong: container.querySelector('strong'),
  };

  console.group('[SynthesisBlock Diagnostic] Computed Styles');
  Object.entries(elements).forEach(([tag, el]) => {
    if (el) {
      const computed = window.getComputedStyle(el);
      console.log(`<${tag}>:`, {
        color: computed.color,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        fontFamily: computed.fontFamily,
        // Check what CSS rule is winning
        appliedColor: el.style.color || '(not inline)',
      });
    } else {
      console.log(`<${tag}>: NOT FOUND in content`);
    }
  });
  console.groupEnd();
}, [props.content]);
```

Then add `synthesis-diagnostic` class to the container div.

### What to Look For in DevTools:

1. **Computed Styles Panel** - What's the final `color` value?
2. **Styles Panel** - Which CSS rule is winning? Look for:
   - Crossed-out rules (overridden)
   - Rules with higher specificity
   - `!important` declarations
3. **Check the cascade**:
   - Is `.prose` applying default dark text?
   - Is `.prose-invert` being applied?
   - Are the `prose-h1:text-white` modifiers generating CSS at all?

### Hypothesis to Test:

1. **Tailwind Typography defaults** - prose plugin sets dark text colors that override our modifiers
2. **Specificity war** - `.bedrock-app` rules in globals.css may conflict
3. **Build issue** - prose modifiers with arbitrary values may not compile
4. **Missing prose-invert** - dark mode inversion not applied

---

## Success Criteria

1. **Zero hardcoded colors** in evidence-registry.tsx
2. **Theme-aware prose** - colors come from GroveSkins CSS variables
3. **Future modals** automatically get correct styling by using `.prose` within `.bedrock-app`
4. **Documented pattern** for extending GroveSkins to new UI contexts
5. **Diagnostic confirms** styles are being applied correctly

---

## Approval Required

**This plan requires user approval before implementation.**

Questions for approval:
1. Is the globals.css approach acceptable, or should we extend the GroveSkin.ts schema instead?
2. Should we add utility classes (`.text-glass-primary`) or rely on arbitrary value syntax (`text-[var(--glass-text-primary)]`)?
3. Are there other modals/components that need this pattern applied?
