// src/bedrock/json-render/register-base.ts
// Sprint: S19-BD-JsonRenderFactory
// Registers base catalog components with the global registry
//
// Pattern: Import and call this module once to register all base components

import { BaseCatalog } from '@core/json-render';
import { registerCatalog } from './registry';
import {
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
} from './components/base';

// =============================================================================
// REGISTER BASE COMPONENTS
// =============================================================================

/**
 * Registers all base catalog components with the global registry.
 * Call this once at application startup to make base components available.
 */
export function registerBaseComponents(): void {
  registerCatalog(BaseCatalog, {
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
  });
}

// Auto-register on import
registerBaseComponents();

export default registerBaseComponents;
