// src/bedrock/consoles/ExperienceConsole/FeatureFlagConsole.tsx
// Feature Flag Console - Feature Flag Management
// Sprint: feature-flags-v1
//
// Manages feature flags that control behavior across /explore and other routes.
// Instance cardinality: many flags can be active simultaneously.

import { createBedrockConsole } from '../../patterns/console-factory';
import { featureFlagConsoleConfig } from './FeatureFlagConsole.config';
import { FeatureFlagCard } from './FeatureFlagCard';
import { FeatureFlagEditor } from './FeatureFlagEditor';
import { useFeatureFlagsData } from './useFeatureFlagsData';
import type { FeatureFlagPayload } from '@core/schema/feature-flag';

/**
 * Feature Flag Console
 *
 * Manages feature flags that control behavior across /explore and other routes.
 * Uses the Bedrock Console Factory pattern for consistent UX.
 *
 * Features:
 * - View all feature flags (available, disabled)
 * - Edit flag configuration
 * - Toggle flag availability with changelog
 * - Configure Explore header display
 *
 * @see useFeatureFlags() for consumer-side flag access
 */
export const FeatureFlagConsole = createBedrockConsole<FeatureFlagPayload>({
  config: featureFlagConsoleConfig,
  useData: useFeatureFlagsData,
  CardComponent: FeatureFlagCard,
  EditorComponent: FeatureFlagEditor,
  copilotTitle: 'Feature Flag Copilot',
  copilotPlaceholder: 'Manage this feature flag...',
});

// Re-export configuration for external use
export { featureFlagConsoleConfig } from './FeatureFlagConsole.config';

// Re-export card and editor components
export { FeatureFlagCard } from './FeatureFlagCard';
export { FeatureFlagEditor } from './FeatureFlagEditor';

// Re-export data hook and factory
export { useFeatureFlagsData, createDefaultFeatureFlag } from './useFeatureFlagsData';
export type { FeatureFlagsDataResult } from './useFeatureFlagsData';

// Re-export types for consumers
export type { FeatureFlagPayload } from '@core/schema/feature-flag';

export default FeatureFlagConsole;
