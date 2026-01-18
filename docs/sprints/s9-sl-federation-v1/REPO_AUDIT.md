# Repository Audit: S9-SL-Federation-v1

> Phase 1 of Grove Foundation Loop
> Created: 2026-01-18

## Executive Summary

S9-SL-Federation-v1 builds **Grove-level federation** (cross-community) on top of the existing **Sprint-level federation** (EPIC5-SL-Federation, internal microservices). The existing infrastructure provides messaging, capability negotiation, and provenance tracking between sprints. S9 extends this with:

1. **FederatedGrove** - External grove identity and registration
2. **TierMappingEngine** - Semantic equivalence across groves
3. **KnowledgeExchange** - Request/offer protocol for concepts
4. **TrustEngine** - Trust score calculation between groves
5. **FederationConsole** - Bedrock admin UI

---

## 1. Existing Federation Infrastructure (EPIC5)

### 1.1 Schema Layer (`src/core/federation/schema.ts`)

| Type | Purpose | Reusable for S9? |
|------|---------|------------------|
| `SprintRegistration` | Internal sprint identity | NO - Sprint-specific |
| `SprintId` | Sprint identifier | NO - Need GroveId |
| `Capability` | Feature negotiation | YES - Extend for grove capabilities |
| `FederationMessage` | Cross-sprint messaging | YES - Extend for grove messaging |
| `FederatedProvenance` | Origin tracking | YES - Core provenance pattern |
| `FederatedGroveObject<T>` | Federated object wrapper | YES - Use as-is |
| `ProvenanceChain` | Audit trail | YES - Core verification |
| `FederationConfig` | Runtime configuration | YES - Extend with grove settings |
| `DiscoveryCriteria` | Search/filter | YES - Adapt for grove discovery |
| `FederationEventType` | Event bus events | YES - Add grove-specific events |

### 1.2 Registry Layer (`src/core/federation/registry.ts`)

| Class | Purpose | S9 Approach |
|-------|---------|-------------|
| `FederationRegistry` | Sprint registration/discovery | CREATE parallel `GroveRegistry` |

**Key Methods (port to grove context):**
- `registerSprint()` → `registerGrove()`
- `discoverSprints()` → `discoverGroves()`
- `heartbeat()` → Adapt for grove health
- `deregister()` → `deregisterGrove()`

### 1.3 Protocol Layer (`src/core/federation/protocol.ts`)

| Class | Purpose | S9 Approach |
|-------|---------|-------------|
| `FederationProtocol` | Messaging + capability negotiation | EXTEND with knowledge exchange |

**Key Methods (extend for S9):**
- `negotiateCapability()` → Add tier mapping negotiation
- `sendMessage()` → Add knowledge exchange messages
- `broadcast()` → Add grove-wide announcements

### 1.4 Provenance Layer (`src/core/federation/provenance.ts`)

| Class | Purpose | S9 Approach |
|-------|---------|-------------|
| `ProvenanceBridge` | Cross-sprint provenance | REUSE - Works for groves |

**Fully reusable:** `attachMetadata()`, `traceProvenance()`, `verifyChain()`

---

## 2. GroveObject Model Integration

### 2.1 Current State (`src/core/schema/grove-object.ts`)

The `GroveObjectMeta` already includes federation fields from EPIC5:

```typescript
export interface GroveObjectMeta {
  // ... existing fields ...

  // Federation metadata (EPIC5-SL-Federation v1)
  federationId?: string;
  federationPath?: string[];
}
```

### 2.2 S9 Extension

Add new GroveObjectTypes:

| New Type | Purpose |
|----------|---------|
| `federated-grove` | Grove registration identity |
| `tier-mapping` | Tier equivalence configuration |
| `federation-exchange` | Knowledge exchange record |
| `trust-relationship` | Trust score between groves |

### 2.3 Type Registration

```typescript
// Add to GroveObjectType union in grove-object.ts
| 'federated-grove'     // Sprint: S9-SL-Federation v1
| 'tier-mapping'        // Sprint: S9-SL-Federation v1
| 'federation-exchange' // Sprint: S9-SL-Federation v1
| 'trust-relationship'  // Sprint: S9-SL-Federation v1
```

---

## 3. Attribution Integration (S11 Patterns)

### 3.1 Token Economy Pattern (`src/core/schema/attribution.ts`)

S11's attribution system provides patterns for:

| Pattern | S11 Implementation | S9 Parallel |
|---------|-------------------|-------------|
| Tier configs | `REPUTATION_TIER_CONFIGS` | `GROVE_TIER_CONFIGS` |
| Multipliers | `getQualityMultiplier()` | `getTrustMultiplier()` |
| Score calculation | `calculateTokens()` | `calculateTrustScore()` |
| Events | `AttributionEvent` | `FederationEvent` |

### 3.2 Reusable Infrastructure

| Asset | Location | S9 Use |
|-------|----------|--------|
| Tier labels | `TIER_LABELS` | Adapt for grove tiers |
| Quality ranges | `QUALITY_MULTIPLIER_RANGES` | Adapt for trust levels |
| Zod schemas | `*Schema` constants | Pattern for validation |
| Type guards | `is*()` functions | Pattern for safety |

---

## 4. Bedrock Console Patterns

### 4.1 ExperienceConsole Pattern (`src/bedrock/consoles/ExperienceConsole/`)

**Established console structure:**
```
ExperienceConsole/
├── ExperienceConsole.config.ts  # Tab + metric config
├── *Card.tsx                     # Read display (json-render)
├── *Editor.tsx                   # Write forms (React)
├── json-render/
│   └── *-registry.tsx           # json-render catalogs
└── hook-registry.ts             # Data hooks
```

### 4.2 Components to Create

| Component | Pattern | Purpose |
|-----------|---------|---------|
| `FederationConsole.config.ts` | ExperienceConsole.config.ts | Tab/metric config |
| `GroveCard.tsx` | FeatureFlagCard.tsx | Grove list display |
| `GroveEditor.tsx` | FeatureFlagEditor.tsx | Grove registration form |
| `TierMappingCard.tsx` | QualityThresholdCard.tsx | Mapping display |
| `TierMappingEditor.tsx` | QualityThresholdEditor.tsx | Mapping config form |
| `ExchangeCard.tsx` | AttributionPanel.tsx | Exchange request display |
| `TrustScoreCard.tsx` | New | Trust relationship display |
| `json-render/federation-registry.tsx` | signals-registry.tsx | Dashboard charts |

### 4.3 Hook Pattern

Follow `useLifecycleModelData.ts` pattern:
- `useGroveRegistryData.ts` - Grove CRUD
- `useTierMappingData.ts` - Mapping CRUD
- `useKnowledgeExchangeData.ts` - Exchange operations
- `useTrustEngineData.ts` - Trust calculations

---

## 5. Database Integration

### 5.1 Existing Migration Pattern

Latest migration: `028_quality_scoring.sql` / `028_attribution_economy.sql`

### 5.2 Required Migration: `029_federation_groves.sql`

```sql
-- Tables needed per GROVE_EXECUTION_CONTRACT.md:
CREATE TABLE federated_groves (...);
CREATE TABLE tier_mappings (...);
CREATE TABLE federation_exchanges (...);
CREATE TABLE trust_relationships (...);
```

---

## 6. Test Infrastructure

### 6.1 Existing E2E Pattern (`tests/e2e/`)

| Pattern | Example | S9 Parallel |
|---------|---------|-------------|
| Test data seeding | `s11-sl-attribution/_test-data.ts` | `s9-sl-federation/_test-data.ts` |
| Test presets | `TEST_PRESETS.novice` | `TEST_PRESETS.registeredGrove` |
| Console capture | `setupConsoleCapture()` | Reuse |
| Screenshot paths | `SCREENSHOT_DIR` | `docs/sprints/s9-sl-federation-v1/screenshots/e2e/` |

### 6.2 Required Test Files

```
tests/e2e/s9-sl-federation/
├── _test-data.ts           # Seeding utilities
├── grove-registry.spec.ts  # Epic A: Registry
├── tier-mapping.spec.ts    # Epic B: Tier Mapping
├── knowledge-exchange.spec.ts # Epic C: Exchange
└── trust-governance.spec.ts   # Epic D: Trust
```

---

## 7. Integration Points with S8-SL-MultiModel

S8 introduced multi-model support with lifecycle models. S9 integrates:

| S8 Feature | S9 Integration |
|------------|----------------|
| `LifecycleModel` | Model capability in grove registration |
| Model selection | Trust scoring by model performance |
| Model analytics | Exchange quality metrics |

---

## 8. Technical Debt Considerations

### 8.1 Schema Consolidation

Currently EPIC5 federation schema uses `Sprint*` naming. For S9:
- **Option A:** Create parallel `Grove*` types (recommended - clean separation)
- **Option B:** Generalize to abstract base types (deferred complexity)

**Decision:** Option A - Create new grove-specific types in `src/core/schema/federation.ts`

### 8.2 Event Bus Integration

The existing engagement bus (`hooks/useEngagementBus.ts`) handles internal events. Federation needs:
- New event types for grove communication
- Possibly a `FederationEventBus` parallel to engagement bus
- Or extend existing bus with federation channel

**Decision:** Extend existing FederationProtocol event system (already has `FederationEventType` enum)

---

## 9. Files to Create

| File | Purpose | Priority |
|------|---------|----------|
| `src/core/schema/federation.ts` | FederatedGrove, TierMapping types | P0 |
| `src/core/engine/tierMappingEngine.ts` | Tier equivalence logic | P0 |
| `src/core/engine/trustEngine.ts` | Trust calculation | P0 |
| `src/core/engine/knowledgeExchange.ts` | Exchange protocol | P1 |
| `src/bedrock/consoles/FederationConsole/` | Full console directory | P1 |
| `hooks/useGroveRegistry.ts` | Grove CRUD hook | P1 |
| `hooks/useTierMapping.ts` | Mapping CRUD hook | P1 |
| `hooks/useTrustEngine.ts` | Trust operations hook | P2 |
| `supabase/migrations/029_federation_groves.sql` | Database schema | P0 |
| `tests/e2e/s9-sl-federation/*.spec.ts` | E2E test suites | P2 |

---

## 10. Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/core/schema/grove-object.ts` | Add federation object types | P0 |
| `src/core/schema/index.ts` | Export new federation types | P0 |
| `src/core/federation/index.ts` | Export new engines | P1 |
| `src/bedrock/BedrockLayout.tsx` | Add federation console route | P1 |
| `src/router/routes.tsx` | Add /bedrock/federation route | P1 |

---

## 11. Recommendations

1. **Start with schema** - Define types first, then implement
2. **Parallel to EPIC5** - Don't modify Sprint-based code, create Grove-based parallel
3. **Console last** - Core engines → hooks → UI
4. **Test data first** - Seed utilities before E2E tests
5. **Screenshot-driven** - Verify visually at each milestone

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Schema conflicts with EPIC5 | Low | Medium | Separate namespace (Grove* vs Sprint*) |
| Supabase migration ordering | Medium | High | Use next available number (029) |
| Console route conflicts | Low | Low | Standard /bedrock/federation path |
| Test isolation | Medium | Medium | Separate test-data.ts per sprint |

---

## Approval

- [ ] Developer reviewed
- [ ] Patterns confirmed
- [ ] Integration points validated
- [ ] Migration sequence confirmed

---

*Repository Audit complete. Proceed to Phase 2: Architecture.*
