# Design Input: Sprout Tier Progression Sprint (Phase 0)

**To:** UI/UX Designer
**From:** Randy (Chief of Staff)
**Date:** 2026-01-15
**Context:** Phase 0 of Knowledge as Observable System EPIC
**Notion EPIC:** https://www.notion.so/2ea780a78eef8175acbcf077a0c19ecb

---

## Design Challenge

**How do we make knowledge maturity VISIBLE and MEANINGFUL to users?**

Users currently see sprouts as "pending" or "completed" - static states. We need to show that sprouts have a LIFECYCLE and can GROW through stages.

---

## What We're Building (Phase 0)

### Core Functionality

1. **Tier Field Added to Sprouts**
   - Database: `tier` column (seed/sprout/sapling/tree/grove)
   - Default: "sprout" for all completed research sprouts
   - Promotion action updates tier to "sapling"

2. **Botanical Lifecycle Visualization**
   - 5 tiers: seed → sprout → sapling → tree → grove
   - Each tier has emoji, color, label
   - Visible in GardenTray and Finishing Room

3. **Tier Progression UI**
   - "Add to Field" action now explicitly shows tier change
   - Visual feedback when promotion occurs
   - Tier badge updates in real-time

---

## Design Questions for You

### 1. Tier Badge Design

**Where tier appears:**
- GardenTray: Each sprout row
- Finishing Room: Provenance panel (current tier)
- Finishing Room: Action panel (promotion preview)

**Design options to explore:**
- **Badge style:** Pill badge? Icon + text? Color-coded chip?
- **Emoji usage:** Use botanical emojis (🌰🌱🌿🌳🌲) or create custom icons?
- **Size/prominence:** Should tier be primary info or secondary metadata?

**Recommendation needed:**
- How do we make tier SCANNABLE in GardenTray (quick glance = understand maturity)
- Should tiers use color coding? (green gradient seed→grove? or distinct colors per tier?)

---

### 2. Tier Progression Animation

**User action:** Click "Add to Field" (promotion checklist)

**What happens:**
1. Sources selected
2. Click "Promote Selected"
3. Content goes to RAG
4. **Tier updates: sprout → sapling**

**Design questions:**
- Should there be an animation when tier changes? (sprout badge morphs to sapling?)
- Toast notification showing tier advancement?
- In-line badge update with subtle transition?
- Celebration moment (confetti, glow effect) or subtle/professional?

**Consider:** This is a MEANINGFUL moment. User's work just matured. Balance delight vs. professionalism.

---

### 3. GardenTray Tier Filtering/Grouping

**Current:** GardenTray shows all sprouts in chronological order

**With tiers:** We could group/filter by maturity

**Design questions:**
- Should GardenTray have tier filter pills? (show only saplings)
- Group by tier? (Saplings section, Sprouts section)
- Sort options: "By maturity" (tier order) vs. "By date"
- Badge prominence: Does tier replace status emoji (🌻) or supplement it?

**Challenge:** Don't clutter the UI. GardenTray is already dense.

---

### 4. Provenance Panel Tier Display

**Current provenance panel shows:**
- Lens used
- Cognitive routing path
- Knowledge sources
- Timestamps

**Add tier metadata:**
- Current tier (sprout/sapling/etc.)
- Tier history? ("Promoted to sapling on Jan 15")
- Tier progression path? (visual track: seed → sprout → **sapling** → tree → grove)

**Design questions:**
- Where does tier fit in provenance panel hierarchy?
- Is tier progression history important to show? (or just current tier?)
- Visual metaphor: Progress bar? Breadcrumb trail? Vertical timeline?

**Consideration:** Provenance panel is LEFT column of modal. Don't overcrowd it.

---

### 5. Action Panel Promotion Preview

**Current "Add to Field" checklist:**
- Select sources to promote
- Click "Promote Selected"
- Toast: "N items promoted to knowledge base"

**Enhancement with tiers:**
- Show BEFORE: "Current tier: Sprout 🌱"
- Show AFTER PREVIEW: "After promotion: Sapling 🌿"
- Visual: Side-by-side comparison? Before/after badge preview?
- Call-to-action: "Promote to Sapling" (instead of generic "Promote Selected")

**Design question:**
- How do we make tier progression VISIBLE in the action flow?
- Does showing the tier change increase perceived value of promotion?
- Should there be educational tooltip? ("Saplings are searchable in knowledge base")

---

### 6. Botanical Tier Visual Language

**Canonical tiers from ADR-001:**

| Tier | Emoji | Meaning | Color? |
|------|-------|---------|--------|
| **Seed** | 🌰 | Raw capture, unprocessed | Brown? |
| **Sprout** | 🌱 | Has research document | Light green? |
| **Sapling** | 🌿 | Promoted to knowledge base | Medium green? |
| **Tree** | 🌳 | Proven valuable (future) | Dark green? |
| **Grove** | 🌲 | Foundational (future) | Deep forest green? |

**Design questions:**
- Do we use emojis or custom SVG icons?
- Color coding: Green gradient (seed→grove)? Or distinct colors per tier?
- Visual metaphor consistency: How does botanical theme integrate with Grove's paper/ink theme?
- Typography: Display tier label ("Sapling") or just icon?

**Consider:** This tier system will expand to Documents too (not just sprouts). Choose a visual language that works universally.

---

### 7. Tier Education (First-Time User)

**Problem:** Users won't know what "sapling" means

**Options:**
1. **Tooltip on hover:** Badge shows tooltip explaining tier
2. **Onboarding overlay:** First time seeing tier badges, explain the system
3. **Help icon:** Question mark next to tier in provenance panel
4. **Progressive disclosure:** Show tier, but don't explain until user promotes

**Design question:**
- How much education is needed? (Minimal vs. comprehensive)
- When should we teach the tier system? (First encounter? When promoting?)
- Tooltip content: Just tier definition? Or full lifecycle explanation?

---

### 8. Future-Proofing for Phases 1-7

**Remember:** Phase 0 is foundation for larger vision

**Future capabilities (design implications):**
- **Phase 2:** Retrieval count, utility scores shown alongside tier
- **Phase 3:** Auto-advancement notifications ("Sprout promoted to Tree!")
- **Phase 4:** Multiple lifecycle models (academic, research, creative)
- **Phase 5:** Cross-grove tier mapping (federation)

**Design questions:**
- Does Phase 0 tier UI have room to grow? (Can we add metrics later?)
- Should we reserve space for tier analytics? (retrieval count, quality signals)
- Visual system extensibility: Can we support custom lifecycle models?

**Don't over-design for future, but don't paint ourselves into a corner.**

---

## Design Deliverables Requested

### 1. Tier Badge Component (High Priority)
**Screens:**
- GardenTray tier badge (collapsed and expanded views)
- Finishing Room provenance panel tier badge
- Action panel promotion preview

**Variations:**
- All 5 tiers (seed, sprout, sapling, tree, grove)
- Active/hover/selected states
- Mobile-responsive sizing

---

### 2. Tier Progression Flow (High Priority)
**User journey wireframe:**
1. User views sprout in Finishing Room (current tier: sprout)
2. User opens "Add to Field" checklist
3. User sees promotion preview (will become: sapling)
4. User clicks "Promote Selected"
5. Tier updates with visual feedback
6. GardenTray refreshes with new tier badge

**Mockup deliverables:**
- Promotion preview state (before/after tier)
- Tier change animation/transition
- Success state with updated tier

---

### 3. GardenTray Integration (Medium Priority)
**Wireframe scenarios:**
- GardenTray with mixed tiers (sprouts + saplings)
- Tier filter UI (if recommended)
- Tier grouping (if recommended)
- Sort by maturity option

**Deliverable:**
- Updated GardenTray mockup with tier badges
- Recommendation: filter/group/sort options

---

### 4. Provenance Panel Enhancement (Medium Priority)
**Wireframe:**
- Where tier metadata appears in provenance panel
- Tier progression history (if recommended)
- Visual hierarchy with existing metadata

**Deliverable:**
- Provenance panel mockup with tier info
- Tier history treatment (if included)

---

### 5. Tier Visual Language System (Low Priority, but Important)
**Design system documentation:**
- Tier badge component spec (colors, sizes, spacing)
- Emoji vs. custom icon decision
- Color palette for tiers
- Typography treatment
- Accessibility considerations (color alone insufficient)

**Deliverable:**
- Tier design system doc (can be Figma file or markdown)

---

## Design Constraints

### Technical:
- GardenTray uses Supabase (ResearchSprout schema)
- Finishing Room modal is 3-column layout (don't break it)
- Existing botanical emojis in codebase (🌱🌻📦)
- Paper/ink theme (cream bg, dark text, green accents)

### UX:
- Don't overwhelm users with complexity
- Tier should feel like natural progression, not arbitrary label
- Promotion should feel rewarding (user invested effort)
- Visual language should extend to Documents (not just sprouts)

### Accessibility:
- Don't rely on color alone (use icons + labels)
- Tier badges must work in collapsed GardenTray (small space)
- ARIA labels for screen readers

---

## Questions for Designer to Answer

1. **Badge Style:** Pill, chip, icon+text, or custom treatment?
2. **Color Strategy:** Green gradient, distinct colors, or theme-integrated?
3. **Animation:** Celebrate tier change or keep it subtle?
4. **GardenTray:** Filter/group by tier or keep chronological?
5. **Education:** How much tier education is needed, and when?
6. **Provenance Panel:** Tier history shown or just current tier?
7. **Promotion Preview:** How do we visualize tier change in action panel?
8. **Visual Language:** Emojis or custom SVG icons?

---

## Success Criteria

**User can answer these questions at a glance:**
- "What tier is this sprout?" (badge is scannable)
- "How do I make it grow?" (promotion action is discoverable)
- "What does sapling mean?" (tier meaning is learnable)
- "Which of my sprouts are most mature?" (tier comparison is easy)

**Visual design supports future phases:**
- Room for tier analytics (retrieval count, utility score)
- Extensible to multiple lifecycle models
- Works for Documents AND Sprouts
- Integrates with existing Grove aesthetic

---

## Timeline

**Design deliverables needed by:** When Product Manager drafts updated sprint brief

**Priority order:**
1. Tier badge component (HIGH - blocks everything)
2. Tier progression flow (HIGH - core user journey)
3. GardenTray integration (MEDIUM)
4. Provenance panel (MEDIUM)
5. Design system doc (LOW - can follow implementation)

---

## Reference Materials

**Existing Design:**
- GardenTray: `src/explore/components/GardenTray/GardenTray.tsx`
- Finishing Room: `src/surface/components/modals/SproutFinishingRoom/`
- Provenance panel: `ProvenancePanel.tsx`
- Action panel: `ActionPanel.tsx`

**Tier Spec:**
- ADR-001: `docs/sprints/pipeline-inspector-v1/ADR-001-knowledge-commons-unification.md`
- Vision: `.agent/status/VISION_KNOWLEDGE_AS_OBSERVABLE_SYSTEM.md`
- Feature idea: `.agent/status/FEATURE_IDEA_DECLARATIVE_LIFECYCLE.md`

**Grove Design System:**
- Colors: Paper (#FBFBF9), Ink (#1C1C1C), Grove Forest (#2F5C3B)
- Fonts: Inter (UI), Lora (editorial), JetBrains Mono (code)
- Existing badges: Status emojis in GardenTray (🌱🌿🌻📦)

---

*Design input prepared by Randy - Chief of Staff*
*"Make the lifecycle visible. Make it beautiful."*
