// src/bedrock/consoles/PipelineMonitor/useDocumentData.ts
// Data hook for Pipeline Monitor - wraps API for console factory compatibility
// Sprint: hotfix-pipeline-factory

import { useState, useEffect, useCallback } from 'react';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';
import type { DocumentPayload, Document } from './types';
import { documentToGroveObject, createDefaultDocument } from './document-transforms';

/**
 * Data hook for Pipeline Monitor
 *
 * Wraps /api/knowledge/documents endpoints to provide CollectionDataResult
 * interface expected by the console factory pattern.
 */
export function useDocumentData(): CollectionDataResult<DocumentPayload> {
  const [documents, setDocuments] = useState<GroveObject<DocumentPayload>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all documents (no limit)
      const response = await fetch('/api/knowledge/documents?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      const transformed = (data.documents || []).map(documentToGroveObject);
      setDocuments(transformed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Refetch
  const refetch = useCallback(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Create - Note: Documents are created via upload, not direct creation
  // This returns a placeholder; actual creation happens via UploadModal
  const create = useCallback(async (): Promise<GroveObject<DocumentPayload>> => {
    // Documents are created via file upload, not direct creation
    // Return a placeholder that triggers upload modal
    return createDefaultDocument();
  }, []);

  // Update document via PATCH
  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    // Convert patch operations to update payload
    const updates: Record<string, unknown> = {};
    for (const op of operations) {
      if (op.op === 'replace') {
        // Extract field name from path like /payload/keywords or /meta/title
        const pathParts = op.path.split('/').filter(Boolean);
        if (pathParts[0] === 'payload') {
          updates[pathParts[1]] = op.value;
        } else if (pathParts[0] === 'meta' && pathParts[1] === 'title') {
          updates['title'] = op.value;
        }
      }
    }

    const response = await fetch(`/api/knowledge/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error('Failed to update document');

    // Update local state
    const { document } = await response.json();
    setDocuments(prev =>
      prev.map(d => (d.meta.id === id ? documentToGroveObject(document) : d))
    );
  }, []);

  // Delete document
  const remove = useCallback(async (id: string) => {
    const response = await fetch(`/api/knowledge/documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete document');

    setDocuments(prev => prev.filter(d => d.meta.id !== id));
  }, []);

  // Duplicate - not typically used for documents
  const duplicate = useCallback(
    async (obj: GroveObject<DocumentPayload>): Promise<GroveObject<DocumentPayload>> => {
      // Documents aren't typically duplicated, but we support the interface
      const duplicated = createDefaultDocument();
      duplicated.meta.title = `${obj.meta.title} (Copy)`;
      duplicated.payload = { ...obj.payload };
      return duplicated;
    },
    []
  );

  return {
    objects: documents,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
  };
}

export default useDocumentData;
