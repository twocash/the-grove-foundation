// src/bedrock/consoles/ExperienceConsole/JobConfigEditor.tsx
// Editor component for Job Configs
// Sprint: S7.5-SL-JobConfigSystem v1
//
// IMPORTANT: This editor uses BufferedInput/BufferedTextarea for all text fields.
// This prevents the inspector input race condition where rapid typing loses characters.

import React, { useCallback, useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { JobConfigPayload, JobTriggerType, RetryConfig } from '@core/schema/job-config';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { useJobConfigData } from './useJobConfigData';

// Trigger type options for dropdown
const TRIGGER_OPTIONS: { value: JobTriggerType; label: string; description: string }[] = [
  { value: 'schedule', label: 'Schedule', description: 'Run on a cron schedule' },
  { value: 'webhook', label: 'Webhook', description: 'Run when triggered via webhook' },
  { value: 'manual', label: 'Manual', description: 'Only run when manually triggered' },
  { value: 'dependency', label: 'Dependency', description: 'Run when dependencies are met' },
];

/**
 * Editor component for JobConfig objects
 */
export function JobConfigEditor({
  object: job,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<JobConfigPayload>) {
  const { toggleEnabled, runJob } = useJobConfigData();
  const [isRunning, setIsRunning] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const isEnabled = job.payload.enabled;
  const triggerType = job.payload.triggerType;
  const schedule = job.payload.schedule;

  // Helper to generate patch operations
  const patchMeta = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/meta/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  const patchPayload = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  const patchSchedule = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/schedule/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  const patchRetryConfig = useCallback(
    (field: keyof RetryConfig, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/retryConfig/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  const patchNotifications = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/notifications/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // Toggle job enabled/disabled
  const handleToggleEnabled = useCallback(async () => {
    setIsToggling(true);
    try {
      await toggleEnabled(job.meta.id);
    } catch (error) {
      console.error('[JobConfigEditor] Toggle failed:', error);
    } finally {
      setIsToggling(false);
    }
  }, [job.meta.id, toggleEnabled]);

  // Run job manually
  const handleRunJob = useCallback(async () => {
    setIsRunning(true);
    try {
      await runJob(job.meta.id);
    } catch (error) {
      console.error('[JobConfigEditor] Run job failed:', error);
    } finally {
      setIsRunning(false);
    }
  }, [job.meta.id, runJob]);

  return (
    <div className="flex flex-col h-full">
      {/* Status Banner */}
      <div className={`
        flex items-center gap-3 px-4 py-3 border-b transition-colors
        ${isEnabled
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-red-500/10 border-red-500/20'
        }
      `}>
        {/* Status dot with pulse animation when enabled */}
        <span className="relative flex h-3 w-3">
          {isEnabled && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          )}
          <span className={`
            relative inline-flex rounded-full h-3 w-3
            ${isEnabled ? 'bg-green-500' : 'bg-red-500'}
          `} />
        </span>

        {/* Status text */}
        <div className="flex-1">
          <span className={`text-sm font-medium ${isEnabled ? 'text-green-300' : 'text-red-300'}`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <p className={`text-xs ${isEnabled ? 'text-green-400/70' : 'text-red-400/70'}`}>
            {isEnabled ? 'Job can be executed' : 'Job is paused and will not execute'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <GlassButton
            size="sm"
            variant="primary"
            onClick={handleRunJob}
            disabled={!isEnabled || isRunning}
          >
            {isRunning ? 'Running...' : 'Run Now'}
          </GlassButton>

          <GlassButton
            size="sm"
            variant={isEnabled ? 'danger' : 'success'}
            onClick={handleToggleEnabled}
            disabled={isToggling}
          >
            {isToggling ? 'Toggling...' : isEnabled ? 'Disable' : 'Enable'}
          </GlassButton>
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
            schedule
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {job.meta.title || 'Untitled Job'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="font-mono text-sm text-[var(--glass-text-muted)]">
                {job.payload.jobId}
              </code>
            </div>
          </div>
          {/* Trigger type indicator */}
          <div className={`
            flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
            ${triggerType === 'schedule' ? 'bg-blue-500/20 text-blue-400' : ''}
            ${triggerType === 'webhook' ? 'bg-purple-500/20 text-purple-400' : ''}
            ${triggerType === 'manual' ? 'bg-amber-500/20 text-amber-400' : ''}
            ${triggerType === 'dependency' ? 'bg-pink-500/20 text-pink-400' : ''}
          `}>
            <span className="material-symbols-outlined text-sm">
              {triggerType === 'schedule' && 'schedule'}
              {triggerType === 'webhook' && 'http'}
              {triggerType === 'manual' && 'play_arrow'}
              {triggerType === 'dependency' && 'account_tree'}
            </span>
            {triggerType}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* === IDENTITY === */}
        <InspectorSection title="Identity" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <BufferedInput
                value={job.meta.title}
                onChange={(val) => patchMeta('title', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="Job Title"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
              <BufferedTextarea
                value={job.meta.description || ''}
                onChange={(val) => patchMeta('description', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                placeholder="What does this job do?"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Job ID badge (read-only) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Job ID</span>
              <code className="px-2 py-0.5 rounded-full bg-[var(--glass-surface)] text-sm font-mono text-[var(--glass-text-secondary)]">
                {job.payload.jobId}
              </code>
              <span className="text-xs text-[var(--glass-text-muted)]">(immutable)</span>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Tags</label>
              <BufferedInput
                value={job.payload.tags.join(', ')}
                onChange={(val) => patchPayload('tags', val.split(',').map(t => t.trim()).filter(t => t))}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="tag1, tag2, tag3"
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === TRIGGER CONFIGURATION === */}
        <InspectorSection title="Trigger Configuration" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Trigger Type */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Trigger Type</label>
              <div className="space-y-2">
                {TRIGGER_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="triggerType"
                      value={option.value}
                      checked={triggerType === option.value}
                      onChange={(e) => patchPayload('triggerType', e.target.value as JobTriggerType)}
                      className="mt-1 w-4 h-4 rounded accent-[var(--neon-cyan)]"
                    />
                    <div>
                      <div className="text-sm text-[var(--glass-text-primary)]">
                        {option.label}
                      </div>
                      <div className="text-xs text-[var(--glass-text-muted)]">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule Configuration (only for schedule trigger) */}
            {triggerType === 'schedule' && schedule && (
              <div className="space-y-3 pl-6 border-l-2 border-[var(--glass-border)]">
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Cron Expression</label>
                  <BufferedInput
                    value={schedule.cron}
                    onChange={(val) => patchSchedule('cron', val)}
                    debounceMs={400}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 font-mono"
                    placeholder="0 0 * * *"
                    disabled={loading}
                  />
                  <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                    Standard cron format (minute hour day month weekday)
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Timezone</label>
                  <BufferedInput
                    value={schedule.timezone}
                    onChange={(val) => patchSchedule('timezone', val)}
                    debounceMs={400}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                    placeholder="UTC"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
                  <BufferedInput
                    value={schedule.description || ''}
                    onChange={(val) => patchSchedule('description', val || null)}
                    debounceMs={400}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                    placeholder="Daily execution at midnight"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === EXECUTION SETTINGS === */}
        <InspectorSection title="Execution Settings" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Priority */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Priority (1-10)
              </label>
              <BufferedInput
                type="number"
                value={job.payload.priority}
                onChange={(val) => patchPayload('priority', parseInt(val) || 5)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="5"
                min="1"
                max="10"
                disabled={loading}
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                Higher priority jobs run first (default: 5)
              </p>
            </div>

            {/* Timeout */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Timeout (milliseconds)
              </label>
              <BufferedInput
                type="number"
                value={job.payload.timeoutMs}
                onChange={(val) => patchPayload('timeoutMs', parseInt(val) || 300000)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="300000"
                min="1000"
                disabled={loading}
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                Job will be terminated if it exceeds this time (default: 5 minutes)
              </p>
            </div>

            {/* Retry Configuration */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-[var(--glass-text-primary)]">Retry Policy</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Max Attempts</label>
                  <BufferedInput
                    type="number"
                    value={job.payload.retryConfig.maxAttempts}
                    onChange={(val) => patchRetryConfig('maxAttempts', parseInt(val) || 3)}
                    debounceMs={400}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                    placeholder="3"
                    min="0"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Delay (ms)</label>
                  <BufferedInput
                    type="number"
                    value={job.payload.retryConfig.delayMs}
                    onChange={(val) => patchRetryConfig('delayMs', parseInt(val) || 60000)}
                    debounceMs={400}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                    placeholder="60000"
                    min="0"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Backoff Multiplier</label>
                <BufferedInput
                  type="number"
                  step="0.1"
                  value={job.payload.retryConfig.backoffMultiplier || 1}
                  onChange={(val) => patchRetryConfig('backoffMultiplier', parseFloat(val) || 1)}
                  debounceMs={400}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                  placeholder="2.0"
                  min="1"
                  disabled={loading}
                />
                <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                  Exponential backoff multiplier (1 = no backoff, 2 = double delay each retry)
                </p>
              </div>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === NOTIFICATIONS === */}
        <InspectorSection title="Notifications" collapsible defaultCollapsed={true}>
          <div className="space-y-4">
            {/* Email on failure */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Email on Failure (comma-separated)
              </label>
              <BufferedTextarea
                value={job.payload.notifications.emailOnFailure?.join(', ') || ''}
                onChange={(val) => patchNotifications('emailOnFailure', val.split(',').map(e => e.trim()).filter(e => e))}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                placeholder="admin@example.com, ops@example.com"
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Email on success */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Email on Success (comma-separated)
              </label>
              <BufferedTextarea
                value={job.payload.notifications.emailOnSuccess?.join(', ') || ''}
                onChange={(val) => patchNotifications('emailOnSuccess', val.split(',').map(e => e.trim()).filter(e => e))}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                placeholder="admin@example.com"
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Slack webhook */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Slack Webhook URL
              </label>
              <BufferedInput
                value={job.payload.notifications.slackWebhookUrl || ''}
                onChange={(val) => patchNotifications('slackWebhookUrl', val || null)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="https://hooks.slack.com/services/..."
                disabled={loading}
              />
            </div>

            {/* Include logs */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={job.payload.notifications.includeLogs || false}
                onChange={(e) => patchNotifications('includeLogs', e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--neon-cyan)]"
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">
                  Include execution logs
                </span>
                <p className="text-xs text-[var(--glass-text-muted)]">
                  Attach recent logs to notifications (may increase notification size)
                </p>
              </div>
            </label>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === EXECUTION HISTORY === */}
        <InspectorSection title="Execution History" collapsible defaultCollapsed={true}>
          <div className="space-y-2">
            {job.payload.executionHistory.length === 0 ? (
              <p className="text-sm text-[var(--glass-text-muted)] text-center py-4">
                No executions yet
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {job.payload.executionHistory.slice(0, 10).map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)]"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`
                        material-symbols-outlined text-sm
                        ${record.status === 'success' ? 'text-green-400' : ''}
                        ${record.status === 'failure' ? 'text-red-400' : ''}
                        ${record.status === 'running' ? 'text-blue-400' : ''}
                      `}>
                        {record.status === 'success' && 'check_circle'}
                        {record.status === 'failure' && 'error'}
                        {record.status === 'running' && 'hourglass_top'}
                        {!['success', 'failure', 'running'].includes(record.status) && 'help'}
                      </span>
                      <div>
                        <div className="text-sm text-[var(--glass-text-primary)]">
                          {record.status}
                        </div>
                        <div className="text-xs text-[var(--glass-text-muted)]">
                          {new Date(record.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[var(--glass-text-muted)]">
                        Attempt {record.attempt + 1}
                      </div>
                      {record.durationMs && (
                        <div className="text-xs text-[var(--glass-text-muted)]">
                          {record.durationMs}ms
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </InspectorSection>
      </div>
    </div>
  );
}

export default JobConfigEditor;
