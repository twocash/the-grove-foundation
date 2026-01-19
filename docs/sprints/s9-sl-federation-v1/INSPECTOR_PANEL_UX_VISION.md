# Federation Console Inspector Panel UX Vision

**Author:** UX Chief (Claude Opus 4.5)
**Date:** 2026-01-18
**Sprint:** S9-SL-Federation-v1 (Post-Sprint UX Debt)
**Status:** Vision Document - Ready for Review

---

## Executive Summary

The Federation Console shipped with functional but unusable inspector panels. This vision document establishes the UX standard for all four editor types (Grove, TierMapping, Exchange, Trust), aligning them with the ExperienceConsole factory pattern and Quantum Glass v1.0 design system.

**Core Principle:** *"Editors that feel like natural extensions of the console, not afterthoughts."*

---

## Vision Statement

Federation inspector panels shall:

1. **Match the Factory Pattern** - Use `InspectorSection`, `InspectorDivider`, `BufferedInput/Textarea` consistently
2. **Group Fields by Purpose** - Logical sections with clear headers (Identity, Configuration, Status, etc.)
3. **Use Consistent Spacing** - `space-y-3` within sections, `p-5` for section padding, `InspectorDivider` between
4. **Support Mobile** - Responsive layouts that work on 320px+ screens
5. **Follow Quantum Glass v1.0** - CSS variables: `--glass-*`, `--neon-*` color system
6. **Enable Provenance** - Show creation/modification timestamps, author where applicable
7. **Be Accessible** - Proper labels, keyboard navigation, focus states, screen reader support

---

## Design System Reference: Quantum Glass v1.0

### Color Tokens

```css
/* Backgrounds */
--glass-void: #030712        /* Deepest background */
--glass-solid: #111827       /* Card/panel backgrounds */
--glass-elevated: rgba(30, 41, 59, 0.4)  /* Hover states, raised elements */
--glass-panel: rgba(17, 24, 39, 0.6)     /* Translucent overlays */

/* Borders */
--glass-border: #1e293b              /* Default borders */
--glass-border-hover: #334155        /* Hover state borders */
--glass-border-active: rgba(16, 185, 129, 0.5)   /* Active/success */
--glass-border-selected: rgba(6, 182, 212, 0.5)  /* Selected state */

/* Text */
--glass-text-primary: #ffffff        /* Headings, important text */
--glass-text-secondary: #e2e8f0      /* Body text */
--glass-text-muted: #94a3b8          /* Labels, descriptions */
--glass-text-subtle: #64748b         /* Placeholder, disabled */

/* Accents */
--neon-cyan: #00D4FF                 /* Primary accent */
--neon-green: #10b981                /* Success states */
--neon-amber: #f59e0b                /* Warnings, tokens */
--neon-red: #ef4444                  /* Error, danger */
```

### Typography

- **Section headers:** `text-sm font-medium text-[var(--glass-text-primary)]`
- **Field labels:** `text-xs text-[var(--glass-text-muted)]`
- **Body text:** `text-sm text-[var(--glass-text-secondary)]`
- **Descriptions:** `text-xs text-[var(--glass-text-muted)]`
- **Monospace (IDs):** `font-mono text-sm text-[var(--glass-text-muted)]`

### Spacing

- **Section padding:** `p-5` (InspectorSection default)
- **Within sections:** `space-y-3` or `space-y-4`
- **Grid gaps:** `gap-3` (tight) or `gap-4` (standard)
- **Input internal:** `px-3 py-2`

---

## Component Patterns

### Required Imports

```typescript
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { GlassButton } from '../../primitives/GlassButton';
```

### Standard Input Field

```html
<div>
  <label
    htmlFor="field-name"
    className="block text-xs text-[var(--glass-text-muted)] mb-1"
  >
    Field Label
  </label>
  <BufferedInput
    id="field-name"
    value={value}
    onChange={(v) => patchPayload('field', v)}
    placeholder="Placeholder text..."
    className="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
               border border-[var(--glass-border)] text-[var(--glass-text-primary)]
               placeholder:text-[var(--glass-text-subtle)]
               focus:outline-none focus:border-[var(--neon-cyan)]
               focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
  />
  <p className="text-xs text-[var(--glass-text-muted)] mt-1">
    Optional helper text
  </p>
</div>
```

### Read-Only Badge

```html
<div className="flex items-center gap-2">
  <span className="text-xs text-[var(--glass-text-muted)]">Field Label</span>
  <code className="px-2 py-0.5 rounded-full bg-[var(--glass-surface)]
                   text-sm font-mono text-[var(--glass-text-secondary)]">
    {value}
  </code>
  <span className="text-xs text-[var(--glass-text-muted)]">(immutable)</span>
</div>
```

### Two-Column Grid

```html
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>...</div>
  <div>...</div>
</div>
```

---

## HTML Wireframes

### 1. GroveEditor Wireframe

**Sections:** Identity | Connection | Technical | Trust (read-only)

```html
<!-- GroveEditor: Redesigned Layout -->
<div class="flex flex-col h-full" data-testid="grove-editor">

  <!-- STATUS BANNER (like FeatureFlagEditor) -->
  <div class="flex items-center gap-3 px-4 py-3 border-b transition-colors
              bg-green-500/10 border-green-500/20">
    <!-- Status dot with pulse -->
    <span class="relative flex h-3 w-3">
      <span class="animate-ping absolute inline-flex h-full w-full
                   rounded-full bg-green-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
    </span>

    <!-- Status text -->
    <div class="flex-1">
      <span class="text-sm font-medium text-green-300">Connected</span>
      <p class="text-xs text-green-400/70">Grove is actively participating in federation</p>
    </div>

    <!-- Connection toggle -->
    <button class="px-3 py-1.5 rounded-lg text-sm font-medium
                   bg-red-500/20 text-red-400 hover:bg-red-500/30">
      Disconnect
    </button>
  </div>

  <!-- HEADER -->
  <div class="px-4 py-3 border-b border-[var(--glass-border)]">
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
        forest
      </span>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
          Anthropic Research Grove
        </h1>
        <div class="flex items-center gap-2 mt-1">
          <code class="font-mono text-sm text-[var(--glass-text-muted)]">
            anthropic-grove-001
          </code>
          <button class="p-0.5 hover:text-[var(--neon-cyan)] text-[var(--glass-text-subtle)]">
            <span class="material-symbols-outlined text-sm">content_copy</span>
          </button>
        </div>
      </div>
      <!-- Trust level badge -->
      <div class="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                  bg-green-500/20 text-green-400">
        <span class="text-sm">★★★☆</span>
        Trusted
      </div>
    </div>
  </div>

  <!-- SCROLLABLE CONTENT -->
  <div class="flex-1 overflow-y-auto">

    <!-- === IDENTITY SECTION === -->
    <section class="p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium uppercase tracking-wider
                   text-[var(--glass-text-muted)]">
          Identity
        </h4>
      </div>

      <div class="space-y-3">
        <!-- Grove Name -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Grove Name
          </label>
          <input type="text" value="Anthropic Research Grove"
                 class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]" />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Description
          </label>
          <textarea rows="3"
                    class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                           border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                           resize-none focus:outline-none focus:border-[var(--neon-cyan)]"
                    placeholder="Brief description of this grove community..."></textarea>
        </div>

        <!-- Grove ID (read-only) -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--glass-text-muted)]">Grove ID</span>
          <code class="px-2 py-0.5 rounded-full bg-[var(--glass-elevated)]
                       text-sm font-mono text-[var(--glass-text-secondary)]">
            anthropic-grove-001
          </code>
          <span class="text-xs text-[var(--glass-text-muted)]">(immutable)</span>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === CONNECTION SECTION === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Connection
      </h4>

      <div class="space-y-3">
        <!-- Status Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
              Status
            </label>
            <select class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                          border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                          focus:outline-none focus:border-[var(--neon-cyan)]">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="degraded">Degraded</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
              Connection
            </label>
            <select class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                          border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                          focus:outline-none focus:border-[var(--neon-cyan)]">
              <option value="connected">Connected</option>
              <option value="connecting">Connecting...</option>
              <option value="disconnected">Disconnected</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <!-- Endpoint -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Federation Endpoint
          </label>
          <input type="url" value="https://api.anthropic-grove.research/federation"
                 class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        font-mono text-sm
                        focus:outline-none focus:border-[var(--neon-cyan)]" />
        </div>

        <!-- Trust Score Visualization -->
        <div class="p-4 rounded-lg bg-[var(--glass-elevated)]">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-[var(--glass-text-secondary)]">Trust Score</span>
            <span class="text-lg font-bold text-green-400">85%</span>
          </div>
          <div class="h-2 bg-[var(--glass-solid)] rounded-full overflow-hidden">
            <div class="h-full w-[85%] bg-green-500 rounded-full"></div>
          </div>
          <div class="flex justify-between mt-1 text-xs text-[var(--glass-text-muted)]">
            <span>New</span>
            <span>Established</span>
            <span>Trusted</span>
            <span>Verified</span>
          </div>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === TECHNICAL SECTION (Collapsible) === -->
    <section class="p-5 space-y-4">
      <div class="flex items-center justify-between cursor-pointer">
        <h4 class="text-sm font-medium uppercase tracking-wider
                   text-[var(--glass-text-muted)]">
          Technical
        </h4>
        <span class="material-symbols-outlined text-[var(--glass-text-muted)]">
          expand_more
        </span>
      </div>

      <div class="space-y-3">
        <!-- Tier System -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Tier System Name
          </label>
          <input type="text" value="Botanical"
                 class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]" />
        </div>

        <!-- Tiers List -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-2">
            Tiers
          </label>
          <div class="space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]">
              <span class="text-lg">🌱</span>
              <span class="flex-1 text-[var(--glass-text-primary)]">Seedling</span>
              <span class="text-xs text-[var(--glass-text-muted)]">Level 1</span>
              <button class="p-1 text-[var(--glass-text-subtle)]
                             hover:text-[var(--glass-text-primary)]">
                <span class="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]">
              <span class="text-lg">🌿</span>
              <span class="flex-1 text-[var(--glass-text-primary)]">Sprout</span>
              <span class="text-xs text-[var(--glass-text-muted)]">Level 2</span>
              <button class="p-1 text-[var(--glass-text-subtle)]
                             hover:text-[var(--glass-text-primary)]">
                <span class="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]">
              <span class="text-lg">🌳</span>
              <span class="flex-1 text-[var(--glass-text-primary)]">Tree</span>
              <span class="text-xs text-[var(--glass-text-muted)]">Level 3</span>
              <button class="p-1 text-[var(--glass-text-subtle)]
                             hover:text-[var(--glass-text-primary)]">
                <span class="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
          </div>
          <button class="w-full mt-2 py-2 rounded-lg border border-dashed
                         border-[var(--glass-border)] text-[var(--glass-text-muted)]
                         hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)]
                         flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-sm">add</span>
            Add Tier
          </button>
        </div>

        <!-- Capabilities -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-2">
            Capabilities
          </label>
          <div class="flex flex-wrap gap-2">
            <span class="flex items-center gap-1 px-2 py-1 rounded-lg
                         bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] text-sm">
              knowledge-exchange
              <button class="hover:text-white">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
            <span class="flex items-center gap-1 px-2 py-1 rounded-lg
                         bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] text-sm">
              tier-mapping
              <button class="hover:text-white">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
            <span class="flex items-center gap-1 px-2 py-1 rounded-lg
                         bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] text-sm">
              trust-scoring
              <button class="hover:text-white">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          </div>
          <div class="flex gap-2 mt-2">
            <input type="text" placeholder="Add capability..."
                   class="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                          border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                          focus:outline-none focus:border-[var(--neon-cyan)]" />
            <button class="px-4 py-2 rounded-lg bg-[var(--neon-cyan)]/20
                           text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30">
              Add
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === STATISTICS (Read-only) === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Statistics
      </h4>

      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 rounded-lg bg-[var(--glass-elevated)]">
          <div class="text-xs text-[var(--glass-text-muted)]">Total Sprouts</div>
          <div class="text-2xl font-bold text-[var(--glass-text-primary)]">1,247</div>
        </div>
        <div class="p-4 rounded-lg bg-[var(--glass-elevated)]">
          <div class="text-xs text-[var(--glass-text-muted)]">Exchanges</div>
          <div class="text-2xl font-bold text-[var(--glass-text-primary)]">342</div>
        </div>
        <div class="p-4 rounded-lg bg-[var(--glass-elevated)]">
          <div class="text-xs text-[var(--glass-text-muted)]">Trust Level</div>
          <div class="text-lg font-medium text-green-400">★★★☆ Trusted</div>
        </div>
        <div class="p-4 rounded-lg bg-[var(--glass-elevated)]">
          <div class="text-xs text-[var(--glass-text-muted)]">Last Sync</div>
          <div class="text-sm text-[var(--glass-text-secondary)]">2 min ago</div>
        </div>
      </div>
    </section>

  </div>

  <!-- FOOTER ACTIONS -->
  <div class="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
    <button class="w-full px-4 py-2.5 rounded-lg bg-[var(--neon-cyan)]
                   text-[var(--glass-void)] font-medium hover:bg-[var(--neon-cyan)]/90">
      Save Changes
    </button>
    <div class="flex items-center gap-2">
      <button class="flex-1 px-4 py-2 rounded-lg border border-[var(--glass-border)]
                     text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)]">
        <span class="material-symbols-outlined text-sm mr-1">content_copy</span>
        Duplicate
      </button>
      <button class="flex-1 px-4 py-2 rounded-lg border border-red-500/30
                     text-red-400 hover:bg-red-500/10">
        <span class="material-symbols-outlined text-sm mr-1">delete</span>
        Delete
      </button>
    </div>
  </div>
</div>
```

---

### 2. TierMappingEditor Wireframe

**Sections:** Grove Pair | Status & Confidence | Tier Equivalences | Validation

```html
<!-- TierMappingEditor: Redesigned Layout -->
<div class="flex flex-col h-full" data-testid="tier-mapping-editor">

  <!-- HEADER with visual source->target -->
  <div class="px-4 py-3 border-b border-[var(--glass-border)]">
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
        compare_arrows
      </span>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-semibold text-[var(--glass-text-primary)]">
          Tier Mapping
        </h1>
        <div class="flex items-center gap-2 mt-1 text-sm">
          <span class="text-[var(--glass-text-secondary)]">research-grove</span>
          <span class="material-symbols-outlined text-blue-400">arrow_forward</span>
          <span class="text-[var(--glass-text-secondary)]">academic-grove</span>
        </div>
      </div>
      <!-- Status badge -->
      <div class="px-2 py-1 rounded-full text-xs font-medium
                  bg-green-500/20 text-green-400">
        Accepted
      </div>
    </div>
  </div>

  <!-- SCROLLABLE CONTENT -->
  <div class="flex-1 overflow-y-auto">

    <!-- === GROVE PAIR SECTION === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Grove Pair
      </h4>

      <!-- Visual connection diagram -->
      <div class="flex items-center gap-4 p-4 rounded-lg bg-[var(--glass-elevated)]">
        <div class="flex-1 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12
                      rounded-full bg-[var(--neon-cyan)]/20 mb-2">
            <span class="material-symbols-outlined text-[var(--neon-cyan)]">forest</span>
          </div>
          <div class="text-xs text-[var(--glass-text-muted)]">Source</div>
          <input type="text" value="research-grove"
                 class="mt-1 w-full px-2 py-1 text-center text-sm rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]
                        text-[var(--glass-text-primary)] focus:outline-none
                        focus:border-[var(--neon-cyan)]" />
        </div>

        <div class="flex flex-col items-center">
          <span class="material-symbols-outlined text-2xl text-blue-400">
            compare_arrows
          </span>
          <span class="text-xs text-[var(--glass-text-muted)] mt-1">maps to</span>
        </div>

        <div class="flex-1 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12
                      rounded-full bg-[var(--neon-cyan)]/20 mb-2">
            <span class="material-symbols-outlined text-[var(--neon-cyan)]">forest</span>
          </div>
          <div class="text-xs text-[var(--glass-text-muted)]">Target</div>
          <input type="text" value="academic-grove"
                 class="mt-1 w-full px-2 py-1 text-center text-sm rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]
                        text-[var(--glass-text-primary)] focus:outline-none
                        focus:border-[var(--neon-cyan)]" />
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === STATUS & CONFIDENCE === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Status & Confidence
      </h4>

      <div class="grid grid-cols-2 gap-4">
        <!-- Status -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Mapping Status
          </label>
          <select class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]">
            <option value="draft">Draft</option>
            <option value="proposed">Proposed</option>
            <option value="accepted" selected>Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <!-- Confidence Score Visualization -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Confidence Score
          </label>
          <div class="relative">
            <input type="range" min="0" max="100" value="85"
                   class="w-full h-2 rounded-full appearance-none cursor-pointer
                          bg-[var(--glass-solid)]
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-4
                          [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-[var(--neon-cyan)]" />
            <div class="flex justify-between mt-1">
              <span class="text-xs text-[var(--glass-text-muted)]">0%</span>
              <span class="text-sm font-medium text-green-400">85%</span>
              <span class="text-xs text-[var(--glass-text-muted)]">100%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Confidence Indicator Bar -->
      <div class="p-3 rounded-lg bg-[var(--glass-elevated)]">
        <div class="h-3 bg-[var(--glass-solid)] rounded-full overflow-hidden">
          <div class="h-full w-[85%] rounded-full transition-all"
               style="background: linear-gradient(90deg, #10b981, #00D4FF)"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-[var(--glass-text-muted)]">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <span>Verified</span>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === TIER EQUIVALENCES === -->
    <section class="p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium uppercase tracking-wider
                   text-[var(--glass-text-muted)]">
          Tier Equivalences
        </h4>
        <span class="text-xs text-[var(--glass-text-muted)]">3 mappings</span>
      </div>

      <p class="text-xs text-[var(--glass-text-muted)]">
        Define how tiers from the source grove translate to the target grove's tier system.
      </p>

      <!-- Equivalence List -->
      <div class="space-y-2">
        <!-- Equivalence Row 1 -->
        <div class="flex items-center gap-3 p-3 rounded-lg
                    bg-[var(--glass-solid)] border border-[var(--glass-border)]
                    hover:border-[var(--glass-border-hover)]">
          <div class="flex-1 flex items-center gap-2">
            <span class="text-lg">🌱</span>
            <span class="text-[var(--glass-text-primary)]">Seedling</span>
          </div>
          <span class="material-symbols-outlined text-blue-400">arrow_forward</span>
          <div class="flex-1 flex items-center gap-2">
            <span class="text-lg">📖</span>
            <span class="text-[var(--glass-text-primary)]">Freshman</span>
          </div>
          <span class="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
            exact
          </span>
          <button class="p-1 text-[var(--glass-text-subtle)]
                         hover:text-[var(--glass-text-primary)]">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button class="p-1 text-red-400 hover:text-red-300">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>

        <!-- Equivalence Row 2 -->
        <div class="flex items-center gap-3 p-3 rounded-lg
                    bg-[var(--glass-solid)] border border-[var(--glass-border)]
                    hover:border-[var(--glass-border-hover)]">
          <div class="flex-1 flex items-center gap-2">
            <span class="text-lg">🌿</span>
            <span class="text-[var(--glass-text-primary)]">Sprout</span>
          </div>
          <span class="material-symbols-outlined text-blue-400">arrow_forward</span>
          <div class="flex-1 flex items-center gap-2">
            <span class="text-lg">📚</span>
            <span class="text-[var(--glass-text-primary)]">Sophomore</span>
          </div>
          <span class="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
            approximate
          </span>
          <button class="p-1 text-[var(--glass-text-subtle)]
                         hover:text-[var(--glass-text-primary)]">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button class="p-1 text-red-400 hover:text-red-300">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>

        <!-- Equivalence Row 3 -->
        <div class="flex items-center gap-3 p-3 rounded-lg
                    bg-[var(--glass-solid)] border border-[var(--glass-border)]
                    hover:border-[var(--glass-border-hover)]">
          <div class="flex-1 flex items-center gap-2">
            <span class="text-lg">🌳</span>
            <span class="text-[var(--glass-text-primary)]">Tree</span>
          </div>
          <span class="material-symbols-outlined text-blue-400">arrow_forward</span>
          <div class="flex-1 flex items-center gap-2">
            <span class="text-lg">🎓</span>
            <span class="text-[var(--glass-text-primary)]">Graduate</span>
          </div>
          <span class="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
            superset
          </span>
          <button class="p-1 text-[var(--glass-text-subtle)]
                         hover:text-[var(--glass-text-primary)]">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button class="p-1 text-red-400 hover:text-red-300">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>

      <!-- Add New Mapping -->
      <div class="p-4 rounded-lg border border-dashed border-[var(--glass-border)]">
        <div class="text-xs text-[var(--glass-text-muted)] mb-3">Add New Mapping</div>
        <div class="flex items-center gap-2">
          <input type="text" placeholder="Source tier..."
                 class="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]" />
          <span class="material-symbols-outlined text-blue-400">arrow_forward</span>
          <input type="text" placeholder="Target tier..."
                 class="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]" />
        </div>
        <div class="flex items-center gap-2 mt-3">
          <select class="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]">
            <option value="exact">Exact - Identical meaning and scope</option>
            <option value="approximate">Approximate - Similar but not identical</option>
            <option value="subset">Subset - Source is more specific</option>
            <option value="superset">Superset - Source is broader</option>
          </select>
          <button class="px-4 py-2 rounded-lg bg-[var(--neon-cyan)]/20
                         text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30
                         disabled:opacity-50">
            Add Mapping
          </button>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === VALIDATION (Read-only, collapsible) === -->
    <section class="p-5 space-y-4">
      <div class="flex items-center justify-between cursor-pointer">
        <h4 class="text-sm font-medium uppercase tracking-wider
                   text-[var(--glass-text-muted)]">
          Validation
        </h4>
        <span class="material-symbols-outlined text-[var(--glass-text-muted)]">
          expand_more
        </span>
      </div>

      <div class="p-4 rounded-lg bg-[var(--glass-elevated)]">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-xs text-[var(--glass-text-muted)]">Validated At</span>
            <div class="text-[var(--glass-text-secondary)]">Jan 15, 2026 at 3:42 PM</div>
          </div>
          <div>
            <span class="text-xs text-[var(--glass-text-muted)]">Validated By</span>
            <div class="text-[var(--glass-text-secondary)]">System (Auto)</div>
          </div>
        </div>
      </div>
    </section>

  </div>

  <!-- FOOTER ACTIONS (same pattern) -->
  <div class="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
    <button class="w-full px-4 py-2.5 rounded-lg bg-[var(--neon-cyan)]
                   text-[var(--glass-void)] font-medium hover:bg-[var(--neon-cyan)]/90">
      Save Changes
    </button>
    <div class="flex items-center gap-2">
      <button class="flex-1 px-4 py-2 rounded-lg border border-[var(--glass-border)]
                     text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)]">
        <span class="material-symbols-outlined text-sm mr-1">content_copy</span>
        Duplicate
      </button>
      <button class="flex-1 px-4 py-2 rounded-lg border border-red-500/30
                     text-red-400 hover:bg-red-500/10">
        <span class="material-symbols-outlined text-sm mr-1">delete</span>
        Delete
      </button>
    </div>
  </div>
</div>
```

---

### 3. ExchangeEditor Wireframe

**Sections:** Exchange Type | Grove Parties | Content Details | Tier Mapping | Status | Timeline

```html
<!-- ExchangeEditor: Redesigned Layout -->
<div class="flex flex-col h-full" data-testid="exchange-editor">

  <!-- STATUS BANNER -->
  <div class="flex items-center gap-3 px-4 py-3 border-b transition-colors
              bg-amber-500/10 border-amber-500/20">
    <span class="relative flex h-3 w-3">
      <span class="animate-ping absolute inline-flex h-full w-full
                   rounded-full bg-amber-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
    </span>
    <div class="flex-1">
      <span class="text-sm font-medium text-amber-300">Pending Approval</span>
      <p class="text-xs text-amber-400/70">Waiting for provider grove to accept</p>
    </div>
    <button class="px-3 py-1.5 rounded-lg text-sm font-medium
                   bg-green-500/20 text-green-400 hover:bg-green-500/30">
      Approve
    </button>
    <button class="px-3 py-1.5 rounded-lg text-sm font-medium
                   bg-red-500/20 text-red-400 hover:bg-red-500/30">
      Reject
    </button>
  </div>

  <!-- HEADER -->
  <div class="px-4 py-3 border-b border-[var(--glass-border)]">
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
        swap_horiz
      </span>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-semibold text-[var(--glass-text-primary)]">
          Knowledge Exchange
        </h1>
        <div class="flex items-center gap-2 mt-1">
          <span class="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
            Request
          </span>
          <span class="text-sm text-[var(--glass-text-muted)]">Sprout Content</span>
        </div>
      </div>
      <!-- Token Value -->
      <div class="flex items-center gap-1 px-3 py-1.5 rounded-lg
                  bg-amber-500/20 text-amber-400">
        <span class="material-symbols-outlined text-sm">token</span>
        <span class="font-bold">15</span>
        <span class="text-xs">tokens</span>
      </div>
    </div>
  </div>

  <!-- SCROLLABLE CONTENT -->
  <div class="flex-1 overflow-y-auto">

    <!-- === EXCHANGE TYPE SECTION === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Exchange Type
      </h4>

      <div class="grid grid-cols-2 gap-4">
        <!-- Type -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Direction
          </label>
          <select class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]">
            <option value="request">Request (Incoming)</option>
            <option value="offer">Offer (Outgoing)</option>
          </select>
        </div>

        <!-- Content Type -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Content Type
          </label>
          <select class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]">
            <option value="sprout">Sprout (15 tokens)</option>
            <option value="concept">Concept (25 tokens)</option>
            <option value="methodology">Methodology (50 tokens)</option>
            <option value="dataset">Dataset (100 tokens)</option>
          </select>
        </div>
      </div>

      <!-- Token Cost Preview -->
      <div class="p-4 rounded-lg bg-[var(--glass-elevated)] flex items-center justify-between">
        <div>
          <span class="text-sm text-[var(--glass-text-secondary)]">Base Token Cost</span>
          <p class="text-xs text-[var(--glass-text-muted)]">
            Cost varies by content type and quality
          </p>
        </div>
        <div class="flex items-center gap-2 text-amber-400">
          <span class="material-symbols-outlined">token</span>
          <span class="text-2xl font-bold">15</span>
          <span class="text-sm">tokens</span>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === GROVE PARTIES === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Grove Parties
      </h4>

      <!-- Visual connection -->
      <div class="flex items-center gap-4 p-4 rounded-lg bg-[var(--glass-elevated)]">
        <div class="flex-1 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12
                      rounded-full bg-purple-500/20 mb-2">
            <span class="material-symbols-outlined text-purple-400">person</span>
          </div>
          <div class="text-xs text-[var(--glass-text-muted)]">Requesting</div>
          <input type="text" value="my-grove"
                 class="mt-1 w-full px-2 py-1 text-center text-sm rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]
                        text-[var(--glass-text-primary)] focus:outline-none
                        focus:border-[var(--neon-cyan)]" />
        </div>

        <div class="flex flex-col items-center">
          <span class="material-symbols-outlined text-2xl text-amber-400 animate-pulse">
            sync_alt
          </span>
          <span class="text-xs text-[var(--glass-text-muted)] mt-1">exchange</span>
        </div>

        <div class="flex-1 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12
                      rounded-full bg-green-500/20 mb-2">
            <span class="material-symbols-outlined text-green-400">forest</span>
          </div>
          <div class="text-xs text-[var(--glass-text-muted)]">Providing</div>
          <input type="text" value="partner-grove"
                 class="mt-1 w-full px-2 py-1 text-center text-sm rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]
                        text-[var(--glass-text-primary)] focus:outline-none
                        focus:border-[var(--neon-cyan)]" />
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === CONTENT DETAILS === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Content Details
      </h4>

      <div class="space-y-3">
        <!-- Query -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Search Query
          </label>
          <textarea rows="3"
                    class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                           border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                           resize-none focus:outline-none focus:border-[var(--neon-cyan)]"
                    placeholder="Describe the content you're looking for..."></textarea>
          <p class="text-xs text-[var(--glass-text-muted)] mt-1">
            For requests: describe what you need. For offers: describe what you're providing.
          </p>
        </div>

        <!-- Content ID -->
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Content ID (for offers)
          </label>
          <input type="text" placeholder="sprout-123 or concept-456"
                 class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        font-mono focus:outline-none focus:border-[var(--neon-cyan)]" />
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === TIER MAPPING === -->
    <section class="p-5 space-y-4">
      <div class="flex items-center justify-between cursor-pointer">
        <h4 class="text-sm font-medium uppercase tracking-wider
                   text-[var(--glass-text-muted)]">
          Tier Mapping
        </h4>
        <span class="material-symbols-outlined text-[var(--glass-text-muted)]">
          expand_more
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Source Tier
          </label>
          <input type="text" value="sprout"
                 class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]" />
        </div>
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Mapped Tier
          </label>
          <div class="flex items-center gap-2">
            <input type="text" value="sophomore" readonly
                   class="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-elevated)]
                          border border-[var(--glass-border)] text-[var(--glass-text-secondary)]" />
            <span class="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
              auto
            </span>
          </div>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === STATUS WORKFLOW === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Status
      </h4>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Current Status
          </label>
          <select class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Final Token Value
          </label>
          <div class="flex items-center">
            <span class="material-symbols-outlined text-amber-400 mr-2">token</span>
            <input type="number" placeholder="Calculated on completion"
                   class="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                          border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                          focus:outline-none focus:border-[var(--neon-cyan)]" />
          </div>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === TIMELINE (Read-only) === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Timeline
      </h4>

      <div class="relative pl-6">
        <!-- Timeline line -->
        <div class="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--glass-border)]"></div>

        <!-- Initiated -->
        <div class="relative flex items-start gap-4 mb-4">
          <div class="absolute left-[-21px] w-4 h-4 rounded-full bg-blue-500
                      flex items-center justify-center">
            <span class="w-2 h-2 rounded-full bg-white"></span>
          </div>
          <div>
            <div class="text-sm font-medium text-[var(--glass-text-primary)]">Initiated</div>
            <div class="text-xs text-[var(--glass-text-muted)]">Jan 18, 2026 at 2:30 PM</div>
          </div>
        </div>

        <!-- Current (Pending) -->
        <div class="relative flex items-start gap-4 mb-4">
          <div class="absolute left-[-21px] w-4 h-4 rounded-full bg-amber-500
                      flex items-center justify-center animate-pulse">
            <span class="w-2 h-2 rounded-full bg-white"></span>
          </div>
          <div>
            <div class="text-sm font-medium text-amber-400">Pending Approval</div>
            <div class="text-xs text-[var(--glass-text-muted)]">Waiting since 4 hours</div>
          </div>
        </div>

        <!-- Future (Completed) -->
        <div class="relative flex items-start gap-4 opacity-50">
          <div class="absolute left-[-21px] w-4 h-4 rounded-full bg-[var(--glass-border)]
                      flex items-center justify-center">
            <span class="w-2 h-2 rounded-full bg-[var(--glass-text-muted)]"></span>
          </div>
          <div>
            <div class="text-sm text-[var(--glass-text-muted)]">Completed</div>
            <div class="text-xs text-[var(--glass-text-subtle)]">Pending</div>
          </div>
        </div>
      </div>
    </section>

  </div>

  <!-- FOOTER ACTIONS -->
  <div class="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
    <button class="w-full px-4 py-2.5 rounded-lg bg-[var(--neon-cyan)]
                   text-[var(--glass-void)] font-medium hover:bg-[var(--neon-cyan)]/90">
      Save Changes
    </button>
    <div class="flex items-center gap-2">
      <button class="flex-1 px-4 py-2 rounded-lg border border-[var(--glass-border)]
                     text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)]">
        <span class="material-symbols-outlined text-sm mr-1">content_copy</span>
        Duplicate
      </button>
      <button class="flex-1 px-4 py-2 rounded-lg border border-red-500/30
                     text-red-400 hover:bg-red-500/10">
        <span class="material-symbols-outlined text-sm mr-1">delete</span>
        Delete
      </button>
    </div>
  </div>
</div>
```

---

### 4. TrustEditor Wireframe

**Sections:** Grove Pair | Overall Trust | Component Scores | Exchange Statistics | Verification | History

```html
<!-- TrustEditor: Redesigned Layout -->
<div class="flex flex-col h-full" data-testid="trust-editor">

  <!-- TRUST LEVEL BANNER -->
  <div class="flex items-center gap-3 px-4 py-3 border-b transition-colors
              bg-green-500/10 border-green-500/20">
    <div class="flex items-center gap-2">
      <span class="text-2xl">★★★☆</span>
      <span class="text-sm font-medium text-green-300">Trusted</span>
    </div>
    <div class="flex-1">
      <div class="h-2 bg-[var(--glass-solid)] rounded-full overflow-hidden">
        <div class="h-full w-[75%] rounded-full"
             style="background: linear-gradient(90deg, #10b981, #00D4FF)"></div>
      </div>
    </div>
    <span class="text-lg font-bold text-green-400">75%</span>
  </div>

  <!-- HEADER -->
  <div class="px-4 py-3 border-b border-[var(--glass-border)]">
    <div class="flex items-center gap-3">
      <span class="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
        shield
      </span>
      <div class="flex-1 min-w-0">
        <h1 class="text-xl font-semibold text-[var(--glass-text-primary)]">
          Trust Relationship
        </h1>
        <div class="flex items-center gap-2 mt-1 text-sm">
          <span class="text-[var(--glass-text-secondary)]">research-grove</span>
          <span class="material-symbols-outlined text-[var(--glass-text-muted)]">
            swap_horiz
          </span>
          <span class="text-[var(--glass-text-secondary)]">partner-grove</span>
        </div>
      </div>
      <!-- Multiplier badge -->
      <div class="flex items-center gap-1 px-2 py-1 rounded-full
                  bg-amber-500/20 text-amber-400 text-sm font-medium">
        <span class="material-symbols-outlined text-sm">token</span>
        1.5x
      </div>
    </div>
  </div>

  <!-- SCROLLABLE CONTENT -->
  <div class="flex-1 overflow-y-auto">

    <!-- === GROVE PAIR === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Grove Pair
      </h4>

      <div class="flex items-center gap-4 p-4 rounded-lg bg-[var(--glass-elevated)]">
        <div class="flex-1 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12
                      rounded-full bg-[var(--neon-cyan)]/20 mb-2">
            <span class="material-symbols-outlined text-[var(--neon-cyan)]">forest</span>
          </div>
          <input type="text" value="research-grove"
                 class="w-full px-2 py-1 text-center text-sm rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]
                        text-[var(--glass-text-primary)] focus:outline-none
                        focus:border-[var(--neon-cyan)]" />
        </div>

        <div class="flex flex-col items-center">
          <span class="material-symbols-outlined text-2xl text-green-400">
            handshake
          </span>
        </div>

        <div class="flex-1 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12
                      rounded-full bg-[var(--neon-cyan)]/20 mb-2">
            <span class="material-symbols-outlined text-[var(--neon-cyan)]">forest</span>
          </div>
          <input type="text" value="partner-grove"
                 class="w-full px-2 py-1 text-center text-sm rounded-lg
                        bg-[var(--glass-solid)] border border-[var(--glass-border)]
                        text-[var(--glass-text-primary)] focus:outline-none
                        focus:border-[var(--neon-cyan)]" />
        </div>
      </div>

      <p class="text-xs text-[var(--glass-text-muted)] text-center">
        Grove IDs are sorted alphabetically for consistency
      </p>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === OVERALL TRUST === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Overall Trust
      </h4>

      <div class="p-4 rounded-lg bg-[var(--glass-elevated)]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-3xl">★★★☆</span>
            <div>
              <div class="text-2xl font-bold text-green-400">75%</div>
              <div class="text-sm text-[var(--glass-text-muted)]">Trusted</div>
            </div>
          </div>
          <div class="text-right">
            <div class="flex items-center gap-1 text-amber-400 text-lg">
              <span class="material-symbols-outlined">token</span>
              <span class="font-bold">1.5x</span>
            </div>
            <div class="text-xs text-[var(--glass-text-muted)]">Token Multiplier</div>
          </div>
        </div>

        <!-- Trust level bar -->
        <div class="relative h-4 bg-[var(--glass-solid)] rounded-full overflow-hidden">
          <div class="absolute h-full w-[75%] rounded-full transition-all"
               style="background: linear-gradient(90deg, #10b981, #00D4FF)"></div>
          <!-- Level markers -->
          <div class="absolute top-0 left-[25%] w-px h-full bg-[var(--glass-border)]"></div>
          <div class="absolute top-0 left-[50%] w-px h-full bg-[var(--glass-border)]"></div>
          <div class="absolute top-0 left-[75%] w-px h-full bg-[var(--glass-border)]"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-[var(--glass-text-muted)]">
          <span>New (0-24)</span>
          <span>Established (25-49)</span>
          <span>Trusted (50-74)</span>
          <span>Verified (75+)</span>
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === COMPONENT SCORES === -->
    <section class="p-5 space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-medium uppercase tracking-wider
                   text-[var(--glass-text-muted)]">
          Component Scores
        </h4>
        <span class="text-xs text-[var(--glass-text-muted)]">
          Weighted calculation
        </span>
      </div>

      <div class="space-y-3">
        <!-- Exchange Success (35%) -->
        <div class="p-4 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)]">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-green-400">swap_horiz</span>
              <span class="text-sm text-[var(--glass-text-primary)]">Exchange Success</span>
              <span class="text-xs text-[var(--glass-text-muted)]">(35%)</span>
            </div>
            <span class="text-sm font-medium text-green-400">82%</span>
          </div>
          <input type="range" min="0" max="100" value="82"
                 class="w-full h-2 rounded-full appearance-none cursor-pointer
                        bg-[var(--glass-elevated)]" />
          <p class="text-xs text-[var(--glass-text-muted)] mt-1">
            Rate of successful exchange completions
          </p>
        </div>

        <!-- Tier Accuracy (25%) -->
        <div class="p-4 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)]">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-blue-400">compare_arrows</span>
              <span class="text-sm text-[var(--glass-text-primary)]">Tier Accuracy</span>
              <span class="text-xs text-[var(--glass-text-muted)]">(25%)</span>
            </div>
            <span class="text-sm font-medium text-blue-400">78%</span>
          </div>
          <input type="range" min="0" max="100" value="78"
                 class="w-full h-2 rounded-full appearance-none cursor-pointer
                        bg-[var(--glass-elevated)]" />
          <p class="text-xs text-[var(--glass-text-muted)] mt-1">
            Accuracy of tier mapping translations
          </p>
        </div>

        <!-- Response Time (15%) -->
        <div class="p-4 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)]">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-400">timer</span>
              <span class="text-sm text-[var(--glass-text-primary)]">Response Time</span>
              <span class="text-xs text-[var(--glass-text-muted)]">(15%)</span>
            </div>
            <span class="text-sm font-medium text-amber-400">65%</span>
          </div>
          <input type="range" min="0" max="100" value="65"
                 class="w-full h-2 rounded-full appearance-none cursor-pointer
                        bg-[var(--glass-elevated)]" />
          <p class="text-xs text-[var(--glass-text-muted)] mt-1">
            Speed of response to requests
          </p>
        </div>

        <!-- Content Quality (25%) -->
        <div class="p-4 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)]">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-purple-400">grade</span>
              <span class="text-sm text-[var(--glass-text-primary)]">Content Quality</span>
              <span class="text-xs text-[var(--glass-text-muted)]">(25%)</span>
            </div>
            <span class="text-sm font-medium text-purple-400">70%</span>
          </div>
          <input type="range" min="0" max="100" value="70"
                 class="w-full h-2 rounded-full appearance-none cursor-pointer
                        bg-[var(--glass-elevated)]" />
          <p class="text-xs text-[var(--glass-text-muted)] mt-1">
            Quality of shared content
          </p>
        </div>
      </div>

      <p class="text-xs text-[var(--glass-text-muted)] text-center">
        Overall = Exchange (35%) + Accuracy (25%) + Time (15%) + Quality (25%)
      </p>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === EXCHANGE STATISTICS === -->
    <section class="p-5 space-y-4">
      <div class="flex items-center justify-between cursor-pointer">
        <h4 class="text-sm font-medium uppercase tracking-wider
                   text-[var(--glass-text-muted)]">
          Exchange Statistics
        </h4>
        <span class="material-symbols-outlined text-[var(--glass-text-muted)]">
          expand_more
        </span>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Total Exchanges
          </label>
          <input type="number" value="47"
                 class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]" />
        </div>
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Successful
          </label>
          <input type="number" value="39"
                 class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]" />
        </div>
      </div>

      <!-- Success Rate Display -->
      <div class="p-3 rounded-lg bg-[var(--glass-elevated)] flex items-center justify-between">
        <span class="text-sm text-[var(--glass-text-muted)]">Success Rate</span>
        <span class="text-lg font-bold text-green-400">83%</span>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === VERIFICATION === -->
    <section class="p-5 space-y-4">
      <h4 class="text-sm font-medium uppercase tracking-wider
                 text-[var(--glass-text-muted)]">
        Verification
      </h4>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Verified By
          </label>
          <select class="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
                        border border-[var(--glass-border)] text-[var(--glass-text-primary)]
                        focus:outline-none focus:border-[var(--neon-cyan)]">
            <option value="">Not Verified</option>
            <option value="system" selected>System</option>
            <option value="admin">Admin</option>
            <option value="community">Community</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-[var(--glass-text-muted)] mb-1">
            Verified At
          </label>
          <input type="text" value="Jan 15, 2026" readonly
                 class="w-full px-3 py-2 rounded-lg bg-[var(--glass-elevated)]
                        border border-[var(--glass-border)] text-[var(--glass-text-secondary)]" />
        </div>
      </div>
    </section>

    <div class="border-t border-[var(--glass-border)]"></div>

    <!-- === LAST ACTIVITY (Collapsible) === -->
    <section class="p-5 space-y-4">
      <div class="flex items-center justify-between cursor-pointer">
        <h4 class="text-sm font-medium uppercase tracking-wider
                   text-[var(--glass-text-muted)]">
          Recent Activity
        </h4>
        <span class="material-symbols-outlined text-[var(--glass-text-muted)]">
          expand_more
        </span>
      </div>

      <div class="space-y-2">
        <div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-solid)]">
          <span class="material-symbols-outlined text-green-400">check_circle</span>
          <div class="flex-1">
            <div class="text-sm text-[var(--glass-text-primary)]">Exchange Completed</div>
            <div class="text-xs text-[var(--glass-text-muted)]">2 hours ago</div>
          </div>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-solid)]">
          <span class="material-symbols-outlined text-blue-400">sync</span>
          <div class="flex-1">
            <div class="text-sm text-[var(--glass-text-primary)]">Trust Score Updated</div>
            <div class="text-xs text-[var(--glass-text-muted)]">1 day ago</div>
          </div>
        </div>
      </div>
    </section>

  </div>

  <!-- FOOTER ACTIONS -->
  <div class="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
    <button class="w-full px-4 py-2.5 rounded-lg bg-[var(--neon-cyan)]
                   text-[var(--glass-void)] font-medium hover:bg-[var(--neon-cyan)]/90">
      Save Changes
    </button>
    <div class="flex items-center gap-2">
      <button class="flex-1 px-4 py-2 rounded-lg border border-[var(--glass-border)]
                     text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)]">
        <span class="material-symbols-outlined text-sm mr-1">content_copy</span>
        Duplicate
      </button>
      <button class="flex-1 px-4 py-2 rounded-lg border border-red-500/30
                     text-red-400 hover:bg-red-500/10">
        <span class="material-symbols-outlined text-sm mr-1">delete</span>
        Delete
      </button>
    </div>
  </div>
</div>
```

---

## Component Gap Analysis

### Current State vs. Factory Pattern

| Component | Factory Pattern (ModelEditor) | Federation Editors | Gap |
|-----------|------------------------------|-------------------|-----|
| **InspectorSection** | Used for all groupings | Custom `<section>` tags | Missing collapsible behavior |
| **InspectorDivider** | Between all sections | Not used | Inconsistent spacing |
| **BufferedInput** | All text fields | Standard `<input>` | Race condition risk |
| **BufferedTextarea** | All multiline fields | Standard `<textarea>` | Race condition risk |
| **Header pattern** | Icon + Title + Subtitle + Badge | Partial implementation | Missing status badges |
| **Status banner** | Colored banner with toggle | Not implemented | Missing entirely |
| **Footer actions** | Save + Duplicate/Delete row | Not implemented | Missing entirely |
| **Loading state** | Disabled fields, spinner | Not implemented | No feedback |
| **Section headers** | Uppercase, tracking, muted | Inconsistent styling | Wrong typography |

### Missing Components in Federation Editors

1. **Status Banner** - Connection/approval status visualization
2. **Visual Progress Bars** - Trust score, confidence score displays
3. **Timeline Component** - Exchange history visualization
4. **Tag/Chip Input** - Capabilities management
5. **Visual Grove Connection** - Source/target pair visualization
6. **Collapsible Sections** - Reduce cognitive load

### Patterns to Create

| Pattern | Use Case | Notes |
|---------|----------|-------|
| `StatusBanner` | Connection status, approval workflow | Reusable across all editors |
| `GroveConnectionDiagram` | Visual source->target display | Used in 3/4 editors |
| `ProgressScoreBar` | Trust score, confidence visualization | Gradient colors |
| `TimelineDisplay` | Exchange history, activity log | Vertical timeline |
| `TagInput` | Capabilities, tier chips | With add/remove |

### Patterns to Reuse

From ExperienceConsole (no changes needed):
- `InspectorSection` - Collapsible sections
- `InspectorDivider` - Section separation
- `BufferedInput` / `BufferedTextarea` - Race-condition-free inputs
- `GlassButton` - Standardized actions
- Grid layouts (2-column responsive)
- Footer action pattern

---

## Accessibility Checklist

### Label Associations

| Requirement | Status | Action Needed |
|-------------|--------|---------------|
| All inputs have `id` | MISSING | Add unique IDs |
| Labels use `htmlFor` | PARTIAL | Connect to input IDs |
| Descriptions linked via `aria-describedby` | MISSING | Add helper text linking |
| Required fields marked | MISSING | Add `aria-required` |

### Keyboard Navigation

| Requirement | Status | Action Needed |
|-------------|--------|---------------|
| Tab order logical | NEEDS REVIEW | Test and fix order |
| Focus visible | PARTIAL | Add focus-visible rings |
| Escape closes modals | N/A | No modals in editors |
| Collapsible sections keyboard-accessible | IMPLEMENTED | InspectorSection handles this |
| All interactive elements focusable | NEEDS REVIEW | Check custom components |

### Screen Reader Support

| Requirement | Status | Action Needed |
|-------------|--------|---------------|
| Section headings correct level | NEEDS REVIEW | Use h4 consistently |
| Read-only fields announced | MISSING | Add `aria-readonly` |
| Status changes announced | MISSING | Add live regions for status |
| Progress bars have labels | MISSING | Add `aria-label` to ranges |
| Icon buttons have labels | MISSING | Add `aria-label` to icon-only buttons |

### Color Contrast

| Requirement | Status | Notes |
|-------------|--------|-------|
| Text on backgrounds | PASS | Glass tokens designed for contrast |
| Status indicators | NEEDS REVIEW | Verify amber/green on dark |
| Focus rings | PASS | Neon cyan high contrast |
| Disabled states | NEEDS REVIEW | Check subtle text visibility |

### Implementation Pattern

```typescript
// Accessible input pattern
<div>
  <label
    htmlFor="grove-name"
    className="block text-xs text-[var(--glass-text-muted)] mb-1"
  >
    Grove Name
  </label>
  <BufferedInput
    id="grove-name"
    aria-describedby="grove-name-description"
    value={value}
    onChange={handleChange}
    className="..."
  />
  <p
    id="grove-name-description"
    className="text-xs text-[var(--glass-text-muted)] mt-1"
  >
    A descriptive name for this grove community
  </p>
</div>

// Accessible icon button
<button
  aria-label="Copy grove ID to clipboard"
  className="p-1 hover:text-[var(--neon-cyan)]"
>
  <span className="material-symbols-outlined text-sm" aria-hidden="true">
    content_copy
  </span>
</button>

// Accessible status region
<div
  role="status"
  aria-live="polite"
  className="..."
>
  {statusMessage}
</div>
```

---

## DEX Pillar Verification

### Declarative Sovereignty

**Question:** Can layout be configured, not coded?

**Assessment:** PARTIAL

The current implementation hard-codes section order and field visibility. To achieve declarative sovereignty:

- [ ] Extract section configurations to data structures
- [ ] Allow field visibility toggling via config
- [ ] Support custom field ordering per deployment

**Recommendation:** Not blocking for v1. Add configuration layer in v1.1.

### Capability Agnosticism

**Question:** Works regardless of which model generates content?

**Assessment:** PASS

Editors display data, not generate it. The trust scoring engine handles model-agnostic calculations.

### Provenance as Infrastructure

**Question:** Is origin/authorship tracked for all data?

**Assessment:** PARTIAL

- `createdAt` / `updatedAt` exist in meta
- `validatedBy` / `verifiedBy` exist in some payloads
- Edit history NOT tracked

**Recommendation:** Add changelog array to track field-level changes (future sprint).

### Organic Scalability

**Question:** Does pattern work for future entity types?

**Assessment:** PASS

The proposed pattern follows ExperienceConsole factory approach:
- Header pattern (icon + title + status badge)
- InspectorSection for grouping
- Footer action row
- BufferedInput for text fields

New entity types can follow this template.

---

## Sprint Recommendation

### Option A: Dedicated UX Sprint (RECOMMENDED)

**Sprint Name:** S15-BD-FederationEditors
**Effort:** Medium (3-4 days)
**Risk:** Low (isolated to 4 files + shared components)

**Scope:**
1. Refactor all 4 editors to use factory pattern
2. Create `StatusBanner` shared component
3. Create `GroveConnectionDiagram` shared component
4. Create `ProgressScoreBar` shared component
5. Add BufferedInput/Textarea throughout
6. Implement footer action pattern
7. Add collapsible sections where appropriate
8. Accessibility pass (labels, keyboard, screen reader)
9. Mobile responsiveness verification
10. Visual QA against wireframes

**Deliverables:**
- Updated editor components (4 files)
- New shared components (3 files)
- E2E test updates (if needed)
- Visual regression screenshots

### Option B: Quick Fix Pass

**Effort:** Small (4-6 hours)
**Risk:** Medium (may need rework)

**Scope:**
- Add InspectorSection/Divider
- Add BufferedInput
- Fix spacing (p-5, space-y-3)
- Add footer actions

**NOT included:**
- StatusBanner
- Visual diagrams
- Accessibility improvements
- Mobile fixes

### Recommendation

**Go with Option A.**

The Federation Console is a flagship feature for demonstrating Grove's distributed architecture. Unusable editor panels undermine the entire narrative. A 3-4 day investment now prevents:
- User confusion and abandonment
- Future rework when issues compound
- Accessibility compliance gaps
- Mobile user exclusion

The factory pattern exists and is well-documented. This is not a design exercise - it's an implementation alignment sprint.

---

## Sprint Artifacts (if Option A Approved)

### Artifacts Needed

| Artifact | Owner | Status |
|----------|-------|--------|
| This Vision Document | UX Chief | COMPLETE |
| PRODUCT_BRIEF.md | PM Review | PENDING |
| USER_STORIES.md | Story Refinery | PENDING |
| EXECUTION_PROMPT.md | Foundation Loop | PENDING |

### Suggested User Stories

1. **As an operator**, I want the Grove editor to display connection status prominently, so I can quickly assess federation health.

2. **As an operator**, I want the TierMapping editor to visualize the source-to-target relationship, so I understand the translation at a glance.

3. **As an operator**, I want the Exchange editor to show a timeline of status changes, so I can track exchange progress.

4. **As an operator**, I want the Trust editor to visualize component scores with progress bars, so I can identify trust bottlenecks.

5. **As an operator using a screen reader**, I want all form fields to have proper labels and descriptions, so I can navigate the editor effectively.

6. **As an operator on mobile**, I want the editors to be usable on narrow screens, so I can manage federation from my phone.

---

## Appendix: Current Editor File Inventory

| File | Lines | Issues |
|------|-------|--------|
| `GroveEditor.tsx` | 389 | No InspectorSection, no BufferedInput, no footer |
| `TierMappingEditor.tsx` | 332 | Missing confidence visualization, no dividers |
| `ExchangeEditor.tsx` | 312 | No status banner, basic timeline, no footer |
| `TrustEditor.tsx` | 354 | Good score visualization, missing footer, no collapsible |

---

*Document prepared by UX Chief as part of S9-SL-Federation-v1 post-sprint review.*

*Frozen means frozen. Detect drift early, block drift firmly.*
