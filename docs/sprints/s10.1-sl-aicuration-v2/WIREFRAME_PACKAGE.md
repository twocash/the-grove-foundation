# Wireframe Package: S10.1-SL-AICuration v2 - Display + Filtering

**Version:** 1.1
**Status:** APPROVED
**Designer:** UI/UX Designer Agent
**Reviewed by:** UX Chief
**Technical Review:** UX Chief (json-render + factory standards)

---

## Design Intent

Create a quality-aware content discovery experience that surfaces value without overwhelming users. Quality becomes a visible, filterable dimension that respects the "Exploration, Not Optimization" principle—helping users find high-quality content when they want it, not forcing it.

**Emotional Goal:** Users should feel *informed* and *empowered*, never *restricted* or *judged*.

---

## Pattern Alignment

### Existing Patterns Used
| Pattern | Component | Usage |
|---------|-----------|-------|
| **QualityScoreBadge** | `src/bedrock/primitives/QualityScoreBadge.tsx` | Score display in cards |
| **EmptyState** | `src/bedrock/components/EmptyState.tsx` | Pending/error states |
| **StatCard** | `src/bedrock/primitives/StatCard.tsx` | Filter panel metrics |
| **GlassPanel** | `src/bedrock/primitives/GlassPanel.tsx` | Breakdown panel container |
| **FilterBar** | `src/bedrock/components/FilterBar.tsx` | Quality filter integration |

### New Patterns Proposed
| Pattern | Purpose | Rationale |
|---------|---------|-----------|
| **QualityPendingBadge** | Unscored content indicator | Graceful degradation for lazy evaluation |
| **QualityBreakdownPanel** | Expanded dimension view | Progressive disclosure of details |
| **QualityFilterPreset** | One-click filter buttons | Reduced cognitive load |
| **CelebrationToast** | Positive reinforcement | Engagement pattern for quality discovery |

---

## Wireframes

### Screen 1: Sprout Card with Quality Badge

**Location:** Explore grid, Nursery list

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │  [Sprout thumbnail or icon]                             │  │
│   │                                                         │  │
│   │  ─────────────────────────────────────────────────────  │  │
│   │                                                         │  │
│   │  "Title of the Research Sprout"                        │  │
│   │                                                         │  │
│   │  Short description or preview text that gives          │  │
│   │  context about the content...                          │  │
│   │                                                         │  │
│   │  ─────────────────────────────────────────────────────  │  │
│   │                                                         │  │
│   │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │  │
│   │  │ 🌱 Tier 2│  │ Jan 15   │  │ ✓ 78 (A-)         │   │  │
│   │  │ Seedling │  │ 2026     │  │ Quality           │   │  │
│   │  └──────────┘  └──────────┘  └────────────────────┘   │  │
│   │        ↑            ↑                 ↑                │  │
│   │    Tier badge   Created date    Quality badge          │  │
│   │                               (footer, right-aligned)  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components Used:**
- `QualityScoreBadge` size="sm" with `showGrade={true}`
- Color coding: green (80+), yellow (60-79), orange (40-59), red (<40)
- Badge includes "verified" icon from Material Symbols

**Interaction Notes:**
- **Hover:** Tooltip appears with dimension breakdown (A: 82%, U: 75%, N: 68%, P: 87%)
- **Click:** Expands to full breakdown panel (see Screen 3)
- **Long press (mobile):** Same as click

**State Variations:**

```
SCORED (Normal)        PENDING                ERROR/FALLBACK
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ ✓ 78 (A-)     │    │ ○ Pending      │    │                │
│ Quality       │    │ Assessing...   │    │ (no badge)     │
└────────────────┘    └────────────────┘    └────────────────┘
   Green glow            Gray, animated        Hidden gracefully
```

**Accessibility Checklist:**
- [x] Keyboard navigable (Tab to badge, Enter to expand)
- [x] Focus indicators visible (cyan ring)
- [x] Screen reader labels: "Quality score 78 percent, grade A minus"
- [x] Color contrast AA compliant (numeric score provides non-color info)
- [x] Touch targets 44px minimum (badge area)

**Technical Implementation (MANDATORY):**

| Requirement | Specification |
|-------------|---------------|
| **Pattern** | Console Factory (`ObjectCardProps<SproutPayload>`) |
| **File** | `src/bedrock/consoles/NurseryConsole/SproutCard.tsx` |
| **Integration** | MODIFY existing SproutCard, do NOT create new component |
| **Badge Component** | `QualityScoreBadge` (existing primitive) |
| **Pending State** | New `QualityPendingBadge` component |
| **Click Handler** | Opens breakdown panel (not inline edit) |

```typescript
// Implementation pattern - extends existing SproutCard
export function SproutCard({
  object,
  isSelected,
  onSelect,
  onEdit,
}: ObjectCardProps<SproutPayload>) {
  // ... existing implementation

  return (
    <div className="...">
      {/* Existing content */}

      <footer className="flex items-center justify-between">
        <TierBadge tier={object.payload.tier} />
        <DateDisplay date={object.payload.created_at} />

        {/* NEW: Quality badge (lazy-loaded) */}
        {object.payload.quality_score ? (
          <QualityScoreBadge
            score={object.payload.quality_score}
            size="sm"
            showGrade={true}
            onClick={() => onExpandQuality(object.id)}
          />
        ) : (
          <QualityPendingBadge />
        )}
      </footer>
    </div>
  );
}
```

---

### Screen 2: Quality Filter Panel

**Location:** ExploreShell filter sidebar

```
┌─────────────────────────────────────────────────────────────────┐
│  Filters                                                   [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  QUALITY                                                  │ │
│  │  ─────────────────────────────────────────────────────── │ │
│  │                                                           │ │
│  │  Minimum Score                                            │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │  0    ●━━━━━━━━━━━━━━━━━○──────────────────   100  │ │ │
│  │  │              Current: 50                            │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  Quick Presets                                            │ │
│  │  ┌─────────────┐ ┌──────────────┐ ┌───────────┐         │ │
│  │  │ ✓ High 80+ │ │ Medium+ 50+  │ │    All    │         │ │
│  │  │   (green)   │ │  (outline)   │ │ (outline) │         │ │
│  │  └─────────────┘ └──────────────┘ └───────────┘         │ │
│  │         ↑                                                 │ │
│  │    Selected state with fill                               │ │
│  │                                                           │ │
│  │  ┌───────────────────────────────────────────────────┐   │ │
│  │  │ ▼ Advanced Dimension Filters                      │   │ │
│  │  └───────────────────────────────────────────────────┘   │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Other existing filters: Tier, Date, Tags, etc.]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Advanced Filters (Expanded):**

```
│  ▲ Advanced Dimension Filters                                    │
│  ────────────────────────────────────────────────────────────── │
│                                                                  │
│  Accuracy        ○━━━━━━━━━━○──────────────  60                 │
│                  ░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← Distribution hint │
│                                                                  │
│  Utility         ○──────────────────────────  0 (any)           │
│                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                    │
│                                                                  │
│  Novelty         ○──────────────────────────  0 (any)           │
│                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░                    │
│                                                                  │
│  Provenance      ○──────────────────────────  0 (any)           │
│                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                    │
│                                                                  │
│                               [Reset to defaults]               │
```

**Components Used:**
- Slider component with numeric input
- `GlassButton` for presets with selection state
- Collapsible section pattern (Advanced filters hidden by default)
- Distribution hint bars (mini histogram)

**Interaction Notes:**
- **Slider drag:** Real-time filter update with 200ms debounce
- **Preset click:** Instant filter application, URL state update
- **Advanced toggle:** Smooth expand/collapse animation
- **Reset:** Returns all quality filters to default (0 = any)

**Accessibility Checklist:**
- [x] Keyboard navigable (Tab through all controls)
- [x] Focus indicators visible
- [x] Screen reader: "Minimum quality score slider, current value 50"
- [x] ARIA labels on all interactive elements
- [x] Presets announce selection state

---

### Screen 3: Quality Breakdown Panel (Expanded)

**Location:** Overlay panel from badge click

```
┌─────────────────────────────────────────────────────────────────┐
│  Quality Assessment                                        [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Overall Score                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │      ┌───────────────────────────────────────┐         │   │
│  │      │              78                       │         │   │
│  │      │            A-                         │         │   │
│  │      │        ●━━━━━━━━━━━━━━━━━━●          │         │   │
│  │      │     0                     100         │         │   │
│  │      └───────────────────────────────────────┘         │   │
│  │                                                         │   │
│  │      Confidence: High (94%)                             │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Dimension Breakdown                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  ┌─────────────────┐    Accuracy  ████████████░░░ 82   │   │
│  │  │   Radar Chart   │    Utility   █████████░░░░░░ 75   │   │
│  │  │       ◆         │    Novelty   ███████░░░░░░░░ 68   │   │
│  │  │     ╱   ╲       │    Provenance████████████░░░ 87   │   │
│  │  │   ◆       ◆     │                                   │   │
│  │  │     ╲   ╱       │    ── Your score                  │   │
│  │  │       ◆         │    ·· Network avg                 │   │
│  │  └─────────────────┘                                   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Assessment Details                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Scored: Jan 15, 2026 at 14:32                          │   │
│  │  Model: grove-quality-v1                                │   │
│  │  Method: Automated (heuristic)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                   [Why this score? →]          │
│                                   (Links to S10.2 attribution) │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components Used:**
- `GlassPanel` tier="elevated" for overlay
- Recharts `RadarChart` for dimension visualization
- Progress bars with color coding
- Provenance metadata display

**Interaction Notes:**
- **Panel open:** Slide-in from right (300ms ease-out)
- **Escape/Click outside:** Close panel
- **"Why this score?" link:** Deep link to attribution panel (S10.2, disabled until ready)

**Accessibility Checklist:**
- [x] Focus trapped within panel when open
- [x] Escape key closes panel
- [x] Screen reader announces panel opening
- [x] Radar chart has text alternative (dimension bars)
- [x] All values read by screen reader

**Technical Implementation (MANDATORY - json-render):**

| Requirement | Specification |
|-------------|---------------|
| **Pattern** | json-render (QualityBreakdownCatalog) |
| **Rationale** | Read-only analytics display - MUST be declarative |
| **Container** | `<Renderer tree={...} registry={QualityBreakdownRegistry} />` |
| **Transform** | `qualityScoreToRenderTree(score)` |
| **Interactive Elements** | Close button, "Why this score?" link remain traditional React |

**Catalog Components (Zod schemas required):**

```typescript
// src/bedrock/consoles/ExperienceConsole/json-render/quality-breakdown-catalog.ts

QualityBreakdownCatalog = {
  components: {
    QualityOverview,      // Score + grade + progress bar
    DimensionRow,         // Individual dimension display
    QualityRadarChart,    // Radar visualization wrapper
    AssessmentMetadata,   // Model, timestamp, confidence
    NetworkComparison,    // Grove vs network percentile (optional)
  }
}
```

**Transform Function:**

```typescript
// src/bedrock/consoles/ExperienceConsole/json-render/quality-breakdown-transform.ts

function qualityScoreToRenderTree(score: QualityScore): RenderTree {
  return {
    type: 'root',
    children: [
      { type: 'QualityOverview', props: { score: score.composite, grade: score.grade, confidence: score.confidence } },
      { type: 'DimensionRow', props: { dimension: 'accuracy', value: score.dimensions.accuracy } },
      { type: 'DimensionRow', props: { dimension: 'utility', value: score.dimensions.utility } },
      { type: 'DimensionRow', props: { dimension: 'novelty', value: score.dimensions.novelty } },
      { type: 'DimensionRow', props: { dimension: 'provenance', value: score.dimensions.provenance } },
      { type: 'QualityRadarChart', props: { dimensions: score.dimensions } },
      { type: 'AssessmentMetadata', props: { model: score.model, timestamp: score.scored_at, method: score.method } },
    ],
  };
}
```

**SignalsCatalog Reuse (RECOMMENDED):**

| Existing Component | Reuse For |
|-------------------|-----------|
| `MetricCard` | Score display in panel header |
| `QualityGauge` | Overall score progress bar |

**File Locations:**
- `src/bedrock/consoles/ExperienceConsole/json-render/quality-breakdown-catalog.ts`
- `src/bedrock/consoles/ExperienceConsole/json-render/quality-breakdown-registry.tsx`
- `src/bedrock/consoles/ExperienceConsole/json-render/quality-breakdown-transform.ts`

---

### Screen 4: Quality Empty States

**State: No Scored Content**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌───────────────────┐                       │
│                    │       ○           │                       │
│                    │    verified       │                       │
│                    │    (gray icon)    │                       │
│                    └───────────────────┘                       │
│                                                                 │
│                  No quality scores yet                          │
│                                                                 │
│         Quality assessment happens automatically                │
│          when you view or create content.                       │
│                                                                 │
│               [ Create your first sprout ]                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**State: No Results After Filtering**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌───────────────────┐                       │
│                    │    search_off     │                       │
│                    │    (gray icon)    │                       │
│                    └───────────────────┘                       │
│                                                                 │
│            No content matches your quality filters              │
│                                                                 │
│        Try lowering the minimum score or removing               │
│           dimension filters to see more results.                │
│                                                                 │
│               [ Show all content ]  [ Adjust filters ]          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**State: Scoring Error**

```
┌─────────────────────────────────────────────────────────────────┐
│  (Badge area - graceful degradation)                            │
│                                                                 │
│  ┌──────────┐  ┌──────────┐                                    │
│  │ 🌱 Tier 2│  │ Jan 15   │    ← No quality badge shown        │
│  │ Seedling │  │ 2026     │      Content still accessible      │
│  └──────────┘  └──────────┘                                    │
│                                                                 │
│  Note: Quality badge hidden when scoring fails.                 │
│  Error logged, content not blocked.                             │
└─────────────────────────────────────────────────────────────────┘
```

**Components Used:**
- `EmptyState` with custom variants
- `GlassButton` for actions
- Graceful degradation (no badge rather than error badge)

---

### Screen 5: Threshold Configuration (Experience Console)

**Location:** Bedrock Experience Console → Quality Settings section

```
┌─────────────────────────────────────────────────────────────────┐
│  EXPERIENCE CONSOLE                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Quality Settings                              [+ Create] │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │                                                          │  │
│  │  Active Thresholds                                       │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  📊 High Quality Gate                      [Edit] │ │  │
│  │  │  ─────────────────────────────────────────────────│ │  │
│  │  │  Minimum: 80  │  Enabled: ✓                       │ │  │
│  │  │  Dimensions: All                                  │ │  │
│  │  │  Applied to: Public content                       │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  📊 Research Standard                      [Edit] │ │  │
│  │  │  ─────────────────────────────────────────────────│ │  │
│  │  │  Minimum: 60  │  Accuracy: 70+  │  Enabled: ✓     │ │  │
│  │  │  Applied to: Research sprouts                     │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  Federated Learning                                      │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Participation: [ ● Enabled ]                     │ │  │
│  │  │  Privacy Level: [ Anonymized        ▼ ]           │ │  │
│  │  │  Contributions: 47 scores shared                  │ │  │
│  │  │  Last Sync: 5 minutes ago                         │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components Used:**
- `QualityThresholdCard` (existing from S10 v1)
- `QualityThresholdEditor` (existing from S10 v1)
- Toggle switches for federated learning
- Dropdown for privacy level

---

## State Variations Summary

### Quality Badge States

| State | Visual | Behavior |
|-------|--------|----------|
| **Scored (green)** | `✓ 92 (A)` green glow | Clickable, shows breakdown |
| **Scored (yellow)** | `✓ 67 (C+)` yellow glow | Clickable, shows breakdown |
| **Scored (orange)** | `✓ 45 (D)` orange glow | Clickable, shows breakdown |
| **Scored (red)** | `✓ 28 (F)` red glow | Clickable, shows breakdown |
| **Pending** | `○ Pending` gray, animated | Shows tooltip "Assessment in progress" |
| **Error** | (hidden) | Badge not rendered, content still shown |

### Filter Panel States

| State | Visual | Behavior |
|-------|--------|----------|
| **Default** | Slider at 0, presets unselected | All content shown |
| **Preset selected** | "High 80+" filled green | URL updated, instant filter |
| **Custom value** | Slider at 65, no preset | URL updated, debounced filter |
| **Advanced open** | Dimension sliders visible | Individual dimension control |

---

## Declarative Configuration Points

| Element | Configurable Via | Default | Notes |
|---------|------------------|---------|-------|
| Badge color thresholds | `quality_thresholds` table | 80/60/40/0 | Green/yellow/orange/red |
| Filter presets | `quality_filter_presets` | High 80+, Medium+ 50+, All | Array of {label, value} |
| Advanced filters visible | `quality_filter_advanced_default` | false | Boolean |
| Radar chart enabled | `quality_radar_enabled` | true | Can disable for performance |
| Distribution hints | `quality_distribution_hints` | true | Mini histograms in advanced |
| Celebration threshold | `quality_celebration_threshold` | null | Score above X triggers toast |

---

## Micro-interactions

### Badge Hover
```
0ms    → Cursor enters badge
50ms   → Tooltip fade in (0.15s ease-out)
        Tooltip shows dimension breakdown
800ms  → If still hovering, subtle badge glow intensifies
```

### Filter Preset Click
```
0ms    → Click detected
10ms   → Haptic feedback (mobile)
50ms   → Fill animation (0.2s ease)
100ms  → Filter applied to content
300ms  → Content grid re-renders with transition
```

### Breakdown Panel Open
```
0ms    → Badge clicked
50ms   → Overlay backdrop fades in (0.15s)
100ms  → Panel slides in from right (0.3s ease-out)
400ms  → Content fades in (0.2s)
        Focus moves to close button
```

---

## Celebration Pattern (PM Recommendation)

When user discovers high-quality content after filtering:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ✨ Great finds!                                        │   │
│  │  You found 12 high-quality sprouts matching your search │   │
│  │                                              [Dismiss]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Toast appears at bottom of screen, auto-dismisses in 4s       │
│  Only shown once per session for same filter combination       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Requirements Summary

### json-render Pattern Compliance

| Screen | json-render Required | Status |
|--------|---------------------|--------|
| Screen 1: Sprout Card Badge | NO | Interactive (click to expand) |
| Screen 2: Filter Panel | NO | Interactive form controls |
| **Screen 3: Breakdown Panel** | **YES** | Read-only analytics - MANDATORY |
| Screen 4: Empty States | NO | Simple static content |
| Screen 5: Threshold Config | NO | Interactive editor (existing) |

### Console Factory Standards

| Component | Pattern | Status |
|-----------|---------|--------|
| SproutCard | `ObjectCardProps<SproutPayload>` | MODIFY existing |
| QualityThresholdCard | `ObjectCardProps<QualityThresholdPayload>` | Existing (S10 v1) |
| QualityThresholdEditor | `ObjectEditorProps<QualityThresholdPayload>` | Existing (S10 v1) |

### Required File Deliverables

```
src/bedrock/consoles/ExperienceConsole/json-render/
├── quality-breakdown-catalog.ts    # Zod schemas for breakdown panel
├── quality-breakdown-registry.tsx  # React component implementations
└── quality-breakdown-transform.ts  # Domain → render tree transform

src/bedrock/consoles/NurseryConsole/
└── SproutCard.tsx                  # MODIFY to add quality badge

src/bedrock/primitives/
└── QualityPendingBadge.tsx        # NEW: Pending state badge
```

### Reference Documentation

- **json-render Pattern Guide:** `docs/JSON_RENDER_PATTERN_GUIDE.md`
- **Console Factory Types:** `src/bedrock/patterns/console-factory.types.ts`
- **SignalsCatalog (reuse):** `src/bedrock/consoles/ExperienceConsole/json-render/signals-registry.tsx`

---

**Prepared By:** UI/UX Designer
**Updated:** 2026-01-18 (v1.1 - Technical Requirements Added)
**Status:** APPROVED - Ready for User Review
