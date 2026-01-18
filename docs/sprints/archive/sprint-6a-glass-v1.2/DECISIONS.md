# Sprint 6A + Quantum Glass v1.2
## DECISIONS.md

**Date:** 2025-12-25

---

## Decision Log

### DEC-001: Combine Sprint 6A + Quantum Glass v1.2

**Status:** APPROVED
**Context:** Need both analytics capability and visual consistency before engagement bug fixes.

**Decision:** Run analytics (Sprint 6A) and visual unification (Glass v1.2) as a single sprint.

**Rationale:**
- Analytics enables data-driven verification of later bug fixes
- Visual consistency must precede behavioral changes (Trellis: "soil before seeds")
- Both are low-risk, well-scoped workstreams
- Combined effort ~6-8 hours fits in one session

---

### DEC-002: Single ENTROPY_CONFIG Source

**Status:** APPROVED
**Context:** Two ENTROPY_CONFIG definitions exist with different structures.

**Decision:** Keep `constants.ts` version as canonical, delete or re-export from `src/core/engagement/config.ts`.

**Rationale:**
- `constants.ts` version is more comprehensive
- Engagement system should import from central config
- Reduces cognitive load for future tuning

---

### DEC-003: Glass Tokens for Terminal Chat

**Status:** APPROVED
**Context:** Terminal chat currently uses light-mode defaults that clash with glass workspace.

**Decision:** Apply glass tokens via CSS classes, not inline styles.

**Token Assignments:**
- Chat container: `--glass-void`
- User messages: `--glass-elevated` (subtle differentiation)
- Assistant messages: `--glass-panel` (primary surface)
- Input field: `--glass-solid` with `--glass-border`
- Send button: `--neon-green`

**Rationale:**
- CSS classes enable consistent styling across components
- Matches pattern established in v1.0 and v1.1
- Easier to maintain than scattered inline styles

---

### DEC-004: Message Bubble Differentiation

**Status:** APPROVED
**Context:** Need visual distinction between user and assistant messages.

**Decision:**
- User messages: Right-aligned, `--glass-elevated` background, rounded corners
- Assistant messages: Left-aligned, `--glass-panel` background, subtle border

**Rationale:**
- Alignment + color creates clear visual hierarchy
- Follows established chat UI conventions
- Works within glass design system constraints

---

### DEC-005: Inspector Content Styling Scope

**Status:** APPROVED
**Context:** Inspector frame uses glass tokens, but inner content doesn't.

**Decision:** Update inspector content to use glass tokens for:
- Section headers
- Property labels and values
- Metadata blocks
- Action buttons

**Out of Scope:**
- Rich text content (diary entries, descriptions)
- Code blocks
- Charts/visualizations

**Rationale:**
- Focus on structural elements, not content
- Content should remain readable with appropriate contrast
- Prevents over-styling

---

### DEC-006: Analytics Event Verification Approach

**Status:** APPROVED
**Context:** Need to verify funnel events fire correctly.

**Decision:** Use localStorage inspection + console logging in dev mode.

**Approach:**
1. Events write to localStorage via `funnelAnalytics.ts`
2. Dev mode logs events to console
3. `getAnalyticsReport()` function provides summary
4. Manual verification via browser console

**Rationale:**
- Infrastructure already exists
- No backend changes required
- Quick to verify

---

### DEC-007: Diary and Sprout Card Pattern

**Status:** APPROVED
**Context:** These views need glass styling but have different content structures.

**Decision:** Apply same card pattern established in v1.1:
- `.glass-card` container
- `.glass-card-icon` for type icon
- `.glass-card-footer` for metadata
- `.status-badge-*` for stage/status

**Rationale:**
- Consistency across all collection views
- Reuses proven pattern from Journeys/Lenses/Nodes
- Reduces CSS surface area

---

## Open Questions

None currently. All decisions approved and documented.

---

## Future Considerations (Not This Sprint)

1. **Analytics Dashboard UI:** After baseline metrics established
2. **A/B Testing Infrastructure:** After engagement bugs fixed
3. **Theme Toggle:** Light mode for Terminal is deferred
4. **Animation Refinement:** Glass transitions could be smoother
