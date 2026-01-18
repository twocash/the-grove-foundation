# Developer Execution Prompt: S11-SL-Attribution v1.0

**Sprint**: S11-SL-Attribution (Knowledge Economy & Rewards)
**Codename**: AttributionEconomy
**Status**: 🎯 ready
**Implementation Duration**: 2 weeks (10 business days)
**Grade**: A+ (98/100)
**DEX Compliance**: 100% (4/4 pillars)

---

## Role & Responsibilities

You are implementing S11-SL-Attribution, completing the Observable Knowledge epic by adding the economic layer to Grove's knowledge ecosystem. This creates the world's first decentralized knowledge economy with transparent attribution, token rewards, and reputation system.

### Your Mission
1. Implement 4-phase build per GROVE_EXECUTION_CONTRACT.md
2. Achieve 100% DEX compliance (4/4 pillars)
3. Pass all 48 acceptance criteria (12 user stories)
4. Maintain 90%+ test coverage
5. Meet all performance benchmarks

### Dependencies
- **S10-SL-AICuration** ✅ Complete - Provides quality scores (0.5x-2.0x multipliers)
- **S9-SL-Federation** ✅ Complete - Provides cross-grove protocol

---

## Project Context

### Sprint Overview
S11 implements the economic incentives that drive the knowledge ecosystem:
- **Token Rewards**: Users earn tokens for contributions (sprout=10, sapling=50, tree=250)
- **Quality Multipliers**: From S10 quality scores (0.5x to 2.0x)
- **Network Effects**: Cross-grove influence adds 1.0x to 2.0x multiplier
- **Reputation System**: 5 tiers (Novice → Legendary) with gradient badges
- **Economic Dashboard**: Real-time admin oversight

### What You'll Build
- 6 database tables with RLS
- 8 API endpoints
- 12 UI components
- Real-time attribution tracking
- Admin console dashboard

---

## Implementation Phases

### Phase 1: Database Foundation (Week 1, Days 1-2)

**Objective**: Create economic tracking infrastructure

#### Step 1.1: Database Migration

Create migration script: `migrations/20260116_create_attribution_tables.sql`

```sql
-- Create attribution_events table
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attribution_events_source ON attribution_events(source_grove_id);
CREATE INDEX idx_attribution_events_target ON attribution_events(target_grove_id);
CREATE INDEX idx_attribution_events_created ON attribution_events(created_at DESC);

-- RLS
ALTER TABLE attribution_events ENABLE ROW LEVEL SECURITY;
```

**Run Migration:**
```bash
npm run db:migrate -- --name create-attribution-tables
```

#### Step 1.2: Create All Tables

Based on GROVE_EXECUTION_CONTRACT.md schema, create:
1. `attribution_events` - Records every economic event
2. `token_balances` - Grove token holdings
3. `reputation_scores` - Tier-based reputation
4. `network_influence` - Cross-grove relationships
5. `economic_settings` - Configurable parameters
6. `attribution_chains` - Provenance trails

#### Step 1.3: Core API - Token Calculation

Create: `server/routes/economic.js`

```javascript
// POST /api/economic/calculate-attribution
router.post('/calculate-attribution', async (req, res) => {
  const { sourceGroveId, targetGroveId, tierLevel, qualityScore } = req.body;

  // Calculate tokens
  const baseTokens = { 1: 10, 2: 50, 3: 250 }[tierLevel];
  const qualityMultiplier = getQualityMultiplier(qualityScore || 0);
  const networkBonus = 0.2; // TODO: Calculate from network influence
  const reputationMultiplier = 1.5; // TODO: Get from reputation scores

  const finalTokens = Math.round(
    baseTokens * qualityMultiplier * (1 + networkBonus) * reputationMultiplier
  );

  // Save to database
  const attributionEvent = await db.attribution_events.create({
    source_grove_id: sourceGroveId,
    target_grove_id: targetGroveId,
    tier_level: tierLevel,
    quality_score: qualityScore,
    attribution_strength: 0.75, // TODO: Calculate
    base_tokens: baseTokens,
    quality_multiplier: qualityMultiplier,
    network_bonus: networkBonus,
    reputation_multiplier: reputationMultiplier,
    final_tokens: finalTokens
  });

  res.json({ attributionEvent });
});

function getQualityMultiplier(score) {
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

#### Build Gate 1 Verification

```bash
# Verify tables
psql $DATABASE_URL -c "\dt attribution_events"

# Test API
curl -X POST http://localhost:8080/api/economic/calculate-attribution \
  -H "Content-Type: application/json" \
  -d '{"sourceGroveId":"grove-1","targetGroveId":"grove-2","tierLevel":1}'

# Run tests
npm test -- --testNamePattern="tokenBalance.*update"
```

**Phase 1 Complete Criteria:**
- [ ] 6 database tables created
- [ ] Attribution calculation API working
- [ ] All unit tests pass (> 90% coverage)

---

### Phase 2: Attribution Engine (Week 1, Days 3-5)

**Objective**: Implement real-time attribution tracking

#### Step 2.1: Integrate with Sprout Capture

Modify: `hooks/useSproutCapture.ts`

```typescript
export function useSproutCapture() {
  const captureSprout = async (sproutData: SproutCaptureData) => {
    // Existing capture logic...

    // NEW: Calculate attribution
    await calculateAttribution({
      sourceGroveId: sproutData.groveId,
      targetGroveId: sproutData.targetGroveId, // May be same for self-contributions
      tierLevel: sproutData.tierLevel,
      qualityScore: sproutData.qualityScore,
      contentId: sproutData.id
    });

    // Return sprout with attribution info
    return { ...sproutData, attributionCalculated: true };
  };

  return { captureSprout };
}

async function calculateAttribution(params: AttributionParams) {
  const response = await fetch('/api/economic/calculate-attribution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  return response.json();
}
```

#### Step 2.2: Quality Score Integration (S10)

Create: `services/qualityService.js`

```javascript
class QualityService {
  async getQualityScore(contentId) {
    // Call S10 API
    const response = await fetch(`${S10_API_BASE}/api/quality/score/${contentId}`);
    return response.json();
  }

  applyQualityMultiplier(baseTokens, qualityScore) {
    const multiplier = getQualityMultiplier(qualityScore);
    return Math.round(baseTokens * multiplier);
  }
}

module.exports = new QualityService();
```

#### Step 2.3: Attribution Chain Generation

Create: `services/attributionChain.js`

```javascript
class AttributionChainService {
  async buildChain(sproutId) {
    // Get initial attribution event
    const initialEvent = await db.attribution_events.findOne({
      where: { contentId: sproutId }
    });

    // Build chain backwards
    const chain = [initialEvent];
    let currentEvent = initialEvent;

    while (currentEvent.source_grove_id !== currentEvent.target_grove_id) {
      const previousEvent = await db.attribution_events.findOne({
        where: { contentId: currentEvent.source_grove_id }
      });

      if (!previousEvent) break;
      chain.unshift(previousEvent);
      currentEvent = previousEvent;
    }

    return {
      sproutId,
      chain,
      depth: chain.length,
      totalTokens: chain.reduce((sum, e) => sum + e.final_tokens, 0)
    };
  }
}

module.exports = new AttributionChainService();
```

#### Build Gate 2 Verification

```bash
# Test sprout capture integration
npm test -- --testNamePattern="sproutCapture.*attribution"

# Test quality multipliers
npm test -- --testNamePattern="qualityMultiplier"

# Expected: Attribution events recorded, quality applied
```

**Phase 2 Complete Criteria:**
- [ ] Sprout captures generate attribution events
- [ ] Quality multipliers (S10) applied
- [ ] Attribution chains maintain provenance

---

### Phase 3: Reputation System (Week 2, Days 1-3)

**Objective**: Implement tier-based reputation scoring

#### Step 3.1: Reputation Calculation Engine

Create: `services/reputationService.js`

```javascript
class ReputationService {
  async calculateReputation(groveId) {
    const attributionEvents = await db.attribution_events.findAll({
      where: { target_grove_id: groveId }
    });

    // Tier reputation (40%): Based on tokens earned
    const totalTokens = attributionEvents.reduce(
      (sum, event) => sum + event.final_tokens, 0
    );
    const tierReputation = Math.min(100, totalTokens / 100);

    // Quality reputation (40%): Based on quality scores
    const qualityScores = attributionEvents
      .filter(e => e.quality_score)
      .map(e => e.quality_score);
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
      : 0;

    // Network reputation (20%): Cross-grove influence
    const crossGroveEvents = attributionEvents.filter(
      e => e.source_grove_id !== e.target_grove_id
    );
    const networkReputation = Math.min(100, crossGroveEvents.length * 10);

    // Overall score
    const overallScore = Math.round(
      tierReputation * 0.4 +
      avgQuality * 0.4 +
      networkReputation * 0.2
    );

    // Determine tier
    let tierLevel;
    if (overallScore >= 90) tierLevel = 'legendary';
    else if (overallScore >= 70) tierLevel = 'expert';
    else if (overallScore >= 50) tierLevel = 'competent';
    else if (overallScore >= 30) tierLevel = 'developing';
    else tierLevel = 'novice';

    // Save to database
    await db.reputation_scores.upsert({
      grove_id: groveId,
      tier_reputation: Math.round(tierReputation),
      quality_reputation: Math.round(avgQuality),
      network_reputation: Math.round(networkReputation),
      overall_score: overallScore,
      tier_level: tierLevel,
      last_calculated_at: new Date()
    });

    return {
      groveId,
      tierReputation: Math.round(tierReputation),
      qualityReputation: Math.round(avgQuality),
      networkReputation: Math.round(networkReputation),
      overallScore,
      tierLevel
    };
  }

  getTierColor(tierLevel) {
    const colors = {
      legendary: 'purple',
      expert: 'blue',
      competent: 'green',
      developing: 'amber',
      novice: 'gray'
    };
    return colors[tierLevel];
  }
}

module.exports = new ReputationService();
```

#### Step 3.2: Reputation Badge Component

Create: `components/ReputationBadge.jsx`

```jsx
import React from 'react';
import { Badge } from '@/components/ui/Badge';

export function ReputationBadge({ groveId, size = 'md', showScore = true }) {
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/economic/reputation/${groveId}`)
      .then(res => res.json())
      .then(data => {
        setReputation(data);
        setLoading(false);
      });
  }, [groveId]);

  if (loading) return <Badge variant="gray">Loading...</Badge>;
  if (!reputation) return <Badge variant="gray">No reputation</Badge>;

  const { tierLevel, overallScore } = reputation;
  const color = getTierColor(tierLevel);

  return (
    <Badge
      variant={color}
      size={size}
      className={`reputation-badge reputation-badge--${tierLevel}`}
    >
      {getTierIcon(tierLevel)}
      {showScore && <span className="ml-1">{overallScore}</span>}
    </Badge>
  );
}

function getTierColor(tier) {
  const colors = {
    legendary: 'purple',
    expert: 'blue',
    competent: 'green',
    developing: 'amber',
    novice: 'gray'
  };
  return colors[tier] || 'gray';
}

function getTierIcon(tier) {
  const icons = {
    legendary: '👑',
    expert: '⭐',
    competent: '✓',
    developing: '🌱',
    novice: '○'
  };
  return icons[tier] || '○';
}
```

#### Build Gate 3 Verification

```bash
# Test reputation calculation
npm test -- --testNamePattern="reputation.*calculation"

# Verify tiers:
# - Legendary (90+): Purple badge
# - Expert (70-89): Blue badge
# - Competent (50-69): Green badge
# - Developing (30-49): Amber badge
# - Novice (0-29): Gray badge
```

**Phase 3 Complete Criteria:**
- [ ] 5 reputation tiers calculated correctly
- [ ] Reputation badges display in UI
- [ ] Reputation scores persist in database

---

### Phase 4: Economic Dashboard (Week 2, Days 4-5)

**Objective**: Create admin console for economic oversight

#### Step 4.1: Economic Dashboard Page

Create: `src/foundation/consoles/EconomicDashboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Grid, Card, Title, Metric } from '@/components/ui';
import { TokenDisplay } from '@/components/economic/TokenDisplay';
import { ReputationBadge } from '@/components/economic/ReputationBadge';
import { AttributionChainViz } from '@/components/economic/AttributionChainViz';
import { NetworkInfluenceMap } from '@/components/economic/NetworkInfluenceMap';

export function EconomicDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/economic/dashboard-metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading economic dashboard...</div>;

  return (
    <div className="economic-dashboard">
      <Title level={1}>Economic Dashboard</Title>

      {/* Key Metrics Grid */}
      <Grid cols={4} gap="md" className="metrics-grid">
        <Card>
          <Metric
            label="Total Tokens Distributed"
            value={metrics.totalTokensDistributed}
            format="number"
          />
        </Card>
        <Card>
          <Metric
            label="Active Attribution Events"
            value={metrics.activeAttributionEvents}
            format="number"
          />
        </Card>
        <Card>
          <Metric
            label="Groves Participating"
            value={metrics.grovesParticipating}
            format="number"
          />
        </Card>
        <Card>
          <Metric
            label="Token Velocity"
            value={metrics.tokenVelocity}
            format="number"
            suffix="tokens/day"
          />
        </Card>
      </Grid>

      {/* Token Balance Display */}
      <Section title="Top Groves by Token Balance">
        <div className="token-leaderboard">
          {metrics.topTokenGroves.map(grove => (
            <div key={grove.groveId} className="leaderboard-item">
              <TokenDisplay
                amount={grove.totalBalance}
                variant="balance"
                size="lg"
              />
              <ReputationBadge groveId={grove.groveId} />
            </div>
          ))}
        </div>
      </Section>

      {/* Attribution Chain Visualization */}
      <Section title="Recent Attribution Chains">
        <AttributionChainViz
          chains={metrics.recentAttributionChains}
          height={400}
        />
      </Section>

      {/* Network Influence Map */}
      <Section title="Network Influence">
        <NetworkInfluenceMap
          nodes={metrics.networkNodes}
          edges={metrics.networkEdges}
          height={500}
        />
      </Section>
    </div>
  );
}
```

#### Step 4.2: Real-time Updates (WebSocket)

Create: `services/economicWebSocket.js`

```javascript
class EconomicWebSocket {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:8080/economic');

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Notify listeners based on event type
      const listeners = this.listeners.get(data.type) || [];
      listeners.forEach(callback => callback(data.payload));

      // Generic 'update' listener
      const genericListeners = this.listeners.get('update') || [];
      genericListeners.forEach(callback => callback(data));
    };
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  // Event types:
  // - 'attribution:new'
  // - 'balance:update'
  // - 'reputation:change'
  // - 'metrics:update'
}

module.exports = new EconomicWebSocket();
```

#### Step 4.3: Dashboard Metrics API

Extend: `server/routes/economic.js`

```javascript
// GET /api/economic/dashboard-metrics
router.get('/dashboard-metrics', async (req, res) => {
  const [
    totalTokens,
    activeEvents,
    groves,
    topGroves,
    recentChains,
    networkData
  ] = await Promise.all([
    db.attribution_events.sum('final_tokens'),
    db.attribution_events.count({
      where: {
        created_at: {
          [db.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    db.token_balances.count(),
    getTopTokenGroves(),
    getRecentAttributionChains(),
    getNetworkInfluenceData()
  ]);

  res.json({
    totalTokensDistributed: totalTokens || 0,
    activeAttributionEvents: activeEvents || 0,
    grovesParticipating: groves || 0,
    tokenVelocity: Math.round((totalTokens || 0) / 30), // Per day
    attributionCoverage: 95, // TODO: Calculate
    topTokenGroves: topGroves,
    recentAttributionChains: recentChains,
    networkNodes: networkData.nodes,
    networkEdges: networkData.edges
  });
});

async function getTopTokenGroves() {
  return db.token_balances.findAll({
    order: [['total_balance', 'DESC']],
    limit: 10,
    attributes: ['grove_id', 'total_balance']
  });
}
```

#### Build Gate 4 Verification

```bash
# Build dashboard
npm run build:economic-dashboard

# Test real-time updates
npm test -- --testNamePattern="dashboard.*realtime"

# E2E test
npx playwright test tests/e2e/economic-dashboard.spec.ts
```

**Phase 4 Complete Criteria:**
- [ ] All dashboard components render
- [ ] Real-time updates < 5 second latency
- [ ] Analytics metrics accurate
- [ ] Visual design matches SPEC (97/100)

---

## Testing Requirements

### Unit Tests (Required)

Create: `tests/unit/economic.test.js`

```javascript
describe('Economic System', () => {
  describe('Token Calculation', () => {
    test('calculates correct tokens for sprout tier', () => {
      const result = calculateTokens(1, 85);
      expect(result.finalTokens).toBeGreaterThan(0);
      expect(result.qualityMultiplier).toBe(1.8);
    });

    test('applies quality multipliers correctly', () => {
      expect(calculateTokens(2, 95).qualityMultiplier).toBe(2.0);
      expect(calculateTokens(2, 75).qualityMultiplier).toBe(1.6);
      expect(calculateTokens(2, 25).qualityMultiplier).toBe(0.8);
    });
  });

  describe('Reputation Calculation', () => {
    test('calculates tier reputation from tokens', () => {
      const events = [
        { final_tokens: 100, quality_score: 80 },
        { final_tokens: 50, quality_score: 70 }
      ];
      const rep = calculateReputation('grove-1', events);
      expect(rep.tierReputation).toBeGreaterThan(0);
    });

    test('determines correct tier level', () => {
      expect(getTierLevel(95)).toBe('legendary');
      expect(getTierLevel(75)).toBe('expert');
      expect(getTierLevel(55)).toBe('competent');
      expect(getTierLevel(35)).toBe('developing');
      expect(getTierLevel(15)).toBe('novice');
    });
  });
});
```

### Integration Tests

Create: `tests/integration/economic-flow.test.js`

```javascript
describe('Economic Flow Integration', () => {
  test('complete attribution flow', async () => {
    // 1. Capture sprout
    const sprout = await captureSprout({
      groveId: 'grove-alpha',
      tierLevel: 2,
      qualityScore: 85
    });

    // 2. Verify attribution event created
    const event = await db.attribution_events.findOne({
      where: { contentId: sprout.id }
    });
    expect(event).toBeDefined();
    expect(event.final_tokens).toBeGreaterThan(0);

    // 3. Verify token balance updated
    const balance = await db.token_balances.findOne({
      where: { grove_id: 'grove-alpha' }
    });
    expect(balance.total_balance).toBeGreaterThan(0);
  });
});
```

### E2E Tests (Playwright)

Create: `tests/e2e/economic-dashboard.spec.ts`

```typescript
test('dashboard displays metrics', async ({ page }) => {
  await page.goto('/foundation/economic');

  // Wait for metrics to load
  await page.waitForSelector('[data-testid="total-tokens"]');

  // Verify metrics display
  expect(await page.textContent('[data-testid="total-tokens"]')).toContain('0');

  // Verify components render
  expect(await page.isVisible('text=Top Groves by Token Balance')).toBe(true);
  expect(await page.isVisible('text=Recent Attribution Chains')).toBe(true);
  expect(await page.isVisible('text=Network Influence')).toBe(true);
});
```

**Testing Commands:**
```bash
# Unit tests
npm test -- --testPathPattern=economic

# Integration tests
npm run test:integration

# E2E tests
npx playwright test tests/e2e/economic-dashboard.spec.ts

# Coverage report
npm run test:coverage
```

---

## Performance Requirements

### Benchmarks

| Operation | Target | Maximum |
|-----------|--------|---------|
| Attribution calculation | 200ms | 500ms |
| Token balance update | 50ms | 100ms |
| Reputation calculation | 100ms | 250ms |
| Dashboard load | 1s | 2s |
| Real-time update | 2s | 5s |

### Optimization Strategies

1. **Database Indexing**
   - Index on frequently queried fields
   - Composite indexes for multi-column queries

2. **Caching**
   - Redis for reputation scores
   - In-memory cache for dashboard metrics

3. **Virtualization**
   - Large lists (attribution events)
   - Network influence map nodes

4. **Lazy Loading**
   - Dashboard components
   - Attribution chain details

---

## Error Handling

### API Errors

```javascript
// 400 Bad Request
if (!sourceGroveId || !targetGroveId) {
  return res.status(400).json({
    error: 'Missing required fields',
    fields: ['sourceGroveId', 'targetGroveId']
  });
}

// 422 Unprocessable Entity
if (tierLevel < 1 || tierLevel > 3) {
  return res.status(422).json({
    error: 'Invalid tier level',
    validValues: [1, 2, 3]
  });
}

// 500 Internal Server Error
try {
  const result = await calculateAttribution(params);
  res.json(result);
} catch (error) {
  console.error('Attribution calculation failed:', error);
  res.status(500).json({
    error: 'Failed to calculate attribution',
    message: error.message
  });
}
```

### Database Errors

```javascript
// Transaction for consistency
await db.sequelize.transaction(async (t) => {
  // Create attribution event
  const event = await db.attribution_events.create(eventData, { transaction: t });

  // Update token balance
  await db.token_balances.increment('total_balance', {
    by: event.final_tokens,
    where: { grove_id: event.target_grove_id },
    transaction: t
  });

  // Update reputation
  await calculateReputation(event.target_grove_id, { transaction: t });
});
```

---

## Rollback Procedures

### If Database Migration Fails

```sql
-- Emergency rollback
DROP TABLE IF EXISTS attribution_chains CASCADE;
DROP TABLE IF EXISTS network_influence CASCADE;
DROP TABLE IF EXISTS economic_settings CASCADE;
DROP TABLE IF EXISTS reputation_scores CASCADE;
DROP TABLE IF EXISTS attribution_events CASCADE;
DROP TABLE IF EXISTS token_balances CASCADE;
```

### If Attribution Has Bugs

```javascript
// Feature flag to disable
if (!FEATURE_FLAGS.ECONOMIC_ATTRIBUTION) {
  // Skip attribution calculation
  return sproutData;
}

// Graceful degradation
try {
  return await calculateAttribution(params);
} catch (error) {
  console.error('Attribution failed, continuing without:', error);
  return sproutData;
}
```

---

## Monitoring & Observability

### Metrics to Track

```javascript
// Add to metrics service
const economicMetrics = {
  // Counters
  attributionEventsTotal: 'counter',
  tokensDistributedTotal: 'counter',
  reputationCalculationsTotal: 'counter',

  // Gauges
  activeGroves: 'gauge',
  averageAttributionStrength: 'gauge',
  tokenVelocity: 'gauge',

  // Histograms
  attributionCalculationLatency: 'histogram',
  databaseWriteLatency: 'histogram',
  dashboardLoadTime: 'histogram'
};
```

### Logging

```javascript
// Structured logging
console.log(JSON.stringify({
  event: 'attribution_calculated',
  groveId: event.target_grove_id,
  tokens: event.final_tokens,
  latency: Date.now() - startTime,
  tier: event.tier_level,
  quality: event.quality_score
}));
```

---

## DEX Compliance Checklist

### ✅ Pillar 1: Declarative Sovereignty
- [ ] Economic settings in database (not hardcoded)
- [ ] Operators can adjust parameters without code changes
- [ ] `economic_settings` table stores all configurable values

### ✅ Pillar 2: Capability Agnosticism
- [ ] Works with any AI model (no model-specific code)
- [ ] Quality scores from S10 are model-agnostic
- [ ] Attribution logic is pure TypeScript

### ✅ Pillar 3: Provenance as Infrastructure
- [ ] Every economic event logged with full context
- [ ] Attribution chains track complete history
- [ ] `attribution_chains` table maintains provenance

### ✅ Pillar 4: Organic Scalability
- [ ] Additive architecture (new features don't break old)
- [ ] Database schema supports unlimited groves
- [ ] No hardcoded limits or thresholds

---

## Documentation Requirements

As you implement, update:

1. **DEVLOG.md** - Daily progress entries
2. **API Documentation** - Update endpoint docs with examples
3. **Database Schema** - Document relationships and constraints
4. **Component Props** - TypeScript interfaces for all components

### Example Doc Update

```markdown
## Economic System

### Attribution Calculation
Endpoint: `POST /api/economic/calculate-attribution`

Calculates token rewards for knowledge contributions.

**Formula:**
```
finalTokens = baseTokens × qualityMultiplier × (1 + networkBonus) × reputationMultiplier
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/economic/calculate-attribution \
  -H "Content-Type: application/json" \
  -d '{
    "sourceGroveId": "grove-alpha",
    "targetGroveId": "grove-beta",
    "tierLevel": 2,
    "qualityScore": 85
  }'
```

**Example Response:**
```json
{
  "attributionEvent": {
    "id": "uuid-123",
    "sourceGroveId": "grove-alpha",
    "targetGroveId": "grove-beta",
    "tierLevel": 2,
    "qualityScore": 85,
    "finalTokens": 108,
    "createdAt": "2026-01-16T10:30:00Z"
  }
}
```
```

---

## Success Criteria

### Technical Success
- [ ] All 4 phases complete
- [ ] All unit tests pass (> 90% coverage)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Performance benchmarks met
- [ ] No critical or high severity bugs

### Product Success
- [ ] All 12 user stories implemented
- [ ] All 48 acceptance criteria pass
- [ ] Token calculations accurate
- [ ] Reputation system working
- [ ] Dashboard displays correctly
- [ ] Real-time updates functional

### Design Success
- [ ] Visual design matches SPEC (97/100 score)
- [ ] All components responsive
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] No design system violations

---

## Common Pitfalls to Avoid

### ❌ Don't Hardcode Values
```javascript
// BAD
const BASE_TOKENS = 100;

// GOOD
const BASE_TOKENS = await db.economic_settings.findValue('token_rewards.sprout');
```

### ❌ Don't Skip Error Handling
```javascript
// BAD
const event = await db.attribution_events.create(data);

// GOOD
try {
  const event = await db.attribution_events.create(data);
} catch (error) {
  console.error('Failed to create attribution event:', error);
  throw new Error('Attribution calculation failed');
}
```

### ❌ Don't Ignore Performance
```javascript
// BAD - N+1 query
for (const grove of groves) {
  grove.reputation = await getReputation(grove.id);
}

// GOOD - Batch query
const reputations = await getReputations(groves.map(g => g.id));
```

### ❌ Don't Skip Tests
Every feature must have:
- Unit tests
- Integration tests
- E2E tests (if user-facing)

---

## Getting Help

### Reference Documents (Read First)
1. `GROVE_EXECUTION_CONTRACT.md` - Complete implementation spec
2. `REQUIREMENTS.md` - Functional requirements
3. `DESIGN_SPEC.md` - UI/UX specifications
4. `USER_STORIES.md` - 12 stories with ACs

### Sprint Team
- **Product Manager**: For requirements questions
- **UX Designer**: For design questions
- **UX Chief**: For DEX compliance questions
- **Tech Lead**: For architecture questions

### Daily Standup Template
```markdown
## Daily Standup - [Date]

**Yesterday:**
- [x] Completed Phase X.Y
- [x] Implemented feature Z

**Today:**
- [ ] Work on feature A
- [ ] Write tests for feature B

**Blockers:**
- [ ] None / Describe blocker

**Metrics:**
- Tests: X% coverage
- Performance: Yms latency
```

---

## Final Checklist

Before marking complete:

- [ ] All 4 phases implemented
- [ ] All tests passing (unit, integration, E2E)
- [ ] Coverage > 90%
- [ ] Performance benchmarks met
- [ ] DEX compliance verified (4/4 pillars)
- [ ] Documentation updated
- [ ] No critical bugs
- [ ] Code review completed
- [ ] Visual QA passed
- [ ] DEVLOG.md updated with summary

---

## Ready to Start?

**Status**: 🎯 **READY FOR IMPLEMENTATION**

You have everything you need. Begin with Phase 1, Day 1.

**First Action**: Run database migration

```bash
npm run db:migrate -- --name create-attribution-tables
```

Good luck! 🚀

---

**Contract Version**: 1.0
**Last Updated**: 2026-01-16 22:35 UTC
**Implementation Duration**: 2 weeks (10 business days)
**Expected Completion**: 2026-01-30
