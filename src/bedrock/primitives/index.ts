// src/bedrock/primitives/index.ts
// Barrel export for Bedrock primitives
// Sprint: bedrock-foundation-v1, kinetic-pipeline-v1 (Story 6.0)

// =============================================================================
// Bedrock Layout Primitives
// =============================================================================

export { BedrockLayout } from './BedrockLayout';
export { BedrockNav, type NavItem } from './BedrockNav';
export {
  BedrockInspector,
  InspectorSection,
  InspectorDivider,
  MetadataSection,
  ActionsSection,
} from './BedrockInspector';
export { BedrockCopilot } from './BedrockCopilot';
export { ConsoleHeader, StandaloneHeader } from './ConsoleHeader';
export { StatCard } from './StatCard';
export { MetricsRow, ResponsiveMetricsRow } from './MetricsRow';

// =============================================================================
// Quantum Glass Primitives (Story 6.0)
// =============================================================================

export { GlassPanel } from './GlassPanel';
export { GlassCard } from './GlassCard';
export { GlassMetricCard, MetricsGrid } from './GlassMetricCard';
export {
  GlassStatusBadge,
  SuccessBadge,
  WarningBadge,
  ErrorBadge,
  InfoBadge,
  PendingBadge,
} from './GlassStatusBadge';
export { GlassButton, GlassIconButton } from './GlassButton';
export { GlassTable } from './GlassTable';

// =============================================================================
// Document Enrichment Primitives (pipeline-inspector-v1)
// =============================================================================

export { TagArray } from './TagArray';
export { GroupedChips } from './GroupedChips';
export { UtilityBar } from './UtilityBar';

// =============================================================================
// Form Primitives (inspector-input-fix-v1)
// =============================================================================

export { BufferedInput, BufferedTextarea } from './BufferedInput';
