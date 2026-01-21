// src/bedrock/json-render/components/base/index.tsx
// Sprint: S19-BD-JsonRenderFactory
// React implementations for base catalog components
//
// Pattern: Each component receives { element: RenderElement } and renders props

import React from 'react';
import type { RenderElement } from '@core/json-render';
import type {
  StackProps,
  GridProps,
  ContainerProps,
  SpacerProps,
  DividerProps,
  TextProps,
  MetricProps,
  BadgeProps,
  ProgressProps,
  HeaderProps,
  EmptyProps,
  LoadingProps,
  AlertProps,
} from '@core/json-render';

// =============================================================================
// LAYOUT PRIMITIVES
// =============================================================================

/**
 * Stack - Flex container for vertical/horizontal layouts
 */
export const Stack: React.FC<{ element: RenderElement<StackProps>; children?: React.ReactNode }> = ({ element, children }) => {
  const { direction = 'vertical', gap = 'md', align = 'stretch', justify = 'start', wrap = false } = element.props;

  const gapMap = { none: '0', xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' };
  const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
  const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between', around: 'space-around' };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction === 'vertical' ? 'column' : 'row',
        gap: gapMap[gap],
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        flexWrap: wrap ? 'wrap' : 'nowrap',
      }}
      data-component="base:Stack"
    >
      {children}
    </div>
  );
};

/**
 * Grid - CSS Grid container
 */
export const Grid: React.FC<{ element: RenderElement<GridProps>; children?: React.ReactNode }> = ({ element, children }) => {
  const { columns = 2, gap = 'md' } = element.props;

  const gapMap = { none: '0', xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: gapMap[gap],
      }}
      data-component="base:Grid"
    >
      {children}
    </div>
  );
};

/**
 * Container - Wrapper with padding and optional border
 */
export const Container: React.FC<{ element: RenderElement<ContainerProps>; children?: React.ReactNode }> = ({ element, children }) => {
  const { padding = 'md', border = false, rounded = true, background = 'transparent' } = element.props;

  const paddingMap = { none: '0', xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' };
  const bgMap = {
    transparent: 'transparent',
    subtle: 'var(--glass-panel)',
    muted: 'rgba(255,255,255,0.05)',
    accent: 'rgba(var(--neon-cyan-rgb), 0.1)',
  };

  return (
    <div
      style={{
        padding: paddingMap[padding],
        border: border ? '1px solid var(--glass-border)' : 'none',
        borderRadius: rounded ? '0.5rem' : '0',
        backgroundColor: bgMap[background],
      }}
      data-component="base:Container"
    >
      {children}
    </div>
  );
};

/**
 * Spacer - Empty space element
 */
export const Spacer: React.FC<{ element: RenderElement<SpacerProps> }> = ({ element }) => {
  const { size = 'md', direction = 'vertical' } = element.props;

  const sizeMap = { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem' };

  return (
    <div
      style={{
        [direction === 'vertical' ? 'height' : 'width']: sizeMap[size],
        flexShrink: 0,
      }}
      data-component="base:Spacer"
    />
  );
};

/**
 * Divider - Separator line
 */
export const Divider: React.FC<{ element: RenderElement<DividerProps> }> = ({ element }) => {
  const { direction = 'horizontal', variant = 'solid', spacing = 'md' } = element.props;

  const spacingMap = { none: '0', sm: '0.5rem', md: '1rem', lg: '1.5rem' };

  return (
    <div
      style={{
        [direction === 'horizontal' ? 'marginTop' : 'marginLeft']: spacingMap[spacing],
        [direction === 'horizontal' ? 'marginBottom' : 'marginRight']: spacingMap[spacing],
        [direction === 'horizontal' ? 'borderBottom' : 'borderRight']: `1px ${variant} var(--glass-border)`,
        [direction === 'horizontal' ? 'width' : 'height']: '100%',
      }}
      data-component="base:Divider"
    />
  );
};

// =============================================================================
// UNIVERSAL COMPONENTS
// =============================================================================

/**
 * Text - Typography element
 */
export const Text: React.FC<{ element: RenderElement<TextProps> }> = ({ element }) => {
  const { content, variant = 'body', color = 'default', align = 'left', weight = 'normal', truncate = false } = element.props;

  const variantStyles: Record<string, React.CSSProperties> = {
    h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    body: { fontSize: '0.875rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    label: { fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' },
    mono: { fontSize: '0.875rem', fontFamily: 'var(--font-mono)' },
  };

  const colorMap = {
    default: 'var(--glass-text)',
    muted: 'var(--glass-text-muted)',
    success: 'var(--semantic-success)',
    warning: 'var(--semantic-warning)',
    error: 'var(--semantic-error)',
    info: 'var(--semantic-info)',
  };

  const weightMap = { normal: 400, medium: 500, semibold: 600, bold: 700 };

  return (
    <span
      style={{
        ...variantStyles[variant],
        color: colorMap[color],
        textAlign: align,
        fontWeight: weightMap[weight],
        ...(truncate && {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }),
      }}
      data-component="base:Text"
    >
      {content}
    </span>
  );
};

/**
 * Metric - Single value display with label
 */
export const Metric: React.FC<{ element: RenderElement<MetricProps> }> = ({ element }) => {
  const { label, value, format = 'number', prefix, suffix, trend, color = 'default', size = 'md' } = element.props;

  const colorMap = {
    default: { border: 'var(--glass-border)', bg: 'transparent' },
    success: { border: 'var(--semantic-success-border)', bg: 'var(--semantic-success-bg)' },
    warning: { border: 'var(--semantic-warning-border)', bg: 'var(--semantic-warning-bg)' },
    error: { border: 'var(--semantic-error-border)', bg: 'var(--semantic-error-bg)' },
    info: { border: 'var(--semantic-info-border)', bg: 'var(--semantic-info-bg)' },
  };

  const sizeMap = {
    sm: { padding: '0.5rem', valueSize: '1.25rem', labelSize: '0.625rem' },
    md: { padding: '0.75rem', valueSize: '1.5rem', labelSize: '0.75rem' },
    lg: { padding: '1rem', valueSize: '2rem', labelSize: '0.875rem' },
  };

  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'percent': return `${Math.round(val * 100)}%`;
      case 'decimal': return val.toFixed(2);
      case 'currency': return `$${val.toLocaleString()}`;
      default: return val.toLocaleString();
    }
  };

  const colors = colorMap[color];
  const sizes = sizeMap[size];

  return (
    <div
      style={{
        padding: sizes.padding,
        borderRadius: '0.5rem',
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
      }}
      data-component="base:Metric"
    >
      <p
        style={{
          fontSize: sizes.labelSize,
          color: 'var(--glass-text-muted)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-mono)',
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: sizes.valueSize, fontWeight: 700, color: 'var(--glass-text)' }}>
        {prefix}{formatValue(value)}{suffix}
      </p>
      {trend && (
        <p
          style={{
            fontSize: '0.75rem',
            marginTop: '0.25rem',
            color: trend.direction === 'up' ? 'var(--semantic-success)' :
                   trend.direction === 'down' ? 'var(--semantic-error)' : 'var(--glass-text-muted)',
          }}
        >
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
          {trend.delta !== undefined && ` ${trend.delta > 0 ? '+' : ''}${trend.delta}`}
          {trend.period && ` (${trend.period})`}
        </p>
      )}
    </div>
  );
};

/**
 * Badge - Small label/tag
 */
export const Badge: React.FC<{ element: RenderElement<BadgeProps> }> = ({ element }) => {
  const { text, variant = 'default', size = 'sm', icon } = element.props;

  const variantStyles: Record<string, React.CSSProperties> = {
    default: { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)', border: '1px solid var(--glass-border)' },
    success: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)', border: '1px solid var(--semantic-success-border)' },
    warning: { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)', border: '1px solid var(--semantic-warning-border)' },
    error: { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)', border: '1px solid var(--semantic-error-border)' },
    info: { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)', border: '1px solid var(--semantic-info-border)' },
    outline: { backgroundColor: 'transparent', color: 'var(--glass-text)', border: '1px solid var(--glass-border)' },
  };

  const sizeStyles = {
    xs: { padding: '0.125rem 0.375rem', fontSize: '0.625rem' },
    sm: { padding: '0.25rem 0.5rem', fontSize: '0.75rem' },
    md: { padding: '0.375rem 0.75rem', fontSize: '0.875rem' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        borderRadius: '9999px',
        fontWeight: 500,
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
      data-component="base:Badge"
    >
      {icon && <span className="material-symbols-outlined" style={{ fontSize: '1em' }}>{icon}</span>}
      {text}
    </span>
  );
};

/**
 * Progress - Progress bar or indicator
 */
export const Progress: React.FC<{ element: RenderElement<ProgressProps> }> = ({ element }) => {
  const { value, label, showValue = true, color = 'default', size = 'md', thresholds } = element.props;

  const getColor = () => {
    if (color !== 'default') {
      const colorMap = {
        success: 'var(--semantic-success)',
        warning: 'var(--semantic-warning)',
        error: 'var(--semantic-error)',
        info: 'var(--semantic-info)',
      };
      return colorMap[color] || 'var(--semantic-info)';
    }

    if (thresholds) {
      if (value >= thresholds.high) return 'var(--semantic-success)';
      if (value >= thresholds.medium) return 'var(--semantic-warning)';
      if (value >= thresholds.low) return 'var(--neon-amber)';
      return 'var(--semantic-error)';
    }

    return 'var(--semantic-info)';
  };

  const sizeMap = { sm: '0.25rem', md: '0.5rem', lg: '0.75rem' };

  return (
    <div data-component="base:Progress">
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          {label && <span style={{ fontSize: '0.75rem', color: 'var(--glass-text-muted)' }}>{label}</span>}
          {showValue && <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--glass-text)' }}>{Math.round(value)}%</span>}
        </div>
      )}
      <div
        style={{
          height: sizeMap[size],
          backgroundColor: 'var(--glass-panel)',
          borderRadius: '9999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, value))}%`,
            backgroundColor: getColor(),
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

/**
 * Header - Section header
 */
export const Header: React.FC<{ element: RenderElement<HeaderProps> }> = ({ element }) => {
  const { title, subtitle, level = 'h2' } = element.props;

  const levelStyles: Record<string, React.CSSProperties> = {
    h1: { fontSize: '1.5rem', fontWeight: 700 },
    h2: { fontSize: '1.25rem', fontWeight: 600 },
    h3: { fontSize: '1rem', fontWeight: 600 },
    h4: { fontSize: '0.875rem', fontWeight: 600 },
  };

  const Tag = level as keyof JSX.IntrinsicElements;

  return (
    <header style={{ marginBottom: '1rem' }} data-component="base:Header">
      <Tag style={{ ...levelStyles[level], color: 'var(--glass-text)', margin: 0 }}>
        {title}
      </Tag>
      {subtitle && (
        <p style={{ fontSize: '0.875rem', color: 'var(--glass-text-muted)', marginTop: '0.25rem' }}>
          {subtitle}
        </p>
      )}
    </header>
  );
};

// =============================================================================
// FEEDBACK COMPONENTS
// =============================================================================

/**
 * Empty - Empty state placeholder
 */
export const Empty: React.FC<{ element: RenderElement<EmptyProps> }> = ({ element }) => {
  const { title = 'No data', description, icon } = element.props;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
      data-component="base:Empty"
    >
      {icon && (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '3rem', color: 'var(--glass-text-muted)', marginBottom: '1rem' }}
        >
          {icon}
        </span>
      )}
      <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--glass-text)' }}>{title}</p>
      {description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--glass-text-muted)', marginTop: '0.5rem' }}>
          {description}
        </p>
      )}
    </div>
  );
};

/**
 * Loading - Loading state indicator
 */
export const Loading: React.FC<{ element: RenderElement<LoadingProps> }> = ({ element }) => {
  const { text = 'Loading...', size = 'md' } = element.props;

  const sizeMap = { sm: '1rem', md: '1.5rem', lg: '2rem' };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
      data-component="base:Loading"
    >
      <div
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: '2px solid var(--glass-border)',
          borderTopColor: 'var(--semantic-info)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.875rem', color: 'var(--glass-text-muted)' }}>{text}</span>
    </div>
  );
};

/**
 * Alert - Status message box
 */
export const Alert: React.FC<{ element: RenderElement<AlertProps> }> = ({ element }) => {
  const { message, title, variant = 'info', icon } = element.props;

  const variantStyles: Record<string, { bg: string; border: string; color: string; defaultIcon: string }> = {
    info: { bg: 'var(--semantic-info-bg)', border: 'var(--semantic-info-border)', color: 'var(--semantic-info)', defaultIcon: 'info' },
    success: { bg: 'var(--semantic-success-bg)', border: 'var(--semantic-success-border)', color: 'var(--semantic-success)', defaultIcon: 'check_circle' },
    warning: { bg: 'var(--semantic-warning-bg)', border: 'var(--semantic-warning-border)', color: 'var(--semantic-warning)', defaultIcon: 'warning' },
    error: { bg: 'var(--semantic-error-bg)', border: 'var(--semantic-error-border)', color: 'var(--semantic-error)', defaultIcon: 'error' },
  };

  const styles = variantStyles[variant];

  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '1rem',
        borderRadius: '0.5rem',
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
      }}
      data-component="base:Alert"
    >
      <span className="material-symbols-outlined" style={{ color: styles.color, fontSize: '1.25rem' }}>
        {icon || styles.defaultIcon}
      </span>
      <div>
        {title && (
          <p style={{ fontWeight: 600, color: styles.color, marginBottom: '0.25rem' }}>{title}</p>
        )}
        <p style={{ fontSize: '0.875rem', color: 'var(--glass-text)' }}>{message}</p>
      </div>
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export const BaseComponents = {
  Stack,
  Grid,
  Container,
  Spacer,
  Divider,
  Text,
  Metric,
  Badge,
  Progress,
  Header,
  Empty,
  Loading,
  Alert,
};

export default BaseComponents;
