// lib/embeddings.js
// Gemini embedding generation for semantic search

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Generate embedding vector for text using Gemini text-embedding-004
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 768-dimension embedding vector
 */
export async function generateEmbedding(text) {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  // Truncate very long text to avoid issues
  const truncatedText = text.slice(0, 10000);

  const result = await model.embedContent(truncatedText);
  return result.embedding.values;
}

/**
 * Generate embedding for a sprout (combines query + response)
 * @param {string} query - User query
 * @param {string} response - LLM response
 * @returns {Promise<number[]>} 768-dimension embedding vector
 */
export async function generateSproutEmbedding(query, response) {
  const combinedText = `Query: ${query}\n\nResponse: ${response}`;
  return generateEmbedding(combinedText);
}
