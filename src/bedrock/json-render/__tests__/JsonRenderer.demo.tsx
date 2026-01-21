// src/bedrock/json-render/__tests__/JsonRenderer.demo.tsx
// Sprint: S19-BD-JsonRenderFactory
// Demo/test component for visual verification of JsonRenderer
//
// Usage: Import this component in a page to visually verify the renderer works

import React from 'react';
import type { RenderTree } from '@core/json-render';
import { JsonRenderer } from '../JsonRenderer';

// Import to register base components
import '../register-base';

// =============================================================================
// TEST TREES
// =============================================================================

/**
 * Simple test tree with basic components
 */
export const simpleTestTree: RenderTree = {
  type: 'root',
  children: [
    {
      type: 'base:Header',
      props: {
        title: 'JsonRenderer Demo',
        subtitle: 'Visual verification of base components',
        level: 'h2',
      },
      key: 'header-1',
    },
    {
      type: 'base:Text',
      props: {
        content: 'This is a demo of the unified JsonRenderer component.',
        variant: 'body',
        color: 'muted',
      },
      key: 'text-1',
    },
    {
      type: 'base:Divider',
      props: {
        spacing: 'md',
      },
      key: 'divider-1',
    },
  ],
  meta: {
    catalog: 'base',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    generatedBy: 'system',
  },
};

/**
 * Metrics test tree
 */
export const metricsTestTree: RenderTree = {
  type: 'root',
  children: [
    {
      type: 'base:Header',
      props: {
        title: 'Metrics Dashboard',
        level: 'h3',
      },
      key: 'header-metrics',
    },
    {
      type: 'base:Grid',
      props: {
        columns: 3,
        gap: 'md',
        children: [
          {
            type: 'base:Metric',
            props: {
              label: 'Total Users',
              value: 1234,
              format: 'number',
              color: 'info',
              size: 'md',
              trend: {
                direction: 'up' as const,
                delta: 12,
                period: 'last week',
              },
            },
            key: 'metric-users',
          },
          {
            type: 'base:Metric',
            props: {
              label: 'Conversion Rate',
              value: 0.456,
              format: 'percent',
              color: 'success',
              size: 'md',
            },
            key: 'metric-conversion',
          },
          {
            type: 'base:Metric',
            props: {
              label: 'Revenue',
              value: 9876.54,
              format: 'currency',
              color: 'default',
              size: 'md',
              trend: {
                direction: 'down' as const,
                delta: -5,
                period: 'vs. last month',
              },
            },
            key: 'metric-revenue',
          },
        ],
      },
      key: 'metrics-grid',
    },
  ],
  meta: {
    catalog: 'base',
    version: '1.0.0',
  },
};

/**
 * Badges and progress test tree
 */
export const feedbackTestTree: RenderTree = {
  type: 'root',
  children: [
    {
      type: 'base:Header',
      props: {
        title: 'Status & Feedback',
        level: 'h3',
      },
      key: 'header-feedback',
    },
    {
      type: 'base:Stack',
      props: {
        direction: 'horizontal',
        gap: 'sm',
        wrap: true,
        children: [
          {
            type: 'base:Badge',
            props: { text: 'Default', variant: 'default', size: 'sm' },
            key: 'badge-default',
          },
          {
            type: 'base:Badge',
            props: { text: 'Success', variant: 'success', size: 'sm', icon: 'check' },
            key: 'badge-success',
          },
          {
            type: 'base:Badge',
            props: { text: 'Warning', variant: 'warning', size: 'sm', icon: 'warning' },
            key: 'badge-warning',
          },
          {
            type: 'base:Badge',
            props: { text: 'Error', variant: 'error', size: 'sm', icon: 'error' },
            key: 'badge-error',
          },
          {
            type: 'base:Badge',
            props: { text: 'Info', variant: 'info', size: 'sm', icon: 'info' },
            key: 'badge-info',
          },
        ],
      },
      key: 'badges-stack',
    },
    {
      type: 'base:Spacer',
      props: { size: 'lg' },
      key: 'spacer-1',
    },
    {
      type: 'base:Container',
      props: {
        padding: 'md',
        border: true,
        background: 'subtle',
        children: [
          {
            type: 'base:Progress',
            props: {
              value: 75,
              label: 'Task Completion',
              showValue: true,
              color: 'success',
              size: 'md',
            },
            key: 'progress-1',
          },
          {
            type: 'base:Spacer',
            props: { size: 'sm' },
            key: 'spacer-progress',
          },
          {
            type: 'base:Progress',
            props: {
              value: 45,
              label: 'With Thresholds',
              showValue: true,
              size: 'md',
              thresholds: { low: 25, medium: 50, high: 75 },
            },
            key: 'progress-2',
          },
        ],
      },
      key: 'progress-container',
    },
  ],
  meta: {
    catalog: 'base',
    version: '1.0.0',
  },
};

/**
 * Alert states test tree
 */
export const alertsTestTree: RenderTree = {
  type: 'root',
  children: [
    {
      type: 'base:Header',
      props: {
        title: 'Alert States',
        level: 'h3',
      },
      key: 'header-alerts',
    },
    {
      type: 'base:Stack',
      props: {
        direction: 'vertical',
        gap: 'md',
        children: [
          {
            type: 'base:Alert',
            props: {
              variant: 'info',
              title: 'Information',
              message: 'This is an informational alert with details.',
            },
            key: 'alert-info',
          },
          {
            type: 'base:Alert',
            props: {
              variant: 'success',
              title: 'Success',
              message: 'Operation completed successfully!',
            },
            key: 'alert-success',
          },
          {
            type: 'base:Alert',
            props: {
              variant: 'warning',
              message: 'Warning alert without a title.',
            },
            key: 'alert-warning',
          },
          {
            type: 'base:Alert',
            props: {
              variant: 'error',
              title: 'Error',
              message: 'Something went wrong. Please try again.',
            },
            key: 'alert-error',
          },
        ],
      },
      key: 'alerts-stack',
    },
  ],
  meta: {
    catalog: 'base',
    version: '1.0.0',
  },
};

/**
 * Empty and loading states test tree
 */
export const statesTestTree: RenderTree = {
  type: 'root',
  children: [
    {
      type: 'base:Header',
      props: {
        title: 'Empty & Loading States',
        level: 'h3',
      },
      key: 'header-states',
    },
    {
      type: 'base:Grid',
      props: {
        columns: 2,
        gap: 'lg',
        children: [
          {
            type: 'base:Container',
            props: {
              border: true,
              children: [
                {
                  type: 'base:Empty',
                  props: {
                    title: 'No Results Found',
                    description: 'Try adjusting your search filters.',
                    icon: 'search_off',
                  },
                  key: 'empty-1',
                },
              ],
            },
            key: 'empty-container',
          },
          {
            type: 'base:Container',
            props: {
              border: true,
              padding: 'lg',
              children: [
                {
                  type: 'base:Stack',
                  props: {
                    direction: 'vertical',
                    gap: 'md',
                    align: 'center',
                    children: [
                      {
                        type: 'base:Loading',
                        props: { text: 'Loading...', size: 'md' },
                        key: 'loading-md',
                      },
                      {
                        type: 'base:Loading',
                        props: { text: 'Processing data', size: 'lg' },
                        key: 'loading-lg',
                      },
                    ],
                  },
                  key: 'loading-stack',
                },
              ],
            },
            key: 'loading-container',
          },
        ],
      },
      key: 'states-grid',
    },
  ],
  meta: {
    catalog: 'base',
    version: '1.0.0',
  },
};

/**
 * Unknown component test tree (to verify fallback)
 */
export const unknownTestTree: RenderTree = {
  type: 'root',
  children: [
    {
      type: 'base:Header',
      props: {
        title: 'Unknown Component Handling',
        level: 'h3',
      },
      key: 'header-unknown',
    },
    {
      type: 'unknown:FakeComponent',
      props: {
        foo: 'bar',
        baz: 123,
      },
      key: 'unknown-1',
    },
    {
      type: 'NotRegistered',
      props: {
        test: true,
      },
      key: 'unknown-2',
    },
  ],
  meta: {
    catalog: 'test',
    version: '1.0.0',
  },
};

// =============================================================================
// DEMO COMPONENT
// =============================================================================

export interface JsonRendererDemoProps {
  showDebugInfo?: boolean;
}

/**
 * Demo component that displays all test trees
 */
export const JsonRendererDemo: React.FC<JsonRendererDemoProps> = ({
  showDebugInfo = false,
}) => {
  const trees = [
    { name: 'Simple Components', tree: simpleTestTree },
    { name: 'Metrics Dashboard', tree: metricsTestTree },
    { name: 'Status & Feedback', tree: feedbackTestTree },
    { name: 'Alert States', tree: alertsTestTree },
    { name: 'Empty & Loading', tree: statesTestTree },
    { name: 'Unknown Components', tree: unknownTestTree },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
        backgroundColor: 'var(--quantum-bg)',
        minHeight: '100vh',
      }}
    >
      <header style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--glass-text)' }}>
          JsonRenderer Visual Verification
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--glass-text-muted)', marginTop: '0.25rem' }}>
          Sprint S19-BD-JsonRenderFactory - Phase 2d
        </p>
      </header>

      {trees.map(({ name, tree }) => (
        <section
          key={name}
          style={{
            backgroundColor: 'var(--glass-panel)',
            borderRadius: '0.5rem',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--glass-border)',
            }}
          >
            <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--glass-text)' }}>
              {name}
            </h2>
          </div>
          <div style={{ padding: '1rem' }}>
            <JsonRenderer
              tree={tree}
              showDebugInfo={showDebugInfo}
              data-testid={`demo-${name.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </div>
        </section>
      ))}
    </div>
  );
};

export default JsonRendererDemo;
