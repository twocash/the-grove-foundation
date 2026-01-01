// lib/knowledge/expand.js
// Query expansion for semantic search
// Sprint: kinetic-stream-feature

import { GoogleGenerativeAI } from '@google/generative-ai';

// Lazy-initialized client
let _genAI = null;
let _initialized = false;

/**
 * Get the Gemini client (lazy initialization)
 */
function getGenAI() {
  if (!_initialized) {
    _initialized = true;
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
      _genAI = new GoogleGenerativeAI(apiKey);
    }
  }
  return _genAI;
}

/**
 * Expand a search query with related concepts and terms
 * Uses Gemini to understand the query intent and add relevant context
 *
 * @param {string} query - Original user query
 * @param {Object} [options]
 * @param {boolean} [options.enabled=true] - Whether to perform expansion
 * @param {number} [options.maxWords=40] - Maximum words in expanded query
 * @returns {Promise<{original: string, expanded: string, wasExpanded: boolean}>}
 */
export async function expandQuery(query, options = {}) {
  const { enabled = true, maxWords = 40 } = options;

  // Skip expansion for very short or very long queries
  if (!enabled || query.length < 3 || query.length > 500) {
    return { original: query, expanded: query, wasExpanded: false };
  }

  const genAI = getGenAI();
  if (!genAI) {
    console.log('[Expand] Gemini not configured, skipping expansion');
    return { original: query, expanded: query, wasExpanded: false };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a search query expander for a knowledge base about distributed AI infrastructure, The Grove project, and related technology concepts.

Given a user's search query, expand it with related concepts, synonyms, and contextual terms that would help find relevant documents. The goal is to improve semantic search matching.

Rules:
- Keep the original query terms
- Add related concepts and synonyms
- Include proper nouns with context (e.g., person names with their roles/affiliations)
- Stay under ${maxWords} words total
- Return ONLY the expanded query, no explanation
- Keep it as a natural phrase, not a keyword list

Examples:
- "Purdue" → "Purdue University academic institution higher education research"
- "Mung Chiang" → "Mung Chiang Purdue University president network theory distributed systems researcher"
- "ratchet effect" → "ratchet effect AI capability growth exponential improvement training compute scaling"
- "Grove infrastructure" → "Grove distributed AI infrastructure decentralized computing edge deployment local hardware"

User query: "${query}"

Expanded query:`;

    const result = await model.generateContent(prompt);
    const expanded = result.response.text().trim();

    // Validate the expansion
    if (expanded && expanded.length > query.length && expanded.length < 500) {
      console.log(`[Expand] "${query.slice(0, 30)}..." → "${expanded.slice(0, 50)}..."`);
      return { original: query, expanded, wasExpanded: true };
    }

    return { original: query, expanded: query, wasExpanded: false };

  } catch (error) {
    console.error('[Expand] Error expanding query:', error.message);
    return { original: query, expanded: query, wasExpanded: false };
  }
}

/**
 * Check if a query would benefit from expansion
 * Short queries and proper nouns typically benefit most
 *
 * @param {string} query
 * @returns {boolean}
 */
export function shouldExpandQuery(query) {
  // Very short queries benefit from expansion
  if (query.split(/\s+/).length <= 3) {
    return true;
  }

  // Queries with proper nouns (capitalized words) benefit
  const hasProperNouns = /\b[A-Z][a-z]+\b/.test(query);
  if (hasProperNouns) {
    return true;
  }

  // Questions typically benefit
  if (query.includes('?') || /^(what|how|why|who|where|when|which)\b/i.test(query)) {
    return true;
  }

  return false;
}
