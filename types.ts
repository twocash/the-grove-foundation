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

export interface ArchitectureNode {
  id: string;
  label: string;
  description: string;
  type: 'local' | 'cloud' | 'root';
}

// --- Narrative Engine Types ---

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
