# Design Specification: S8-SL-MultiModel-v1

## Wireframes

### Multi-Model Dashboard (Foundation Console)
```
┌─────────────────────────────────────────────────────────────┐
│ FOUNDATION / MultiModel                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [All Models] [Healthy] [Degraded] [Unhealthy] [+] Add    │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Gemini 2.0      │  │ Claude Opus     │  │ Local Kimik2 │ │
│  │                 │  │                 │  │              │ │
│  │ 🟢 Healthy      │  │ 🟡 Degraded     │  │ 🔴 Unhealthy │ │
│  │                 │  │                 │  │              │ │
│  │ Latency: 450ms  │  │ Latency: 1200ms │  │ Not responding│ │
│  │ Success: 99.8%  │  │ Success: 87.3%  │  │              │ │
│  │                 │  │                 │  │              │ │
│  │ [View Details]  │  │ [View Details]  │  │ [Retry]      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Performance Overview (Last 24 Hours)                   │ │
│  │                                                         │ │
│  │ Response Time      ████████░░ 450ms avg                │ │
│  │ Success Rate      ██████████ 98.5%                     │ │
│  │ Token Usage       ██████░░░░ 2.3M tokens               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Model Details View
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard     Gemini 2.0                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Status ─┐  ┌─ Capabilities ─┐  ┌─ Performance ─┐     │
│  │          │  │                │  │               │     │
│  │ 🟢 Active│  │ ✓ Reasoning    │  │ Latency: 450ms│     │
│  │          │  │ ✓ Creativity   │  │ Success: 99.8%│     │
│  │ 99.9%    │  │ ✓ Precision    │  │ Tokens: 1.2M  │     │
│  │ uptime   │  │ ✗ Speed       │  │ Cost: $24.50  │     │
│  └──────────┘  └────────────────┘  └───────────────┘     │
│                                                             │
│  ┌─ Routing Rules ─────────────────────────────────────────┐ │
│  │                                                        │ │
│  │ Requests tagged as:                                     │ │
│  │ • Complex analysis → Route to this model (Priority 1)  │ │
│  │ • Creative writing → Route to this model (Priority 1)  │ │
│  │ • Quick answers → Route to Claude (Priority 2)         │ │
│  │                                                        │ │
│  │ [Edit Rules]                                           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ Performance Chart (7 Days) ────────────────────────────┐ │
│  │                                                         │ │
│  │ Response Time                                          │ │
│  │ 1000ms ┤                                              │ │
│  │  800ms ┤     ●                                        │ │
│  │  600ms ┤       ●   ●                                 │ │
│  │  400ms ┤         ●       ●                           │ │
│  │  200ms ┤             ●       ●                       │ │
│  │    0ms └─────────────────────────────────────────────│ │
│  │       Mon Tue Wed Thu Fri Sat Sun                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  [Configure] [View Logs] [Disable] [Remove]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Add Model Wizard (3 Steps)
```
┌─────────────────────────────────────────────────────────────┐
│ Add New Model                              Step 1 of 3      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ○ Model Details  ● Capabilities  ○ Validation             │
│                                                             │
│  Model Name                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Gemini 2.0 Flash                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Provider                                                   │
│  ○ Google Gemini  ○ Anthropic Claude  ○ Local Model       │
│                        ○ Other: [___________]               │
│                                                             │
│  API Endpoint                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ https://generativelanguage.googleapis.com/v1beta/...│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  API Key (Stored Encrypted)                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ████████████████████████████████████████████████ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Description (Optional)                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ High-quality reasoning and analysis model            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                         [Next →]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Specifications

### ModelCard Component
**Purpose:** Display model overview with key metrics
**Props:**
```typescript
interface ModelCardProps {
  model: {
    id: string;
    name: string;
    provider: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    latencyMs: number;
    successRate: number;
    uptime: number;
  };
  onViewDetails: (id: string) => void;
  onDisable?: (id: string) => void;
}
```

**Styling:**
- Card with subtle border and glow effect
- Status indicator (colored dot + text)
- Metric badges (latency, success rate)
- Primary action button (View Details)
- Consistent with existing MetricCard pattern

### CapabilityTag Component
**Purpose:** Display model capabilities
**Props:**
```typescript
interface CapabilityTagProps {
  capability: string;
  available: boolean;
  priority?: 1 | 2 | 3;
}
```

**Variants:**
- Available: Grove Forest green (#2F5C3B)
- Unavailable: Gray with strikethrough
- Priority indicator: Small number badge

### RoutingRuleEditor Component
**Purpose:** Edit routing rules for models
**Props:**
```typescript
interface RoutingRuleEditorProps {
  rules: RoutingRule[];
  availableModels: Model[];
  onSave: (rules: RoutingRule[]) => void;
}
```

**Features:**
- Drag-and-drop priority ordering
- Tag-based rule creation
- Preview of affected requests
- Conflict detection

### PerformanceChart Component
**Purpose:** Display time-series performance data
**Props:**
```typescript
interface PerformanceChartProps {
  data: TimeSeriesDataPoint[];
  metric: 'latency' | 'successRate' | 'tokens' | 'cost';
  timeframe: '1h' | '24h' | '7d' | '30d';
}
```

**Implementation:**
- Reuse existing chart components from Foundation
- Color-coded by metric type
- Hover tooltips with exact values
- Responsive design

## Interaction Patterns

### Navigation
- **Primary Navigation**: Foundation Console sidebar → "MultiModel"
- **Secondary Navigation**: Dashboard → Model Details
- **Breadcrumbs**: Foundation / MultiModel / {Model Name}
- **Back Navigation**: Consistent back button on all detail views

### Adding Models
1. Click "[+] Add" button in dashboard header
2. Wizard opens as modal overlay (3 steps)
3. Step 1: Model Details (name, provider, endpoint)
4. Step 2: Capabilities (select from taxonomy)
5. Step 3: Validation (test connection, save)
6. Success: Toast notification, new model appears in dashboard

### Viewing Performance
1. Click model card → Model Details view
2. Overview section shows real-time status
3. Performance chart loads with 7-day default
4. Interactive hover for exact values
5. Time range selector updates chart

### Editing Routing Rules
1. In Model Details, click "Configure" under Routing Rules
2. Modal opens with rule editor
3. Add/edit/delete rules
4. Priority ordering via drag-and-drop
5. Save → rules active immediately

### Health Monitoring
- Dashboard shows health status at-a-glance
- Color coding: Green (healthy), Yellow (degraded), Red (unhealthy)
- Real-time updates via WebSocket or polling
- Alert badges for critical issues

## Design System

### Colors
**Primary Palette:**
- Grove Forest: `#2F5C3B` (healthy status, primary actions)
- Grove Clay: `#D95D39` (degraded status, warnings)
- Ink: `#1C1C1C` (text)
- Paper: `#FBFBF9` (backgrounds)

**Status Indicators:**
- Healthy: `#4CAF50` (green)
- Degraded: `#FF9800` (orange)
- Unhealthy: `#F44336` (red)
- Unknown: `#9E9E9E` (gray)

**Charts:**
- Primary: Grove Forest
- Secondary: Grove Clay
- Tertiary: `#81C784` (light green)

### Typography
- **Headers**: Playfair Display, 24-32px
- **Body**: Inter, 14-16px
- **Labels**: Inter Medium, 12-14px
- **Code**: JetBrains Mono, 12-14px

### Components
**Reuse Existing Patterns:**
- `MetricCard` → Base for ModelCard
- `GlowButton` → Primary actions
- `StatusBadge` → Model status indicators
- `DataPanel` → Chart containers
- `GlowInput` → Form inputs

**New Components:**
- ModelCard (extends MetricCard)
- CapabilityTag (custom)
- RoutingRuleEditor (complex form)
- PerformanceChart (wraps chart library)

### Layout
- **Grid**: 12-column responsive grid
- **Spacing**: 8px base unit (8, 16, 24, 32px)
- **Breakpoints**: Mobile (768px), Tablet (1024px), Desktop (1440px)
- **Cards**: 4px border radius, subtle shadow

## Accessibility

### WCAG AA Compliance
**Color Contrast:**
- All text meets 4.5:1 contrast ratio minimum
- Status indicators use color + icon (not color alone)
- Focus indicators clearly visible

**Keyboard Navigation:**
- All interactive elements keyboard accessible
- Tab order follows logical flow
- Escape key closes modals
- Enter key activates primary actions

**Screen Readers:**
- ARIA labels on all interactive elements
- Status announced: "Model Gemini 2.0, healthy status"
- Charts include data table alternative
- Form labels associated with inputs

**Focus Management:**
- Visible focus outline (2px Grove Forest)
- Modal focus trap (FocusLock component)
- Skip links for long pages

### Specific Features
**Chart Accessibility:**
- Alternative data table below chart
- Screen reader descriptions of trends
- Keyboard navigation through data points

**Status Indicators:**
- Text labels alongside color coding
- Icon support (✓, ⚠, ✗)
- Announced via ARIA live regions

**Form Validation:**
- Inline error messages
- Clear success/error states
- Descriptive error text (not just "Invalid")

## States

### Loading States
**Dashboard Loading:**
- Skeleton screens for model cards
- Shimmer effect on metric numbers
- Chart placeholders with animation

**Model Details Loading:**
- Progressive loading: Status → Capabilities → Chart
- Suspense boundaries for smooth UX
- Error boundaries with retry option

**Adding Model:**
- Step indicator with progress
- Loading spinner during validation
- Success confirmation before closing

### Empty States
**No Models Registered:**
- Illustration with empty state copy
- "Get started" CTA to add first model
- Helpful links to documentation

**No Routing Rules:**
- Empty state with explanation
- "Create your first rule" button
- Examples of common rules

### Error States
**Model Connection Failed:**
- Error message with troubleshooting steps
- "Retry" button for immediate retry
- "Edit Configuration" link

**API Rate Limited:**
- Clear message about rate limits
- Retry countdown timer
- Alternative model suggestion

**Chart Load Failed:**
- Error icon and message
- "Retry" button
- Link to view raw data table

### Success States
**Model Added Successfully:**
- Toast notification (auto-dismiss)
- New model card animates in
- "View Details" highlighted

**Routing Rules Updated:**
- Success confirmation
- Visual highlight of changed rules
- Undo option (5 seconds)

## Responsive Design

### Mobile (< 768px)
- Stack model cards vertically
- Simplified metric display (2 columns max)
- Collapsible detail sections
- Touch-friendly button sizes (44px minimum)

### Tablet (768px - 1024px)
- 2-column model card grid
- Side-by-side capability/status sections
- Horizontal chart scrolling

### Desktop (> 1024px)
- 3-column model card grid
- Full sidebar on model details
- All metrics visible without scrolling
- Hover states on interactive elements

## Animation & Transitions

### Micro-Interactions
- Button hover: Subtle scale (1.02x)
- Card hover: Glow intensity increase
- Status changes: Smooth color transitions (200ms)
- Metric updates: Number tweening animation

### Page Transitions
- Dashboard → Details: Slide right (300ms)
- Modal open/close: Fade + scale (200ms)
- Chart updates: Smooth data transitions (500ms)
- Model addition: Slide up from bottom (250ms)

### Performance Considerations
- Use transform/opacity for animations
- Avoid animating layout properties
- Respect prefers-reduced-motion
- 60fps target for all animations
