# SPRINT PLAN - Cognitive Simulator

> **Status:** 🟢 SPRINTS 1-5 COMPLETE | 🟡 SPRINT 6 IN PROGRESS
> **Last Updated:** 2025-12-19

## Sprint History

### Sprints 1-3: V2.1 Migration ✅ COMPLETE
See `docs/V21_MIGRATION_OPEN_ITEMS.md` for details.
- V2.0 thread system replaced with V2.1 journey/node navigation
- Dead code removed (threadGenerator, JourneyEnd, ThreadProgress)
- Admin aligned with V2.1 schema

### Sprint 4: The Entropy Engine (Logic) ✅ COMPLETE

**Goal:** Implement the "brain" of the simulator—detecting conversation depth.

**Deliverables:**
1. ✅ **Entropy Detector Module:** `src/core/engine/entropyDetector.ts`
   - Scoring logic: +30 depth, +15 vocab, +20 markers, +25 chaining
   - Classification thresholds: LOW (<30), MEDIUM (30-59), HIGH (≥60)
   - Cluster mapping to journey IDs

2. ✅ **State Management:** `useNarrativeEngine.ts`
   - `entropyState` added to session management
   - `evaluateEntropy()`, `checkShouldInject()`, `recordEntropyInjection()`, `recordEntropyDismiss()`
   - Persists to `localStorage: grove-terminal-entropy`

3. ✅ **Router Upgrade:** `src/core/engine/entropyDetector.ts`
   - `TOPIC_CLUSTERS` vocabulary for each domain
   - `CLUSTER_JOURNEY_MAP`: ratchet→ratchet, economics→stakes, observer→simulation

**Verification:** ✅ `npm run build` passes, entropy scoring works in dev

---

### Sprint 5: The Cognitive Bridge (UI) ✅ COMPLETE

**Goal:** Implement the visual injection that makes hybrid cognition visible.

**Deliverables:**
1. ✅ **Bridge Component:** `components/Terminal/CognitiveBridge.tsx`
   - 800ms "Resolving connection..." animation
   - Journey card with title, node count, duration, topics
   - Accept/Dismiss handlers with keyboard support (Escape)

2. ✅ **Terminal Integration:** `components/Terminal.tsx` (~L943-1000)
   - `bridgeState` tracks current injection context
   - Conditional rendering after model response when `shouldInject()` true
   - Bridge appears inline between chat messages

3. ✅ **Action Handlers:**
   - `onAccept`: Calls `startJourney(journeyId)`, sends entry node query
   - `onDismiss`: Triggers 5-exchange cooldown via `dismissEntropy()`

**Verification:** ✅ Bridge appears on high-entropy queries, animation smooth, journey starts correctly

---

### Sprint 6: Analytics & Tuning 🟡 IN PROGRESS

**Goal:** Measure system performance and refine parameters based on real behavior.

**Stories:**

1. ⬜ **Funnel Tracking**
   - Add events: `bridge_shown`, `bridge_accepted`, `bridge_dismissed`
   - Track: `journeyId`, `entropyScore`, `cluster`, `timeToDecision`
   - Wire to existing `funnelAnalytics.ts` infrastructure

2. ⬜ **Parameter Tuning**
   - Isolate thresholds in `constants.ts` for rapid iteration
   - Evaluate: Is MEDIUM (30) too low? Is HIGH (60) right?
   - A/B test potential: entropy_threshold_variant

3. ⬜ **Content Alignment**
   - Verify `DEFAULT_JOURNEY_INFO` in CognitiveBridge.tsx matches V2.1 schema
   - Ensure all three journeys (ratchet, stakes, simulation) have complete metadata
   - Identify gaps: clusters that trigger but lack appropriate journeys

4. ⬜ **Dynamic Journey Metadata** (Stretch)
   - Pull journey info from schema instead of hardcoded defaults
   - Update CognitiveBridge to use `schema.journeys[journeyId]`

**Acceptance Criteria:**
- [ ] Analytics events firing in console/backend
- [ ] Tuning config isolated in `constants.ts`
- [ ] Journey metadata validated against schema
- [ ] Documented baseline metrics for activation/acceptance/completion rates

**Commands:**
```bash
npm run dev     # Manual testing
npm run build   # Type safety verification
```

---

## Files Changed Summary (Sprints 4-6)

| File | Sprint | Change |
|------|--------|--------|
| `src/core/engine/entropyDetector.ts` | 4 | NEW: Entropy scoring, classification, cluster routing |
| `hooks/useNarrativeEngine.ts` | 4 | ADD: Entropy state management, evaluation methods |
| `components/Terminal/CognitiveBridge.tsx` | 5 | NEW: Bridge UI component |
| `components/Terminal.tsx` | 5 | ADD: Bridge integration (~L943-1000) |
| `utils/funnelAnalytics.ts` | 6 | ADD: Bridge tracking events (pending) |
| `constants.ts` | 6 | ADD: Tunable thresholds (pending) |

---

## Tripwires Enforced

- ✅ Terminal.tsx modifications are injection-only (no refactors)
- ✅ Entropy state persists across page refresh
- ✅ Cooldown logic prevents over-injection
- ✅ Journey IDs in cluster map match V2.1 schema
- ⬜ Analytics events follow existing funnel patterns

---

## Success Metrics (Sprint 6)

| Metric | Definition | Baseline | Target |
|--------|------------|----------|--------|
| Activation Rate | % HIGH entropy → bridge shown | TBD | Measure |
| Acceptance Rate | % bridge shown → accepted | TBD | >30% |
| Completion Rate | % accepted → journey completed | TBD | >50% |
| Return Rate | % completers → start another | TBD | Measure |

---

## Next Phase: Knowledge Commons Integration

After Sprint 6 analytics establish baseline, potential enhancements:

1. **Expand Cluster Vocabulary:** Add terms from underrepresented hubs
2. **New Journeys:** Create journeys for `knowledge-commons` and `governance` clusters
3. **Attribution Preview:** Show source citations in journey nodes
4. **Refinery Connection:** Link journey content to validated L1-Hubs

---

*Last Updated: 2025-12-19*
