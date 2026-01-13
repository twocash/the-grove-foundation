// src/explore/components/AddToKnowledgeBaseButton.tsx
// "Add to Knowledge Base" button with loading and success states
// Sprint: knowledge-base-integration-v1
//
// DEX: Provenance as Infrastructure
// Button enables research-to-corpus promotion with full provenance chain.

import React from 'react';
import { useKnowledgeBase } from '../hooks/useKnowledgeBase';
import type { ResearchDocumentInput, SproutInput } from '../services/knowledge-base-integration';

export interface AddToKnowledgeBaseButtonProps {
  /** The research document to add */
  document: ResearchDocumentInput;

  /** The source sprout */
  sprout: SproutInput;

  /** Callback when document is added */
  onAdded?: (documentId: string) => void;

  /** Callback on error */
  onError?: (error: string) => void;

  /** Custom class name */
  className?: string;
}

/**
 * AddToKnowledgeBaseButton - Promotes research documents to corpus
 *
 * States:
 * - Default: "Add to KB" with icon
 * - Loading: Spinner + "Adding..."
 * - Success: "Added ✓" (disabled)
 * - Error: "Retry" (enabled)
 * - Disabled: For insufficient-evidence documents
 */
export function AddToKnowledgeBaseButton({
  document,
  sprout,
  onAdded,
  onError,
  className = '',
}: AddToKnowledgeBaseButtonProps) {
  const { isLoading, isAdded, error, addDocument, reset } = useKnowledgeBase();

  // Disable for insufficient evidence
  const isDisabled = document.status === 'insufficient-evidence' || isAdded;

  const handleClick = async () => {
    // Reset state if retrying after error
    if (error) {
      reset();
    }

    const result = await addDocument(document, sprout);

    if (result?.success && result.documentId) {
      onAdded?.(result.documentId);
    } else if (result?.error) {
      onError?.(result.error);
    }
  };

  // Button text based on state
  let buttonText = 'Add to KB';
  let iconName = 'library_add';
  if (isLoading) {
    buttonText = 'Adding...';
    iconName = 'progress_activity';
  } else if (isAdded) {
    buttonText = 'Added';
    iconName = 'check_circle';
  } else if (error) {
    buttonText = 'Retry';
    iconName = 'refresh';
  }

  // Button styling
  const baseClasses = `
    flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
    rounded-lg transition-all duration-200
  `;

  const stateClasses = isAdded
    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 cursor-default'
    : isDisabled
      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-50'
      : error
        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60'
        : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/60';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      className={`${baseClasses} ${stateClasses} ${className}`}
      title={
        document.status === 'insufficient-evidence'
          ? 'Insufficient evidence to add'
          : isAdded
            ? 'Already added to knowledge base'
            : error
              ? `Error: ${error}. Click to retry.`
              : 'Save this document to your grove corpus'
      }
    >
      <span
        className={`material-symbols-outlined text-base ${isLoading ? 'animate-spin' : ''}`}
      >
        {iconName}
      </span>
      <span className="hidden sm:inline">{buttonText}</span>
    </button>
  );
}

export default AddToKnowledgeBaseButton;
