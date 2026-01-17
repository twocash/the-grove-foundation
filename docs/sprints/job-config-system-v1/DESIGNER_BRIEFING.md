# Designer Briefing: S7.5-SL-JobConfigSystem
**Living Glass Migration & UI Integration Strategy**

**Date:** 2026-01-16
**Sprint:** S7.5-SL-JobConfigSystem
**For:** UI/UX Designer
**Status:** Ready for Review

---

## Executive Summary

The S7.5 JobConfigSystem introduces a new configuration paradigm to the ExperienceConsole: **batch job management**. This briefing outlines the current UI model, future Living Glass integration, and visual differentiation strategy to ensure the new system feels organic and self-evident to operators.

**Key Challenge:** Operators must intuitively distinguish between:
- **AdvancementRule** (⚡) — WHEN sprouts advance (strategic rules)
- **JobConfig** (⏰) — HOW jobs execute (operational parameters)

---

## Current UI Model Analysis

### ExperienceConsole State

**Location:** `src/bedrock/consoles/ExperienceConsole/`

**Existing Objects:**
1. **Feature Flags** — Toggle-based configuration
   - Card: FeatureFlagCard.tsx
   - Editor: FeatureFlagEditor.tsx
   - Pattern: Simple on/off with description

2. **AdvancementRules** (S7) — Strategic configuration
   - Card: AdvancementRuleCard.tsx
   - Editor: AdvancementRuleEditor.tsx
   - Pattern: Complex form with rule builder
   - Visual: Blue palette (#1976D2), lightning icon ⚡

**Grid Layout:**
```
ExperienceConsole Grid
├── Feature Flags (4 columns)
├── Advancement Rules (BLUE ⚡)
└── [SPACE FOR: Job Configurations (ORANGE ⏰)]
```

### Visual Language Established

**Colors:**
- Primary Blue: `#1976D2` (AdvancementRules)
- Background: `rgba(25, 118, 210, 0.1)` (subtle blue tint)
- Icon: Lightning bolt ⚡ (rules trigger advancement)

**Typography:**
- Section headers: `font-weight: 600`
- Card titles: Medium weight
- Descriptions: Muted text

**Card Pattern:**
```css
.card--advancement-rule {
  border-left: 4px solid var(--advancement-rule-primary);
  background: linear-gradient(
    to right,
    var(--advancement-rule-bg),
    white
  );
}
```

---

## JobConfig System Overview

### Object Type

**GroveObject Pattern:**
```typescript
interface GroveObject<JobConfigPayload> {
  meta: {
    id: string;           // 'advancement-batch'
    type: 'job-config';    // EXPERIENCE_TYPE_REGISTRY
    version: string;
  };
  payload: JobConfigPayload;  // Configurable parameters
}
```

**Job Types to Support:**
- `advancement-batch` — Daily tier advancement
- `signal-aggregation-all` — 15-minute aggregations
- `signal-aggregation-7d` — Hourly aggregations
- `signal-aggregation-30d` — 6-hour aggregations

### Configuration Structure

**JobConfigPayload Schema:**
```typescript
{
  jobType: string,
  displayName: string,
  schedule: {
    cronExpression: string,
    timezone: string,
    isEnabled: boolean
  },
  retry: {
    maxAttempts: number,
    backoffStrategy: 'fixed' | 'exponential',
    initialDelaySeconds: number
  },
  limits: {
    batchSize: number,
    timeoutSeconds: number,
    maxConcurrent: number
  },
  parameters: { /* job-specific */ },
  notifications: {
    onSuccess: boolean,
    onFailure: boolean,
    channels: string[]
  }
}
```

---

## Visual Differentiation Strategy

### Color & Iconography

**AdvancementRule (BLUE ⚡):**
- Primary: `#1976D2`
- Background: `rgba(25, 118, 210, 0.1)`
- Icon: Lightning bolt ⚡
- Mental model: "Rules that trigger advancement"

**JobConfig (ORANGE ⏰):**
- Primary: `#FF9800`
- Background: `rgba(255, 152, 0, 0.1)`
- Icon: Clock ⏰
- Mental model: "Scheduled operations"

### Navigation Structure

```
ExperienceConsole
├── 📊 Analytics
├── ⚡ Advancement Rules (BLUE)
│   └── "Configure when sprouts advance"
└── ⏰ Job Configurations (ORANGE)
    └── "Configure how jobs execute"
```

### Card Visual Treatment

**JobConfigCard.tsx:**
```typescript
<div className="card card--job-config">
  <div className="card__header">
    <Icon name="schedule" color="var(--job-config-primary)" />
    <h3>{displayName}</h3>
    <StatusBadge status={schedule.isEnabled ? 'active' : 'disabled'} />
  </div>

  <div className="card__body">
    <div className="metric-row">
      <span>Schedule:</span>
      <span className="mono">{cronExpression}</span>
    </div>
    <div className="metric-row">
      <span>Batch Size:</span>
      <span>{batchSize}</span>
    </div>
  </div>

  <div className="card__footer">
    <Button variant="secondary" size="sm">Configure</Button>
    <Button variant="primary" size="sm">Run Now</Button>
  </div>
</div>
```

**CSS Variables:**
```css
:root {
  --job-config-primary: #FF9800;
  --job-config-bg: rgba(255, 152, 0, 0.1);
  --job-config-border: #FF9800;
}
```

---

## Hybrid Rendering Architecture

### Challenge: Two Rendering Paradigms

**Traditional React (Configuration Forms):**
- Interactive inputs (BufferedInput)
- Form validation
- CRUD operations
- Real-time updates

**Json-render (Status Displays):**
- Read-only analytics
- Declarative component vocabulary
- Data-driven rendering
- Transform functions

### Visual Separation Strategy

**JobConfigEditor.tsx Structure:**

```typescript
<div className="job-config-editor">
  {/* SECTION 1: Configuration - Traditional React */}
  <section className="config-section">
    <div className="section-header">
      <Icon name="settings" color="#FF9800" />
      <h2>Configuration</h2>
      <Tooltip content="Edit job parameters and schedule" />
    </div>

    <div className="section-body">
      <FormField>
        <Label>Cron Expression</Label>
        <BufferedInput
          value={object.payload.schedule.cronExpression}
          onChange={handleUpdate}
        />
      </FormField>

      <FormField>
        <Label>Batch Size</Label>
        <BufferedInput
          type="number"
          value={object.payload.limits.batchSize}
          onChange={handleUpdate}
        />
      </FormField>
    </div>
  </section>

  {/* VISUAL DIVIDER */}
  <div className="section-divider">
    <div className="divider-line"></div>
    <Icon name="swap_vert" color="#9E9E9E" />
    <div className="divider-line"></div>
  </div>

  {/* SECTION 2: Status - json-render */}
  <section className="status-section">
    <div className="section-header">
      <Icon name="monitor_heart" color="#4CAF50" />
      <h2>Execution Status</h2>
      <Tooltip content="Live job execution monitoring" />
    </div>

    <div className="section-body">
      <Renderer
        tree={jobExecutionToRenderTree(latestExecution)}
        registry={JobStatusRegistry}
        catalog={JobStatusCatalog}
      />
    </div>
  </section>
</div>
```

**Section Divider Styling:**
```css
.section-divider {
  display: flex;
  align-items: center;
  margin: 32px 0;
  padding: 16px 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    #E0E0E0 20%,
    #E0E0E0 80%,
    transparent
  );
}

.section-divider svg {
  margin: 0 20px;
  color: #9E9E9E;
}
```

---

## Json-Render Status Components

### JobStatusCatalog Components

**1. JobPhaseIndicator**
```typescript
// Visual: Phase progression with colored indicators
[Queued] → [Running] → [Complete]
  Gray      Blue       Green
```

**2. JobProgressBar**
```typescript
// Visual: Progress with percentage
████████████░░░░░░░  60% (600/1000 items)
```

**3. JobMetricRow**
```typescript
// Visual: Reuse from SignalsCatalog
┌────────────────────────────────┐
│ Duration: 2m 34s │ Errors: 0 │
│ Next Run: 3h 15m │ Status: OK │
└────────────────────────────────┘
```

**4. JobLogEntry**
```typescript
// Visual: Timestamped log lines
[14:32:15] Starting advancement batch...
[14:32:47] Processed 250 sprouts
[14:33:21] Completed successfully
```

**5. JobErrorAlert**
```typescript
// Visual: Error with retry button
┌─────────────────────────────────────┐
│ ⚠️ Failed: Connection timeout       │
│ Retry attempts: 2/3                │
│         [Retry Now] [View Details]  │
└─────────────────────────────────────┘
```

**6. NextRunCountdown**
```typescript
// Visual: Live countdown timer
⏰ Next run in: 2h 15m 43s
```

---

## Living Glass Migration Considerations

### Future State Vision

**Living Glass Principle:** Interface becomes invisible; users think in domain objects, not UI paradigms.

**Evolution Path:**
```
v1.0 (Current): Separate sections (Config + Status)
v1.5 (Living Glass): Unified object view
    ↓
v2.0 (Vision): Operators think "advancement job" not "form + display"
```

### Migration Strategy

**Phase 1: Foundation (S7.5)**
- Establish visual language (orange ⏰ vs blue ⚡)
- Hybrid rendering pattern documented
- Operator mental models clear

**Phase 2: Consolidation (Future Sprint)**
- Merge config + status into single object view
- Json-render expands to cover configuration
- Traditional React phased out

**Phase 3: Living Glass (Long-term)**
- Configuration becomes declarative data
- UI adapts to object type automatically
- Operators edit configuration as structured data

### Future-Proofing Decisions

**Today (S7.5):**
- JobConfigPayload is pure data (no UI concerns)
- Transform functions separate domain from rendering
- Component registry enables runtime UI switching

**Tomorrow (Living Glass):**
- Same JobConfigPayload works with new renderers
- Json-render catalog expands to cover forms
- Visual identity (orange ⏰) remains consistent

---

## Designer Input Requested

### 1. Visual Identity Refinement

**Question:** Does the orange ⏰ palette work for JobConfig, or should we explore alternatives?

**Considerations:**
- Orange signals "operational" vs blue "strategic"
- Must pass WCAG contrast requirements
- Should feel distinct from error states (red)
- Future Living Glass compatibility

**Options to Explore:**
- Primary Orange: `#FF9800` (current)
- Alternative: `#FF6F00` (darker, more assertive)
- Alternative: `#FFA726` (lighter, softer)
- Alternative: Different hue entirely (purple? teal?)

**Request:** Provide 3 visual direction options with hex codes

### 2. Hybrid Section Separation

**Question:** Is the visual divider between Configuration and Status sections clear enough?

**Current Approach:**
```
┌─ Configuration ─┐
│  [Form Fields]  │
└─────────────────┘
        ↓
┌─ Status ─┐
│ [Rendered] │
└───────────┘
```

**Alternatives to Consider:**
- Solid divider line (vs gradient)
- Different background tint per section
- Section tabs (Config | Status)
- Completely merged layout

**Request:** Sketch 2-3 layout alternatives showing section separation

### 3. Card Density & Information Hierarchy

**Question:** How much information should be visible on the JobConfigCard without opening the editor?

**Current Information:**
- Job name + icon
- Enabled/disabled status
- Schedule (cron expression)
- Batch size
- Last run status
- Action buttons (Configure, Run Now)

**Decision Needed:**
- Is the cron expression too technical? Show human-readable instead?
- Should we show next run time or last run time?
- Add execution status indicator?
- Include recent error count?

**Request:** Define card information priority (must-have vs nice-to-have)

### 4. Empty State & Onboarding

**Question:** When operators first encounter Job Configurations, what should they see?

**Scenario:** 4 jobs identified (1 active, 3 disabled). Should we:
- Show all 4 jobs with their current state?
- Show only active jobs by default?
- Show empty state with "Configure your first job"?

**Request:** Design empty state and onboarding flow

### 5. Error State & Recovery

**Question:** How should configuration errors be communicated?

**Scenarios:**
- Invalid cron expression
- Connection to job executor failed
- Batch size exceeds limits
- Schedule conflict with another job

**Current Approach:**
- Inline validation messages
- Error alert component in status section
- [Retry] button for transient failures

**Request:** Define error state visual language

### 6. Living Glass Future-Proofing

**Question:** What visual elements should we establish now that will survive the migration to Living Glass?

**Key Elements to Preserve:**
- Orange ⏰ color identity for job operations
- Clock iconography
- "Job" vs "Rule" mental model separation
- Config + Status as two sides of same object

**Request:** Identify 3-5 visual elements that should be canonical and preserved

---

## Component Specifications

### JobConfigCard

**Props:**
```typescript
interface JobConfigCardProps {
  object: GroveObject<JobConfigPayload>;
  onConfigure: (id: string) => void;
  onRunNow: (id: string) => void;
}
```

**Visual States:**
1. **Enabled & Healthy** — Green status indicator
2. **Enabled & Failing** — Red status with alert
3. **Disabled** — Grayed out, subtle border
4. **Never Run** — Blue status, "not yet executed"

### JobConfigEditor

**Layout:**
- Max width: 1200px
- Two-column on desktop (config left, status right)
- Single column on mobile (config top, status bottom)
- Sticky header with save/cancel actions

**Section Spacing:**
- Configuration: 24px padding
- Divider: 32px margin
- Status: 24px padding

### Status Section (Json-Render)

**Components to Include:**
1. Current phase indicator
2. Progress bar (if running)
3. Metrics row (duration, errors, next run)
4. Recent log entries (last 5)
5. Error alert (if failed)
6. Next run countdown

**Refresh Strategy:**
- Real-time updates for running jobs (5s interval)
- Historical data for completed jobs (no refresh)
- Manual refresh button for debugging

---

## Migration Path

### Phase 1: S7.5 Implementation (Current)

**Deliverables:**
- JobConfigCard in grid
- JobConfigEditor with hybrid rendering
- Visual differentiation established
- 4 jobs configured (1 active, 3 disabled)

### Phase 2: Operator Feedback (Post-Launch)

**Gather:**
- Are the orange ⏰ vs blue ⚡ distinctions clear?
- Is the config + status separation intuitive?
- Do operators understand "Job Config" vs "Advancement Rule"?
- Any confusion about job types?

**Iterate:**
- Refine visual language based on feedback
- Adjust information hierarchy on cards
- Clarify empty states and onboarding

### Phase 3: Living Glass Evolution (Future Sprint)

**Visions:**
- Unified object view (config + status together)
- Json-render for configuration (forms become declarative)
- Operators think in domain objects, not UI paradigms
- Same orange ⏰ identity, evolved presentation

---

## Success Metrics

### Operator Effectiveness

**Quantitative:**
- Time to change job schedule (target: <2 minutes)
- Configuration error rate (target: <5%)
- Successfully enabled disabled aggregation jobs (target: 100%)

**Qualitative:**
- "I know this is a job configuration, not an advancement rule"
- "I can see the job status without opening the editor"
- "The orange color helps me quickly identify operational settings"

### Visual Clarity

**Checks:**
- Can operators instantly distinguish AdvancementRule from JobConfig?
- Is the hybrid rendering (config + status) visually separated?
- Does the card show enough information to make decisions?
- Are error states clear and actionable?

---

## Reference Materials

### Existing Patterns

**FeatureFlagCard.tsx:**
- Simple toggle pattern
- 2-column grid layout
- Minimal information density

**AdvancementRuleCard.tsx:**
- Blue palette precedent
- Complex configuration needs
- Rule builder pattern

**SignalsCatalog (Json-render):**
- Status display pattern
- Component vocabulary
- Transform function architecture

### Pattern Decisions

**Following:**
- Grid card pattern from FeatureFlag
- Section header pattern from AdvancementRule
- Json-render pattern from SignalsCatalog
- Visual differentiation from UX Chief requirements

**Deviating:**
- Hybrid rendering (mixing React + json-render) — No direct precedent
- Dual-section editor — New pattern being established
- Orange operational identity — New color territory

---

## Deliverables Requested

### From Designer

**Priority 1 (Required):**
1. **Visual Identity Options** — 3 color palette directions for JobConfig (orange family)
2. **Section Separation Design** — 2-3 options for config/status divider
3. **Card Information Hierarchy** — Define what appears on JobConfigCard
4. **Empty State Design** — First-time user experience

**Priority 2 (Valuable):**
5. **Error State Language** — Visual system for configuration errors
6. **Living Glass Preservation Plan** — 5 visual elements to maintain
7. **Mobile Responsive Approach** — How sections stack on small screens

**Format:**
- Figma mockups or sketches
- Hex color codes for all variations
- Brief rationale for each decision
- WCAG contrast check for accessibility

### Timeline

**Design Exploration:** 1-2 days
**Review & Iteration:** 0.5 day
**Final Approval:** 0.5 day
**Developer Handoff:** Ready

---

## Questions for Discussion

1. **Mental Model:** Will operators immediately understand "Job Configuration" as separate concept from "Advancement Rule"?

2. **Visual Weight:** Should JobConfig cards feel as prominent as AdvancementRule cards, or more like FeatureFlags (lighter weight)?

3. **Color Accessibility:** Orange (#FF9800) on white background — sufficient contrast? Alternative suggestions?

4. **Hybrid Rendering:** Is the visual divider between config + status clear enough, or do we need stronger separation?

5. **Future Migration:** What visual elements must we establish now to ensure a smooth transition to Living Glass?

---

## Appendix: Technical Context

### GroveObject Pattern

**Why This Matters for Design:**
- Same card/editor pattern works for all GroveObjects
- Operators learn one interaction model
- New object types feel familiar
- Visual identity (color, icon) distinguishes types

### Json-Render Architecture

**Implications:**
- Status section is data-driven, not hand-coded
- Components can be reused (JobMetricRow from SignalsCatalog)
- Transform functions keep domain logic separate
- Future: Same status components work for other object types

### EXPERIENCE_TYPE_REGISTRY

**Integration Point:**
```typescript
// Every new GroveObject type registers here
EXPERIENCE_TYPE_REGISTRY = {
  'feature-flag': FeatureFlagCard,
  'advancement-rule': AdvancementRuleCard,
  'job-config': JobConfigCard,  // ← New entry
}
```

This ensures consistent grid rendering and polymorphic behavior.

---

**End of Designer Briefing**

*Next Step: Designer review and feedback*
*Timeline: 1-2 days for exploration, 0.5 day for iteration*
*Outcome: Visual design approved for developer implementation*
