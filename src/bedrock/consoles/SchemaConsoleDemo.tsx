// src/bedrock/consoles/SchemaConsoleDemo.tsx
// Console Factory v2 - Demo Page
// Sprint: console-factory-v2
//
// Demonstrates SchemaConsole with mock data

import React from 'react';
import { SchemaConsole } from '../components/SchemaConsole';
import { featureFlagSchema } from '../config/consoles';
import type { BaseEntity } from '../services/types';

// =============================================================================
// Demo Component
// =============================================================================

/**
 * Demo page showing SchemaConsole in action
 *
 * Uses the feature flag schema and mock service to demonstrate:
 * - Schema-driven rendering
 * - Universal card display
 * - Universal inspector
 * - Filtering, sorting, search
 * - CRUD operations with mock data
 */
export function SchemaConsoleDemo() {
  return (
    <div className="h-full flex flex-col">
      {/* Demo banner */}
      <div className="px-6 py-3 bg-gradient-to-r from-[var(--neon-cyan)]/20 to-transparent border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[var(--neon-cyan)]">science</span>
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
            Console Factory v2 Demo
          </span>
          <span className="text-xs text-[var(--glass-text-muted)]">
            Using featureFlagSchema with mock data
          </span>
        </div>
      </div>

      {/* SchemaConsole */}
      <div className="flex-1 overflow-hidden">
        <SchemaConsole
          schema={featureFlagSchema}
          headerContent={
            <div className="flex items-center gap-2 text-sm text-[var(--glass-text-muted)]">
              <span className="material-symbols-outlined text-base">info</span>
              Mock data - changes won&apos;t persist
            </div>
          }
        />
      </div>
    </div>
  );
}

export default SchemaConsoleDemo;
