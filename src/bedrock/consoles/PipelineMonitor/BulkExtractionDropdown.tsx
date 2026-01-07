// src/bedrock/consoles/PipelineMonitor/BulkExtractionDropdown.tsx
// Dropdown for bulk prompt extraction operations
// Sprint: extraction-pipeline-integration-v1

import React, { useState, useRef, useEffect } from 'react';
import { GlassButton } from '../../primitives';
import { PIPELINE_API } from './pipeline.config';
import { CANONICAL_TIERS, type DocumentTier } from './types';

interface BulkExtractionDropdownProps {
  selectedDocumentIds?: string[];
  onComplete?: (result: { extracted: number; errors: number }) => void;
}

interface ExtractOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  filter: 'selected' | 'tier' | 'all' | 'unextracted';
  tier?: DocumentTier;
}

const EXTRACT_OPTIONS: ExtractOption[] = [
  {
    id: 'selected',
    label: 'Extract Selected',
    description: 'Extract prompts from selected documents',
    icon: 'check_box',
    filter: 'selected',
  },
  {
    id: 'unextracted',
    label: 'Unextracted Only',
    description: 'Documents that haven\'t been processed',
    icon: 'pending',
    filter: 'unextracted',
  },
  {
    id: 'tree',
    label: 'Tree Tier',
    description: 'High-quality published documents',
    icon: 'park',
    filter: 'tier',
    tier: 'tree',
  },
  {
    id: 'sapling',
    label: 'Sapling Tier',
    description: 'Documents ready for review',
    icon: 'eco',
    filter: 'tier',
    tier: 'sapling',
  },
  {
    id: 'all',
    label: 'All Documents',
    description: 'Process entire knowledge base',
    icon: 'select_all',
    filter: 'all',
  },
];

export function BulkExtractionDropdown({
  selectedDocumentIds = [],
  onComplete,
}: BulkExtractionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExtract = async (option: ExtractOption) => {
    setOpen(false);
    setExtracting(true);
    setProgress({ current: 0, total: 0 });

    try {
      const response = await fetch(PIPELINE_API.extractPrompts, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter: option.filter,
          tier: option.tier,
          documentIds: option.filter === 'selected' ? selectedDocumentIds : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.details || error.error || `Extraction failed: ${response.status}`);
      }

      const result = await response.json();
      setProgress({ current: result.processed, total: result.processed });
      onComplete?.({ extracted: result.extracted, errors: result.errors });
    } catch (error) {
      console.error('[BulkExtraction] Failed:', error);
      onComplete?.({ extracted: 0, errors: 1 });
    } finally {
      setExtracting(false);
      setProgress(null);
    }
  };

  const hasSelection = selectedDocumentIds.length > 0;

  return (
    <div ref={dropdownRef} className="relative">
      <GlassButton
        variant="secondary"
        size="sm"
        icon="auto_awesome"
        onClick={() => setOpen(!open)}
        loading={extracting}
        disabled={extracting}
      >
        {progress
          ? `Extracting ${progress.current}/${progress.total}`
          : 'Bulk Extract'}
      </GlassButton>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 z-50 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] backdrop-blur-md shadow-xl">
          <div className="p-2 border-b border-[var(--glass-border)]">
            <div className="text-xs font-medium text-[var(--glass-text-muted)] uppercase tracking-wider px-2 py-1">
              Extract Prompts From
            </div>
          </div>
          <div className="p-1">
            {EXTRACT_OPTIONS.map((option) => {
              const isDisabled = option.filter === 'selected' && !hasSelection;
              return (
                <button
                  key={option.id}
                  onClick={() => !isDisabled && handleExtract(option)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors
                    ${isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[var(--glass-elevated)] cursor-pointer'
                    }
                  `}
                >
                  <span className="material-symbols-rounded text-lg text-[var(--neon-cyan)]">
                    {option.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--glass-text-primary)]">
                      {option.label}
                      {option.filter === 'selected' && hasSelection && (
                        <span className="ml-2 text-xs text-[var(--neon-cyan)]">
                          ({selectedDocumentIds.length})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--glass-text-secondary)] truncate">
                      {option.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkExtractionDropdown;
