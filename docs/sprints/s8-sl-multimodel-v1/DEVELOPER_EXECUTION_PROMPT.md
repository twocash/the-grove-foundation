# Developer Execution Prompt: S8-SL-MultiModel-v1

## CRITICAL: Grove Execution Protocol Compliance Required

You are acting as **DEVELOPER** for sprint: **S8-SL-MultiModel-v1**

Your work **MUST** follow the **Grove Execution Protocol** as defined in the Grove Foundation Loop methodology. This is **MANDATORY** for all development work.

---

## Grove Execution Protocol Requirements

### Phase 0: Pattern Check (MANDATORY)
Before any code changes, you **MUST** complete Phase 0:

```bash
# Check current branch
git branch --show-current

# If bedrock → BEDROCK_SPRINT_CONTRACT.md applies
# If main/other → No additional contract

# Read PROJECT_PATTERNS.md
cat PROJECT_PATTERNS.md
```

**Document in DEVLOG.md:**
```markdown
## Pattern Check (Phase 0)

### Existing Patterns Extended
| Requirement | Existing Pattern | Extension Approach |
|------------|----------------|------------------|
| MultiModel Registry | GroveObject Pattern | Extend with model metadata |
| Model Cards | MetricCard Pattern | Extend with model-specific props |
| Routing Engine | Event-driven Pattern | Add capability matching |

### New Patterns Proposed
None. All requirements met by extending existing patterns.
```

### Phase 0.5: Canonical Source Audit (MANDATORY)
**MUST** identify canonical homes and prevent duplication:

```markdown
## Canonical Source Audit

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|-----------------|---------------|-----------------|---------------|
| Model Registry | src/core/multimodel/* | New directory | CREATE |
| UI Components | src/foundation/components/* | Extending MetricCard | EXTEND |
| API Routes | server.js | New endpoints | EXTEND |
| Hooks | src/hooks/* | New useMultiModel | CREATE |
```

### Phase 1: Repository Audit
Create `REPO_AUDIT.md` analyzing:
- Current state of federation-related files
- Existing component patterns to extend
- Technical debt considerations
- Integration points with EPIC5-SL-Federation

### Phase 2: Specification
Read and internalize:
- `docs/sprints/s8-sl-multimodel-v1/SPEC.md` (Live Status + Attention Anchor)
- `docs/sprints/s8-sl-multimodel-v1/USER_STORIES.md`
- `docs/sprints/s8-sl-multimodel-v1/ARCHITECTURE.md`

### Phase 3: Architecture
Create `ARCHITECTURE.md` documenting:
- Data structures (ModelRegistry, RoutingEngine schemas)
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
- Why GroveObject pattern for models
- Why capability taxonomy approach
- Why Foundation Console location
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

1. **Execute sprint phases** per Grove Execution Protocol (Phases 0-8 above)
2. **Implement code changes** per GROVE_EXECUTION_CONTRACT.md specification
3. **Write status updates** to `.agent/status/current/{NNN}-{timestamp}-developer.md`
4. **Capture screenshots** for visual verification
5. **Complete REVIEW.html** with acceptance criteria evidence
6. **Run tests and fix failures** per build gates
7. **Follow DEX compliance** (all 4 pillars verified)

---

## Reference Documents

**PRIMARY REFERENCES:**
1. `docs/sprints/s8-sl-multimodel-v1/GROVE_EXECUTION_CONTRACT.md` - **EXECUTION BLUEPRINT**
2. `docs/sprints/s8-sl-multimodel-v1/USER_STORIES.md` - 11 stories with Gherkin criteria
3. `docs/sprints/s8-sl-multimodel-v1/DESIGN_SPEC.md` - UI wireframes and components
4. `docs/sprints/s8-sl-multimodel-v1/UX_STRATEGIC_REVIEW.md` - DEX compliance verification

**TEMPLATES:**
- Template: `.agent/status/ENTRY_TEMPLATE.md`
- Reference: `.agent/roles/developer.md`

**ARCHITECTURE:**
- GroveObject Pattern: Extend existing pattern
- Foundation Console: Extend MetricCard, GlowButton patterns
- Event Bus: Integrate with existing event system

---

## Implementation Requirements

### Build Gates (MANDATORY)

**Phase 1: Core Infrastructure**
```bash
npm run type-check
npm test -- --testPathPattern=multimodel
npm run build
npm run test:integration
```

**Phase 2: UI Components**
```bash
npm test -- --testPathPattern=components
npx playwright test --grep="multimodel"
npm run test:a11y
```

**Phase 3: E2E Flows**
```bash
npx playwright test tests/e2e/multimodel.spec.ts
npm run test:visual
```

**Final Verification**
```bash
npm test && npm run build && npx playwright test
npm run lint && npm run type-check
npm run test:a11y
```

### QA Gates (MANDATORY)

**Gate 1: Pre-Development**
- [ ] Baseline tests pass
- [ ] Console clean (zero errors)
- [ ] Baseline screenshots verified
- [ ] TypeScript compilation successful

**Gate 2: Mid-Sprint (Daily)**
- [ ] Changed components tested
- [ ] Console clean after changes
- [ ] Core user journey verified (add model, view metrics)
- [ ] Unit tests passing (85%+ coverage)

**Gate 3: Pre-Merge (Epic Complete)**
- [ ] All tests green
- [ ] Console audit: ZERO errors
- [ ] Error boundary testing complete
- [ ] Network monitoring: All requests successful
- [ ] Full user journey passes (all 11 stories)
- [ ] Performance within thresholds (<5ms routing overhead)

**Gate 4: Sprint Complete**
- [ ] All QA gates passed
- [ ] Cross-browser testing (Chrome, mobile)
- [ ] Accessibility audit (keyboard nav, screen reader)
- [ ] Visual regression tests pass (zero unexpected diffs)
- [ ] Performance check (Lighthouse > 90)

---

## Key Files to Create

### Core Infrastructure (Phase 1)
```typescript
// src/core/multimodel/schema.ts
export interface ModelRegistry { ... }
export interface AIModel { ... }
export interface Capability { ... }
export interface RoutingRule { ... }

// src/core/multimodel/registry.ts
export class MultiModelRegistry {
  async registerModel(model: AIModel): Promise<void>
  async discoverModels(criteria: Capability[]): Promise<AIModel[]>
  async removeModel(id: string): Promise<void>
  async updateModel(id: string, updates: Partial<AIModel>): Promise<void>
}

// src/core/multimodel/router.ts
export class RoutingEngine {
  async routeRequest(request: TaskRequest): Promise<RoutingResult>
  getRoutingDecision(task: TaskRequest, models: AIModel[]): RoutingDecision
  async executeWithFailover(request: TaskRequest): Promise<Response>
}

// src/core/multimodel/capabilities.ts
export enum CapabilityType {
  REASONING = "reasoning",
  CREATIVITY = "creativity",
  PRECISION = "precision",
  SPEED = "speed",
  CONTEXT = "context"
}
```

### UI Components (Phase 2)
```typescript
// src/foundation/consoles/MultiModelConsole.tsx
export function MultiModelConsole(): JSX.Element { ... }

// src/foundation/components/ModelCard.tsx (extends MetricCard)
export function ModelCard(props: ModelCardProps): JSX.Element { ... }

// src/foundation/components/CapabilityTag.tsx
export function CapabilityTag(props: CapabilityTagProps): JSX.Element { ... }

// src/foundation/components/RoutingRuleEditor.tsx
export function RoutingRuleEditor(props: RoutingRuleEditorProps): JSX.Element { ... }

// src/foundation/components/PerformanceChart.tsx
export function PerformanceChart(props: PerformanceChartProps): JSX.Element { ... }
```

### API Endpoints (Phase 3)
```typescript
// server.js
app.post('/api/models/register', registerModelHandler)
app.get('/api/models/discover', discoverModelsHandler)
app.get('/api/models/:id', getModelHandler)
app.patch('/api/models/:id', updateModelHandler)
app.delete('/api/models/:id', removeModelHandler)
app.post('/api/models/:id/disable', disableModelHandler)
app.post('/api/models/:id/enable', enableModelHandler)
app.get('/api/models/:id/metrics', getModelMetricsHandler)
app.get('/api/routing/recommend', getRoutingRecommendationHandler)
app.get('/api/routing/logs', getRoutingLogsHandler)
```

### Hooks (Phase 3)
```typescript
// src/hooks/useMultiModel.ts
export function useMultiModel() {
  return {
    registerModel: registerModel,
    discoverModels: discoverModels,
    removeModel: removeModel,
    updateModel: updateModel,
    getModels: getModels
  }
}

// src/hooks/useModelMetrics.ts
export function useModelMetrics(modelId: string) {
  return {
    metrics: ModelMetrics | null,
    refresh: () => void,
    loading: boolean
  }
}
```

---

## DEX Compliance Verification

### Pillar 1: Declarative Sovereignty
- ✅ Models defined as GroveObject instances (config, not code)
- ✅ Routing rules declarative JSON configuration
- ✅ Capability taxonomy in config
- **VERIFY:** All model behavior in config files, not hardcoded

### Pillar 2: Capability Agnosticism
- ✅ Pure TypeScript interface (no model-specific code)
- ✅ Capability taxonomy separate from model implementation
- ✅ Works with Gemini, Claude, local models equally
- **VERIFY:** No model-specific code in routing logic

### Pillar 3: Provenance as Infrastructure
- ✅ Every request logged with model, capability, latency, outcome
- ✅ Full routing decision provenance (why model was chosen)
- ✅ Model lifecycle events tracked (who, when, why)
- **VERIFY:** All provenance in database, fully auditable

### Pillar 4: Organic Scalability
- ✅ TypeScript union types extensible
- ✅ Registry pattern supports unlimited models
- ✅ New capabilities additive (no breaking changes)
- **VERIFY:** Can add models without modifying core code

---

## Attention Anchoring Protocol

**MANDATORY:** Re-read this section before every major decision.

### We Are Building
A multi-model lifecycle management system with declarative configuration, capability-based routing, and performance monitoring.

### Success Looks Like
- 11 user stories complete
- All tests passing
- Gemini + Claude models integrated
- <5min add model time
- <100ms routing decisions
- 99.9% uptime

### We Are NOT
- Building centralized orchestration
- Hardcoding model endpoints
- Ignoring DEX compliance
- Creating single points of failure

### Current Phase
Phase 8: Execution (follow Grove Execution Protocol Phases 0-8)

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
sprint: s8-sl-multimodel-v1
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

## DEX Compliance
- [ ] Declarative Sovereignty verified
- [ ] Capability Agnosticism verified
- [ ] Provenance as Infrastructure verified
- [ ] Organic Scalability verified
```

---

## Verification Steps

### 1. Model Registration Verification
```bash
curl -X POST http://localhost:3000/api/models/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Model","provider":"test","capabilities":["reasoning"]}'

curl http://localhost:3000/api/models/discover?capability=reasoning
```
**Expected:** Model registered and discoverable

### 2. Routing Engine Verification
```typescript
const request = {
  taskType: 'complex-analysis',
  requiredCapability: CapabilityType.REASONING
}
const result = await routeRequest(request)
expect(result.modelId).toBeDefined()
expect(result.routingDecision.reason).toContain('priority match')
```
**Expected:** Requests routed with documented decision

### 3. UI Component Verification
```bash
npm run dev
# Navigate to /foundation/multimodel
# Verify all components render and function
```
**Expected:** All UI components working correctly

---

## Rollback Plan

### Model Registry Failure
```typescript
const useCache = registryAvailable === false
const models = useCache ? cachedModels : await discoverModels()
```

### Routing Logic Errors
- Graceful degradation to round-robin
- Log error with full context
- Rollback: `git checkout HEAD~1`

### UI Component Failure
```typescript
<ErrorBoundary fallback={<MultiModelErrorPage />}>
  <MultiModelConsole />
</ErrorBoundary>
```

---

## On Completion

Write COMPLETE entry with:
- Test results
- Screenshots
- DEX compliance verification
- All 11 user stories passed
- All build gates passed

**Do NOT update Notion directly** - Sprintmaster handles that.

---

## Support

- **Architecture questions:** UX Chief
- **Product questions:** Product Manager
- **Technical questions:** Sprint Owner

---

## Final Checklist

Before starting:
- [ ] Read GROVE_EXECUTION_CONTRACT.md
- [ ] Read USER_STORIES.md
- [ ] Read DESIGN_SPEC.md
- [ ] Understand DEX pillars
- [ ] Set up development environment

During execution:
- [ ] Follow Grove Execution Protocol (Phases 0-8)
- [ ] Update DEVLOG.md after each epic
- [ ] Run build gates after each phase
- [ ] Verify DEX compliance continuously
- [ ] Capture screenshots for evidence

Before completion:
- [ ] All 11 user stories complete
- [ ] All tests passing
- [ ] All build gates passed
- [ ] Visual regression tests pass
- [ ] REVIEW.html complete with evidence
- [ ] Status update: COMPLETE

---

**CRITICAL REMINDER:** This sprint follows the **Grove Foundation Loop** methodology. All 9 artifacts (REPO_AUDIT, SPEC, ARCHITECTURE, MIGRATION_MAP, DECISIONS, SPRINTS, EXECUTION_PROMPT, DEVLOG, CONTINUATION_PROMPT) must be created and maintained throughout execution.

**Your work will be evaluated on:**
1. Grove Execution Protocol compliance
2. DEX pillar adherence
3. Test coverage and quality
4. Visual verification evidence
5. Clean, maintainable code

Execute with precision. Document everything. Verify continuously.
