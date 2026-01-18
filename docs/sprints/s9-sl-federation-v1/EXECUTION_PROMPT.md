# Developer Execution Prompt: S9-SL-Federation-v1

## CRITICAL: Grove Execution Protocol Compliance Required

You are acting as **DEVELOPER** for sprint: **S9-SL-Federation-v1**

Your work **MUST** follow the **Grove Foundation Loop** methodology with all 9 artifacts. This is **MANDATORY** for all sprint development work.

---

## Grove Foundation Loop Requirements

### Phase 0: Pattern Check (MANDATORY)
Before any code changes, you **MUST** complete Phase 0:

```bash
# Check current branch
git branch --show-current

# Read PROJECT_PATTERNS.md
cat PROJECT_PATTERNS.md

# Check for domain contracts
if [ -f BEDROCK_SPRINT_CONTRACT.md ]; then
  echo "Bedrock contract applies"
  cat BEDROCK_SPRINT_CONTRACT.md
fi
```

**Document in DEVLOG.md:**
```markdown
## Pattern Check (Phase 0)

### Existing Patterns Extended
| Requirement | Existing Pattern | Extension Approach |
|------------|----------------|------------------|
| Federation Console | ConsoleLayout Pattern | Extend with federation tabs |
| Grove Registry | GroveObject Pattern | Extend with federation metadata |
| Trust System | Engagement Bus Pattern | Extend with trust events |

### New Patterns Proposed
None. All requirements met by extending existing patterns.
```

### Phase 0.5: Canonical Source Audit (MANDATORY)
**MUST** identify canonical homes and prevent duplication:

```markdown
## Canonical Source Audit

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|----------------|---------------|-----------------|---------------|
| Federation Console | src/foundation/consoles/* | New console | CREATE |
| Grove Registry API | src/core/federation/* | New directory | CREATE |
| Tier Mapping Engine | src/core/federation/* | New engine | CREATE |
| Trust Engine | src/core/federation/* | New engine | CREATE |
| UI Components | src/foundation/components/* | Extending Card | EXTEND |
```

### Phase 1: Repository Audit
Create `REPO_AUDIT.md` analyzing:
- Current federation-related files (if any)
- Existing component patterns to extend
- Technical debt considerations
- Integration points with S8-SL-MultiModel

### Phase 2: Specification
Read and internalize:
- `docs/sprints/s9-sl-federation-v1/SPEC.md` (Live Status + Attention Anchor)
- `docs/sprints/s9-sl-federation-v1/USER_STORIES.md`
- `docs/sprints/s9-sl-federation-v1/ARCHITECTURE.md` (you will create this)

### Phase 3: Architecture
Create `ARCHITECTURE.md` documenting:
- Data structures (FederatedGrove, TierMapping, FederationExchange schemas)
- File organization
- API contracts
- Integration points

### Phase 4: Migration Planning
Create `MIGRATION_MAP.md` with:
- Files to create
- Files to modify
- Files to delete
- Execution order
- Rollback procedures

### Phase 5: Decisions
Create `DECISIONS.md` with ADRs explaining:
- Why GroveObject pattern for federated groves
- Why decentralized trust model approach
- Why Federation Console in Foundation
- Rejected alternatives and why

### Phase 6: Story Breakdown
Create `SPRINTS.md` with:
- Epic breakdown with test requirements
- Commit sequence plan
- Build gates after each epic
- Attention anchor checkpoints

### Phase 7: Execution Prompt
This document serves as Phase 7. Follow it **exactly**.

### Phase 8: Execution
Track progress in `DEVLOG.md` with attention anchoring protocol.

---

## Your Responsibilities

1. **Execute sprint phases** per Grove Foundation Loop (Phases 0-8 above)
2. **Implement code changes** per GROVE_EXECUTION_CONTRACT.md specification
3. **Write status updates** to `.agent/status/current/{NNN}-{timestamp}-developer.md`
4. **Capture screenshots** for visual verification
5. **Complete REVIEW.html** with acceptance criteria evidence
6. **Run tests and fix failures** per build gates
7. **Follow DEX compliance** (all 4 pillars verified)

---

## Reference Documents

**PRIMARY REFERENCES:**
1. `docs/sprints/s9-sl-federation-v1/GROVE_EXECUTION_CONTRACT.md` - **EXECUTION BLUEPRINT**
2. `docs/sprints/s9-sl-federation-v1/USER_STORIES.md` - 8 stories with Gherkin criteria
3. `docs/sprints/s9-sl-federation-v1/DESIGN_SPEC.md` - UI wireframes and components
4. `docs/sprints/s9-sl-federation-v1/UX_STRATEGIC_REVIEW.md` - DEX compliance verification

**TEMPLATES:**
- Template: `.agent/status/ENTRY_TEMPLATE.md`
- Reference: `.agent/roles/developer.md`

**ARCHITECTURE:**
- Federation Pattern: New pattern for grove registry
- Foundation Console: Extend ConsoleLayout pattern
- Event Bus: Integrate with existing event system for trust events

---

## Implementation Requirements

### Build Gates (MANDATORY)

**Phase 1: Core Infrastructure**
```bash
npm run type-check
npm test -- --testPathPattern=federation
npm run build
npm run test:integration
```

**Phase 2: UI Components**
```bash
npm test -- --testPathPattern=components
npx playwright test --grep="federation"
npm run test:a11y
```

**Phase 3: Federation Protocol**
```bash
npm run test:integration -- federation
npx playwright test tests/e2e/federation.spec.ts
npm audit --audit-level moderate
```

**Phase 4: System Integration**
```bash
npm test && npm run build && npx playwright test
npm run lint && npm run type-check
npm run lighthouse-ci
```

**Final Verification**
```bash
npm run type-check && \
npm test && \
npm run build && \
npx playwright test && \
npm run lint && \
npm audit --audit-level moderate
```

### QA Gates (MANDATORY)

**Gate 1: Pre-Development**
- [ ] Baseline tests pass
- [ ] Console clean (zero errors)
- [ ] TypeScript compilation successful
- [ ] Security review completed

**Gate 2: Mid-Sprint (Daily)**
- [ ] Changed components tested
- [ ] Console clean after changes
- [ ] Core user journey verified (register → discover → connect)
- [ ] Unit tests passing (80%+ coverage)

**Gate 3: Pre-Merge (Epic Complete)**
- [ ] All tests green
- [ ] Console audit: ZERO errors
- [ ] Error boundary testing complete
- [ ] Network monitoring: All requests successful
- [ ] Full user journey passes (all 8 stories)
- [ ] Performance within thresholds (<500ms API, <2s page load)

**Gate 4: Sprint Complete**
- [ ] All QA gates passed
- [ ] Cross-browser testing (Chrome, mobile)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Visual regression tests pass
- [ ] Performance check (Lighthouse > 90)

---

## Visual Testing Requirements (SOP v2.0)

### Screenshot Directory Structure
```
docs/sprints/s9-sl-federation-v1/screenshots/
├── e2e/                          # E2E test screenshots
│   ├── us001-registration-wizard.png
│   ├── us001-registration-complete.png
│   ├── us002-grove-discovery.png
│   ├── us003-tier-mapping-editor.png
│   └── ...
├── visual/                       # Component visual tests
│   ├── grove-card-variants.png
│   ├── trust-badge-levels.png
│   └── ...
└── manual/                       # Manual verification screenshots
    ├── console-clean-state.png
    └── ...
```

### Screenshot Requirements (Minimum 50+ for Sprint-tier)

| Category | Minimum Count | Purpose |
|----------|---------------|---------|
| E2E Screenshots | 30+ | User story acceptance evidence |
| Visual Component | 15+ | Component state verification |
| Console/Debug | 5+ | Zero-error state proof |

### Test Data Seeding (CRITICAL)

**Before ANY E2E test, seed realistic data:**

```typescript
// Reference: tests/e2e/s9-sl-federation/_test-data.ts
import { seedFederationData, TEST_PRESETS } from './_test-data';

test.beforeEach(async ({ page }) => {
  await page.goto('/foundation/federation');
  await seedFederationData(page, 'registeredGrove');
  await page.reload();
  await page.waitForTimeout(1000);
});
```

**Test Preset Reference (from USER_STORIES.md):**
- `registeredGrove` - Grove with registration complete, credentials
- `connectedGroves` - Multiple connected groves with trust scores
- `tierMappings` - Pre-configured tier mappings
- `pendingRequests` - Knowledge exchange requests in queue

### REVIEW.html Template

Create `docs/sprints/s9-sl-federation-v1/REVIEW.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>S9-SL-Federation-v1 | Visual Review</title>
  <style>
    body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { border-bottom: 2px solid #2F5C3B; padding-bottom: 0.5rem; }
    .story { margin: 2rem 0; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
    .story h3 { color: #2F5C3B; margin-top: 0; }
    .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1rem; }
    .screenshot { background: #f5f5f5; padding: 0.5rem; border-radius: 4px; }
    .screenshot img { width: 100%; border: 1px solid #ccc; }
    .screenshot figcaption { font-size: 0.875rem; color: #666; margin-top: 0.5rem; }
    .status { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold; }
    .pass { background: #d4edda; color: #155724; }
    .fail { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>S9-SL-Federation-v1 | Visual Review</h1>
  <p><strong>Sprint:</strong> Federation Protocol Implementation</p>
  <p><strong>Date:</strong> [COMPLETION DATE]</p>
  <p><strong>Overall Status:</strong> <span class="status pass">PASS</span></p>

  <h2>User Story Evidence</h2>

  <div class="story">
    <h3>US-001: Grove Registration</h3>
    <p><strong>Acceptance:</strong> Complete registration wizard with tier system</p>
    <div class="screenshots">
      <figure class="screenshot">
        <img src="screenshots/e2e/us001-registration-wizard.png" alt="Registration wizard">
        <figcaption>Registration wizard with tier system configuration</figcaption>
      </figure>
      <figure class="screenshot">
        <img src="screenshots/e2e/us001-registration-complete.png" alt="Registration complete">
        <figcaption>Registration confirmation with credentials</figcaption>
      </figure>
    </div>
    <p><strong>Status:</strong> <span class="status pass">PASS</span></p>
  </div>

  <!-- Repeat for US-002 through US-008 -->

  <h2>Console Clean State</h2>
  <figure class="screenshot">
    <img src="screenshots/manual/console-clean-state.png" alt="Console clean">
    <figcaption>Zero console errors after full test suite</figcaption>
  </figure>

  <h2>Test Results Summary</h2>
  <ul>
    <li>Unit Tests: XX/XX passed</li>
    <li>Integration Tests: XX/XX passed</li>
    <li>E2E Tests: XX/XX passed</li>
    <li>Screenshots Captured: XX</li>
    <li>Console Errors: 0</li>
  </ul>

</body>
</html>
```

### Visual Verification Checklist

Before marking any phase complete:

- [ ] All E2E tests capture screenshots to `screenshots/e2e/`
- [ ] Screenshots named with user story prefix (e.g., `us001-*.png`)
- [ ] Console state captured (must show zero errors)
- [ ] REVIEW.html updated with new screenshots
- [ ] Visual regression baseline established (if new components)

---

## Key Files to Create

### Core Infrastructure (Phase 1)
```typescript
// src/core/federation/schema.ts
export interface FederatedGrove { ... }
export interface TierMapping { ... }
export interface FederationExchange { ... }
export interface TrustRelationship { ... }

// src/core/federation/registry.ts
export class GroveRegistry {
  async registerGrove(grove: FederatedGrove): Promise<void>
  async discoverGroves(criteria: DiscoveryCriteria): Promise<FederatedGrove[]>
  async getGrove(groveId: string): Promise<FederatedGrove | null>
  async updateGrove(groveId: string, updates: Partial<FederatedGrove>): Promise<void>
  async removeGrove(groveId: string): Promise<void>
}

// src/core/federation/mapping.ts
export class TierMappingEngine {
  async createMapping(sourceGrove: string, targetGrove: string, mappings: TierEquivalence[]): Promise<void>
  async validateMapping(mapping: TierMapping): Promise<ValidationResult>
  async mapTier(sourceGrove: string, targetGrove: string, tier: string): Promise<string>
  async getSemanticRules(sourceGrove: string, targetGrove: string): Promise<string[]>
}

// src/core/federation/exchange.ts
export class KnowledgeExchange {
  async requestKnowledge(targetGrove: string, criteria: RequestCriteria): Promise<ExchangeResult>
  async offerKnowledge(targetGrove: string, content: KnowledgeContent): Promise<void>
  async processRequest(requestId: string, response: KnowledgeContent): Promise<void>
  async getExchangeHistory(groveId: string): Promise<FederationExchange[]>
}

// src/core/federation/trust.ts
export class TrustEngine {
  async calculateTrustScore(groveId: string): Promise<number>
  async verifyGrove(groveId: string): Promise<VerificationResult>
  async establishTrust(groveA: string, groveB: string): Promise<TrustRelationship>
  async updateTrustScore(groveId: string, interaction: TrustInteraction): Promise<void>
}
```

### UI Components (Phase 2)
```typescript
// src/foundation/consoles/FederationConsole.tsx
export function FederationConsole(): JSX.Element { ... }

// src/foundation/components/GroveCard.tsx (extends Card)
export function GroveCard(props: GroveCardProps): JSX.Element { ... }

// src/foundation/components/TierMappingEditor.tsx
export function TierMappingEditor(props: TierMappingEditorProps): JSX.Element { ... }

// src/foundation/components/TrustBadge.tsx (extends Badge)
export function TrustBadge(props: TrustBadgeProps): JSX.Element { ... }

// src/foundation/components/FederationActivity.tsx
export function FederationActivity(): JSX.Element { ... }

// src/foundation/components/GroveRegistrationWizard.tsx
export function GroveRegistrationWizard(): JSX.Element { ... }

// src/foundation/components/KnowledgeRequest.tsx
export function KnowledgeRequest(): JSX.Element { ... }

// src/foundation/components/KnowledgeOffer.tsx
export function KnowledgeOffer(): JSX.Element { ... }
```

### API Endpoints (Phase 3)
```typescript
// server.js - Federation endpoints
app.post('/api/federation/register', registerGroveHandler)
app.get('/api/federation/discover', discoverGrovesHandler)
app.get('/api/federation/:groveId', getGroveHandler)
app.patch('/api/federation/:groveId', updateGroveHandler)
app.delete('/api/federation/:groveId', removeGroveHandler)

app.post('/api/federation/mapping/create', createTierMappingHandler)
app.get('/api/federation/mapping/:groveId', getTierMappingHandler)
app.patch('/api/federation/mapping/:mappingId', updateTierMappingHandler)

app.post('/api/federation/request', requestKnowledgeHandler)
app.post('/api/federation/offer', offerKnowledgeHandler)
app.get('/api/federation/exchanges', getExchangeHistoryHandler)

app.post('/api/federation/trust/verify', verifyGroveHandler)
app.get('/api/federation/trust/:groveId', getTrustScoreHandler)
app.post('/api/federation/trust/establish', establishTrustHandler)
```

---

## DEX Compliance Verification

### Pillar 1: Declarative Sovereignty
- ✅ Grove federation policies defined in config, not code
- ✅ Tier mapping rules declarative and configurable
- ✅ Trust policies externalized per grove
- ✅ Governance rules in configuration
- **VERIFY:** All federation behavior in config files, not hardcoded

### Pillar 2: Capability Agnosticism
- ✅ Federation protocol works with any tier system
- ✅ Trust model independent of underlying technology
- ✅ Knowledge exchange format universal
- ✅ Works with Gemini, Claude, local models, custom systems equally
- **VERIFY:** No model-specific assumptions in federation code

### Pillar 3: Provenance as Infrastructure
- ✅ Every exchange logged with full attribution
- ✅ Trust scores calculated and logged
- ✅ All federation actions in immutable audit log
- ✅ Tier mapping decisions recorded
- **VERIFY:** Complete provenance trail for all interactions

### Pillar 4: Organic Scalability
- ✅ New groves join without modifying core
- ✅ New tier systems via mapping config
- ✅ Trust models evolve without infrastructure changes
- ✅ Registry pattern supports unlimited growth
- **VERIFY:** Can add features without structural rewrites

---

## Attention Anchoring Protocol

**MANDATORY:** Re-read this section before every major decision.

### We Are Building
A decentralized federation protocol enabling grove-to-grove knowledge exchange while preserving autonomy, attribution, and semantic interoperability through configurable tier mappings.

### Success Looks Like
- 8 user stories complete and tested
- Federation console fully functional (register, discover, connect, exchange)
- Tier mapping enables semantic interoperability between grove taxonomies
- Trust system operational with cryptographic verification
- Cross-grove attribution preserved across all exchanges
- < 500ms API response time for federation operations
- All tests passing (unit, integration, E2E)

### We Are NOT
- Building centralized registry (federation is peer-to-peer)
- Hardcoding grove relationships or trust scores
- Ignoring DEX compliance (all 4 pillars required)
- Creating single points of failure (decentralized by design)
- Implementing blockchain registry (Phase 2 feature)

### Current Phase
Phase 7: Execution Prompt (follow this document exactly)

### Next Action
Execute Phase 0 (Pattern Check) immediately before any code changes

---

## Progress Tracking

### Write Status Updates
Location: `.agent/status/current/{NNN}-{timestamp}-developer.md`

Template:
```markdown
---
timestamp: 2026-01-16TXX:XX:XXZ
sprint: s9-sl-federation-v1
status: IN_PROGRESS
agent: developer
heartbeat: 2026-01-16TXX:XX:XXZ
severity: INFO
phase: Phase X - [Phase Name]
commit: [git commit hash]
---

## Progress
- [x] Completed task 1
- [ ] In progress: task 2
- [ ] Next: task 3

## Build Gate Status
- [ ] Phase 1 gate passed
- [ ] Phase 2 gate passed
- [ ] Phase 3 gate passed
- [ ] Phase 4 gate passed

## DEX Compliance
- [ ] Declarative Sovereignty verified
- [ ] Capability Agnosticism verified
- [ ] Provenance as Infrastructure verified
- [ ] Organic Scalability verified
```

---

## Verification Steps

### 1. Grove Registration Verification
```bash
curl -X POST http://localhost:3000/api/federation/register \
  -H 'Content-Type: application/json' \
  -d '{"groveId":"test-grove","name":"Test Grove","description":"Testing","tierSystem":{"tiers":["Seed","Sprout","Tree"]},"governanceModel":{"trustModel":"reputation"}}'

curl http://localhost:3000/api/federation/discover
```
**Expected**: Grove registered successfully, appears in discovery results

### 2. Tier Mapping Verification
```typescript
const mapping = await tierMappingEngine.createMapping(
  'grove-a',
  'grove-b',
  [
    { sourceTier: 'Seed', targetTier: 'Sprout', rule: 'Initial content' }
  ]
);
const validation = await tierMappingEngine.validateMapping(mapping);
expect(validation.isValid).toBe(true);
```
**Expected**: Mapping created successfully, validation passes

### 3. Knowledge Exchange Verification
```typescript
const request = await knowledgeExchange.requestKnowledge(
  'target-grove',
  {
    contentType: 'Research Analysis',
    minTier: 'Tree',
    keywords: ['distributed', 'inference']
  }
);
expect(request.exchangeId).toBeDefined();
```
**Expected**: Request sent successfully, tracked with exchange ID

### 4. Trust System Verification
```typescript
const trustScore = await trustEngine.calculateTrustScore('grove-id');
expect(trustScore).toBeGreaterThanOrEqual(0);
expect(trustScore).toBeLessThanOrEqual(100);

const verification = await trustEngine.verifyGrove('grove-id');
expect(verification.isVerified).toBeDefined();
```
**Expected**: Trust scores calculated correctly, verification completed

### 5. UI Component Verification
```bash
npm run dev
# Navigate to /foundation/federation
# Verify all components render and function
```
**Expected**: All UI components render correctly, interactions work

---

## Rollback Plan

### Scenario 1: Database Migration Failure
```bash
# Stop application
npm run stop

# Restore database from backup
pg_restore -d grove_foundation backup/pre_federation.sql

# Revert code changes
git checkout HEAD~1

# Restart application
npm run start

# Verify rollback
npm run health:check
```

### Scenario 2: Federation Protocol Security Vulnerability
```typescript
// Emergency disable all federation
app.post('/api/federation/*', (req, res) => {
  res.status(503).json({
    error: 'Federation disabled',
    reason: 'Emergency shutdown'
  });
});

// Log all attempts
auditLogger.critical('Emergency federation disable', {
  timestamp: new Date().toISOString(),
  endpoint: req.path
});
```

### Scenario 3: Trust System Calculation Error
```typescript
// Freeze trust score updates
trustEngine.pauseUpdates = true;

// Use cached trust scores
const cachedScores = await cache.get('trust_scores');
grove.trustScore = cachedScores[groveId] || grove.trustScore;

// Fix and recalculate
await trustEngine.recalculateAllScores();
trustEngine.pauseUpdates = false;
```

### Scenario 4: Tier Mapping Validation Error
```typescript
// Disable strict validation
tierMappingEngine.strictValidation = false;

// Allow manual mappings
// Fix validation logic
tierMappingEngine.strictValidation = true;
```

---

## On Completion

Write COMPLETE entry with:
- Test results
- Screenshots
- DEX compliance verification
- All 8 user stories passed
- All build gates passed

**Do NOT update Notion directly** - Sprintmaster handles that.

---

## Support

**Architecture questions**: UX Chief
**Product questions**: Product Manager
**Technical questions**: Sprint Owner

---

## Final Checklist

Before starting:
- [ ] Read GROVE_EXECUTION_CONTRACT.md
- [ ] Read USER_STORIES.md
- [ ] Read DESIGN_SPEC.md
- [ ] Understand DEX pillars
- [ ] Set up development environment

During execution:
- [ ] Follow Grove Foundation Loop (Phases 0-8)
- [ ] Update DEVLOG.md after each phase
- [ ] Run build gates after each phase
- [ ] Verify DEX compliance continuously
- [ ] Capture screenshots for evidence

Before completion:
- [ ] All 8 user stories complete
- [ ] All tests passing
- [ ] All build gates passed
- [ ] Visual regression tests pass
- [ ] REVIEW.html complete with evidence
- [ ] Status update: COMPLETE

---

**CRITICAL REMINDER:** This sprint follows the **Grove Foundation Loop** methodology. All 9 artifacts (REPO_AUDIT, SPEC, ARCHITECTURE, MIGRATION_MAP, DECISIONS, SPRINTS, EXECUTION_PROMPT, DEVLOG, CONTINUATION_PROMPT) must be created and maintained throughout execution.

**Your work will be evaluated on:**
1. Grove Foundation Loop compliance
2. DEX pillar adherence
3. Test coverage and quality
4. Visual verification evidence
5. Clean, maintainable code

Execute with precision. Document everything. Verify continuously.
