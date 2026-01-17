# Grove Execution Contract: EPIC5-SL-Federation

## Handoff Summary

**We are building:** A federated network architecture enabling sprints to discover, communicate, and share capabilities across organizational boundaries while maintaining DEX compliance and full provenance.

**What this delivers:**
- Federation Service Registry for sprint discovery
- Service Discovery API with capability-based queries
- Cross-Sprint Communication Protocol
- Federated Provenance Bridge for audit trails
- Federation Dashboard UI for monitoring and visualization
- Integration with existing sprints (S7, S7.5, S8)

**Key Capabilities:**
1. Sprint Registration & Discovery
2. Capability-based Service Query
3. Cross-Sprint Provenance Tracking
4. Federation Health Monitoring
5. Visual Federation Topology
6. Event-driven Communication

**Architecture:**
- Federation Layer: Service registry, protocol engine, provenance bridge
- Registry Pattern: Declarative capability discovery
- Event-driven: Cross-sprint communication
- DEX-compliant: All pillars verified

---

## Build Gates

### Phase 1: Federation Core
```bash
# Schema validation
npm run type-check

# Unit tests
npm test -- --testPathPattern=federation

# Build verification
npm run build

# Integration tests
npm run test:integration
```

### Phase 2: UI Components
```bash
# Component tests
npm test -- --testPathPattern=components

# Visual regression tests
npx playwright test --grep="federation"

# Accessibility tests
npm run test:a11y
```

### Phase 3: E2E Flows
```bash
# Full E2E suite
npx playwright test tests/e2e/federation.spec.ts

# Cross-sprint workflow tests
npx playwright test tests/e2e/federation-workflow.spec.ts

# Visual verification
npm run test:visual
```

### Final Verification
```bash
# Complete test suite
npm test && npm run build && npx playwright test

# Lint and type check
npm run lint && npm run type-check

# Accessibility compliance
npm run test:a11y

# Performance benchmarks
npm run test:perf
```

---

## Key Files to Create

### Core Federation Infrastructure

```typescript
// src/core/federation/schema.ts
// Federation data types and interfaces
export interface FederationRegistry { ... }
export interface SprintRegistration { ... }
export interface Capability { ... }
export interface FederatedProvenance { ... }

// src/core/federation/registry.ts
// Service registry implementation
export class FederationRegistry {
  registerSprint(registration: SprintRegistration): Promise<void>
  discoverSprints(criteria: DiscoveryCriteria): Promise<SprintRegistration[]>
  unregisterSprint(sprintId: string): Promise<void>
  getHealth(): Promise<RegistryHealth>
}

// src/core/federation/protocol.ts
// Cross-sprint communication protocol
export class FederationProtocol {
  negotiateCapability(source: SprintId, target: SprintId, capability: Capability): Promise<NegotiationResult>
  sendMessage(message: FederationMessage): Promise<Acknowledgment>
  broadcast(event: FederationEvent): Promise<BroadcastResult>
}

// src/core/federation/provenance.ts
// Cross-sprint provenance tracking
export class ProvenanceBridge {
  attachMetadata(object: GroveObject, federationId: string): GroveObject
  traceProvenance(objectId: string): Promise<ProvenanceChain>
  verifyChain(chain: ProvenanceChain): Promise<VerificationResult>
}
```

### React UI Components

```typescript
// src/foundation/consoles/FederationConsole.tsx
// Main federation dashboard
export function FederationConsole(): JSX.Element { ... }

// src/foundation/components/FederationCard.tsx
// Sprint overview card
export function FederationCard(props: FederationCardProps): JSX.Element { ... }

// src/foundation/components/CapabilityTag.tsx
// Capability indicator tag
export function CapabilityTag(props: CapabilityTagProps): JSX.Element { ... }

// src/foundation/components/FederationTopology.tsx
// Network graph visualization
export function FederationTopology(props: FederationTopologyProps): JSX.Element { ... }

// src/foundation/components/ProvenanceTracer.tsx
// Provenance chain visualizer
export function ProvenanceTracer(props: ProvenanceTracerProps): JSX.Element { ... }

// src/foundation/components/ServiceDiscovery.tsx
// Service discovery interface
export function ServiceDiscovery(props: ServiceDiscoveryProps): JSX.Element { ... }
```

### API Endpoints

```typescript
// server.js - Federation endpoints
app.post('/api/federation/register', registerSprintHandler)
app.get('/api/federation/discover', discoverSprintsHandler)
app.post('/api/federation/message', sendMessageHandler)
app.get('/api/federation/provenance/:objectId', traceProvenanceHandler)
app.get('/api/federation/health', getFederationHealthHandler)
app.get('/api/federation/capabilities', listCapabilitiesHandler)
```

### Hooks

```typescript
// src/hooks/useFederation.ts
export function useFederation() {
  return {
    register: registerSprint,
    discover: discoverSprints,
    sendMessage: sendMessage,
    traceProvenance: traceProvenance,
    getHealth: getHealth
  }
}

// src/hooks/useServiceDiscovery.ts
export function useServiceDiscovery() {
  return {
    search: searchCapabilities,
    filter: filterByTags,
    getDetails: getCapabilityDetails
  }
}
```

---

## Key Files to Modify

### Existing Sprint Integration

```typescript
// src/core/schema/grove-object.ts
// Add federation metadata to all grove objects
interface GroveObject<T> {
  meta: {
    id: string;
    type: string;
    version: string;
    federationId?: string;  // NEW
    federationPath?: string[];  // NEW
  };
  payload: T;
}

// src/core/engine/triggerEvaluator.ts
// Emit federation events on trigger evaluation
export function evaluateTriggers(context: TriggerContext): void {
  // ... existing logic
  if (context.crossSprint) {
    emitFederationEvent('trigger-cross-sprint', context)
  }
}

// src/hooks/useEngagementBus.ts
// Add federation event emissions
interface FederationEvent {
  type: string;
  sprintId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}
```

### Foundation Console Integration

```typescript
// src/foundation/FoundationLayout.tsx
// Add federation to navigation
const FOUNDATION_CONSOLES = [
  // ... existing
  { path: '/foundation/federation', name: 'Federation', icon: 'network' }
]

// src/foundation/routes.ts
// Add federation routes
const FEDERATION_ROUTES = [
  { path: '/foundation/federation', component: FederationConsole },
  { path: '/foundation/federation/topology', component: FederationTopology },
  { path: '/foundation/federation/discovery', component: ServiceDiscovery },
  { path: '/foundation/federation/provenance', component: ProvenanceTracer }
]
```

---

## Implementation Phases

### Phase 1: Federation Core (Week 1)
**Deliverables:**
- [ ] Federation data schemas defined
- [ ] Federation Registry implemented
- [ ] Basic service discovery
- [ ] Sprint registration/unregistration
- [ ] Capability tagging system

**Tests:**
- [ ] Registry CRUD operations
- [ ] Service discovery queries
- [ ] Sprint lifecycle (register → heartbeat → unregister)

### Phase 2: Communication Protocol (Week 1-2)
**Deliverables:**
- [ ] Cross-sprint message routing
- [ ] Capability negotiation protocol
- [ ] Event emission system
- [ ] Message acknowledgment
- [ ] Retry logic for failures

**Tests:**
- [ ] Message delivery
- [ ] Negotiation protocol
- [ ] Error handling and recovery
- [ ] Performance under load

### Phase 3: Provenance Bridge (Week 2)
**Deliverables:**
- [ ] Federation metadata attachment
- [ ] Cross-sprint provenance tracing
- [ ] Chain verification
- [ ] Provenance export
- [ ] Audit trail logging

**Tests:**
- [ ] Metadata attachment
- [ ] Chain walking
- [ ] Integrity verification
- [ ] Export functionality

### Phase 4: UI Components (Week 2-3)
**Deliverables:**
- [ ] Federation Dashboard
- [ ] Service Discovery Interface
- [ ] Provenance Tracer
- [ ] Federation Topology Graph
- [ ] Mobile responsive layouts

**Tests:**
- [ ] Component rendering
- [ ] User interactions
- [ ] Accessibility compliance
- [ ] Visual regression tests

### Phase 5: Integration (Week 3)
**Deliverables:**
- [ ] S7 integration (Advancement)
- [ ] S7.5 integration (JobConfig)
- [ ] S8 integration (MultiModel)
- [ ] Cross-sprint workflows
- [ ] Federation health monitoring

**Tests:**
- [ ] Sprint registration
- [ ] Cross-sprint communication
- [ ] End-to-end workflows
- [ ] Health monitoring

### Phase 6: Testing & Polish (Week 3-4)
**Deliverables:**
- [ ] Complete E2E test suite
- [ ] Performance optimization
- [ ] Documentation
- [ ] Operator training materials
- [ ] Visual verification

**Tests:**
- [ ] Full E2E suite
- [ ] Performance benchmarks
- [ ] Accessibility audit
- [ ] Visual regression baseline

---

## Verification Steps

### 1. Federation Registry Verification
```bash
# Start federation registry
npm run dev:federation

# Register test sprint
curl -X POST http://localhost:3000/api/federation/register \
  -H 'Content-Type: application/json' \
  -d '{"sprintId":"test-sprint","capabilities":[{"tag":"test-capability"}]}'

# Verify registration
curl http://localhost:3000/api/federation/discover?tag=test-capability

# Should return: [{"sprintId":"test-sprint",...}]
```

**Expected Result:** ✅ Test sprint registered and discoverable

### 2. Service Discovery Verification
```bash
# Query for job-execution capability
curl http://localhost:3000/api/federation/discover?tag=job-execution

# Should return S7.5 if integrated
# Should include sprintId, name, version, DEX compliance
```

**Expected Result:** ✅ Sprints discoverable by capability tag

### 3. Cross-Sprint Communication
```typescript
// In test file
const sender = await registerSprint('sender-sprint')
const receiver = await registerSprint('receiver-sprint')

const message = { type: 'test', payload: { hello: 'world' }}
const ack = await sendMessage(sender, receiver.id, message)

expect(ack).toBeDefined()
expect(ack.sprintId).toBe(receiver.id)
```

**Expected Result:** ✅ Messages delivered with acknowledgment

### 4. Provenance Tracing
```typescript
// Create grove object with federation metadata
const object = createGroveObject({ data: 'test' })
const federated = attachFederationMetadata(object, 'fed-123')

// Trace provenance
const chain = await traceProvenance(federated.meta.id)
expect(chain.path).toContain(federated.meta.federationId)
```

**Expected Result:** ✅ Provenance chains include federation metadata

### 5. UI Component Verification
```bash
# Start dev server
npm run dev

# Navigate to /foundation/federation
# Verify all components render:
# - Federation Dashboard shows sprint count
# - Service Discovery shows capabilities
# - Topology graph renders network
# - Provenance tracer displays chains
```

**Expected Result:** ✅ All UI components render correctly

### 6. End-to-End Workflow
```typescript
// Complete workflow test
const sprintA = await registerSprint('sprint-a', ['capability-x'])
const sprintB = await registerSprint('sprint-b', ['capability-y'])

await discoverSprint('sprint-b') // From sprintA
await sendMessage('sprint-a', 'sprint-b', { type: 'request', capability: 'capability-y' })

const provenance = await traceProvenance('some-object-id')
// Should show path through both sprints
```

**Expected Result:** ✅ Complete cross-sprint workflows functional

---

## Rollback Plan

### Federation Registry Failure
**If registry becomes unavailable:**

1. **Switch to cached mode:**
   ```typescript
   // In federation client
   const useCache = registryAvailable === false
   const sprints = useCache ? cachedRegistrations : await discover()
   ```

2. **Monitor registry recovery:**
   ```bash
   # Check registry health
   curl http://localhost:3000/api/federation/health

   # Should return: { status: 'healthy' }
   ```

3. **Failover to backup registry:**
   ```typescript
   // Configure backup registry
   const BACKUP_REGISTRY = process.env.FEDERATION_BACKUP_REGISTRY
   ```

### Sprint Communication Failure
**If cross-sprint communication fails:**

1. **Graceful degradation:**
   - Sprints continue operating independently
   - Cached capability information used
   - Operators notified of degraded mode

2. **Retry with backoff:**
   ```typescript
   // Automatic retry
   await retry(async () => {
     return sendMessage(source, target, message)
   }, { retries: 5, backoff: 'exponential' })
   ```

3. **Manual intervention:**
   ```sql
   -- Disable federation for specific sprint
   UPDATE sprints SET federation_enabled = false WHERE sprint_id = 'problematic-sprint'
   ```

### UI Component Failure
**If federation UI fails:**

1. **Error boundary catches:**
   ```typescript
   // FederationConsole error boundary
   <ErrorBoundary fallback={<FederationErrorPage />}>
     <FederationConsole />
   </ErrorBoundary>
   ```

2. **API degradation:**
   - Show cached data if API fails
   - Display last known good state
   - Provide manual refresh option

### Database Migration Failure
**If federation tables fail to create:**

1. **Rollback migration:**
   ```sql
   -- Remove federation tables
   DROP TABLE IF EXISTS federation_provenance;
   DROP TABLE IF EXISTS federation_messages;
   DROP TABLE IF EXISTS federation_registry;
   ```

2. **Disable federation features:**
   ```typescript
   // Feature flag check
   if (!hasFederationTables()) {
     return <FederationNotAvailable />
   }
   ```

3. **Re-run migration:**
   ```bash
   npm run db:migrate:federation -- --rollback
   npm run db:migrate:federation
   ```

---

## Attention Anchor

**We are building:** A federated network enabling sprints to discover, communicate, and share capabilities while maintaining DEX compliance and full provenance.

**Success looks like:** 7 core stories complete, all tests passing, 3+ sprints federated (S7, S7.5, S8), federation dashboard operational, cross-sprint workflows functional.

**We are NOT:** Building a centralized orchestrator, hardcoding sprint dependencies, ignoring DEX compliance, or creating single points of failure.

**Key Non-Goals:**
- ❌ Centralized control system
- ❌ Hardcoded sprint endpoints
- ❌ Model-specific optimizations
- ❌ Breaking existing sprint functionality
- ❌ Cross-federation protocol (v1.1)
- ❌ Federation marketplace (v1.1)
- ❌ Security certificates (v1.1)

**Current Phase:** Planning Complete → Ready for Implementation
**Next Action:** Developer handoff and Phase 1 begin

---

## Dependencies

### Pre-requisites
- [ ] S7.5-SL-JobConfigSystem complete (for integration)
- [ ] Database migration system ready
- [ ] Foundation Console framework stable
- [ ] Test infrastructure operational

### Parallel Dependencies
- [ ] S8-SL-MultiModel (different domain, can proceed in parallel)
- [ ] Sprint health monitoring (can use existing patterns)

### Post-requisites
- [ ] Federation governance model establishment
- [ ] Additional sprints integration (S6, S9+)
- [ ] Federation analytics implementation
- [ ] Cross-federation protocol research

---

## Documentation Requirements

### Developer Documentation
- [ ] Federation API reference
- [ ] Integration guide for new sprints
- [ ] Protocol specification
- [ ] Troubleshooting guide

### Operator Documentation
- [ ] Federation Dashboard user guide
- [ ] Service discovery workflow
- [ ] Provenance tracing tutorial
- [ ] Health monitoring guide

### Architecture Documentation
- [ ] Federation system design
- [ ] Data flow diagrams
- [ ] Sequence diagrams
- [ ] Deployment architecture

---

## Success Metrics

### Functional Metrics
- Sprint registration: < 1 second
- Service discovery: < 100ms (cached)
- Cross-sprint message: < 500ms
- Provenance trace: < 2 seconds
- Registry availability: 99.9%

### Quality Metrics
- Test coverage: > 90%
- Accessibility compliance: WCAG AA
- Visual regression: 0 unexpected diffs
- Documentation: 100% API covered

### Business Metrics
- Sprint integration time: < 1 day
- Operator adoption: 100% of sprints federated
- Cross-sprint workflows: 3+ operational
- Federation health: 99.9% uptime

---

**Contract Prepared by:** Product Manager
**Date:** 2026-01-16
**Ready for:** Developer Handoff
**Estimated Duration:** 3-4 weeks
**Team Size:** 2-3 developers
