# Design Specification: S10-SL-AICuration

**Sprint:** S10-SL-AICuration
**Version:** v1.0
**Date:** 2026-01-16
**Designer:** UI/UX Designer

---

## Overview

This document defines the **user interface design and component specifications** for S10-SL-AICuration: Agent-Driven Quality Assessment. The design implements quality score display, configuration controls, and analytics within the Foundation Console pattern.

**Design Philosophy:** Quality as a visual language - scores should be immediately recognizable, comparable, and actionable.

---

## Design System Integration

### Color Palette
```css
/* Quality Score Colors */
--quality-high: #22c55e;      /* Green - High quality (80-100) */
--quality-medium: #f59e0b;    /* Amber - Medium quality (50-79) */
--quality-low: #ef4444;       /* Red - Low quality (0-49) */
--quality-neutral: #94a3b8;    /* Slate - Not assessed */

/* Quality Dimension Colors */
--quality-accuracy: #3b82f6;   /* Blue */
--quality-utility: #8b5cf6;   /* Purple */
--quality-novelty: #ec4899;    /* Pink */
--quality-provenance: #10b981; /* Emerald */

/* UI Elements */
--quality-badge-bg: rgba(34, 197, 94, 0.1);
--quality-badge-border: #22c55e;
--quality-panel-bg: #ffffff;
--quality-panel-border: #e2e8f0;
```

### Typography
```css
.quality-score {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1.5rem;
  line-height: 2rem;
}

.quality-dimension {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

.quality-label {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 0.75rem;
  line-height: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Page Layouts

### Quality Console

**Route:** `/foundation/quality`

```tsx
<div className="quality-console">
  <div className="console-header">
    <h1>Quality Assessment</h1>
    <div className="header-actions">
      <button className="btn-primary">Configure Thresholds</button>
      <button className="btn-secondary">Federated Learning</button>
    </div>
  </div>

  <div className="console-tabs">
    <Tab value="scores" label="Quality Scores" />
    <Tab value="analytics" label="Analytics" />
    <Tab value="settings" label="Settings" />
  </div>

  <div className="console-content">
    <Outlet />
  </div>
</div>
```

**Tab Structure:**
1. **Quality Scores** - Browse and filter quality scores
2. **Analytics** - Trends, comparisons, benchmarks
3. **Settings** - Thresholds, federated learning config

---

## Component Specifications

### QualityScoreBadge

**Purpose:** Display quality score with visual indicator

**Props:**
```typescript
interface QualityScoreBadgeProps {
  score: number;           // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  detailed?: boolean;       // Show dimensions
}
```

**Visual States:**
```tsx
// High Quality (80-100)
<QualityScoreBadge score={92} detailed={true} />
// Shows: 92 | ●●●●● | Accuracy: 95, Utility: 88

// Medium Quality (50-79)
<QualityScoreBadge score={65} detailed={false} />
// Shows: 65 | ●●●○○

// Low Quality (0-49)
<QualityScoreBadge score={32} />
// Shows: 32 | ●●○○○

// Not Assessed
<QualityScoreBadge score={null} />
// Shows: — | N/A
```

**Implementation:**
```tsx
export function QualityScoreBadge({
  score,
  size = 'md',
  showLabel = true,
  detailed = false
}: QualityScoreBadgeProps) {
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'var(--quality-high)';
    if (score >= 50) return 'var(--quality-medium)';
    return 'var(--quality-low)';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 80) return 'High';
    if (score >= 50) return 'Medium';
    if (score >= 0) return 'Low';
    return 'N/A';
  };

  const renderStars = (score: number) => {
    const stars = Math.floor(score / 20); // 0-5 stars
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        filled={i < stars}
        color={getQualityColor(score)}
      />
    ));
  };

  return (
    <div className={`quality-badge quality-badge--${size}`}>
      <div className="quality-score-display">
        <span className="quality-score">
          {score ?? '—'}
        </span>
        {showLabel && (
          <span className="quality-label">
            {getQualityLabel(score ?? -1)}
          </span>
        )}
      </div>
      <div className="quality-stars">
        {renderStars(score ?? 0)}
      </div>
      {detailed && score !== null && (
        <div className="quality-dimensions">
          <div className="dimension">
            <span className="dimension-label">Acc</span>
            <span className="dimension-score">{dimensions.accuracy}</span>
          </div>
          {/* ... other dimensions ... */}
        </div>
      )}
    </div>
  );
}
```

---

### QualityFilterPanel

**Purpose:** Filter content by quality scores

**Props:**
```typescript
interface QualityFilterPanelProps {
  thresholds: QualityThresholds;
  onChange: (thresholds: QualityThresholds) => void;
  onReset: () => void;
}
```

**Layout:**
```tsx
<div className="quality-filter-panel">
  <div className="filter-header">
    <h3>Quality Filters</h3>
    <button className="btn-link" onClick={onReset}>
      Reset
    </button>
  </div>

  <div className="filter-section">
    <label className="filter-label">
      Overall Score
      <RangeSlider
        min={0}
        max={100}
        value={[thresholds.minOverallScore, 100]}
        onChange={(value) => update('minOverallScore', value[0])}
      />
      <span className="filter-value">
        {thresholds.minOverallScore}+
      </span>
    </label>
  </div>

  <div className="filter-section">
    <h4>Dimensions</h4>
    <SliderField
      label="Accuracy"
      value={thresholds.minAccuracy}
      onChange={(value) => update('minAccuracy', value)}
    />
    <SliderField
      label="Utility"
      value={thresholds.minUtility}
      onChange={(value) => update('minUtility', value)}
    />
    <SliderField
      label="Novelty"
      value={thresholds.minNovelty}
      onChange={(value) => update('minNovelty', value)}
    />
    <SliderField
      label="Provenance"
      value={thresholds.minProvenance}
      onChange={(value) => update('minProvenance', value)}
    />
  </div>

  <div className="filter-actions">
    <button className="btn-primary" onClick={applyFilters}>
      Apply Filters
    </button>
  </div>
</div>
```

**Styling:**
```css
.quality-filter-panel {
  background: var(--quality-panel-bg);
  border: 1px solid var(--quality-panel-border);
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 320px;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}
```

---

### QualityDimensionsBreakdown

**Purpose:** Show detailed quality dimension scores

**Props:**
```typescript
interface QualityDimensionsBreakdownProps {
  dimensions: {
    accuracy: number;
    utility: number;
    novelty: number;
    provenance: number;
  };
  compact?: boolean;
}
```

**Visual:**
```tsx
<div className="quality-dimensions-breakdown">
  <div className="dimension-item">
    <div className="dimension-header">
      <Icon name="check-circle" color="var(--quality-accuracy)" />
      <span className="dimension-name">Accuracy</span>
      <span className="dimension-score">95</span>
    </div>
    <ProgressBar
      value={95}
      color="var(--quality-accuracy)"
      size="sm"
    />
  </div>

  <div className="dimension-item">
    <div className="dimension-header">
      <Icon name="light-bulb" color="var(--quality-utility)" />
      <span className="dimension-name">Utility</span>
      <span className="dimension-score">88</span>
    </div>
    <ProgressBar
      value={88}
      color="var(--quality-utility)"
      size="sm"
    />
  </div>

  <div className="dimension-item">
    <div className="dimension-header">
      <Icon name="sparkles" color="var(--quality-novelty)" />
      <span className="dimension-name">Novelty</span>
      <span className="dimension-score">72</span>
    </div>
    <ProgressBar
      value={72}
      color="var(--quality-novelty)"
      size="sm"
    />
  </div>

  <div className="dimension-item">
    <div className="dimension-header">
      <Icon name="link" color="var(--quality-provenance)" />
      <span className="dimension-name">Provenance</span>
      <span className="dimension-score">91</span>
    </div>
    <ProgressBar
      value={91}
      color="var(--quality-provenance)"
      size="sm"
    />
  </div>
</div>
```

**Styling:**
```css
.quality-dimensions-breakdown {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dimension-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dimension-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dimension-name {
  flex: 1;
  font-weight: 500;
}

.dimension-score {
  font-weight: 600;
  color: var(--ink);
}
```

---

### QualityScoreCard

**Purpose:** Display content with quality score (extends Card pattern)

**Props:**
```typescript
interface QualityScoreCardProps {
  content: FederationExchange;
  showFullDetails?: boolean;
  onOverride?: (scoreId: string) => void;
}
```

**Layout:**
```tsx
<div className="quality-score-card">
  <div className="card-header">
    <div className="card-meta">
      <span className="grove-name">{content.groveName}</span>
      <span className="content-type">{content.contentType}</span>
    </div>
    <QualityScoreBadge
      score={content.qualityScore?.overallScore}
      detailed={true}
    />
  </div>

  <div className="card-content">
    <h3 className="content-title">{content.title}</h3>
    <p className="content-excerpt">{content.excerpt}</p>

    <div className="content-tags">
      {content.tags.map(tag => (
        <span key={tag} className="tag">{tag}</span>
      ))}
    </div>
  </div>

  <div className="card-footer">
    <div className="quality-metadata">
      <span className="assessed-by">
        Assessed: {content.qualityScore.assessedBy}
      </span>
      <span className="assessed-at">
        {formatDate(content.qualityScore.assessedAt)}
      </span>
    </div>

    <div className="card-actions">
      <button className="btn-link" onClick={() => onOverride(content.qualityScore.id)}>
        Override
      </button>
      <button className="btn-primary">View Details</button>
    </div>
  </div>
</div>
```

---

### QualityAnalyticsDashboard

**Purpose:** Display quality trends and benchmarks

**Layout:**
```tsx
<div className="quality-analytics">
  <div className="analytics-header">
    <h2>Quality Analytics</h2>
    <div className="time-range-selector">
      <button className="btn-tab active">7 Days</button>
      <button className="btn-tab">30 Days</button>
      <button className="btn-tab">90 Days</button>
    </div>
  </div>

  <div className="analytics-grid">
    <div className="metric-card">
      <h3>Average Score</h3>
      <div className="metric-value">82.4</div>
      <div className="metric-trend trend-up">↑ 5.2%</div>
    </div>

    <div className="metric-card">
      <h3>Network Percentile</h3>
      <div className="metric-value">73rd</div>
      <div className="metric-trend trend-up">↑ 8 positions</div>
    </div>

    <div className="metric-card">
      <h3>Content Assessed</h3>
      <div className="metric-value">1,247</div>
      <div className="metric-trend trend-flat">→ 0%</div>
    </div>
  </div>

  <div className="analytics-chart">
    <h3>Quality Trend</h3>
    <LineChart
      data={trendData}
      xKey="date"
      yKey="score"
      color="var(--grove-forest)"
    />
  </div>

  <div className="analytics-breakdown">
    <h3>Dimension Performance</h3>
    <RadarChart
      data={dimensionData}
      keys={['accuracy', 'utility', 'novelty', 'provenance']}
      colors={[
        'var(--quality-accuracy)',
        'var(--quality-utility)',
        'var(--quality-novelty)',
        'var(--quality-provenance)'
      ]}
    />
  </div>
</div>
```

---

### QualityThresholdConfig

**Purpose:** Configure quality thresholds and federated learning

**Layout:**
```tsx
<div className="quality-threshold-config">
  <div className="config-section">
    <h3>Quality Thresholds</h3>
    <p className="section-description">
      Configure minimum quality scores for incoming federated content
    </p>

    <div className="threshold-controls">
      <SliderField
        label="Minimum Overall Score"
        value={thresholds.minOverallScore}
        onChange={(value) => updateThreshold('minOverallScore', value)}
        min={0}
        max={100}
        step={5}
      />

      <SliderField
        label="Accuracy"
        value={thresholds.minAccuracy}
        onChange={(value) => updateThreshold('minAccuracy', value)}
        min={0}
        max={100}
        step={5}
      />

      <SliderField
        label="Utility"
        value={thresholds.minUtility}
        onChange={(value) => updateThreshold('minUtility', value)}
        min={0}
        max={100}
        step={5}
      />

      <SliderField
        label="Novelty"
        value={thresholds.minNovelty}
        onChange={(value) => updateThreshold('minNovelty', value)}
        min={0}
        max={100}
        step={5}
      />

      <SliderField
        label="Provenance"
        value={thresholds.minProvenance}
        onChange={(value) => updateThreshold('minProvenance', value)}
        min={0}
        max={100}
        step={5}
      />
    </div>

    <div className="threshold-toggle">
      <Toggle
        checked={thresholds.enabled}
        onChange={(checked) => updateThreshold('enabled', checked)}
        label="Enable Quality Filtering"
      />
    </div>
  </div>

  <div className="config-section">
    <h3>Federated Learning</h3>
    <p className="section-description">
      Participate in federated learning to improve quality assessment models
    </p>

    <div className="learning-config">
      <Toggle
        checked={federatedLearning.participationEnabled}
        onChange={(checked) => updateFL('participationEnabled', checked)}
        label="Enable Federated Learning"
      />

      <SelectField
        label="Privacy Level"
        value={federatedLearning.privacyLevel}
        onChange={(value) => updateFL('privacyLevel', value)}
        options={[
          { value: 'full', label: 'Full (Share all data)' },
          { value: 'anonymized', label: 'Anonymized (Recommended)' },
          { value: 'aggregated', label: 'Aggregated Only' }
        ]}
      />

      <SelectField
        label="Update Frequency"
        value={federatedLearning.updateFrequency}
        onChange={(value) => updateFL('updateFrequency', value)}
        options={[
          { value: 'real-time', label: 'Real-time' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' }
        ]}
      />
    </div>
  </div>

  <div className="config-actions">
    <button className="btn-primary" onClick={saveConfig}>
      Save Configuration
    </button>
    <button className="btn-secondary" onClick={resetConfig}>
      Reset to Defaults
    </button>
  </div>
</div>
```

---

### QualityOverrideModal

**Purpose:** Manual quality score override

**Layout:**
```tsx
<div className="quality-override-modal">
  <div className="modal-header">
    <h2>Override Quality Score</h2>
    <button className="modal-close" onClick={onClose}>
      <Icon name="x" />
    </button>
  </div>

  <div className="modal-content">
    <div className="score-info">
      <h3>Current Score</h3>
      <QualityScoreBadge score={currentScore} detailed={true} />
    </div>

    <div className="override-form">
      <div className="form-field">
        <label>New Overall Score</label>
        <input
          type="number"
          min="0"
          max="100"
          value={newScore}
          onChange={(e) => setNewScore(Number(e.target.value))}
          className="score-input"
        />
        <RangeSlider
          min={0}
          max={100}
          value={newScore}
          onChange={(value) => setNewScore(value)}
        />
      </div>

      <div className="form-field">
        <label>Reason for Override</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this score needs adjustment..."
          className="reason-input"
        />
      </div>
    </div>

    <div className="override-impact">
      <h4>Impact</h4>
      <p>This override will:</p>
      <ul>
        <li>Update the quality score for this content</li>
        <li>Be recorded in the override history</li>
        <li>Contribute to model training (if federated learning enabled)</li>
        <li>Notify the content provider grove</li>
      </ul>
    </div>
  </div>

  <div className="modal-actions">
    <button className="btn-secondary" onClick={onClose}>
      Cancel
    </button>
    <button
      className="btn-primary"
      onClick={submitOverride}
      disabled={!newScore || !reason}
    >
      Submit Override
    </button>
  </div>
</div>
```

---

## Interaction Patterns

### Quality Score Interaction
1. **Hover:** Show tooltip with score explanation
2. **Click (detailed):** Expand to show dimension breakdown
3. **Click (simple):** Open quality score modal
4. **Override:** Operator-only action, requires confirmation

### Filtering Workflow
1. Open Quality Filter Panel
2. Adjust threshold sliders
3. Preview filtered results
4. Apply or reset filters
5. Save as default for grove

### Analytics Navigation
1. Select time range (7/30/90 days)
2. View trend chart
3. Drill down into dimension performance
4. Compare to network benchmarks
5. Export analytics data

---

## Responsive Design

### Breakpoints
```css
/* Mobile */
@media (max-width: 768px) {
  .quality-score-badge--lg {
    font-size: 1.25rem;
  }

  .quality-dimensions-breakdown {
    grid-template-columns: 1fr;
  }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .analytics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .analytics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Quality score text: 4.5:1 minimum
- Progress bars: 3:1 minimum
- Badge backgrounds: Meet AA standards

**Keyboard Navigation:**
- All interactive elements keyboard accessible
- Tab order follows visual flow
- Focus indicators visible (2px outline)

**Screen Reader Support:**
- Quality scores announced with context
- Dimension names clearly labeled
- Score changes announced

**ARIA Attributes:**
```tsx
<QualityScoreBadge
  score={score}
  aria-label={`Quality score: ${score} out of 100`}
  aria-describedby="quality-explanation"
/>

<div
  id="quality-explanation"
  role="tooltip"
  className="sr-only"
>
  This score is based on accuracy, utility, novelty, and provenance
</div>
```

---

## Component Hierarchy

```
QualityConsole
├── ConsoleHeader
├── ConsoleTabs
│   ├── QualityScoresTab
│   │   ├── QualityFilterPanel
│   │   └── QualityScoreList
│   │       └── QualityScoreCard[]
│   ├── AnalyticsTab
│   │   ├── QualityAnalyticsDashboard
│   │   ├── TrendChart
│   │   └── RadarChart
│   └── SettingsTab
│       ├── QualityThresholdConfig
│       └── FederatedLearningConfig
└── Modals
    ├── QualityOverrideModal
    └── QualityScoreModal
```

---

## Visual States

### Loading States
```tsx
// Quality score loading
<QualityScoreBadge score={null} loading={true} />
// Shows: ••• | Loading...

// Analytics loading
<div className="analytics-loading">
  <Spinner />
  <p>Loading quality analytics...</p>
</div>
```

### Error States
```tsx
// Quality score error
<QualityScoreBadge score={null} error={true} />
// Shows: ! | Error

// Override error
<div className="override-error">
  <Icon name="alert-circle" />
  <p>Failed to override score. Please try again.</p>
</div>
```

### Empty States
```tsx
// No quality scores
<div className="empty-state">
  <Icon name="quality" size="lg" />
  <h3>No Quality Scores Yet</h3>
  <p>Quality scores will appear as federated content is assessed.</p>
  <button className="btn-primary">Learn More</button>
</div>
```

---

## Testing Requirements

### Visual Testing
- Quality score badge rendering at all sizes
- Color accuracy for quality levels
- Dimension breakdown display
- Analytics chart rendering

### Interaction Testing
- Threshold filtering behavior
- Score override workflow
- Modal open/close animations
- Responsive layout at breakpoints

### Accessibility Testing
- Screen reader announcement of quality scores
- Keyboard navigation through quality interface
- Color contrast verification
- Focus indicator visibility

---

## Design Handoff

### Developer Notes
- All quality score calculations happen in Core module
- UI components receive pre-calculated scores
- No ML inference in UI layer
- Use QualityScoreBadge component for consistency

### Assets Required
- Quality score icons (star, badge)
- Dimension icons (accuracy, utility, novelty, provenance)
- Analytics chart components (Line, Radar)
- Loading and error state illustrations

### API Integration
- GET /api/quality/scores/:contentId
- POST /api/quality/overrides
- GET /api/quality/analytics/:groveId
- POST /api/quality/thresholds

---

**Design Specification Complete**
**Next:** UI Chief - Design Review
**Status:** Ready for Review
