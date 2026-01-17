/**
 * Job Config Schema
 * Sprint: S7.5-SL-JobConfigSystem v1
 *
 * GroveObject<JobConfigPayload> pattern for cron jobs and automated task configuration.
 * Instance cardinality: many job configs active simultaneously.
 */

import type { GroveObject } from './grove-object';

/**
 * Schedule configuration for cron jobs.
 * Follows standard cron format with optional timezone.
 */
export interface ScheduleConfig {
  /** Cron expression (e.g., '0 0 * * *' for daily at midnight) */
  cron: string;

  /** Timezone for schedule execution (IANA format, e.g., 'America/New_York') */
  timezone: string;

  /** Optional description of what this schedule does */
  description?: string;
}

/**
 * Job trigger types.
 */
export type JobTriggerType = 'schedule' | 'webhook' | 'manual' | 'dependency';

/**
 * Job status for tracking execution state.
 */
export type JobStatus = 'active' | 'paused' | 'failed' | 'disabled';

/**
 * Retry configuration for failed jobs.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;

  /** Delay between retries in milliseconds */
  delayMs: number;

  /** Exponential backoff multiplier (e.g., 2.0 for exponential) */
  backoffMultiplier?: number;
}

/**
 * Notification settings for job events.
 */
export interface NotificationConfig {
  /** Email addresses to notify on failure */
  emailOnFailure?: string[];

  /** Email addresses to notify on success */
  emailOnSuccess?: string[];

  /** Slack webhook URL for notifications */
  slackWebhookUrl?: string;

  /** Whether to include execution logs in notifications */
  includeLogs?: boolean;
}

/**
 * Payload for a job config GroveObject.
 *
 * Key design decisions:
 * - jobId is immutable (unique identifier)
 * - Supports multiple trigger types (schedule, webhook, manual)
 * - Full retry and notification configuration
 * - Audit trail for execution history
 */
export interface JobConfigPayload {
  /**
   * Unique immutable identifier for the job (e.g., 'advancement-batch').
   * Used for job execution tracking and logging.
   * Cannot be changed after creation.
   */
  jobId: string;

  /**
   * Human-readable job name for admin display.
   */
  jobName: string;

  /**
   * Detailed description of what this job does.
   */
  description: string;

  /**
   * Type of job trigger.
   */
  triggerType: JobTriggerType;

  /**
   * Schedule configuration (required if triggerType is 'schedule').
   */
  schedule?: ScheduleConfig;

  /**
   * Whether the job is currently enabled.
   * Disabled jobs will not execute even if scheduled.
   */
  enabled: boolean;

  /**
   * Job priority level (1-10, higher = more important).
   * Used for job queue ordering.
   */
  priority: number;

  /**
   * Maximum execution time in milliseconds.
   * Job will be terminated if it exceeds this time.
   */
  timeoutMs: number;

  /**
   * Retry configuration for failed executions.
   */
  retryConfig: RetryConfig;

  /**
   * Notification settings for job events.
   */
  notifications: NotificationConfig;

  /**
   * Job-specific configuration payload (JSON).
   * This is the actual configuration passed to the job executor.
   * Structure depends on the job type.
   */
  jobConfig: Record<string, unknown>;

  /**
   * Tags for organization and filtering.
   */
  tags: string[];

  /**
   * Execution history (last N runs).
   * Stored as array to avoid complex queries.
   */
  executionHistory: Array<{
    /** ISO timestamp of execution */
    timestamp: string;

    /** Execution status */
    status: 'success' | 'failure' | 'timeout' | 'cancelled';

    /** Duration in milliseconds */
    durationMs?: number;

    /** Error message if failed */
    errorMessage?: string;

    /** Number of retry attempt (0 for first try) */
    attempt: number;
  }>;

  /**
   * Audit trail for configuration changes.
   */
  changelog: Array<{
    /** ISO timestamp of the change */
    timestamp: string;

    /** Field that changed */
    field: string;

    /** Previous value */
    oldValue: unknown;

    /** New value */
    newValue: unknown;

    /** Who made the change */
    changedBy?: string;

    /** Optional reason for the change */
    reason?: string;
  }>;
}

/**
 * Type guard for JobConfigPayload validation.
 */
export function isJobConfigPayload(obj: unknown): obj is JobConfigPayload {
  if (typeof obj !== 'object' || obj === null) return false;

  const payload = obj as Record<string, unknown>;

  // Check basic types
  if (
    typeof payload.jobId !== 'string' ||
    typeof payload.jobName !== 'string' ||
    typeof payload.description !== 'string' ||
    typeof payload.triggerType !== 'string' ||
    typeof payload.enabled !== 'boolean' ||
    typeof payload.priority !== 'number' ||
    typeof payload.timeoutMs !== 'number' ||
    !Array.isArray(payload.tags) ||
    !Array.isArray(payload.executionHistory) ||
    !Array.isArray(payload.changelog)
  ) {
    return false;
  }

  // Validate trigger type
  if (!['schedule', 'webhook', 'manual', 'dependency'].includes(payload.triggerType as string)) {
    return false;
  }

  // Validate schedule if trigger type is schedule
  if (payload.triggerType === 'schedule') {
    const schedule = payload.schedule as Record<string, unknown>;
    if (
      !schedule ||
      typeof schedule.cron !== 'string' ||
      typeof schedule.timezone !== 'string'
    ) {
      return false;
    }
  }

  // Validate retry config
  const retryConfig = payload.retryConfig as Record<string, unknown>;
  if (
    !retryConfig ||
    typeof retryConfig.maxAttempts !== 'number' ||
    typeof retryConfig.delayMs !== 'number'
  ) {
    return false;
  }

  // Validate notifications
  const notifications = payload.notifications as Record<string, unknown>;
  if (
    !notifications ||
    typeof notifications !== 'object'
  ) {
    return false;
  }

  // Validate jobConfig
  if (typeof payload.jobConfig !== 'object' || payload.jobConfig === null) {
    return false;
  }

  return true;
}

/**
 * Create a new JobConfigPayload with defaults.
 */
export function createJobConfigPayload(
  jobId: string,
  jobName: string,
  triggerType: JobTriggerType = 'manual',
  options?: Partial<Omit<JobConfigPayload, 'jobId' | 'jobName' | 'triggerType' | 'executionHistory' | 'changelog'>>
): JobConfigPayload {
  const schedule: ScheduleConfig | undefined = options?.schedule ?? (triggerType === 'schedule' ? {
    cron: '0 0 * * *', // Default: daily at midnight
    timezone: 'UTC',
    description: 'Daily execution',
  } : undefined);

  return {
    jobId,
    jobName,
    description: options?.description ?? '',
    triggerType,
    schedule,
    enabled: options?.enabled ?? true,
    priority: options?.priority ?? 5,
    timeoutMs: options?.timeoutMs ?? 300000, // 5 minutes default
    retryConfig: options?.retryConfig ?? {
      maxAttempts: 3,
      delayMs: 60000, // 1 minute
      backoffMultiplier: 2.0,
    },
    notifications: options?.notifications ?? {
      emailOnFailure: [],
      emailOnSuccess: [],
      slackWebhookUrl: undefined,
      includeLogs: false,
    },
    jobConfig: options?.jobConfig ?? {},
    tags: options?.tags ?? [],
    executionHistory: [],
    changelog: [],
  };
}

/**
 * Add an execution record to the history.
 * Keeps only the last N executions (configurable).
 */
export function addExecutionRecord(
  payload: JobConfigPayload,
  record: JobConfigPayload['executionHistory'][0],
  maxHistory: number = 50
): JobConfigPayload {
  const newHistory = [record, ...payload.executionHistory].slice(0, maxHistory);

  return {
    ...payload,
    executionHistory: newHistory,
  };
}

/**
 * Add a changelog entry for configuration changes.
 */
export function addChangelogEntry(
  payload: JobConfigPayload,
  field: string,
  oldValue: unknown,
  newValue: unknown,
  changedBy?: string,
  reason?: string
): JobConfigPayload {
  const entry = {
    timestamp: new Date().toISOString(),
    field,
    oldValue,
    newValue,
    changedBy,
    reason,
  };

  return {
    ...payload,
    changelog: [...payload.changelog, entry],
  };
}

/**
 * Get the latest execution status from history.
 */
export function getLatestExecutionStatus(payload: JobConfigPayload): JobConfigPayload['executionHistory'][0] | null {
  return payload.executionHistory.length > 0 ? payload.executionHistory[0] : null;
}

/**
 * Check if job is currently healthy (no recent failures).
 */
export function isJobHealthy(payload: JobConfigPayload, failureThreshold: number = 3): boolean {
  const recentFailures = payload.executionHistory
    .slice(0, failureThreshold)
    .filter(record => record.status === 'failure').length;

  return recentFailures === 0;
}
