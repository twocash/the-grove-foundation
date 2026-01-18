// src/surface/components/modals/SproutFinishingRoom/json-render/Renderer.tsx
// Sprint: S2-SFR-Display - US-C001 json-render Renderer
// Updated: S13-BD-LayoutDensity-v1 - Added declarative layout density support
// Pattern: json-render renderer (maps tree to React components via registry)

import React, { createContext, useContext } from 'react';
import type { RenderTree, RenderElement } from './catalog';
import type { ComponentRegistry } from './registry';
import type { LayoutConfig, ResolvedLayout } from './layout-types';
import { useResolvedLayout } from './useResolvedLayout';

// =============================================================================
// Layout Context
// =============================================================================

/**
 * LayoutContext - Provides resolved layout values to child components
 *
 * Child components can access layout values via useLayoutContext()
 * for consistent spacing within the render tree.
 */
const LayoutContext = createContext<ResolvedLayout | null>(null);

/**
 * useLayoutContext - Access the current layout configuration
 *
 * @returns ResolvedLayout or null if not within a Renderer
 *
 * @example
 * function MyComponent() {
 *   const layout = useLayoutContext();
 *   return <div className={layout?.cardGap}>...</div>;
 * }
 */
export function useLayoutContext(): ResolvedLayout | null {
  return useContext(LayoutContext);
}

// =============================================================================
// Renderer Props
// =============================================================================

export interface RendererProps {
  /** The render tree to display */
  tree: RenderTree;
  /** Component registry mapping type names to React components */
  registry: ComponentRegistry;
  /** Optional fallback for unknown component types */
  fallback?: React.FC<{ element: RenderElement }>;
  /**
   * Layout configuration for spacing density
   *
   * @example
   * // Use compact density
   * <Renderer tree={tree} registry={registry} layout={{ density: 'compact' }} />
   *
   * @example
   * // Override specific token
   * <Renderer tree={tree} registry={registry} layout={{ density: 'comfortable', sectionGap: 'space-y-8' }} />
   */
  layout?: LayoutConfig;
}

// =============================================================================
// Default Fallback
// =============================================================================

/**
 * Default fallback component for unknown types
 */
const DefaultFallback: React.FC<{ element: RenderElement }> = ({ element }) => (
  <div className="p-2 border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded text-sm">
    <span className="font-mono text-red-600 dark:text-red-400">
      Unknown component type: {element.type}
    </span>
  </div>
);

// =============================================================================
// Renderer Component
// =============================================================================

/**
 * Renderer - Renders a json-render tree using the provided registry
 *
 * US-C001: Core rendering engine for json-render pattern.
 * Iterates through tree children and maps each to its registered component.
 *
 * S13-BD-LayoutDensity-v1: Added declarative layout density support.
 * Pass `layout` prop to control spacing without CSS hacks.
 *
 * @example
 * // Default comfortable density
 * <Renderer tree={tree} registry={registry} />
 *
 * @example
 * // Compact density for dense data displays
 * <Renderer tree={tree} registry={registry} layout={{ density: 'compact' }} />
 *
 * @example
 * // Spacious with custom section gap
 * <Renderer
 *   tree={tree}
 *   registry={registry}
 *   layout={{ density: 'spacious', sectionGap: 'space-y-8' }}
 * />
 */
export const Renderer: React.FC<RendererProps> = ({
  tree,
  registry,
  fallback = DefaultFallback,
  layout,
}) => {
  // Resolve layout configuration to concrete classes
  const resolvedLayout = useResolvedLayout(layout);

  if (tree.type !== 'root') {
    console.warn('Renderer expects a root tree node');
    return null;
  }

  return (
    <LayoutContext.Provider value={resolvedLayout}>
      <div className={`json-render-root ${resolvedLayout.containerPadding}`}>
        <div className={resolvedLayout.sectionGap}>
          {tree.children.map((element, index) => {
            const Component = registry[element.type] || fallback;
            return <Component key={`${element.type}-${index}`} element={element} />;
          })}
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

export default Renderer;
