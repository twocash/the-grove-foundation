# Architecture: S9-SL-Federation-v1

> Phase 2 of Grove Foundation Loop
> Created: 2026-01-18

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BEDROCK LAYER                            │
│   ┌────────────────────────────────────────────────────────┐   │
│   │              FederationConsole UI                        │   │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│   │   │ Registry │ │ Mapping  │ │ Exchange │ │  Trust   │   │   │
│   │   │   Tab    │ │   Tab    │ │   Tab    │ │   Tab    │   │   │
│   │   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │   │
│   └────────┼────────────┼────────────┼────────────┼─────────┘   │
│            │            │            │            │              │
├────────────┼────────────┼────────────┼────────────┼──────────────┤
│            ▼            ▼            ▼            ▼              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     HOOKS LAYER                          │   │
│   │  useGroveRegistry  useTierMapping  useKnowledgeExchange │   │
│   │                    useTrustEngine                        │   │
│   └────────────────────────────┬────────────────────────────┘   │
│                                │                                 │
├────────────────────────────────┼─────────────────────────────────┤
│                                ▼                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     CORE LAYER                           │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│   │  │ TierMapping │  │  Knowledge  │  │    Trust        │  │   │
│   │  │   Engine    │  │  Exchange   │  │    Engine       │  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│   │                                                          │   │
│   │  ┌────────────────────────────────────────────────────┐ │   │
│   │  │           Federation Schema (Types)                 │ │   │
│   │  │  FederatedGrove | TierMapping | TrustRelationship  │ │   │
│   │  └────────────────────────────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   SUPABASE LAYER                         │   │
│   │                                                          │   │
│   │  federated_groves | tier_mappings | federation_exchanges│   │
│   │                    trust_relationships                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                          DATABASE                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Structures

### 2.1 FederatedGrove Schema

```typescript
// src/core/schema/federation.ts

/**
 * Represents an external grove that can participate in federation.
 * Follows GroveObject pattern (Pattern 7).
 */
export interface FederatedGrove extends GroveObject<FederatedGrovePayload> {
  meta: GroveObjectMeta & {
    type: 'federated-grove';
  };
}

export interface FederatedGrovePayload {
  // Identity
  groveId: string;           // Unique grove identifier
  name: string;              // Display name
  description: string;       // Grove purpose
  endpoint: string;          // API endpoint URL

  // Status
  status: GroveStatus;
  connectionStatus: 'connected' | 'pending' | 'blocked' | 'none';
  lastHealthCheck?: string;  // ISO timestamp

  // Tier System
  tierSystem: TierSystemDefinition;

  // Trust
  trustScore: number;        // 0-100
  trustLevel: TrustLevel;    // 'new' | 'established' | 'trusted' | 'verified'

  // Metrics
  sproutCount: number;
  exchangeCount: number;

  // Federation metadata
  registeredAt: string;
  lastActivityAt?: string;
  capabilities: string[];    // e.g., ['knowledge-exchange', 'tier-mapping']
}

export type GroveStatus = 'active' | 'inactive' | 'degraded' | 'blocked';
export type TrustLevel = 'new' | 'established' | 'trusted' | 'verified';

export interface TierSystemDefinition {
  name: string;              // e.g., "botanical", "academic", "numeric"
  tiers: TierDefinition[];
  description?: string;
}

export interface TierDefinition {
  id: string;                // e.g., "seed", "tier-1"
  name: string;              // Display name
  level: number;             // Numeric order (1 = lowest)
  icon?: string;             // Emoji or Material Symbol
  color?: string;            // CSS color
  description?: string;
}
```

### 2.2 TierMapping Schema

```typescript
/**
 * Defines semantic equivalence between tiers of two groves.
 * Bidirectional: maps both directions.
 */
export interface TierMapping extends GroveObject<TierMappingPayload> {
  meta: GroveObjectMeta & {
    type: 'tier-mapping';
  };
}

export interface TierMappingPayload {
  // Relationship
  sourceGroveId: string;     // "our" grove
  targetGroveId: string;     // "their" grove

  // Mapping rules
  mappings: TierEquivalence[];

  // Validation
  status: 'draft' | 'proposed' | 'accepted' | 'rejected';
  validatedAt?: string;
  validatedBy?: string;      // User or system

  // Trust impact
  confidenceScore: number;   // 0-1, how confident in mapping
}

export interface TierEquivalence {
  sourceTierId: string;      // Tier ID from source grove
  targetTierId: string;      // Tier ID from target grove
  equivalenceType: 'exact' | 'approximate' | 'subset' | 'superset';
  notes?: string;            // Human explanation
}
```

### 2.3 FederationExchange Schema

```typescript
/**
 * Represents a knowledge exchange request/offer between groves.
 */
export interface FederationExchange extends GroveObject<FederationExchangePayload> {
  meta: GroveObjectMeta & {
    type: 'federation-exchange';
  };
}

export interface FederationExchangePayload {
  // Parties
  requestingGroveId: string;
  providingGroveId: string;

  // Content
  type: 'request' | 'offer';
  contentType: 'sprout' | 'concept' | 'research' | 'insight';
  contentId?: string;        // If specific content requested
  query?: string;            // If search-based request

  // Status
  status: ExchangeStatus;

  // Tier context
  sourceTier: string;
  mappedTier?: string;       // After tier mapping applied

  // Tracking
  initiatedAt: string;
  completedAt?: string;

  // Attribution
  tokenValue?: number;       // Economic value of exchange
}

export type ExchangeStatus =
  | 'pending'      // Awaiting approval
  | 'approved'     // Approved, processing
  | 'completed'    // Successfully exchanged
  | 'rejected'     // Denied
  | 'expired';     // Timed out
```

### 2.4 TrustRelationship Schema

```typescript
/**
 * Bidirectional trust relationship between two groves.
 */
export interface TrustRelationship extends GroveObject<TrustRelationshipPayload> {
  meta: GroveObjectMeta & {
    type: 'trust-relationship';
  };
}

export interface TrustRelationshipPayload {
  // Parties (alphabetically ordered for consistency)
  groveIds: [string, string];

  // Trust metrics
  overallScore: number;      // 0-100

  // Component scores
  components: {
    exchangeSuccess: number;  // Historical success rate
    tierAccuracy: number;     // Mapping accuracy
    responseTime: number;     // Avg response latency score
    contentQuality: number;   // Quality of exchanged content
  };

  // History
  exchangeCount: number;
  successfulExchanges: number;
  lastExchangeAt?: string;

  // Status
  level: TrustLevel;
  verifiedAt?: string;
  verifiedBy?: 'system' | 'admin' | 'community';
}
```

---

## 3. Engine Architecture

### 3.1 TierMappingEngine

```typescript
// src/core/engine/tierMappingEngine.ts

export class TierMappingEngine {
  /**
   * Suggest tier mappings between two grove tier systems.
   * Uses semantic similarity and level ordering.
   */
  suggestMappings(
    source: TierSystemDefinition,
    target: TierSystemDefinition
  ): TierEquivalence[];

  /**
   * Apply mapping to translate a tier reference.
   */
  mapTier(
    mapping: TierMapping,
    tierId: string,
    direction: 'source-to-target' | 'target-to-source'
  ): string | null;

  /**
   * Validate that a mapping covers all tiers in both systems.
   */
  validateMapping(mapping: TierMapping): ValidationResult;

  /**
   * Calculate confidence score for a mapping.
   */
  calculateConfidence(mapping: TierMapping): number;
}
```

### 3.2 KnowledgeExchange

```typescript
// src/core/engine/knowledgeExchange.ts

export class KnowledgeExchange {
  /**
   * Initiate a request for content from another grove.
   */
  createRequest(params: {
    targetGroveId: string;
    contentType: ExchangeContentType;
    query?: string;
    contentId?: string;
    tier?: string;
  }): Promise<FederationExchange>;

  /**
   * Create an offer to share content with another grove.
   */
  createOffer(params: {
    targetGroveId: string;
    contentId: string;
    tier: string;
  }): Promise<FederationExchange>;

  /**
   * Approve or reject a pending exchange.
   */
  processExchange(
    exchangeId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<FederationExchange>;

  /**
   * Complete an approved exchange with content delivery.
   */
  completeExchange(
    exchangeId: string,
    content: unknown
  ): Promise<FederationExchange>;
}
```

### 3.3 TrustEngine

```typescript
// src/core/engine/trustEngine.ts

export class TrustEngine {
  /**
   * Calculate overall trust score for a grove.
   */
  calculateTrustScore(groveId: string): Promise<number>;

  /**
   * Get detailed trust breakdown.
   */
  getTrustComponents(groveId: string): Promise<TrustComponents>;

  /**
   * Update trust based on exchange outcome.
   */
  recordExchangeOutcome(
    exchangeId: string,
    outcome: 'success' | 'failure' | 'partial'
  ): Promise<void>;

  /**
   * Determine trust level from score.
   */
  getTrustLevel(score: number): TrustLevel;

  /**
   * Get trust history for a grove pair.
   */
  getTrustHistory(
    groveId1: string,
    groveId2: string
  ): Promise<TrustHistoryEntry[]>;
}

export const TRUST_THRESHOLDS = {
  new: { min: 0, max: 25 },
  established: { min: 25, max: 50 },
  trusted: { min: 50, max: 75 },
  verified: { min: 75, max: 100 }
};
```

---

## 4. File Organization

```
src/
├── core/
│   ├── schema/
│   │   ├── federation.ts          # FederatedGrove, TierMapping types
│   │   └── index.ts               # Add exports
│   │
│   ├── engine/
│   │   ├── tierMappingEngine.ts   # Tier equivalence logic
│   │   ├── knowledgeExchange.ts   # Exchange protocol
│   │   └── trustEngine.ts         # Trust calculation
│   │
│   └── federation/                # EPIC5 Sprint-based (unchanged)
│       ├── schema.ts
│       ├── registry.ts
│       ├── protocol.ts
│       ├── provenance.ts
│       └── index.ts
│
├── bedrock/
│   └── consoles/
│       └── FederationConsole/
│           ├── FederationConsole.config.ts
│           ├── GroveCard.tsx
│           ├── GroveEditor.tsx
│           ├── GroveRegistrationWizard.tsx
│           ├── TierMappingCard.tsx
│           ├── TierMappingEditor.tsx
│           ├── ExchangeCard.tsx
│           ├── ExchangeRequestModal.tsx
│           ├── TrustScoreCard.tsx
│           ├── TrustBreakdown.tsx
│           ├── component-registry.ts
│           ├── hook-registry.ts
│           └── json-render/
│               ├── federation-dashboard-registry.tsx
│               ├── trust-metrics-registry.tsx
│               └── exchange-activity-registry.tsx
│
└── hooks/
    ├── useGroveRegistry.ts        # Grove CRUD
    ├── useTierMapping.ts          # Mapping CRUD
    ├── useKnowledgeExchange.ts    # Exchange operations
    └── useTrustEngine.ts          # Trust queries

supabase/
└── migrations/
    └── 029_federation_groves.sql

tests/
└── e2e/
    └── s9-sl-federation/
        ├── _test-data.ts
        ├── grove-registry.spec.ts
        ├── tier-mapping.spec.ts
        ├── knowledge-exchange.spec.ts
        └── trust-governance.spec.ts
```

---

## 5. API Contracts

### 5.1 Supabase Table Schema

```sql
-- 029_federation_groves.sql

-- Table: federated_groves
CREATE TABLE federated_groves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  endpoint TEXT,
  status TEXT DEFAULT 'active',
  connection_status TEXT DEFAULT 'none',
  tier_system JSONB NOT NULL,
  trust_score INTEGER DEFAULT 0,
  trust_level TEXT DEFAULT 'new',
  sprout_count INTEGER DEFAULT 0,
  exchange_count INTEGER DEFAULT 0,
  capabilities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_health_check TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ
);

-- Table: tier_mappings
CREATE TABLE tier_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_grove_id TEXT REFERENCES federated_groves(grove_id),
  target_grove_id TEXT REFERENCES federated_groves(grove_id),
  mappings JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  confidence_score NUMERIC(3,2) DEFAULT 0,
  validated_at TIMESTAMPTZ,
  validated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_grove_id, target_grove_id)
);

-- Table: federation_exchanges
CREATE TABLE federation_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_grove_id TEXT REFERENCES federated_groves(grove_id),
  providing_grove_id TEXT REFERENCES federated_groves(grove_id),
  type TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_id TEXT,
  query TEXT,
  status TEXT DEFAULT 'pending',
  source_tier TEXT,
  mapped_tier TEXT,
  token_value NUMERIC(10,2),
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: trust_relationships
CREATE TABLE trust_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grove_id_1 TEXT NOT NULL,
  grove_id_2 TEXT NOT NULL,
  overall_score INTEGER DEFAULT 0,
  components JSONB DEFAULT '{}',
  exchange_count INTEGER DEFAULT 0,
  successful_exchanges INTEGER DEFAULT 0,
  level TEXT DEFAULT 'new',
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  last_exchange_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(grove_id_1, grove_id_2),
  CHECK(grove_id_1 < grove_id_2)  -- Enforce alphabetical ordering
);

-- Indexes
CREATE INDEX idx_groves_status ON federated_groves(status);
CREATE INDEX idx_groves_trust ON federated_groves(trust_level);
CREATE INDEX idx_exchanges_status ON federation_exchanges(status);
CREATE INDEX idx_exchanges_groves ON federation_exchanges(requesting_grove_id, providing_grove_id);

-- RLS policies (basic - extend as needed)
ALTER TABLE federated_groves ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE federation_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_relationships ENABLE ROW LEVEL SECURITY;
```

### 5.2 Hook Interfaces

```typescript
// hooks/useGroveRegistry.ts
interface UseGroveRegistry {
  groves: FederatedGrove[];
  loading: boolean;
  error: Error | null;

  registerGrove: (data: CreateGroveInput) => Promise<FederatedGrove>;
  updateGrove: (id: string, data: Partial<FederatedGrovePayload>) => Promise<void>;
  deregisterGrove: (id: string) => Promise<void>;
  discoverGroves: (criteria: DiscoveryCriteria) => Promise<FederatedGrove[]>;
  requestConnection: (groveId: string) => Promise<void>;
}

// hooks/useTierMapping.ts
interface UseTierMapping {
  mappings: TierMapping[];

  createMapping: (source: string, target: string) => Promise<TierMapping>;
  suggestMappings: (source: string, target: string) => TierEquivalence[];
  updateMapping: (id: string, mappings: TierEquivalence[]) => Promise<void>;
  validateMapping: (id: string) => ValidationResult;
}

// hooks/useKnowledgeExchange.ts
interface UseKnowledgeExchange {
  incomingRequests: FederationExchange[];
  outgoingRequests: FederationExchange[];
  recentActivity: FederationExchange[];

  createRequest: (params: CreateExchangeParams) => Promise<FederationExchange>;
  createOffer: (params: CreateOfferParams) => Promise<FederationExchange>;
  approveExchange: (id: string) => Promise<void>;
  rejectExchange: (id: string, reason?: string) => Promise<void>;
}

// hooks/useTrustEngine.ts
interface UseTrustEngine {
  getTrustScore: (groveId: string) => number;
  getTrustLevel: (groveId: string) => TrustLevel;
  getTrustHistory: (groveId: string) => TrustHistoryEntry[];
  getTrustBreakdown: (groveId: string) => TrustComponents;
}
```

---

## 6. Component Architecture

### 6.1 FederationConsole Tabs

| Tab | Components | Data Hook |
|-----|------------|-----------|
| Registry | GroveCard, GroveEditor, GroveRegistrationWizard | useGroveRegistry |
| Tier Mapping | TierMappingCard, TierMappingEditor | useTierMapping |
| Exchange | ExchangeCard, ExchangeRequestModal | useKnowledgeExchange |
| Trust | TrustScoreCard, TrustBreakdown | useTrustEngine |

### 6.2 json-render Dashboards

| Dashboard | Registry | Signals |
|-----------|----------|---------|
| FederationOverview | federation-dashboard-registry | groves_connected, pending_requests, trust_avg |
| TrustMetrics | trust-metrics-registry | trust_distribution, recent_changes |
| ExchangeActivity | exchange-activity-registry | request_volume, success_rate, by_content_type |

---

## 7. Integration Points

### 7.1 With Attribution (S11)

```typescript
// Token value for exchanges
interface ExchangeAttribution {
  exchangeId: string;
  baseTokens: number;
  tierMultiplier: number;
  trustMultiplier: number;
  totalTokens: number;
}
```

### 7.2 With Multi-Model (S8)

```typescript
// Grove capabilities include model support
interface GroveCapability {
  type: 'model' | 'knowledge' | 'tier-mapping' | 'exchange';
  modelId?: string;      // If type === 'model'
  modelProvider?: string;
}
```

### 7.3 With Event Bus

```typescript
// Federation events extend existing bus
type FederationBusEvent =
  | { type: 'GROVE_REGISTERED'; payload: FederatedGrove }
  | { type: 'GROVE_CONNECTED'; payload: { groveId: string } }
  | { type: 'EXCHANGE_REQUESTED'; payload: FederationExchange }
  | { type: 'EXCHANGE_COMPLETED'; payload: FederationExchange }
  | { type: 'TRUST_UPDATED'; payload: { groveId: string; score: number } };
```

---

## 8. DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Tier systems defined declaratively in TierSystemDefinition |
| **Capability Agnosticism** | Grove capabilities list model-independent |
| **Provenance as Infrastructure** | All exchanges tracked with full provenance |
| **Organic Scalability** | Trust levels, tier mappings support arbitrary grove count |

---

## 9. Performance Considerations

1. **Lazy loading** - Load grove details on demand, not in list
2. **Pagination** - Use `PaginatedResult` for grove discovery
3. **Caching** - Cache trust scores (update on exchange)
4. **Batch operations** - Bulk tier mapping validation

---

## 10. Security Considerations

1. **Endpoint validation** - Validate grove API endpoints before connecting
2. **Trust gating** - Require minimum trust for certain exchange types
3. **Rate limiting** - Limit exchange requests per time period
4. **Content validation** - Validate exchanged content matches claimed tier

---

*Architecture complete. Proceed to Phase 3: Test Data Seeding.*
