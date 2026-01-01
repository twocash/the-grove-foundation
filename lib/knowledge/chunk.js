// lib/knowledge/chunk.js
// Document chunking for embedding
// Sprint: kinetic-pipeline-v1

/**
 * Default chunking configuration
 * - 1000 chars target (~250 tokens)
 * - 200 char overlap for context continuity
 */
export const DEFAULT_CHUNK_CONFIG = {
  targetSize: 1000,
  overlap: 200,
  minSize: 100,
  maxSize: 2000,
};

/**
 * Split document content into chunks for embedding
 * @param {string} documentId
 * @param {string} content
 * @param {Object} [config]
 * @returns {Array} Array of chunk objects
 */
export function chunkDocument(documentId, content, config = DEFAULT_CHUNK_CONFIG) {
  const chunks = [];

  // Normalize whitespace
  const normalizedContent = content.replace(/\r\n/g, '\n').trim();

  if (normalizedContent.length === 0) {
    return [];
  }

  // If content is small enough, return as single chunk
  if (normalizedContent.length <= config.maxSize) {
    return [{
      documentId,
      chunkIndex: 0,
      content: normalizedContent,
      charStart: 0,
      charEnd: normalizedContent.length,
    }];
  }

  // Split into paragraphs first
  const paragraphs = normalizedContent.split(/\n\n+/);
  let currentChunk = '';
  let currentStart = 0;
  let position = 0;

  for (const paragraph of paragraphs) {
    const paragraphWithBreak = paragraph + '\n\n';

    // If adding this paragraph exceeds target, finalize current chunk
    if (currentChunk.length + paragraphWithBreak.length > config.targetSize && currentChunk.length >= config.minSize) {
      chunks.push({
        documentId,
        chunkIndex: chunks.length,
        content: currentChunk.trim(),
        charStart: currentStart,
        charEnd: position,
      });

      // Start new chunk with overlap
      const overlapStart = Math.max(0, currentChunk.length - config.overlap);
      currentChunk = currentChunk.slice(overlapStart) + paragraphWithBreak;
      currentStart = position - (currentChunk.length - paragraphWithBreak.length);
    } else {
      currentChunk += paragraphWithBreak;
    }

    position += paragraphWithBreak.length;

    // If paragraph itself is too large, split it
    if (currentChunk.length > config.maxSize) {
      const splitChunks = splitLargeChunk(documentId, currentChunk, currentStart, chunks.length, config);
      chunks.push(...splitChunks.slice(0, -1));

      // Keep last split chunk as current
      const lastChunk = splitChunks[splitChunks.length - 1];
      currentChunk = lastChunk.content;
      currentStart = lastChunk.charStart;
    }
  }

  // Add remaining content
  if (currentChunk.trim().length >= config.minSize) {
    chunks.push({
      documentId,
      chunkIndex: chunks.length,
      content: currentChunk.trim(),
      charStart: currentStart,
      charEnd: normalizedContent.length,
    });
  } else if (chunks.length > 0 && currentChunk.trim().length > 0) {
    // Append to last chunk if too small
    const lastChunk = chunks[chunks.length - 1];
    lastChunk.content += '\n\n' + currentChunk.trim();
    lastChunk.charEnd = normalizedContent.length;
  } else if (currentChunk.trim().length > 0) {
    // Single small chunk
    chunks.push({
      documentId,
      chunkIndex: 0,
      content: currentChunk.trim(),
      charStart: 0,
      charEnd: normalizedContent.length,
    });
  }

  return chunks;
}

/**
 * Split a large chunk on sentence boundaries
 */
function splitLargeChunk(documentId, content, startOffset, startIndex, config) {
  const chunks = [];

  // Split on sentence boundaries (., !, ?)
  const sentences = content.match(/[^.!?]+[.!?]+\s*/g) || [content];
  let currentChunk = '';
  let currentStart = startOffset;
  let position = startOffset;

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > config.targetSize && currentChunk.length >= config.minSize) {
      chunks.push({
        documentId,
        chunkIndex: startIndex + chunks.length,
        content: currentChunk.trim(),
        charStart: currentStart,
        charEnd: position,
      });

      // Start new chunk with overlap
      const overlapStart = Math.max(0, currentChunk.length - config.overlap);
      currentChunk = currentChunk.slice(overlapStart) + sentence;
      currentStart = position - (currentChunk.length - sentence.length);
    } else {
      currentChunk += sentence;
    }

    position += sentence.length;
  }

  // Add remaining
  if (currentChunk.trim().length > 0) {
    chunks.push({
      documentId,
      chunkIndex: startIndex + chunks.length,
      content: currentChunk.trim(),
      charStart: currentStart,
      charEnd: position,
    });
  }

  return chunks;
}

/**
 * Estimate token count for text
 * @param {string} text
 * @returns {number}
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Get chunk statistics
 * @param {Array} chunks
 * @returns {Object}
 */
export function getChunkStats(chunks) {
  if (chunks.length === 0) {
    return {
      count: 0,
      totalChars: 0,
      avgChars: 0,
      minChars: 0,
      maxChars: 0,
      estimatedTokens: 0,
    };
  }

  const lengths = chunks.map(c => c.content.length);
  const totalChars = lengths.reduce((a, b) => a + b, 0);

  return {
    count: chunks.length,
    totalChars,
    avgChars: Math.round(totalChars / chunks.length),
    minChars: Math.min(...lengths),
    maxChars: Math.max(...lengths),
    estimatedTokens: estimateTokens(totalChars.toString()) * chunks.length,
  };
}
