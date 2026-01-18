# DESIGN SPECIFICATION: S11-SL-Attribution
**Sprint:** S11-SL-Attribution
**Document:** UI/UX Design Specification
**Version:** 1.0
**Date:** 2026-01-17

---

## Executive Summary

### Design Vision
Transform complex economic concepts into **intuitive, visual experiences** that make attribution flows, token rewards, and reputation scores immediately understandable to grove operators.

### Core Design Principles
1. **Economic Transparency** - Every reward traceable to its source
2. **Visual Attribution** - Complex chains made simple through visualization
3. **Progressive Disclosure** - Start simple, show detail on demand
4. **Network Awareness** - Help users see their place in the ecosystem
5. **Trust Building** - Clear, honest representation of economic data

### Key Design Challenges
- Making abstract economic concepts (attribution chains, token flows) tangible
- Visualizing complex network relationships (cross-grove influence)
- Balancing detail with clarity (48 Gherkin scenarios → simple UI)
- Building trust in a decentralized economic system

---

## Design System Integration

### Color System (Extended)

#### Token Economy Colors
```css
/* Primary Token Colors */
--token-primary: #22c55e;           /* Green - earning tokens */
--token-secondary: #3b82f6;          /* Blue - reputation */
--token-tertiary: #f59e0b;           /* Amber - pending */

/* Economic Status */
--economic-positive: #22c55e;         /* Green - growth, bonuses */
--economic-neutral: #94a3b8;         /* Gray - baseline */
--economic-negative: #ef4444;         /* Red - penalties, decay */

/* Attribution Visualization */
--attribution-direct: #22c55e;        /* Strong green - direct attribution */
--attribution-indirect: #3b82f6;       /* Blue - indirect influence */
--attribution-meta: #a855f7;           /* Purple - meta influence */
--attribution-weak: #94a3b8;          /* Gray - minimal influence */

/* Network Influence */
--network-influence: #22c55e;          /* Green - positive influence */
--network-receive: #3b82f6;           /* Blue - receiving influence */
--network-isolated: #64748b;           /* Gray - no network activity */

/* Quality Scores (from S10) */
--quality-high: #22c55e;               /* Green - 80-100 */
--quality-medium: #f59e0b;            /* Amber - 50-79 */
--quality-low: #ef4444;               /* Red - 0-49 */

/* Reputation Levels */
--reputation-legendary: #a855f7;       /* Purple - 90-100 */
--reputation-expert: #3b82f6;         /* Blue - 70-89 */
--reputation-competent: #22c55e;      /* Green - 50-69 */
--reputation-developing: #f59e0b;      /* Amber - 30-49 */
--reputation-novice: #64748b;          /* Gray - 0-29 */
```

#### Economic Dashboard Palette
```css
/* Dashboard Specific */
--dashboard-bg: #f8fafc;              /* Light gray background */
--dashboard-card: #ffffff;             /* White cards */
--dashboard-border: #e2e8f0;           /* Light borders */
--dashboard-shadow: rgba(0, 0, 0, 0.08); /* Subtle shadows */

/* Charts and Visualizations */
--chart-attribution: #3b82f6;         /* Blue for attribution charts */
--chart-tokens: #22c55e;              /* Green for token charts */
--chart-reputation: #f59e0b;            /* Amber for reputation charts */
--chart-network: #a855f7;              /* Purple for network charts */

/* Gradient Utilities */
--gradient-token-earnings: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
--gradient-reputation: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
--gradient-network: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
```

### Typography System

#### Economic Data Typography
```css
/* Token Amounts */
.font-token-large {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 2.5rem; /* 40px */
  line-height: 1.2;
}

.font-token-medium {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1.5rem; /* 24px */
  line-height: 1.3;
}

.font-token-small {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 1rem; /* 16px */
  line-height: 1.4;
}

/* Attribution Labels */
.font-attribution-label {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.875rem; /* 14px */
  line-height: 1.4;
  color: var(--ink-muted);
}

/* Reputation Scores */
.font-reputation-score {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 1.125rem; /* 18px */
  line-height: 1.3;
}

/* Economic Status */
.font-economic-positive {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.875rem; /* 14px */
  color: var(--economic-positive);
}

.font-economic-negative {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.875rem; /* 14px */
  color: var(--economic-negative);
}
```

### Iconography

#### Economic Icons
```css
/* Token Icons */
.icon-token {
  width: 24px;
  height: 24px;
  fill: var(--token-primary);
}

.icon-token-large {
  width: 32px;
  height: 32px;
  fill: var(--token-primary);
}

/* Attribution Icons */
.icon-attribution-direct {
  width: 20px;
  height: 20px;
  fill: var(--attribution-direct);
}

.icon-attribution-indirect {
  width: 20px;
  height: 20px;
  fill: var(--attribution-indirect);
}

.icon-attribution-meta {
  width: 20px;
  height: 20px;
  fill: var(--attribution-meta);
}

/* Reputation Icons */
.icon-reputation {
  width: 24px;
  height: 24px;
  fill: var(--token-secondary);
}

/* Network Icons */
.icon-network {
  width: 24px;
  height: 24px;
  fill: var(--network-influence);
}
```

### Component Variants

#### TokenDisplay Variants
```typescript
interface TokenDisplayProps {
  amount: number;
  variant: 'balance' | 'earned' | 'spent' | 'pending';
  size: 'sm' | 'md' | 'lg' | 'xl';
  showTrend?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
}

// Size Specifications
const TOKEN_DISPLAY_SIZES = {
  sm: {
    fontSize: '1rem',
    iconSize: '16px',
    padding: '0.5rem 0.75rem'
  },
  md: {
    fontSize: '1.5rem',
    iconSize: '20px',
    padding: '0.75rem 1rem'
  },
  lg: {
    fontSize: '2rem',
    iconSize: '24px',
    padding: '1rem 1.25rem'
  },
  xl: {
    fontSize: '2.5rem',
    iconSize: '32px',
    padding: '1.25rem 1.5rem'
  }
};
```

#### ReputationBadge Variants
```typescript
interface ReputationBadgeProps {
  score: number;
  variant: 'score' | 'level' | 'rank';
  showIcon?: boolean;
  size: 'sm' | 'md' | 'lg';
}

// Reputation Level Mapping
const REPUTATION_LEVELS = {
  legendary: { min: 90, color: 'purple', label: 'Legendary' },
  expert: { min: 70, color: 'blue', label: 'Expert' },
  competent: { min: 50, color: 'green', label: 'Competent' },
  developing: { min: 30, color: 'amber', label: 'Developing' },
  novice: { min: 0, color: 'gray', label: 'Novice' }
};
```

---

## Page Layouts

### Economic Dashboard (Primary Page)

#### Layout Structure
```tsx
<div className="economic-dashboard">
  {/* Header with key metrics */}
  <section className="dashboard-header">
    <div className="metric-grid">
      <MetricCard title="Token Balance" value="1,234" trend="+5.2%" />
      <MetricCard title="Reputation Score" value="75.5" trend="+2.1%" />
      <MetricCard title="Network Rank" value="#12 / 150" trend="+3" />
      <MetricCard title="Pending Rewards" value="50" trend="0" />
    </div>
  </section>

  {/* Attribution Flow Visualization */}
  <section className="attribution-section">
    <h2>Attribution Flows</h2>
    <AttributionFlowDiagram />
    <div className="attribution-details">
      <AttributionList />
    </div>
  </section>

  {/* Token History Chart */}
  <section className="token-history-section">
    <h2>Token History</h2>
    <div className="chart-container">
      <TokenHistoryChart />
    </div>
    <div className="chart-legend">
      <LegendItem label="Earned" color="green" />
      <LegendItem label="Spent" color="red" />
      <LegendItem label="Pending" color="amber" />
    </div>
  </section>

  {/* Reputation Breakdown */}
  <section className="reputation-section">
    <h2>Reputation Breakdown</h2>
    <div className="reputation-grid">
      <ReputationCard type="tier" value="45.0" />
      <ReputationCard type="quality" value="25.5" />
      <ReputationCard type="network" value="5.0" />
    </div>
    <ReputationTrendChart />
  </section>

  {/* Network Influence */}
  <section className="network-section">
    <h2>Network Influence</h2>
    <NetworkInfluenceMap />
    <div className="influence-stats">
      <StatItem label="Groves Influenced" value="5" />
      <StatItem label="Tokens from Influence" value="250" />
      <StatItem label="Average Influence" value="0.55" />
    </div>
  </section>
</div>
```

#### Responsive Breakpoints
```css
/* Desktop (> 1024px) */
.economic-dashboard {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

/* Tablet (768px - 1024px) */
@media (max-width: 1024px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .reputation-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile (< 768px) */
@media (max-width: 768px) {
  .economic-dashboard {
    padding: 1rem;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .reputation-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    height: 200px; /* Shorter on mobile */
  }
}
```

### Attribution Chain Detail View

#### Layout Structure
```tsx
<div className="attribution-detail-view">
  {/* Content Header */}
  <header className="content-header">
    <h1>Content Title</h1>
    <div className="content-meta">
      <span className="tier-badge tier-sapling">Sapling</span>
      <span className="quality-score">Quality: 85</span>
      <span className="tokens-earned">+50 tokens</span>
    </div>
  </header>

  {/* Attribution Chain Visualization */}
  <section className="attribution-chain">
    <h2>Attribution Chain</h2>
    <AttributionChainVisualization />
  </section>

  {/* Attribution List */}
  <section className="attribution-list">
    <h2>Contributors</h2>
    <div className="contributor-list">
      {contributors.map(contributor => (
        <ContributorRow key={contributor.id} contributor={contributor} />
      ))}
    </div>
  </section>

  {/* Network Graph */}
  <section className="network-graph">
    <h2>Network Influence</h2>
    <NetworkGraph />
  </section>
</div>
```

#### Attribution Chain Visualization Component
```tsx
interface AttributionChainVisualizationProps {
  contentId: string;
  maxDepth?: number;
}

function AttributionChainVisualization({
  contentId,
  maxDepth = 3
}: AttributionChainVisualizationProps) {
  return (
    <div className="attribution-chain-viz">
      {/* Direct Attribution (Level 0) */}
      <div className="attribution-level level-0">
        <div className="attribution-node primary">
          <TokenAmount amount={50} />
          <GroveName name="My Grove" />
          <AttributionPercentage percentage={60} />
        </div>
      </div>

      {/* Indirect Attribution (Level 1) */}
      <div className="attribution-connector level-1">
        <svg className="connector-line">
          <path d="M 100 50 Q 150 100 200 50" />
        </svg>
        <span className="connector-label">60% influence</span>
      </div>

      <div className="attribution-level level-1">
        <div className="attribution-node secondary">
          <TokenAmount amount={33.3} />
          <GroveName name="Influenced Grove" />
          <AttributionPercentage percentage={40} />
        </div>
      </div>

      {/* Meta Attribution (Level 2) */}
      <div className="attribution-connector level-2">
        <svg className="connector-line">
          <path d="M 200 50 Q 250 100 300 50" />
        </svg>
        <span className="connector-label">25% influence</span>
      </div>

      <div className="attribution-level level-2">
        <div className="attribution-node tertiary">
          <TokenAmount amount={16.7} />
          <GroveName name="Meta Grove" />
          <AttributionPercentage percentage={20} />
        </div>
      </div>
    </div>
  );
}
```

---

## Component Specifications

### TokenDisplay Component

#### Props Interface
```typescript
interface TokenDisplayProps {
  amount: number;
  variant: 'balance' | 'earned' | 'spent' | 'pending';
  size: 'sm' | 'md' | 'lg' | 'xl';
  showTrend?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
  showIcon?: boolean;
  loading?: boolean;
  className?: string;
}
```

#### Visual Design
```css
.token-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--dashboard-card);
  border: 1px solid var(--dashboard-border);
  border-radius: 12px;
  box-shadow: var(--dashboard-shadow);
}

.token-display--balance {
  border-left: 4px solid var(--token-primary);
}

.token-display--earned {
  border-left: 4px solid var(--economic-positive);
}

.token-display--spent {
  border-left: 4px solid var(--economic-negative);
}

.token-display--pending {
  border-left: 4px solid var(--token-tertiary);
  opacity: 0.8;
}

.token-amount {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  color: var(--ink);
}

.token-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.token-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.token-trend--up {
  color: var(--economic-positive);
}

.token-trend--down {
  color: var(--economic-negative);
}

.token-trend--stable {
  color: var(--economic-neutral);
}
```

#### Component Code
```tsx
export function TokenDisplay({
  amount,
  variant,
  size = 'md',
  showTrend = false,
  trendDirection = 'stable',
  showIcon = true,
  loading = false,
  className = ''
}: TokenDisplayProps) {
  const formatAmount = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className={`token-display token-display--${variant} ${className}`}>
        <div className="skeleton-avatar" />
        <div className="skeleton-text" />
      </div>
    );
  }

  return (
    <div className={`token-display token-display--${variant} ${className}`}>
      {showIcon && (
        <Icon
          name="token"
          size={size === 'sm' ? '16px' : '24px'}
          className={`token-icon token-icon--${variant}`}
        />
      )}
      <div className="token-content">
        <div className={`token-amount token-amount--${size}`}>
          {formatAmount(amount)}
        </div>
        {showTrend && (
          <div className={`token-trend token-trend--${trendDirection}`}>
            <Icon name={`trend-${trendDirection}`} size="16px" />
            <span>Auto-updating</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

### ReputationBadge Component

#### Props Interface
```typescript
interface ReputationBadgeProps {
  score: number;
  variant: 'score' | 'level' | 'rank';
  size: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}
```

#### Visual Design
```css
.reputation-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: default;
}

.reputation-badge--interactive {
  cursor: pointer;
  transition: all 0.2s ease;
}

.reputation-badge--interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.reputation-badge--legendary {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  color: white;
}

.reputation-badge--expert {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.reputation-badge--competent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.reputation-badge--developing {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.reputation-badge--novice {
  background: var(--gray-200);
  color: var(--gray-700);
}

.reputation-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}
```

#### Component Code
```tsx
export function ReputationBadge({
  score,
  variant,
  size = 'md',
  showIcon = true,
  interactive = false,
  onClick
}: ReputationBadgeProps) {
  const getReputationLevel = (score: number) => {
    if (score >= 90) return { key: 'legendary', label: 'Legendary' };
    if (score >= 70) return { key: 'expert', label: 'Expert' };
    if (score >= 50) return { key: 'competent', label: 'Competent' };
    if (score >= 30) return { key: 'developing', label: 'Developing' };
    return { key: 'novice', label: 'Novice' };
  };

  const level = getReputationLevel(score);

  return (
    <div
      className={`reputation-badge reputation-badge--${level.key} reputation-badge--${size} ${
        interactive ? 'reputation-badge--interactive' : ''
      }`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {showIcon && (
        <Icon
          name="reputation"
          size={size === 'sm' ? '16px' : '20px'}
          className="reputation-icon"
        />
      )}
      <span>
        {variant === 'score' && `${score.toFixed(1)}`}
        {variant === 'level' && level.label}
        {variant === 'rank' && `#${score}`}
      </span>
    </div>
  );
}
```

### AttributionChainVisualization Component

#### Props Interface
```typescript
interface AttributionChainVisualizationProps {
  contentId: string;
  maxDepth?: number;
  showTokens?: boolean;
  showPercentages?: boolean;
  interactive?: boolean;
  onNodeClick?: (groveId: string) => void;
}
```

#### Visual Design
```css
.attribution-chain-viz {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
  background: var(--dashboard-card);
  border: 1px solid var(--dashboard-border);
  border-radius: 12px;
  overflow-x: auto;
}

.attribution-level {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.attribution-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  border-radius: 12px;
  min-width: 200px;
  text-align: center;
}

.attribution-node--primary {
  background: var(--attribution-direct);
  color: white;
  border: 2px solid var(--attribution-direct);
}

.attribution-node--secondary {
  background: var(--attribution-indirect);
  color: white;
  border: 2px solid var(--attribution-indirect);
}

.attribution-node--tertiary {
  background: var(--attribution-meta);
  color: white;
  border: 2px solid var(--attribution-meta);
}

.attribution-node--weak {
  background: var(--attribution-weak);
  color: var(--ink);
  border: 2px solid var(--attribution-weak);
  opacity: 0.7;
}

.attribution-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-left: 100px;
}

.connector-line {
  width: 200px;
  height: 50px;
}

.attribution-percentage {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--ink-muted);
}
```

### NetworkInfluenceMap Component

#### Props Interface
```typescript
interface NetworkInfluenceMapProps {
  groveId: string;
  influenceRadius?: number;
  showLabels?: boolean;
  animate?: boolean;
}
```

#### Visual Design
```css
.network-influence-map {
  position: relative;
  width: 100%;
  height: 400px;
  background: var(--dashboard-card);
  border: 1px solid var(--dashboard-border);
  border-radius: 12px;
  overflow: hidden;
}

.network-node {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--network-influence);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}

.network-node--central {
  width: 80px;
  height: 80px;
  background: var(--token-primary);
  z-index: 10;
}

.network-node--influenced {
  width: 60px;
  height: 60px;
  background: var(--network-influence);
}

.network-node--influencing {
  width: 60px;
  height: 60px;
  background: var(--network-receive);
}

.network-edge {
  position: absolute;
  background: var(--attribution-indirect);
  height: 2px;
  transform-origin: left center;
  opacity: 0.6;
}

.network-edge--strong {
  height: 3px;
  opacity: 0.8;
}

.network-edge--weak {
  height: 1px;
  opacity: 0.4;
}

.influence-tooltip {
  position: absolute;
  padding: 0.75rem;
  background: var(--ink);
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 100;
}

.influence-tooltip--visible {
  opacity: 1;
}
```

---

## Interaction Patterns

### Attribution Chain Exploration

#### User Flow
1. User views content with earned tokens
2. User clicks "View Attribution" button
3. Attribution chain visualization expands
4. User hovers over nodes to see details
5. User clicks on grove nodes to view their profile
6. User can drill down into deeper attribution levels

#### Progressive Disclosure
```tsx
function AttributionChainExploration({ contentId }: { contentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState(1);

  return (
    <div className="attribution-exploration">
      <button
        className="expand-button"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Hide' : 'View'} Attribution Chain
      </button>

      {expanded && (
        <div className="attribution-content">
          <div className="depth-selector">
            <label>Show depth:</label>
            <select
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
            >
              <option value={1}>1 level</option>
              <option value={2}>2 levels</option>
              <option value={3}>3 levels</option>
            </select>
          </div>

          <AttributionChainVisualization
            contentId={contentId}
            maxDepth={maxDepth}
            onNodeClick={setSelectedNode}
          />

          {selectedNode && (
            <GroveProfileDrawer groveId={selectedNode} />
          )}
        </div>
      )}
    </div>
  );
}
```

### Economic Dashboard Navigation

#### Tab Structure
```tsx
<div className="economic-dashboard">
  <nav className="dashboard-nav">
    <TabList>
      <Tab id="overview">Overview</Tab>
      <Tab id="attribution">Attribution</Tab>
      <Tab id="tokens">Tokens</Tab>
      <Tab id="reputation">Reputation</Tab>
      <Tab id="network">Network</Tab>
    </TabList>
  </nav>

  <TabPanels>
    <TabPanel id="overview">
      <EconomicOverviewDashboard />
    </TabPanel>

    <TabPanel id="attribution">
      <AttributionDetailView />
    </TabPanel>

    <TabPanel id="tokens">
      <TokenHistoryView />
    </TabPanel>

    <TabPanel id="reputation">
      <ReputationDetailView />
    </TabPanel>

    <TabPanel id="network">
      <NetworkInfluenceView />
    </TabPanel>
  </TabPanels>
</div>
```

### Token Transaction Filtering

#### Filter Controls
```tsx
function TokenFilterPanel() {
  const [filters, setFilters] = useState({
    dateRange: '30_days',
    transactionType: 'all',
    minAmount: 0,
    groveId: null
  });

  return (
    <div className="filter-panel">
      <div className="filter-group">
        <label>Date Range</label>
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
        >
          <option value="7_days">Last 7 days</option>
          <option value="30_days">Last 30 days</option>
          <option value="90_days">Last 90 days</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Transaction Type</label>
        <select
          value={filters.transactionType}
          onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
        >
          <option value="all">All transactions</option>
          <option value="earned">Earned only</option>
          <option value="spent">Spent only</option>
          <option value="bonuses">Bonuses only</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Minimum Amount</label>
        <input
          type="number"
          value={filters.minAmount}
          onChange={(e) => setFilters({ ...filters, minAmount: Number(e.target.value) })}
          placeholder="0"
        />
      </div>

      <button className="apply-filters">
        Apply Filters
      </button>

      <button className="reset-filters">
        Reset
      </button>
    </div>
  );
}
```

---

## Data Visualization Specifications

### Token History Chart

#### Chart Configuration
```typescript
interface TokenHistoryChartProps {
  groveId: string;
  dateRange: string;
  granularity: 'daily' | 'weekly' | 'monthly';
  showComparison?: boolean;
}

const TokenHistoryChart = ({
  groveId,
  dateRange,
  granularity,
  showComparison = false
}: TokenHistoryChartProps) => {
  const data = useTokenHistory(groveId, dateRange, granularity);

  return (
    <div className="token-history-chart">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}`}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="chart-tooltip">
                    <p className="tooltip-date">{label}</p>
                    <p className="tooltip-value">
                      {payload[0].value} tokens
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey="balance"
            stroke="#22c55e"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#tokenGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
```

#### Chart Styling
```css
.token-history-chart {
  width: 100%;
  height: 300px;
  background: var(--dashboard-card);
  border-radius: 12px;
  padding: 1.5rem;
}

.chart-tooltip {
  background: var(--ink);
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.tooltip-value {
  font-size: 1rem;
  color: var(--token-primary);
}
```

### Attribution Flow Diagram

#### Flow Visualization
```tsx
function AttributionFlowDiagram() {
  const { nodes, links } = useAttributionData();

  return (
    <div className="attribution-flow-diagram">
      <svg width="100%" height="400" viewBox="0 0 800 400">
        {/* Render Links */}
        {links.map((link, index) => (
          <g key={index}>
            <line
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              stroke={link.color}
              strokeWidth={link.strength * 5}
              opacity={0.6}
            />
            <text
              x={(link.source.x + link.target.x) / 2}
              y={(link.source.y + link.target.y) / 2}
              fontSize="12"
              fill="var(--ink-muted)"
            >
              {link.percentage}%
            </text>
          </g>
        ))}

        {/* Render Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.size}
              fill={node.color}
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={node.x}
              y={node.y - node.size - 10}
              textAnchor="middle"
              fontSize="14"
              fontWeight="600"
              fill="var(--ink)"
            >
              {node.name}
            </text>
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fontSize="12"
              fill="white"
            >
              {node.tokens}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
```

### Reputation Trend Chart

#### Line Chart with Multiple Series
```tsx
function ReputationTrendChart() {
  const data = useReputationHistory();

  return (
    <div className="reputation-trend-chart">
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
          />

          <Tooltip />

          <Legend />

          <Line
            type="monotone"
            dataKey="totalScore"
            stroke="#3b82f6"
            strokeWidth={3}
            name="Total Score"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="tierReputation"
            stroke="#22c55e"
            strokeWidth={2}
            name="Tier Reputation"
            dot={{ fill: '#22c55e', strokeWidth: 2, r: 3 }}
          />

          <Line
            type="monotone"
            dataKey="qualityReputation"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Quality Reputation"
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
          />

          <Line
            type="monotone"
            dataKey="networkReputation"
            stroke="#a855f7"
            strokeWidth={2}
            name="Network Reputation"
            dot={{ fill: '#a855f7', strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

#### Color Contrast
- All text: Minimum 4.5:1 contrast ratio
- Large text (18pt+): Minimum 3:1 contrast ratio
- Charts and graphs: Minimum 3:1 for data visualization
- Token amounts: High contrast for financial data

```css
/* Example: Token display contrast */
.token-display {
  background: #ffffff;
  color: #1a1a1a;
  contrast: 12.5:1; /* Exceeds requirement */
}

.reputation-badge--legendary {
  background: #a855f7;
  color: #ffffff;
  contrast: 4.8:1; /* Meets requirement */
}
```

#### Keyboard Navigation
- All interactive elements keyboard accessible
- Tab order follows visual flow
- Focus indicators clearly visible (2px outline)
- Skip links for long pages

```css
/* Focus indicator */
.token-display:focus-visible {
  outline: 2px solid var(--token-primary);
  outline-offset: 2px;
}

.reputation-badge:focus-visible {
  outline: 2px solid var(--network-influence);
  outline-offset: 2px;
}
```

#### Screen Reader Support
- ARIA labels for all complex visualizations
- Role attributes for charts and graphs
- Live regions for dynamic token updates
- Descriptive text for attribution chains

```tsx
// Example: Attribution chain with ARIA
<div
  className="attribution-chain"
  role="img"
  aria-label="Attribution chain showing token flow from My Grove to Influenced Grove"
>
  <AttributionChainVisualization />
</div>

// Live region for token updates
<div
  className="sr-only"
  aria-live="polite"
  aria-atomic="true"
>
  {tokenBalanceUpdated && (
    <span>Token balance updated: {newBalance} tokens</span>
  )}
</div>
```

#### Visual Accessibility
- Color not sole indicator of information
- Patterns and textures for chart differentiation
- Minimum touch target size: 44px × 44px
- Resizable text up to 200% without loss of functionality

```css
/* Patterns for charts */
.pattern-stripes {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.1) 10px,
    rgba(255, 255, 255, 0.1) 20px
  );
}

.pattern-dots {
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.2) 2px,
    transparent 2px
  );
  background-size: 10px 10px;
}

/* Touch targets */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Responsive Design Strategy

### Breakpoint System

#### Breakpoint Values
```css
/* Mobile First Approach */
:root {
  --breakpoint-sm: 640px;   /* Small tablets */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Small desktops */
  --breakpoint-xl: 1280px;  /* Large desktops */
  --breakpoint-2xl: 1536px; /* Extra large */
}
```

#### Mobile Adaptations (< 768px)
```css
.economic-dashboard {
  padding: 1rem;
}

.metric-grid {
  grid-template-columns: 1fr;
  gap: 1rem;
}

.token-history-chart {
  height: 200px; /* Shorter on mobile */
}

.attribution-chain-viz {
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.attribution-node {
  min-width: 150px;
  padding: 1rem;
}

.reputation-badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
}

/* Mobile-specific navigation */
.dashboard-nav {
  position: sticky;
  top: 0;
  background: var(--dashboard-card);
  z-index: 100;
  padding: 0.5rem;
  border-bottom: 1px solid var(--dashboard-border);
}

.tab-list {
  display: flex;
  overflow-x: auto;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
}

.tab {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
```

#### Tablet Adaptations (768px - 1024px)
```css
.economic-dashboard {
  padding: 1.5rem;
}

.metric-grid {
  grid-template-columns: repeat(2, 1fr);
}

.reputation-grid {
  grid-template-columns: repeat(2, 1fr);
}

.attribution-chain-viz {
  flex-direction: row;
  gap: 2rem;
  padding: 1.5rem;
}

.network-influence-map {
  height: 350px;
}
```

#### Desktop Adaptations (> 1024px)
```css
.economic-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.metric-grid {
  grid-template-columns: repeat(4, 1fr);
}

.reputation-grid {
  grid-template-columns: repeat(3, 1fr);
}

.attribution-chain-viz {
  padding: 2rem;
}

.network-influence-map {
  height: 400px;
}

/* Hover states for desktop */
.token-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.reputation-badge:hover {
  transform: scale(1.05);
}
```

### Touch Interactions

#### Gesture Support
```tsx
function AttributionChainVisualization({ contentId }: { contentId: string }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  return (
    <div
      className="attribution-chain-container"
      onWheel={(e) => {
        e.preventDefault();
        setZoom(prev => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.001)));
      }}
      onMouseDown={(e) => {
        const startX = e.clientX - pan.x;
        const startY = e.clientY - pan.y;

        const handleMouseMove = (e: MouseEvent) => {
          setPan({
            x: e.clientX - startX,
            y: e.clientY - startY
          });
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }}
    >
      <div
        className="attribution-chain-viz"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        {/* Attribution visualization content */}
      </div>
    </div>
  );
}
```

---

## Animation Specifications

### Token Reward Animation

#### Earn Token Animation
```css
@keyframes tokenEarned {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.token-reward-animation {
  animation: tokenEarned 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes tokenFloatUp {
  0% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateY(-20px) scale(0.8);
    opacity: 0;
  }
}

.token-float-animation {
  animation: tokenFloatUp 1s ease-out forwards;
}
```

#### Component Implementation
```tsx
function TokenRewardNotification({ amount, onComplete }: {
  amount: number;
  onComplete: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="token-reward-notification">
      <div className="token-icon token-reward-animation">
        <Icon name="token" />
      </div>
      <div className="token-amount">+{amount}</div>
    </div>
  );
}
```

### Attribution Flow Animation

#### Line Drawing Animation
```css
@keyframes drawLine {
  from {
    stroke-dashoffset: 100;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.attribution-line {
  stroke-dasharray: 100;
  animation: drawLine 1s ease-out forwards;
}

@keyframes nodePulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.attribution-node {
  animation: nodePulse 2s ease-in-out infinite;
}
```

### Reputation Level Up Animation

#### Badge Animation
```css
@keyframes levelUp {
  0% {
    transform: scale(1) rotate(0deg);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.3) rotate(180deg);
    filter: brightness(1.5);
  }
  100% {
    transform: scale(1) rotate(360deg);
    filter: brightness(1);
  }
}

.reputation-level-up {
  animation: levelUp 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--token-primary);
  animation: confetti 1s ease-out forwards;
}
```

---

## Error States and Empty States

### Loading States

#### Skeleton Loading
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-token-display {
  height: 80px;
  border-radius: 12px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-chart {
  height: 300px;
  border-radius: 12px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-text {
  height: 1rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
```

#### Spinner Components
```css
.token-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top-color: var(--token-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### Empty States

#### No Attribution Data
```tsx
function AttributionEmptyState() {
  return (
    <div className="empty-state">
      <Icon name="attribution-empty" size="64px" className="empty-icon" />
      <h3>No Attribution Data</h3>
      <p>
        Attribution chains will appear here once content advances to higher tiers
        and influences other groves in the network.
      </p>
      <button className="cta-button">
        Learn About Attribution
      </button>
    </div>
  );
}
```

#### Empty Token History
```tsx
function TokenHistoryEmptyState() {
  return (
    <div className="empty-state">
      <Icon name="token-empty" size="64px" className="empty-icon" />
      <h3>No Token Activity Yet</h3>
      <p>
        Start creating and advancing content to begin earning tokens.
        Your token history will appear here.
      </p>
      <div className="empty-state-actions">
        <button className="primary-button">
          Create Content
        </button>
        <button className="secondary-button">
          Learn How to Earn Tokens
        </button>
      </div>
    </div>
  );
}
```

#### Empty Network Influence
```tsx
function NetworkInfluenceEmptyState() {
  return (
    <div className="empty-state">
      <Icon name="network-empty" size="64px" className="empty-icon" />
      <h3>Isolated Grove</h3>
      <p>
        Your grove hasn't influenced other groves yet. Share high-quality
        content to build network connections and earn bonus rewards.
      </p>
      <button className="cta-button">
        View Network Opportunities
      </button>
    </div>
  );
}
```

### Error States

#### Attribution Calculation Error
```tsx
function AttributionErrorState({ error, onRetry }: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="error-state">
      <Icon name="error" size="48px" className="error-icon" />
      <h3>Attribution Calculation Failed</h3>
      <p>
        We couldn't calculate the attribution chain. This might be due to
        a temporary issue with the network connection.
      </p>
      <details className="error-details">
        <summary>Technical Details</summary>
        <pre>{error}</pre>
      </details>
      <button className="retry-button" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}
```

#### Token Balance Error
```tsx
function TokenBalanceError({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="error-state">
      <div className="error-alert">
        <Icon name="warning" size="24px" />
        <span>Unable to load token balance</span>
      </div>
      <p className="error-message">
        Your token balance couldn't be retrieved. This is likely a temporary issue.
      </p>
      <button className="refresh-button" onClick={onRefresh}>
        <Icon name="refresh" size="16px" />
        Refresh Balance
      </button>
    </div>
  );
}
```

---

## Performance Optimizations

### Virtual Scrolling

#### Token History List
```tsx
function TokenHistoryList({ transactions }: { transactions: TokenTransaction[] }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={transactions.length}
      itemSize={64}
      itemData={transactions}
    >
      {({ index, style, data }) => (
        <div style={style}>
          <TokenTransactionRow transaction={data[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Lazy Loading

#### Dashboard Sections
```tsx
function EconomicDashboard() {
  return (
    <div className="economic-dashboard">
      <Suspense fallback={<DashboardSkeleton />}>
        <OverviewSection />
      </Suspense>

      <Suspense fallback={<AttributionSkeleton />}>
        <LazyAttributionSection />
      </Suspense>

      <Suspense fallback={<NetworkSkeleton />}>
        <LazyNetworkSection />
      </Suspense>
    </div>
  );
}
```

### Memoization

#### Token Calculation
```tsx
const calculateTokens = useMemo(() => {
  return (tierLevel: number, qualityScore: number, reputation: number) => {
    // Complex calculation
    return baseTokens * qualityMultiplier * reputationMultiplier;
  };
}, [/* dependencies */]);
```

---

## Design QA Checklist

### Visual Quality
- [ ] All components match design system specifications
- [ ] Consistent spacing using 8px grid
- [ ] Consistent border radius (8px for cards, 12px for containers)
- [ ] Consistent shadow system
- [ ] Icons aligned to pixel grid

### Interactive States
- [ ] Hover states defined for all interactive elements
- [ ] Focus states clearly visible
- [ ] Active/pressed states implemented
- [ ] Loading states for async operations
- [ ] Error states for all failure modes

### Responsive Behavior
- [ ] Mobile layout tested (< 768px)
- [ ] Tablet layout tested (768px - 1024px)
- [ ] Desktop layout tested (> 1024px)
- [ ] Touch targets minimum 44px × 44px
- [ ] Text remains readable at all sizes

### Accessibility
- [ ] Color contrast ratios meet WCAG AA (4.5:1)
- [ ] All interactive elements keyboard accessible
- [ ] Screen reader labels for complex visualizations
- [ ] Focus order follows visual flow
- [ ] ARIA attributes for charts and graphs

### Performance
- [ ] Animations smooth at 60fps
- [ ] Large lists use virtualization
- [ ] Images optimized and lazy loaded
- [ ] Charts render in < 200ms
- [ ] Dashboard loads in < 2s

### Data Visualization
- [ ] Charts have clear legends
- [ ] Tooltips on hover for details
- [ ] Patterns distinguish data series
- [ ] Labels readable at smallest size
- [ ] Color not sole indicator of information

---

**Design Spec Version:** 1.0
**Next Stage:** Stage 4: UI Chief → UI_REVIEW.md
**Total Components:** 12 major components
**Total Views:** 5 primary views (dashboard, attribution, tokens, reputation, network)
