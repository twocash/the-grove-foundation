# Bedrock Console Roadmap

**Version:** 1.0  
**Date:** December 30, 2025  
**Status:** Approved

---

## Vision

Bedrock is Grove's administrative layer — the backstage where knowledge, experiences, and system configuration are managed. It replaces the legacy Foundation UI with a clean-room implementation following DEX standards.

**The goal:** Feature parity with Foundation, then deprecate Foundation.

---

## Architectural Foundation

Every Bedrock console follows the same pattern:

```
┌──────────────────────────────────────────────────────────────┐
│ Console Header                                               │
├──────────────────────────────────────────────────────────────┤
│ Metrics Row                                                  │
├────────────┬─────────────────────────┬──────────────────────┤
│ Navigation │ Content Area            │ Inspector + Copilot  │
│ (240px)    │ (flex)                  │ (360px)              │
└────────────┴─────────────────────────┴──────────────────────┘
```

**Shared infrastructure:**
- BedrockLayout (shell)
- BedrockNav (navigation)
- BedrockInspector (detail + Copilot)
- useCollectionView (filter/sort/favorite)
- GroveObject (data model)
- Copilot context protocol (AI assistance)

---

## Sprint Sequence

### Sprint 1: bedrock-foundation-v1 ← CURRENT

**Theme:** Establish the pattern

| Deliverable | Purpose |
|-------------|---------|
| BedrockLayout + primitives | Reusable console infrastructure |
| /explore capture flow | Sprout creation from user surface |
| Knowledge Garden console | Receives and displays Sprouts |
| Lens Workshop console | Reference implementation proving all patterns |

**Exit criteria:** Two functional consoles; all patterns documented.

---

### Sprint 2: bedrock-journeys-v1

**Theme:** Complex object relationships

| Deliverable | Purpose |
|-------------|---------|
| Journey Studio console | Create and edit Journeys |
| Node editor | Configure individual Nodes |
| Path validation | Ensure Journey graphs are valid |
| Garden moderation | Approve/reject/defer actions |

**New patterns:**
- Hierarchical object editing (Journey → Nodes)
- Graph validation in Copilot
- Moderation workflow state machine

**Dependencies:** Sprint 1 primitives

---

### Sprint 3: bedrock-moments-v1

**Theme:** Conditional logic and triggers

| Deliverable | Purpose |
|-------------|---------|
| Moment Designer console | Configure engagement moments |
| Trigger builder | Define when moments activate |
| Condition editor | Set requirements for activation |
| Preview mode | Test moments without publishing |

**New patterns:**
- Conditional logic UI
- Trigger configuration
- Preview/test infrastructure

**Dependencies:** Sprint 1 primitives, Sprint 2 Journey context

---

### Sprint 4: bedrock-topology-v1

**Theme:** Information architecture

| Deliverable | Purpose |
|-------------|---------|
| Hub Topology console | Organize knowledge structure |
| Hierarchy visualization | See Hub relationships |
| Bulk operations | Move/merge Hubs efficiently |
| Source management | Connect external sources |

**New patterns:**
- Tree/graph visualization
- Bulk selection and operations
- External source integration

**Dependencies:** Sprint 1 primitives

---

### Sprint 5: bedrock-system-v1

**Theme:** System configuration

| Deliverable | Purpose |
|-------------|---------|
| System Config console | Feature flags, voices, settings |
| Feature flag manager | Toggle features safely |
| Voice configuration | Manage system voice options |
| Health dashboard | System status at a glance |

**New patterns:**
- Configuration management UI
- Health monitoring integration
- Audit logging display

**Dependencies:** Sprint 1 primitives

---

### Sprint 6: bedrock-polish-v1

**Theme:** Production readiness

| Deliverable | Purpose |
|-------------|---------|
| Cross-console consistency | Ensure patterns applied uniformly |
| Copilot refinement | Improve prompts and validation |
| Performance optimization | Fast load, smooth interactions |
| Migration path | Foundation → Bedrock transition plan |

**Exit criteria:** Bedrock feature-matches Foundation.

---

### Sprint 7: foundation-deprecation-v1

**Theme:** The handoff

| Deliverable | Purpose |
|-------------|---------|
| Data migration | Move any Foundation-only data |
| Route redirects | /foundation/* → /bedrock/* |
| Foundation removal | Delete legacy code |
| Documentation update | All docs reference Bedrock |

**Exit criteria:** Foundation code deleted; Bedrock is the only admin UI.

---

## Console Inventory

| Console | Sprint | Object Types | Complexity |
|---------|--------|--------------|------------|
| Knowledge Garden | 1 | Sprout, Source | Medium |
| Lens Workshop | 1 | Lens | Low |
| Journey Studio | 2 | Journey, Node | High |
| Moment Designer | 3 | Moment, Trigger | High |
| Hub Topology | 4 | Hub | Medium |
| Persona Gallery | 4 | Persona | Low |
| System Config | 5 | FeatureFlag, Voice, etc. | Medium |

---

## Object Model

All Bedrock objects use GroveObject:

```typescript
interface GroveObject<T = unknown> {
  meta: {
    id: string;
    type: GroveObjectType;
    title: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: number;
  };
  payload: T;
}
```

**Type registry:**

| Type | Sprint | Payload Schema |
|------|--------|----------------|
| sprout | 1 | SproutPayload |
| lens | 1 | LensPayload |
| journey | 2 | JourneyPayload |
| node | 2 | NodePayload |
| moment | 3 | MomentPayload |
| hub | 4 | HubPayload |
| persona | 4 | PersonaPayload |
| feature_flag | 5 | FeatureFlagPayload |
| voice | 5 | VoicePayload |

---

## Copilot Evolution

| Sprint | Copilot Capability |
|--------|-------------------|
| 1 | Context protocol; simple patch generation; schema validation |
| 2 | Path validation; relationship suggestions |
| 3 | Trigger logic assistance; condition builder help |
| 4 | Bulk operation suggestions; hierarchy optimization |
| 5 | Config recommendations; health interpretation |
| 6 | Cross-console intelligence; prompt refinement |

---

## Risk Registry

| Risk | Mitigation | Owner |
|------|------------|-------|
| Pattern drift across sprints | Contract enforcement; pattern documentation | Architecture |
| Copilot hallucinations | Schema validation; human checkpoint | Implementation |
| Legacy coupling creep | No foundation imports; automated check | CI/CD |
| Feature parity gaps | Explicit tracking in each sprint SPEC | PM |
| Performance degradation | Baseline metrics; monitoring | Implementation |

---

## Success Metrics

**Sprint 1 complete when:**
- [ ] Two consoles functional (Garden, Lens Workshop)
- [ ] Capture flow works end-to-end
- [ ] All patterns documented
- [ ] Zero Foundation imports

**Bedrock complete when:**
- [ ] All 7 consoles functional
- [ ] Feature parity with Foundation achieved
- [ ] Foundation code deleted
- [ ] All DEX tests pass across all consoles

---

## Document References

| Document | Purpose |
|----------|---------|
| `BEDROCK_SPRINT_CONTRACT.md` | Binding requirements |
| `Trellis_Architecture_Bedrock_Addendum.md` | Implementation guidance |
| `The_Trellis_Architecture__First_Order_Directives.md` | Constitutional foundation |
| `copilot-configurator-vision.md` | Copilot design |
| `GROVE_FOUNDATION_REFACTOR_SPEC.md` | Feature inventory from Foundation |

---

*This roadmap guides Bedrock development. Update after each sprint with learnings and adjustments.*
