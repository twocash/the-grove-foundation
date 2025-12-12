export enum SectionId {
  STAKES = 'stakes',
  RATCHET = 'ratchet',
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