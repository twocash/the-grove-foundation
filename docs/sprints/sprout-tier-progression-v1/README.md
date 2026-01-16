# Sprout Tier Progression v1 - Sprint Documentation

**Sprint:** S4-SL-TierProgression  
**Phase:** Phase 0 of Knowledge as Observable System EPIC  
**Status:** Design Complete, Ready for Development

---

## 📋 Sprint Overview

Make sprout lifecycle progression **visible and meaningful** to users through botanical tier badges (seed → sprout → sapling → tree → grove).

**Core Value:** Users can see their knowledge maturing from raw captures to proven, valuable content.

---

## 📦 Design Deliverables

### 1. **DESIGN_SYSTEM_STANDARDS.md** ⚠️ READ FIRST
**Critical reference document** clarifying which design system to use:
- ✅ Quantum Glass = v1.0 standard (USE THIS)
- ❌ Living Glass = v2 vision (DO NOT USE)

Includes token reference, color mappings, and migration notes.

### 2. **DESIGN_SPEC.md**
Original comprehensive design specification (500+ lines):
- TierBadge component specification
- GardenTray integration wireframes
- Finishing Room header enhancement
- Animation sequences (300ms promotion glow)
- Accessibility guidelines
- Implementation guidance
- Future extensibility (Phases 1-7)

### 3. **DESIGN_DECISIONS.md**
Expanded specification with 8 design question answers (800+ lines):
- Badge style decision (minimalist emoji)
- Color strategy (Quantum Glass green gradient)
- Animation approach (subtle, professional)
- Filtering/grouping recommendations (Phase 2)
- Education strategy (progressive tooltips)
- Provenance panel integration
- Action panel promotion preview
- Future-proofing for EPIC vision

**Plus 5 complete deliverables:**
1. Tier Badge Component (specs, variants, states)
2. Tier Progression Flow (user journey, animation timeline)
3. GardenTray Integration (before/after mockups)
4. Provenance Panel Enhancement (tier history treatment)
5. Tier Visual Language System (design tokens, accessibility)

---

## 🎨 Design System Clarity

### v1.0 Implementation (Current Sprint)

**USE QUANTUM GLASS:**
```css
/* Colors */
--neon-green: #10b981;
--glass-void: #030712;
--glass-panel: rgba(17, 24, 39, 0.6);

/* Fonts */
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### v2 Vision (Post-1.0 Migration)

**Living Glass (NOT for Phase 0):**
```css
/* DO NOT USE IN v1.0 */
--grove-forest: #2F5C3B;
--grove-clay: #D95D39;
--font-serif: 'Playfair Display';
--font-body: 'Lora';
```

**Why?** Living Glass is not implemented. Using it creates aesthetic drift, breaks consistency, and complicates maintenance.

---

## 🌱 Tier System (Phase 0)

| Tier | Emoji | Meaning | Trigger | Visible |
|------|-------|---------|---------|---------|
| Seed | 🌰 | Raw capture | Initial capture | ✅ Yes |
| Sprout | 🌱 | Researched | Pipeline completes | ✅ Yes |
| Sapling | 🌿 | Promoted | User "Add to Field" | ✅ Yes |
| Tree | 🌳 | Proven valuable | 5+ retrievals | ✅ Yes |
| Grove | 🌲 | Foundational | Community consensus | ❌ Hidden (no features) |

---

## 🎯 Key Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Aesthetic** | Quantum Glass | Match existing codebase |
| **Badge Type** | Minimalist emoji | Fast to ship, space-efficient |
| **Colors** | Green gradient | Botanical metaphor, accessible |
| **Animation** | Subtle 300ms glow | Professional use case |
| **Filtering** | Phase 2 (deferred) | Keep Phase 0 simple |
| **Education** | Tooltips | Progressive disclosure |
| **Provenance** | Current + history link | Balance detail/density |

---

## 📊 Component Specifications

### TierBadge Component

**Sizes:**
- `sm`: 16px (GardenTray collapsed)
- `md`: 20px (GardenTray expanded)
- `lg`: 24px (Modal headers)

**States:**
- Default: Full color, no filters
- Pending: 40% opacity + grayscale
- Active: Pulsing animation (2s cycle)
- Promoted: Brief green glow (300ms)

**Props:**
```typescript
interface TierBadgeProps {
  tier: 'seed' | 'sprout' | 'sapling' | 'tree';
  status: 'pending' | 'active' | 'ready';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  justPromoted?: boolean;
}
```

---

## 🚀 Implementation Order

1. **Week 1:** TierBadge component + tier field in schema
2. **Week 2:** GardenTray integration (replace status emoji with tier badge)
3. **Week 3:** Finishing Room integration (provenance panel + header)
4. **Week 4:** Promotion flow (action panel preview + animation)
5. **Week 5:** Polish, accessibility audit, testing

---

## 🔗 Related Documentation

**EPIC Vision:**
- `.agent/status/VISION_KNOWLEDGE_AS_OBSERVABLE_SYSTEM.md` (full vision)
- `.agent/status/DESIGN_INPUT_TIER_PROGRESSION.md` (design brief)
- `.agent/status/PRODUCT_POD_BRIEF_LIFECYCLE.md` (product context)

**Design System:**
- `docs/design-system/DESIGN_SYSTEM.md` (Quantum Glass tokens)
- `docs/design-system/UI_VISION_LIVING_GLASS.md` (v2 vision - marked "future")

**Existing Components:**
- `src/explore/components/GardenTray/` (integration point)
- `src/surface/components/modals/SproutFinishingRoom/` (integration point)

---

## ✅ Design Review Checklist

Before proceeding to development:

- [x] All 8 design questions answered
- [x] 5 deliverables completed (badge, flow, tray, panel, visual language)
- [x] Quantum Glass vs. Living Glass clarified
- [x] Component API future-proofed for Phases 1-7
- [x] Accessibility guidelines documented
- [x] Animation specifications provided
- [ ] Product Manager approval
- [ ] UX Chief DEX alignment sign-off
- [ ] Developer handoff (run `/user-story-refinery`)

---

## 🎓 For Developers

**Start here:**
1. Read `DESIGN_SYSTEM_STANDARDS.md` ← MANDATORY
2. Review `DESIGN_DECISIONS.md` (Q1-Q8 answers)
3. Reference `DESIGN_SPEC.md` for component details
4. Run `/user-story-refinery` to extract implementation stories

**Don't:**
- Use Living Glass tokens (wrong system for v1.0)
- Add tier filtering in Phase 0 (deferred to Phase 2)
- Create celebration animations (keep subtle)
- Hardcode tier logic (use declarative config foundation)

**Do:**
- Use Quantum Glass tokens (`--neon-green`, Inter font)
- Replace status emoji with tier emoji (not additive)
- Keep animation subtle (300ms glow, not confetti)
- Design for extensibility (Phases 2-7 add metrics, models, federation)

---

## 📈 Success Criteria

**User can answer at a glance:**
- "What tier is this sprout?" (badge is scannable)
- "How do I make it grow?" (promotion action is discoverable)
- "What does sapling mean?" (tier meaning is learnable)
- "Which sprouts are most mature?" (tier comparison is easy)

**Technical:**
- Visual consistency with existing Quantum Glass surfaces
- Accessible without color (shape + label)
- Performant animations (300ms, respects reduced motion)
- Extensible API (ready for future phases)

---

## 🔄 Future Phases (Post-Phase 0)

- **Phase 1:** Lifecycle config engine (declarative tier rules)
- **Phase 2:** Observable signals (retrieval count, utility scores)
- **Phase 3:** Auto-advancement (sapling → tree based on usage)
- **Phase 4:** Multi-model support (custom lifecycle configs)
- **Phase 5:** Cross-grove federation (tier mapping)
- **Phase 6:** AI curation agents (propose tier advancements)
- **Phase 7:** Attribution economy (tier-based rewards)

This Phase 0 design is **future-proof** for the full EPIC vision.

---

*Sprint documentation by UI/UX Designer*  
*"Make the lifecycle visible. Make it beautiful. Make it Quantum."*  
*Last updated: 2026-01-15*
