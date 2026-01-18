# SPEC v1.0: S11-SL-Attribution
**Sprint:** S11-SL-Attribution
**Codename:** Knowledge Economy & Rewards
**Version:** 1.0
**Date:** 2026-01-17

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Stage 1: Sprintmaster (SPEC_v1.md) |
| **Status** | 🟡 In Progress |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-17T00:00:00Z |
| **Next Action** | Complete SPEC_v1.md → Stage 2: Product Manager |
| **Attention Anchor** | Re-read before proceeding to Stage 2 |

---

## Sprint Overview

### Codename
**S11-SL-Attribution: Knowledge Economy & Rewards**

### EPIC Context
**Phase:** 7 of 7 (FINAL PHASE)
**Parent EPIC:** Observable Knowledge System
**Previous Phases:** S5-S10 built the foundation; S11 completes the economic layer

### Strategic Goal
Enable a **decentralized knowledge economy** where tier-based attribution flows create sustainable economic incentives for knowledge creation, curation, and discovery across federated groves.

---

## Strategic Goals

### 1. Tier-Based Attribution Economy
Create a system where **tier = unit of value** in the knowledge economy. Every piece of knowledge has an economic value that flows through attribution chains to reward contributors proportionally.

### 2. Token Distribution Protocol
Design and implement a **fair distribution mechanism** for reward tokens based on:
- Quality scores (from S10)
- Tier levels (sprout/sapling/tree)
- Attribution depth (direct vs. indirect contributions)
- Network impact (cross-grove propagation)

### 3. Reputation System
Build a **reputation economy** where grove operators and communities earn reputation points through:
- Consistent high-quality contributions
- Cross-grove knowledge sharing
- Federated learning participation
- Community stewardship

### 4. Attribution Flow Visualization
Create **transparent visualization** of how value flows through the network:
- Direct attribution (who contributed what)
- Indirect attribution (who influenced indirectly)
- Tier-based credit allocation
- Network effect multipliers

### 5. Economic Incentive Alignment
Design incentives that align individual grove interests with **network-wide knowledge quality**:
- Higher quality = higher rewards
- Cross-grove sharing = additional bonuses
- Federated participation = reputation boosts
- Quality curation = long-term value

---

## Dependencies

### Required Dependencies
- ✅ **S10-SL-AICuration:** Quality scoring system (CRITICAL - cannot proceed without)
  - Status: 🎯 ready (Sequential Handoff complete)
  - Required for: Quality-based token distribution, tier-validated rewards
  - Impact: Blocking if not complete

### Optional Dependencies
- 🔄 **S9-SL-Federation:** Cross-grove federation protocol (HIGHLY RECOMMENDED)
  - Status: 🎯 ready
  - Used for: Cross-grove attribution flows, federated reputation
- 🔄 **S8-SL-MultiModel:** AI model support (NICE TO HAVE)
  - Status: 🚀 in-progress
  - Used for: Enhanced quality assessment, model-specific rewards

### Platform Prerequisites
- ✅ **Sprout System (S15):** Content capture and provenance
- ✅ **Grove Infrastructure:** Federation, quality, analytics
- ✅ **Database System:** Supabase with full schema support

---

## Architecture Questions

### Core Economic Model

**Q1: What is the fundamental unit of value?**
- **Option A:** Tier-based (sprout=1, sapling=5, tree=25)
- **Option B:** Quality-based (0-100 points × quality score)
- **Option C:** Hybrid (tier × quality × network impact)
- **Decision Needed:** Define base unit and scaling factors

**Q2: How do tokens flow through attribution chains?**
- **Option A:** Linear decay (50% to direct, 25% to indirect, 12.5% to meta)
- **Option B:** Quality-weighted (higher quality = deeper propagation)
- **Option C:** Network effect multiplier (cross-grove bonus)
- **Decision Needed:** Attribution algorithm design

**Q3: What prevents gaming and manipulation?**
- **Option A:** Quality score thresholds (minimum quality to earn rewards)
- **Option B:** Reputation requirements (minimum reputation to receive attribution)
- **Option C:** Federated validation (network consensus on attribution)
- **Decision Needed:** Anti-gaming mechanisms

### Token Economics

**Q4: What is the token supply model?**
- **Option A:** Fixed supply (deflationary, scarce)
- **Option B:** Bounded inflation (controlled minting)
- **Option C:** Performance-based (rewards earned, not minted)
- **Decision Needed:** Monetary policy for knowledge economy

**Q5: How are rewards calculated and distributed?**
- **Option A:** Real-time (immediate distribution on tier advancement)
- **Option B:** Periodic (daily/weekly batches)
- **Option C:** Milestone-based (significant contributions only)
- **Decision Needed:** Distribution frequency and triggers

**Q6: What is the role ofgrove operators vs. communities?**
- **Option A:** Operator-controlled (grove admins manage distribution)
- **Option B:** Community-governed (collective decision-making)
- **Option C:** Protocol-automated (smart contract-style distribution)
- **Decision Needed:** Governance model for attribution

### Reputation System

**Q7: What actions earn reputation?**
- **Quality contributions:** High-quality sprouts/saplings/trees
- **Cross-grove sharing:** Knowledge exported to other groves
- **Federated participation:** Contributing to federated learning
- **Community stewardship:** Helping other groves improve
- **Decision Needed:** Reputation scoring algorithm

**Q8: How does reputation affect rewards?**
- **Option A:** Reputation multiplier (higher reputation = higher rewards)
- **Option B:** Reputation threshold (minimum reputation for certain rewards)
- **Option C:** Reputation decay (must maintain through continued contributions)
- **Decision Needed:** Reputation-reward relationship

### Cross-Grove Dynamics

**Q9: How do groves exchange value?**
- **Option A:** Direct token exchange (grove-to-grove transfers)
- **Option B:** Network pool (shared pool distributed by contribution)
- **Option C:** Bilateral contracts (custom sharing agreements)
- **Decision Needed:** Inter-grove value exchange mechanism

**Q10: What happens to unattributed knowledge?**
- **Option A:** Burns (unattributed = destroyed)
- **Option B:** Pool (goes to community fund)
- **Option C:** Finders fee (small reward to discoverer)
- **Decision Needed:** Unattributed content policy

---

## Open Questions

### Economic Sustainability

1. **Long-term token value:** How do we ensure tokens maintain value over time?
2. **Bubbles and crashes:** What prevents speculative bubbles in knowledge tokens?
3. **Network effects:** How do we bootstrap initial attribution when few groves participate?
4. **Market makers:** Who provides liquidity for token exchange?

### Governance

5. **Protocol changes:** How are economic parameters updated (token supply, attribution rates)?
6. **Dispute resolution:** How are attribution disputes settled between groves?
7. **Veto power:** What happens if a grove disagrees with network decisions?
8. **Emergency stops:** How do we halt distribution if critical bugs are found?

### Technical Implementation

9. **Blockchain vs. database:** Do we need decentralized ledger or is database sufficient?
10. **Real-time vs. batch:** What's the right balance for attribution calculations?
11. **Privacy:** How do we protect contributor anonymity while maintaining attribution?
12. **Scalability:** Can the system handle millions of attribution events daily?

### User Experience

13. **Wallet integration:** Do grove operators need cryptocurrency wallets?
14. **Fiat onramps:** How do non-technical users convert tokens to currency?
15. **Education:** How do we teach operators about the economic model?
16. **Transparency:** How much economic data should be public vs. private per grove?

---

## Initial Scope (MVP)

### Phase 1: Core Attribution (Sprint 1)
**Goal:** Basic tier-based reward calculation within a single grove

**Deliverables:**
- Attribution tracking database schema
- Tier-to-token conversion algorithm
- Basic reward calculation engine
- Grove-local attribution visualization
- Simple reputation tracking

**Non-Goals:**
- Cross-grove attribution (wait for S9)
- Advanced reputation features
- Token exchange marketplace
- Complex economic modeling

### Phase 2: Federation Integration (Sprint 2)
**Goal:** Cross-grove attribution flows via S9 federation protocol

**Deliverables:**
- Federation-aware attribution routing
- Cross-grove token transfers
- Network-wide reputation aggregation
- Inter-grove attribution visualization
- Basic economic dashboard

**Non-Goals:**
- Complex economic policies
- Automated market making
- Dispute resolution system
- Mobile wallet integration

### Phase 3: Advanced Economics (Sprint 3)
**Goal:** Sophisticated economic incentives and reputation system

**Deliverables:**
- Quality-weighted attribution
- Network effect multipliers
- Reputation-based rewards
- Economic health metrics
- Governance mechanisms

**Non-Goals:**
- Blockchain integration
- Fiat currency conversion
- Speculative trading features
- Complex derivatives

### Phase 4: Ecosystem & Tools (Sprint 4)
**Goal:** Complete knowledge economy ecosystem

**Deliverables:**
- Attribution marketplace
- Token exchange interface
- Economic education materials
- Advanced analytics
- Community governance tools

**Non-Goals:**
- Central bank functions
- Monetary policy tools
- International compliance
- Enterprise integrations

---

## Success Metrics

### Economic Health Metrics

1. **Attribution Coverage:** % of content with complete attribution chains
   - Target: > 95% within 6 months
   - Measurement: Database query of content vs. attributed content

2. **Token Velocity:** Average time from earning to spending tokens
   - Target: 7-30 days (healthy circulation)
   - Measurement: Token transaction logs

3. **Network Participation:** % of groves actively participating in attribution
   - Target: > 80% within 1 year
   - Measurement: Active groves with attribution events

4. **Quality Correlation:** Correlation between quality scores and token rewards
   - Target: r > 0.7 (strong positive correlation)
   - Measurement: Statistical analysis of quality vs. rewards

### User Experience Metrics

5. **Attribution Transparency:** % of users who can trace attribution to source
   - Target: > 90%
   - Measurement: User surveys and usability testing

6. **Economic Understanding:** % of operators who understand token economics
   - Target: > 75% after education materials
   - Measurement: Surveys and quiz completion rates

7. **Reward Satisfaction:** Average satisfaction score with reward distribution
   - Target: > 4.0/5.0
   - Measurement: User feedback surveys

8. **Dispute Rate:** % of attribution events disputed
   - Target: < 5%
   - Measurement: Dispute tracking system

### Technical Performance Metrics

9. **Attribution Latency:** Time from tier advancement to reward distribution
   - Target: < 5 seconds
   - Measurement: System performance monitoring

10. **System Availability:** Uptime of attribution system
    - Target: > 99.9%
    - Measurement: Uptime monitoring

11. **Database Performance:** Query time for attribution chains
    - Target: < 100ms for 99% of queries
    - Measurement: Database performance metrics

12. **Economic Calculation Accuracy:** % of reward calculations correct
    - Target: 100% (zero-tolerance for errors)
    - Measurement: Automated validation tests

---

## Risk Assessment

### Technical Risks

**HIGH: Complex Economic Calculations**
- **Risk:** Bugs in attribution algorithm could cause unfair distribution
- **Impact:** Users lose trust, economic collapse
- **Mitigation:** Extensive testing, gradual rollout, rollback mechanisms
- **Monitoring:** Real-time validation, anomaly detection

**HIGH: Database Scalability**
- **Risk:** Attribution tracking could overwhelm database with millions of events
- **Impact:** System slowdown, data loss, poor UX
- **Mitigation:** Efficient schema design, indexing strategy, archival system
- **Monitoring:** Query performance metrics, storage usage alerts

**MEDIUM: Real-Time Attribution Processing**
- **Risk:** Computing attribution in real-time could cause delays
- **Impact:** Poor user experience, timeout errors
- **Mitigation:** Caching strategy, async processing, batch options
- **Monitoring:** Response time metrics, queue depth monitoring

### Economic Risks

**HIGH: Token Inflation**
- **Risk:** Excessive token minting could devalue rewards
- **Impact:** Users lose motivation, economy collapses
- **Mitigation:** Strict monetary policy, capped supply, burning mechanisms
- **Monitoring:** Token inflation rate, price stability tracking

**MEDIUM: Attribution Gaming**
- **Risk:** Users could manipulate attribution for personal gain
- **Impact:** Unfair distribution, network distrust
- **Mitigation:** Quality thresholds, reputation requirements, consensus validation
- **Monitoring:** Anomaly detection, reputation score analysis

**MEDIUM: Network Effects Failure**
- **Risk:** Not enough groves participate to create valuable network
- **Impact:** Low rewards, slow adoption, failure to launch
- **Mitigation:** Bootstrap incentives, education, early adopter bonuses
- **Monitoring:** Network participation metrics, growth rate tracking

### Product Risks

**HIGH: User Education Gap**
- **Risk:** Users don't understand economic model, low adoption
- **Impact:** Failed product launch, wasted development effort
- **Mitigation:** Comprehensive education materials, onboarding, support
- **Monitoring:** User comprehension surveys, support ticket analysis

**MEDIUM: Complex UX**
- **Risk:** Attribution system too complex for average users
- **Impact:** Low engagement, high churn
- **Mitigation:** Progressive disclosure, tooltips, guided tours
- **Monitoring:** UX testing, task completion rates, feature adoption

**LOW: Competitive Response**
- **Risk:** Larger platforms could copy and out-compete
- **Impact:** Market share loss, reduced network effects
- **Mitigation:** Strong community building, unique value proposition, patent protection
- **Monitoring:** Competitor analysis, market share tracking

### Governance Risks

**HIGH: Protocol Changes**
- **Risk:** Economic parameter changes could alienate users
- **Impact:** Fork in network, community split
- **Mitigation:** Community governance, transparent decision-making, backward compatibility
- **Monitoring:** Community sentiment analysis, governance participation

**MEDIUM: Disputes and Appeals**
- **Risk:** Attribution disputes could create conflict between groves
- **Impact:** Network fragmentation, legal issues
- **Mitigation:** Clear dispute resolution process, mediation tools, appeals system
- **Monitoring:** Dispute tracking, resolution time metrics

---

## Initial Technical Approach

### Core Components

**1. Attribution Engine**
- Calculate reward distribution for tier advancements
- Track attribution chains (who influenced whom)
- Apply quality-weighted attribution algorithms
- Generate network effect multipliers

**2. Token Management**
- Track token balances per grove/operator
- Execute reward distributions
- Manage token transfers (future: cross-grove)
- Handle token burning (penalties, etc.)

**3. Reputation System**
- Calculate reputation scores from multiple factors
- Track reputation changes over time
- Apply reputation multipliers to rewards
- Provide reputation decay mechanisms

**4. Economic Dashboard**
- Visualize attribution flows
- Show token balances and transaction history
- Display network health metrics
- Provide governance tools

### Data Model (Initial)

```sql
-- Attribution tracking
CREATE TABLE attribution_events (
  id UUID PRIMARY KEY,
  content_id TEXT NOT NULL,
  source_grove_id TEXT NOT NULL,
  target_grove_id TEXT NOT NULL,
  attribution_strength DECIMAL(3,2) NOT NULL, -- 0.0 to 1.0
  tier_level INTEGER NOT NULL, -- sprout=1, sapling=2, tree=3
  quality_score DECIMAL(5,2),
  tokens_awarded DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL
);

-- Token balances
CREATE TABLE token_balances (
  grove_id TEXT PRIMARY KEY,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  earned_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  spent_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Reputation tracking
CREATE TABLE reputation_scores (
  grove_id TEXT PRIMARY KEY,
  score DECIMAL(10,2) NOT NULL DEFAULT 0,
  tier_reputation DECIMAL(10,2) NOT NULL DEFAULT 0,
  quality_reputation DECIMAL(10,2) NOT NULL DEFAULT 0,
  network_reputation DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Reward distribution
CREATE TABLE reward_distributions (
  id UUID PRIMARY KEY,
  grove_id TEXT NOT NULL,
  source_content_id TEXT NOT NULL,
  tokens DECIMAL(10,2) NOT NULL,
  reputation_change DECIMAL(5,2),
  distribution_type TEXT NOT NULL, -- 'tier_advancement', 'quality_bonus', etc.
  created_at TIMESTAMPTZ NOT NULL
);
```

### API Endpoints (Initial)

```
# Attribution
POST /api/attribution/calculate
GET /api/attribution/chain/:contentId
GET /api/attribution/network/:groveId

# Tokens
GET /api/tokens/balance/:groveId
GET /api/tokens/history/:groveId
POST /api/tokens/transfer (future)

# Reputation
GET /api/reputation/:groveId
GET /api/reputation/leaderboard
POST /api/reputation/update

# Rewards
GET /api/rewards/distributions/:groveId
GET /api/rewards/pending
POST /api/rewards/calculate
```

### Quality Integration

The attribution system will integrate with S10-SL-AICuration quality scores:

```typescript
interface AttributionCalculation {
  baseTokens: number; // From tier (sprout/sapling/tree)
  qualityMultiplier: number; // From quality score (0.5x to 2.0x)
  networkBonus: number; // From cross-grove attribution
  reputationMultiplier: number; // From reputation score
  finalTokens: number; // baseTokens × qualityMultiplier × networkBonus × reputationMultiplier
}
```

---

## DEX Alignment

### Pillar 1: Declarative Sovereignty
**Status:** ✅ COMPLIANT
- Economic parameters (token supply, attribution rates) stored in database config
- Grove operators can configure local economic policies
- Attribution algorithms defined in configuration, not hardcoded
- No central authority controls token distribution

### Pillar 2: Capability Agnosticism
**Status:** ✅ COMPLIANT
- Attribution works regardless of underlying AI model or system
- Quality scores from any assessment system can feed into attribution
- Grove-specific reward preferences configurable
- No dependency on specific technology stack

### Pillar 3: Provenance as Infrastructure
**Status:** ✅ COMPLIANT
- Every token transaction has full attribution chain
- Complete audit trail of all economic events
- Who earned what, when, and why - fully traceable
- Attribution flows preserve full provenance

### Pillar 4: Organic Scalability
**Status:** ✅ COMPLIANT
- New groves join attribution network without infrastructure changes
- Economic policies can evolve without breaking changes
- Token system scales to unlimited groves
- Attribution algorithms support network growth

---

## Strategic Significance

### The Knowledge Economy Vision
This sprint completes the **Observable Knowledge EPIC** by adding economic incentives. The flow is:

```
Content Creation → Quality Assessment (S10) → Attribution Economy (S11)
```

**Before S11:** Knowledge is created, quality is assessed, but no economic incentive for quality
**After S11:** Knowledge creation → quality assessment → fair economic rewards

### Revolutionary Aspect
**Decentralized knowledge economy without central authority:**
- No platform takes a cut
- Value flows directly to contributors
- Economic incentives align with quality
- Network effects benefit all participants

### Competitive Advantage
**No other platform enables:**
- Tier-based token rewards for knowledge quality
- Cross-grove attribution without data sharing
- Decentralized knowledge economy
- Quality-weighted economic incentives

### Long-Term Vision
**5-Year Trajectory:**
- Year 1: Single-grove attribution (S11 Phase 1)
- Year 2: Cross-grove federation (S11 Phase 2)
- Year 3: Advanced economics (S11 Phase 3)
- Year 4: Ecosystem tools (S11 Phase 4)
- Year 5: **Thousands of groves in global knowledge economy**

---

## Next Steps

### Immediate (Stage 1 Complete)
- [x] SPEC_v1.md created
- [x] Strategic goals defined
- [x] Dependencies mapped
- [x] Architecture questions identified
- [x] Risk assessment complete

### Stage 2: Product Manager
- [ ] Requirements document with user stories
- [ ] Gherkin acceptance criteria
- [ ] Data model validation
- [ ] API specification

### Stage 3: Designer
- [ ] Attribution visualization designs
- [ ] Economic dashboard wireframes
- [ ] Token flow diagrams
- [ ] UX patterns for complex economics

### Stage 4: UI Chief
- [ ] Design compliance review
- [ ] Pattern consistency verification
- [ ] Accessibility assessment
- [ ] Component reuse strategy

### Stage 5: UX Chief
- [ ] DEX compliance verification
- [ ] Strategic alignment assessment
- [ ] Innovation evaluation
- [ ] Risk validation

### Stage 6: Product Manager
- [ ] Detailed user stories
- [ ] GROVE_EXECUTION_CONTRACT
- [ ] Implementation roadmap
- [ ] Success criteria definition

### Stage 7: Sprintmaster
- [ ] NOTION_ENTRY.md
- [ ] EXECUTION_PROMPT.md
- [ ] Notion update
- [ ] Developer handoff

---

## Success Definition

### Minimum Viable Success
- Basic tier-to-token conversion working
- Single-grove attribution tracking
- Simple reputation scores
- Core economic dashboard
- Quality score integration (S10)

### Exceptional Success
- Full cross-grove attribution network
- Sophisticated economic modeling
- Active token exchange marketplace
- Strong community governance
- Economic sustainability proven

### World-Changing Success
- **Thousands of groves** participating in knowledge economy
- **Billions of tokens** distributed for knowledge quality
- **Decentralized knowledge economy** becomes self-sustaining
- **New economic model** adopted by other platforms
- **Paradigm shift:** Quality content creators earn sustainable income

---

**SPEC Version:** 1.0
**Next Stage:** Stage 2: Product Manager → REQUIREMENTS.md
**Confidence:** High (90%)
