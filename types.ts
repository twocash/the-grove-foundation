// types.ts - Backward compatibility shim
// Re-exports from @core/schema for existing imports
// Per ADR-008: Shim-based migration strategy

export {
  SectionId,
  type ChatMessage,
  type TerminalState,
  type ArchitectureNode,
  type NarrativeNode,
  type NarrativeGraph,
  type AudioTrack,
  type AudioManifest
} from './src/core/schema';
