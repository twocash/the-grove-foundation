// src/foundation/hooks/useSproutQueue.ts
// Data fetching and state management for sprout moderation queue

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  QueuedSprout,
  SproutQueueCounts,
  SproutModeration,
} from '@core/schema/sprout-queue';

interface UseSproutQueueReturn {
  sprouts: QueuedSprout[];
  loading: boolean;
  error: string | null;
  counts: SproutQueueCounts;
  updateSprout: (id: string, updates: Partial<QueuedSprout>) => Promise<void>;
  refreshQueue: () => Promise<void>;
}

export function useSproutQueue(): UseSproutQueueReturn {
  const [sprouts, setSprouts] = useState<QueuedSprout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, use mock data
      // Later: const res = await fetch('/api/admin/sprout-queue');
      const mockSprouts = generateMockSprouts();

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setSprouts(mockSprouts);
    } catch (err) {
      setError('Failed to load sprout queue');
      console.error('useSproutQueue error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const counts = useMemo<SproutQueueCounts>(() => ({
    pending: sprouts.filter(s => s.status === 'pending').length,
    approved: sprouts.filter(s => s.status === 'approved').length,
    rejected: sprouts.filter(s => s.status === 'rejected').length,
    flagged: sprouts.filter(s => s.status === 'flagged').length,
    total: sprouts.length,
  }), [sprouts]);

  const updateSprout = useCallback(async (id: string, updates: Partial<QueuedSprout>) => {
    setSprouts(prev => prev.map(s =>
      s.id === id ? { ...s, ...updates } : s
    ));

    // Later: await fetch(`/api/admin/sprout-queue/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  }, []);

  return {
    sprouts,
    loading,
    error,
    counts,
    updateSprout,
    refreshQueue: fetchQueue,
  };
}

// Mock data generator
function generateMockSprouts(): QueuedSprout[] {
  const now = Date.now();

  return [
    {
      id: 'sprout-001',
      content: 'The 7-month capability doubling window feels shorter each cycle as infrastructure matures and deployment pipelines optimize. We\'re seeing this compress to 5-6 months in practice.',
      status: 'pending',
      captureContext: {
        userId: 'user_abc123def456',
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        lensId: 'engineer',
        lensVersion: '1.2',
        journeyId: 'ratchet',
        journeyStep: 3,
        nodeId: 'capability-propagation',
        sessionId: 'sess_xyz789',
      },
    },
    {
      id: 'sprout-002',
      content: 'Distributed inference fundamentally changes the economics of AI access - the question is whether that benefits individuals or just creates new bottlenecks at the coordination layer.',
      status: 'pending',
      captureContext: {
        userId: 'user_def456ghi789',
        timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        lensId: 'academic',
        lensVersion: '2.0',
        journeyId: 'infrastructure-play',
        journeyStep: 2,
        nodeId: 'distributed-compute',
        sessionId: 'sess_abc123',
      },
    },
    {
      id: 'sprout-003',
      content: 'The observer dynamic is fascinating - are we participants in this story or just watching it unfold? Maybe both simultaneously.',
      status: 'pending',
      captureContext: {
        userId: 'user_observer01',
        timestamp: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
        lensId: 'concerned-citizen',
        lensVersion: '1.0',
        journeyId: 'observer-dynamic',
        journeyStep: 1,
        sessionId: 'sess_meta456',
      },
    },
    {
      id: 'sprout-004',
      content: 'Edge inference on consumer hardware could democratize AI access, but only if we solve the model distribution problem. Current approaches feel half-baked.',
      status: 'pending',
      captureContext: {
        userId: 'user_techie789',
        timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        lensId: 'engineer',
        lensVersion: '1.2',
        nodeId: 'edge-deployment',
        sessionId: 'sess_edge789',
      },
    },
    {
      id: 'sprout-005',
      content: 'The $380B infrastructure bet only makes sense if you assume continued exponential growth. What happens when that assumption breaks?',
      status: 'approved',
      captureContext: {
        userId: 'user_finance001',
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        lensId: 'geopolitical',
        lensVersion: '1.5',
        journeyId: 'infrastructure-play',
        journeyStep: 4,
        sessionId: 'sess_fin001',
      },
      moderation: {
        reviewedBy: 'admin',
        reviewedAt: new Date(now - 20 * 60 * 60 * 1000).toISOString(),
        decision: 'approved',
        notes: 'Good question about sustainability of current trajectory',
        qualityScore: 85,
      },
    },
    {
      id: 'sprout-006',
      content: 'Test submission with spam content',
      status: 'rejected',
      captureContext: {
        userId: 'user_spam123',
        timestamp: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
        lensId: 'academic',
        lensVersion: '2.0',
        sessionId: 'sess_spam123',
      },
      moderation: {
        reviewedBy: 'admin',
        reviewedAt: new Date(now - 45 * 60 * 60 * 1000).toISOString(),
        decision: 'rejected',
        notes: 'Test/spam content',
      },
    },
    {
      id: 'sprout-007',
      content: 'Interesting edge case about memory systems - if Grove implements persistent memory, how do you handle conflicting memories from different users?',
      status: 'flagged',
      captureContext: {
        userId: 'user_curious789',
        timestamp: new Date(now - 36 * 60 * 60 * 1000).toISOString(),
        lensId: 'engineer',
        lensVersion: '1.2',
        journeyId: 'diary-system',
        journeyStep: 2,
        sessionId: 'sess_diary001',
      },
      moderation: {
        reviewedBy: 'admin',
        reviewedAt: new Date(now - 30 * 60 * 60 * 1000).toISOString(),
        decision: 'flagged',
        notes: 'Needs deeper review - raises valid implementation questions',
      },
    },
  ];
}

export default useSproutQueue;
