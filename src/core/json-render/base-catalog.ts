// src/core/json-render/base-catalog.ts
// Sprint: S19-BD-JsonRenderFactory
// Base catalog with layout primitives and universal components
//
// Pattern: Every domain catalog extends this base
// Provides: Stack, Grid, Container, Spacer, Text, Metric, Badge, Progress

import { z } from 'zod';
import type { CatalogDefinition, ComponentMeta } from './types';

// =============================================================================
// LAYOUT PRIMITIVES
// =============================================================================

/**
 * Stack - Vertical or horizontal flex container
 */
export const StackSchema = z.object({
  direction: z.enum(['vertical', 'horizontal']).default('vertical'),
  gap: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).default('md'),
  align: z.enum(['start', 'center', 'end', 'stretch']).default('stretch'),
  justify: z.enum(['start', 'center', 'end', 'between', 'around']).default('start'),
  wrap: z.boolean().default(false),
  children: z.array(z.any()),
});
export type StackProps = z.infer<typeof StackSchema>;

/**
 * Grid - CSS Grid container
 */
export const GridSchema = z.object({
  columns: z.number().min(1).max(12).default(2),
  gap: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).default('md'),
  children: z.array(z.any()),
});
export type GridProps = z.infer<typeof GridSchema>;

/**
 * Container - Wrapper with padding and optional border
 */
export const ContainerSchema = z.object({
  padding: z.enum(['none', 'xs', 'sm', 'md', 'lg', 'xl']).default('md'),
  border: z.boolean().default(false),
  rounded: z.boolean().default(true),
  background: z.enum(['transparent', 'subtle', 'muted', 'accent']).default('transparent'),
  children: z.array(z.any()),
});
export type ContainerProps = z.infer<typeof ContainerSchema>;

/**
 * Spacer - Empty space element
 */
export const SpacerSchema = z.object({
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).default('md'),
  direction: z.enum(['vertical', 'horizontal']).default('vertical'),
});
export type SpacerProps = z.infer<typeof SpacerSchema>;

// =============================================================================
// UNIVERSAL COMPONENTS
// =============================================================================

/**
 * Text - Typography element
 */
export const TextSchema = z.object({
  content: z.string(),
  variant: z.enum(['h1', 'h2', 'h3', 'h4', 'body', 'caption', 'label', 'mono']).default('body'),
  color: z.enum(['default', 'muted', 'success', 'warning', 'error', 'info']).default('default'),
  align: z.enum(['left', 'center', 'right']).default('left'),
  weight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('normal'),
  truncate: z.boolean().default(false),
});
export type TextProps = z.infer<typeof TextSchema>;

/**
 * Metric - Single value with label and optional trend
 */
export const MetricSchema = z.object({
  label: z.string().describe('Metric label'),
  value: z.union([z.number(), z.string()]).describe('Metric value'),
  format: z.enum(['number', 'percent', 'decimal', 'currency', 'string']).default('number'),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  trend: z.object({
    direction: z.enum(['up', 'down', 'flat']),
    delta: z.union([z.number(), z.string()]).optional(),
    period: z.string().optional(),
  }).optional(),
  icon: z.string().optional().describe('Material icon name'),
  color: z.enum(['default', 'success', 'warning', 'error', 'info']).default('default'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
});
export type MetricProps = z.infer<typeof MetricSchema>;

/**
 * Badge - Small label/tag
 */
export const BadgeSchema = z.object({
  text: z.string(),
  variant: z.enum(['default', 'success', 'warning', 'error', 'info', 'outline']).default('default'),
  size: z.enum(['xs', 'sm', 'md']).default('sm'),
  icon: z.string().optional().describe('Material icon name'),
});
export type BadgeProps = z.infer<typeof BadgeSchema>;

/**
 * Progress - Progress bar or indicator
 */
export const ProgressSchema = z.object({
  value: z.number().min(0).max(100).describe('Progress value 0-100'),
  label: z.string().optional(),
  showValue: z.boolean().default(true),
  variant: z.enum(['bar', 'circle']).default('bar'),
  color: z.enum(['default', 'success', 'warning', 'error', 'info']).default('default'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  thresholds: z.object({
    low: z.number().default(30),
    medium: z.number().default(60),
    high: z.number().default(80),
  }).optional(),
});
export type ProgressProps = z.infer<typeof ProgressSchema>;

/**
 * Divider - Horizontal or vertical separator
 */
export const DividerSchema = z.object({
  direction: z.enum(['horizontal', 'vertical']).default('horizontal'),
  variant: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  spacing: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
});
export type DividerProps = z.infer<typeof DividerSchema>;

/**
 * Header - Section header with optional subtitle
 */
export const HeaderSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  level: z.enum(['h1', 'h2', 'h3', 'h4']).default('h2'),
  action: z.string().optional().describe('Optional action button text'),
});
export type HeaderProps = z.infer<typeof HeaderSchema>;

/**
 * Empty - Empty state placeholder
 */
export const EmptySchema = z.object({
  title: z.string().default('No data'),
  description: z.string().optional(),
  icon: z.string().optional().describe('Material icon name'),
  action: z.string().optional().describe('Optional action button text'),
});
export type EmptyProps = z.infer<typeof EmptySchema>;

/**
 * Loading - Loading state indicator
 */
export const LoadingSchema = z.object({
  text: z.string().default('Loading...'),
  variant: z.enum(['spinner', 'dots', 'skeleton']).default('spinner'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
});
export type LoadingProps = z.infer<typeof LoadingSchema>;

/**
 * Alert - Status message box
 */
export const AlertSchema = z.object({
  message: z.string(),
  title: z.string().optional(),
  variant: z.enum(['info', 'success', 'warning', 'error']).default('info'),
  dismissible: z.boolean().default(false),
  icon: z.string().optional().describe('Material icon name'),
});
export type AlertProps = z.infer<typeof AlertSchema>;

// =============================================================================
// BASE CATALOG DEFINITION
// =============================================================================

export const BaseCatalog: CatalogDefinition = {
  name: 'base',
  version: '1.0.0',
  components: {
    // Layout primitives
    Stack: {
      props: StackSchema,
      category: 'layout',
      description: 'Vertical or horizontal flex container',
      agentHint: 'Use for arranging elements in a row or column',
    },
    Grid: {
      props: GridSchema,
      category: 'layout',
      description: 'CSS Grid container with responsive columns',
      agentHint: 'Use for 2D layouts with multiple columns',
    },
    Container: {
      props: ContainerSchema,
      category: 'layout',
      description: 'Wrapper with padding and optional border',
      agentHint: 'Use to group related content with visual boundaries',
    },
    Spacer: {
      props: SpacerSchema,
      category: 'layout',
      description: 'Empty space element',
      agentHint: 'Use to add explicit spacing between elements',
    },
    Divider: {
      props: DividerSchema,
      category: 'layout',
      description: 'Horizontal or vertical separator line',
      agentHint: 'Use to visually separate sections',
    },

    // Universal components
    Text: {
      props: TextSchema,
      category: 'data',
      description: 'Typography element for text content',
      agentHint: 'Use for all text display with semantic variants',
    },
    Metric: {
      props: MetricSchema,
      category: 'data',
      description: 'Single value with label and optional trend',
      agentHint: 'Use for displaying key metrics or statistics',
    },
    Badge: {
      props: BadgeSchema,
      category: 'data',
      description: 'Small label or tag',
      agentHint: 'Use for status indicators, categories, or counts',
    },
    Progress: {
      props: ProgressSchema,
      category: 'data',
      description: 'Progress bar or circle indicator',
      agentHint: 'Use for showing completion or percentage values',
    },
    Header: {
      props: HeaderSchema,
      category: 'data',
      description: 'Section header with optional subtitle',
      agentHint: 'Use to introduce content sections',
    },

    // Feedback components
    Empty: {
      props: EmptySchema,
      category: 'feedback',
      description: 'Empty state placeholder',
      agentHint: 'Use when no data is available to display',
    },
    Loading: {
      props: LoadingSchema,
      category: 'feedback',
      description: 'Loading state indicator',
      agentHint: 'Use while content is being fetched or processed',
    },
    Alert: {
      props: AlertSchema,
      category: 'feedback',
      description: 'Status message box',
      agentHint: 'Use for informational, success, warning, or error messages',
    },
  } as Record<string, ComponentMeta>,
};

export default BaseCatalog;
