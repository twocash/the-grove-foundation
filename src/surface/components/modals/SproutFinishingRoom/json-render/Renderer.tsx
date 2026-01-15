// src/surface/components/modals/SproutFinishingRoom/json-render/Renderer.tsx
// Sprint: S2-SFR-Display - US-C001 json-render Renderer
// Pattern: json-render renderer (maps tree to React components via registry)

import React from 'react';
import type { RenderTree, RenderElement } from './catalog';
import type { ComponentRegistry } from './registry';

export interface RendererProps {
  /** The render tree to display */
  tree: RenderTree;
  /** Component registry mapping type names to React components */
  registry: ComponentRegistry;
  /** Optional fallback for unknown component types */
  fallback?: React.FC<{ element: RenderElement }>;
}

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

/**
 * Renderer - Renders a json-render tree using the provided registry
 *
 * US-C001: Core rendering engine for json-render pattern.
 * Iterates through tree children and maps each to its registered component.
 */
export const Renderer: React.FC<RendererProps> = ({
  tree,
  registry,
  fallback = DefaultFallback,
}) => {
  if (tree.type !== 'root') {
    console.warn('Renderer expects a root tree node');
    return null;
  }

  return (
    <div className="json-render-root">
      {tree.children.map((element, index) => {
        const Component = registry[element.type] || fallback;
        return <Component key={`${element.type}-${index}`} element={element} />;
      })}
    </div>
  );
};

export default Renderer;
