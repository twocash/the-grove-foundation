// src/bedrock/json-render/__tests__/CatalogBrowser.demo.tsx
// Sprint: S19-BD-JsonRenderFactory - Phase 13
// Demo page for ComponentCatalogBrowser visual verification

import React from 'react';
import { ComponentCatalogBrowser } from '@bedrock/components';

// Import registration files to populate the registry
import '../register-base';

// =============================================================================
// DEMO COMPONENT
// =============================================================================

export const CatalogBrowserDemo: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--quantum-bg, #0a0f14)',
        padding: '1.5rem',
      }}
    >
      <header
        style={{
          borderBottom: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--glass-text-primary, #fff)',
          }}
        >
          Component Catalog Browser
        </h1>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--glass-text-muted, rgba(255,255,255,0.6))',
            marginTop: '0.25rem',
          }}
        >
          Sprint S19-BD-JsonRenderFactory - Phase 11 Visual Verification
        </p>
      </header>

      <ComponentCatalogBrowser
        defaultExpanded={['base']}
        data-testid="catalog-browser"
      />
    </div>
  );
};

export default CatalogBrowserDemo;
