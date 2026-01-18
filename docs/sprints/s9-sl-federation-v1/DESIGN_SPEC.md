# Design Specification: S9-SL-Federation-v1

## Wireframes

### Federation Console Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ HUDHeader (obsidian)                                              │
├─────────────────────────────────────────────────────────────────┤
│ NavSidebar                          │ Main Content             │
│                                     │                          │
│ 📊 Genesis                         │ Federation Console       │
│ 🌐 Federation ◀─── Active Tab      │                          │
│ ⚡ Advancement                      │ ┌─ Grove Registry ─┐    │
│ ⏰ Job Config                      │ │                    │    │
│ 🎭 Narrative                       │ │ [Register Grove]  │    │
│ 🎧 Audio                           │ │                    │    │
│ 📚 Knowledge                       │ │ Connected: 3       │    │
│ 🔧 Tuner                           │ │ Pending: 1        │    │
│                                     │ │ Blocked: 0        │    │
│ Foundation (obsidian theme)         │ └──────────────────┘    │
│                                     │                          │
│                                     │ ┌─ Grove List ────┐    │
│                                     │ │ Grove A    ⭐⭐⭐ │    │
│                                     │ │ Grove B    ⭐⭐   │    │
│                                     │ │ Grove C    ⭐    │    │
│                                     │ └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Grove Registration Wizard
```
┌─────────────────────────────────────────────────────────────────┐
│ Register New Grove                        [×]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Step 1 of 3: Grove Information                                  │
│                                                                 │
│ Grove Name                                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ My Grove                                                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Description                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Describe your grove's purpose and content...                 │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Tier System                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ┌─ Custom Tier System                                      │ │
│ │ │ ┌─ Tier 1: Seed                                         │ │
│ │ │ ┌─ Tier 2: Sapling                                     │ │
│ │ │ ┌─ Tier 3: Tree                                        │ │
│ └─ └─ [Edit Tiers]                                          │ │
│                                                                 │
│ ┌─ Use Template ─┐  ┌─ Import Schema ─┐  ┌─ Define Custom ─┐  │
│                                                                 │
│                    [Cancel]                    [Next →]           │
└─────────────────────────────────────────────────────────────────┘
```

### Grove Discovery View
```
┌─────────────────────────────────────────────────────────────────┐
│ Discover Federated Groves                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Search: ┌─────────────────────────────────┐ [🔍]              │
│         │ distributed AI communities      │                     │
│         └─────────────────────────────────┘                     │
│                                                                 │
│ Filters: [All] [Verified] [Active] [By Region] [By Topic]     │
│                                                                 │
│ ┌─ Grove Card ──────────────────────────────────────────────┐   │
│ │ 🏛️ Stanford AI Research        ⭐⭐⭐  Trust: 95%          │   │
│ │                                                        │   │
│ │ Academic research focused on distributed inference     │   │
│ │ 1.2K sprouts  |  Tier: 7-tier academic system        │   │
│ │                                                        │   │
│ │ ┌─ [Request Connection] ─┐ ┌─ [View Profile] ─────┐ │   │
│ │ └─ [View Tier Mapping] ─┘ └─ [View Content] ─────┘ │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Grove Card ──────────────────────────────────────────────┐   │
│ │ 🌲 Grove Nordic                  ⭐⭐    Trust: 87%          │   │
│ │                                                        │   │
│ │ Nordic AI cooperative focusing on sustainable models   │   │
│ │ 856 sprouts  |  Tier: botanical (seed→tree)           │   │
│ │                                                        │   │
│ │ ┌─ [Request Connection] ─┐ ┌─ [View Profile] ─────┐ │   │
│ │ └─ [View Tier Mapping] ─┘ └─ [View Content] ─────┘ │   │
│ └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Tier Mapping Configuration
```
┌─────────────────────────────────────────────────────────────────┐
│ Configure Tier Mapping: Grove Nordic                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ How does your tier system map to Grove Nordic's system?         │
│                                                                 │
│ Your System              │  Mapping  │  Grove Nordic System     │
│ ┌─────────────────────┐  │          │ ┌─────────────────────┐  │
│ │ 🌰 Seed             │  │    ≈     │ │ 🌱 Sprout           │  │
│ └─────────────────────┘  │          │ └─────────────────────┘  │
│                            │          │                         │
│ ┌─────────────────────┐  │          │ ┌─────────────────────┐  │
│ │ 🌱 Sapling          │  │    ≈     │ │ 🌿 Sapling          │  │
│ └─────────────────────┘  │          │ └─────────────────────┘  │
│                            │          │                         │
│ ┌─────────────────────┐  │          │ ┌─────────────────────┐  │
│ │ 🌳 Tree             │  │    ≈     │ │ 🌲 Tree             │  │
│ └─────────────────────┘  │          │ └─────────────────────┘  │
│                            │          │                         │
│ ┌─────────────────────┐  │          │ ┌─────────────────────┐  │
│ │ 🌲 Forest          │  │    ≈     │ │ 🌳 Forest           │  │
│ └─────────────────────┘  │          │ └─────────────────────┘  │
│                                                                 │
│ [Add Mapping] [Remove Mapping] [Validate]                       │
│                                                                 │
│ Semantic Equivalence Rules:                                      │
│ • Seed ≈ Sprout: Initial content, early stage                  │
│ • Sapling: Growing content, established context                 │
│ • Tree: Mature content, fully developed                        │
│                                                                 │
│                     [Cancel]                    [Save Mapping]   │
└─────────────────────────────────────────────────────────────────┘
```

### Federation Exchange View
```
┌─────────────────────────────────────────────────────────────────┐
│ Federation Activity                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ Incoming Requests ──┐  ┌─ Outgoing Requests ─┐  ┌─ Feed ─┐ │
│ │ 2 pending            │  │ 1 active            │  │ 12 new │  │
│ └──────────────────────┘  └─────────────────────┘  └────────┘  │
│                                                                 │
│ ┌─ Recent Activity ──────────────────────────────────────────┐  │
│ │                                                             │  │
│ │ 📥 Received: Tier 3 Analysis from Stanford AI               │  │
│ │    2 hours ago  |  ⭐⭐⭐  |  Tier mapped: Tree→Academic  │  │
│ │                                                             │  │
│ │ 📤 Sent: Botanical Classification to Grove Nordic           │  │
│ │    5 hours ago |  ⭐⭐  |  Tier mapped: Seed→Sprout      │  │
│ │                                                             │  │
│ │ 📥 Received: Connection request from MIT Research           │  │
│ │    1 day ago  |  ⭐⭐⭐⭐  |  Pending approval          │  │
│ │                                                             │  │
│ └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Specifications

### Federation Console
```typescript
// Main console component
export function FederationConsole(): JSX.Element {
  return (
    <div className="federation-console">
      <div className="console-header">
        <h1>Federation Console</h1>
        <GroveStatusBadge />
      </div>

      <div className="console-tabs">
        <TabList>
          <Tab id="registry">Grove Registry</Tab>
          <Tab id="discovery">Discovery</Tab>
          <Tab id="mappings">Tier Mappings</Tab>
          <Tab id="activity">Activity</Tab>
          <Tab id="governance">Governance</Tab>
        </TabList>

        <TabPanel id="registry">
          <GroveRegistry />
        </TabPanel>

        <TabPanel id="discovery">
          <GroveDiscovery />
        </TabPanel>

        <TabPanel id="mappings">
          <TierMappingManager />
        </TabPanel>

        <TabPanel id="activity">
          <FederationActivity />
        </TabPanel>

        <TabPanel id="governance">
          <GovernanceSettings />
        </TabPanel>
      </div>
    </div>
  )
}
```

### Grove Registration Wizard
```typescript
// Multi-step registration wizard
export function GroveRegistrationWizard(): JSX.Element {
  return (
    <Modal className="grove-registration-modal">
      <ModalHeader
        title="Register New Grove"
        onClose={handleClose}
      />

      <StepIndicator current={currentStep} total={3} />

      <ModalBody>
        <AnimatePresence mode="wait">
          {currentStep === 1 && <GroveInfoForm />}
          {currentStep === 2 && <TierSystemForm />}
          {currentStep === 3 && <GovernanceForm />}
        </AnimatePresence>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!isStepValid}
        >
          {currentStep === 3 ? 'Register Grove' : 'Next →'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
```

### Grove Discovery Interface
```typescript
// Grove discovery with search and filters
export function GroveDiscovery(): JSX.Element {
  return (
    <div className="grove-discovery">
      <SearchBar
        placeholder="Search groves by name, topic, or region..."
        onSearch={handleSearch}
      />

      <FilterPanel>
        <FilterGroup title="Verification">
          <FilterOption value="verified">Verified Only</FilterOption>
          <FilterOption value="all">All Groves</FilterOption>
        </FilterGroup>

        <FilterGroup title="Activity">
          <FilterOption value="active">Active</FilterOption>
          <FilterOption value="all">All</FilterOption>
        </FilterGroup>

        <FilterGroup title="Region">
          <FilterOption value="na">North America</FilterOption>
          <FilterOption value="eu">Europe</FilterOption>
          <FilterOption value="asia">Asia</FilterOption>
        </FilterGroup>
      </FilterPanel>

      <GroveCardList>
        {groves.map(grove => (
          <GroveCard
            key={grove.id}
            grove={grove}
            onRequestConnection={handleRequestConnection}
            onViewProfile={handleViewProfile}
            onViewMapping={handleViewMapping}
          />
        ))}
      </GroveCardList>

      <Pagination
        current={currentPage}
        total={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
```

### Grove Card Component
```typescript
// Individual grove display card
export function GroveCard({
  grove,
  onRequestConnection,
  onViewProfile,
  onViewMapping
}): JSX.Element {
  return (
    <Card className="grove-card">
      <CardHeader>
        <div className="grove-icon">
          {grove.icon || '🏛️'}
        </div>
        <div className="grove-title">
          <h3>{grove.name}</h3>
          <TrustStars level={grove.trustLevel} />
        </div>
      </CardHeader>

      <CardBody>
        <p className="grove-description">
          {grove.description}
        </p>

        <div className="grove-stats">
          <Stat label="Sprouts" value={grove.sproutCount} />
          <Stat
            label="Tier System"
            value={grove.tierSystem}
            variant="muted"
          />
        </div>
      </CardBody>

      <CardActions>
        <Button
          variant="primary"
          size="small"
          onClick={() => onRequestConnection(grove.id)}
        >
          Request Connection
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => onViewProfile(grove.id)}
        >
          View Profile
        </Button>
        <Button
          variant="tertiary"
          size="small"
          onClick={() => onViewMapping(grove.id)}
        >
          Tier Mapping
        </Button>
      </CardActions>
    </Card>
  )
}
```

### Tier Mapping Editor
```typescript
// Visual tier mapping configuration
export function TierMappingEditor({
  sourceGrove,
  targetGrove,
  mappings,
  onSave
}): JSX.Element {
  return (
    <div className="tier-mapping-editor">
      <div className="mapping-header">
        <h3>
          Configure Tier Mapping: {targetGrove.name}
        </h3>
        <p>
          How does your tier system map to {targetGrove.name}'s system?
        </p>
      </div>

      <div className="mapping-visualization">
        <TierSystemDisplay
          grove={sourceGrove}
          side="left"
          onEditTier={handleEditSourceTier}
        />

        <MappingConnector />

        <TierSystemDisplay
          grove={targetGrove}
          side="right"
          onEditTier={handleEditTargetTier}
        />
      </div>

      <SemanticRulesEditor
        mappings={mappings}
        onUpdateRules={handleUpdateRules}
      />

      <div className="mapping-actions">
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(mappings)}
          disabled={!mappings.isValid}
        >
          Save Mapping
        </Button>
      </div>
    </div>
  )
}
```

## Interaction Patterns

### Discovery Flow
1. **Enter Discovery**: User navigates to Federation Console → Discovery tab
2. **Search**: User enters search query or browses featured groves
3. **Filter**: User applies filters (verification, activity, region, topic)
4. **Browse**: User reviews grove cards with trust ratings and tier systems
5. **Preview**: User views grove profile to understand governance and policies
6. **Request**: User initiates connection request to desired grove
7. **Await**: User waits for grove operator to approve/deny request

### Registration Flow
1. **Initiate**: User clicks "Register Grove" in Federation Console
2. **Information**: User enters grove name, description, and metadata
3. **Tier System**: User defines or imports tier taxonomy
4. **Governance**: User configures federation policies and trust requirements
5. **Verify**: System performs verification (cryptographic, reputation)
6. **Complete**: Grove is registered and discoverable by other groves

### Tier Mapping Flow
1. **Select Grove**: User selects grove for tier mapping configuration
2. **Visual Editor**: User sees side-by-side tier systems
3. **Map Tiers**: User creates bidirectional mappings between tiers
4. **Semantic Rules**: User defines equivalence rules and validation
5. **Validate**: System validates mapping for consistency
6. **Save**: User saves mapping configuration

### Federation Activity Flow
1. **Monitor**: User views incoming/outgoing requests and activity feed
2. **Review**: User reviews pending connection requests
3. **Approve/Deny**: User approves or denies based on grove policies
4. **Track**: User monitors active exchanges and content flow
5. **Govern**: User adjusts governance settings as needed

## Design System Alignment

### Color Palette
```css
/* Federation Console Colors */
:root {
  /* Foundation (obsidian) */
  --foundation-dark: #1a1a2e;
  --foundation-darker: #0f0f1e;
  --foundation-accent: #00d4ff;

  /* Trust Levels */
  --trust-low: #ff6b6b;
  --trust-medium: #ffd93d;
  --trust-high: #6bcf7f;
  --trust-verified: #4dabf7;

  /* Federation States */
  --state-pending: #ffd93d;
  --state-active: #6bcf7f;
  --state-blocked: #ff6b6b;

  /* Tier Mapping */
  --mapping-connector: #00d4ff;
  --tier-source: #4dabf7;
  --tier-target: #6bcf7f;
}
```

### Typography
```css
/* Federation Console Typography */
.federation-console {
  --font-family-base: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;

  /* Hierarchy */
  --text-h1: 2rem;    /* Console Title */
  --text-h2: 1.5rem;  /* Section Headers */
  --text-h3: 1.25rem;  /* Grove Names */
  --text-body: 1rem;   /* Descriptions */
  --text-small: 0.875rem; /* Stats, Labels */
}
```

### Component Variants
```typescript
// Grove Card Variants
interface GroveCardProps {
  variant: 'default' | 'featured' | 'pending' | 'blocked';
  trustLevel: 1 | 2 | 3 | 4 | 5;
  verificationStatus: 'verified' | 'unverified' | 'pending';
}

// Trust Badge Component
interface TrustBadgeProps {
  level: number;              // 1-5 stars
  verified: boolean;         // Verification checkmark
  score: number;             // 0-100 numerical score
  showNumeric?: boolean;      // Show numerical score
}
```

## Accessibility Considerations

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Visible focus indicators, logical tab order
- **Error Messages**: Clear, actionable error messaging

### ARIA Implementation
```typescript
// Accessible Grove Card
<div
  className="grove-card"
  role="article"
  aria-labelledby={`grove-title-${grove.id}`}
  aria-describedby={`grove-description-${grove.id}`}
>
  <h3 id={`grove-title-${grove.id}`}>{grove.name}</h3>
  <p id={`grove-description-${grove.id}`}>
    {grove.description}
  </p>

  <div
    role="group"
    aria-label="Grove actions"
  >
    <Button
      aria-label={`Request connection to ${grove.name}`}
      onClick={() => handleRequestConnection(grove.id)}
    >
      Request Connection
    </Button>
  </div>
</div>
```

### Keyboard Shortcuts
```
Tab / Shift+Tab     Navigate between elements
Enter / Space       Activate buttons and links
↑ ↓                 Navigate grove cards
Esc                 Close modals and wizards
Ctrl+Enter         Save tier mappings
```

### Screen Reader Support
```typescript
// Trust Rating with Screen Reader Support
<div
  className="trust-rating"
  aria-label={`Trust level: ${trustLevel} out of 5 stars`}
  role="img"
>
  <TrustStars level={trustLevel} />
  <span className="sr-only">
    Trust score: {trustScore}%. {
      verified ? 'Verified grove' : 'Unverified grove'
    }
  </span>
</div>
```

### Visual Accessibility
- **Focus Indicators**: 2px solid #00d4ff outline for keyboard focus
- **Error States**: Red border (#ff6b6b) with icon and text
- **Success States**: Green border (#6bcf7f) with icon and text
- **Loading States**: Skeleton screens with proper ARIA busy states
- **Reduced Motion**: Respect prefers-reduced-motion for animations

### Mobile Responsiveness
```css
/* Responsive Breakpoints */
.federation-console {
  /* Mobile First */
  --grid-template-columns: 1fr;

  @media (min-width: 768px) {
    --grid-template-columns: 280px 1fr;
  }

  @media (min-width: 1024px) {
    --grid-template-columns: 280px 1fr 320px;
  }
}

/* Grove Card Responsive */
.grove-card {
  /* Mobile: Full width, stacked layout */
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
  }
}
```

---

**Prepared By**: Designer
**Date**: 2026-01-16
**Next Stage**: UI Chief interface review