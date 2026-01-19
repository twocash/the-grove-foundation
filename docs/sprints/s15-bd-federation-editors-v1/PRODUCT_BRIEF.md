# Product Brief: S15-BD-FederationEditors-v1

**Author:** UX Chief
**Date:** 2026-01-18
**Status:** Ready for PM Review
**Domain:** Bedrock (BD)
**Effort:** Medium (3-4 days)
**Risk:** Low (isolated to 4 files + shared components)

---

## Problem Statement

The Federation Console (S9-SL-Federation-v1) shipped with functional but unusable inspector panels. All 35 E2E tests pass, data flows correctly, but the editor UX fails basic standards:

| Issue | Severity | Impact |
|-------|----------|--------|
| No padding/margins | Critical | Content touches edges, unreadable |
| Inconsistent with factory pattern | High | Breaks visual language |
| Field layout chaotic | High | No logical grouping |
| No section headers | Medium | Can't scan form quickly |
| Missing field descriptions | Medium | Users don't know what fields mean |
| Mobile layout broken | High | Unusable on small screens |

**Core Problem:** Editors were scaffolded to make tests pass, not to be usable. They don't follow the established ExperienceConsole factory pattern.

---

## Target User

**Operator Role:** Grove administrators managing federation relationships

- Configures grove connections to partner groves
- Reviews and manages tier mappings between systems
- Monitors and approves knowledge exchanges
- Tracks trust relationships and scores

**Environment:** Desktop primary, tablet secondary, mobile for monitoring

---

## Success Criteria

1. **Factory Pattern Compliance** - All 4 editors use `InspectorSection`, `InspectorDivider`, `BufferedInput`
2. **Visual Consistency** - Match ExperienceConsole editor look and feel
3. **Mobile Usable** - Works at 360px inspector column width
4. **Accessible** - Labels, keyboard navigation, screen reader support
5. **E2E Maintained** - All 35 existing tests continue to pass

---

## Scope

### In Scope

1. **Refactor 4 Editors:**
   - `GroveEditor.tsx` - Grove configuration
   - `TierMappingEditor.tsx` - Tier equivalences
   - `ExchangeEditor.tsx` - Knowledge exchange management
   - `TrustEditor.tsx` - Trust relationship scores

2. **Create Shared Components:**
   - `StatusBanner` - Connection/approval status visualization
   - `GroveConnectionDiagram` - Visual source→target display
   - `ProgressScoreBar` - Trust/confidence visualization

3. **Apply Factory Patterns:**
   - `InspectorSection` with collapsible support
   - `InspectorDivider` between sections
   - `BufferedInput` / `BufferedTextarea` for all text fields
   - Footer action row (Save, Duplicate, Delete)
   - Header with icon + title + status badge

4. **Accessibility:**
   - Proper `htmlFor` / `id` associations
   - `aria-describedby` for help text
   - Keyboard navigation verification
   - Focus visible states

5. **Responsive:**
   - Works at 360px width (inspector column)
   - No horizontal overflow

### Out of Scope

- New functionality (CRUD operations already work)
- Schema changes
- Backend modifications
- Copilot integration (separate sprint)
- Declarative field configuration (v1.1)

---

## Wireframes

**Reference:** `docs/sprints/s9-sl-federation-v1/INSPECTOR_PANEL_UX_VISION.md`

HTML wireframes for all 4 editors are provided in the vision document with:
- Section structure
- Field layouts
- Status banner designs
- Footer action patterns
- Visual diagrams (grove connections, trust scores)

---

## Technical Constraints

1. **Use Existing Primitives:** `InspectorSection`, `InspectorDivider`, `BufferedInput` from `src/bedrock/primitives/` and `src/shared/layout/`
2. **Quantum Glass v1.0:** CSS variables `--glass-*`, `--neon-*`
3. **Maintain `onEdit` Pattern:** Editors use `PatchOperation[]` interface (commit a9d8188)
4. **No Legacy Imports:** No imports from `src/foundation/`

---

## Dependencies

| Dependency | Status |
|------------|--------|
| S9-SL-Federation-v1 | Complete |
| InspectorSection | Available |
| BufferedInput | Available |
| Quantum Glass tokens | Available |
| Article XI (Contract) | Added |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| E2E tests break | Low | High | Run full suite after each editor |
| Pattern divergence | Low | Medium | Use vision wireframes as source of truth |
| Mobile layout issues | Medium | Medium | Test at 360px width continuously |

---

## Metrics

**Pre-Sprint:**
- Usability score: 0/10 (unusable)
- Factory pattern compliance: 0%

**Post-Sprint:**
- Usability score: 8+/10 (production ready)
- Factory pattern compliance: 100%
- E2E tests passing: 35/35
- Accessibility checklist: Complete

---

## UX Chief Sign-Off

This sprint directly addresses UX debt identified in `POST_SPRINT_UX_DEBT.md`. The vision document provides comprehensive wireframes. Article XI has been added to the Bedrock Sprint Contract to mechanize these requirements for future sprints.

**Recommendation:** APPROVED for execution

**Signature:** UX Chief (Claude Opus 4.5)
**Date:** 2026-01-18

---

## Next Steps

1. PM review and approval
2. Generate USER_STORIES.md with acceptance criteria
3. Create SPEC.md with technical details
4. Write EXECUTION_PROMPT.md for developer handoff
5. Queue for execution

---

*This brief follows the Grove Foundation Loop methodology.*
