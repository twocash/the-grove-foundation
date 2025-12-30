// src/surface/components/KineticStream/Capture/hooks/useResearchPurposes.ts
// Declarative research purposes loaded from JSON config
// Sprint: sprout-declarative-v1

import researchPurposesConfig from '@/data/research-purposes.json';

/**
 * A research purpose defines the intent behind research
 */
export interface ResearchPurpose {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Emoji icon */
  icon: string;
  /** Brief description */
  description: string;
  /** Framing text used in prompt generation */
  promptFraming: string;
}

/**
 * A clue type defines a category of research hint
 */
export interface ClueTypeConfig {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Emoji icon */
  icon: string;
  /** Placeholder text for input */
  placeholder: string;
}

interface ResearchPurposesConfig {
  version: string;
  purposes: ResearchPurpose[];
  clueTypes: ClueTypeConfig[];
}

/**
 * Hook for accessing declarative research purposes
 *
 * Purposes are loaded from data/research-purposes.json and define
 * research intent categories (skeleton, thread, challenge, etc.)
 */
export function useResearchPurposes() {
  const config = researchPurposesConfig as ResearchPurposesConfig;

  /**
   * Find purpose by ID
   */
  const getPurposeById = (id: string): ResearchPurpose | undefined => {
    return config.purposes.find(p => p.id === id);
  };

  /**
   * Get the first/default purpose
   */
  const getDefaultPurpose = (): ResearchPurpose => {
    return config.purposes[0];
  };

  /**
   * Find clue type by ID
   */
  const getClueTypeById = (id: string): ClueTypeConfig | undefined => {
    return config.clueTypes.find(c => c.id === id);
  };

  return {
    /** All available purposes */
    purposes: config.purposes,
    /** All available clue types */
    clueTypes: config.clueTypes,
    /** Config version */
    version: config.version,
    /** Lookup helpers */
    getPurposeById,
    getDefaultPurpose,
    getClueTypeById,
  };
}

export default useResearchPurposes;
