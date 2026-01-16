# Sprout Tier Progression - Design Decisions & Recommendations

**Sprint:** S4-SL-TierProgression (Phase 0 of Knowledge as Observable System EPIC)  
**Designer:** UI/UX Designer (Product Pod)  
**Date:** 2026-01-15  
**Context:** Answers to 8 design questions + 5 deliverables

---

## ⚠️ CRITICAL: Design System Standards

**BEFORE IMPLEMENTING:** Read `DESIGN_SYSTEM_STANDARDS.md` in this sprint folder.

**v1.0 Implementation Standard:** Quantum Glass ONLY
- ✅ Colors: `--neon-green`, `--glass-void`, `--glass-panel`
- ✅ Fonts: Inter (sans), JetBrains Mono (mono)
- ❌ NOT Living Glass: No `--grove-forest`, no Playfair Display, no botanical tokens

Living Glass is documented as a v2 vision. ALL Phase 0 work uses Quantum Glass to match existing codebase.

---

## Executive Summary

This document answers the 8 critical design questions from the design brief and provides detailed mockups for the 5 deliverables. All recommendations balance **Phase 0 MVP needs** with **future extensibility** for Phases 1-7 of the Knowledge as Observable System vision.

**Key Decisions:**
1. **Minimalist emoji badges** (not custom SVG) for fast MVP
2. **Subtle tier changes** (not celebration moments) aligned with professional use case
3. **No tier filtering** in Phase 0 (keep GardenTray simple)
4. **Provenance panel shows current tier + history link** (not full timeline)
5. **Action panel shows before/after preview** (clear value proposition)
6. **Tooltip-based education** (progressive disclosure, not onboarding overlay)
7. **Quantum Glass tokens** (not Paper/Ink) to match existing codebase
8. **Future-proof component API** (ready for metrics, custom models, federation)

---

## Answers to 8 Design Questions

### Q1: Badge Style Decision

**Question:** Pill, chip, icon+text, or custom treatment?

**Answer: Minimalist Icon Badge (Emoji)**

**Rationale:**
- **Fastest to implement** - No custom assets, pure emoji
- **Scalable at all sizes** - Works in collapsed tray (16px) to modal header (24px)
- **Universal recognition** - Botanical emojis (🌰🌱🌿🌳🌲) instantly recognizable
- **Space efficient** - Critical for dense GardenTray UI
- **Future-proof** - Easy to swap emojis for custom SVG in Living Glass migration

**Visual Treatment:**

```
┌────────────────────────────────────────────────────────┐
│ MINIMALIST ICON BADGE (Phase 0)                       │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Standalone Icon:          🌱                          │
│  (16-24px, no container)                               │
│                                                         │
│  With Label (optional):    🌱 Sprout                   │
│  (Finishing Room header only)                          │
│                                                         │
│  Future: Icon+Metric:      🌱 12 retrievals            │
│  (Phases 2-3, utility signals)                         │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Alternative Explored: Pill Badge**

```
┌──────────────┐
│ 🌱 Sprout   │  ← Takes 80-100px width
└──────────────┘

❌ Rejected: Too wide for GardenTray collapsed view
✅ Consider for future: Tier selector dropdown
```

**Component Sizes:**

| Context | Size | Emoji + Label? | Reasoning |
|---------|------|----------------|-----------|
| GardenTray collapsed | 16px | No | Space constrained |
| GardenTray expanded | 20px | No | Scannable icon |
| Finishing Room header | 24px | Yes | Prominent display |
| Provenance panel | 20px | Yes | Metadata context |
| Action panel preview | 24px | Yes | Before/after clarity |

---

### Q2: Color Strategy

**Question:** Green gradient, distinct colors per tier, or theme-integrated?

**Answer: Quantum Glass Tokens + Semantic Color Mapping**

**Rationale:**
- **Existing codebase uses Quantum Glass** (`--neon-green`, not Paper/Ink)
- **Green family for growth stages** (seed through tree)
- **State-driven overlays** (opacity, grayscale, glow) communicate status
- **Accessible without color** (emojis have distinct shapes)

**Color Palette (Phase 0):**

| Tier | Base Emoji | Status Overlay | Color Token | Meaning |
|------|------------|----------------|-------------|---------|
| **Seed** | 🌰 (brown/tan) | `opacity-40 grayscale` | N/A (dormant) | Pending research |
| **Sprout** | 🌱 (light green) | `ring-2 ring-neon-green/50` | `--neon-green` | Ready/complete |
| **Sapling** | 🌿 (medium green) | `ring-2 ring-neon-green/60` | `--neon-green` | Promoted |
| **Tree** | 🌳 (dark green) | `ring-2 ring-emerald-600/60` | `--emerald-600` | Proven |
| **Grove** | 🌲 (deep green) | `ring-2 ring-emerald-700/70` | `--emerald-700` | Foundational |

**Visual Spectrum:**

```
Maturity:  Low ───────────────────────────────────► High

Emoji:     🌰  →  🌱  →  🌿  →  🌳  →  🌲

Color:     Gray   Light   Medium  Dark   Deep
           (dim)  Green   Green   Green  Green
```

**Accessibility Notes:**
- **Shape distinction:** Emojis have different silhouettes (acorn vs. tree)
- **Size progression:** Emojis naturally get "bigger" visually (seed → tree)
- **Ring intensity:** Higher tiers = stronger ring glow (60% → 70%)
- **Label always present:** In detailed views (provenance panel, header)

**Future: Living Glass Migration (Post-1.0)**

```
Replace:
  --neon-green → --grove-forest (#2F5C3B)
  --neon-cyan  → --grove-sky (TBD)
  --glass-void → --soil-dark (TBD)

Typography:
  Inter → Lora (body), Playfair Display (headers)
```

---

### Q3: Animation Decision

**Question:** Celebrate tier change or keep subtle?

**Answer: Subtle Professional Transition (Not Celebration)**

**Rationale:**
- **Use case:** Knowledge workers, researchers, professionals
- **Frequency:** Users may promote multiple sprouts in one session
- **Context:** Promotion is intentional, not surprising (user clicked "Add to Field")
- **DEX alignment:** Respect user agency - they know what they did

**Phase 0 Animation Sequence (300ms total):**

```
T=0ms: User clicks "Promote Selected"
┌────────────────────────────────────┐
│ Action Panel                       │
│ ┌─────────────────────────────┐   │
│ │ ✓ Source 1                  │   │
│ │ ✓ Source 2                  │   │
│ │                             │   │
│ │ [Promote Selected]  ←clicked│   │
│ └─────────────────────────────┘   │
└────────────────────────────────────┘

T=50ms: Brief glow pulse starts (tier badge)
┌────────────────────────────────────┐
│ Provenance Panel (left column)    │
│                                    │
│ Current Tier: 🌱 Sprout           │
│              ╰━━glow━━╯           │
└────────────────────────────────────┘

T=150ms: Emoji crossfades (sprout → sapling)
┌────────────────────────────────────┐
│ Current Tier: 🌱→🌿 Sprout→Sapling│
│              (opacity 50%)         │
└────────────────────────────────────┘

T=300ms: New tier displayed, glow fades
┌────────────────────────────────────┐
│ Current Tier: 🌿 Sapling           │
│ Promoted: Jan 15, 2026             │
└────────────────────────────────────┘

T=400ms: Toast notification (bottom-right)
┌────────────────────────────────┐
│ ✓ Promoted to Sapling          │
│   2 sources added to field     │
└────────────────────────────────┘
```

**CSS Animation:**

```css
/* Subtle glow pulse (not confetti, not particles) */
@keyframes tier-promotion-glow {
  0% {
    box-shadow: 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 rgba(16, 185, 129, 0);
    transform: scale(1);
  }
}

.tier-promotion {
  animation: tier-promotion-glow 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

**What We're NOT Doing (Explicitly Rejected):**
- ❌ Confetti animation (too playful for professional context)
- ❌ Particle effects (visual clutter)
- ❌ Sound effects (accessibility issue)
- ❌ Full-screen takeover (disruptive)
- ❌ Multi-second celebration (wastes time)

**Future Enhancement (Phase 3):**
When **auto-advancement** occurs (sapling → tree after 5 retrievals):
```
More celebratory notification (user didn't trigger it):
┌────────────────────────────────────┐
│ 🎉 Your sapling grew into a tree!  │
│ "What is the ratchet effect" has  │
│ been retrieved 12 times            │
│                                    │
│ [View Tier History]                │
└────────────────────────────────────┘
```

---

### Q4: GardenTray Filtering/Grouping

**Question:** Add filter/group by tier or keep chronological?

**Answer: Phase 0 = No Filtering. Chronological Only. (Future: Phase 2)**

**Rationale:**
- **Phase 0 scope creep risk** - Filtering is complex (design + backend)
- **User has few sprouts initially** - Filtering not critical when you have 5-10 sprouts
- **Tier badges provide visual grouping** - Users can visually scan by emoji
- **Chronological = familiar** - Users expect newest first
- **Future-ready** - Component API designed for filters (just not in UI yet)

**Phase 0 GardenTray (Simple):**

```
┌─────────────────────────────────────────┐
│ GARDEN TRAY                        [↓]  │  ← Collapse/expand
├─────────────────────────────────────────┤
│                                         │
│ 🌿  Compare MoE vs dense... ▶   2h ago │  ← Sapling (promoted)
│ 🌱  What is ratchet effect? ▶   4h ago │  ← Sprout (ready)
│ 🌱  Context window limits   ▶   1d ago │  ← Sprout (ready)
│ 🌰  New research query...        2d ago │  ← Seed (pending)
│                                         │
└─────────────────────────────────────────┘
  ↑ Tiers visible, chronological order

No filter UI - users scan by emoji
```

**Phase 2 Enhancement (Observable Signals Sprint):**

```
┌─────────────────────────────────────────┐
│ GARDEN TRAY                        [↓]  │
├─────────────────────────────────────────┤
│ Filter: [All ▾] Sort: [Recent ▾]       │  ← NEW
├─────────────────────────────────────────┤
│                                         │
│ 🌿  Compare MoE vs dense... ▶   2h ago │
│ 🌱  What is ratchet effect? ▶   4h ago │
│ 🌱  Context window limits   ▶   1d ago │
│ 🌰  New research query...        2d ago │
│                                         │
└─────────────────────────────────────────┘

Filter Dropdown Options:
- All tiers
- Seeds only
- Sprouts only
- Saplings only
- Trees only
────────────────
- Ready to review (completed sprouts)
- Needs promotion (sprouts not yet sapling)

Sort Dropdown Options:
- Recent first (default)
- Oldest first
- By maturity (grove → seed)
- Most retrieved (Phase 3)
```

**Why Defer Filtering:**
1. **Adds 2-3 user stories** (filter UI + backend queries + state management)
2. **Minimal value at low sprout counts** (users won't use it until they have 20+ sprouts)
3. **Tier badges already provide visual scanning** (color + emoji distinction)
4. **Focus Phase 0 on core value:** Make tier visible and promotable

**Design Note for PM:**
If users request filtering BEFORE Phase 2, we can add a simple search box:
```
┌─────────────────────────────────────────┐
│ 🔍 Search sprouts...               [↓]  │
└─────────────────────────────────────────┘
```

---

### Q5: Tier Education Strategy

**Question:** How much tier education is needed, and when?

**Answer: Progressive Disclosure via Tooltips (Not Onboarding Overlay)**

**Rationale:**
- **Users learn by doing** - Education at moment of need > upfront explanation
- **Tier meanings are intuitive** - Botanical metaphors (seed, sprout, tree) are self-explanatory
- **Onboarding overlays are skipped** - Users dismiss them without reading
- **Tooltips are discoverable** - Hover reveals info when curious

**Education Touchpoints:**

#### 1. Tier Badge Tooltip (Hover)

```
User hovers over tier badge in GardenTray:

    🌱
    ↑
┌──────────────────────────────────┐
│ Sprout                           │
│ Research complete, ready to      │
│ promote to knowledge base        │
│                                  │
│ Add to Field → 🌿 Sapling       │
└──────────────────────────────────┘
```

**Tooltip Content Template:**

```typescript
const TIER_TOOLTIPS = {
  seed: {
    title: "Seed",
    description: "Raw capture, research pending",
    action: null
  },
  sprout: {
    title: "Sprout", 
    description: "Research complete, ready to promote to knowledge base",
    action: "Add to Field → 🌿 Sapling"
  },
  sapling: {
    title: "Sapling",
    description: "Promoted to knowledge base, searchable in RAG",
    action: "Grows to Tree with sustained retrievals"
  },
  tree: {
    title: "Tree",
    description: "Proven valuable through 5+ retrievals",
    action: null // No user action, automatic
  },
  grove: {
    title: "Grove",
    description: "Foundational knowledge, cited by community",
    action: null // Future: community features
  }
}
```

#### 2. First Promotion Moment (Contextual Education)

```
User clicks "Add to Field" for the FIRST TIME:

┌────────────────────────────────────────┐
│ ℹ️  About Tier Progression             │
├────────────────────────────────────────┤
│ You're about to promote this sprout    │
│ to Sapling tier.                       │
│                                        │
│ Saplings are added to your knowledge  │
│ base and become searchable when you   │
│ ask questions.                         │
│                                        │
│ [ ] Don't show this again             │
│                                        │
│ [Cancel]           [Promote to Sapling]│
└────────────────────────────────────────┘
```

**Shown once** (localStorage flag: `hasSeenTierPromotionExplainer`)

#### 3. Provenance Panel "Learn More" Link

```
Provenance Panel:

┌────────────────────────────────────┐
│ Tier & Lifecycle                   │
├────────────────────────────────────┤
│                                    │
│ Current Tier: 🌱 Sprout           │
│                                    │
│ What are tiers? [Learn more ↗]    │  ← Opens help doc
│                                    │
└────────────────────────────────────┘
```

Links to help documentation (future: `/docs/knowledge-lifecycle`)

#### 4. Auto-Advancement Notification (Future - Phase 3)

```
When sapling → tree occurs automatically:

┌────────────────────────────────────────┐
│ 🌳 Automatic Tier Advancement          │
├────────────────────────────────────────┤
│ Your sapling "What is the ratchet     │
│ effect" has grown into a Tree!        │
│                                        │
│ Trees are recognized as valuable by   │
│ the system based on sustained usage.  │
│                                        │
│ Retrievals: 12 times                  │
│ Utility score: 0.89                   │
│                                        │
│ [View Tier History]  [Learn About     │
│                       Auto-Advancement]│
└────────────────────────────────────────┘
```

**Educational, not just notification**

---

**What We're NOT Doing:**
- ❌ Full-screen onboarding overlay (users skip it)
- ❌ Tutorial mode (too much upfront investment)
- ❌ Video tutorials (most users won't watch)
- ❌ Forced reading (respects user agency)

**Why This Works:**
- ✅ **Just-in-time learning** - Info when needed
- ✅ **Progressive disclosure** - Shallow → deep as user engages
- ✅ **Non-blocking** - Doesn't interrupt workflow
- ✅ **Repeatable** - Tooltips always available
- ✅ **Scalable** - Works for future lifecycle models

---

### Q6: Provenance Panel Display

**Question:** Current tier only, or show tier history?

**Answer: Current Tier + Collapsed History Link (Not Full Timeline)**

**Rationale:**
- **Provenance panel is already dense** (Lens, routing, sources, timestamps)
- **Current tier is primary value** - Users need to know "where is this now?"
- **History is secondary** - Useful for auditing, not everyday use
- **Collapsed link pattern** - "View tier history" expands on demand

**Provenance Panel Layout (Phase 0):**

```
┌─────────────────────────────────────────────┐
│ PROVENANCE PANEL (Left Column)             │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Lens & Routing                          │ │
│ │ Dr. Chiang (Research)                   │ │
│ │ Standard RAG → Web Search               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Tier & Lifecycle               ← NEW    │ │
│ │                                         │ │
│ │ Current Tier: 🌿 Sapling               │ │
│ │                                         │ │
│ │ Promoted: Jan 15, 2026 by you          │ │
│ │ View full history ↓                    │ │  ← Collapses/expands
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Knowledge Sources                       │ │
│ │ 5 sources retrieved                     │ │
│ │ [Expand sources...]                     │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Timestamps                              │ │
│ │ Created: Jan 10, 2026                   │ │
│ │ Completed: Jan 10, 2026 (2m)           │ │
│ └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Tier History (Expanded State):**

```
┌─────────────────────────────────────────┐
│ Tier & Lifecycle                        │
├─────────────────────────────────────────┤
│                                         │
│ Current Tier: 🌿 Sapling               │
│                                         │
│ View full history ▲                    │  ← Clicked
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Tier Progression Timeline           │ │
│ │                                     │ │
│ │ 🌿 Sapling      Jan 15, 2026       │ │
│ │    Promoted by you                 │ │
│ │    ↑                               │ │
│ │ 🌱 Sprout       Jan 10, 2026       │ │
│ │    Research completed (2m)         │ │
│ │    ↑                               │ │
│ │ 🌰 Seed         Jan 10, 2026       │ │
│ │    Captured from /explore          │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

**Visual Hierarchy:**
1. **Primary:** Current tier (24px emoji + label)
2. **Secondary:** Most recent transition (promoted date)
3. **Tertiary:** Full history link (collapsed by default)

**Future Enhancement (Phase 3 - Auto-Advancement):**

```
┌─────────────────────────────────────────┐
│ Tier & Lifecycle                        │
├─────────────────────────────────────────┤
│ Current Tier: 🌳 Tree                  │
│                                         │
│ Auto-advanced: Jan 20, 2026            │
│ Trigger: 12 retrievals, 0.89 utility   │  ← NEW: Shows WHY
│                                         │
│ View full history ↓                    │
└─────────────────────────────────────────┘
```

---

### Q7: Action Panel Promotion Preview

**Question:** How do we visualize tier change in action panel?

**Answer: Before/After Badge Preview with Clear Value Prop**

**Rationale:**
- **Makes tier progression VISIBLE** - Users see the outcome before committing
- **Increases perceived value** - "I'm not just saving content, I'm advancing its tier"
- **Educational moment** - Teaches tier system through action
- **Reduces uncertainty** - Clear preview of what will happen

**Action Panel Layout (Promotion Checklist):**

```
┌───────────────────────────────────────────────────┐
│ Add to Field                                      │
├───────────────────────────────────────────────────┤
│                                                   │
│ Select sources to promote to knowledge base:     │
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ ☑ Ratchet effect definition                  │ │
│ │ ☑ Examples from LLM architectures            │ │
│ │ ☐ Historical context (optional)              │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ Tier Progression Preview          ← NEW       │ │
│ │                                               │ │
│ │  Current:  🌱 Sprout                         │ │
│ │            Research complete                  │ │
│ │                                               │ │
│ │     ↓                                         │ │
│ │                                               │ │
│ │  After:    🌿 Sapling                        │ │
│ │            Searchable in knowledge base      │ │
│ │                                               │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ [Cancel]               [Promote to Sapling (2)] │  ← CTA uses tier name
│                                                   │
└───────────────────────────────────────────────────┘
```

**Key Design Elements:**

1. **Before/After Layout:**
   - Side-by-side or stacked (stacked for narrow modals)
   - Arrow (↓) shows progression direction
   - Badge icons + labels + descriptions

2. **Call-to-Action Enhancement:**
   - Button text: "Promote to Sapling (2)" instead of generic "Promote Selected"
   - Count shows how many sources selected
   - Uses tier name to reinforce action

3. **Value Proposition:**
   - "After" state shows benefit: "Searchable in knowledge base"
   - Ties tier to concrete functionality

**Visual Variants:**

**Compact Version (Narrow Modal):**
```
┌─────────────────────────────────────┐
│ Promotion Preview                   │
├─────────────────────────────────────┤
│ 🌱 Sprout → 🌿 Sapling             │
│                                     │
│ Will be added to knowledge base     │
└─────────────────────────────────────┘
```

**Detailed Version (Wide Modal):**
```
┌─────────────────────────────────────────────────┐
│ Tier Progression Preview                        │
├─────────────────────────────────────────────────┤
│ Before                   After                  │
│ ┌─────────────────┐     ┌──────────────────┐   │
│ │ 🌱 Sprout       │  →  │ 🌿 Sapling       │   │
│ │                 │     │                  │   │
│ │ Research        │     │ Searchable in    │   │
│ │ complete        │     │ knowledge base   │   │
│ └─────────────────┘     └──────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

### Q8: Future-Proofing for Phases 1-7

**Question:** Does Phase 0 tier UI have room to grow?

**Answer: Yes - Component API Designed for Extension**

**Future Capabilities by Phase:**

#### Phase 2: Observable Signals (Add Metrics)

```
Current (Phase 0):
┌─────────────────────────────────────┐
│ Current Tier: 🌿 Sapling           │
└─────────────────────────────────────┘

Future (Phase 2):
┌─────────────────────────────────────┐
│ Current Tier: 🌿 Sapling           │
│                                     │
│ Quality Signals:                    │
│ • Retrievals: 8 times               │  ← NEW
│ • Utility score: 0.82               │  ← NEW
│ • Query diversity: High             │  ← NEW
│                                     │
│ Next tier: 12 more retrievals → 🌳 │  ← NEW
└─────────────────────────────────────┘
```

**Component API Extension:**
```typescript
interface TierBadgeProps {
  tier: SproutTier;
  status: SproutStatus;
  
  // Phase 2 additions:
  metrics?: {
    retrievalCount?: number;
    utilityScore?: number;
    queryDiversity?: 'low' | 'medium' | 'high';
  };
  
  // Phase 3 additions:
  nextTierCriteria?: {
    tier: SproutTier;
    remainingRetrievals?: number;
    remainingDays?: number;
  };
}
```

#### Phase 3: Auto-Advancement (Notifications)

```
Notification when sapling → tree automatically:

┌────────────────────────────────────────┐
│ 🌳 Your Sapling Grew Into a Tree!      │
├────────────────────────────────────────┤
│ "What is the ratchet effect"          │
│                                        │
│ Advancement triggered by:              │
│ • 12 retrievals (threshold: 5)         │
│ • 0.89 utility score (threshold: 0.8)  │
│ • 45 days sustained value              │
│                                        │
│ [View Tier History]  [Learn More]     │
└────────────────────────────────────────┘
```

#### Phase 4: Multi-Model Support (Custom Lifecycles)

```
Admin can define custom lifecycle models:

┌────────────────────────────────────────┐
│ Lifecycle Model: Academic (Custom)     │
├────────────────────────────────────────┤
│ Stages:                                │
│ 📝 Draft → 🔬 Peer Review →           │
│ 📚 Published → 🏛️ Canonical           │
│                                        │
│ Current: 🔬 Peer Review                │
│                                        │
│ Advancement criteria:                  │
│ • 3 reviewer approvals                 │
│ • Citation count: 5                    │
│ • Time since draft: 30 days            │
└────────────────────────────────────────┘
```

**UI supports custom emojis + labels** (not hardcoded to botanical model)

#### Phase 5: Cross-Grove Federation (Tier Mapping)

```
View sprout from another grove:

┌────────────────────────────────────────┐
│ Current Tier: 🌿 Sapling (local)      │
│                                        │
│ External Recognition:                  │
│ • Grove A: "Published" tier            │  ← Tier mapping
│ • Grove B: "Validated" tier            │
│ • Grove C: "Canonical" tier            │
│                                        │
│ [View Cross-Grove Attribution]         │
└────────────────────────────────────────┘
```

#### Phase 6: AI Curation Agents (Proposed Advancements)

```
Agent suggests tier advancement:

┌────────────────────────────────────────┐
│ 🤖 Curation Agent Proposal             │
├────────────────────────────────────────┤
│ Agent: Dr. Chiang (Research Curator)   │
│                                        │
│ Recommends advancing:                  │
│ "What is the ratchet effect"          │
│ 🌿 Sapling → 🌳 Tree                  │
│                                        │
│ Reasoning:                             │
│ • 18 retrievals (threshold: 5)         │
│ • 0.93 utility score (high quality)    │
│ • Cited by 2 other groves              │
│                                        │
│ [Review Signals]  [Approve] [Reject]  │
└────────────────────────────────────────┘
```

---

**Design System Extensibility:**

```typescript
// TierBadge Component API (Future-Proof)

interface TierBadgeProps {
  // Phase 0 (current):
  tier: SproutTier;
  status: SproutStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  justPromoted?: boolean;
  
  // Phase 2 (observable signals):
  metrics?: TierMetrics;
  
  // Phase 3 (auto-advancement):
  autoAdvanced?: boolean;
  nextTierCriteria?: NextTierCriteria;
  
  // Phase 4 (multi-model):
  customLifecycle?: LifecycleModel;
  customEmoji?: string;
  customLabel?: string;
  
  // Phase 5 (federation):
  externalTiers?: ExternalTierMapping[];
  
  // Phase 6 (AI curation):
  proposedTier?: {
    tier: SproutTier;
    agentId: string;
    reasoning: string;
  };
  
  // Extensibility:
  onClick?: () => void;
  onTierChange?: (newTier: SproutTier) => void;
}
```

**All future properties are OPTIONAL** - component works with Phase 0 minimal props.

---

## Summary of Decisions

| Question | Answer | Rationale |
|----------|--------|-----------|
| **Q1: Badge Style** | Minimalist emoji icon | Fast MVP, scalable, space-efficient |
| **Q2: Color Strategy** | Quantum Glass tokens + semantic mapping | Matches existing codebase, accessible |
| **Q3: Animation** | Subtle 300ms glow (not celebration) | Professional use case, respects user agency |
| **Q4: GardenTray Filtering** | Phase 0 = No, Phase 2 = Yes | Avoid scope creep, defer until needed |
| **Q5: Education** | Progressive tooltips (not onboarding) | Just-in-time learning, non-blocking |
| **Q6: Provenance Panel** | Current tier + collapsed history | Balance detail vs. density |
| **Q7: Action Preview** | Before/after badge with value prop | Makes progression visible and valuable |
| **Q8: Future-Proofing** | Extensible component API | Ready for metrics, models, federation |

---

## 5 Deliverables (Following Sections)

1. [Tier Badge Component](#deliverable-1-tier-badge-component)
2. [Tier Progression Flow](#deliverable-2-tier-progression-flow)
3. [GardenTray Integration](#deliverable-3-gardentray-integration)
4. [Provenance Panel Enhancement](#deliverable-4-provenance-panel-enhancement)
5. [Tier Visual Language System](#deliverable-5-tier-visual-language-system)

---

# Deliverable 1: Tier Badge Component

## Component Specifications

### 1.1 Core Component

```typescript
interface TierBadgeProps {
  /** Botanical tier (seed/sprout/sapling/tree/grove) */
  tier: 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove';
  
  /** Research status (affects visual treatment) */
  status: 'pending' | 'active' | 'ready';
  
  /** Display size variant */
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
  
  /** Show text label alongside emoji */
  showLabel?: boolean;         // Default: false
  
  /** Trigger promotion glow animation */
  justPromoted?: boolean;      // Default: false
  
  /** Optional tooltip content */
  tooltip?: string | TierTooltipContent;
  
  /** Optional click handler */
  onClick?: () => void;
}

interface TierTooltipContent {
  title: string;
  description: string;
  action?: string;  // e.g., "Add to Field → 🌿 Sapling"
}
```

### 1.2 Size Specifications

| Size | Emoji | Label Font | Use Case |
|------|-------|------------|----------|
| `sm` | 16px (`text-base`) | 11px (`text-xs`) | GardenTray collapsed |
| `md` | 20px (`text-lg`) | 13px (`text-sm`) | GardenTray expanded |
| `lg` | 24px (`text-2xl`) | 15px (`text-base`) | Modal headers |

### 1.3 Visual States

#### Default (Ready)
```tsx
<span className="text-lg">🌱</span>
```
- Full color, no filters
- Optional green ring for emphasis

#### Pending
```tsx
<span className="text-lg opacity-40 grayscale">🌰</span>
```
- 40% opacity, grayscale filter
- Indicates dormant state

#### Active (Processing)
```tsx
<span className="text-lg animate-pulse-slow">🌱</span>
```
- Subtle pulse (2s cycle)
- Optional cyan glow ring

#### Just Promoted
```tsx
<span className="text-lg animate-glow-pulse">🌿</span>
```
- Brief green glow (300ms)
- One-time animation on promotion

### 1.4 Component Variants

#### Variant A: Icon Only (Default)
```
🌱
```
**Usage:** GardenTray, compact contexts

#### Variant B: Icon + Label
```
🌱 Sprout
```
**Usage:** Headers, provenance panels

#### Variant C: Icon + Label + Description
```
🌱 Sprout
Research complete
```
**Usage:** Promotion previews, educational moments

### 1.5 Accessibility

```tsx
<span 
  role="img" 
  aria-label={`${tier} tier, ${status} status`}
  title={tooltip}
  className={...}
>
  {TIER_EMOJI[tier]}
</span>
```

**Screen Reader Announcement:**
```
"Sprout tier, ready status. Hover for more information."
```

---

# Deliverable 2: Tier Progression Flow

## 2.1 User Journey Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ TIER PROGRESSION FLOW (User Promotes Sprout → Sapling)     │
└─────────────────────────────────────────────────────────────┘

Step 1: User views sprout in Finishing Room
┌───────────────────────────────────────────────────────────┐
│ ┌─────────────┬──────────────────────┬─────────────────┐  │
│ │ Provenance  │ Document Viewer      │ Action Panel    │  │
│ │             │                      │                 │  │
│ │ Current:    │ [Research content]   │ Available       │  │
│ │ 🌱 Sprout   │                      │ Actions:        │  │
│ │             │                      │ • Add to Field  │  │ ← User notices
│ └─────────────┴──────────────────────┴─────────────────┘  │
└───────────────────────────────────────────────────────────┘

Step 2: User clicks "Add to Field" in Action Panel
┌───────────────────────────────────────────────────────────┐
│ Action Panel (Expanded)                                   │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Add to Field                                        │   │
│ │                                                     │   │
│ │ Select sources:                                     │   │
│ │ ☑ Ratchet effect definition                        │   │
│ │ ☑ Examples from LLM architectures                  │   │
│ │                                                     │   │
│ │ ┌─────────────────────────────────────────────────┐ │   │
│ │ │ Tier Preview:                                   │ │   │ ← NEW
│ │ │ 🌱 Sprout → 🌿 Sapling                         │ │   │
│ │ │ Will be added to knowledge base                 │ │   │
│ │ └─────────────────────────────────────────────────┘ │   │
│ │                                                     │   │
│ │ [Promote to Sapling (2)] ← User clicks             │   │
│ └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘

Step 3: Promotion animation (300ms)
┌───────────────────────────────────────────────────────────┐
│ Provenance Panel                                          │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Current Tier: 🌱 → 🌿                              │   │ ← Morphing
│ │              ╰━━ glow ━━╯                          │   │
│ └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘

Step 4: Tier updated, toast notification
┌───────────────────────────────────────────────────────────┐
│ Provenance Panel                          Toast:          │
│ ┌─────────────────────────────────┐  ┌─────────────────┐  │
│ │ Current Tier: 🌿 Sapling       │  │ ✓ Promoted to   │  │
│ │ Promoted: Jan 15, 2026         │  │   Sapling       │  │
│ └─────────────────────────────────┘  │ 2 sources added │  │
│                                      └─────────────────┘  │
└───────────────────────────────────────────────────────────┘

Step 5: User closes modal, GardenTray reflects change
┌───────────────────────────────────────────────────────────┐
│ GARDEN TRAY                                               │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🌿  What is the ratchet effect? ▶        2h ago    │   │ ← Updated
│ │ 🌱  Context window limits       ▶        1d ago    │   │
│ └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

## 2.2 Animation Timeline

```
Detailed 300ms Animation Sequence:

T = 0ms: User clicks "Promote to Sapling"
├─ Action panel button loading state
├─ Backend: Update tier field to "sapling"
└─ Backend: Add sources to RAG

T = 50ms: Backend confirms success
├─ Tier badge animation starts
└─ Provenance panel begins transition

T = 100ms: Glow pulse maximum intensity
├─ box-shadow: 0 0 12px rgba(16, 185, 129, 0.6)
└─ transform: scale(1.05)

T = 150ms: Emoji crossfade
├─ Old emoji (🌱) fades to 50% opacity
└─ New emoji (🌿) fades in from 50% opacity

T = 300ms: Animation complete
├─ New tier displayed at 100% opacity
├─ Glow fades to 0
└─ Scale returns to 1.0

T = 400ms: Success toast appears
└─ "✓ Promoted to Sapling - 2 sources added"

Total perceived duration: ~500ms
```

---

# Deliverable 3: GardenTray Integration

## 3.1 Current vs. New State

### Before (Status Emoji Only)

```
┌─────────────────────────────────────────┐
│ GARDEN TRAY                        [↓]  │
├─────────────────────────────────────────┤
│                                         │
│ 🌻  What is the ratchet effect?   2h   │  ← Status only
│ ⚙️  Context window limits         1d   │
│ 🌻  Compare MoE vs dense...       3d   │
│                                         │
│ All completed sprouts look identical    │
│ (same 🌻 emoji)                        │
└─────────────────────────────────────────┘
```

### After (Tier Badges)

```
┌─────────────────────────────────────────┐
│ GARDEN TRAY                        [↓]  │
├─────────────────────────────────────────┤
│                                         │
│ 🌿  What is the ratchet effect? ▶  2h  │  ← Sapling (promoted)
│ 🌱  Context window limits       ▶  1d  │  ← Sprout (ready)
│ 🌱  Compare MoE vs dense...     ▶  3d  │  ← Sprout (ready)
│ 🌰  New research query...           4d  │  ← Seed (pending)
│                                         │
│ Tiers instantly visible by emoji        │
└─────────────────────────────────────────┘
```

## 3.2 SproutRow Component Integration

### Code Changes

**Before:**
```tsx
<div className="flex items-center gap-2">
  <span className="text-sm">{statusEmoji}</span>
  {isExpanded && <span>{sprout.title}</span>}
</div>
```

**After:**
```tsx
<div className="flex items-center gap-2">
  <TierBadge 
    tier={sprout.tier}
    status={sprout.status}
    size={isExpanded ? 'md' : 'sm'}
    tooltip={{
      title: TIER_LABELS[sprout.tier],
      description: TIER_DESCRIPTIONS[sprout.tier],
      action: getPromotionAction(sprout.tier)
    }}
  />
  {isExpanded && <span>{sprout.title}</span>}
</div>
```

### Responsive Behavior

```
┌─────────────────────────────────────────┐
│ COLLAPSED TRAY (Sidebar Mode)          │
├─────────────────────────────────────────┤
│ ┌─────┐                                 │
│ │ 🌿  │  ← 16px icon only              │
│ │ 🌱  │                                 │
│ │ 🌱  │                                 │
│ │ 🌰  │                                 │
│ └─────┘                                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ EXPANDED TRAY (Full Width)              │
├─────────────────────────────────────────┤
│ 🌿  What is the ratchet effect? ▶  2h  │  ← 20px + title
│ 🌱  Context window limits       ▶  1d  │
│ 🌱  Compare MoE vs dense...     ▶  3d  │
│ 🌰  New research query...           4d  │
└─────────────────────────────────────────┘
```

## 3.3 Phase 2 Enhancement (Deferred)

### Filter UI (Not in Phase 0)

```
┌─────────────────────────────────────────┐
│ GARDEN TRAY                        [↓]  │
├─────────────────────────────────────────┤
│ Filter: [All ▾]    Sort: [Recent ▾]    │  ← Future
├─────────────────────────────────────────┤
│ 🌿  Sapling 1                      2h   │
│ 🌿  Sapling 2                      5h   │
│ ─────────────────────────────────────── │
│ 🌱  Sprout 1                       1d   │
│ 🌱  Sprout 2                       2d   │
│ ─────────────────────────────────────── │
│ 🌰  Seed 1                         3d   │
└─────────────────────────────────────────┘
```

**Why deferred:** Adds complexity, minimal value at low sprout counts.

---

# Deliverable 4: Provenance Panel Enhancement

## 4.1 Panel Layout

```
┌───────────────────────────────────────────────┐
│ PROVENANCE PANEL (Left Column of Modal)      │
│ Width: 280px                                  │
├───────────────────────────────────────────────┤
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ 🔍 Lens & Cognitive Routing               │ │
│ ├───────────────────────────────────────────┤ │
│ │ Dr. Chiang (Research)                     │ │
│ │ Standard RAG → Web Search                 │ │
│ │ 47 tokens context                         │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ 🌿 Tier & Lifecycle              ← NEW    │ │
│ ├───────────────────────────────────────────┤ │
│ │                                           │ │
│ │ Current Tier:                             │ │
│ │ 🌿 Sapling (24px)                        │ │
│ │                                           │ │
│ │ Promoted: Jan 15, 2026 by you            │ │
│ │                                           │ │
│ │ View tier history ↓                      │ │  ← Expandable
│ │                                           │ │
│ │ [What are tiers? ↗]                      │ │  ← Help link
│ │                                           │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ 📚 Knowledge Sources                      │ │
│ ├───────────────────────────────────────────┤ │
│ │ 5 sources retrieved                       │ │
│ │ [Expand sources...]                       │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ┌───────────────────────────────────────────┐ │
│ │ ⏰ Timestamps                              │ │
│ ├───────────────────────────────────────────┤ │
│ │ Created: Jan 10, 2026                     │ │
│ │ Research completed: Jan 10 (2m)          │ │
│ │ Promoted: Jan 15, 2026                   │ │
│ └───────────────────────────────────────────┘ │
│                                               │
└───────────────────────────────────────────────┘
```

## 4.2 Tier History (Expanded State)

```
┌───────────────────────────────────────────┐
│ 🌿 Tier & Lifecycle                       │
├───────────────────────────────────────────┤
│ Current Tier: 🌿 Sapling                 │
│                                           │
│ View tier history ▲                      │  ← Clicked
│                                           │
│ ┌─────────────────────────────────────┐   │
│ │ Tier Progression Timeline           │   │
│ │ ────────────────────────────────────│   │
│ │                                     │   │
│ │ 🌿 Sapling      Jan 15, 2026       │   │
│ │    Promoted by you                 │   │
│ │    • 2 sources added to field      │   │
│ │                                     │   │
│ │    ↑ (2m elapsed)                  │   │
│ │                                     │   │
│ │ 🌱 Sprout       Jan 10, 2026       │   │
│ │    Research completed              │   │
│ │    • Dr. Chiang lens               │   │
│ │    • Standard RAG → Web Search     │   │
│ │                                     │   │
│ │    ↑ (instant)                     │   │
│ │                                     │   │
│ │ 🌰 Seed         Jan 10, 2026       │   │
│ │    Captured from /explore          │   │
│ │    • Query: "What is ratchet..."   │   │
│ └─────────────────────────────────────┘   │
│                                           │
└───────────────────────────────────────────┘
```

## 4.3 Tier States in Provenance Panel

### Seed (Pending)
```
┌───────────────────────────────────────┐
│ 🌰 Tier & Lifecycle                   │
├───────────────────────────────────────┤
│ Current Tier: 🌰 Seed                │
│               (40% opacity, gray)     │
│                                       │
│ Status: Research queued               │
│ Started: Jan 15, 2026                │
└───────────────────────────────────────┘
```

### Sprout (Ready to Promote)
```
┌───────────────────────────────────────┐
│ 🌱 Tier & Lifecycle                   │
├───────────────────────────────────────┤
│ Current Tier: 🌱 Sprout              │
│               (full color, ring)      │
│                                       │
│ Research completed: Jan 10, 2026     │
│                                       │
│ 💡 Ready to promote → 🌿 Sapling     │
│    Use "Add to Field" action         │
└───────────────────────────────────────┘
```

### Sapling (Promoted)
```
┌───────────────────────────────────────┐
│ 🌿 Tier & Lifecycle                   │
├───────────────────────────────────────┤
│ Current Tier: 🌿 Sapling             │
│                                       │
│ Promoted: Jan 15, 2026 by you        │
│ Added to knowledge base              │
│                                       │
│ View tier history ↓                  │
└───────────────────────────────────────┘
```

### Tree (Proven Valuable - Phase 3)
```
┌───────────────────────────────────────┐
│ 🌳 Tier & Lifecycle                   │
├───────────────────────────────────────┤
│ Current Tier: 🌳 Tree                │
│                                       │
│ Auto-advanced: Jan 20, 2026          │
│ Trigger: 12 retrievals               │
│                                       │
│ Quality Signals:                      │
│ • Retrieval count: 12                │
│ • Utility score: 0.89                │
│ • Query diversity: High              │
│                                       │
│ View tier history ↓                  │
└───────────────────────────────────────┘
```

---

# Deliverable 5: Tier Visual Language System

## 5.1 Design System Entry

### Tier Constants

```typescript
// src/shared/constants/tier-system.ts

export const TIER_EMOJI = {
  seed: '🌰',
  sprout: '🌱',
  sapling: '🌿',
  tree: '🌳',
  grove: '🌲'
} as const;

export const TIER_LABELS = {
  seed: 'Seed',
  sprout: 'Sprout',
  sapling: 'Sapling',
  tree: 'Tree',
  grove: 'Grove'
} as const;

export const TIER_DESCRIPTIONS = {
  seed: 'Raw capture, research pending',
  sprout: 'Research complete, ready to promote',
  sapling: 'Promoted to knowledge base, searchable',
  tree: 'Proven valuable through sustained use',
  grove: 'Foundational knowledge, community recognized'
} as const;

export const TIER_COLORS = {
  seed: 'rgba(120, 113, 108, 0.6)',      // Dim brown
  sprout: 'rgba(16, 185, 129, 0.5)',     // --neon-green/50
  sapling: 'rgba(16, 185, 129, 0.6)',    // --neon-green/60
  tree: 'rgba(5, 150, 105, 0.6)',        // --emerald-600/60
  grove: 'rgba(4, 120, 87, 0.7)'         // --emerald-700/70
} as const;

export type SproutTier = keyof typeof TIER_EMOJI;
export type SproutStatus = 'pending' | 'active' | 'ready';
```

### Color Palette

```css
/* Tier-specific color tokens */
:root {
  /* Base colors (from Quantum Glass) */
  --tier-base-neon-green: #10b981;
  --tier-base-emerald-600: #059669;
  --tier-base-emerald-700: #047857;
  
  /* Tier ring colors */
  --tier-ring-seed: rgba(120, 113, 108, 0.4);
  --tier-ring-sprout: rgba(16, 185, 129, 0.5);
  --tier-ring-sapling: rgba(16, 185, 129, 0.6);
  --tier-ring-tree: rgba(5, 150, 105, 0.6);
  --tier-ring-grove: rgba(4, 120, 87, 0.7);
  
  /* Status overlays */
  --tier-overlay-pending: grayscale(100%) opacity(40%);
  --tier-overlay-active: none;
  --tier-overlay-ready: none;
  
  /* Promotion glow */
  --tier-glow-promotion: 0 0 12px rgba(16, 185, 129, 0.6);
}
```

### Typography

```css
/* Tier label typography */
.tier-label {
  font-family: var(--font-sans); /* Inter */
  font-size: 0.875rem;           /* 14px */
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--text-secondary);  /* #e2e8f0 */
}

.tier-label-large {
  font-family: var(--font-sans);
  font-size: 1rem;               /* 16px */
  font-weight: 600;
  color: var(--text-primary);    /* #ffffff */
}

.tier-description {
  font-family: var(--font-sans);
  font-size: 0.75rem;            /* 12px */
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-muted);      /* #94a3b8 */
}
```

### Spacing

```css
/* Tier component spacing */
.tier-badge {
  /* Icon-only badge */
  padding: 0;
  gap: 0;
}

.tier-badge-with-label {
  /* Icon + label horizontal */
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;  /* 8px between icon and label */
}

.tier-section {
  /* Tier section in provenance panel */
  padding: 1rem;         /* 16px */
  margin-bottom: 0.75rem; /* 12px */
  border-radius: 0.5rem;  /* 8px */
}
```

## 5.2 Component Sizes Reference

```
┌──────────────────────────────────────────────────────────┐
│ TIER BADGE SIZE REFERENCE                                │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Small (sm):   🌱   16px emoji only                       │
│ Medium (md):  🌱   20px emoji, optional label            │
│ Large (lg):   🌱   24px emoji + label                    │
│                                                           │
│ With label (md):  🌱 Sprout  (20px + 14px text)         │
│ With label (lg):  🌱 Sprout  (24px + 16px text)         │
│                                                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ STATE VISUAL VARIANTS                                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Pending:   🌰 (40% opacity, grayscale)                   │
│ Active:    🌱 (pulsing, 100% → 70% @ 2s)                │
│ Ready:     🌱 (ring-2 ring-neon-green/50)                │
│ Promoted:  🌿 (brief glow, 300ms)                        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## 5.3 Accessibility Guidelines

### Color Independence

**Do NOT rely on color alone to communicate tier:**
- ✅ Each tier has unique emoji shape (acorn, sprout, leaves, tree)
- ✅ Labels always accompany icons in detailed views
- ✅ Tooltips provide textual description
- ✅ ARIA labels for screen readers

### ARIA Labels

```tsx
<span 
  role="img" 
  aria-label="Sapling tier, promoted to knowledge base, ready status"
  title="Sapling: Promoted to knowledge base"
>
  🌿
</span>
```

### Keyboard Navigation

```
Tab order in Action Panel:
1. Source checkboxes (☑)
2. Tier preview section (informational, not focusable)
3. "Promote to Sapling" button (primary action)
4. "Cancel" button
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .tier-promotion,
  .animate-pulse-slow,
  .animate-glow-pulse {
    animation: none !important;
    transition: opacity 0.1s ease;
  }
}
```

### Screen Reader Announcements

```tsx
// After successful promotion
<div role="status" aria-live="polite" className="sr-only">
  Sprout promoted to Sapling tier. 2 sources added to knowledge base.
</div>
```

---

## Next Steps: Implementation

### Phase 0 Implementation Order

1. **Week 1: Component Foundation**
   - [ ] Create `TierBadge` component with size variants
   - [ ] Add `tier` field to `Sprout` schema (seed/sprout/sapling/tree)
   - [ ] Create tier constants file (`TIER_EMOJI`, `TIER_LABELS`, etc.)

2. **Week 2: GardenTray Integration**
   - [ ] Update `SproutRow` to use `TierBadge` instead of status emoji
   - [ ] Add tooltip support for tier badges
   - [ ] Test collapsed vs. expanded tray states

3. **Week 3: Finishing Room Integration**
   - [ ] Add tier section to provenance panel
   - [ ] Create tier history collapse/expand component
   - [ ] Add "Learn more" help link

4. **Week 4: Promotion Flow**
   - [ ] Add tier preview to action panel ("Add to Field" checklist)
   - [ ] Implement promotion animation (300ms glow + crossfade)
   - [ ] Update promotion action to set `tier = 'sapling'`
   - [ ] Add success toast with tier confirmation

5. **Week 5: Polish & Testing**
   - [ ] Accessibility audit (ARIA labels, keyboard nav, reduced motion)
   - [ ] Visual regression tests
   - [ ] User acceptance testing
   - [ ] Documentation updates

---

*Design decisions document prepared by UI/UX Designer*  
*Phase 0 of Knowledge as Observable System EPIC*  
*"Make the lifecycle visible. Make it meaningful."*
