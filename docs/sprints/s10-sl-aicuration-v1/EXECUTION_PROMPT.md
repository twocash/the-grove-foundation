# EXECUTION PROMPT: S10-SL-AICuration
**Sprint:** S10-SL-AICuration
**Phase:** Developer Execution
**Goal:** Enable federated quality assessment with multi-dimensional scoring

---

## ATTENTION ANCHORING PROTOCOL

Before any major decision, re-read:
1. SPEC.md Live Status block
2. SPEC.md Attention Anchor block

After every 10 tool calls:
- Check: Am I still pursuing the stated goal?
- If uncertain: Re-read SPEC.md Goals and Acceptance Criteria

Before committing:
- Verify: Does this change satisfy Acceptance Criteria?

---

## SPRINT OVERVIEW

### What We're Building
- Quality scoring engine with multi-dimensional assessment (accuracy, utility, novelty, provenance)
- Federated learning infrastructure for collective intelligence
- Quality analytics dashboard with network benchmarking
- Threshold configuration system for content filtering
- Manual override system for operator corrections

### What We're NOT Building
- Mobile quality assessment app (future sprint)
- AI-generated quality suggestions (S11)
- Quality-based rewards economy (S11)
- Real-time quality streaming (future sprint)

### Dependencies
- **Required:** S9-SL-Federation (federation protocol must exist first)
- **Optional:** S8-SL-MultiModel (AI model support)

---

## PHASE 0: PATTERN CHECK (MANDATORY)

Read PROJECT_PATTERNS.md and verify:

### Existing Patterns to Extend
- **Foundation Console Pattern** → QualityConsole extends existing console pattern
- **Badge Component** → QualityScoreBadge extends Badge
- **Analytics Pattern** → QualityAnalyticsDashboard extends analytics pattern
- **Modal Pattern** → QualityOverrideModal extends Modal
- **Panel Pattern** → QualityFilterPanel extends Panel

### Pattern Check Verification
```bash
# Verify patterns exist
grep -r "export.*Badge" src/foundation/components/
grep -r "export.*Modal" src/foundation/components/
grep -r "export.*Panel" src/foundation/components/
```

**Result:** All base patterns exist. Quality components will extend them.

---

## PHASE 1: REPOSITORY AUDIT

### Current State Analysis
Run these commands to understand the current state:

```bash
# Check if S9 federation exists
ls -la src/core/federation/ 2>/dev/null || echo "S9 federation not found - BLOCKER"

# Check foundation components structure
ls -la src/foundation/components/ | head -20

# Check existing database schema
find . -name "*.sql" -o -name "*schema*" | grep -v node_modules

# Check existing API endpoints
grep -r "app\." server.js | head -20
```

### Canonical Homes for Quality System
| Capability | Canonical Home | Status |
|------------|----------------|--------|
| Core Types | `src/core/quality/schema.ts` | CREATE |
| Scoring Engine | `src/core/quality/scoring.ts` | CREATE |
| Federated Learning | `src/core/quality/federated-learning.ts` | CREATE |
| Threshold Manager | `src/core/quality/thresholds.ts` | CREATE |
| Quality Console | `src/foundation/consoles/QualityConsole.tsx` | CREATE |
| Quality Components | `src/foundation/components/Quality*.tsx` | CREATE |
| Quality API | `server.js` (extend) | EXTEND |
| Quality Tables | Database migration | CREATE |

---

## PHASE 2: SPECIFICATION VERIFICATION

### Goals (from SPEC_v1.md)
1. ✅ Enable automated quality scoring across federated groves
2. ✅ Implement federated learning for collective quality intelligence
3. ✅ Create quality analytics and benchmarking dashboard
4. ✅ Build threshold-based content filtering system
5. ✅ Provide manual override capabilities for operators

### Acceptance Criteria (from USER_STORIES.md)
**Epic A: Quality Display & Filtering**
- [ ] US-A001: Quality scores visible on all content cards
- [ ] US-A002: Filter content by quality thresholds
- [ ] US-A003: Bulk filter operations work correctly
- [ ] US-A004: Quality badges display correct colors

**Epic B: Multi-Dimensional Scoring**
- [ ] US-B001: Calculate 4 quality dimensions (accuracy, utility, novelty, provenance)
- [ ] US-B002: Overall score calculated from dimensions
- [ ] US-B003: Confidence level displayed with score
- [ ] US-B004: Score explanations available on demand

**Epic C: Federated Learning**
- [ ] US-C001: Opt-in to federated learning participation
- [ ] US-C002: Contribute assessments anonymously
- [ ] US-C003: Receive model updates from network
- [ ] US-C004: Configure privacy level (full/anonymized/aggregated)

**Epic D: Analytics & Benchmarking**
- [ ] US-D001: View quality trends over time
- [ ] US-D002: Compare quality to network average
- [ ] US-D003: Analyze dimension performance
- [ ] US-D004: Export analytics data

**Epic E: Manual Control**
- [ ] US-E001: Override quality scores when necessary
- [ ] US-E002: Audit trail of all overrides
- [ ] US-E003: Configure threshold defaults per grove
- [ ] US-E004: Enable/disable quality filtering

---

## PHASE 3: ARCHITECTURE

### Core Type System (src/core/quality/schema.ts)

```typescript
export interface QualityScore {
  id: string;
  contentId: string;
  groveId: string;
  overallScore: number;
  dimensions: {
    accuracy: number;
    utility: number;
    novelty: number;
    provenance: number;
  };
  confidence: number;
  assessedBy: string;
  assessedAt: string;
  explanation?: string;
}

export interface QualityThresholds {
  groveId: string;
  minOverallScore: number;
  minAccuracy: number;
  minUtility: number;
  minNovelty: number;
  minProvenance: number;
  enabled: boolean;
  updatedAt: string;
}

export interface FederatedLearningConfig {
  groveId: string;
  participationEnabled: boolean;
  contributionWeight: number;
  privacyLevel: 'full' | 'anonymized' | 'aggregated';
  updateFrequency: 'real-time' | 'daily' | 'weekly';
  lastUpdate?: string;
}

export interface QualityAssessment {
  groveId: string;
  contentId: string;
  dimensions: QualityScore['dimensions'];
  confidence: number;
  explanation?: string;
}
```

### Database Schema (Create Migration)

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

### API Endpoints (Extend server.js)

```javascript
// Quality scoring
app.post('/api/quality/scores', async (req, res) => {
  // Calculate quality score for content
});

app.get('/api/quality/scores/:contentId', async (req, res) => {
  // Get quality score for specific content
});

app.get('/api/quality/scores', async (req, res) => {
  // List quality scores with filtering
});

// Threshold configuration
app.post('/api/quality/thresholds', async (req, res) => {
  // Configure quality thresholds for grove
});

app.get('/api/quality/thresholds/:groveId', async (req, res) => {
  // Get threshold configuration
});

// Federated learning
app.post('/api/quality/federated-learning', async (req, res) => {
  // Configure federated learning participation
});

app.post('/api/quality/contribute', async (req, res) => {
  // Contribute assessment to federated learning
});

app.get('/api/quality/updates', async (req, res) => {
  // Get model updates from network
});

// Overrides
app.post('/api/quality/overrides', async (req, res) => {
  // Override quality score
});

// Analytics
app.get('/api/quality/analytics/:groveId', async (req, res) => {
  // Get quality analytics and trends
});
```

---

## PHASE 4: MIGRATION MAP

### Files to Create

#### Core Infrastructure
```
src/core/quality/
├── schema.ts (types and interfaces)
├── scoring.ts (QualityScoringEngine class)
├── federated-learning.ts (FederatedLearningManager class)
└── thresholds.ts (ThresholdManager class)
```

#### UI Components
```
src/foundation/
├── consoles/
│   └── QualityConsole.tsx
└── components/
    ├── QualityScoreBadge.tsx
    ├── QualityFilterPanel.tsx
    ├── QualityDimensionsBreakdown.tsx
    ├── QualityAnalyticsDashboard.tsx
    ├── QualityThresholdConfig.tsx
    └── QualityOverrideModal.tsx
```

#### Database
```
supabase/migrations/
└── 20260116_create_quality_tables.sql
```

#### API Extensions
```
server.js (extend with quality endpoints)
```

### Execution Order
1. Create core type definitions (schema.ts)
2. Create database migration and run
3. Implement QualityScoringEngine
4. Implement ThresholdManager
5. Extend server.js with quality endpoints
6. Create Quality Console and components
7. Implement FederatedLearningManager
8. Add analytics dashboard
9. Add override system
10. Integration testing

---

## PHASE 5: DEX COMPLIANCE

### Pillar 1: Declarative Sovereignty ✅
**Verification:** Quality thresholds in database, not hardcoded

```typescript
// ✅ CORRECT: Thresholds from database
const thresholds = await db.getQualityThresholds(groveId);
if (content.qualityScore.overallScore >= thresholds.minOverallScore) {
  // Show content
}

// ❌ WRONG: Hardcoded thresholds
if (score >= 70) { // Don't do this
  // Show content
}
```

### Pillar 2: Capability Agnosticism ✅
**Verification:** Works with any AI model

```typescript
// ✅ CORRECT: Model-agnostic scoring
class QualityScoringEngine {
  async calculateQualityScore(
    content: FederationContent,
    model?: any // Optional model parameter
  ): Promise<QualityScore> {
    // Scoring logic independent of model
  }
}
```

### Pillar 3: Provenance as Infrastructure ✅
**Verification:** Full audit trail

```sql
-- Every quality score has provenance
INSERT INTO quality_scores (
  content_id, grove_id, overall_score,
  assessed_by, assessed_at, explanation
) VALUES (..., ..., ..., 'system', NOW(), 'Auto-calculated');

-- Every override is audited
INSERT INTO quality_score_overrides (
  score_id, grove_id, overridden_by,
  old_score, new_score, reason
) VALUES (..., ..., 'operator-123', 65, 80, 'Incorrect assessment');
```

### Pillar 4: Organic Scalability ✅
**Verification:** Add groves without breaking changes

```typescript
// ✅ CORRECT: Additive structure
interface FederationNetwork {
  groves: FederatedGrove[]; // Add groves here
  qualityScores: QualityScore[]; // Scales linearly
  federatedLearning: FederatedLearningParticipation[]; // Additive
}
```

---

## PHASE 6: IMPLEMENTATION STORIES

### Epic 1: Core Quality Engine

**Story 1.1:** Implement QualityScoringEngine
```typescript
// File: src/core/quality/scoring.ts
export class QualityScoringEngine {
  async calculateQualityScore(
    content: FederationContent
  ): Promise<QualityScore> {
    // 1. Calculate accuracy dimension
    const accuracy = await this.assessAccuracy(content);
    // 2. Calculate utility dimension
    const utility = await this.assessUtility(content);
    // 3. Calculate novelty dimension
    const novelty = await this.assessNovelty(content);
    // 4. Calculate provenance dimension
    const provenance = await this.assessProvenance(content);
    // 5. Combine into overall score
    const overallScore = this.combineDimensions({ accuracy, utility, novelty, provenance });
    // 6. Calculate confidence
    const confidence = this.calculateConfidence({ accuracy, utility, novelty, provenance });
    // 7. Return QualityScore
    return {
      id: generateId(),
      contentId: content.id,
      groveId: content.groveId,
      overallScore,
      dimensions: { accuracy, utility, novelty, provenance },
      confidence,
      assessedBy: 'automated',
      assessedAt: new Date().toISOString(),
      explanation: this.generateExplanation({ accuracy, utility, novelty, provenance })
    };
  }
}
```

**Build Gate:**
```bash
npm test -- --testPathPattern=quality/scoring
```

### Epic 2: Threshold System

**Story 2.1:** Implement ThresholdManager
```typescript
// File: src/core/quality/thresholds.ts
export class ThresholdManager {
  async configureThresholds(
    groveId: string,
    thresholds: QualityThresholds
  ): Promise<void> {
    // 1. Validate thresholds (0-100 range)
    this.validateThresholds(thresholds);
    // 2. Save to database
    await db.saveQualityThresholds(groveId, thresholds);
    // 3. Emit event
    eventBus.emit('thresholds:updated', { groveId, thresholds });
  }

  async filterByThresholds(
    content: FederationContent[],
    thresholds: QualityThresholds
  ): Promise<FederationContent[]> {
    return content.filter(item => {
      if (!item.qualityScore) return false;
      return (
        item.qualityScore.overallScore >= thresholds.minOverallScore &&
        item.qualityScore.dimensions.accuracy >= thresholds.minAccuracy &&
        item.qualityScore.dimensions.utility >= thresholds.minUtility &&
        item.qualityScore.dimensions.novelty >= thresholds.minNovelty &&
        item.qualityScore.dimensions.provenance >= thresholds.minProvenance
      );
    });
  }
}
```

**Build Gate:**
```bash
npm test -- --testPathPattern=quality/thresholds
```

### Epic 3: Federated Learning

**Story 3.1:** Implement FederatedLearningManager
```typescript
// File: src/core/quality/federated-learning.ts
export class FederatedLearningManager {
  async contributeAssessment(
    groveId: string,
    assessment: QualityAssessment
  ): Promise<void> {
    // 1. Get federation config
    const config = await db.getFederatedLearningConfig(groveId);
    if (!config.participationEnabled) return;
    // 2. Apply privacy level
    const sanitizedAssessment = this.applyPrivacyLevel(assessment, config.privacyLevel);
    // 3. Submit to federation network
    await federationNetwork.submitAssessment(sanitizedAssessment);
    // 4. Update last update timestamp
    await db.updateLastUpdate(groveId);
  }

  async receiveModelUpdates(): Promise<ModelUpdate[]> {
    // 1. Fetch updates from network
    const updates = await federationNetwork.getUpdates();
    // 2. Apply differential privacy if configured
    return updates.map(update => this.applyDifferentialPrivacy(update));
  }
}
```

**Build Gate:**
```bash
npm test -- --testPathPattern=quality/federated
```

### Epic 4: UI Components

**Story 4.1:** Create QualityConsole
```typescript
// File: src/foundation/consoles/QualityConsole.tsx
export function QualityConsole(): JSX.Element {
  return (
    <ConsoleLayout>
      <ConsoleHeader
        title="Quality Assessment"
        description="Federated quality scoring and analytics"
      />
      <TabGroup>
        <Tab id="scores">Quality Scores</Tab>
        <Tab id="filter">Filter & Threshold</Tab>
        <Tab id="analytics">Analytics</Tab>
        <Tab id="federation">Federated Learning</Tab>
        <Tab id="overrides">Overrides</Tab>
      </TabGroup>
      <TabPanels>
        <TabPanel id="scores">
          <QualityScoreList />
        </TabPanel>
        <TabPanel id="filter">
          <QualityFilterPanel />
        </TabPanel>
        <TabPanel id="analytics">
          <QualityAnalyticsDashboard />
        </TabPanel>
        <TabPanel id="federation">
          <FederatedLearningConfig />
        </TabPanel>
        <TabPanel id="overrides">
          <QualityOverrideHistory />
        </TabPanel>
      </TabPanels>
    </ConsoleLayout>
  );
}
```

**Story 4.2:** Create QualityScoreBadge
```typescript
// File: src/foundation/components/QualityScoreBadge.tsx
interface QualityScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  detailed?: boolean;
}

export function QualityScoreBadge({
  score,
  size = 'md',
  showLabel = true,
  detailed = false
}: QualityScoreBadgeProps): JSX.Element {
  const color = getQualityColor(score);
  const label = getQualityLabel(score);

  return (
    <Badge
      color={color}
      size={size}
      aria-label={`Quality score: ${score} out of 100 (${label})`}
    >
      {showLabel && <span>{label}</span>}
      <span>{score}</span>
      {detailed && (
        <Tooltip content="Multi-dimensional quality score">
          <Icon name="info" />
        </Tooltip>
      )}
    </Badge>
  );
}

function getQualityColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 50) return 'amber';
  return 'red';
}

function getQualityLabel(score: number): string {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}
```

**Build Gate:**
```bash
npm test -- --testPathPattern=components/quality
```

---

## PHASE 7: TESTING STRATEGY

### Unit Tests

**Quality Scoring Tests:**
```typescript
// File: tests/unit/quality/scoring.test.ts
describe('QualityScoringEngine', () => {
  it('should calculate overall score from dimensions', async () => {
    const content = createTestContent();
    const score = await engine.calculateQualityScore(content);
    expect(score.overallScore).toBeGreaterThanOrEqual(0);
    expect(score.overallScore).toBeLessThanOrEqual(100);
    expect(score.dimensions.accuracy).toBeDefined();
    expect(score.dimensions.utility).toBeDefined();
    expect(score.dimensions.novelty).toBeDefined();
    expect(score.dimensions.provenance).toBeDefined();
  });

  it('should generate explanation for score', async () => {
    const score = await engine.calculateQualityScore(testContent);
    expect(score.explanation).toBeDefined();
    expect(score.explanation.length).toBeGreaterThan(10);
  });
});
```

**Threshold Tests:**
```typescript
// File: tests/unit/quality/thresholds.test.ts
describe('ThresholdManager', () => {
  it('should filter content by thresholds', async () => {
    const content = [lowQualityContent, highQualityContent];
    const thresholds = { minOverallScore: 70, enabled: true } as QualityThresholds;
    const filtered = await manager.filterByThresholds(content, thresholds);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].qualityScore.overallScore).toBeGreaterThanOrEqual(70);
  });
});
```

### Integration Tests

**API Tests:**
```typescript
// File: tests/integration/quality-api.test.ts
describe('Quality API', () => {
  it('POST /api/quality/scores should calculate score', async () => {
    const response = await request(app)
      .post('/api/quality/scores')
      .send({ contentId: 'test-123' })
      .expect(200);

    expect(response.body.overallScore).toBeDefined();
    expect(response.body.dimensions).toBeDefined();
  });

  it('GET /api/quality/thresholds/:groveId should return thresholds', async () => {
    const response = await request(app)
      .get('/api/quality/thresholds/grove-123')
      .expect(200);

    expect(response.body.groveId).toBe('grove-123');
    expect(response.body.minOverallScore).toBeDefined();
  });
});
```

### E2E Tests

**Quality Workflow:**
```typescript
// File: tests/e2e/quality-workflow.spec.ts
test('Quality assessment end-to-end', async ({ page }) => {
  // 1. Navigate to quality console
  await page.goto('/foundation/quality');
  // 2. View quality scores
  await expect(page.locator('[data-testid="quality-score"]')).toBeVisible();
  // 3. Filter by threshold
  await page.click('[data-testid="filter-tab"]');
  await page.fill('[data-testid="threshold-slider"]', '80');
  await page.click('[data-testid="apply-filter"]');
  // 4. Verify filtered results
  const scores = await page.locator('[data-testid="quality-score"]').all();
  for (const score of scores) {
    const value = await score.textContent();
    expect(parseInt(value)).toBeGreaterThanOrEqual(80);
  }
});
```

---

## PHASE 8: BUILD GATES

### Gate 1.1: Type Checking
```bash
npm run type-check
```
**Expected:** All TypeScript compilation successful

### Gate 1.2: Unit Tests (Quality Core)
```bash
npm test -- --testPathPattern=quality
```
**Expected:** > 80% coverage, all tests passing

### Gate 1.3: Build Verification
```bash
npm run build
```
**Expected:** Build completes without errors

### Gate 1.4: Integration Tests (Quality API)
```bash
npm run test:integration
```
**Expected:** All quality API endpoints responding

### Gate 1.5: Linting
```bash
npm run lint
```
**Expected:** Linting passes with no errors

### Final Verification Suite
```bash
npm run type-check && \
npm test && \
npm run build && \
npx playwright test && \
npm run lint && \
npm run test:a11y && \
npm audit --audit-level moderate
```

---

## QA GATES

### Gate 1: Pre-Development
- [ ] Baseline tests pass (verify existing functionality not broken)
- [ ] Console clean (zero errors, zero warnings)
- [ ] TypeScript compilation successful
- [ ] Federated learning architecture reviewed
- [ ] Security review completed (privacy, differential privacy)
- [ ] Performance baseline established (Lighthouse score recorded)

### Gate 2: Mid-Sprint (Daily)
- [ ] Phase 1: Quality scoring engine tested
- [ ] Phase 2: UI components tested and accessible
- [ ] Phase 3: Federated learning validated
- [ ] Console audit: Zero errors after each phase
- [ ] Core user journey verified (view score → configure threshold → filter content)
- [ ] Unit test coverage maintained > 80%

### Gate 3: Pre-Merge (Epic Complete)
- [ ] All tests green (unit, integration, E2E)
- [ ] Console audit: ZERO errors, ZERO warnings
- [ ] Error boundary testing complete (quality-specific errors)
- [ ] Network monitoring: All quality API requests successful
- [ ] Full user journey passes (all 8 stories)
- [ ] Performance within thresholds (<100ms score retrieval, <2s analytics load)
- [ ] Security scan: No critical or high vulnerabilities

### Gate 4: Sprint Complete
- [ ] All QA gates passed
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Accessibility audit (WCAG 2.1 AA compliance verified)
- [ ] Visual regression tests pass (zero unexpected diffs)
- [ ] Performance check (Lighthouse > 90, FCP < 1.5s, LCP < 2.5s)
- [ ] Documentation review (API docs, user guide, runbook)
- [ ] Knowledge transfer session completed

---

## ROLLBACK PROCEDURES

### Scenario 1: Federated Learning Failure
```typescript
// 1. Disable federated learning
app.post('/api/quality/federated-learning/*', (req, res) => {
  res.status(503).json({ error: 'Federated learning temporarily disabled' });
});

// 2. Switch to local-only scoring
qualityScoringEngine.useLocalScoring = true;

// 3. Notify participating groves
await notifyGroveOperators('Federated learning disabled, using local scoring');
```
**Recovery Time:** < 2 hours

### Scenario 2: Quality Score Calculation Error
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

### Scenario 3: Privacy Violation
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

## VERIFICATION STEPS

### 1. Quality Score Calculation Verification
```typescript
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

### 2. Threshold Filtering Verification
```typescript
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

### 3. Federated Learning Verification
```typescript
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

### 4. Quality Analytics Verification
```typescript
const analytics = await getAnalytics('grove-123');
expect(analytics.averageScores.overall).toBeDefined();
expect(analytics.trendData).toBeDefined();
expect(analytics.comparisonToNetwork).toBeDefined();
```
**Expected:** Analytics dashboard displays correctly

### 5. UI Component Verification
```bash
npm run dev
# Navigate to /foundation/quality
# Verify all components render and function
```
**Expected:** All UI components render correctly, interactions work

---

## COMPLETION CHECKLIST

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

---

## SUCCESS CRITERIA

- [ ] Quality scoring engine operational (multi-dimensional)
- [ ] Federated learning infrastructure functional
- [ ] Quality analytics dashboard complete
- [ ] Threshold filtering working correctly
- [ ] Manual override system functional
- [ ] < 100ms quality score retrieval
- [ ] All tests passing (unit, integration, E2E)

---

**Contract Version:** 1.0
**Last Updated:** 2026-01-16
**Enforcement:** This contract is binding - all gates must pass before merge

---

## START EXECUTION

To begin implementation:

1. Read this EXECUTION_PROMPT.md completely
2. Run Phase 0: Pattern Check
3. Run Phase 1: Repository Audit
4. Verify Phase 2: Specification matches USER_STORIES.md
5. Implement per Phase 6: Implementation Stories
6. Run Phase 8: Build Gates after each epic
7. Complete QA Gates before merge
8. Document all progress in DEVLOG.md

**Current Phase:** Ready for Developer Execution
**Next Action:** Begin Phase 0 (Pattern Check)

---

**END OF EXECUTION PROMPT**
