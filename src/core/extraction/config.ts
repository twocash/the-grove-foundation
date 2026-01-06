/**
 * Extraction configuration - DEX compliant
 * All thresholds are mutable without code changes
 *
 * @sprint highlight-extraction-v1
 */
export const EXTRACTION_CONFIG = {
  highlight: {
    /** Minimum confidence to extract highlight prompt (0-1) */
    confidenceThreshold: 0.7,

    /** Boost applied to terms in core concepts registry */
    coreConceptBoost: 0.2,

    /** Maximum concepts to extract per document */
    maxConceptsPerDoc: 15,

    /** Minimum term length to consider */
    minTermLength: 3,

    /** Model for generation */
    model: 'gemini-2.0-flash',
  },
};

export type ExtractionConfig = typeof EXTRACTION_CONFIG;
