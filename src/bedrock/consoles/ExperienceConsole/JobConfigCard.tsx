// src/bedrock/consoles/ExperienceConsole/JobConfigCard.tsx
// Card component for Job Config in grid/list view
// Sprint: S7.5-SL-JobConfigSystem v1

import React, { useState } from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { JobConfigPayload, JobTriggerType } from '@core/schema/job-config';

// Color mapping for trigger types (using semantic CSS variables)
const TRIGGER_STYLES: Record<JobTriggerType, { style: React.CSSProperties; label: string }> = {
  schedule: { style: { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }, label: 'Scheduled' },
  webhook: { style: { backgroundColor: 'var(--semantic-accent-secondary-bg)', color: 'var(--semantic-accent-secondary)' }, label: 'Webhook' },
  manual: { style: { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }, label: 'Manual' },
  dependency: { style: { backgroundColor: 'var(--semantic-accent-primary-bg)', color: 'var(--semantic-accent-primary)' }, label: 'Dependency' },
};

/**
 * Card component for displaying a job config in grid/list view
 */
export function JobConfigCard({
  object: job,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<JobConfigPayload>) {
  const [isRunning, setIsRunning] = useState(false);
  const isEnabled = job.payload.enabled;
  const triggerType = job.payload.triggerType;
  const triggerConfig = TRIGGER_STYLES[triggerType] || TRIGGER_STYLES.manual;
  const priority = job.payload.priority;
  const timeoutMs = job.payload.timeoutMs;
  const retryConfig = job.payload.retryConfig;

  // Get latest execution status from history
  const latestExecution = job.payload.executionHistory.length > 0 ? job.payload.executionHistory[0] : null;
  const lastRunStatus = latestExecution?.status;

  const handleRunNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRunning(true);

    try {
      // TODO: Implement actual job execution
      console.log(`[JobConfig] Running job: ${job.payload.jobId}`);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to run job:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border p-4 cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 ring-1 ring-[var(--neon-cyan)]/50'
          : 'border-[var(--glass-border)] bg-[var(--glass-solid)] hover:border-[var(--glass-border-bright)] hover:bg-[var(--glass-elevated)]'
        }
        ${className}
      `}
      data-testid="job-config-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: isEnabled ? 'var(--semantic-success)' : 'var(--semantic-error)' }}
      />

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className={`
          absolute top-3 right-3 p-1 rounded-lg transition-colors
          ${isFavorite
            ? 'text-[var(--neon-amber)]'
            : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]'
          }
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <span className="material-symbols-outlined text-lg">
          {isFavorite ? 'star' : 'star_outline'}
        </span>
      </button>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3 pr-8 mt-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: isEnabled ? 'var(--semantic-info-bg)' : 'var(--glass-panel)' }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: isEnabled ? 'var(--semantic-info)' : 'var(--glass-text-muted)' }}
          >
            schedule
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {job.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)] font-mono">
            {job.payload.jobId}
          </p>
        </div>
      </div>

      {/* Description preview */}
      {job.meta.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {job.meta.description}
        </p>
      )}

      {/* State indicators */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Enabled state */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={isEnabled
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
          }
        >
          <span className="material-symbols-outlined text-xs">
            {isEnabled ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>

        {/* Trigger type */}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={triggerConfig.style}>
          <span className="material-symbols-outlined text-xs">
            {triggerType === 'schedule' && 'schedule'}
            {triggerType === 'webhook' && 'http'}
            {triggerType === 'manual' && 'play_arrow'}
            {triggerType === 'dependency' && 'account_tree'}
          </span>
          {triggerConfig.label}
        </span>

        {/* Priority */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }}
        >
          <span className="material-symbols-outlined text-xs">priority_high</span>
          Priority {priority}
        </span>

        {/* Last run status */}
        {lastRunStatus && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={
              lastRunStatus === 'success' ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
              : lastRunStatus === 'failure' ? { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }
              : lastRunStatus === 'timeout' ? { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }
              : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
            }
          >
            <span className="material-symbols-outlined text-xs">
              {lastRunStatus === 'success' && 'check_circle'}
              {lastRunStatus === 'failure' && 'error'}
              {lastRunStatus === 'timeout' && 'timer_off'}
              {lastRunStatus === 'cancelled' && 'cancel'}
            </span>
            {lastRunStatus}
          </span>
        )}
      </div>

      {/* Schedule info (if scheduled) */}
      {triggerType === 'schedule' && job.payload.schedule && (
        <div className="text-xs text-[var(--glass-text-muted)] mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">schedule</span>
          <span className="font-mono">{job.payload.schedule.cron}</span>
          <span>({job.payload.schedule.timezone})</span>
        </div>
      )}

      {/* Retry info */}
      <div className="text-xs text-[var(--glass-text-muted)] mb-3">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">refresh</span>
          Retry: {retryConfig.maxAttempts}x, {Math.round(retryConfig.delayMs / 1000)}s delay
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Status */}
        <span
          className="px-2 py-0.5 rounded-full text-xs"
          style={isEnabled
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }
          }
        >
          {isEnabled ? 'Active' : 'Inactive'}
        </span>

        {/* Quick action button */}
        <button
          onClick={handleRunNow}
          disabled={!isEnabled || isRunning}
          className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
          style={isEnabled && !isRunning
            ? { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)', cursor: 'not-allowed' }
          }
        >
          <span className="material-symbols-outlined text-xs">
            {isRunning ? 'hourglass_top' : 'play_arrow'}
          </span>
          {isRunning ? 'Running...' : 'Run Now'}
        </button>
      </div>
    </div>
  );
}

export default JobConfigCard;
