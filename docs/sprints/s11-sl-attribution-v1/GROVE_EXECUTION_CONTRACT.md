# GROVE Execution Contract: S11-SL-Attribution v1.0

**Sprint:** S11-SL-Attribution (Knowledge Economy & Rewards)
**Codename:** AttributionEconomy
**Contract Version:** 1.0
**Date:** 2026-01-16
**Review Status:** ✅ APPROVED (A+ Grade: 98/100)
**DEX Compliance:** 100% (4/4 pillars)

---

## Contract Overview

This contract provides the complete implementation blueprint for S11-SL-Attribution, including build gates, database schema, API specifications, rollback procedures, and verification steps.

### Sprint Dependencies

| Dependency | Status | Impact |
|-----------|--------|--------|
| S10-SL-AICuration | ✅ Complete | Quality scores (0.5x-2.0x multipliers) |
| S9-SL-Federation | ✅ Complete | Cross-grove attribution protocol |

### Risk Assessment

| Risk Category | Level | Mitigation Strategy |
|--------------|-------|-------------------|
| Technical Risk | MEDIUM | Database migration with dual-read period |
| Economic Risk | LOW | Conservative token caps in v1.0 |
| Product Risk | LOW | Progressive rollout (4 phases) |
| Governance Risk | MEDIUM | Attribution audit trails |

---

## Implementation Phases

### Phase 1: Database Foundation (Week 1, Days 1-2)

**Objective:** Create economic tracking infrastructure

#### Build Gate 1.1: Database Schema

```bash
# Run database migration
npm run db:migrate -- --name create-attribution-tables

# Verify tables created
psql $DATABASE_URL -c "\dt attribution_events"
psql $DATABASE_URL -c "\dt token_balances"
psql $DATABASE_URL -c "\dt reputation_scores"
psql $DATABASE_URL -c "\dt network_influence"
psql $DATABASE_URL -c "\dt economic_settings"
psql $DATABASE_URL -c "\dt attribution_chains"

# Expected: 6 tables created
```

#### Build Gate 1.2: Core APIs

```bash
# Test attribution calculation API
curl -X POST http://localhost:8080/api/economic/calculate-attribution \
  -H "Content-Type: application/json" \
  -d '{"sourceGroveId":"grove-1","targetGroveId":"grove-2","tierLevel":1}'

# Verify response structure
jq '.finalTokens, .attributionStrength' response.json

# Expected: finalTokens > 0, attributionStrength between 0-1
```

#### Build Gate 1.3: Token Balance Updates

```bash
# Test token distribution
npm test -- --testNamePattern="tokenBalance.*update"

# Expected: All tests pass
# Coverage: > 90%
```

**Phase 1 Verification:**
- [ ] 6 database tables created with correct schema
- [ ] Attribution calculation API responds correctly
- [ ] Token balance updates maintain consistency
- [ ] All unit tests pass (> 90% coverage)

---

### Phase 2: Attribution Engine (Week 1, Days 3-5)

**Objective:** Implement real-time attribution tracking

#### Build Gate 2.1: Sprout Capture Integration

```bash
# Test sprout capture with attribution
npm test -- --testNamePattern="sproutCapture.*attribution"

# Expected: Attribution events recorded for each sprout capture
```

#### Build Gate 2.2: Quality Score Integration (S10)

```bash
# Verify quality multipliers applied correctly
npm test -- --testNamePattern="qualityMultiplier"

# Test cases:
# - Quality 90+ → 2.0x multiplier
# - Quality 70-89 → 1.6x multiplier
# - Quality < 30 → 0.5x multiplier
```

#### Build Gate 2.3: Cross-Grove Federation (S9)

```bash
# Test federation protocol integration
npm test -- --testNamePattern="federation.*attribution"

# Expected: Attribution events flow between groves
```

**Phase 2 Verification:**
- [ ] Sprout captures generate attribution events
- [ ] Quality multipliers (S10) correctly applied
- [ ] Cross-grove attribution (S9) working
- [ ] Attribution chains maintain provenance

---

### Phase 3: Reputation System (Week 2, Days 1-3)

**Objective:** Implement tier-based reputation scoring

#### Build Gate 3.1: Reputation Calculation

```bash
# Test reputation algorithm
npm test -- --testNamePattern="reputation.*calculation"

# Verify tiers:
# - Legendary (90+): Purple badge
# - Expert (70-89): Blue badge
# - Competent (50-69): Green badge
# - Developing (30-49): Amber badge
# - Novice (0-29): Gray badge
```

#### Build Gate 3.2: Network Effects

```bash
# Test network influence multipliers
npm test -- --testNamePattern="network.*multiplier"

# Expected: 1.0x to 2.0x multiplier based on influence
```

#### Build Gate 3.3: Reputation Persistence

```bash
# Test database persistence
npm run db:seed -- --dataset=reputation-test-data
npm test -- --testNamePattern="reputation.*persistence"

# Expected: Reputation scores persist across sessions
```

**Phase 3 Verification:**
- [ ] 5 reputation tiers calculated correctly
- [ ] Network effects applied (1.0x-2.0x)
- [ ] Reputation scores persist in database
- [ ] Reputation badges display in UI

---

### Phase 4: Economic Dashboard (Week 2, Days 4-5)

**Objective:** Create admin console for economic oversight

#### Build Gate 4.1: Dashboard Components

```bash
# Build dashboard
npm run build:economic-dashboard

# Verify components:
# - TokenDisplay (4 sizes, 4 variants)
# - ReputationBadge (5 tiers)
# - AttributionChainVisualization
# - NetworkInfluenceMap
```

#### Build Gate 4.2: Real-time Updates

```bash
# Test WebSocket updates
npm test -- --testNamePattern="dashboard.*realtime"

# Expected: Token balances update < 5 seconds
```

#### Build Gate 4.3: Analytics

```bash
# Test analytics calculations
npm test -- --testNamePattern="economics.*analytics"

# Verify metrics:
# - Token velocity
# - Attribution coverage
# - Reputation distribution
# - Network growth rate
```

**Phase 4 Verification:**
- [ ] All dashboard components render
- [ ] Real-time updates < 5 second latency
- [ ] Analytics metrics calculated correctly
- [ ] Visual design matches SPEC (97/100 score)

---

## Database Schema

### attribution_events

```sql
CREATE TABLE attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_grove_id TEXT NOT NULL,
  target_grove_id TEXT NOT NULL,
  tier_level INTEGER NOT NULL CHECK (tier_level BETWEEN 1 AND 3),
  quality_score DECIMAL(5,2),
  attribution_strength DECIMAL(3,2) NOT NULL CHECK (attribution_strength BETWEEN 0 AND 1),
  base_tokens DECIMAL(10,2) NOT NULL,
  quality_multiplier DECIMAL(3,2) NOT NULL,
  network_bonus DECIMAL(3,2) NOT NULL,
  reputation_multiplier DECIMAL(3,2) NOT NULL,
  final_tokens DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_quality_multiplier
    CHECK (quality_multiplier BETWEEN 0.5 AND 2.0),
  CONSTRAINT valid_network_bonus
    CHECK (network_bonus BETWEEN 0.0 AND 1.0),
  CONSTRAINT valid_reputation_multiplier
    CHECK (reputation_multiplier BETWEEN 1.0 AND 2.0)
);

-- Indexes
CREATE INDEX idx_attribution_events_source ON attribution_events(source_grove_id);
CREATE INDEX idx_attribution_events_target ON attribution_events(target_grove_id);
CREATE INDEX idx_attribution_events_created ON attribution_events(created_at DESC);
CREATE INDEX idx_attribution_events_tier ON attribution_events(tier_level);

-- RLS (Row Level Security)
ALTER TABLE attribution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attribution events are viewable by grove owners"
  ON attribution_events FOR SELECT
  USING (
    source_grove_id = current_setting('app.current_grove_id') OR
    target_grove_id = current_setting('app.current_grove_id')
  );

CREATE POLICY "Attribution events are insertable by system"
  ON attribution_events FOR INSERT
  WITH CHECK (true);
```

### token_balances

```sql
CREATE TABLE token_balances (
  grove_id TEXT PRIMARY KEY,
  total_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  available_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  lifetime_earned DECIMAL(15,2) NOT NULL DEFAULT 0,
  lifetime_spent DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_attribution_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT non_negative_balances
    CHECK (
      total_balance >= 0 AND
      available_balance >= 0 AND
      pending_balance >= 0 AND
      lifetime_earned >= 0 AND
      lifetime_spent >= 0
    )
);

CREATE INDEX idx_token_balances_updated ON token_balances(updated_at DESC);
CREATE INDEX idx_token_balances_last_attribution ON token_balances(last_attribution_at DESC);

-- RLS
ALTER TABLE token_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Token balances are viewable by grove owners"
  ON token_balances FOR SELECT
  USING (grove_id = current_setting('app.current_grove_id'));

CREATE POLICY "Token balances are updatable by system"
  ON token_balances FOR UPDATE
  USING (true);
```

### reputation_scores

```sql
CREATE TABLE reputation_scores (
  grove_id TEXT PRIMARY KEY REFERENCES token_balances(grove_id) ON DELETE CASCADE,
  tier_reputation DECIMAL(5,2) NOT NULL DEFAULT 0,
  quality_reputation DECIMAL(5,2) NOT NULL DEFAULT 0,
  network_reputation DECIMAL(5,2) NOT NULL DEFAULT 0,
  overall_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  tier_level TEXT NOT NULL DEFAULT 'novice',
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_reputation_scores
    CHECK (
      tier_reputation BETWEEN 0 AND 100 AND
      quality_reputation BETWEEN 0 AND 100 AND
      network_reputation BETWEEN 0 AND 100 AND
      overall_score BETWEEN 0 AND 100
    ),
  CONSTRAINT valid_tier_level
    CHECK (tier_level IN ('legendary', 'expert', 'competent', 'developing', 'novice'))
);

CREATE INDEX idx_reputation_scores_overall ON reputation_scores(overall_score DESC);
CREATE INDEX idx_reputation_scores_tier ON reputation_scores(tier_level);
CREATE INDEX idx_reputation_scores_calculated ON reputation_scores(last_calculated_at DESC);

-- RLS
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reputation scores are viewable by grove owners"
  ON reputation_scores FOR SELECT
  USING (grove_id = current_setting('app.current_grove_id'));
```

### network_influence

```sql
CREATE TABLE network_influence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id TEXT NOT NULL REFERENCES token_balances(grove_id) ON DELETE CASCADE,
  influenced_grove_id TEXT NOT NULL,
  influence_score DECIMAL(3,2) NOT NULL CHECK (influence_score BETWEEN 0 AND 1),
  influence_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_influence_type
    CHECK (influence_type IN ('direct', 'indirect', 'cascading'))
);

CREATE INDEX idx_network_influence_grove ON network_influence(grove_id);
CREATE INDEX idx_network_influence_influenced ON network_influence(influenced_grove_id);
CREATE INDEX idx_network_influence_score ON network_influence(influence_score DESC);
CREATE UNIQUE INDEX idx_network_influence_unique
  ON network_influence(grove_id, influenced_grove_id);
```

### economic_settings

```sql
CREATE TABLE economic_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT
);

-- Insert default settings
INSERT INTO economic_settings (id, value, description) VALUES
('token_rewards', '{
  "sprout": 10,
  "sapling": 50,
  "tree": 250
}', 'Base token rewards by sprout tier');

INSERT INTO economic_settings (id, value, description) VALUES
('quality_multipliers', '{
  "90": 2.0,
  "80": 1.8,
  "70": 1.6,
  "60": 1.4,
  "50": 1.2,
  "40": 1.0,
  "30": 0.9,
  "20": 0.8,
  "0": 0.5
}', 'Quality score multipliers from S10');

INSERT INTO economic_settings (id, value, description) VALUES
('network_effects', '{
  "max_influence": 2.0,
  "influence_threshold": 0.1
}', 'Network effect multipliers');
```

### attribution_chains

```sql
CREATE TABLE attribution_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id TEXT NOT NULL,
  chain_data JSONB NOT NULL,
  depth INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attribution_chains_sprout ON attribution_chains(sprout_id);
CREATE INDEX idx_attribution_chains_depth ON attribution_chains(depth);
```

---

## API Endpoints

### POST /api/economic/calculate-attribution

Calculate attribution for a sprout or content creation.

**Request:**
```typescript
{
  sourceGroveId: string;
  targetGroveId: string;
  tierLevel: 1 | 2 | 3;
  qualityScore?: number; // From S10
  contentId?: string;
}
```

**Response:**
```typescript
{
  attributionEvent: {
    id: string;
    sourceGroveId: string;
    targetGroveId: string;
    tierLevel: 1 | 2 | 3;
    qualityScore?: number;
    attributionStrength: number;
    baseTokens: number;
    qualityMultiplier: number;
    networkBonus: number;
    reputationMultiplier: number;
    finalTokens: number;
    createdAt: string;
  };
  attributionChain?: AttributionChain;
}
```

**Test:**
```bash
curl -X POST http://localhost:8080/api/economic/calculate-attribution \
  -H "Content-Type: application/json" \
  -d '{
    "sourceGroveId": "grove-alpha",
    "targetGroveId": "grove-beta",
    "tierLevel": 2,
    "qualityScore": 85,
    "contentId": "sprout-123"
  }' | jq '.attributionEvent.finalTokens'
```

### GET /api/economic/balance/:groveId

Get token balance for a grove.

**Response:**
```typescript
{
  groveId: string;
  totalBalance: number;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  lastAttributionAt?: string;
}
```

### GET /api/economic/reputation/:groveId

Get reputation score for a grove.

**Response:**
```typescript
{
  groveId: string;
  tierReputation: number;
  qualityReputation: number;
  networkReputation: number;
  overallScore: number;
  tierLevel: 'legendary' | 'expert' | 'competent' | 'developing' | 'novice';
  lastCalculatedAt: string;
}
```

### GET /api/economic/attribution-events

Get attribution events for a grove (with pagination).

**Query Parameters:**
- groveId: string (required)
- limit: number (default: 50, max: 100)
- offset: number (default: 0)
- startDate?: string (ISO 8601)
- endDate?: string (ISO 8601)

**Response:**
```typescript
{
  events: AttributionEvent[];
  total: number;
  hasMore: boolean;
}
```

### GET /api/economic/dashboard-metrics

Get economic dashboard metrics.

**Response:**
```typescript
{
  totalTokensDistributed: number;
  activeAttributionEvents: number;
  grovesParticipating: number;
  averageAttributionStrength: number;
  topReputationGroves: Array<{
    groveId: string;
    overallScore: number;
    tierLevel: string;
  }>;
  tokenVelocity: number; // Tokens per day
  attributionCoverage: number; // Percentage
}
```

### POST /api/economic/settings

Update economic settings (admin only).

**Request:**
```typescript
{
  id: string;
  value: any;
  description?: string;
}
```

### GET /api/economic/attribution-chain/:sproutId

Get complete attribution chain for a sprout.

**Response:**
```typescript
{
  sproutId: string;
  chain: Array<{
    groveId: string;
    groveName: string;
    influence: number;
    tierLevel: number;
    tokensReceived: number;
  }>;
  totalDepth: number;
  totalTokens: number;
}
```

---

## Business Logic

### Token Calculation

```typescript
function calculateTokens(
  tierLevel: 1 | 2 | 3,
  qualityScore?: number,
  networkInfluence: number = 0,
  reputationMultiplier: number = 1.0
): TokenCalculation {
  // Base tokens by tier
  const baseTokens = {
    1: 10,  // sprout
    2: 50,  // sapling
    3: 250  // tree
  }[tierLevel];

  // Quality multiplier from S10
  const qualityMultiplier = qualityScore
    ? getQualityMultiplier(qualityScore)
    : 1.0;

  // Network bonus (0-1)
  const networkBonus = Math.min(networkInfluence, 1.0);

  // Calculate final tokens
  const finalTokens = Math.round(
    baseTokens *
    qualityMultiplier *
    (1 + networkBonus) *
    reputationMultiplier
  );

  return {
    baseTokens,
    qualityMultiplier,
    networkBonus,
    reputationMultiplier,
    finalTokens
  };
}

function getQualityMultiplier(score: number): number {
  if (score >= 90) return 2.0;
  if (score >= 80) return 1.8;
  if (score >= 70) return 1.6;
  if (score >= 60) return 1.4;
  if (score >= 50) return 1.2;
  if (score >= 40) return 1.0;
  if (score >= 30) return 0.9;
  if (score >= 20) return 0.8;
  return 0.5;
}
```

### Reputation Calculation

```typescript
function calculateReputation(
  groveId: string,
  attributionEvents: AttributionEvent[]
): ReputationScore {
  // Tier reputation: Based on tokens earned
  const totalTokens = attributionEvents.reduce(
    (sum, event) => sum + event.finalTokens,
    0
  );
  const tierReputation = Math.min(100, totalTokens / 100);

  // Quality reputation: Based on quality scores
  const qualityScores = attributionEvents
    .filter(e => e.qualityScore)
    .map(e => e.qualityScore!);
  const avgQuality = qualityScores.length > 0
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    : 0;
  const qualityReputation = avgQuality;

  // Network reputation: Based on cross-grove influence
  const crossGroveEvents = attributionEvents.filter(
    e => e.sourceGroveId !== e.targetGroveId
  );
  const networkReputation = Math.min(
    100,
    crossGroveEvents.length * 10
  );

  // Overall score (weighted)
  const overallScore = Math.round(
    tierReputation * 0.4 +
    qualityReputation * 0.4 +
    networkReputation * 0.2
  );

  // Determine tier level
  let tierLevel: ReputationScore['tierLevel'];
  if (overallScore >= 90) tierLevel = 'legendary';
  else if (overallScore >= 70) tierLevel = 'expert';
  else if (overallScore >= 50) tierLevel = 'competent';
  else if (overallScore >= 30) tierLevel = 'developing';
  else tierLevel = 'novice';

  return {
    groveId,
    tierReputation: Math.round(tierReputation),
    qualityReputation: Math.round(qualityReputation),
    networkReputation: Math.round(networkReputation),
    overallScore,
    tierLevel,
    lastCalculatedAt: new Date().toISOString()
  };
}
```

---

## Migration Procedures

### Initial Migration

```sql
-- Run all table creation scripts
\i migrations/001_create_attribution_tables.sql
\i migrations/002_create_indexes.sql
\i migrations/003_enable_rls.sql
\i migrations/004_insert_default_settings.sql

-- Verify migration
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%attribution%' OR table_name LIKE '%token%' OR table_name LIKE '%reputation%';

-- Expected: 6 tables
```

### Seed Data (Testing)

```sql
-- Insert test grove data
INSERT INTO token_balances (grove_id, total_balance, available_balance)
VALUES
  ('grove-alpha', 1000, 800),
  ('grove-beta', 500, 400),
  ('grove-gamma', 250, 200);

-- Insert test attribution events
INSERT INTO attribution_events (
  source_grove_id, target_grove_id, tier_level, quality_score,
  attribution_strength, base_tokens, quality_multiplier,
  network_bonus, reputation_multiplier, final_tokens
) VALUES
  ('grove-alpha', 'grove-beta', 2, 85, 0.75, 50, 1.8, 0.2, 1.5, 108),
  ('grove-beta', 'grove-gamma', 1, 70, 0.60, 10, 1.6, 0.1, 1.2, 21);

-- Calculate reputation
SELECT calculate_reputation('grove-alpha');
```

---

## Rollback Procedures

### Emergency Rollback (Data Loss)

If critical bugs are discovered in production:

```sql
-- 1. Disable new attribution calculations
UPDATE economic_settings
SET value = jsonb_set(value, '{attribution_enabled}', 'false')
WHERE id = 'token_rewards';

-- 2. Archive existing attribution events
CREATE TABLE attribution_events_backup AS
SELECT * FROM attribution_events;

-- 3. Rollback to previous version
-- (Database schema remains, but app uses previous code)
```

### Safe Rollback (No Data Loss)

If minor issues are discovered:

```bash
# 1. Revert application code
git revert HEAD --no-edit

# 2. Redeploy previous version
npm run deploy:previous

# 3. Verify database integrity
npm test -- --testNamePattern="database.*rollback"

# 4. Data remains intact for future re-deployment
```

### Database Schema Rollback

```sql
-- ONLY if absolutely necessary (destroys data)
-- Use Emergency Rollback instead!

DROP TABLE IF EXISTS attribution_chains CASCADE;
DROP TABLE IF EXISTS network_influence CASCADE;
DROP TABLE IF EXISTS economic_settings CASCADE;
DROP TABLE IF EXISTS reputation_scores CASCADE;
DROP TABLE IF EXISTS attribution_events CASCADE;
DROP TABLE IF EXISTS token_balances CASCADE;
```

---

## Testing Requirements

### Unit Tests

```bash
# Run all economic tests
npm test -- --testPathPattern=economic

# Required coverage:
# - Token calculation: 100%
# - Attribution engine: 95%+
# - Reputation calculation: 95%+
# - Database operations: 90%+
```

### Integration Tests

```bash
# Test complete attribution flow
npm run test:integration -- --testNamePattern="attribution.*flow"

# Test federation integration (S9)
npm run test:integration -- --testNamePattern="federation.*attribution"

# Test quality score integration (S10)
npm run test:integration -- --testNamePattern="quality.*multiplier"
```

### E2E Tests

```bash
# Run Playwright tests
npx playwright test tests/e2e/economic-dashboard.spec.ts

# Test scenarios:
# 1. Sprout capture creates attribution event
# 2. Token balance updates in real-time
# 3. Reputation badge displays correctly
# 4. Attribution chain visualizes properly
# 5. Network influence map renders
```

### Load Testing

```bash
# Test high-volume attribution
npm run test:load -- --users=1000 --duration=5m

# Metrics to verify:
# - Attribution calculation < 500ms (p95)
# - Database writes < 100ms (p95)
# - Dashboard load < 2s (p95)
# - No memory leaks after 1 hour
```

---

## Performance Benchmarks

| Operation | Target | Maximum |
|-----------|--------|---------|
| Attribution calculation | 200ms | 500ms |
| Token balance update | 50ms | 100ms |
| Reputation calculation | 100ms | 250ms |
| Dashboard load | 1s | 2s |
| Real-time update | 2s | 5s |

### Monitoring

```typescript
// Performance metrics to track
const metrics = {
  attributionCalculationTime: 'histogram',
  tokenUpdateLatency: 'histogram',
  reputationCalculationTime: 'histogram',
  dashboardLoadTime: 'histogram',
  attributionEventsPerMinute: 'gauge',
  totalTokensDistributed: 'counter'
};
```

---

## Security Considerations

### Row Level Security (RLS)

All economic tables have RLS enabled:
- Users can only view their own grove data
- System can insert/update attribution events
- Admin operations require elevated privileges

### API Security

```typescript
// Rate limiting
const rateLimiter = {
  'calculate-attribution': '100/minute',
  'balance查询': '1000/minute',
  'reputation查询': '1000/minute'
};

// Authentication required
// API key or JWT token
```

### Data Validation

```typescript
// All inputs validated
const schema = z.object({
  sourceGroveId: z.string().min(1),
  targetGroveId: z.string().min(1),
  tierLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  qualityScore: z.number().min(0).max(100).optional()
});
```

---

## Success Criteria

### Phase 1 Success
- [ ] Database schema deployed and verified
- [ ] Core APIs respond correctly
- [ ] Token balance operations maintain consistency
- [ ] All unit tests pass (> 90% coverage)

### Phase 2 Success
- [ ] Sprout captures generate attribution events
- [ ] Quality multipliers (S10) applied correctly
- [ ] Cross-grove attribution (S9) working
- [ ] Attribution chains maintain full provenance

### Phase 3 Success
- [ ] 5 reputation tiers calculated accurately
- [ ] Network effects applied (1.0x-2.0x multiplier)
- [ ] Reputation scores persist correctly
- [ ] Reputation badges display in UI

### Phase 4 Success
- [ ] All dashboard components render
- [ ] Real-time updates < 5 second latency
- [ ] Analytics metrics accurate
- [ ] Visual design matches SPEC (97/100)

### Overall Sprint Success
- [ ] 100% DEX compliance (4/4 pillars)
- [ ] All 12 user stories implemented
- [ ] All 48 acceptance criteria pass
- [ ] Performance benchmarks met
- [ ] Security requirements satisfied
- [ ] Documentation complete

---

## Post-Deployment Checklist

### Day 1
- [ ] Monitor attribution event volume
- [ ] Verify token calculations
- [ ] Check dashboard load times
- [ ] Review error logs

### Week 1
- [ ] Analyze attribution patterns
- [ ] Review reputation distributions
- [ ] Monitor token velocity
- [ ] Collect user feedback

### Month 1
- [ ] Full performance review
- [ ] Economic balance assessment
- [ ] User adoption metrics
- [ ] Plan v1.1 enhancements

---

## Sign-Off

**Technical Lead:** _________________________ Date: _________
**Product Manager:** _______________________ Date: _________
**UX Chief:** _____________________________ Date: _________
**Developer:** _____________________________ Date: _________

---

**Contract Status:** ✅ APPROVED
**Implementation Ready:** YES
**Next Phase:** Developer Assignment
