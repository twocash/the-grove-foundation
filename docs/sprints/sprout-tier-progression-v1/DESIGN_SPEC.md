# Sprout Tier Progression - Design Specification v1.0

**Sprint:** S4-SL-TierProgression  
**Epic:** Sprout Lifecycle v1  
**Designer:** UI/UX Designer (Product Pod)  
**Date:** 2026-01-15  
**Status:** Ready for Implementation

---

## ⚠️ CRITICAL: Design System Standards

**BEFORE IMPLEMENTING:** Read `DESIGN_SYSTEM_STANDARDS.md` in this sprint folder.

**TL;DR for v1.0:**
- ✅ **USE:** Quantum Glass design system (`--neon-green`, `--glass-void`, Inter font)
- ❌ **DO NOT USE:** Living Glass (`--grove-forest`, `--grove-clay`, Playfair/Lora fonts)

Living Glass is a **future vision** (post-1.0). Current implementation MUST use Quantum Glass to match existing `/explore` and `/bedrock` surfaces.

**See:** `./DESIGN_SYSTEM_STANDARDS.md` for complete token reference and migration notes.

---

## Executive Summary

This spec defines the visual design for **botanical lifecycle tier badges** that communicate sprout maturity (seed → sprout → sapling → tree) in the Grove Foundation interface. Tier badges replace status-only indicators, making knowledge progression visible and actionable.

**Core Design Decision:** Minimalist emoji badges using **Quantum Glass** design system (current 1.0 standard). Living Glass botanical aesthetic deferred to post-1.0.

**Key Deliverables:**
1. `TierBadge` component specification
2. GardenTray integration (compact + expanded views)
3. Finishing Room header enhancement
4. Promotion animation sequence
5. Accessibility guidelines

---

## Design Philosophy Alignment

### Quantum Glass (v1.0 Implementation)

All tier badge designs use the current Quantum Glass tokens:
- `--neon-green` (#10b981) for growth/success states
- `--neon-cyan` (#06b6d4) for active/processing states
- `--neon-amber` (#f59e0b) for attention/warnings
- `--glass-void`, `--glass-panel`, `--glass-solid` for backgrounds
- `--border-default`, `--border-hover` for borders

**Rationale:** Both `/explore` and `/bedrock` already use Quantum Glass. Standardizing on this system prevents aesthetic drift and ensures visual consistency across 1.0 MVP.

### Living Glass (v2 Vision)

Living Glass (Grove Forest #2F5C3B, Grove Clay #D95D39, terrarium aesthetic) is documented as the **future vision** but is NOT implemented in current codebase. This spec notes Living Glass migration as a post-1.0 design sprint.

**Action Item:** Update `docs/design-system/UI_VISION_LIVING_GLASS.md` to clarify it's a "v2 vision" not current implementation.

---

## Botanical Lifecycle Tiers

### Tier Definitions

| Tier | Emoji | Meaning | Trigger | Visible in S4 |
|------|-------|---------|---------|---------------|
| **seed** | 🌰 | Raw capture, unprocessed | Initial capture (pending research) | ✅ Yes |
| **sprout** | 🌱 | Has research document | Research pipeline completes | ✅ Yes |
| **sapling** | 🌿 | Promoted to knowledge base | User clicks "Add to Field" | ✅ Yes |
| **tree** | 🌳 | Proven valuable | 5+ retrievals from RAG | ✅ Yes |
| **grove** | 🌲 | Foundational knowledge | Community consensus | ❌ Hidden (no community features yet) |

### Emoji Rationale

- **🌰 (Acorn/Seed)**: Distinct brown color differentiates from green lifecycle stages. Dormant potential.
- **🌱 (Seedling)**: Universal "sprouting" symbol. Fresh emergence.
- **🌿 (Herb/Leaves)**: Leafy growth, taking root. Distinct from single sprout.
- **🌳 (Deciduous Tree)**: Established, full-grown. Classic tree emoji.
- **🌲 (Evergreen)**: Ancient, collective wisdom. Reserved for future community tier.

**Design Note:** Emojis verified at 16px, 20px, and 24px sizes for visual distinction. 🌰 chosen over 🌾 to create visual break from green family.

---

## Component Specification: TierBadge

### Core Component

```typescript
interface TierBadgeProps {
  /** Botanical tier (grove hidden in S4) */
  tier: 'seed' | 'sprout' | 'sapling' | 'tree';
  
  /** Research pipeline status (affects visual treatment) */
  status: 'pending' | 'active' | 'ready';
  
  /** Display size variant */
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
  
  /** Show text label alongside emoji */
  showLabel?: boolean;         // Default: false
  
  /** Trigger promotion glow animation (300ms) */
  justPromoted?: boolean;      // Default: false
  
  /** Optional tooltip with promotion hint */
  hint?: string;               // e.g., "Add to Field to promote"
  
  /** Optional click handler (for future interactive badges) */
  onClick?: () => void;
}
```

### Size Variants

| Size | Pixel Value | CSS Class | Use Case |
|------|-------------|-----------|----------|
| `sm` | 16px | `text-base` | GardenTray collapsed view |
| `md` | 20px | `text-lg` | GardenTray expanded view |
| `lg` | 24px | `text-2xl` | Finishing Room header |

### Visual States

#### 1. Default (Ready State)
```tsx
<span className="text-lg">🌱</span>
```
- Full color emoji, no filters
- No container, no animations
- Clean, minimal presentation

#### 2. Pending State
```tsx
<span className="text-lg opacity-40 grayscale">🌰</span>
```
- 40% opacity
- Grayscale filter (desaturate to communicate "dormant")
- Indicates research not yet started

#### 3. Active (Processing) State
```tsx
<span className="text-lg animate-pulse-slow">🌱</span>
```
- Subtle pulse animation (2s cycle, 100% → 70% opacity)
- Optional cyan glow ring for emphasis (see Ring Variant below)

#### 4. Just Promoted State
```tsx
<span className="text-lg animate-glow-pulse">🌿</span>
```
- Brief green glow pulse (300ms duration)
- `box-shadow: 0 0 12px var(--neon-green)`
- Triggered when `justPromoted={true}`

### Advanced Variant: Ring Container

For contexts requiring stronger visual hierarchy (optional enhancement):

```tsx
<div className={cn(
  "w-6 h-6 rounded-full flex items-center justify-center",
  "border border-border-default",
  status === 'ready' && "ring-2 ring-neon-green/50",
  status === 'active' && "ring-2 ring-neon-cyan/50 animate-pulse"
)}>
  <span className="text-sm">{TIER_EMOJI[tier]}</span>
</div>
```

**Use sparingly** - default minimalist emoji preferred for S4.

---

## GardenTray Integration

### Current Behavior (Before Tiers)

```
Collapsed:  [🌻] [⚙️] [🌻]   ← Status emoji only
Expanded:   🌻 What is the ratchet effect?
            ⚙️ How do LLMs handle context...
```

**Problem:** Status emoji (🌻 Ready, ⚙️ Processing) shows research state but NOT tier. All completed sprouts look identical.

### New Behavior (With Tiers)

**Design Decision:** **Tier emoji REPLACES status emoji** (not additive).

```
Collapsed:  [🌱] [🌱] [🌿]   ← Tier emoji with state styling
            ↑    ↑    ↑
         Ready Active Promoted
         
Expanded:   🌱 What is the ratchet effect?
            🌱 How do LLMs handle context...  (pulsing)
            🌿 Compare MoE vs dense...
```

### SproutRow Component Changes

#### Before:
```tsx
<span className="text-sm">{statusEmoji}</span>
<span className="text-sm">{sprout.title}</span>
```

#### After:
```tsx
<TierBadge 
  tier={sprout.tier}
  status={sprout.status}
  size={isExpanded ? 'md' : 'sm'}
  showLabel={false}  // Label only in detail views
/>
{isExpanded && (
  <span className="text-sm">{sprout.title}</span>
)}
```

### Layout Anatomy

```
┌──────────────────────────────────────────────────────────┐
│ Collapsed View (icon-only):                             │
│ ┌─────┐                                                  │
│ │ 🌱  │  ← 16px emoji, green ring if ready              │
│ │ 🌱  │  ← 16px emoji, pulsing if active                │
│ │ 🌿  │  ← 16px emoji, sapling tier                     │
│ └─────┘                                                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Expanded View (flex items-center gap-2):                │
│                                                           │
│ ┌──────┬────────────────────────────────┬────────┐      │
│ │ Tier │ Title (truncate)               │ Expand │      │
│ │ Icon │                                │ Hint   │      │
│ └──────┴────────────────────────────────┴────────┘      │
│   24px          flex-1                      2ch         │
│                                                           │
│ Example:                                                 │
│ 🌱  What is the ratchet effect in LLMs?            ▶    │
│ ↑                                                   ↑    │
│ 20px emoji                               Click to view  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### State Matrix (GardenTray)

| Tier | Status | Visual Treatment |
|------|--------|------------------|
| seed | pending | 🌰 (40% opacity, grayscale) |
| sprout | active | 🌱 (pulsing, cyan glow) |
| sprout | ready | 🌱 (full color, green ring) |
| sapling | ready | 🌿 (full color, green ring) |
| tree | ready | 🌳 (full color, green ring) |

### Promotion Feedback in Tray

**Scenario:** User promotes sprout in Finishing Room → returns to main view

**Animation Sequence:**
1. GardenTray sprout row updates tier: 🌱 → 🌿
2. Brief glow pulse (300ms)
3. Subtle success toast: "Promoted to Sapling"
4. Row remains in tray (not removed)

---

## Finishing Room Header Integration

### Current Header (Before Tiers)

```
┌────────────────────────────────────────────────────────┐
│ 🌱 SPROUT FINISHING ROOM  │  Query title...  │  [X]  │
└────────────────────────────────────────────────────────┘
```

**Problem:** Generic sprout icon, no lifecycle context, no promotion guidance.

### New Header (With Tier Badge + Hint)

```
┌────────────────────────────────────────────────────────┐
│ 🌱 Sprout              │  Query title...     │  [X]  │
│ Add to Field → 🌿     │                     │       │
└────────────────────────────────────────────────────────┘
```

### Layout Structure

**Three-section flex layout:**

```
┌──────────────┬────────────────────────┬─────────────┐
│              │                        │             │
│   LEFT       │       CENTER           │    RIGHT    │
│   SECTION    │       SECTION          │   SECTION   │
│              │                        │             │
└──────────────┴────────────────────────┴─────────────┘
  160px              flex-1                 48px
```

### Left Section (Tier Badge Area)

```tsx
<div className="flex flex-col gap-1">
  {/* Tier badge + name */}
  <div className="flex items-center gap-2">
    <TierBadge 
      tier={sprout.tier} 
      status={sprout.status} 
      size="lg"
    />
    <span className="text-lg font-semibold text-text-primary">
      {capitalize(sprout.tier)}
    </span>
  </div>
  
  {/* Context label */}
  <span className="font-mono text-xs uppercase text-text-subtle tracking-wider">
    Finishing Room
  </span>
  
  {/* Promotion hint (conditional) */}
  {sprout.tier === 'sprout' && (
    <span className="text-xs text-text-muted">
      Add to Field → 🌿
    </span>
  )}
</div>
```

### Tier-Specific Variations

#### Seed (Pending Research)
```
🌰 Seed
Research Queued
```
- Dimmed (40% opacity)
- No promotion hint

#### Sprout (Ready to Promote)
```
🌱 Sprout
Add to Field → 🌿
```
- Full color
- Shows promotion path

#### Sapling (Already Promoted)
```
🌿 Sapling
In Knowledge Base
```
- No promotion hint (already promoted)
- Shows current status

#### Tree (Proven Valuable)
```
🌳 Tree
12 retrievals
```
- Shows utility metric
- Celebrates achievement

### Center Section (Query/Title)
**Unchanged** - existing truncated query display

### Right Section (Close Button)
**Unchanged** - existing close button

---

## Promotion Animation Sequence

### Timeline (300ms total)

```
T=0ms: User clicks "Add to Field" button
┌────────────────────────────────────────────────────┐
│ 🌱 Sprout             │  Query...     │    [X]    │
│ Add to Field → 🌿    │               │           │
└────────────────────────────────────────────────────┘

T=100ms: Emoji crossfade starts + glow pulse
┌────────────────────────────────────────────────────┐
│ 🌱🌿 Sprout→Sapling   │  Query...     │    [X]    │
│ ╰━━ glow pulse ━━╯   │               │           │
└────────────────────────────────────────────────────┘

T=300ms: New tier displayed, animation complete
┌────────────────────────────────────────────────────┐
│ 🌿 Sapling            │  Query...     │    [X]    │
│ In Knowledge Base     │               │           │
└────────────────────────────────────────────────────┘

T=400ms: Success toast appears (bottom-right)
┌────────────────────────────────┐
│ ✓ Promoted to Sapling          │
│   Added to knowledge base      │
└────────────────────────────────┘
```

### CSS Animation

```css
/* Tier transition animation */
.tier-badge-morph {
  animation: tier-transition 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes tier-transition {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    box-shadow: 0 0 12px var(--neon-green);
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    box-shadow: 0 0 0 transparent;
    transform: scale(1);
  }
}

/* Pulse animation for active state */
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### React Implementation

```tsx
const [justPromoted, setJustPromoted] = useState(false);

const handlePromotion = async () => {
  setJustPromoted(true);
  await promoteToSapling(sprout.id);
  
  // Reset animation flag after 300ms
  setTimeout(() => setJustPromoted(false), 300);
  
  // Show success toast
  toast.success('Promoted to Sapling', {
    description: 'Added to knowledge base'
  });
};

return (
  <TierBadge 
    tier={sprout.tier}
    status={sprout.status}
    size="lg"
    justPromoted={justPromoted}
  />
);
```

---

## Accessibility Considerations

### Semantic HTML

```tsx
<span 
  role="img" 
  aria-label={`${tier} tier, ${status} status`}
  className={...}
>
  {TIER_EMOJI[tier]}
</span>
```

### Screen Reader Announcements

```tsx
// When tier changes
<div role="status" aria-live="polite" className="sr-only">
  Sprout promoted to sapling tier. Added to knowledge base.
</div>
```

### Keyboard Navigation

- Tier badges are **display-only** in S4 (not interactive)
- Focus remains on actionable elements (buttons, links)
- Future enhancement: make tier badge clickable to view tier info

### Color Independence

**Critical:** Status MUST NOT rely solely on color.

| State | Color | Shape/Animation | Accessible? |
|-------|-------|-----------------|-------------|
| Pending | Gray | Opacity 40% + grayscale | ✅ Yes (opacity change) |
| Active | Cyan glow | Pulsing animation | ✅ Yes (motion) |
| Ready | Green ring | Static, full opacity | ⚠️ Partial (ring visible) |
| Promoted | Green glow | Brief pulse | ✅ Yes (motion + toast) |

**Recommendation:** Add subtle border or shape change to "ready" state for users with color blindness.

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .tier-badge-morph,
  .animate-pulse-slow,
  .animate-glow-pulse {
    animation: none !important;
  }
  
  /* Instant state change without animation */
  .tier-badge-morph {
    transition: opacity 0s;
  }
}
```

---

## Implementation Guidance

### Component File Structure

```
src/
├── core/
│   └── schema/
│       └── sprout.ts              # Add 'tier' field to Sprout type
├── shared/
│   └── components/
│       └── TierBadge/
│           ├── TierBadge.tsx      # Main component
│           ├── TierBadge.test.tsx # Unit tests
│           ├── tier-constants.ts  # TIER_EMOJI mapping, animations
│           └── index.ts           # Barrel export
└── explore/
    └── components/
        └── GardenTray/
            └── SproutRow.tsx      # Update to use TierBadge
```

### Tier Constants

```typescript
// src/shared/components/TierBadge/tier-constants.ts

export const TIER_EMOJI = {
  seed: '🌰',
  sprout: '🌱',
  sapling: '🌿',
  tree: '🌳',
  // grove: '🌲' // Hidden in S4
} as const;

export const TIER_LABELS = {
  seed: 'Seed',
  sprout: 'Sprout',
  sapling: 'Sapling',
  tree: 'Tree',
  // grove: 'Grove'
} as const;

export const TIER_DESCRIPTIONS = {
  seed: 'Research queued',
  sprout: 'Research complete',
  sapling: 'In knowledge base',
  tree: 'Proven valuable',
  // grove: 'Foundational knowledge'
} as const;

export type SproutTier = keyof typeof TIER_EMOJI;
```

### Database Schema Update

```typescript
// src/core/schema/sprout.ts

export interface Sprout {
  id: string;
  query: string;
  status: 'pending' | 'active' | 'completed' | 'archived';
  
  // NEW: Add tier field
  tier: 'seed' | 'sprout' | 'sapling' | 'tree'; // 'grove' hidden in S4
  
  // Existing fields...
  synthesis?: ResearchSynthesis;
  evidence: Evidence[];
  createdAt: string;
  updatedAt: string;
}
```

### Promotion Logic

```typescript
// src/core/services/sprout-service.ts

export async function promoteToSapling(sproutId: string) {
  // 1. Update tier field
  await updateSprout(sproutId, { tier: 'sapling' });
  
  // 2. Add to RAG knowledge base (existing logic)
  await addToKnowledgeBase(sproutId);
  
  // 3. Track engagement event
  trackEngagement({
    type: 'sprout_promoted',
    sproutId,
    fromTier: 'sprout',
    toTier: 'sapling',
    timestamp: new Date().toISOString()
  });
}
```

### Auto-Advancement to Tree

```typescript
// Automatic tier advancement based on utility signals

export async function checkTreePromotion(sproutId: string) {
  const retrievalCount = await getRetrievalCount(sproutId);
  const currentTier = await getSproutTier(sproutId);
  
  if (currentTier === 'sapling' && retrievalCount >= 5) {
    await updateSprout(sproutId, { tier: 'tree' });
    
    // Optional: Show achievement notification
    showNotification({
      title: 'Your sapling grew into a tree!',
      description: `"${sproutQuery}" has been retrieved ${retrievalCount} times`,
      icon: '🌳'
    });
  }
}
```

---

## DEX Alignment Review

### Declarative Sovereignty ✅

- **seed → sprout**: Automatic (system-driven, user requested research)
- **sprout → sapling**: User-initiated (explicit "Add to Field" action)
- **sapling → tree**: Automatic but earned (based on objective utility metrics)
- **tree → grove**: Not in S4 (requires community features)

**Verdict:** Hybrid model respects user sovereignty for knowledge base entry while rewarding demonstrated value.

### Provenance ✅

Tier badges implicitly communicate provenance:
- Seed: Captured but unprocessed
- Sprout: System has researched
- Sapling: User has promoted (sovereign decision)
- Tree: Community has found valuable (retrieval count)

**Future enhancement:** Badge tooltip showing "Promoted by you on [date]" or "Researched by Dr. Chiang lens"

### Organic Scalability ✅

Pattern supports:
- **5 tiers currently defined** (seed/sprout/sapling/tree/grove)
- **4 tiers visible in S4** (grove hidden)
- **Future custom tiers?** Component design allows easy extension

**Recommendation:** If custom tiers needed (e.g., user-defined maturity levels), TierBadge accepts `customEmoji` and `customLabel` props.

---

## Future Enhancements (Post-S4)

### 1. Living Glass Migration

When migrating to botanical aesthetic:

**Color Palette Changes:**
- `--neon-green` → `--grove-forest` (#2F5C3B)
- `--neon-cyan` → `--grove-sky` (new token)
- Background: `--glass-void` → `--soil-dark` (new token)

**Badge Container:**
```tsx
<div className="rounded-lg bg-terrarium-glass border border-grove-forest/20 p-2">
  <TierBadge tier={tier} />
  <span className="font-serif text-xs text-grove-clay">{tier}</span>
</div>
```

**Typography:**
- Font-mono → Playfair Display (headers)
- Inter → Lora (body text)

### 2. Custom SVG Icons

Replace emoji with botanical illustrations:
- Seed: Acorn illustration with subtle roots
- Sprout: Seedling breaking through soil
- Sapling: Young tree with visible root system
- Tree: Mature tree with full canopy
- Grove: Multiple trees intertwined

**Benefits:**
- Brand consistency
- Cross-platform rendering control
- Ability to animate internal elements (e.g., leaves rustling)

### 3. Interactive Tier Badge

**Click to view tier history:**
```
┌─────────────────────────────────────┐
│ Lifecycle History                  │
├─────────────────────────────────────┤
│ 🌰 Seed         Jan 10, 2026       │
│ 🌱 Sprout       Jan 10, 2026 (2m)  │
│ 🌿 Sapling      Jan 12, 2026       │
│    ↳ Promoted by you               │
│ 🌳 Tree         Jan 15, 2026       │
│    ↳ 12 retrievals                 │
└─────────────────────────────────────┘
```

### 4. Tier Progression Dashboard

Visual garden showing all sprouts by tier:
```
┌─────────────────────────────────────┐
│ Your Knowledge Garden              │
├─────────────────────────────────────┤
│ Seeds: 3      🌰 🌰 🌰             │
│ Sprouts: 5    🌱 🌱 🌱 🌱 🌱       │
│ Saplings: 8   🌿 🌿 🌿 🌿 🌿 ...  │
│ Trees: 2      🌳 🌳                │
└─────────────────────────────────────┘
```

### 5. Gamification (Optional)

- **Tier milestones**: "You grew your first tree!"
- **Collection goals**: "Grow 10 saplings"
- **Leaderboard**: Most valuable trees in community
- **Badges**: "Master Gardener" achievement

**Caution:** Ensure gamification doesn't violate DEX sovereignty or create artificial engagement loops.

---

## Testing & Validation

### Visual Regression Tests

```typescript
// TierBadge.test.tsx

describe('TierBadge Visual States', () => {
  it('renders seed tier with pending state', () => {
    render(<TierBadge tier="seed" status="pending" />);
    const badge = screen.getByRole('img');
    expect(badge).toHaveClass('opacity-40 grayscale');
  });
  
  it('renders sprout tier with active state', () => {
    render(<TierBadge tier="sprout" status="active" />);
    const badge = screen.getByRole('img');
    expect(badge).toHaveClass('animate-pulse-slow');
  });
  
  it('triggers promotion animation', () => {
    const { rerender } = render(
      <TierBadge tier="sprout" status="ready" />
    );
    rerender(<TierBadge tier="sapling" status="ready" justPromoted />);
    const badge = screen.getByRole('img');
    expect(badge).toHaveClass('animate-glow-pulse');
  });
});
```

### User Testing Criteria

**Success Metrics:**
- [ ] Users can distinguish tier at a glance (< 2 seconds)
- [ ] Promotion action is discoverable (users find "Add to Field" hint)
- [ ] Animation is noticeable but not distracting
- [ ] Tier meaning is intuitive (or quickly learnable)

**Usability Questions:**
1. "What does the 🌿 icon represent?" (Expected: "Sapling" or "Promoted")
2. "How do you make a sprout become a sapling?" (Expected: "Add to Field")
3. "What's the difference between 🌱 and 🌿?" (Expected: Tier/maturity level)

---

## Deliverables Checklist

- [x] Design specification document (this file)
- [x] Badge component wireframes
- [x] GardenTray integration mockups
- [x] Finishing Room header mockups
- [x] Animation specifications
- [x] Accessibility guidelines
- [x] Implementation guidance
- [x] DEX alignment review
- [ ] Update UI_VISION_LIVING_GLASS.md (note v2 vision status)
- [ ] Developer handoff (run `/user-story-refinery` next)

---

## Next Steps

1. **Product Manager:** Review design spec, approve tier logic
2. **UX Chief:** Sign off on DEX alignment
3. **Developer:** Run `/user-story-refinery` to extract implementation stories
4. **Developer:** Implement TierBadge component
5. **Developer:** Integrate into GardenTray and Finishing Room
6. **Mine Sweeper:** Add visual regression tests
7. **Product Pod:** Review deployed feature, iterate if needed

---

*Design spec prepared by UI/UX Designer (Product Pod)*  
*"Make the lifecycle visible. Make growth feel earned."*  
*Sprint: S4-SL-TierProgression | Status: Ready for Refinement*
