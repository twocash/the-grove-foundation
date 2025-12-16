// src/core/schema/base.ts
// Core foundation types - no React dependencies

// ============================================================================
// SECTION ENUM
// ============================================================================

export enum SectionId {
  STAKES = 'stakes',
  RATCHET = 'ratchet',
  WHAT_IS_GROVE = 'what_is_grove',
  ARCHITECTURE = 'architecture',
  ECONOMICS = 'economics',
  DIFFERENTIATION = 'differentiation',
  NETWORK = 'network',
  GET_INVOLVED = 'get_involved'
}

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  isStreaming?: boolean;
}

export interface TerminalState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
}

// ============================================================================
// ARCHITECTURE TYPES
// ============================================================================

export interface ArchitectureNode {
  id: string;
  label: string;
  description: string;
  type: 'local' | 'cloud' | 'root';
}

// ============================================================================
// NARRATIVE ENGINE TYPES
// ============================================================================

export interface NarrativeNode {
  id: string;              // Unique key (e.g., 'uni-hedge')
  label: string;           // The UI button text (e.g., "What about adversarial futures?")

  // The Prompt Logic
  query: string;           // The actual instruction sent to Gemini
  contextSnippet?: string; // Optional: Hardcoded context chunk to guarantee accuracy (RAG override)

  // The Journey Logic
  next: string[];          // Array of NarrativeNode IDs to suggest after this one completes

  // Metadata
  sectionId?: SectionId;   // If set, this node appears as a starter prompt for this section
  isEntry?: boolean;       // Is this a starting point for a section?
  sourceFile?: string;     // Traceability (e.g., 'Academic_Strategy.pdf')
}

export interface NarrativeGraph {
  version: string;
  nodes: Record<string, NarrativeNode>;
}

// ============================================================================
// AUDIO MANIFEST TYPES
// ============================================================================

export interface AudioTrack {
  id: string;
  title: string;
  description: string;
  voiceConfig: {
    host: string;
    expert: string;
  };
  transcript: string;
  bucketUrl: string;
  createdAt: number;
}

export interface AudioManifest {
  version: string;
  placements: Record<string, string>;
  tracks: Record<string, AudioTrack>;
}
