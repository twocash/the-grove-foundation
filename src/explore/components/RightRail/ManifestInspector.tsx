// src/explore/components/RightRail/ManifestInspector.tsx
// Form editor for sprout manifest fields
// Sprint: bedrock-foundation-v1

import React, { useState } from 'react';
import type { SproutManifest, ManifestField } from '../../../bedrock/config/sprout-manifests';

// =============================================================================
// Types
// =============================================================================

interface ManifestInspectorProps {
  manifest: SproutManifest;
  draft: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (field: string, value: unknown) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function ManifestInspector({
  manifest,
  draft,
  errors,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ManifestInspectorProps) {
  const colorClasses = getColorClasses(manifest.color);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses.bg}`}>
            <span className={`material-symbols-outlined text-xl ${colorClasses.text}`}>
              {manifest.icon}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark">
              New {manifest.label}
            </h3>
            <p className="text-sm text-foreground-muted dark:text-foreground-muted-dark">
              {manifest.description}
            </p>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {manifest.fields.map(field => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={draft[field.key]}
            error={errors[field.key]}
            onChange={(value) => onChange(field.key, value)}
            disabled={isSubmitting}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border-light dark:border-border-dark space-y-2">
        <button
          onClick={onSubmit}
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className={`
            w-full py-2.5 px-4 rounded-lg font-medium
            ${isSubmitting || Object.keys(errors).length > 0
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90'
            }
            transition-colors flex items-center justify-center gap-2
          `}
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              Creating...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">add</span>
              Create {manifest.label}
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full py-2 text-sm text-foreground-muted hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Field Renderer
// =============================================================================

interface FieldRendererProps {
  field: ManifestField;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function FieldRenderer({ field, value, error, onChange, disabled }: FieldRendererProps) {
  const baseInputClasses = `
    w-full px-3 py-2 rounded-lg border
    bg-surface-light dark:bg-surface-dark
    text-foreground-light dark:text-foreground-dark
    placeholder-foreground-muted dark:placeholder-foreground-muted-dark
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-red-500' : 'border-border-light dark:border-border-dark'}
  `;

  return (
    <div>
      <label className="block text-sm font-medium text-foreground-light dark:text-foreground-dark mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.type === 'text' && (
        <input
          type="text"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          disabled={disabled}
          className={baseInputClasses}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          disabled={disabled}
          className={`${baseInputClasses} resize-none`}
        />
      )}

      {field.type === 'url' && (
        <input
          type="url"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={baseInputClasses}
        />
      )}

      {field.type === 'select' && field.options && (
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={baseInputClasses}
        >
          <option value="">Select...</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </option>
          ))}
        </select>
      )}

      {field.type === 'tags' && (
        <TagsInput
          value={(value as string[]) ?? []}
          onChange={onChange}
          placeholder={field.placeholder}
          disabled={disabled}
        />
      )}

      {field.hint && !error && (
        <p className="mt-1 text-xs text-foreground-muted dark:text-foreground-muted-dark">
          {field.hint}
        </p>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Tags Input
// =============================================================================

interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

function TagsInput({ value, onChange, placeholder, disabled }: TagsInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const newTag = input.trim().toLowerCase();
      if (!value.includes(newTag)) {
        onChange([...value, newTag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  return (
    <div className={`
      flex flex-wrap gap-1 p-2 rounded-lg border
      bg-surface-light dark:bg-surface-dark
      border-border-light dark:border-border-dark
      focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary
      ${disabled ? 'opacity-50' : ''}
    `}>
      {value.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
        >
          {tag}
          {!disabled && (
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-primary/70"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled}
        className="flex-1 min-w-[100px] bg-transparent outline-none text-sm text-foreground-light dark:text-foreground-dark placeholder-foreground-muted"
      />
    </div>
  );
}

// =============================================================================
// Color Helpers
// =============================================================================

function getColorClasses(color?: string): { bg: string; text: string } {
  switch (color) {
    case 'blue':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' };
    case 'amber':
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };
    case 'purple':
      return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' };
    case 'green':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' };
    default:
      return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
  }
}

export default ManifestInspector;
