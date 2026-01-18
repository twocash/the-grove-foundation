# Sprint 7: Analytics Completion + Quantum Glass v1.2

## Strategic Plan

### The Sequence: A → C → B

**Sprint 7 (This Sprint):** Analytics + Visual Unification  
**Post-Sprint:** Engagement Bug Fix (requires investigation)

### Why This Order Makes Sense

**1. Measurement Before Tuning**
Sprint 6's analytics work gives us visibility into user flows. When we later fix the engagement bugs, we'll have data proving the fixes work. You can't tune what you can't measure.

**2. Stable Soil Before New Seeds**
Quantum Glass v1.2 completes the visual architecture. The Trellis principle of "models are seeds, architecture is soil" applies here — engagement features need stable visual ground. Mixing UI refactors with behavioral debugging creates confusing changesets and harder-to-isolate regressions.

**3. Investigation Needs Focus**
BUG-001 and BUG-003 aren't simple "change X to Y" fixes. They require debugging sessions to trace why computed values aren't triggering renders. Better done as dedicated work with analytics already flowing.

---

### What This Enables

**After Analytics Completion:**
- Funnel events tracked: `bridge_shown`, `bridge_accepted`, `bridge_dismissed`
- Tuning parameters isolated in single file for rapid iteration
- Baseline metrics established before engagement bug fix

**After Quantum Glass v1.2:**
- Every view follows the same visual language
- Terminal/chat feels native, not bolted-on
- Inspector content matches inspector frame
- New object types (Agents, Skills, Memories) can use established patterns
- Sprout and Diary views complete "Explore" section consistency

**After Engagement Bug Fix (Post-Sprint):**
- Reveals actually appear when thresholds are met
- Full funnel visible in analytics: threshold → reveal → acknowledge
- Custom Lens Offer flows correctly after Simulation Reveal

---

### Architectural Alignment

| Trellis Principle | How This Sprint Honors It |
|-------------------|---------------------------|
| "Soil before seeds" | Glass system is soil; engagement features are seeds |
| Declarative Sovereignty | Card patterns documented for non-developer configuration |
| Consistency over cleverness | Every object type, every view, same visual treatment |
| Measure before optimize | Analytics in place before tuning engagement |
| Provenance as Infrastructure | Events track how users move through the system |

---

### Scope Summary

**Part A: Analytics Completion (~2 hours)**
- Wire funnel events to console/logging
- Extract thresholds to `constants.ts`
- Validate journey metadata against schema

**Part C: Quantum Glass v1.2 (~5 hours)**
| View | Current State | Work Needed |
|------|---------------|-------------|
| Terminal/Chat | Old styling | Glass tokens, message bubbles, input field |
| Inspector Content | Glass frame, old content | Glass tokens for all inspector panels |
| Sprout Grid | Partial glass | Complete card pattern |
| Diary View | Old styling | Glass cards, entry list |

**Total Estimate:** ~7 hours

---

### Post-Sprint: Engagement Bug Fix

Documented separately in `docs/sprints/engagement-reveal-bugfix/PLAN.md`

| Bug | Issue | Impact |
|-----|-------|--------|
| BUG-001 | Custom Lens Offer never appears | Users miss personalization flow |
| BUG-003 | Reveals queue but don't display | Core engagement loop broken |

**Why Deferred:**
- Requires investigation, not just implementation
- Analytics needed to verify fix works
- Visual layer should be stable first

---

*Ready to proceed with Foundation Loop artifacts.*
