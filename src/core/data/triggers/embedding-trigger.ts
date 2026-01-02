// src/core/data/triggers/embedding-trigger.ts
// Non-blocking embedding pipeline trigger

/**
 * Trigger the embedding pipeline for a document.
 *
 * This is a fire-and-forget operation - it queues the embedding
 * job but doesn't wait for completion. Use the health endpoint
 * to monitor pipeline status.
 *
 * @param documentId - Optional specific document to embed. If omitted, processes all pending.
 * @returns Promise that resolves when the trigger is sent (not when embedding completes)
 */
export async function triggerEmbedding(documentId?: string): Promise<void> {
  try {
    const body = documentId ? { documentId } : {};
    const response = await fetch('/api/knowledge/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn(
        `[embedding-trigger] API returned ${response.status}: ${response.statusText}`
      );
    } else {
      console.log(
        `[embedding-trigger] Queued embedding${documentId ? ` for ${documentId}` : ' for all pending'}`
      );
    }
  } catch (error) {
    // Non-blocking - log but don't throw
    console.error('[embedding-trigger] Failed to trigger embedding:', error);
  }
}

/**
 * Check if the embedding pipeline is healthy.
 *
 * @returns Pipeline health status
 */
export async function checkEmbeddingHealth(): Promise<{
  healthy: boolean;
  pendingCount: number;
  lastError?: string;
}> {
  try {
    const response = await fetch('/api/knowledge/health');

    if (!response.ok) {
      return {
        healthy: false,
        pendingCount: 0,
        lastError: `API returned ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      healthy: data.status === 'healthy',
      pendingCount: data.pending || 0,
      lastError: data.error,
    };
  } catch (error) {
    return {
      healthy: false,
      pendingCount: 0,
      lastError: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
