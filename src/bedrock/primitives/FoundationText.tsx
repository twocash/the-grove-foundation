// src/bedrock/primitives/FoundationText.tsx
// Density-aware text primitive for Bedrock consoles
// Sprint: S2-SKIN-DeclarativeDensity

import React, { type ReactNode, type ElementType } from 'react';
import { type DensityToken, DEFAULT_DENSITY } from '../../theme/mappings/quantum-glass.map';
import { useSkin } from '../context/BedrockUIContext';

// =============================================================================
// Types
// =============================================================================

type TextVariant = 'display' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';
type TextColor = 'primary' | 'secondary' | 'muted' | 'accent' | 'inherit';

interface FoundationTextProps {
  /** Text variant - affects size and weight */
  variant?: TextVariant;
  /** Text color semantic */
  color?: TextColor;
  /**
   * Content density - affects text size scaling
   * @default from skin context
   */
  density?: DensityToken;
  /** The HTML element to render */
  as?: ElementType;
  /** Additional CSS classes */
  className?: string;
  /** Text content */
  children: ReactNode;
}

// =============================================================================
// Style Mappings
// =============================================================================

/**
 * Base styles per variant (comfortable density)
 * Sizes are relative to density scaling
 */
const variantBaseStyles: Record<TextVariant, { classes: string; defaultAs: ElementType }> = {
  display: {
    classes: 'font-semibold tracking-tight',
    defaultAs: 'h1',
  },
  heading: {
    classes: 'font-medium tracking-tight',
    defaultAs: 'h2',
  },
  subheading: {
    classes: 'font-medium',
    defaultAs: 'h3',
  },
  body: {
    classes: 'font-normal leading-relaxed',
    defaultAs: 'p',
  },
  caption: {
    classes: 'font-normal',
    defaultAs: 'span',
  },
  label: {
    classes: 'font-medium uppercase tracking-wider',
    defaultAs: 'span',
  },
};

/**
 * Size classes per variant per density
 * compact: 0.875x, comfortable: 1x, spacious: 1.125x
 */
const variantSizes: Record<TextVariant, Record<DensityToken, string>> = {
  display: {
    compact: 'text-xl',      // 1.25rem
    comfortable: 'text-2xl', // 1.5rem
    spacious: 'text-3xl',    // 1.875rem
  },
  heading: {
    compact: 'text-base',    // 1rem
    comfortable: 'text-lg',  // 1.125rem
    spacious: 'text-xl',     // 1.25rem
  },
  subheading: {
    compact: 'text-sm',      // 0.875rem
    comfortable: 'text-base', // 1rem
    spacious: 'text-lg',     // 1.125rem
  },
  body: {
    compact: 'text-xs',      // 0.75rem
    comfortable: 'text-sm',  // 0.875rem
    spacious: 'text-base',   // 1rem
  },
  caption: {
    compact: 'text-[10px]',  // 0.625rem
    comfortable: 'text-xs',  // 0.75rem
    spacious: 'text-sm',     // 0.875rem
  },
  label: {
    compact: 'text-[9px]',   // ~0.56rem
    comfortable: 'text-[10px]', // 0.625rem
    spacious: 'text-xs',     // 0.75rem
  },
};

/**
 * Color classes using CSS variables
 */
const colorStyles: Record<TextColor, string> = {
  primary: 'text-[var(--glass-text-primary)]',
  secondary: 'text-[var(--glass-text-secondary)]',
  muted: 'text-[var(--glass-text-secondary)]/60',
  accent: 'text-[var(--neon-green)]',
  inherit: 'text-inherit',
};

// =============================================================================
// Component
// =============================================================================

export function FoundationText({
  variant = 'body',
  color = 'primary',
  density: densityProp,
  as,
  className = '',
  children,
}: FoundationTextProps) {
  // S2-SKIN-DeclarativeDensity: Get density from skin context, allow prop override
  const { skin } = useSkin();
  const density = densityProp ?? (skin.layout?.density as DensityToken) ?? DEFAULT_DENSITY;

  const { classes: baseClasses, defaultAs } = variantBaseStyles[variant];
  const sizeClass = variantSizes[variant][density];
  const colorClass = colorStyles[color];

  const Component = as || defaultAs;

  return (
    <Component className={`${baseClasses} ${sizeClass} ${colorClass} ${className}`}>
      {children}
    </Component>
  );
}

export default FoundationText;
