# Technical Specification: S15-BD-FederationEditors-v1

**Sprint:** S15-BD-FederationEditors-v1
**Domain:** Bedrock (BD)
**Author:** UX Chief
**Date:** 2026-01-18

---

## Constitutional Reference

- [x] Read: `The_Trellis_Architecture__First_Order_Directives.md`
- [x] Read: `Bedrock_Architecture_Specification.md`
- [x] Read: `docs/BEDROCK_SPRINT_CONTRACT.md` (Article XI added)
- [x] Read: `docs/sprints/s9-sl-federation-v1/INSPECTOR_PANEL_UX_VISION.md`

---

## DEX Compliance Matrix

### Feature: Federation Editor Factory Alignment

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ PASS | Editors use InspectorSection config; Article XI mandates pattern |
| Capability Agnosticism | ✅ PASS | Editors display data, no model-generated content |
| Provenance as Infrastructure | ✅ PASS | All objects have meta.createdAt/updatedAt |
| Organic Scalability | ✅ PASS | Pattern from ExperienceConsole proven; new types follow template |

**Blocking issues:** None

---

## Console Implementation Checklist

Per Article II of Bedrock Sprint Contract:

- [x] Uses `BedrockLayout` as shell (FederationConsole.tsx - unchanged)
- [x] Header displays: title, description, primary action (unchanged)
- [x] Metrics row shows 4-6 relevant stats (unchanged)
- [x] Navigation column uses `ObjectList` or equivalent (unchanged)
- [x] Content area uses `ObjectGrid` or appropriate view (unchanged)
- [x] Inspector uses `BedrockInspector` shell (to be refactored)
- [ ] Copilot panel integrated with console context (out of scope)
- [x] Navigation declaratively configured (unchanged)
- [x] All object types use `GroveObject` schema (unchanged)

---

## Editor Implementation Checklist

Per Article XI (v1.4) of Bedrock Sprint Contract:

### Layout Compliance
- [x] Uses `InspectorPanel` as outer shell
- [x] Uses `InspectorSection` for all field groups
- [x] Uses `InspectorDivider` between sections
- [x] Standard padding applied (p-5 or via layout primitive)
- [x] No inline style overrides for spacing

### Section Structure
- [x] Identity section with name/ID/description
- [x] Configuration section with domain fields
- [x] Metadata section (collapsed by default)
- [x] Maximum 6 fields per section

### Field Quality
- [x] All fields have visible labels
- [x] Required fields marked with indicator
- [x] Complex data uses appropriate pattern (pills, badges, bars)
- [x] Timestamps formatted for readability

### Responsive
- [x] Tested at 360px width (inspector column)
- [x] No horizontal overflow (fixed via overflow-hidden)
- [x] Mobile layout renders correctly

### Actions
- [x] Save button visible when changes exist
- [x] Delete action with confirmation
- [x] Duplicate action (if applicable)

---

## File Inventory

### Files to Modify

| File | Current Lines | Action |
|------|---------------|--------|
| `src/bedrock/consoles/FederationConsole/GroveEditor.tsx` | 389 | Full refactor |
| `src/bedrock/consoles/FederationConsole/TierMappingEditor.tsx` | 332 | Full refactor |
| `src/bedrock/consoles/FederationConsole/ExchangeEditor.tsx` | 312 | Full refactor |
| `src/bedrock/consoles/FederationConsole/TrustEditor.tsx` | 354 | Full refactor |

### Files to Create

| File | Purpose |
|------|---------|
| `src/bedrock/components/StatusBanner.tsx` | Reusable status visualization |
| `src/bedrock/components/GroveConnectionDiagram.tsx` | Visual grove pair display |
| `src/bedrock/components/ProgressScoreBar.tsx` | Score/confidence visualization |

### Files to Use (Unchanged)

| File | Usage |
|------|-------|
| `src/shared/layout/InspectorPanel.tsx` | Outer shell |
| `src/shared/layout/InspectorSection.tsx` | Section groupings |
| `src/shared/layout/InspectorDivider.tsx` | Section separation |
| `src/bedrock/primitives/BufferedInput.tsx` | Text input fields |

---

## Component Specifications

### StatusBanner

```typescript
// src/bedrock/components/StatusBanner.tsx

interface StatusBannerProps {
  status: 'connected' | 'disconnected' | 'pending' | 'failed' | 'active' | 'inactive';
  label?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

const STATUS_STYLES = {
  connected: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-300', dot: 'bg-green-500' },
  active: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-300', dot: 'bg-green-500' },
  pending: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300', dot: 'bg-amber-500' },
  failed: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-300', dot: 'bg-red-500' },
  disconnected: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-300', dot: 'bg-gray-500' },
  inactive: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-300', dot: 'bg-gray-500' },
};
```

### GroveConnectionDiagram

```typescript
// src/bedrock/components/GroveConnectionDiagram.tsx

interface GroveConnectionDiagramProps {
  sourceGrove: string;
  targetGrove: string;
  sourceLabel?: string;  // e.g., "Source", "Requesting"
  targetLabel?: string;  // e.g., "Target", "Providing"
  onSourceChange?: (value: string) => void;
  onTargetChange?: (value: string) => void;
  readonly?: boolean;
  icon?: React.ReactNode;  // Center icon (default: compare_arrows)
  className?: string;
}

// Layout:
// [SourceIcon + Input]  ←→  [TargetIcon + Input]
// Stacks vertically on mobile
```

### ProgressScoreBar

```typescript
// src/bedrock/components/ProgressScoreBar.tsx

interface ProgressScoreBarProps {
  value: number;  // 0-100
  showValue?: boolean;
  valueFormat?: 'percent' | 'decimal' | 'custom';
  customValueFormatter?: (value: number) => string;
  markers?: Array<{ position: number; label: string }>;
  gradient?: { from: string; to: string };  // Default: green → cyan
  height?: 'sm' | 'md' | 'lg';  // Default: 'md'
  className?: string;
}

// Visual:
// [██████████░░░░░░] 85%
//  |    |    |    |
// New  Est  Tru  Ver
```

---

## Editor Refactoring Pattern

### Before (Current)

```typescript
// ❌ Current pattern - ad-hoc sections
<div className={`space-y-6 ${className}`}>
  <section>
    <h3 className="text-sm font-medium...">Basic Information</h3>
    <div className="space-y-4">
      <div>
        <label className="block text-xs...">Grove Name</label>
        <input type="text" ... />
      </div>
    </div>
  </section>
</div>
```

### After (Factory Pattern)

```typescript
// ✅ Factory pattern - shared primitives
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { StatusBanner } from '../../components/StatusBanner';

<div className="flex flex-col h-full" data-testid="grove-editor">
  {/* Status Banner */}
  <StatusBanner
    status={payload.connectionStatus}
    label={payload.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
    description="Grove is actively participating in federation"
    actions={
      <button className="px-3 py-1.5 rounded-lg text-sm...">
        {payload.connectionStatus === 'connected' ? 'Disconnect' : 'Connect'}
      </button>
    }
  />

  {/* Scrollable Content */}
  <div className="flex-1 overflow-y-auto">
    <InspectorSection title="Identity">
      <div className="space-y-3">
        <div>
          <label htmlFor="grove-name" className="block text-xs text-[var(--glass-text-muted)] mb-1">
            Grove Name
          </label>
          <BufferedInput
            id="grove-name"
            value={payload.name}
            onChange={(v) => patchPayload('name', v)}
            placeholder="My Grove Community"
            aria-describedby="grove-name-help"
          />
          <p id="grove-name-help" className="text-xs text-[var(--glass-text-muted)] mt-1">
            A descriptive name for this grove
          </p>
        </div>
      </div>
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Connection" collapsible>
      {/* Fields */}
    </InspectorSection>

    {/* More sections... */}
  </div>

  {/* Footer Actions */}
  <div className="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
    <button
      disabled={!hasChanges}
      onClick={onSave}
      className="w-full px-4 py-2.5 rounded-lg bg-[var(--neon-cyan)] text-[var(--glass-void)] font-medium
                 hover:bg-[var(--neon-cyan)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Save Changes
    </button>
    <div className="flex items-center gap-2">
      <button onClick={onDuplicate} className="flex-1 px-4 py-2 rounded-lg border...">
        <span className="material-symbols-outlined text-sm mr-1">content_copy</span>
        Duplicate
      </button>
      <button onClick={onDelete} className="flex-1 px-4 py-2 rounded-lg border border-red-500/30...">
        <span className="material-symbols-outlined text-sm mr-1">delete</span>
        Delete
      </button>
    </div>
  </div>
</div>
```

---

## Section Mapping

### GroveEditor Sections

| Section | Fields | Collapsible |
|---------|--------|-------------|
| Identity | Grove Name, Description, Grove ID (readonly) | No |
| Connection | Status, Connection Status, Endpoint, Trust Score Bar | No |
| Technical | Tier System Name, Tiers List, Capabilities | Yes |
| Statistics | Total Sprouts, Exchanges, Trust Level, Last Sync (readonly) | Yes |

### TierMappingEditor Sections

| Section | Fields | Collapsible |
|---------|--------|-------------|
| Grove Pair | GroveConnectionDiagram (source ↔ target) | No |
| Status & Confidence | Mapping Status, Confidence Score Bar | No |
| Tier Equivalences | List of source → target mappings with equivalence type | No |
| Validation | Validated At, Validated By (readonly) | Yes |

### ExchangeEditor Sections

| Section | Fields | Collapsible |
|---------|--------|-------------|
| Exchange Type | Direction (request/offer), Content Type, Token Preview | No |
| Grove Parties | GroveConnectionDiagram (requesting ↔ providing) | No |
| Content Details | Search Query, Content ID | No |
| Tier Mapping | Source Tier, Mapped Tier | Yes |
| Status | Current Status, Final Token Value | No |
| Timeline | Vertical timeline of status changes (readonly) | Yes |

### TrustEditor Sections

| Section | Fields | Collapsible |
|---------|--------|-------------|
| Grove Pair | GroveConnectionDiagram | No |
| Overall Trust | Trust Level Stars, Score, Token Multiplier, ProgressScoreBar | No |
| Component Scores | 4 score cards with sliders (Exchange, Tier, Time, Quality) | No |
| Exchange Statistics | Total, Successful, Success Rate | Yes |
| Verification | Verified By, Verified At | Yes |
| Recent Activity | Activity list (readonly) | Yes |

---

## Testing Strategy

### Unit Tests

Not required - editors are UI-only, tested via E2E.

### E2E Tests

Existing tests in `tests/e2e/federation-console-v1.spec.ts` should continue to pass. Add visual verification for:

- InspectorSection present
- InspectorDivider present
- Footer actions visible
- Status banner for applicable editors
- ProgressScoreBar for trust/confidence

### Visual QA

Per Article IX of Bedrock Sprint Contract:

1. **Screenshots Location:** `docs/sprints/s15-bd-federation-editors-v1/screenshots/`
2. **Required Screenshots:**
   - Each editor at full state
   - Each editor at mobile width (360px)
   - Status banner variations
   - ProgressScoreBar variations

---

## Accessibility Requirements

### Per US-FE-009

1. **Label Associations:**
   - All inputs have unique `id`
   - All labels use `htmlFor`
   - Help text linked via `aria-describedby`
   - Required fields have `aria-required="true"`

2. **Keyboard Navigation:**
   - Logical tab order
   - Focus visible on all interactive elements
   - Collapsible sections keyboard-accessible

3. **Screen Reader:**
   - Section headings are `<h4>`
   - Icon buttons have `aria-label`
   - Status changes use `aria-live="polite"`

---

## Responsive Requirements

### Per US-FE-010

1. **360px Width:**
   - No horizontal overflow
   - All fields full width
   - Two-column grids stack vertically

2. **Touch Targets:**
   - Minimum 44px for interactive elements
   - Adequate spacing between touch targets

---

## Feature Parity Status

| Feature | Legacy Location | Bedrock Status | Parity? |
|---------|-----------------|----------------|---------|
| Grove editing | N/A (new in S9) | Refactor in progress | N/A |
| Tier mapping editing | N/A (new in S9) | Refactor in progress | N/A |
| Exchange editing | N/A (new in S9) | Refactor in progress | N/A |
| Trust editing | N/A (new in S9) | Refactor in progress | N/A |

---

## Patterns Extended

| Pattern | Source | Extension |
|---------|--------|-----------|
| InspectorSection | ExperienceConsole | Used in all Federation editors |
| BufferedInput | ExperienceConsole | Used in all Federation editors |
| StatusBanner | NEW | Created for Federation, reusable |
| GroveConnectionDiagram | NEW | Created for Federation, reusable |
| ProgressScoreBar | NEW | Created for Federation, reusable |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| E2E tests break | Low | High | Run full suite after each editor refactor |
| BufferedInput race conditions | Low | Medium | Use existing battle-tested component |
| Mobile layout regressions | Medium | Medium | Test at 360px after each change |
| Accessibility violations | Low | Medium | Use checklist, test with screen reader |

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| InspectorSection | Available | `src/shared/layout` |
| InspectorDivider | Available | `src/shared/layout` |
| BufferedInput | Available | `src/bedrock/primitives` |
| Article XI (Contract) | Added | v1.4 |
| S9 E2E tests | Passing | 35/35 |

---

## Estimation

| Phase | Stories | Points | Time |
|-------|---------|--------|------|
| Foundation | US-FE-001, 006, 007, 008 | 14 | 1 day |
| Editors | US-FE-002, 003, 004, 005 | 20 | 2 days |
| Quality | US-FE-009, 010 | 6 | 0.5 days |
| **Total** | 10 stories | 40 points | 3.5 days |

---

*Specification follows Bedrock Sprint Contract v1.4 requirements.*
