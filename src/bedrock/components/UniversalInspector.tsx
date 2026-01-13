// src/bedrock/components/UniversalInspector.tsx
// Console Factory v2 - Universal Inspector Component
// Sprint: console-factory-v2
//
// DEX Principle: Declarative Sovereignty
// Inspector layout and fields driven entirely by schema.

import React, { type ReactNode, useMemo, useCallback } from 'react';
import { InspectorPanel, InspectorSection, InspectorDivider } from '../../shared/layout';
import type { ConsoleSchema, InspectorField, InspectorSchema } from '../types/ConsoleSchema';
import type { DraftState, BaseEntity } from '../services/types';
import type { PatchOperation } from '../types/copilot.types';
import type { GroveObject } from '../../core/schema/grove-object';
import { getFieldValue, setFieldValue, groupFieldsBySection } from '../utils/schema-adapters';
import { resolveCopilotConfig } from '../utils/copilot-factory';
import InspectorCopilot from './InspectorCopilot';

// =============================================================================
// Types
// =============================================================================

export interface UniversalInspectorProps<T extends BaseEntity> {
  /** Console schema defining inspector layout */
  schema: ConsoleSchema;
  /** Current item being edited */
  item: T | null;
  /** Draft state with dirty tracking */
  draft: DraftState<T>;
  /** Update draft field */
  onUpdateField: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Close inspector */
  onClose: () => void;
  /** Save changes */
  onSave?: () => void;
  /** Delete item */
  onDelete?: () => void;
  /** Duplicate item */
  onDuplicate?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Additional actions to render in footer */
  additionalActions?: ReactNode;
  /** Override header title */
  headerOverride?: ReactNode;
  /** Handler for copilot patch operations (Sprint: inspector-copilot-v1) */
  onCopilotPatch?: (operations: PatchOperation[]) => void;
}

// =============================================================================
// Field Renderers
// =============================================================================

interface FieldRendererProps {
  field: InspectorField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function TextFieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[var(--glass-text-secondary)]">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        className="w-full px-3 py-2 text-sm bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg
          text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)]
          focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]/50
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {field.helpText && (
        <p className="text-xs text-[var(--glass-text-muted)]">{field.helpText}</p>
      )}
    </div>
  );
}

function TextareaFieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[var(--glass-text-secondary)]">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <textarea
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        rows={4}
        className="w-full px-3 py-2 text-sm bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg
          text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] resize-y min-h-[80px]
          focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]/50
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {field.helpText && (
        <p className="text-xs text-[var(--glass-text-muted)]">{field.helpText}</p>
      )}
    </div>
  );
}

function NumberFieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[var(--glass-text-secondary)]">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type="number"
        value={value !== undefined && value !== null ? Number(value) : ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={field.placeholder}
        disabled={disabled || field.disabled}
        className="w-full px-3 py-2 text-sm bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg
          text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)]
          focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]/50
          disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {field.helpText && (
        <p className="text-xs text-[var(--glass-text-muted)]">{field.helpText}</p>
      )}
    </div>
  );
}

function SelectFieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[var(--glass-text-secondary)]">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || field.disabled}
        className="w-full px-3 py-2 text-sm bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg
          text-[var(--glass-text-primary)]
          focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]/50
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Select...</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {field.helpText && (
        <p className="text-xs text-[var(--glass-text-muted)]">{field.helpText}</p>
      )}
    </div>
  );
}

function ToggleFieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  const isChecked = Boolean(value);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--glass-text-secondary)]">
          {field.label}
        </label>
        <button
          type="button"
          onClick={() => onChange(!isChecked)}
          disabled={disabled || field.disabled}
          className={`
            relative w-10 h-6 rounded-full transition-colors
            ${isChecked ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-elevated)]'}
            ${disabled || field.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
              ${isChecked ? 'translate-x-4' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
      {field.helpText && (
        <p className="text-xs text-[var(--glass-text-muted)]">{field.helpText}</p>
      )}
    </div>
  );
}

function ReadonlyFieldRenderer({ field, value }: FieldRendererProps) {
  // Format dates nicely
  let displayValue = String(value ?? '—');
  if (field.id.includes('At') || field.id.includes('_at') || field.id.includes('date')) {
    if (value && typeof value === 'string') {
      try {
        const date = new Date(value);
        displayValue = date.toLocaleString();
      } catch {
        // Keep original value
      }
    }
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[var(--glass-text-secondary)]">
        {field.label}
      </label>
      <div className="px-3 py-2 text-sm bg-[var(--glass-panel)] border border-[var(--glass-border)] rounded-lg
        text-[var(--glass-text-muted)] font-mono">
        {displayValue}
      </div>
    </div>
  );
}

function FieldRenderer({ field, value, onChange, disabled }: FieldRendererProps) {
  switch (field.type) {
    case 'text':
      return <TextFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'textarea':
      return <TextareaFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'number':
      return <NumberFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'select':
      return <SelectFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'toggle':
      return <ToggleFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    case 'readonly':
      return <ReadonlyFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
    default:
      return <TextFieldRenderer field={field} value={value} onChange={onChange} disabled={disabled} />;
  }
}

// =============================================================================
// Status Banner
// =============================================================================

interface StatusBannerProps {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

function StatusBanner({ isActive, activeLabel = 'Active', inactiveLabel = 'Inactive' }: StatusBannerProps) {
  return (
    <div
      className={`
        px-4 py-2 text-sm font-medium flex items-center gap-2
        ${isActive
          ? 'bg-emerald-500/20 text-emerald-400 border-b border-emerald-500/30'
          : 'bg-red-500/20 text-red-400 border-b border-red-500/30'
        }
      `}
    >
      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
      {isActive ? activeLabel : inactiveLabel}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function UniversalInspector<T extends BaseEntity>({
  schema,
  item,
  draft,
  onUpdateField,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  additionalActions,
  headerOverride,
  onCopilotPatch,
}: UniversalInspectorProps<T>) {
  const inspectorSchema = schema.inspector;

  // Resolve copilot configuration (Sprint: inspector-copilot-v1)
  const copilotConfig = useMemo(() => {
    if (!inspectorSchema.copilot) return null;
    return resolveCopilotConfig(schema.id, inspectorSchema.copilot);
  }, [schema.id, inspectorSchema.copilot]);

  // Get the data source (draft if available, otherwise original item)
  const data = draft.draft || item;

  // Group fields by section
  const fieldsBySection = useMemo(
    () => groupFieldsBySection(inspectorSchema.fields),
    [inspectorSchema.fields]
  );

  // Get title and subtitle from data
  const title = useMemo(() => {
    if (!data) return 'No item selected';
    return String(getFieldValue(data, inspectorSchema.titleField) || 'Untitled');
  }, [data, inspectorSchema.titleField]);

  const subtitle = useMemo(() => {
    if (!data || !inspectorSchema.subtitleField) return undefined;
    return String(getFieldValue(data, inspectorSchema.subtitleField) || '');
  }, [data, inspectorSchema.subtitleField]);

  // Get status
  const isActive = useMemo(() => {
    if (!data || !inspectorSchema.statusField) return false;
    const statusValue = getFieldValue(data, inspectorSchema.statusField);
    return statusValue === inspectorSchema.activeValue;
  }, [data, inspectorSchema.statusField, inspectorSchema.activeValue]);

  // Handle field change
  const handleFieldChange = useCallback(
    (field: InspectorField, value: unknown) => {
      const path = field.path || field.id;

      // If we have draft state, update through the draft system
      if (draft.draft) {
        // We need to set nested value properly
        const updated = setFieldValue(draft.draft, path, value);
        // For simplicity, we're using a workaround - update the whole draft
        // In a real implementation, onUpdateField would handle path-based updates
        onUpdateField(path as keyof T, value as T[keyof T]);
      }
    },
    [draft.draft, onUpdateField]
  );

  // Empty state
  if (!item && !draft.draft) {
    return (
      <InspectorPanel
        title={schema.identity.title}
        subtitle="Select an item to view details"
        onClose={onClose}
      >
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--glass-text-muted)] mb-2">
            touch_app
          </span>
          <p className="text-sm text-[var(--glass-text-muted)]">
            Select an item from the list to view and edit details
          </p>
        </div>
      </InspectorPanel>
    );
  }

  // Loading state
  if (loading) {
    return (
      <InspectorPanel
        title={schema.identity.title}
        subtitle="Loading..."
        onClose={onClose}
      >
        <div className="flex items-center justify-center h-full p-8">
          <div className="w-8 h-8 border-2 border-[var(--neon-cyan)]/30 border-t-[var(--neon-cyan)] rounded-full animate-spin" />
        </div>
      </InspectorPanel>
    );
  }

  // Define section order
  const sectionOrder: Array<'identity' | 'config' | 'logic' | 'metadata'> = ['identity', 'config', 'logic', 'metadata'];

  // Render actions footer
  const actionsFooter = (
    <div className="space-y-3">
      {/* Primary action (Save) */}
      {draft.isDirty ? (
        <button
          onClick={onSave}
          disabled={!draft.isDirty}
          className="w-full px-4 py-2.5 bg-[var(--neon-cyan)] text-black font-medium rounded-lg
            hover:bg-[var(--neon-cyan)]/90 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      ) : (
        <div className="w-full px-4 py-2.5 text-center text-sm text-[var(--glass-text-muted)] border border-[var(--glass-border)] rounded-lg">
          No unsaved changes
        </div>
      )}

      {/* Secondary actions */}
      <div className="flex gap-2">
        {onDuplicate && (
          <button
            onClick={onDuplicate}
            className="flex-1 px-4 py-2 text-sm text-[var(--glass-text-secondary)]
              border border-[var(--glass-border)] rounded-lg
              hover:bg-[var(--glass-elevated)] hover:text-[var(--glass-text-primary)] transition-colors
              flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">content_copy</span>
            Duplicate
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-2 text-sm text-red-400
              border border-red-400/30 rounded-lg
              hover:bg-red-500/20 hover:border-red-400/50 transition-colors
              flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            Delete
          </button>
        )}
      </div>

      {additionalActions}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Status banner */}
      {inspectorSchema.statusField && (
        <StatusBanner isActive={isActive} />
      )}

      <InspectorPanel
        title={headerOverride ? '' : title}
        subtitle={headerOverride ? undefined : subtitle}
        onClose={onClose}
        actions={actionsFooter}
      >
        {headerOverride && (
          <div className="p-4 border-b border-[var(--glass-border)]">
            {headerOverride}
          </div>
        )}

        {/* Render sections in order */}
        {sectionOrder.map((sectionKey, index) => {
          const fields = fieldsBySection[sectionKey];
          if (!fields || fields.length === 0) return null;

          const sectionConfig = inspectorSchema.sections?.[sectionKey];
          const sectionTitle = sectionConfig?.title || sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
          const defaultExpanded = sectionConfig?.defaultExpanded ?? true;

          return (
            <React.Fragment key={sectionKey}>
              {index > 0 && <InspectorDivider />}
              <InspectorSection
                title={sectionTitle}
                collapsible
                defaultCollapsed={!defaultExpanded}
              >
                <div className="space-y-4">
                  {fields.map((field) => {
                    const path = field.path || field.id;
                    const value = data ? getFieldValue(data, path) : undefined;

                    return (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        value={value}
                        onChange={(newValue) => handleFieldChange(field, newValue)}
                        disabled={loading}
                      />
                    );
                  })}
                </div>
              </InspectorSection>
            </React.Fragment>
          );
        })}
      </InspectorPanel>

      {/* Inspector Copilot (Sprint: inspector-copilot-v1) */}
      {copilotConfig && copilotConfig.enabled && data && (
        <InspectorCopilot
          consoleId={schema.id}
          config={copilotConfig}
          object={data as unknown as GroveObject}
          onApplyPatch={onCopilotPatch}
        />
      )}
    </div>
  );
}

export default UniversalInspector;
