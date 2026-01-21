// src/bedrock/json-render/JsonRenderer.tsx
// Sprint: S19-BD-JsonRenderFactory
// Unified renderer for json-render trees
//
// Pattern: Recursive element rendering with registry lookup

import React, { ErrorInfo, ReactNode, Component, useMemo } from 'react';
import type { RenderElement, RenderTree } from '@core/json-render';
import { parseComponentName } from '@core/json-render';
import { componentRegistry } from './registry';

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  elementType?: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for catching render errors in json-render components
 */
class RenderErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[JsonRenderer] Error rendering ${this.props.elementType || 'element'}:`, error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          style={{
            padding: '0.5rem',
            borderRadius: '0.25rem',
            backgroundColor: 'var(--semantic-error-bg)',
            border: '1px solid var(--semantic-error-border)',
            color: 'var(--semantic-error)',
            fontSize: '0.75rem',
          }}
          data-component="error-boundary"
        >
          <strong>Render Error:</strong> {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }
    return this.props.children;
  }
}

// =============================================================================
// UNKNOWN COMPONENT FALLBACK
// =============================================================================

interface UnknownComponentProps {
  element: RenderElement;
  showDebugInfo?: boolean;
}

/**
 * Fallback component for unregistered component types
 */
const UnknownComponent: React.FC<UnknownComponentProps> = ({ element, showDebugInfo = false }) => {
  const { fullType } = parseComponentName(element.type);

  return (
    <div
      style={{
        padding: '0.5rem',
        borderRadius: '0.25rem',
        backgroundColor: 'var(--semantic-warning-bg)',
        border: '1px dashed var(--semantic-warning-border)',
        color: 'var(--semantic-warning)',
        fontSize: '0.75rem',
      }}
      data-component="unknown"
      data-original-type={fullType}
    >
      <strong>Unknown Component:</strong> {fullType}
      {showDebugInfo && (
        <pre style={{ marginTop: '0.25rem', fontSize: '0.625rem', opacity: 0.7 }}>
          {JSON.stringify(element.props, null, 2)}
        </pre>
      )}
    </div>
  );
};

// =============================================================================
// ELEMENT RENDERER
// =============================================================================

interface ElementRendererProps {
  element: RenderElement;
  showDebugInfo?: boolean;
  fallback?: React.FC<{ element: RenderElement }>;
}

/**
 * Renders a single RenderElement using the component registry
 */
const ElementRenderer: React.FC<ElementRendererProps> = ({
  element,
  showDebugInfo = false,
  fallback,
}) => {
  const { fullType } = parseComponentName(element.type);

  // Look up component in registry
  const registered = componentRegistry.get(fullType);

  if (!registered) {
    if (fallback) {
      const Fallback = fallback;
      return <Fallback element={element} />;
    }
    return <UnknownComponent element={element} showDebugInfo={showDebugInfo} />;
  }

  const ComponentImpl = registered.render;

  // Handle components with children
  const hasChildren = element.props &&
    typeof element.props === 'object' &&
    'children' in element.props &&
    Array.isArray((element.props as Record<string, unknown>).children);

  if (hasChildren) {
    const props = element.props as Record<string, unknown>;
    const children = props.children as RenderElement[];

    return (
      <RenderErrorBoundary elementType={fullType}>
        <ComponentImpl element={element}>
          {children.map((child, index) => (
            <ElementRenderer
              key={child.key || `child-${index}`}
              element={child}
              showDebugInfo={showDebugInfo}
              fallback={fallback}
            />
          ))}
        </ComponentImpl>
      </RenderErrorBoundary>
    );
  }

  return (
    <RenderErrorBoundary elementType={fullType}>
      <ComponentImpl element={element} />
    </RenderErrorBoundary>
  );
};

// =============================================================================
// JSON RENDERER (MAIN COMPONENT)
// =============================================================================

export interface JsonRendererProps {
  /**
   * The render tree to display
   */
  tree: RenderTree;

  /**
   * Custom class name for the root container
   */
  className?: string;

  /**
   * Custom styles for the root container
   */
  style?: React.CSSProperties;

  /**
   * Whether to show debug information for unknown components
   */
  showDebugInfo?: boolean;

  /**
   * Custom fallback component for unknown types
   */
  fallback?: React.FC<{ element: RenderElement }>;

  /**
   * Callback when an element is clicked (for debugging/inspection)
   */
  onElementClick?: (element: RenderElement, path: string) => void;

  /**
   * Data-testid for testing
   */
  'data-testid'?: string;
}

/**
 * JsonRenderer - Unified renderer for json-render trees
 *
 * Takes a RenderTree and renders it using registered components from the registry.
 * Handles recursive rendering of nested children and provides error boundaries
 * for graceful failure handling.
 *
 * @example
 * ```tsx
 * const tree: RenderTree = {
 *   type: 'root',
 *   children: [
 *     { type: 'base:Header', props: { title: 'Dashboard' } },
 *     { type: 'base:Stack', props: { direction: 'horizontal', gap: 'md', children: [...] } },
 *   ],
 * };
 *
 * <JsonRenderer tree={tree} />
 * ```
 */
export const JsonRenderer: React.FC<JsonRendererProps> = ({
  tree,
  className,
  style,
  showDebugInfo = false,
  fallback,
  onElementClick,
  'data-testid': testId,
}) => {
  // Validate tree structure
  const isValidTree = useMemo(() => {
    return tree && tree.type === 'root' && Array.isArray(tree.children);
  }, [tree]);

  if (!isValidTree) {
    return (
      <div
        className={className}
        style={{
          padding: '1rem',
          textAlign: 'center',
          color: 'var(--glass-text-muted)',
          ...style,
        }}
        data-testid={testId}
        data-component="json-renderer-invalid"
      >
        <p style={{ fontSize: '0.875rem' }}>Invalid render tree structure</p>
        {showDebugInfo && (
          <pre style={{ marginTop: '0.5rem', fontSize: '0.625rem', textAlign: 'left' }}>
            {JSON.stringify(tree, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  // Render empty state if no children
  if (tree.children.length === 0) {
    return (
      <div
        className={className}
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--glass-text-muted)',
          ...style,
        }}
        data-testid={testId}
        data-component="json-renderer-empty"
      >
        <p style={{ fontSize: '0.875rem' }}>No content to display</p>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={style}
      data-testid={testId}
      data-component="json-renderer"
      data-catalog={tree.meta?.catalog}
      data-version={tree.meta?.version}
    >
      {tree.children.map((element, index) => (
        <ElementRenderer
          key={element.key || `element-${index}`}
          element={element}
          showDebugInfo={showDebugInfo}
          fallback={fallback}
        />
      ))}
    </div>
  );
};

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================

/**
 * Renders a single element (not a full tree)
 * Useful for previewing individual components
 */
export const ElementPreview: React.FC<{
  element: RenderElement;
  showDebugInfo?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ element, showDebugInfo = false, className, style }) => {
  return (
    <div className={className} style={style} data-component="element-preview">
      <ElementRenderer element={element} showDebugInfo={showDebugInfo} />
    </div>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export default JsonRenderer;
export { ElementRenderer, UnknownComponent, RenderErrorBoundary };
