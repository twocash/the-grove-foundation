# Grove Execution Contract: S10-SL-AICuration

**Sprint:** S10-SL-AICuration
**Goal:** Enable federated quality assessment with multi-dimensional scoring
**Scope:** Quality scoring engine, federated learning, analytics dashboard, threshold configuration
**Effort:** Large (3-4 sprints)
**Dependencies:** S9-SL-Federation, S8-SL-MultiModel

**What We're Building:**
- Quality scoring engine with multi-dimensional assessment
- Federated learning infrastructure for collective intelligence
- Quality analytics dashboard with network benchmarking
- Threshold configuration system for content filtering
- Manual override system for operator corrections

**What We're NOT Building:**
- Mobile quality assessment app (future sprint)
- AI-generated quality suggestions (S11)
- Quality-based rewards economy (S11)
- Real-time quality streaming (future sprint)

## Build Gates

### Phase 1: Core Infrastructure
**Timeline:** Week 1
**Focus:** Quality scoring engine, database schema, core algorithms

```bash
# Gate 1.1: Type checking
npm run type-check

# Gate 1.2: Unit tests (quality core)
npm test -- --testPathPattern=quality

# Gate 1.3: Build verification
npm run build

# Gate 1.4: Integration tests (quality API)
npm run test:integration

# Gate 1.5: Linting
npm run lint
```

**Success Criteria:**
- All TypeScript compilation successful
- Unit test coverage > 80%
- Build completes without errors
- All quality API endpoints responding
- Linting passes with no errors

---

### Phase 2: UI Components
**Timeline:** Week 2
**Focus:** Quality display, filtering, configuration UI

```bash
# Gate 2.1: Component unit tests
npm test -- --testPathPattern=components

# Gate 2.2: E2E tests (quality UI)
npx playwright test --grep="quality"

# Gate 2.3: Accessibility audit
npm run test:a11y

# Gate 2.4: Visual regression tests
npm run test:visual

# Gate 2.5: Component storybook verification
npm run storybook build
```

**Success Criteria:**
- All component tests passing
- E2E tests passing (Chrome, mobile)
- Accessibility score > 95%
- Visual regression tests passing
- Storybook builds successfully

---

### Phase 3: Federated Learning
**Timeline:** Week 2-3
**Focus:** Federated learning infrastructure, privacy preservation, model updates

```bash
# Gate 3.1: Federated learning integration tests
npm run test:integration -- federated-learning

# Gate 3.2: End-to-end quality assessment flow
npx playwright test tests/e2e/quality.spec.ts

# Gate 3.3: Load testing (quality API)
npm run test:load -- quality

# Gate 3.4: Security audit
npm audit --audit-level moderate

# Gate 3.5: Performance audit
npm run lighthouse-ci
```

**Success Criteria:**
- Federated learning integration tests passing
- Complete quality assessment E2E flow working
- API handles 100 concurrent assessments
- No critical security vulnerabilities
- Lighthouse performance score > 90

---

### Phase 4: System Integration
**Timeline:** Week 3
**Focus:** Federation integration, data migration, final verification

```bash
# Gate 4.1: Full test suite
npm test && npm run build && npx playwright test

# Gate 4.2: E2E tests (all systems)
npx playwright test tests/e2e/

# Gate 4.3: Cross-system integration
npm run test:integration -- --grep="integration"

# Gate 4.4: Database migration
npm run db:migrate && npm run db:seed:test

# Gate 4.5: Production build
NODE_ENV=production npm run build
```

**Success Criteria:**
- All tests green
- E2E tests passing across all browsers
- Integration tests passing
- Migration successful with rollback verified
- Production build successful

---

### Final Verification
**Timeline:** Week 3 (final day)

```bash
# Final verification suite
npm run type-check && \
npm test && \
npm run build && \
npx playwright test && \
npm run lint && \
npm run test:a11y && \
npm audit --audit-level moderate
```

**Success Criteria:**
- All gates passed
- Zero critical bugs
- Documentation complete
- REVIEW.html with evidence
- DEX compliance verified

---

## QA Gates (Mandatory)

### Gate 1: Pre-Development
**Status:** Must complete before coding begins

- [ ] Baseline tests pass (verify existing functionality not broken)
- [ ] Console clean (zero errors, zero warnings)
- [ ] TypeScript compilation successful
- [ ] Federated learning architecture reviewed
- [ ] Security review completed (privacy, differential privacy)
- [ ] Performance baseline established (Lighthouse score recorded)

### Gate 2: Mid-Sprint (Daily)
**Status:** Complete after each phase

- [ ] Phase 1: Quality scoring engine tested
- [ ] Phase 2: UI components tested and accessible
- [ ] Phase 3: Federated learning validated
- [ ] Console audit: Zero errors after each phase
- [ ] Core user journey verified (view score → configure threshold → filter content)
- [ ] Unit test coverage maintained > 80%

### Gate 3: Pre-Merge (Epic Complete)
**Status:** Complete before merging to main

- [ ] All tests green (unit, integration, E2E)
- [ ] Console audit: ZERO errors, ZERO warnings
- [ ] Error boundary testing complete (quality-specific errors)
- [ ] Network monitoring: All quality API requests successful
- [ ] Full user journey passes (all 8 stories)
- [ ] Performance within thresholds (<100ms score retrieval, <2s analytics load)
- [ ] Security scan: No critical or high vulnerabilities

### Gate 4: Sprint Complete
**Status:** Complete before sprint closure

- [ ] All QA gates passed
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Accessibility audit (WCAG 2.1 AA compliance verified)
- [ ] Visual regression tests pass (zero unexpected diffs)
- [ ] Performance check (Lighthouse > 90, FCP < 1.5s, LCP < 2.5s)
- [ ] Documentation review (API docs, user guide, runbook)
- [ ] Knowledge transfer session completed

---

## Console Error Policy

**ZERO TOLERANCE** - Any console errors/warnings = QA failure

### Critical Errors (Immediate Block):
- Error, TypeError, ReferenceError
- Network request failures (quality API calls)
- React component crashes
- Federated learning calculation errors
- Quality score calculation failures
- Database connection failures
- Privacy violation errors
- Override authorization failures

### Warnings (Must Address):
- Unused variables or imports
- Deprecated API usage
- Performance warnings (render blocking, large bundles)
- Accessibility warnings (missing ARIA labels)
- Security warnings (insecure configurations)

### Quality-Specific Errors:
- Quality score calculation failures
- Federated learning update errors
- Threshold filtering bugs
- Dimension scoring inconsistencies
- Override persistence errors
- Analytics aggregation failures

---

## Key Files to Create

### Core Infrastructure (Phase 1)
```typescript
// src/core/quality/schema.ts
export interface QualityScore { ... }
export interface QualityThresholds { ... }
export interface FederatedLearningConfig { ... }
export interface QualityDimensions { ... }

// src/core/quality/scoring.ts
export class QualityScoringEngine {
  async calculateQualityScore(content: FederationContent): Promise<QualityScore>
  async calculateDimensions(content: FederationContent): Promise<QualityDimensions>
  async assessAccuracy(content: FederationContent): Promise<number>
  async assessUtility(content: FederationContent): Promise<number>
  async assessNovelty(content: FederationContent): Promise<number>
  async assessProvenance(content: FederationContent): Promise<number>
}

// src/core/quality/federated-learning.ts
export class FederatedLearningManager {
  async contributeAssessment(groveId: string, assessment: QualityAssessment): Promise<void>
  async receiveModelUpdates(): Promise<ModelUpdate[]>
  async aggregateUpdates(updates: ModelUpdate[]): Promise<AggregatedUpdate>
  async configureParticipation(config: FederatedLearningConfig): Promise<void>
}

// src/core/quality/thresholds.ts
export class ThresholdManager {
  async configureThresholds(groveId: string, thresholds: QualityThresholds): Promise<void>
  async filterByThresholds(content: FederationContent[], thresholds: QualityThresholds): Promise<FederationContent[]>
  async validateThresholds(thresholds: QualityThresholds): Promise<ValidationResult>
}
```

### UI Components (Phase 2)
```typescript
// src/foundation/consoles/QualityConsole.tsx
export function QualityConsole(): JSX.Element { ... }

// src/foundation/components/QualityScoreBadge.tsx (extends Badge)
export function QualityScoreBadge(props: QualityScoreBadgeProps): JSX.Element { ... }

// src/foundation/components/QualityFilterPanel.tsx
export function QualityFilterPanel(props: QualityFilterPanelProps): JSX.Element { ... }

// src/foundation/components/QualityDimensionsBreakdown.tsx
export function QualityDimensionsBreakdown(props: QualityDimensionsBreakdownProps): JSX.Element { ... }

// src/foundation/components/QualityAnalyticsDashboard.tsx
export function QualityAnalyticsDashboard(): JSX.Element { ... }

// src/foundation/components/QualityThresholdConfig.tsx
export function QualityThresholdConfig(): JSX.Element { ... }

// src/foundation/components/QualityOverrideModal.tsx
export function QualityOverrideModal(props: QualityOverrideModalProps): JSX.Element { ... }
```

### API Endpoints (Phase 3)
```typescript
// server.js - Quality endpoints
app.post('/api/quality/scores', calculateQualityScoreHandler)
app.get('/api/quality/scores/:contentId', getQualityScoreHandler)
app.get('/api/quality/scores', listQualityScoresHandler)
app.post('/api/quality/thresholds', configureThresholdsHandler)
app.get('/api/quality/thresholds/:groveId', getThresholdsHandler)
app.post('/api/quality/overrides', overrideScoreHandler)
app.post('/api/quality/federated-learning', configureFederatedLearningHandler)
app.get('/api/quality/analytics/:groveId', getAnalyticsHandler)
app.post('/api/quality/contribute', contributeAssessmentHandler)
app.get('/api/quality/updates', getModelUpdatesHandler)
```

### Database Schema (Phase 1)
```sql
-- Quality scores
CREATE TABLE quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT NOT NULL,
  grove_id TEXT NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL,
  accuracy_score DECIMAL(5,2) NOT NULL,
  utility_score DECIMAL(5,2) NOT NULL,
  novelty_score DECIMAL(5,2) NOT NULL,
  provenance_score DECIMAL(5,2) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  assessed_by TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quality thresholds
CREATE TABLE quality_thresholds (
  grove_id TEXT PRIMARY KEY,
  min_overall_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  min_accuracy DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  min_utility DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  min_novelty DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  min_provenance DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Federated learning participation
CREATE TABLE federated_learning_participation (
  grove_id TEXT PRIMARY KEY,
  participation_enabled BOOLEAN NOT NULL DEFAULT false,
  contribution_weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  privacy_level TEXT NOT NULL DEFAULT 'anonymized',
  update_frequency TEXT NOT NULL DEFAULT 'daily',
  last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quality score overrides
CREATE TABLE quality_score_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_id UUID REFERENCES quality_scores(id),
  grove_id TEXT NOT NULL,
  overridden_by TEXT NOT NULL,
  old_score DECIMAL(5,2) NOT NULL,
  new_score DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Verification Steps

### 1. Quality Score Calculation Verification
```typescript
// Test quality scoring
const score = await qualityScoringEngine.calculateQualityScore({
  contentId: 'content-123',
  content: 'Sample content from federated grove'
});

expect(score.overallScore).toBeGreaterThanOrEqual(0);
expect(score.overallScore).toBeLessThanOrEqual(100);
expect(score.dimensions.accuracy).toBeDefined();
expect(score.dimensions.utility).toBeDefined();
expect(score.dimensions.novelty).toBeDefined();
expect(score.dimensions.provenance).toBeDefined();
```

**Expected:** Score calculated correctly, all dimensions present

---

### 2. Threshold Filtering Verification
```typescript
// Test threshold filtering
const thresholds: QualityThresholds = {
  minOverallScore: 70,
  minAccuracy: 80,
  minUtility: 70,
  minNovelty: 60,
  minProvenance: 85,
  enabled: true
};

const filtered = await thresholdManager.filterByThresholds(content, thresholds);
expect(filtered.every(item => item.qualityScore.overallScore >= 70)).toBe(true);
```

**Expected:** Content filtered correctly based on thresholds

---

### 3. Federated Learning Verification
```typescript
// Test federated learning participation
await federatedLearningManager.configureParticipation({
  groveId: 'grove-123',
  participationEnabled: true,
  privacyLevel: 'anonymized',
  updateFrequency: 'daily'
});

const contributions = await federatedLearningManager.contributeAssessment(
  'grove-123',
  assessment
);

expect(contributions).toBeDefined();
```

**Expected:** Federated learning participation configured correctly

---

### 4. Quality Analytics Verification
```typescript
// Test analytics generation
const analytics = await getAnalytics('grove-123');
expect(analytics.averageScores.overall).toBeDefined();
expect(analytics.trendData).toBeDefined();
expect(analytics.comparisonToNetwork).toBeDefined();
```

**Expected:** Analytics dashboard displays correctly

---

### 5. UI Component Verification
```bash
npm run dev
# Navigate to /foundation/quality
# Verify all components render and function
```

**Expected:** All UI components render correctly, interactions work

---

## Rollback Plan

### Scenario 1: Federated Learning Failure
**Risk:** High impact, medium probability

**Rollback Procedure:**
```bash
# 1. Disable federated learning
app.post('/api/quality/federated-learning/*', (req, res) => {
  res.status(503).json({ error: 'Federated learning temporarily disabled' });
});

# 2. Switch to local-only scoring
qualityScoringEngine.useLocalScoring = true;

# 3. Notify participating groves
await notifyGroveOperators('Federated learning disabled, using local scoring');

# 4. Fix federated learning
# (Deploy patch)

# 5. Re-enable federated learning
qualityScoringEngine.useLocalScoring = false;
```

**Recovery Time:** < 2 hours

---

### Scenario 2: Quality Score Calculation Error
**Risk:** Medium impact, low probability

**Rollback Procedure:**
```typescript
// 1. Freeze quality scoring
qualityScoringEngine.pauseScoring = true;

// 2. Use cached scores
const cachedScores = await cache.get('quality_scores');
grove.content = cachedScores[groveId] || grove.content;

// 3. Fix scoring algorithm
// (Deploy patch)

// 4. Recalculate scores
await qualityScoringEngine.recalculateAllScores();
qualityScoringEngine.pauseScoring = false;
```

**Recovery Time:** < 1 hour

---

### Scenario 3: Privacy Violation
**Risk:** High impact, low probability

**Rollback Procedure:**
```typescript
// 1. Emergency disable all data sharing
app.post('/api/quality/contribute', (req, res) => {
  res.status(503).json({
    error: 'Data sharing disabled',
    reason: 'Privacy violation detected'
  });
});

// 2. Audit all recent contributions
await auditLogger.reviewContributions(last24Hours);

// 3. Notify affected groves
await notifyGroveOperators('Privacy review in progress');

// 4. Fix privacy controls
// (Deploy patch with increased security)

// 5. Re-enable with verification
await verifyPrivacyControls();
```

**Recovery Time:** < 4 hours

---

### Scenario 4: Threshold Configuration Corruption
**Risk:** Low impact, medium probability

**Rollback Procedure:**
```typescript
// 1. Reset to default thresholds
const defaultThresholds = {
  minOverallScore: 50,
  minAccuracy: 50,
  minUtility: 50,
  minNovelty: 50,
  minProvenance: 50,
  enabled: false  // Disable filtering
};

await thresholdManager.resetToDefaults(groveId, defaultThresholds);

// 2. Log corruption
auditLogger.error('Threshold configuration corrupted, reset to defaults', {
  groveId,
  previousThresholds
});

// 3. Notify operators
await notifyGroveOperators('Threshold configuration reset to defaults');
```

**Recovery Time:** < 30 minutes

---

### Emergency Disable Procedure
**Use case:** Critical security issue or data corruption

```typescript
// Emergency disable all quality assessment
app.post('/api/quality/*', (req, res) => {
  res.status(503).json({
    error: 'Quality assessment disabled',
    reason: 'Emergency shutdown',
    contact: 'quality-admin@grove.foundation'
  });
});

// Log all attempts for audit
auditLogger.critical('Emergency quality assessment disable', {
  timestamp: new Date().toISOString(),
  endpoint: req.path,
  body: req.body
});
```

---

## Attention Anchor

### We Are Building
A federated quality assessment system that enables groves to collectively improve quality assessment through privacy-preserving federated learning while maintaining complete autonomy.

### Success Looks Like
- 8 user stories complete and tested
- Quality scoring engine operational (multi-dimensional)
- Federated learning infrastructure functional
- Quality analytics dashboard complete
- Threshold filtering working correctly
- Manual override system functional
- < 100ms quality score retrieval
- All tests passing (unit, integration, E2E)

### We Are NOT
- Building centralized quality standards
- Hardcoding quality criteria or thresholds
- Ignoring DEX compliance (all 4 pillars required)
- Creating mandatory participation in federated learning
- Implementing real-time quality streaming (future sprint)

### Current Phase
Phase 6: Execution Contract Complete → Ready for Developer Handoff

### Next Action
Execute Grove Foundation Loop starting with Phase 0 (Pattern Check). Developer should begin with repo audit and pattern verification.

---

## QA Documentation

**Full QA Protocol**: See `docs/QA_STANDARDS.md`
**Quick Reference**: See `docs/QA_CHECKLIST.md`
**Accessibility Standards**: See `docs/ACCESSIBILITY.md`
**Security Guidelines**: See `docs/SECURITY.md`

---

## Support

**Architecture questions**: UX Chief (DEX compliance, strategic alignment)
**Product questions**: Product Manager (requirements, user stories)
**Technical questions**: Sprint Owner (implementation, integration)
**Security questions**: Security Team (federated learning, privacy)

---

## Completion Checklist

Before marking sprint complete:

- [ ] All 8 user stories implemented and tested
- [ ] All build gates passed (Phase 1-4)
- [ ] All QA gates passed (Gate 1-4)
- [ ] Documentation complete (API docs, user guide, runbook)
- [ ] Visual verification complete (screenshots in REVIEW.html)
- [ ] E2E tests passing (all browsers)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance benchmarks met (< 100ms score retrieval, < 2s analytics load)
- [ ] Security review completed (no critical vulnerabilities)
- [ ] DEX compliance verified (all 4 pillars)
- [ ] Knowledge transfer session completed
- [ ] Deployment successful to staging
- [ ] Staging verification complete
- [ ] REVIEW.html with acceptance criteria evidence

**Sprint Complete**: All checklist items checked ✅

---

**Contract Version**: 1.0
**Last Updated**: 2026-01-16
**Enforcement**: This contract is binding - all gates must pass before merge
