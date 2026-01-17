// src/bedrock/consoles/ExperienceConsole/useJobConfigData.ts
// Data hook for Job Configs - wraps useGroveData for console factory compatibility
// Sprint: S7.5-SL-JobConfigSystem v1
//
// DEX Principle: Organic Scalability
// Data hook follows established pattern from useAdvancementRuleData (INSTANCE pattern)
// INSTANCE pattern: Many job configs can be active simultaneously

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { JobConfigPayload } from '@core/schema/job-config';
import { createJobConfigPayload } from '@core/schema/job-config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Job Config GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultJobConfig(
  defaults?: Partial<JobConfigPayload>
): GroveObject<JobConfigPayload> {
  const now = new Date().toISOString();
  const jobId = defaults?.jobId ?? 'new-job';
  const jobName = defaults?.jobName ?? 'New Job';

  return {
    meta: {
      id: generateUUID(),
      type: 'job-config',
      title: jobName,
      description: defaults?.description ?? '',
      icon: 'schedule',
      status: 'active', // Job configs are active by default (Instance pattern)
      createdAt: now,
      updatedAt: now,
      tags: defaults?.tags ?? [],
    },
    payload: {
      ...createJobConfigPayload(jobId, jobName, 'manual'),
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

/**
 * Extended result type with job config specific helpers
 */
export interface JobConfigDataResult extends CollectionDataResult<JobConfigPayload> {
  /** Job configs that are enabled */
  enabledJobs: GroveObject<JobConfigPayload>[];
  /** Job configs grouped by trigger type */
  jobsByTrigger: Record<string, GroveObject<JobConfigPayload>[]>;
  /** Get jobs by trigger type */
  getJobsByTrigger: (triggerType: string) => GroveObject<JobConfigPayload>[];
  /** Toggle job enabled/disabled */
  toggleEnabled: (id: string) => Promise<void>;
  /** Run job manually */
  runJob: (id: string) => Promise<void>;
  /** Get execution history for a job */
  getExecutionHistory: (id: string, limit?: number) => Promise<unknown[]>;
  /** Get latest execution status */
  getLatestExecution: (id: string) => Promise<unknown | null>;
  /** Add execution record */
  addExecutionRecord: (id: string, record: JobConfigPayload['executionHistory'][0]) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Job Configs in Experience Console
 *
 * Wraps useGroveData<JobConfigPayload>('job-config') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `enabledJobs`: Jobs where enabled=true
 * - `jobsByTrigger`: Jobs grouped by trigger type
 * - `getJobsByTrigger(type)`: Find jobs by trigger type
 * - `toggleEnabled(id)`: Toggle enabled flag
 * - `runJob(id)`: Trigger manual job execution
 * - `getExecutionHistory(id)`: Fetch execution history
 * - `getLatestExecution(id)`: Get latest execution status
 * - `addExecutionRecord(id, record)`: Add execution record
 */
export function useJobConfigData(): JobConfigDataResult {
  const groveData = useGroveData<JobConfigPayload>('job-config');

  // Computed: Jobs that are enabled
  const enabledJobs = useMemo(() => {
    return groveData.objects.filter(
      (job) => job.payload.enabled && job.meta.status === 'active'
    );
  }, [groveData.objects]);

  // Computed: Jobs grouped by trigger type
  const jobsByTrigger = useMemo(() => {
    const grouped: Record<string, GroveObject<JobConfigPayload>[]> = {};

    for (const job of groveData.objects) {
      if (job.meta.status === 'active') {
        const trigger = job.payload.triggerType;
        if (!grouped[trigger]) {
          grouped[trigger] = [];
        }
        grouped[trigger].push(job);
      }
    }

    return grouped;
  }, [groveData.objects]);

  // Get jobs by trigger type
  const getJobsByTrigger = useCallback(
    (triggerType: string) => {
      return groveData.objects.filter(
        (job) =>
          job.payload.triggerType === triggerType &&
          job.meta.status === 'active'
      );
    },
    [groveData.objects]
  );

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<JobConfigPayload>) => {
      const newJob = createDefaultJobConfig(defaults);
      return groveData.create(newJob);
    },
    [groveData]
  );

  // Toggle enabled flag
  const toggleEnabled = useCallback(
    async (id: string) => {
      const job = groveData.objects.find((j) => j.meta.id === id);
      if (!job) {
        throw new Error(`Job not found: ${id}`);
      }

      const now = new Date().toISOString();

      await groveData.update(id, [
        { op: 'replace', path: '/payload/enabled', value: !job.payload.enabled },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      await groveData.refetch();
    },
    [groveData]
  );

  // Run job manually (triggers webhook or manual execution)
  const runJob = useCallback(
    async (id: string) => {
      const job = groveData.objects.find((j) => j.meta.id === id);
      if (!job) {
        throw new Error(`Job not found: ${id}`);
      }

      if (!job.payload.enabled) {
        throw new Error(`Cannot run disabled job: ${id}`);
      }

      // TODO: Implement actual job execution
      // This would trigger the job executor
      console.log(`[JobConfig] Manually triggering job: ${job.payload.jobId}`);

      // For now, just add an execution record
      const executionRecord = {
        timestamp: new Date().toISOString(),
        status: 'success' as const,
        durationMs: 0,
        attempt: 0,
      };

      await addExecutionRecord(id, executionRecord);
    },
    [groveData]
  );

  // Get execution history for a job
  const getExecutionHistory = useCallback(
    async (id: string, limit: number = 50) => {
      const job = groveData.objects.find((j) => j.meta.id === id);
      if (!job) {
        throw new Error(`Job not found: ${id}`);
      }

      // TODO: Fetch from job_executions table
      // For now, return payload execution history
      return job.payload.executionHistory.slice(0, limit);
    },
    [groveData.objects]
  );

  // Get latest execution status
  const getLatestExecution = useCallback(
    async (id: string) => {
      const history = await getExecutionHistory(id, 1);
      return history.length > 0 ? history[0] : null;
    },
    [getExecutionHistory]
  );

  // Add execution record
  const addExecutionRecord = useCallback(
    async (id: string, record: JobConfigPayload['executionHistory'][0]) => {
      const job = groveData.objects.find((j) => j.meta.id === id);
      if (!job) {
        throw new Error(`Job not found: ${id}`);
      }

      const now = new Date().toISOString();
      const updatedHistory = [record, ...job.payload.executionHistory].slice(0, 50);

      await groveData.update(id, [
        { op: 'replace', path: '/payload/executionHistory', value: updatedHistory },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      await groveData.refetch();
    },
    [groveData]
  );

  // Duplicate job config
  const duplicate = useCallback(
    async (object: GroveObject<JobConfigPayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<JobConfigPayload> = {
        meta: {
          id: generateUUID(),
          type: 'job-config',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          tags: [...(object.meta.tags || [])],
        },
        payload: {
          ...object.payload,
          jobId: `${object.payload.jobId}-copy`,
          jobName: `${object.payload.jobName} (Copy)`,
          enabled: false, // Duplicates start disabled
          executionHistory: [],
        },
      };

      return groveData.create(duplicated);
    },
    [groveData]
  );

  return {
    // Standard CollectionDataResult
    objects: groveData.objects,
    loading: groveData.loading,
    error: groveData.error,
    refetch: groveData.refetch,
    create,
    update: groveData.update,
    remove: groveData.remove,
    duplicate,

    // Extended functionality
    enabledJobs,
    jobsByTrigger,
    getJobsByTrigger,
    toggleEnabled,
    runJob,
    getExecutionHistory,
    getLatestExecution,
    addExecutionRecord,
  };
}

export default useJobConfigData;
