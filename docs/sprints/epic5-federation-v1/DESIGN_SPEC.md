# Design Specification: EPIC5-SL-Federation

## Wireframes

### Federation Dashboard (Main View)
```
┌─────────────────────────────────────────────────────────────────┐
│ GROVE FEDERATION                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │   Active Sprints │  │  Capabilities    │  │ Health Check │ │
│  │       12          │  │       47         │  │   99.9%      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Federation Topology                                         │ │
│  │                                                             │ │
│  │  S7.5 ────┐         S8                                      │ │
│  │ JobConfig  │                                              │ │
│  │           ├─── Federation ─── MultiModel                   │ │
│  │  S7       │         Layer                                     │ │
│  │ Advance   │                                              │ │
│  │           ├───                                         │ │
│  │  S6       │                                              │ │
│  │ Signals   │         EPIC5                                 │ │
│  └───────────┘         Federation                            │ │
│                                                                 │ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Active Capabilities                                        │ │
│  │  • job-execution (S7.5) ✓                               │ │
│  │  • advancement (S7) ✓                                    │ │
│  │  • data-aggregation (S6) ✓                               │ │
│  │  • multi-model (S8) ✓                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Discover Services] [View Provenance] [Federation Log]        │
└─────────────────────────────────────────────────────────────────┘
```

### Service Discovery Interface
```
┌─────────────────────────────────────────────────────────────────┐
│ Service Discovery                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Search: [job-execution           ] 🔍                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Capability: job-execution                                  │ │
│  │ Sprint: S7.5-SL-JobConfig                                 │ │
│  │ Status: 🟢 Active                                          │ │
│  │ DEX: ✅ Compliant                                          │ │
│  │ Version: v1.0                                             │ │
│  │                                                             │ │
│  │ Interfaces:                                                │ │
│  │  • POST /api/jobs/configure                               │ │
│  │  • POST /api/jobs/execute                                 │ │
│  │  • GET /api/jobs/status                                   │ │
│  │                                                             │ │
│  │ [View Provenance] [Test Connection] [Use Service]         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Capability: advancement                                    │ │
│  │ Sprint: S7-SL-AutoAdvancement                              │ │
│  │ Status: 🟢 Active                                          │ │
│  │ DEX: ✅ Compliant                                          │ │
│  │ Version: v2.1                                             │ │
│  │                                                             │ │
│  │ [View Details]                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Browse All Capabilities] [Request Capability]                │
└─────────────────────────────────────────────────────────────────┘
```

### Provenance Tracer
```
┌─────────────────────────────────────────────────────────────────┐
│ Federated Provenance Tracer                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Trace Object ID: [ grove-object-12345              ] [Trace]   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Provenance Chain                                           │ │
│  │                                                             │ │
│  │  S6 Signals                                                │ │
│  │  ┌─────────────────┐                                        │ │
│  │  │ Data Collected  │                                        │ │
│  │  │ 14:32:15 UTC   │                                        │ │
│  │  └─────────────────┘                                        │ │
│  │         ↓                                                    │ │
│  │  S7 Advancement                                            │ │
│  │  ┌─────────────────┐                                        │ │
│  │  │ Process Run     │                                        │ │
│  │  │ 14:35:22 UTC    │  📦 grove-object-12345               │ │
│  │  └─────────────────┘                                        │ │
│  │         ↓                                                    │ │
│  │  S7.5 JobConfig                                            │ │
│  │  ┌─────────────────┐                                        │ │
│  │  │ Config Updated  │                                        │ │
│  │  │ 14:40:10 UTC    │                                        │ │
│  │  └─────────────────┘                                        │ │
│  │                                                             │ │
│  │ Federation Metadata:                                        │ │
│  │  • Federation ID: fed-v1                                    │ │
│  │  • Protocol: v1.0                                          │ │
│  │  • Cross-sprint hops: 3                                    │ │
│  │  • DEX Compliant: Yes                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [Export Provenance] [Verify Chain] [View Raw]                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### FederationCard
**Purpose:** Display sprint status and key metrics

**Props:**
```typescript
interface FederationCardProps {
  sprintId: string;
  sprintName: string;
  phase: SprintPhase;
  capabilities: Capability[];
  status: 'active' | 'inactive' | 'degraded';
  lastHeartbeat: string;
  onSelect?: (sprintId: string) => void;
}
```

**Visual States:**
- **Active**: Green border, solid background
- **Inactive**: Gray border, muted background
- **Degraded**: Amber border, warning icon

**Information Displayed:**
- Sprint name and phase
- Capability count
- Last heartbeat time
- Health indicator
- DEX compliance badge

### CapabilityTag
**Purpose:** Visual representation of federated capability

**Props:**
```typescript
interface CapabilityTagProps {
  capability: Capability;
  selectable?: boolean;
  onSelect?: (capability: Capability) => void;
}
```

**Variants:**
- **Data**: Blue tag
- **Service**: Green tag
- **Processor**: Purple tag
- **Storage**: Orange tag

**States:**
- Available (solid color)
- In Use (outlined)
- Deprecated (strikethrough)

### FederationTopology
**Purpose:** Visual graph of sprint interconnections

**Props:**
```typescript
interface FederationTopologyProps {
  sprints: SprintNode[];
  connections: Connection[];
  onNodeClick?: (sprintId: string) => void;
}
```

**Layout:**
- Force-directed graph
- Node colors by sprint phase
- Edge colors by connection type
- Hover shows provenance metadata

### ProvenancePath
**Purpose:** Visualize data flow across sprints

**Props:**
```typescript
interface ProvenancePathProps {
  path: ProvenanceStep[];
  onStepClick?: (step: ProvenanceStep) => void;
}
```

**Visual Elements:**
- Vertical timeline
- Sprint badges
- Timestamp markers
- Data flow arrows
- DEX compliance indicators

## Interaction Patterns

### Discovery Flow
1. **Browse Capabilities** → User navigates to Federation Dashboard
2. **Search** → User searches or filters capabilities
3. **Select** → User clicks capability to view details
4. **Verify** → User checks DEX compliance and version
5. **Connect** → User tests connection or requests access
6. **Integrate** → User consumes service via federation protocol

### Provenance Trace Flow
1. **Enter Object ID** → User provides grove object identifier
2. **Trace** → System walks provenance chain
3. **Visualize** → Display cross-sprint path
4. **Verify** → Check DEX compliance at boundaries
5. **Export** → Save provenance report

### Federation Monitor Flow
1. **Dashboard** → Operator views overall federation health
2. **Alert** → System flags degraded sprint or capability
3. **Investigate** → Operator drills into specific sprint
4. **Action** → Operator enables/disabled sprint or capability
5. **Monitor** → Track recovery and health metrics

### Service Registration Flow
1. **Sprint Startup** → New sprint bootstraps
2. **Discovery** → Sprint finds federation via broadcast
3. **Register** → Sprint publishes capabilities
4. **Advertise** → Federation broadcasts new service
5. **Heartbeat** → Sprint maintains registry presence

## Design System

### Color Palette
**Primary Colors:**
- Federation Blue: `#1976D2` (trust, reliability)
- Capability Green: `#4CAF50` (health, active)
- Provenance Purple: `#7B1FA2` (data lineage)
- Warning Amber: `#FFA000` (degraded state)

**Semantic Colors:**
- Active: `#4CAF50`
- Inactive: `#9E9E9E`
- Degraded: `#FFA000`
- Error: `#D32F2F`
- DEX Compliant: `#2E7D32`

### Typography
- **Headers**: Inter Bold (16px, 18px, 24px)
- **Body**: Inter Regular (14px, 16px)
- **Code**: JetBrains Mono (12px, 14px)
- **Timestamps**: Inter Medium (12px)

### Iconography
**Capability Icons:**
- Data: Database icon
- Service: Gear icon
- Processor: Cpu icon
- Storage: Hard drive icon

**Status Icons:**
- Active: Check circle
- Inactive: Minus circle
- Degraded: Alert triangle
- Error: X circle

**Navigation Icons:**
- Federation: Network icon
- Provenance: Git branch icon
- Discovery: Search icon
- Topology: Graph icon

### Component Library
**Foundation Components:**
- DataPanel: Card container with header
- GlowButton: Primary action button
- MetricCard: Single metric display
- StatusBadge: Status indicator
- SearchInput: Search with autocomplete

**Federation-Specific:**
- FederationCard: Sprint overview
- CapabilityTag: Capability indicator
- ProvenancePath: Data lineage
- TopologyGraph: Sprint network

### Spacing & Layout
**Grid System:**
- 12-column grid
- 24px gutter
- Responsive breakpoints

**Spacing Scale:**
- 4px (xs)
- 8px (sm)
- 16px (md)
- 24px (lg)
- 32px (xl)
- 48px (xxl)

**Border Radius:**
- Small: 4px
- Medium: 8px
- Large: 12px

## Accessibility

### WCAG 2.1 AA Compliance
**Color Contrast:**
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Icons and graphics: 3:1 minimum

**Keyboard Navigation:**
- Tab order follows visual flow
- Skip links for main sections
- Focus indicators visible (2px outline)
- Keyboard shortcuts documented

**Screen Reader Support:**
- ARIA labels on all interactive elements
- Role attributes for custom components
- Live regions for dynamic updates
- Semantic HTML structure

**Alternative Text:**
- All icons have descriptive alt text
- Graphs include data table alternative
- Images have meaningful descriptions

### Specific Accessibility Features

**FederationCard:**
```html
<div role="button"
     tabindex="0"
     aria-label="Sprint S7.5 JobConfig, 3 capabilities, status active"
     aria-describedby="sprint-capabilities-123">
```

**CapabilityTag:**
```html
<span role="status"
      aria-label="Capability job-execution, type service, version 1.0">
  job-execution
</span>
```

**ProvenancePath:**
```html
<nav aria-label="Provenance trace for grove-object-12345">
  <ol aria-label="Sprint timeline">
    <li aria-label="S6 Signals at 14:32:15 UTC">...</li>
  </ol>
</nav>
```

### Focus Management
- Modals: Focus trapped, Esc to close
- Dropdowns: Arrow keys navigate, Enter selects
- Tabs: Arrow keys switch tabs
- Tables: Arrow keys navigate cells

### Reduced Motion
- Respects `prefers-reduced-motion` setting
- Animations < 200ms duration
- Can disable animations via settings

## States

### Loading States
**Federation Dashboard:**
- Skeleton cards while loading sprints
- Shimmer effect on capability list
- Spinner on topology graph
- Progressive loading of provenance data

**Provenance Tracer:**
- Loading indicator while walking chain
- Skeleton for each provenance step
- Progressive disclosure of details

### Empty States
**No Sprints Registered:**
- Empty state with onboarding message
- "First to join federation" callout
- Instructions for sprint registration

**No Capabilities Found:**
- "No capabilities match your search"
- Suggest broadening search terms
- Link to browse all capabilities

**No Provenance Data:**
- Object ID not found
- Suggestions for valid IDs
- Help text for provenance queries

### Error States
**Federation Unavailable:**
- Error message with retry button
- Local cache indicator
- Last known good data display

**Sprint Communication Failed:**
- Red status on sprint card
- Error details in tooltip
- Retry mechanism with backoff

**Invalid Object ID:**
- Clear error message
- Format requirements shown
- Example IDs provided

**Version Incompatibility:**
- Warning badge on capability
- Compatible versions suggested
- Upgrade path indicated

### Degraded States
**Sprint Heartbeat Missed:**
- Amber warning indicator
- Time since last heartbeat
- Auto-retry in progress

**Capability Partially Available:**
- Mixed status display
- Working interfaces highlighted
- Broken interfaces grayed

**Network Partition:**
- Offline indicator
- Local data only message
- Sync status shown

---

**Handoff to:** UI Chief (Stage 4: Interface Review)
**Next:** Create UI_REVIEW.md with interface validation and approval
