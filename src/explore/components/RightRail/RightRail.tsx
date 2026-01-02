// src/explore/components/RightRail/RightRail.tsx
// Main right rail component for /explore capture flow
// Sprint: bedrock-foundation-v1

import React from 'react';
import { useCaptureFlowContext } from '../../hooks/useCaptureFlow';
import { SproutTypePicker } from './SproutTypePicker';
import { ManifestInspector } from './ManifestInspector';

// =============================================================================
// Types
// =============================================================================

interface RightRailProps {
  /** Default content to show when not capturing */
  defaultContent?: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

export function RightRail({ defaultContent }: RightRailProps) {
  const {
    state,
    context,
    manifest,
    validation,
    isSubmitting,
    selectType,
    updateField,
    submit,
    cancel,
    reset,
    captureAnother,
  } = useCaptureFlowContext();

  // Browsing state - show default content
  if (state === 'browsing') {
    return (
      <div className="h-full flex flex-col">
        {defaultContent ?? <DefaultBrowsingContent />}
      </div>
    );
  }

  // Selecting type
  if (state === 'selectingType') {
    return (
      <SproutTypePicker
        onSelect={selectType}
        onCancel={cancel}
      />
    );
  }

  // Editing manifest
  if (state === 'editingManifest' && manifest) {
    return (
      <ManifestInspector
        manifest={manifest}
        draft={context.draft}
        errors={validation.errors}
        onChange={updateField}
        onSubmit={submit}
        onCancel={cancel}
        isSubmitting={false}
      />
    );
  }

  // Submitting
  if (state === 'submitting' && manifest) {
    return (
      <ManifestInspector
        manifest={manifest}
        draft={context.draft}
        errors={{}}
        onChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        isSubmitting={true}
      />
    );
  }

  // Success
  if (state === 'success') {
    return (
      <SuccessView
        createdId={context.createdId}
        onReset={reset}
        onCaptureAnother={captureAnother}
      />
    );
  }

  // Error
  if (state === 'error') {
    return (
      <ErrorView
        error={context.error}
        onRetry={submit}
        onCancel={cancel}
      />
    );
  }

  // Fallback
  return <DefaultBrowsingContent />;
}

// =============================================================================
// Default Browsing Content
// =============================================================================

function DefaultBrowsingContent() {
  const { openCapture } = useCaptureFlowContext();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-light dark:border-border-dark">
        <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark">
          Capture
        </h3>
        <p className="text-sm text-foreground-muted dark:text-foreground-muted-dark mt-1">
          Save insights and discoveries to the knowledge garden
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">
              eco
            </span>
          </div>
          <p className="text-foreground-muted dark:text-foreground-muted-dark mb-4">
            Found something interesting?
          </p>
          <button
            onClick={openCapture}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Contribution
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Success View
// =============================================================================

interface SuccessViewProps {
  createdId: string | null;
  onReset: () => void;
  onCaptureAnother: () => void;
}

function SuccessView({ createdId, onReset, onCaptureAnother }: SuccessViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">
              check_circle
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark mb-2">
            Contribution Created!
          </h3>
          <p className="text-sm text-foreground-muted dark:text-foreground-muted-dark mb-6">
            Your sprout has been added to the knowledge garden for review.
          </p>
          <div className="space-y-2">
            <button
              onClick={onCaptureAnother}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Capture Another
            </button>
            <button
              onClick={onReset}
              className="w-full py-2 text-sm text-foreground-muted hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Error View
// =============================================================================

interface ErrorViewProps {
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}

function ErrorView({ error, onRetry, onCancel }: ErrorViewProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
              error
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground-light dark:text-foreground-dark mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-foreground-muted dark:text-foreground-muted-dark mb-6">
            {error ?? 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="space-y-2">
            <button
              onClick={onRetry}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2 text-sm text-foreground-muted hover:text-foreground-light dark:hover:text-foreground-dark transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RightRail;
