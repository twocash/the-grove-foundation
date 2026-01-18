# User Stories & Acceptance Criteria v1.0 Review
**Sprint:** S11-SL-Attribution
**Codename:** Knowledge Economy & Rewards
**Phase:** Story Extraction + Acceptance Criteria
**Status:** Draft for Review

---

## Executive Summary

This document provides detailed user stories and acceptance criteria for the S11-SL-Attribution sprint - the final phase of the Observable Knowledge EPIC. The sprint enables a **decentralized knowledge economy** through tier-based attribution, token distribution, and reputation tracking.

### User Stories Overview
- **Total Stories:** 12 user stories across 4 Epics
- **Acceptance Criteria:** 48 Gherkin scenarios (4 per story)
- **Priority Distribution:** 8 P0 (must-have), 4 P1 (important)
- **Complexity Distribution:** 4 Small, 6 Medium, 2 Large

### Epic Breakdown
1. **Epic A: Attribution Tracking** (3 stories, P0) - Core attribution functionality
2. **Epic B: Token Economy** (3 stories, P0) - Token calculation and distribution
3. **Epic C: Reputation System** (3 stories, P0) - Reputation scoring and management
4. **Epic D: Economic Dashboard** (3 stories, P1) - Visualization and analytics

---

## Critical Observations

### 1. Complex Economic Calculations Require Extensive Testing
**Issue:** Attribution calculations involve multiple factors (tier, quality, network, reputation)
**Impact:** High risk of calculation errors in production
**Recommendation:** Include simulation testing with 100+ scenarios, comprehensive edge cases
**Priority:** P0

### 2. Cross-Grove Attribution Requires Federation Integration
**Issue:** S9-SL-Federation dependency for cross-grove features
**Impact:** Cannot test full attribution chains without federation complete
**Recommendation:** Build single-grove mode first, add federation in Phase 2
**Priority:** P0

### 3. Economic Visualization Must Balance Detail and Clarity
**Issue:** Attribution chains are complex, need to be understandable
**Impact:** Users may not understand economic model, low adoption
**Recommendation:** Progressive disclosure - start simple, show detail on demand
**Priority:** P1

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Real-time token updates | Batch updates (5 min) | Reduces complexity, sufficient for v1.0 |
| Complex economic policies | Simple linear decay model | Easier to understand and test |
| Advanced reputation decay | Static reputation scores | Reputation can stabilize in v1.0 |
| Network graph animations | Static visualizations | Focus on data accuracy over animation |
| Economic anomaly detection | Manual monitoring | Automated detection added in Phase 3 |

---

## Epic A: Attribution Tracking

### US-A001: Track Tier Advancement Attribution

**As a** grove operator
**I want to** see how tokens flow from tier advancements to contributors
**So that** I can understand the economic value of my grove's contributions

**INVEST Assessment:**
- **I**ndependent: Yes - can be developed standalone
- **N**egotiable: Yes - attribution algorithm parameters can be adjusted
- **V**alue: Yes - core economic transparency requirement
- **E**stimable: Yes - well-defined calculation logic
- **S**mall: Yes - fits within sprint
- **T**estable: Yes - clear input/output criteria

**Priority:** P0
**Complexity:** M

**Traceability:** REQUIREMENTS.md section "Epic A: Attribution Tracking"

**Acceptance Criteria:**

```gherkin
Scenario: Single grove tier advancement
  Given I have a sprout that advances to sapling tier
  When the tier advancement is processed
  Then tokens should be distributed to my grove's token balance
  And an attribution event should be recorded in the database
  And the event should include source content ID and tier level

Scenario: Cross-grove influence attribution
  Given content from grove-A influences content in grove-B
  When grove-B's content advances tiers
  Then tokens should be distributed to both grove-A and grove-B
  And grove-A's attribution should reflect their influence level
  And the distribution should show both groves in the attribution chain

Scenario: Multiple attribution chains
  Given content has 3 levels of indirect attribution (grove-A → grove-B → grove-C)
  When processing tier advancement
  Then tokens should cascade through the full attribution chain
  And each contributor should receive proportional rewards
  And the total distributed should equal base tokens × quality multiplier

Scenario: Attribution strength calculation
  Given indirect attribution at 50% decay rate
  When calculating level-1 indirect attribution
  Then the attribution strength should be 0.5
  And level-2 should be 0.25
  And level-3 should be 0.125

Scenario: Zero influence handling
  Given content with no attribution chain
  When tier advancement occurs
  Then all tokens should go to the content's grove
  And no other groves should be credited
```

### US-A002: View Attribution Chain Visualization

**As a** grove operator
**I want to** see the complete attribution chain for any piece of content
**So that** I can trace how value flows through the network

**INVEST Assessment:**
- **I**ndependent: Yes - UI component independent of backend
- **N**egotiable: Yes - visualization can be simplified or enhanced
- **V**alue: Yes - transparency requirement
- **E**stimable: Yes - standard UI component work
- **S**mall: Yes - existing visualization patterns apply
- **T**estable: Yes - visual regression tests possible

**Priority:** P0
**Complexity:** M

**Traceability:** DESIGN_SPEC.md section "Attribution Chain Visualization"

**Acceptance Criteria:**

```gherkin
Scenario: Visualize direct attribution
  Given I view a piece of content with earned tokens
  When I click "View Attribution" button
  Then I should see a chain diagram showing direct contributors
  And each contributor should show percentage of tokens received
  And the visualization should load within 2 seconds

Scenario: Expand indirect attribution levels
  Given I view an attribution chain
  When I click "Show All Levels" button
  Then I should see up to 3 levels of indirect attribution
  And each level should be visually distinct
  And the total percentage should sum to 100%

Scenario: Attribution chain with quality scores
  Given I view an attribution chain with quality scores available
  When the chain is displayed
  Then each node should show its quality score
  And higher quality scores should correlate with larger token amounts
  And quality scores should be clearly labeled

Scenario: Attribution visualization empty state
  Given I view content with no attribution
  When I click "View Attribution"
  Then I should see an empty state message
  And the message should explain why there's no attribution
  And I should see guidance on building attribution

Scenario: Attribution chain mobile view
  Given I view attribution on mobile device
  When the chain is displayed
  Then it should be scrollable horizontally
  And nodes should be appropriately sized for touch
  And I should be able to zoom in/out if needed
```

### US-A003: Configure Attribution Parameters

**As a** system administrator
**I want to** configure how attribution strength is calculated
**So that** I can tune economic incentives for different behaviors

**INVEST Assessment:**
- **I**ndependent: Yes - configuration panel standalone
- **N**egotiable: Yes - parameters can be adjusted
- **V**alue: Yes - enables economic customization
- **E**stimable: Yes - standard config UI
- **S**mall: Yes - form-based configuration
- **T**estable: Yes - parameter validation possible

**Priority:** P0
**Complexity:** S

**Traceability:** SPEC_v1.md section "Architecture Questions"

**Acceptance Criteria:**

```gherkin
Scenario: Set linear decay parameters
  Given I am in the attribution configuration panel
  When I set decay rate to 50%
  Then level-1 should receive 50% of base tokens
  And level-2 should receive 25%
  And level-3 should receive 12.5%

Scenario: Configure quality weighting
  Given I enable quality-weighted attribution
  When content has quality score of 90
  Then attribution strength should be multiplied by 1.8
  And content with score 50 should have 1.0x multiplier
  And content with score 20 should have 0.8x multiplier

Scenario: Set cross-grove bonus
  Given I configure cross-grove bonus at 1.5x
  When grove-A content influences grove-B
  Then grove-A should receive 1.5x on their attribution portion
  And this bonus should be clearly marked in the UI
  And both groves should see the bonus in their transaction history

Scenario: Validate configuration changes
  Given I make invalid attribution configuration changes
  When I attempt to save
  Then I should see validation errors
  And the changes should not be applied
  And I should be prevented from breaking the system

Scenario: Preview configuration impact
  Given I adjust attribution parameters
  When I click "Preview Impact"
  Then I should see estimated token distributions
  And the preview should use sample data
  And I should understand the impact before applying changes
```

---

## Epic B: Token Economy

### US-B001: Calculate Base Token Rewards

**As a** grove operator
**I want to** see how many tokens I earn for tier advancements
**So that** I can predict my grove's economic rewards

**INVEST Assessment:**
- **I**ndependent: Yes - calculation logic standalone
- **N**egotiable: Yes - base token values configurable
- **V**alue: Yes - core economic transparency
- **E**stimable: Yes - simple arithmetic
- **S**mall: Yes - straightforward calculation
- **T**estable: Yes - deterministic inputs/outputs

**Priority:** P0
**Complexity:** S

**Traceability:** SPEC_v1.md section "Token Distribution Protocol"

**Acceptance Criteria:**

```gherkin
Scenario: Sprout tier base reward
  Given a sprout advances to sapling tier
  When rewards are calculated
  Then the base reward should be 10 tokens
  And this should be displayed in the UI as "Base: 10 tokens"
  And the calculation should be logged for audit

Scenario: Sapling tier base reward
  Given a sapling advances to tree tier
  When rewards are calculated
  Then the base reward should be 50 tokens
  And this should be 5x the sprout reward
  And the tier advancement should be clearly labeled

Scenario: Tree tier base reward
  Given a tree tier advancement occurs
  When rewards are calculated
  Then the base reward should be 250 tokens
  And this should be 5x the sapling reward
  And a "tree tier bonus" indicator should be shown

Scenario: Multiple simultaneous tier advancements
  Given I have 3 sprouts advancing at the same time
  When rewards are calculated
  Then each should receive 10 tokens (30 total)
  And each should be logged as a separate attribution event
  And the total balance increase should be 30 tokens

Scenario: Token balance updates
  Given my grove has 100 current tokens
  When I earn 50 tokens from tier advancement
  Then my new balance should be 150 tokens
  And the increase should be reflected in real-time
  And transaction history should show the addition
```

### US-B002: Apply Quality Multipliers

**As a** grove operator
**I want to** earn more tokens for higher quality content
**So that** there's an economic incentive to improve content quality

**INVEST Assessment:**
- **I**ndependent: Yes - multiplier calculation independent
- **N**egotiable: Yes - multiplier ranges adjustable
- **V**alue: Yes - aligns with S10 quality scores
- **E**stimable: Yes - straightforward multiplication
- **S**mall: Yes - simple mathematical operation
- **T**estable: Yes - quality score inputs have expected outputs

**Priority:** P0
**Complexity:** S

**Traceability:** REQUIREMENTS.md section "Quality-weighted reward distribution"

**Acceptance Criteria:**

```gherkin
Scenario: High quality multiplier (90+ score)
  Given content has quality score of 95
  When rewards are calculated
  Then the quality multiplier should be 2.0x
  And for a sprout (10 base), final reward should be 20 tokens
  And the multiplier should be clearly shown in the breakdown

Scenario: Medium quality multiplier (70 score)
  Given content has quality score of 70
  When rewards are calculated
  Then the quality multiplier should be 1.4x
  And for a tree (250 base), final reward should be 350 tokens
  And the score should be displayed next to the multiplier

Scenario: Low quality penalty (40 score)
  Given content has quality score of 40
  When rewards are calculated
  Then the quality multiplier should be 0.8x
  And a "low quality penalty" warning should be displayed
  And the reduced reward should be clearly explained

Scenario: No quality score available
  Given content has no quality score from S10
  When rewards are calculated
  Then the quality multiplier should default to 1.0x
  And no penalty or bonus should be applied
  And the system should log that quality score was missing

Scenario: Quality score integration from S10
  Given content has been scored by S10-SL-AICuration
  When token rewards are calculated
  Then the quality score should be retrieved automatically
  And the multiplier should be calculated in real-time
  And both systems should log the integration event
```

### US-B003: Distribute Network Effect Bonuses

**As a** grove operator
**I want to** earn bonuses when my content influences multiple groves
**So that** cross-grove sharing is economically rewarded

**INVEST Assessment:**
- **I**ndependent: Yes - bonus calculation standalone
- **N**egotiable: Yes - bonus multipliers configurable
- **V**alue: Yes - encourages network participation
- **E**stimable: Yes - conditional logic
- **S**mall: Yes - standard conditional calculation
- **T**estable: Yes - network state has expected bonuses

**Priority:** P0
**Complexity:** M

**Traceability:** SPEC_v1.md section "Network effect multipliers"

**Acceptance Criteria:**

```gherkin
Scenario: Single grove influence (no bonus)
  Given my content influences only my own grove
  When rewards are calculated
  Then no network bonus should be applied
  And the multiplier should be 1.0x
  And this should be clearly labeled as "internal influence only"

Scenario: Two grove influence (1.2x bonus)
  Given my content influences 2 groves total (including mine)
  When rewards are calculated
  Then I should receive a 1.2x network bonus
  And the bonus should be labeled "cross-grove influence"
  And both influenced groves should be listed

Scenario: Five grove influence (1.5x bonus)
  Given my content influences 5 groves total
  When rewards are calculated
  Then I should receive a 1.5x network bonus
  And the bonus threshold should be clearly documented
  And I should see which groves were influenced

Scenario: Network bonus calculation breakdown
  Given I receive a network bonus
  When I view the reward breakdown
  Then I should see base tokens
  And I should see quality multiplier
  And I should see network bonus multiplier
  And I should see final token amount

Scenario: Network bonus cap at 2.0x maximum
  Given my content influences 10+ groves
  When rewards are calculated
  Then the network bonus should cap at 2.0x
  And I should be notified of the cap
  And additional influence beyond threshold should not increase bonus
```

---

## Epic C: Reputation System

### US-C001: Track Reputation Scores

**As a** grove operator
**I want to** see my grove's reputation score and its components
**So that** I can understand how the network perceives my grove

**INVEST Assessment:**
- **I**ndependent: Yes - reputation tracking standalone
- **N**egotiable: Yes - scoring weights adjustable
- **V**alue: Yes - reputation affects economic rewards
- **E**stimable: Yes - aggregation logic
- **S**mall: Yes - score calculation and display
- **T**estable: Yes - inputs have predictable outputs

**Priority:** P0
**Complexity:** M

**Traceability:** SPEC_v1.md section "Reputation System"

**Acceptance Criteria:**

```gherkin
Scenario: Initial reputation score
  Given a new grove with no history
  When reputation is initialized
  Then the score should start at 50.0
  And all components (tier, quality, network) should be 0.0
  And the grove should be labeled "Developing"

Scenario: Reputation from tier contributions
  Given my grove has 10 tier advancements
  When reputation is calculated
  Then tierReputation should increase based on tier levels
  And tree contributions should count more than sprout contributions
  And the increase should be proportional to tier values

Scenario: Reputation from quality scores
  Given my content has average quality score of 85
  When reputation is calculated
  Then qualityReputation should increase
  And higher quality should increase reputation faster
  And the reputation gain should be weighted by token earnings

Scenario: Reputation from network influence
  Given my grove influences 5 other groves
  When reputation is calculated
  Then networkReputation should increase
  And the increase should reflect influence strength
  And cross-grove influence should count more than internal

Scenario: Overall reputation calculation
  Given my grove has component scores
  When total reputation is calculated
  Then it should be weighted sum of all components
  And the formula should be: total = (tier × 0.4) + (quality × 0.4) + (network × 0.2)
  And the breakdown should be visible in the UI
```

### US-C002: View Reputation Leaderboard

**As a** grove operator
**I want to** see how my grove's reputation compares to other groves
**So that** I can understand my grove's standing in the network

**INVEST Assessment:**
- **I**ndependent: Yes - leaderboard UI standalone
- **N**egotiable: Yes - sorting/filtering adjustable
- **V**alue: Yes - competitive motivation
- **E**stimable: Yes - standard list component
- **S**mall: Yes - table with sorting
- **T**estable: Yes - ordering and filtering tests

**Priority:** P0
**Complexity:** S

**Traceability:** DESIGN_SPEC.md section "Reputation Badge Component"

**Acceptance Criteria:**

```gherkin
Scenario: View top 10 reputation leaders
  Given I am on the reputation leaderboard page
  When the page loads
  Then I should see top 10 groves by reputation
  And each grove should show name, score, and level
  And my grove should be highlighted if in top 10

Scenario: Find my grove position
  Given my grove has reputation score of 75
  When I view the leaderboard
  Then I should see my grove's rank
  And I should see nearby groves (above and below)
  And my position should be clearly marked

Scenario: Reputation level badges
  Given groves have different reputation levels
  When displayed on leaderboard
  Then each grove should show reputation level badge
  And legendary (90+) should be purple
  And expert (70-89) should be blue
  And competent (50-69) should be green
  And developing (30-49) should be amber
  And novice (0-29) should be gray

Scenario: Filter leaderboard by time period
  Given I want to see reputation changes over time
  When I select "Last 30 days" filter
  Then the leaderboard should show reputation gains in that period
  And the ranking should be based on 30-day gains
  And I should see "Period: Last 30 days" indicator

Scenario: Search for specific grove
  Given I want to find a specific grove
  When I type grove name in search
  Then matching groves should be highlighted
  And if exact match, it should be scrolled into view
  And search should be case-insensitive
```

### US-C003: Configure Reputation Parameters

**As a** system administrator
**I want to** configure how reputation scores are calculated
**So that** I can tune the reputation economy

**INVEST Assessment:**
- **I**ndependent: Yes - configuration panel standalone
- **N**egotiable: Yes - all parameters adjustable
- **V**alue: Yes - enables economic customization
- **E**stimable: Yes - form-based configuration
- **S**mall: Yes - simple config UI
- **T**estable: Yes - parameter validation

**Priority:** P1
**Complexity:** S

**Traceability:** SPEC_v1.md section "Governance Model"

**Acceptance Criteria:**

```gherkin
Scenario: Adjust component weights
  Given I am in reputation configuration
  When I change tier weight to 50%
  Then the total reputation formula should update
  And quality and network should split remaining 50%
  And the change should be previewed before saving

Scenario: Set reputation decay rate
  Given I configure 5% monthly decay
  When reputation is calculated monthly
  Then inactive groves should lose 5% reputation
  And decay should only apply if no new contributions
  And the decay should be clearly documented

Scenario: Configure level thresholds
  Given I set legendary threshold to 95
  When a grove reaches 95 reputation
  Then the grove should level up to legendary
  And the level change should be announced
  And the new level should affect future rewards

Scenario: Validate reputation configuration
  Given I make conflicting reputation settings
  When I attempt to save
  Then validation errors should prevent saving
  And I should be informed of the conflict
  And guidance should be provided for resolution

Scenario: Export reputation configuration
  Given I have configured reputation settings
  When I export the configuration
  Then I should receive a JSON file
  And the file should include all parameters and explanations
  And this can be imported to other groves for consistency
```

---

## Epic D: Economic Dashboard

### US-D001: View Economic Overview

**As a** grove operator
**I want to** see my grove's economic metrics at a glance
**So that** I can quickly understand my grove's financial status

**INVEST Assessment:**
- **I**ndependent: Yes - dashboard UI standalone
- **N**egotiable: Yes - metrics configurable
- **V**alue: Yes - operational visibility
- **E**stimable: Yes - standard dashboard
- **S**mall: Yes - metric cards and charts
- **T**estable: Yes - visual regression tests

**Priority:** P1
**Complexity:** M

**Traceability:** DESIGN_SPEC.md section "Economic Dashboard"

**Acceptance Criteria:**

```gherkin
Scenario: Dashboard shows key metrics
  Given I am on the economic dashboard
  When the page loads
  Then I should see token balance, reputation score, network rank
  And each metric should have a trend indicator
  And metrics should load within 2 seconds

Scenario: Token balance card
  Given my grove has 1,234 tokens
  When I view the dashboard
  Then I should see a token balance card with amount
  And the card should show "1.2K" formatting for large numbers
  And there should be a trend arrow showing recent changes

Scenario: Reputation score display
  Given my grove has reputation score of 75.5
  When I view the dashboard
  Then I should see a reputation card with score and level
  And the level should be "Expert" (70-89 range)
  And there should be breakdown of components

Scenario: Network rank indicator
  Given my grove is ranked #12 out of 150 groves
  When I view the dashboard
  Then I should see a rank card
  And it should show position and total groves
  And there should be arrow showing rank trend

Scenario: Recent activity feed
  Given I have recent tier advancements
  When I view the dashboard
  Then I should see last 5 attribution events
  And each should show tokens earned and source
  And events should be timestamped and clickable
```

### US-D002: Analyze Attribution Flows

**As a** grove operator
**I want to** analyze how value flows through the network
**So that** I can optimize my grove's economic strategy

**INVEST Assessment:**
- **I**ndependent: Yes - analysis tools standalone
- **N**egotiable: Yes - chart types adjustable
- **V**alue: Yes - strategic planning support
- **E**stimable: Yes - standard data visualization
- **S**mall: Yes - charts and filters
- **T**estable: Yes - data accuracy tests

**Priority:** P1
**Complexity:** L

**Traceability:** DESIGN_SPEC.md section "Data Visualization Specifications"

**Acceptance Criteria:**

```gherkin
Scenario: Attribution inflow analysis
  Given I want to see what's earning me tokens
  When I view attribution inflow
  Then I should see breakdown of earned tokens by source
  And it should show percentage from own content vs. influenced content
  And I should see a pie chart visualization

Scenario: Attribution outflow tracking
  Given I want to see where my influence goes
  When I view attribution outflow
  Then I should see which groves my content influences
  And I should see influence strength values
  And the flow should be directional (source to target)

Scenario: Time range filtering
  Given I want to analyze attribution for specific period
  When I filter by "Last 30 days"
  Then the attribution analysis should update
  And I should see "Showing attribution for: Last 30 days"
  And the chart should reflect only that period

Scenario: Attribution flow diagram
  Given I view the flow visualization
  When the diagram loads
  Then I should see nodes for groves and edges for attribution
  And edge thickness should reflect attribution strength
  And hovering should show detailed information

Scenario: Export attribution analysis
  Given I want to analyze data externally
  When I click "Export Analysis"
  Then I should receive a CSV file with attribution data
  And the file should include grove names, amounts, and timestamps
  And the export should respect current filter settings
```

### US-D003: Monitor Network Health

**As a** system administrator
**I want to** monitor overall network economic health
**So that** I can identify issues early and ensure sustainability

**INVEST Assessment:**
- **I**ndependent: Yes - monitoring dashboard standalone
- **N**egotiable: Yes - metrics configurable
- **V**alue: Yes - network sustainability
- **E**stimable: Yes - standard monitoring
- **S**mall: Yes - metrics display
- **T**estable: Yes - data accuracy

**Priority:** P1
**Complexity:** M

**Traceability:** SPEC_v1.md section "Success Metrics"

**Acceptance Criteria:**

```gherkin
Scenario: Network-wide token supply tracking
  Given I am a system administrator
  When I view network health dashboard
  Then I should see total tokens in circulation
  And I should see tokens added per day (inflation rate)
  And I should see tokens spent per day

Scenario: Attribution coverage percentage
  Given I monitor attribution completeness
  When I view network health
  Then I should see % of content with full attribution chains
  And I should see trend over time (improving/stable/declining)
  And I should see target threshold (95%)

Scenario: Grove participation rate
  Given I track network engagement
  When I view network health
  Then I should see % of groves actively earning tokens
  And I should see new grove adoption rate
  And I should see active vs. dormant grove count

Scenario: Economic anomaly detection
  Given anomalies occur in the network
  When suspicious patterns are detected
  Then I should receive an alert
  And the alert should include details and suggested actions
  And anomalies should be logged for audit

Scenario: Network health trends
  Given I review network health over time
  When I select time range
  Then I should see key metrics trend charts
  And I should see healthy growth patterns
  And I should identify concerning trends
```

---

## Deferred to v1.1

### US-D004: Configure Economic Policies
**Reason:** Advanced configuration complexity not needed for MVP

**Original Flow:** Allow grove operators to configure inflation rates, token burn mechanisms, complex economic policies

**v1.1 Prerequisite:** Single-grove attribution working well, basic economics validated

### US-E001: Cross-Grove Token Transfers
**Reason:** Federation integration required, Phase 2 scope

**Original Flow:** Allow groves to transfer tokens directly to other groves

**v1.1 Prerequisite:** S9-SL-Federation complete, cross-grove attribution proven

### US-E002: Economic A/B Testing
**Reason:** Advanced feature, not needed for initial launch

**Original Flow:** Test different economic parameters to optimize network health

**v1.1 Prerequisite:** Sufficient network participation for statistically significant tests

### US-E003: Token Exchange Marketplace
**Reason:** Complex financial infrastructure, Phase 4 scope

**Original Flow:** Marketplace where groves can exchange tokens

**v1.1 Prerequisite:** Stable token economy, regulatory compliance review

---

## Open Questions

1. **Token Value Stability** — What prevents token inflation from devaluing rewards over time?
   - Context: If tokens are easy to earn, they become worthless
   - Decision Needed: Token burn mechanism, scarcity controls

2. **Attribution Disputes** — How are attribution disputes between groves resolved?
   - Context: Groves may disagree on influence strength
   - Decision Needed: Mediation process, governance mechanism

3. **Economic Parameter Changes** — How are changes to token economics communicated and adopted?
   - Context: Grove operators need predictability
   - Decision Needed: Versioning, migration, communication strategy

4. **Quality Score Integration** — What happens if S10-SL-AICuration is not complete?
   - Context: S11 depends on S10 for quality multipliers
   - Decision Needed: Fallback behavior, integration approach

5. **Minimum Reputation Threshold** — Should there be a minimum reputation to receive attribution?
   - Context: Prevents gaming by low-quality groves
   - Decision Needed: Threshold value, grace period for new groves

---

## Summary

| Story ID | Title | Priority | Complexity | Epic |
|----------|-------|----------|------------|------|
| US-A001 | Track Tier Advancement Attribution | P0 | M | Attribution |
| US-A002 | View Attribution Chain Visualization | P0 | M | Attribution |
| US-A003 | Configure Attribution Parameters | P0 | S | Attribution |
| US-B001 | Calculate Base Token Rewards | P0 | S | Token Economy |
| US-B002 | Apply Quality Multipliers | P0 | S | Token Economy |
| US-B003 | Distribute Network Effect Bonuses | P0 | M | Token Economy |
| US-C001 | Track Reputation Scores | P0 | M | Reputation |
| US-C002 | View Reputation Leaderboard | P0 | S | Reputation |
| US-C003 | Configure Reputation Parameters | P1 | S | Reputation |
| US-D001 | View Economic Overview | P1 | M | Dashboard |
| US-D002 | Analyze Attribution Flows | P1 | L | Dashboard |
| US-D003 | Monitor Network Health | P1 | M | Dashboard |

**Total v1.0 Stories:** 12 (8 P0, 4 P1)
**Deferred to v1.1:** 3 stories (advanced features)

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | US-A003 and US-C003 allow grove operators to configure economic parameters via UI, not code changes. Attribution rates, reputation weights, and token policies stored in database config. |
| **Capability Agnosticism** | All attribution calculations work with any quality assessment system. Token rewards calculated from tier levels (universal), quality scores (any source), and network influence (federation protocol). No model-specific dependencies. |
| **Provenance as Infrastructure** | Every user story requires complete audit trails. US-A001 records full attribution chains, US-B001 logs all token transactions, US-C001 tracks reputation changes. Who, what, when, why always documented. |
| **Organic Scalability** | Database schema designed for unlimited groves. US-D003 monitors network health at scale. Attribution calculations scale linearly. New economic features added via configuration, not code changes. |

---

**Phase:** Story Extraction + Acceptance Criteria Complete
**Next:** GROVE_EXECUTION_CONTRACT.md creation
**Status:** Ready for Development
