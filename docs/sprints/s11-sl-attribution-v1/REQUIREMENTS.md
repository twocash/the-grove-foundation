# REQUIREMENTS DOCUMENT: S11-SL-Attribution
**Sprint:** S11-SL-Attribution
**Document:** Functional Requirements Specification
**Version:** 1.0
**Date:** 2026-01-17

---

## Executive Summary

### Purpose
Define functional requirements for the **Knowledge Economy & Rewards** system enabling tier-based attribution, token distribution, and reputation tracking across federated groves.

### Scope
This document specifies requirements for:
- Tier-based attribution economy (sprout/sapling/tree → tokens)
- Quality-weighted reward distribution (integrates S10 quality scores)
- Cross-grove attribution tracking (via S9 federation)
- Reputation system for grove operators and communities
- Economic dashboard and visualization tools

### Non-Goals
- Cryptocurrency wallet integration (Phase 4)
- Fiat currency conversion (Phase 4)
- Blockchain or decentralized ledger (database sufficient)
- Complex derivatives or speculative trading
- International financial compliance

---

## User Stories

### Epic A: Attribution Tracking

#### US-A001: Track Tier Advancement Attribution
**As a** grove operator
**I want to** see how tokens flow from tier advancements to contributors
**So that** I can understand the economic value of my grove's contributions

**INVEST Assessment:**
- **Independent:** Yes - can be developed standalone
- **Negotiable:** Yes - attribution algorithm can be refined
- **Valuable:** Yes - core economic transparency
- **Estimable:** Yes - well-understood work
- **Small:** Yes - fits in sprint
- **Testable:** Yes - clear pass/fail criteria

**Gherkin Scenarios:**
```gherkin
Scenario: Single grove tier advancement
  Given I have a sprout that advances to sapling
  When the tier advancement is processed
  Then tokens should be distributed to the grove's token balance
  And the attribution event should be recorded

Scenario: Cross-grove influence attribution
  Given content from grove-A influences content in grove-B
  When grove-B's content advances tiers
  Then tokens should be distributed to both grove-A and grove-B
  And the attribution strength should reflect the influence level

Scenario: Multiple attribution chains
  Given content has 3 levels of indirect attribution
  When processing tier advancement
  Then tokens should cascade through the full attribution chain
  And each contributor should receive proportional rewards
```

#### US-A002: View Attribution Chain Visualization
**As a** grove operator
**I want to** see the complete attribution chain for any piece of content
**So that** I can trace how value flows through the network

**Gherkin Scenarios:**
```gherkin
Scenario: Visualize direct attribution
  Given I view a piece of content
  When I click "View Attribution"
  Then I should see a chain showing direct contributors
  And the percentage of tokens each contributor receives

Scenario: Visualize indirect attribution
  Given I view a piece of content with indirect influences
  When I expand the attribution view
  Then I should see influence levels 1, 2, and 3
  And each level should show cumulative attribution percentage

Scenario: Attribution chain with quality scores
  Given I view an attribution chain
  When quality scores are available
  Then each node should show its quality score
  And the quality score should correlate with token allocation
```

#### US-A003: Calculate Attribution Strength
**As a** system administrator
**I want to** configure how attribution strength is calculated
**So that** I can tune economic incentives for different behaviors

**Gherkin Scenarios:**
```gherkin
Scenario: Linear attribution decay
  Given I configure linear decay at 50%
  When calculating indirect attribution
  Then level-1 should receive 50% of base tokens
  And level-2 should receive 25% of base tokens
  And level-3 should receive 12.5% of base tokens

Scenario: Quality-weighted attribution
  Given I configure quality weighting enabled
  When calculating rewards
  Then higher quality scores should increase attribution strength
  And low quality scores should decrease attribution strength

Scenario: Cross-grove bonus
  Given I configure cross-grove bonus at 1.5x
  When grove-A content influences grove-B
  Then grove-A should receive a 1.5x multiplier on their portion
  And this should be clearly marked as "cross-grove bonus"
```

### Epic B: Token Economy

#### US-B001: Calculate Base Token Rewards
**As a** grove operator
**I want to** see how many tokens I earn for tier advancements
**So that** I can predict my grove's economic rewards

**Gherkin Scenarios:**
```gherkin
Scenario: Sprout tier base reward
  Given a sprout advances to sapling
  When rewards are calculated
  Then the base reward should be 10 tokens
  And this should be documented in the UI

Scenario: Sapling tier base reward
  Given a sapling advances to tree
  When rewards are calculated
  Then the base reward should be 50 tokens
  And this should be clearly displayed

Scenario: Tree tier bonus
  Given a tree tier advancement
  When rewards are calculated
  Then the base reward should be 250 tokens
  And a "tree tier bonus" label should be shown

Scenario: Multiple tier advancements
  Given I have 3 sprouts advancing simultaneously
  When rewards are calculated
  Then each should receive 10 tokens (30 total)
  And each should be logged as a separate event
```

#### US-B002: Apply Quality Multipliers
**As a** grove operator
**I want to** earn more tokens for higher quality content
**So that** there's an incentive to improve content quality

**Gherkin Scenarios:**
```gherkin
Scenario: High quality multiplier
  Given content has a quality score of 90
  When rewards are calculated
  Then the quality multiplier should be 1.8x
  And the final reward should be base × 1.8

Scenario: Medium quality multiplier
  Given content has a quality score of 70
  When rewards are calculated
  Then the quality multiplier should be 1.4x
  And the final reward should be base × 1.4

Scenario: Low quality penalty
  Given content has a quality score of 40
  When rewards are calculated
  Then the quality multiplier should be 0.8x
  And a "low quality penalty" should be indicated

Scenario: No quality score
  Given content has no quality score
  When rewards are calculated
  Then the quality multiplier should be 1.0x (no change)
  And the system should use base reward only
```

#### US-B003: Distribute Network Effect Bonuses
**As a** grove operator
**I want to** earn bonuses when my content influences multiple groves
**So that** cross-grove sharing is economically rewarded

**Gherkin Scenarios:**
```gherkin
Scenario: Single grove influence
  Given my content influences only my own grove
  When rewards are calculated
  Then no network bonus should be applied
  And the multiplier should be 1.0x

Scenario: Two grove influence
  Given my content influences grove-B
  When rewards are calculated
  Then a network bonus of 1.2x should be applied
  And the bonus should be labeled "cross-grove sharing"

Scenario: Three+ grove influence
  Given my content influences 3 other groves
  When rewards are calculated
  Then a network bonus of 1.5x should be applied
  And the bonus should show "multi-grove influence"

Scenario: Network effect decay
  Given my content influences 10 groves
  When rewards are calculated
  Then the network bonus should cap at 2.0x
  And the UI should indicate "bonus capped at 2.0x"
```

#### US-B004: Track Token Balances and History
**As a** grove operator
**I want to** see my current token balance and earning history
**So that** I can track my grove's economic performance

**Gherkin Scenarios:**
```gherkin
Scenario: View current balance
  Given I have earned 500 tokens and spent 200 tokens
  When I view my token balance
  Then I should see 300 tokens current balance
  And I should see 500 total earned and 200 total spent

Scenario: Token earning history
  Given I have earned tokens from multiple sources
  When I view my earning history
  Then each entry should show date, amount, and source
  And entries should be sorted by date (newest first)

Scenario: Token spending history
  Given I have spent tokens on various actions
  When I view my spending history
  Then each entry should show date, amount, and purpose
  And the balance should update in real-time

Scenario: Balance alerts
  Given my token balance falls below 50 tokens
  When I check my balance
  Then I should see a low balance warning
  And I should see suggestions for earning more tokens
```

### Epic C: Reputation System

#### US-C001: Calculate Reputation Scores
**As a** grove operator
**I want to** earn reputation points for quality contributions
**So that** my grove's standing in the network increases

**Gherkin Scenarios:**
```gherkin
Scenario: Tier reputation from sprouts
  Given I contribute 10 sprouts
  When reputation is calculated
  Then I should earn 10 tier reputation points
  And the reputation should be visible on my profile

Scenario: Tier reputation from saplings
  Given I contribute 5 saplings
  When reputation is calculated
  Then I should earn 25 tier reputation points (5 × 5)
  And saplings should be worth more than sprouts

Scenario: Tier reputation from trees
  Given I contribute 2 trees
  When reputation is calculated
  Then I should earn 50 tier reputation points (2 × 25)
  And trees should be worth significantly more

Scenario: Quality reputation bonus
  Given I contribute high-quality content (score > 80)
  When reputation is calculated
  Then I should earn a quality reputation bonus
  And the bonus should be proportional to quality score
```

#### US-C002: Apply Reputation Multipliers
**As a** grove operator
**I want to** earn higher token rewards with a better reputation
**So that** consistent quality is economically incentivized

**Gherkin Scenarios:**
```gherkin
Scenario: Low reputation multiplier
  Given I have a reputation score of 25
  When rewards are calculated
  Then the reputation multiplier should be 0.9x
  And this should encourage me to improve

Scenario: Medium reputation multiplier
  Given I have a reputation score of 50
  When rewards are calculated
  Then the reputation multiplier should be 1.0x
  And this should be considered baseline

Scenario: High reputation multiplier
  Given I have a reputation score of 90
  When rewards are calculated
  Then the reputation multiplier should be 1.5x
  And high reputation should be clearly rewarded

Scenario: Reputation ceiling
  Given I have a reputation score of 100
  When rewards are calculated
  Then the multiplier should cap at 2.0x
  And the UI should indicate "maximum reputation multiplier"
```

#### US-C003: Track Reputation History
**As a** grove operator
**I want to** see how my reputation has changed over time
**So that** I can understand what actions improve my standing

**Gherkin Scenarios:**
```gherkin
Scenario: View reputation timeline
  Given I have reputation history over 6 months
  When I view my reputation timeline
  Then I should see a line chart of reputation changes
  And major changes should have explanations

Scenario: Reputation milestones
  Given I reach reputation score milestones (25, 50, 75, 100)
  When I achieve a milestone
  Then I should receive a milestone notification
  And my profile should show the milestone badge

Scenario: Reputation decay
  Given I haven't contributed in 30 days
  When reputation is recalculated
  Then my reputation should decay by 10%
  And this should be clearly communicated

Scenario: Attribution for reputation changes
  Given my reputation changes
  When I view the change details
  Then I should see what actions caused the change
  And the attribution should be specific and actionable
```

#### US-C004: View Network Reputation Leaderboard
**As a** grove operator
**I want to** see how my reputation compares to other groves
**So that** I can gauge my standing in the network

**Gherkin Scenarios:**
```gherkin
Scenario: View top 10 reputation
  Given there are 50 groves in the network
  When I view the leaderboard
  Then I should see the top 10 groves by reputation
  And each entry should show grove name and reputation score

Scenario: Find my ranking
  Given I have a reputation score of 65
  When I view the leaderboard
  Then I should see my grove highlighted
  And I should see my ranking (e.g., "Ranked #12 of 50")

Scenario: Filter by region or type
  Given groves are categorized by type
  When I filter the leaderboard
  Then I should see only groves in my category
  And the ranking should update accordingly

Scenario: Reputation trend indicators
  Given groves have changing reputations
  When I view the leaderboard
  Then each grove should show reputation trend (↑↓→)
  And the trend should be calculated over the past 30 days
```

### Epic D: Economic Dashboard

#### US-D001: View Economic Overview Dashboard
**As a** grove operator
**I want to** see an overview of my grove's economic health
**So that** I can quickly understand our performance

**Gherkin Scenarios:**
```gherkin
Scenario: Dashboard displays key metrics
  Given I access the economic dashboard
  When the dashboard loads
  Then I should see token balance, reputation, and recent earnings
  And the metrics should be clearly labeled and easy to understand

Scenario: Token balance visualization
  Given I have token history
  When I view the dashboard
  Then I should see a chart of my token balance over time
  And the chart should show clear trend indicators

Scenario: Recent attribution events
  Given I have recent tier advancements
  When I view the dashboard
  Then I should see the last 5 attribution events
  And each event should show tokens earned and source

Scenario: Network comparison
  Given I want to compare to network average
  When I view the dashboard
  Then I should see how my metrics compare to other groves
  And the comparison should be clearly marked as "network average"
```

#### US-D002: Analyze Attribution Flows
**As a** grove operator
**I want to** analyze how value flows through the network
**So that** I can optimize my grove's strategy

**Gherkin Scenarios:**
```gherkin
Scenario: Attribution inflow analysis
  Given I want to see what's earning me tokens
  When I view attribution inflow
  Then I should see sources of tokens (own content vs. influenced content)
  And I should see the breakdown percentage

Scenario: Attribution outflow analysis
  Given I want to see where my influence is going
  When I view attribution outflow
  Then I should see which groves my content influences
  And I should see the strength of that influence

Scenario: Attribution flow visualization
  Given I view an attribution flow diagram
  When the visualization loads
  Then I should see nodes (groves) and edges (attribution strength)
  And the flow should show direction and token amounts

Scenario: Time range filtering
  Given I want to see attribution for a specific period
  When I filter by date range
  Then the attribution analysis should update
  And I should see "Showing attribution for [date range]"
```

#### US-D003: Monitor Network Health Metrics
**As a** system administrator
**I want to** monitor overall network economic health
**So that** I can identify issues early

**Gherkin Scenarios:**
```gherkin
Scenario: Total network token supply
  Given I monitor the entire network
  When I view network health
  Then I should see total tokens in circulation
  And I should see inflation rate (tokens added per day)

Scenario: Attribution coverage
  Given I want to know attribution completeness
  When I view network health
  Then I should see % of content with full attribution
  And I should see trend over time

Scenario: Grove participation rate
  Given I want to track network growth
  When I view network health
  Then I should see % of groves actively earning tokens
  And I should see new grove adoption rate

Scenario: Economic anomaly detection
  Given I want to detect gaming or errors
  When anomalies are detected
  Then I should receive an alert
  And the alert should include details and suggested actions
```

#### US-D004: Export Economic Data
**As a** grove operator
**I want to** export my economic data for external analysis
**So that** I can perform detailed financial planning

**Gherkin Scenarios:**
```gherkin
Scenario: Export token transaction history
  Given I want to analyze my token history
  When I export my data
  Then I should receive a CSV file with all transactions
  And the file should include date, amount, source, and balance

Scenario: Export attribution data
  Given I want to analyze attribution patterns
  When I export my data
  Then I should receive attribution chains and strength values
  And the export should be in JSON format for flexibility

Scenario: Export reputation history
  Given I want to track reputation changes
  When I export my data
  Then I should receive reputation score timeline
  And the export should include reasons for changes

Scenario: Scheduled data exports
  Given I want regular data exports
  When I configure scheduled exports
  Then I should receive email reports on a schedule
  And the reports should include key metrics and trends
```

---

## Data Requirements

### Core Data Models

#### AttributionEvent
```typescript
interface AttributionEvent {
  id: string; // UUID
  sourceGroveId: string;
  targetGroveId: string;
  sourceContentId: string;
  targetContentId: string;
  tierLevel: 1 | 2 | 3; // sprout, sapling, tree
  qualityScore: number; // 0-100 from S10
  attributionStrength: number; // 0.0-1.0
  baseTokens: number; // 10, 50, 250
  qualityMultiplier: number; // 0.5-2.0
  networkBonus: number; // 1.0-2.0
  reputationMultiplier: number; // 0.9-2.0
  finalTokens: number; // calculated
  createdAt: string; // ISO timestamp
}
```

#### TokenBalance
```typescript
interface TokenBalance {
  groveId: string;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  pendingTokens: number; // not yet distributed
  lastDistribution: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
```

#### ReputationScore
```typescript
interface ReputationScore {
  groveId: string;
  totalScore: number; // 0-100
  tierReputation: number; // from content count
  qualityReputation: number; // from quality scores
  networkReputation: number; // from cross-grove influence
  reputationHistory: Array<{
    date: string;
    score: number;
    change: number;
    reason: string;
  }>;
  updatedAt: string; // ISO timestamp
}
```

#### RewardDistribution
```typescript
interface RewardDistribution {
  id: string; // UUID
  groveId: string;
  sourceContentId: string;
  tierLevel: 1 | 2 | 3;
  tokens: number;
  reputationChange: number;
  distributionType: 'tier_advancement' | 'quality_bonus' | 'network_bonus';
  appliedMultipliers: {
    quality?: number;
    network?: number;
    reputation?: number;
  };
  createdAt: string; // ISO timestamp
}
```

### Database Schema

```sql
-- Attribution events
CREATE TABLE attribution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_grove_id TEXT NOT NULL,
  target_grove_id TEXT NOT NULL,
  source_content_id TEXT NOT NULL,
  target_content_id TEXT NOT NULL,
  tier_level INTEGER NOT NULL CHECK (tier_level IN (1, 2, 3)),
  quality_score DECIMAL(5,2),
  attribution_strength DECIMAL(3,2) NOT NULL CHECK (attribution_strength >= 0 AND attribution_strength <= 1),
  base_tokens DECIMAL(10,2) NOT NULL,
  quality_multiplier DECIMAL(3,2) NOT NULL,
  network_bonus DECIMAL(3,2) NOT NULL,
  reputation_multiplier DECIMAL(3,2) NOT NULL,
  final_tokens DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Token balances
CREATE TABLE token_balances (
  grove_id TEXT PRIMARY KEY,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_earned DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_spent DECIMAL(15,2) NOT NULL DEFAULT 0,
  pending_tokens DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_distribution TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reputation scores
CREATE TABLE reputation_scores (
  grove_id TEXT PRIMARY KEY,
  total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  tier_reputation DECIMAL(5,2) NOT NULL DEFAULT 0,
  quality_reputation DECIMAL(5,2) NOT NULL DEFAULT 0,
  network_reputation DECIMAL(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reputation history
CREATE TABLE reputation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id TEXT NOT NULL REFERENCES reputation_scores(grove_id),
  date DATE NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  change DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reward distributions
CREATE TABLE reward_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id TEXT NOT NULL,
  source_content_id TEXT NOT NULL,
  tier_level INTEGER NOT NULL,
  tokens DECIMAL(10,2) NOT NULL,
  reputation_change DECIMAL(5,2),
  distribution_type TEXT NOT NULL,
  applied_multipliers JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Token transactions (for detailed history)
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id TEXT NOT NULL REFERENCES token_balances(grove_id),
  type TEXT NOT NULL, -- 'earned', 'spent', 'penalty'
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL,
  source TEXT NOT NULL, -- 'tier_advancement', 'manual_adjustment', etc.
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_attribution_events_grove ON attribution_events(source_grove_id, target_grove_id);
CREATE INDEX idx_attribution_events_date ON attribution_events(created_at);
CREATE INDEX idx_reward_distributions_grove ON reward_distributions(grove_id);
CREATE INDEX idx_token_transactions_grove ON token_transactions(grove_id);
CREATE INDEX idx_token_transactions_date ON token_transactions(created_at);
```

### Integration with S10 Quality Scores

```typescript
// Quality score integration
interface QualityScore {
  contentId: string;
  groveId: string;
  overallScore: number; // 0-100
  dimensions: {
    accuracy: number;
    utility: number;
    novelty: number;
    provenance: number;
  };
  confidence: number;
}

// Quality multiplier calculation
function calculateQualityMultiplier(qualityScore: number): number {
  if (qualityScore >= 90) return 2.0;
  if (qualityScore >= 80) return 1.8;
  if (qualityScore >= 70) return 1.6;
  if (qualityScore >= 60) return 1.4;
  if (qualityScore >= 50) return 1.2;
  if (qualityScore >= 40) return 1.0;
  if (qualityScore >= 30) return 0.9;
  if (qualityScore >= 20) return 0.8;
  return 0.5;
}
```

### Federation Integration (S9)

```typescript
// Cross-grove attribution tracking
interface FederationAttribution {
  groveId: string;
  contentId: string;
  influenceLevel: number; // 1=direct, 2=indirect, 3=meta
  influenceStrength: number; // 0.0-1.0
  tokensFlowing: number;
  federationPath: string[]; // grove IDs in the path
}

// Federation bonus calculation
function calculateNetworkBonus(
  groveInfluence: Set<string>,
  totalGroves: number
): number {
  const influenceCount = groveInfluence.size;
  if (influenceCount === 0) return 1.0;
  if (influenceCount === 1) return 1.2;
  if (influenceCount === 2) return 1.4;
  if (influenceCount >= 3) return 1.5 + (influenceCount - 3) * 0.1;
  return 2.0; // cap at 2.0x
}
```

---

## API Requirements

### Attribution Management

#### POST /api/attribution/calculate
Calculate reward distribution for tier advancement.

**Request:**
```json
{
  "contentId": "content-123",
  "groveId": "grove-abc",
  "tierLevel": 2, // 1=sprout, 2=sapling, 3=tree
  "attributionChain": [
    {
      "groveId": "grove-abc",
      "influenceStrength": 0.6
    },
    {
      "groveId": "grove-def",
      "influenceStrength": 0.3
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "distributions": [
    {
      "groveId": "grove-abc",
      "baseTokens": 50,
      "qualityMultiplier": 1.6,
      "networkBonus": 1.2,
      "finalTokens": 96,
      "attributionStrength": 0.6
    },
    {
      "groveId": "grove-def",
      "baseTokens": 50,
      "qualityMultiplier": 1.4,
      "networkBonus": 1.0,
      "finalTokens": 70,
      "attributionStrength": 0.3
    }
  ],
  "totalTokens": 166
}
```

#### GET /api/attribution/chain/:contentId
Retrieve complete attribution chain for content.

**Response:**
```json
{
  "contentId": "content-123",
  "groveId": "grove-abc",
  "attributionChain": [
    {
      "groveId": "grove-abc",
      "groveName": "My Grove",
      "tierLevel": 2,
      "influenceStrength": 0.6,
      "tokensReceived": 96,
      "percentage": 57.8
    },
    {
      "groveId": "grove-def",
      "groveName": "Influenced Grove",
      "tierLevel": 1,
      "influenceStrength": 0.3,
      "tokensReceived": 70,
      "percentage": 42.2
    }
  ],
  "totalTokens": 166,
  "levels": {
    "direct": 96,
    "indirect": 70,
    "meta": 0
  }
}
```

#### GET /api/attribution/network/:groveId
Get network influence statistics for a grove.

**Response:**
```json
{
  "groveId": "grove-abc",
  "outgoingInfluence": [
    {
      "targetGroveId": "grove-def",
      "targetGroveName": "Influenced Grove",
      "influenceStrength": 0.6,
      "tokensFlowing": 96,
      "contentCount": 5
    }
  ],
  "incomingInfluence": [
    {
      "sourceGroveId": "grove-xyz",
      "sourceGroveName": "Influencing Grove",
      "influenceStrength": 0.4,
      "tokensReceived": 54,
      "contentCount": 3
    }
  ],
  "networkStats": {
    "totalInfluencedGroves": 1,
    "totalInfluencingGroves": 1,
    "averageInfluenceStrength": 0.5,
    "networkBonusMultiplier": 1.2
  }
}
```

### Token Management

#### GET /api/tokens/balance/:groveId
Retrieve current token balance and summary.

**Response:**
```json
{
  "groveId": "grove-abc",
  "currentBalance": 1234.56,
  "totalEarned": 2500.00,
  "totalSpent": 1265.44,
  "pendingTokens": 50.00,
  "lastDistribution": "2026-01-17T10:30:00Z",
  "balances": {
    "available": 1234.56,
    "pending": 50.00,
    "reserved": 0.00
  }
}
```

#### GET /api/tokens/history/:groveId
Get token transaction history with pagination.

**Query Parameters:**
- `limit`: Number of transactions to return (default: 50, max: 200)
- `offset`: Offset for pagination (default: 0)
- `type`: Filter by transaction type ('earned', 'spent', 'all')
- `startDate`: Filter from date (ISO 8601)
- `endDate`: Filter to date (ISO 8601)

**Response:**
```json
{
  "groveId": "grove-abc",
  "transactions": [
    {
      "id": "txn-123",
      "type": "earned",
      "amount": 96.00,
      "balanceAfter": 1234.56,
      "source": "tier_advancement",
      "sourceContentId": "content-123",
      "date": "2026-01-17T10:30:00Z",
      "metadata": {
        "tierLevel": 2,
        "qualityMultiplier": 1.6,
        "networkBonus": 1.2
      }
    },
    {
      "id": "txn-124",
      "type": "spent",
      "amount": -50.00,
      "balanceAfter": 1184.56,
      "source": "manual_adjustment",
      "reason": "Correction for error",
      "date": "2026-01-17T09:15:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### POST /api/tokens/transfer (Future)
Transfer tokens between groves (Phase 4).

**Request:**
```json
{
  "fromGroveId": "grove-abc",
  "toGroveId": "grove-def",
  "amount": 100.00,
  "reason": "Payment for consultation",
  "metadata": {
    "serviceType": "consultation",
    "hours": 2
  }
}
```

### Reputation System

#### GET /api/reputation/:groveId
Get complete reputation score and breakdown.

**Response:**
```json
{
  "groveId": "grove-abc",
  "totalScore": 75.5,
  "breakdown": {
    "tierReputation": 45.0,
    "qualityReputation": 25.5,
    "networkReputation": 5.0
  },
  "reputationHistory": [
    {
      "date": "2026-01-17",
      "score": 75.5,
      "change": +2.5,
      "reason": "Tree tier advancement"
    },
    {
      "date": "2026-01-16",
      "score": 73.0,
      "change": +3.0,
      "reason": "High quality sapling contribution"
    }
  ],
  "multipliers": {
    "reputationMultiplier": 1.45,
    "tierLevelBonus": 1.0,
    "status": "high_reputation"
  }
}
```

#### GET /api/reputation/leaderboard
Get network reputation leaderboard.

**Query Parameters:**
- `limit`: Number of groves to return (default: 50, max: 100)
- `category`: Filter by grove category
- `period`: Time period ('all_time', '30_days', '7_days')

**Response:**
```json
{
  "leaderboard": [
    {
      "groveId": "grove-xyz",
      "groveName": "Top Grove",
      "reputationScore": 95.5,
      "rank": 1,
      "trend": "up",
      "change30Days": +5.2
    },
    {
      "groveId": "grove-abc",
      "groveName": "My Grove",
      "reputationScore": 75.5,
      "rank": 12,
      "trend": "stable",
      "change30Days": +0.5
    }
  ],
  "networkStats": {
    "totalGroves": 150,
    "averageReputation": 45.0,
    "medianReputation": 42.0
  }
}
```

#### POST /api/reputation/update
Update reputation scores (system use).

**Request:**
```json
{
  "groveId": "grove-abc",
  "updateType": "tier_advancement",
  "tierLevel": 2,
  "qualityScore": 85,
  "crossGroveInfluence": 1
}
```

### Rewards and Distributions

#### GET /api/rewards/distributions/:groveId
Get reward distribution history.

**Response:**
```json
{
  "groveId": "grove-abc",
  "distributions": [
    {
      "id": "dist-123",
      "sourceContentId": "content-123",
      "tierLevel": 2,
      "tokens": 96.00,
      "reputationChange": +2.5,
      "distributionType": "tier_advancement",
      "appliedMultipliers": {
        "quality": 1.6,
        "network": 1.2,
        "reputation": 1.45
      },
      "date": "2026-01-17T10:30:00Z"
    }
  ],
  "summary": {
    "totalTokens": 2500.00,
    "totalDistributions": 45,
    "averageTokensPerDistribution": 55.56,
    "lastDistribution": "2026-01-17T10:30:00Z"
  }
}
```

#### GET /api/rewards/pending
Get pending reward distributions.

**Response:**
```json
{
  "pending": [
    {
      "groveId": "grove-abc",
      "contentId": "content-456",
      "estimatedTokens": 75.00,
      "tierLevel": 1,
      "attributionComplete": false,
      "estimatedDistributionDate": "2026-01-17T12:00:00Z"
    }
  ],
  "count": 1,
  "totalPendingTokens": 75.00
}
```

#### POST /api/rewards/calculate
Calculate estimated rewards for content (preview).

**Request:**
```json
{
  "groveId": "grove-abc",
  "tierLevel": 2,
  "qualityScore": 85,
  "attributionStrength": 0.6
}
```

**Response:**
```json
{
  "baseTokens": 50,
  "qualityMultiplier": 1.6,
  "estimatedTokens": 80,
  "reputationMultiplier": 1.45,
  "finalTokens": 116,
  "breakdown": {
    "baseReward": 50,
    "qualityBonus": 30,
    "reputationBonus": 36
  }
}
```

### Economic Dashboard

#### GET /api/dashboard/economic/:groveId
Get comprehensive economic dashboard data.

**Response:**
```json
{
  "groveId": "grove-abc",
  "summary": {
    "tokenBalance": 1234.56,
    "reputationScore": 75.5,
    "rank": 12,
    "rankTotal": 150
  },
  "tokenMetrics": {
    "earned30Days": 500.00,
    "spent30Days": 200.00,
    "pendingTokens": 50.00,
    "growthRate": 0.15
  },
  "attributionMetrics": {
    "totalAttributions": 45,
    "directAttributions": 30,
    "indirectAttributions": 15,
    "averageAttributionStrength": 0.55
  },
  "networkInfluence": {
    "grovesInfluenced": 5,
    "tokensFromInfluence": 250.00,
    "networkBonusMultiplier": 1.3
  },
  "recentDistributions": [
    {
      "date": "2026-01-17T10:30:00Z",
      "tokens": 96.00,
      "source": "Sapling advancement"
    }
  ]
}
```

---

## Business Logic Requirements

### Token Calculation Algorithm

```typescript
interface TokenCalculation {
  baseTokens: number;
  qualityMultiplier: number;
  networkBonus: number;
  reputationMultiplier: number;
  finalTokens: number;
}

// Base token values
const TIER_BASE_TOKENS = {
  1: 10,  // sprout
  2: 50,  // sapling
  3: 250  // tree
};

// Calculate final token reward
function calculateTokens(
  tierLevel: 1 | 2 | 3,
  qualityScore: number,
  groveReputation: number,
  networkInfluenceCount: number
): TokenCalculation {
  const baseTokens = TIER_BASE_TOKENS[tierLevel];

  // Quality multiplier (0.5x to 2.0x)
  const qualityMultiplier = calculateQualityMultiplier(qualityScore);

  // Network bonus (1.0x to 2.0x)
  const networkBonus = calculateNetworkBonus(networkInfluenceCount);

  // Reputation multiplier (0.9x to 2.0x)
  const reputationMultiplier = calculateReputationMultiplier(groveReputation);

  const finalTokens = baseTokens *
    qualityMultiplier *
    networkBonus *
    reputationMultiplier;

  return {
    baseTokens,
    qualityMultiplier,
    networkBonus,
    reputationMultiplier,
    finalTokens
  };
}
```

### Attribution Strength Calculation

```typescript
// Calculate how much influence one piece of content has on another
function calculateAttributionStrength(
  sourceContent: any,
  targetContent: any,
  connectionType: 'direct' | 'influence' | 'meta'
): number {
  let strength = 0.0;

  switch (connectionType) {
    case 'direct':
      strength = 1.0; // Direct tier advancement
      break;

    case 'influence':
      // Based on quality and recency
      strength = Math.min(
        sourceContent.qualityScore / 100,
        0.7 // Cap indirect at 70%
      );
      break;

    case 'meta':
      // Based on influence of influence
      strength = Math.min(
        calculateAttributionStrength(sourceContent, targetContent, 'influence') * 0.5,
        0.35 // Cap meta at 35%
      );
      break;
  }

  // Apply time decay (newer content has stronger influence)
  const daysSinceCreation = daysBetween(new Date(), sourceContent.createdAt);
  const timeDecay = Math.max(0.1, 1.0 - (daysSinceCreation / 365)); // Decay over 1 year

  return strength * timeDecay;
}
```

### Reputation Calculation

```typescript
// Calculate reputation score from multiple factors
function calculateReputation(
  groveId: string,
  contentHistory: any[]
): ReputationScore {
  const tierReputation = calculateTierReputation(contentHistory);
  const qualityReputation = calculateQualityReputation(contentHistory);
  const networkReputation = calculateNetworkReputation(groveId, contentHistory);

  // Weighted average (tier: 50%, quality: 35%, network: 15%)
  const totalScore = (
    tierReputation * 0.5 +
    qualityReputation * 0.35 +
    networkReputation * 0.15
  );

  return {
    groveId,
    totalScore,
    tierReputation,
    qualityReputation,
    networkReputation
  };
}

// Tier reputation based on content count and tier
function calculateTierReputation(contentHistory: any[]): number {
  let score = 0;

  for (const content of contentHistory) {
    switch (content.tierLevel) {
      case 1: // sprout
        score += 1;
        break;
      case 2: // sapling
        score += 5;
        break;
      case 3: // tree
        score += 25;
        break;
    }
  }

  return Math.min(score, 100); // Cap at 100
}

// Quality reputation based on average quality scores
function calculateQualityReputation(contentHistory: any[]): number {
  if (contentHistory.length === 0) return 0;

  const totalQuality = contentHistory.reduce(
    (sum, content) => sum + content.qualityScore,
    0
  );
  const averageQuality = totalQuality / contentHistory.length;

  return averageQuality; // Already 0-100
}

// Network reputation based on cross-grove influence
function calculateNetworkReputation(groveId: string, contentHistory: any[]): number {
  // Count cross-grove influence events
  const crossGroveEvents = contentHistory.filter(
    content => content.influencedGroves.length > 0
  ).length;

  // Bonus for influencing many groves
  const influenceBonus = Math.min(crossGroveEvents * 2, 20);

  // Bonus for being influenced by other groves
  const beingInfluencedBonus = calculateBeingInfluencedBonus(groveId);

  return Math.min(influenceBonus + beingInfluencedBonus, 100);
}
```

---

## Non-Functional Requirements

### Performance
- Attribution calculation: < 5 seconds
- Dashboard load time: < 2 seconds
- Token balance queries: < 100ms
- Reputation leaderboard: < 500ms
- Database queries: < 100ms for 99th percentile

### Scalability
- Support 10,000+ groves
- Handle 1M+ attribution events daily
- Store 1 year of transaction history
- Scale to 1B+ tokens in circulation

### Availability
- 99.9% uptime for attribution system
- Zero-tolerance for token calculation errors
- Automatic failover for critical components
- Backup and disaster recovery plan

### Security
- All token transactions auditable
- Immutable attribution chain
- Rate limiting on API endpoints
- Encryption of sensitive data

### Data Retention
- Transaction history: 7 years
- Attribution events: 5 years
- Reputation history: 3 years
- Dashboard analytics: 1 year

---

**Requirements Version:** 1.0
**Next Stage:** Stage 3: Designer → DESIGN_SPEC.md
**Total User Stories:** 12 across 4 Epics
**Total Gherkin Scenarios:** 48 (4 per story)
