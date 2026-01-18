# Kinetic Experience v1: Migration Plan

**Sprint:** kinetic-experience-v1
**Date:** December 28, 2025

---

## Migration Strategy: Strangler Fig Pattern

The Kinetic Stream replaces Terminal using the Strangler Fig pattern:

1. **Build alongside** — New system grows next to old
2. **Route traffic** — Gradually shift users to new system
3. **Achieve parity** — Match critical Terminal features
4. **Deprecate** — Archive old system when obsolete

```
Phase 1          Phase 2          Phase 3          Phase 4
┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
│Terminal │      │Terminal │      │Terminal │      │ Archive │
│  100%   │      │  50%    │      │  10%    │      │   0%    │
└─────────┘      └─────────┘      └─────────┘      └─────────┘
                 ┌─────────┐      ┌─────────┐      ┌─────────┐
                 │ Kinetic │      │ Kinetic │      │ Kinetic │
                 │  50%    │      │  90%    │      │  100%   │
                 └─────────┘      └─────────┘      └─────────┘
```

---

## Phase 1: Parallel Development (This Sprint)

**Duration:** 2 weeks
**Goal:** Kinetic Stream MVP functional at `/explore`

### Actions

1. Create KineticStream component tree
2. Implement core exploration flow
3. Verify no Terminal dependencies
4. Internal testing only

### User Impact

- Zero — Users continue using `/terminal`
- `/explore` accessible but not advertised

### Success Criteria

- [ ] `/explore` loads without errors
- [ ] Complete chat flow works
- [ ] Concept pivot works
- [ ] Fork selection works
- [ ] No Terminal imports

### Rollback Plan

None needed — Terminal unchanged

---

## Phase 2: Beta Testing (Sprint +1)

**Duration:** 2 weeks
**Goal:** Validate with real users

### Actions

1. **Feature flag implementation:**
   ```typescript
   // src/config/features.ts
   export const FEATURES = {
     KINETIC_STREAM_BETA: false, // Toggle for beta users
   };
   ```

2. **Conditional routing:**
   ```typescript
   // src/router/index.tsx
   const TerminalRoute = FEATURES.KINETIC_STREAM_BETA
     ? <Navigate to="/explore" replace />
     : <TerminalPage />;
   ```

3. **Beta user enrollment:**
   - Internal team first
   - Opt-in for external beta testers
   - Feedback collection mechanism

4. **Telemetry comparison:**
   - Session duration
   - Queries per session
   - Concept clicks
   - Fork selections
   - Error rates

### User Impact

- Beta users redirected to `/explore`
- Non-beta users unaffected
- Clear feedback channel

### Success Criteria

- [ ] 50+ beta sessions completed
- [ ] Error rate < 1%
- [ ] No critical bugs reported
- [ ] Engagement metrics comparable to Terminal

### Rollback Plan

Disable feature flag → Immediate return to Terminal

---

## Phase 3: Gradual Rollout (Sprint +2)

**Duration:** 2-4 weeks
**Goal:** Shift majority traffic to Kinetic Stream

### Actions

1. **Percentage-based rollout:**
   ```typescript
   // src/router/index.tsx
   const useKineticStream = () => {
     const userId = useUserId();
     const percentage = 25; // Increase gradually: 25 → 50 → 75 → 100
     return hashToPercentage(userId) < percentage;
   };
   ```

2. **Rollout schedule:**
   - Week 1: 25% of users
   - Week 2: 50% of users
   - Week 3: 75% of users
   - Week 4: 100% of users

3. **Feature parity completion:**
   - Lens picker
   - Journey selection
   - Session persistence
   - Mobile optimization

4. **Monitoring dashboard:**
   - Real-time error rates
   - Performance metrics
   - User feedback aggregation

### User Impact

- Progressive migration
- Some users may notice interface change
- Help documentation updated

### Success Criteria

- [ ] 100% traffic on Kinetic Stream
- [ ] Error rate < 0.5%
- [ ] Performance metrics stable
- [ ] No regression in engagement

### Rollback Plan

Reduce percentage → Immediate traffic reduction to Kinetic

---

## Phase 4: Terminal Deprecation (Sprint +3)

**Duration:** 1 week
**Goal:** Archive Terminal components

### Actions

1. **Remove Terminal routes:**
   ```typescript
   // src/router/index.tsx
   // Remove: { path: '/terminal', element: <TerminalPage /> }
   // Add redirect: { path: '/terminal', element: <Navigate to="/explore" /> }
   ```

2. **Archive Terminal code:**
   ```bash
   # Move to archive directory
   mkdir -p src/_archive/terminal-legacy
   mv src/components/Terminal src/_archive/terminal-legacy/
   mv src/components/Terminal.tsx src/_archive/terminal-legacy/
   
   # Add README
   echo "Terminal components archived $(date). See kinetic-experience-v1 migration plan." > src/_archive/terminal-legacy/README.md
   ```

3. **Update imports:**
   - Search for any remaining Terminal imports
   - Update or remove references

4. **Documentation:**
   - Update user guides
   - Archive Terminal documentation
   - Add migration notes

### User Impact

- `/terminal` redirects to `/explore`
- Interface is Kinetic Stream only
- Old bookmarks still work (via redirect)

### Success Criteria

- [ ] No Terminal code in active build
- [ ] All routes redirect properly
- [ ] Documentation updated
- [ ] No broken imports

### Rollback Plan

Restore from archive:
```bash
mv src/_archive/terminal-legacy/Terminal src/components/
```

---

## Feature Parity Checklist

Before Phase 3 completion, Kinetic Stream must match Terminal for:

### Core Features (Required for Phase 2)

| Feature | Terminal | Kinetic | Status |
|---------|----------|---------|--------|
| Text input | ✅ | ✅ | MVP |
| Streaming response | ✅ | ✅ | MVP |
| Markdown rendering | ✅ | ✅ | MVP |
| Glass styling | ✅ | ✅ | MVP |
| Navigation forks | ✅ | ✅ | MVP |
| Concept highlights | ❌ | ✅ | MVP |
| Pivot mechanic | ❌ | ✅ | MVP |

### Enhanced Features (Required for Phase 3)

| Feature | Terminal | Kinetic | Status |
|---------|----------|---------|--------|
| Lens selection | ✅ | ⬜ | Sprint +1 |
| Journey selection | ✅ | ⬜ | Sprint +1 |
| Session persistence | ✅ | ⬜ | Sprint +1 |
| Welcome experience | ✅ | ⬜ | Sprint +1 |
| Error recovery | ✅ | ⬜ | Sprint +1 |
| Mobile responsive | ✅ | ⬜ | Sprint +2 |

### New Features (Kinetic Only)

| Feature | Terminal | Kinetic | Status |
|---------|----------|---------|--------|
| Active rhetoric | ❌ | ✅ | MVP |
| Concept pivot | ❌ | ✅ | MVP |
| Fork hierarchy | ❌ | ✅ | MVP |
| LensPeek hover | ❌ | ⬜ | Future |
| Command palette | ❌ | ⬜ | Future |
| Cognitive bridge | ❌ | ⬜ | Future |

---

## Data Migration

### Session Data

Terminal session format:
```typescript
interface TerminalSession {
  id: string;
  messages: Message[];
  lens?: string;
  journey?: string;
}
```

Kinetic session format:
```typescript
interface KineticSession {
  id: string;
  items: StreamItem[];
  lens?: string;
  journey?: string;
  createdAt: number;
}
```

Migration transformer:
```typescript
function migrateSession(terminal: TerminalSession): KineticSession {
  return {
    id: terminal.id,
    items: terminal.messages.map(m => ({
      id: generateId(),
      type: m.role === 'user' ? 'query' : 'response',
      timestamp: Date.now(),
      content: m.content,
      role: m.role,
      createdBy: m.role === 'user' ? 'user' : 'ai',
      isGenerating: false,
    })),
    lens: terminal.lens,
    journey: terminal.journey,
    createdAt: Date.now(),
  };
}
```

### Migration Timing

- **Lazy migration:** Transform sessions when accessed
- **Background migration:** Run batch job during Phase 2
- **Fallback:** Keep Terminal format readable

---

## Risk Mitigation

### Risk: User Confusion

**Scenario:** Users notice interface change, feel disoriented.

**Mitigation:**
- Gradual rollout allows feedback collection
- In-app tooltip: "We've updated the exploration interface!"
- Help documentation with side-by-side comparisons
- Feedback button prominently displayed

### Risk: Performance Regression

**Scenario:** Kinetic Stream slower than Terminal.

**Mitigation:**
- Performance monitoring from Phase 2
- Core Web Vitals tracking
- Rollback capability at all phases
- Performance budget in CI

### Risk: Feature Gap Discovery

**Scenario:** Users rely on Terminal feature not in Kinetic.

**Mitigation:**
- Comprehensive feature audit before Phase 3
- Beta tester feedback collection
- Quick-fix sprint capacity reserved
- Feature flag for emergency Terminal access

### Risk: Data Loss

**Scenario:** Session migration fails, users lose history.

**Mitigation:**
- Keep Terminal session format readable
- Lazy migration preserves originals
- Backup before batch migration
- Manual recovery procedure documented

---

## Communication Plan

### Internal (Team)

| Timing | Communication |
|--------|---------------|
| Sprint start | Migration plan shared in Slack |
| Phase 2 start | Beta testing kickoff meeting |
| Phase 3 start | Full team briefing on rollout |
| Phase 4 complete | Retrospective meeting |

### External (Users)

| Timing | Communication |
|--------|---------------|
| Phase 2 | Beta invitation emails |
| Phase 3 (50%) | Changelog announcement |
| Phase 3 (100%) | Blog post: "Introducing the New Exploration Experience" |
| Phase 4 | Documentation updates, redirect notices |

---

## Rollback Procedures

### Quick Rollback (< 5 minutes)

For feature flag-based rollback:

```bash
# Update feature flag
# In src/config/features.ts:
KINETIC_STREAM_BETA: false

# Deploy
npm run build && npm run deploy
```

### Full Rollback (< 30 minutes)

For percentage-based rollback:

```bash
# Set rollout percentage to 0
# In deployment config:
KINETIC_ROLLOUT_PERCENTAGE=0

# Deploy
npm run build && npm run deploy
```

### Code Rollback (< 1 hour)

For severe issues requiring code revert:

```bash
# Identify last stable commit
git log --oneline -10

# Revert to stable
git revert HEAD~N..HEAD

# Deploy
npm run build && npm run deploy
```

---

## Success Metrics

### Quantitative

| Metric | Terminal Baseline | Target | Threshold |
|--------|-------------------|--------|-----------|
| Error rate | 0.3% | < 0.5% | < 1% |
| Avg session duration | 8 min | ≥ 8 min | ≥ 6 min |
| Queries per session | 4.2 | ≥ 4.2 | ≥ 3 |
| Page load time | 1.2s | < 1.5s | < 2s |
| Time to first response | 0.8s | < 1s | < 1.5s |

### Qualitative

- User feedback sentiment
- Feature request themes
- Support ticket volume
- NPS comparison (if measured)

---

## Timeline Summary

| Phase | Duration | Traffic Split | Key Milestone |
|-------|----------|---------------|---------------|
| 1 | 2 weeks | 0% Kinetic | MVP complete |
| 2 | 2 weeks | Beta only | Validation complete |
| 3 | 2-4 weeks | 25% → 100% | Full rollout |
| 4 | 1 week | 100% Kinetic | Terminal archived |

**Total:** 7-9 weeks from sprint start to Terminal deprecation

---

## Post-Migration

After Phase 4 completion:

1. **Retrospective:** Document lessons learned
2. **Cleanup:** Remove migration code, feature flags
3. **Optimization:** Performance improvements without legacy constraints
4. **Evolution:** Build features only possible with Kinetic architecture

---

*Migration plan complete. Execute phases sequentially with gate checks.*
