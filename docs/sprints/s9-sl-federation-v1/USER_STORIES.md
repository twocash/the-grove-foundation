# User Stories: S9-SL-Federation-v1

## Story Format
```
Given-When-Then
```

## Test Coverage
- Unit tests
- Integration tests
- E2E tests
- Visual tests

---

## E2E Test Specification

### Test Structure
All E2E tests follow the Grove Developer SOP v2.0 pattern:

```
tests/e2e/s9-sl-federation/
├── _test-data.ts           # Test presets and seeding utilities
├── _test-utils.ts          # Console capture, error filtering
├── grove-registration.spec.ts   # US-001 tests
├── grove-discovery.spec.ts      # US-002 tests
├── tier-mapping.spec.ts         # US-003 tests
├── knowledge-exchange.spec.ts   # US-004, US-005 tests
├── cross-grove-attribution.spec.ts  # US-006 tests
├── trust-governance.spec.ts     # US-007 tests
└── federation-management.spec.ts    # US-008 tests
```

### Visual Verification Points

| User Story | Screenshot | Verification |
|------------|------------|--------------|
| US-001 | `grove-registration-wizard.png` | Registration form visible, all fields present |
| US-001 | `grove-registration-complete.png` | Confirmation message, credentials displayed |
| US-002 | `grove-discovery-search.png` | Search results with trust badges |
| US-002 | `grove-discovery-filters.png` | Filter controls, pagination visible |
| US-003 | `tier-mapping-editor.png` | Side-by-side tier systems, visual connectors |
| US-003 | `tier-mapping-validation.png` | Validation errors displayed clearly |
| US-004 | `knowledge-request-form.png` | Request form with content type, tier, keywords |
| US-005 | `knowledge-offer-form.png` | Offer form with sharing policies |
| US-006 | `federated-content-attribution.png` | Full attribution chain visible |
| US-007 | `trust-connection-review.png` | Connection request details, approve/deny buttons |
| US-008 | `federation-dashboard.png` | Connection list, activity metrics |
| US-008 | `federation-analytics.png` | Charts, metrics, export controls |

### Test Data Seeding

**CRITICAL**: All E2E tests MUST seed realistic data before assertions.

```typescript
// tests/e2e/s9-sl-federation/_test-data.ts
import { Page } from '@playwright/test';

export const TEST_PRESETS = {
  registeredGrove: {
    'grove-federation-state': JSON.stringify({
      registered: true,
      groveId: 'grove-research-collective-7a3f',
      groveName: 'Research Collective',
      description: 'Distributed AI research network',
      tierSystem: ['Seed', 'Sprout', 'Sapling', 'Tree'],
      verificationStatus: 'verified',
      federationCredentials: { publicKey: 'pk_test_abc123' }
    })
  },

  connectedGroves: {
    'grove-federation-connections': JSON.stringify([
      {
        id: 'grove-ai-ethics-2b1c',
        name: 'AI Ethics Collective',
        trustLevel: 0.87,
        verificationStatus: 'verified',
        lastActivity: new Date().toISOString()
      },
      {
        id: 'grove-ml-research-9d4e',
        name: 'ML Research Network',
        trustLevel: 0.92,
        verificationStatus: 'verified',
        lastActivity: new Date().toISOString()
      }
    ])
  },

  tierMappings: {
    'grove-tier-mappings': JSON.stringify({
      'grove-ai-ethics-2b1c': {
        myTier: 'Tree',
        theirTier: 'Published',
        semanticRule: 'Mature, validated content ready for distribution'
      }
    })
  },

  pendingRequests: {
    'grove-knowledge-requests': JSON.stringify([
      {
        id: 'req-001',
        fromGrove: 'grove-ai-ethics-2b1c',
        contentType: 'Research Analysis',
        tier: 'Sapling',
        keywords: ['distributed inference'],
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    ])
  }
};

export async function seedFederationData(
  page: Page,
  preset: keyof typeof TEST_PRESETS
): Promise<void> {
  const data = TEST_PRESETS[preset];
  await page.evaluate((entries) => {
    Object.entries(entries).forEach(([key, value]) => {
      localStorage.setItem(key, value as string);
    });
  }, data);
}

export async function clearFederationData(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter(k => k.startsWith('grove-federation') || k.startsWith('grove-tier') || k.startsWith('grove-knowledge'))
      .forEach(k => localStorage.removeItem(k));
  });
}
```

### Screenshots Are EVIDENCE

| Requirement | Implementation |
|-------------|----------------|
| Directory | `docs/sprints/s9-sl-federation-v1/screenshots/e2e/` |
| Naming | `{story-id}-{description}.png` (e.g., `us001-registration-complete.png`) |
| Minimum | 50+ screenshots for Sprint-tier |
| Verification | Each screenshot must be visually verified before commit |
| Documentation | Screenshots referenced in REVIEW.html for stakeholder review |

---

## Acceptance Criteria

### US-001: Grove Registration

**As a** grove operator
**I want to** register my grove in the federation registry
**So that** other groves can discover and connect with me

**INVEST Assessment**:
- Independent: Yes (can be developed standalone)
- Negotiable: Yes (governance model flexible)
- Valuable: Yes (enables federation participation)
- Estimable: Yes (well-understood requirements)
- Small: Yes (fits in sprint)
- Testable: Yes (clear pass/fail criteria)

**Traceability**: Spec section "Goals - Establish federation protocol"

---

#### Scenario: Complete grove registration with custom tier system
**Given** I am a grove operator with verified identity
**And** I have a grove with defined tier system
**When** I navigate to Federation Console and click "Register Grove"
**And** I complete all registration steps:
- Grove name: "My Research Grove"
- Description: "Distributed AI research collective"
- Tier system: custom with 4 tiers (Seed, Sprout, Sapling, Tree)
- Governance: reputation-based trust, verified required
**Then** my grove should be registered in the federation registry
**And** I should receive a confirmation message
**And** my grove should appear in the grove registry with verification status
**And** I should receive federation credentials

#### Scenario: Import tier system from template
**Given** I am registering a grove
**When** I select "Use Template" for tier system
**And** I choose the "Academic Research" template
**Then** the tier system should be pre-populated with standard academic tiers
**And** I should be able to edit the imported tiers
**And** I should be able to add or remove tiers

#### Scenario: Validation errors during registration
**Given** I am in the grove registration wizard
**When** I leave required fields empty
**Or** I enter invalid data (empty name, malformed URL)
**Then** I should see validation errors for each invalid field
**And** I should not be able to proceed to the next step
**And** error messages should be specific and actionable

#### Scenario: Registration verification process
**Given** I have submitted grove registration
**When** the system validates my grove information
**Then** it should perform cryptographic verification of grove identity
**And** it should check reputation score if available
**And** it should verify tier system is well-formed
**And** it should either approve registration or provide specific rejection reasons

---

### US-002: Grove Discovery

**As a** grove operator
**I want to** discover other federated groves in the network
**So that** I can explore and exchange knowledge with them

**INVEST Assessment**:
- Independent: Yes (can be developed standalone)
- Negotiable: Yes (search/filter criteria flexible)
- Valuable: Yes (enables connection discovery)
- Estimable: Yes (standard search patterns)
- Small: Yes (fits in sprint)
- Testable: Yes (clear search/filter behavior)

**Traceability**: Spec section "Goals - Grove discovery"

---

#### Scenario: Search for groves by name
**Given** there are multiple registered groves in the federation
**When** I enter "Research" in the search box
**Then** I should see all groves with "Research" in their name or description
**And** results should be sorted by relevance
**And** each result should show grove name, description, trust level, and sprout count

#### Scenario: Filter groves by verification status
**Given** I am viewing the grove discovery page
**When** I select "Verified Only" from the verification filter
**Then** only groves with verified status should be displayed
**And** verified badges should be visible on each grove card
**And** unverified groves should be hidden

#### Scenario: Filter groves by activity status
**Given** I am viewing the grove discovery page
**When** I select "Active" from the activity filter
**Then** only groves with recent activity should be displayed
**And** "last seen" timestamps should be visible
**And** inactive groves should be hidden or clearly marked

#### Scenario: Browse groves with pagination
**Given** there are 50+ groves in the federation
**When** I view the discovery page
**Then** I should see the first 20 groves
**And** I should see pagination controls
**When** I click "Next Page"
**Then** I should see groves 21-40
**And** pagination should update correctly

#### Scenario: View grove profile
**Given** I have found a grove in discovery
**When** I click "View Profile"
**Then** I should see full grove information:
- Name, description, governance model
- Tier system with all tiers listed
- Trust score with breakdown
- Activity metrics
- Recent federation activity

---

### US-003: Content Tier Mapping

**As a** grove operator
**I want to** configure tier mapping between my grove and partner groves
**So that** content equivalence is preserved (my.tree ≈ your.published)

**INVEST Assessment**:
- Independent: Yes (can be developed standalone)
- Negotiable: Yes (mapping rules flexible)
- Valuable: Yes (enables semantic interoperability)
- Estimable: Yes (clear mapping interface)
- Small: Yes (fits in sprint)
- Testable: Yes (visual mapping validation)

**Traceability**: Spec section "Goals - Tier mapping schemas"

---

#### Scenario: Configure tier mapping with semantic equivalence
**Given** I have a connection with another grove
**When** I navigate to Tier Mapping for that grove
**And** I see side-by-side tier systems
**When** I map my "Seed" tier to their "Sprout" tier
**And** I add semantic rule: "Initial content, early stage"
**Then** the mapping should be saved with the semantic rule
**And** I should see a visual connector between the mapped tiers
**And** validation should confirm the mapping is consistent

#### Scenario: Validate tier mapping consistency
**Given** I am configuring tier mappings
**When** I create conflicting mappings (my "Seed" maps to both "Sprout" and "Tree")
**Then** I should see a validation error
**And** the error should explain the conflict
**And** I should be prevented from saving until resolved
**And** suggestions should be provided to resolve the conflict

#### Scenario: Add multiple tier mappings
**Given** I am configuring tier mappings for a grove with 7 tiers
**When** I map all tiers from my system to their system
**Then** I should see visual connectors for all mappings
**And** each mapping should have semantic rules
**And** I should be able to edit any mapping
**And** validation should confirm all tiers are mapped

#### Scenario: Import tier mapping from template
**Given** I am configuring tier mappings
**When** I select "Import Mapping"
**And** I choose a compatible tier system template
**Then** mappings should be pre-populated based on the template
**And** I should be able to review and edit the imported mappings
**And** semantic rules should be included from template

---

### US-004: Knowledge Request

**As a** grove operator
**I want to** request specific knowledge from a federated grove
**So that** I can access relevant content beyond my local grove

**INVEST Assessment**:
- Independent: Yes (can be developed standalone)
- Negotiable: Yes (request criteria flexible)
- Valuable: Yes (enables knowledge discovery)
- Estimable: Yes (clear request interface)
- Small: Yes (fits in sprint)
- Testable: Yes (request/response validation)

**Traceability**: Spec section "Goals - Knowledge exchange API"

---

#### Scenario: Request content by type
**Given** I am connected to a federated grove
**When** I navigate to Knowledge Request
**And** I select content type "Research Analysis"
**And** I specify tier "Tree" or higher
**And** I add keywords "distributed inference"
**Then** a request should be sent to the federated grove
**And** I should see confirmation the request was sent
**And** the request should include my grove attribution

#### Scenario: Receive knowledge response
**Given** I have sent a knowledge request
**When** the federated grove responds with content
**Then** I should receive the content with full federation metadata:
- Content with tier classification
- Origin grove attribution
- Tier mapping used
- Timestamp of exchange
- Provenance chain

#### Scenario: Request with rate limiting
**Given** I have exceeded the fair use rate limit
**When** I attempt to send another request
**Then** I should see a rate limit message
**And** the message should indicate when I can send another request
**And** the request should not be sent
**And** I should be encouraged to optimize my requests

#### Scenario: Request validation
**Given** I am creating a knowledge request
**When** I leave required fields empty
**Or** I specify invalid tier levels
**Then** I should see validation errors
**And** I should not be able to send the request
**And** error messages should guide me to correct the issues

---

### US-005: Knowledge Offer

**As a** grove operator
**I want to** offer knowledge to federated groves
**So that** I can contribute to the global knowledge network

**INVEST Assessment**:
- Independent: Yes (can be developed standalone)
- Negotiable: Yes (offer criteria flexible)
- Valuable: Yes (enables knowledge sharing)
- Estimable: Yes (clear offer interface)
- Small: Yes (fits in sprint)
- Testable: Yes (offer/acceptance validation)

**Traceability**: Spec section "Goals - Knowledge exchange API"

---

#### Scenario: Offer content to federated grove
**Given** I have content classified in my grove
**When** I navigate to Knowledge Offer
**And** I select content to share (specific sprouts or categories)
**And** I specify target grove or "any federated grove"
**And** I set sharing policies (attribution required, usage allowed)
**Then** the content should be offered to the specified grove(s)
**And** sharing policies should be included
**And** attribution requirements should be enforced

#### Scenario: Respond to knowledge request
**Given** I have received a knowledge request from another grove
**When** I review the request details
**And** I have relevant content to share
**And** the request meets my sharing policies
**Then** I should be able to respond with appropriate content
**And** I should include tier classification and attribution
**And** the requester should receive notification of the response

#### Scenario: Set default sharing policies
**Given** I am in Federation Settings
**When** I configure default sharing policies:
- Which tiers can be shared
- Which groves can receive content
- Attribution requirements
- Usage restrictions
**Then** these policies should apply to all knowledge offers
**And** I should be able to override policies per offer
**And** policies should be visible to receiving groves

---

### US-006: Cross-Grove Attribution

**As an** explorer
**I want to** see the origin grove and attribution for federated content
**So that** I understand where content comes from and who created it

**INVEST Assessment**:
- Independent: Yes (can be developed standalone)
- Negotiable: Yes (attribution display flexible)
- Valuable: Yes (enables content credibility)
- Estimable: Yes (standard attribution patterns)
- Small: Yes (fits in sprint)
- Testable: Yes (attribution display validation)

**Traceability**: Spec section "Goals - Cross-grove attribution"

---

#### Scenario: View federated content with full attribution
**Given** I am viewing content from a federated grove
**When** I examine the content display
**Then** I should see:
- Origin grove name and icon
- Original tier classification
- Tier mapping used (if different from my system)
- Timestamp of original creation
- Timestamp of federation exchange
- Link to view more from this grove (if public)

#### Scenario: Attribution preserved across tier mappings
**Given** I am viewing content with different tier classification
**When** I check the tier information
**Then** I should see both:
- Original tier classification (from origin grove)
- Mapped tier (in my grove's system)
**And** the mapping should be clearly indicated
**And** semantic equivalence should be explained

#### Scenario: Attribution chain for multi-hop federation
**Given** content has been federated through multiple groves
**When** I view the provenance information
**Then** I should see the complete chain:
- Origin grove
- Each intermediate grove (if applicable)
- Final grove providing content to me
**And** timestamps for each hop
**And** verification status for each grove

---

### US-007: Trust and Governance

**As a** grove operator
**I want to** establish trust relationships with other groves
**So that** I can confidently exchange knowledge and verify authenticity

**INVEST Assessment**:
- Independent: Yes (can be developed standalone)
- Negotiable: Yes (trust model flexible)
- Valuable: Yes (enables safe federation)
- Estimable: Yes (trust establishment clear)
- Small: Yes (fits in sprint)
- Testable: Yes (trust validation)

**Traceability**: Spec section "Goals - Trust and governance"

---

#### Scenario: Review connection request
**Given** I have received a connection request from another grove
**When** I review the request in my Federation Console
**Then** I should see:
- Requesting grove information (name, description, trust score)
- Their verification status
- Their tier system overview
- What content they want to exchange
- Their sharing policies
**And** I should have options to approve or deny
**And** I should be able to set conditions for the connection

#### Scenario: Configure trust requirements
**Given** I am in Federation Settings
**When** I configure trust requirements:
- Minimum trust score for connections
- Verification requirements
- Allowed grove types (academic, commercial, individual)
- Geographic restrictions (if any)
**Then** these requirements should be applied to all connection requests
**And** I should see how my requirements filter potential connections
**And** I should be able to override requirements for specific groves

#### Scenario: Establish cryptographic verification
**Given** I am establishing a connection with another grove
**When** I approve the connection
**Then** cryptographic verification should be performed:
- Identity verification for both groves
- Public key exchange
- Signature verification
- Trust score calculation based on verification
**And** verification status should be displayed
**And** verified badges should be shown on both sides

#### Scenario: Track trust score evolution
**Given** I have established connections with other groves
**When** I view my trust relationships
**Then** I should see:
- Current trust scores with each grove
- Historical trust score changes
- Factors contributing to trust scores
- Actions that increase or decrease trust
**And** I should receive notifications of score changes
**And** I should be able to appeal incorrect trust calculations

---

### US-008: Federation Management

**As a** grove operator
**I want to** manage my grove's federation settings and policies
**So that** I control what content I share and with whom

**INVEST Assessment**:
- Independent: Yes (can be developed standalone)
- Negotiable: Yes (settings flexible)
- Valuable: Yes (enables governance control)
- Estimable: Yes (settings interface clear)
- Small: Yes (fits in sprint)
- Testable: Yes (policy enforcement)

**Traceability**: Spec section "Goals - Federation management"

---

#### Scenario: Configure federation policies
**Given** I am in Federation Settings
**When** I configure federation policies:
- Auto-approve connections from verified groves
- Rate limits for outgoing requests
- Content types available for sharing
- Required attribution for incoming content
**Then** these policies should be saved and enforced
**And** I should see how policies affect federation behavior
**And** changes should require confirmation

#### Scenario: View connection management dashboard
**Given** I have active federation connections
**When** I navigate to Connection Management
**Then** I should see:
- List of all connections (active, pending, blocked)
- Activity metrics per connection
- Recent exchanges with each grove
- Trust status with each grove
**And** I should be able to filter and sort connections
**And** I should be able to suspend or resume connections

#### Scenario: View federation analytics
**Given** I am using federation features
**When** I navigate to Federation Analytics
**Then** I should see:
- Total knowledge requests sent/received
- Content exchanged by tier
- Trust score trends
- Active connection count
- Federation network growth
**And** I should be able to filter by time range
**And** I should be able to export analytics data

#### Scenario: Audit federation activity
**Given** I need to audit federation activities
**When** I access the Federation Audit Log
**Then** I should see:
- Chronological list of all federation actions
- Request details (who, what, when, why)
- Approval/denial decisions
- Content exchanges with tier mappings
- Trust relationship changes
**And** I should be able to filter by action type
**And** I should be able to search the log
**And** export functionality should be available

---

## Epic Breakdown

### Epic A: Grove Registry and Registration
**Stories**: US-001, US-002
**Goal**: Enable groves to register and discover each other
**Key Dependencies**:
- Database schema for grove registry
- Cryptographic verification system
- Search and filtering infrastructure

### Epic B: Tier Mapping and Semantic Interoperability
**Stories**: US-003
**Goal**: Enable semantic mapping between grove tier systems
**Key Dependencies**:
- Tier schema definition system
- Visual mapping editor UI
- Semantic rule validation

### Epic C: Knowledge Exchange Protocol
**Stories**: US-004, US-005
**Goal**: Enable bidirectional knowledge sharing
**Key Dependencies**:
- Request/response API
- Rate limiting system
- Content classification and attribution

### Epic D: Trust and Governance
**Stories**: US-007, US-008
**Goal**: Establish trust relationships and governance policies
**Key Dependencies**:
- Trust score calculation
- Policy enforcement system
- Audit logging infrastructure

### Epic E: Attribution and Provenance
**Stories**: US-006
**Goal**: Preserve attribution across grove boundaries
**Key Dependencies**:
- Provenance chain tracking
- Attribution display components
- Multi-hop federation support

---

## Test Strategy

### Unit Tests
- Grove registration validation
- Tier mapping logic
- Trust score calculation
- Policy enforcement
- Attribution chain generation

### Integration Tests
- Complete registration flow
- Discovery and connection establishment
- Knowledge request/response cycle
- Tier mapping validation
- Cross-grove attribution preservation

### E2E Tests
- Register grove → discover grove → establish connection
- Configure tier mapping → request knowledge → receive with attribution
- Set governance policies → test enforcement → verify audit trail
- Multi-grove federation scenario with chain of exchanges

### Visual Tests
- Grove card display with trust badges
- Tier mapping visual editor
- Federation console layout at all breakpoints
- Activity feed with proper timestamps
- Modal wizards (registration, mapping configuration)

---

## Deferred to Future Sprints

### US-009: Federation Network Visualization (S10)
**Reason**: Nice-to-have visualization, not core to federation
**Description**: Graph view of federation network showing connections and trust relationships

### US-010: Automated Tier Mapping Suggestions (S10)
**Reason**: AI-assisted mapping is advanced feature
**Description**: System suggests tier mappings based on semantic similarity

### US-011: Federation Mobile App (Future)
**Reason**: Native mobile is separate platform concern
**Description**: Mobile app for grove operators to manage federation

---

## Summary

| Story ID | Title | Priority | Complexity | Epic |
|----------|-------|----------|------------|------|
| US-001 | Grove Registration | P0 | M | A |
| US-002 | Grove Discovery | P0 | M | A |
| US-003 | Content Tier Mapping | P0 | L | B |
| US-004 | Knowledge Request | P0 | M | C |
| US-005 | Knowledge Offer | P0 | M | C |
| US-006 | Cross-Grove Attribution | P1 | M | E |
| US-007 | Trust and Governance | P0 | L | D |
| US-008 | Federation Management | P1 | M | D |

**Total Stories**: 8
**P0 Stories**: 7 (core functionality)
**P1 Stories**: 2 (important but not blocking)
**Estimated Effort**: 3-4 sprints (based on complexity)

**Minimum Viable Federation**: US-001, US-002, US-003, US-004, US-005, US-007, US-008
**Complete Federation**: All 8 stories

---

**Prepared By**: Product Manager
**Date**: 2026-01-16
**Gherkin Scenarios**: 32 total
**Next Stage**: Grove Execution Contract