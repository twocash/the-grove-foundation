// src/explore/components/GardenTray/GardenTray.tsx
// Slide-out tray showing Research Sprouts with filtering
// Sprint: garden-tray-mvp, Phase 1

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResearchSprouts } from '@explore/context/ResearchSproutContext';
import type { ResearchSproutStatus } from '@core/schema/research-sprout';
import { SproutRow } from './SproutRow';

// =============================================================================
// Constants
// =============================================================================

const TRAY_CONFIG = {
  collapsedWidth: 56,
  expandedWidth: 320,
};

/** Status → Emoji mapping */
const STATUS_EMOJI: Record<ResearchSproutStatus, string> = {
  pending: '🌱',
  active: '🌿',
  paused: '⏸️',
  blocked: '❌',
  completed: '🌻',
  archived: '📦',
};

/** Filter options for the dropdown */
const STATUS_FILTER_OPTIONS: { value: ResearchSproutStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All States' },
  { value: 'pending', label: '🌱 Planted' },
  { value: 'active', label: '🌿 Growing' },
  { value: 'completed', label: '🌻 Ready' },
  { value: 'blocked', label: '❌ Failed' },
  { value: 'paused', label: '⏸️ Paused' },
  { value: 'archived', label: '📦 Archived' },
];

// =============================================================================
// Component
// =============================================================================

export function GardenTray() {
  const { sprouts, isLoading, error, getStatusCounts } = useResearchSprouts();

  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ResearchSproutStatus | 'all'>('all');

  // Filter sprouts based on search and status
  const filteredSprouts = useMemo(() => {
    let result = [...sprouts];

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(term) ||
        s.spark.toLowerCase().includes(term)
      );
    }

    // Sort by updatedAt descending
    result.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return result;
  }, [sprouts, statusFilter, searchTerm]);

  // Get total count for badge
  const totalCount = sprouts.length;

  return (
    <motion.div
      className="fixed right-0 top-0 h-full z-40
                 bg-[var(--glass-solid)] backdrop-blur-xl
                 border-l border-[var(--glass-border)]
                 shadow-xl
                 flex flex-col"
      initial={false}
      animate={{
        width: isExpanded ? TRAY_CONFIG.expandedWidth : TRAY_CONFIG.collapsedWidth,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      data-testid="garden-tray"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="Garden">
            🌱
          </span>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-[var(--glass-text-secondary)]"
            >
              Garden
            </motion.span>
          )}
        </div>

        {/* Counter badge */}
        <motion.span
          key={totalCount}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center justify-center min-w-[20px] h-5
                    px-1.5 rounded-full text-xs font-medium
                    bg-emerald-500/20 text-emerald-400"
        >
          {totalCount}
        </motion.span>
      </div>

      {/* Control Bar - Only visible when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-2 border-b border-[var(--glass-border)] space-y-2"
          >
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--glass-text-muted)]">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm
                         bg-[var(--glass-void)] rounded-md
                         border border-[var(--glass-border)]
                         text-[var(--glass-text-primary)]
                         placeholder:text-[var(--glass-text-muted)]
                         focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>

            {/* Status Filter Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ResearchSproutStatus | 'all')}
              className="w-full px-3 py-1.5 text-sm
                       bg-[var(--glass-void)] rounded-md
                       border border-[var(--glass-border)]
                       text-[var(--glass-text-primary)]
                       focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            >
              {STATUS_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <span className="text-[var(--glass-text-muted)] text-sm">Loading...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-3 rounded-md bg-red-500/10 text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Sprout List */}
        {!isLoading && !error && (
          <AnimatePresence mode="popLayout">
            {filteredSprouts.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-[var(--glass-text-subtle)] text-center py-8"
              >
                {isExpanded
                  ? (searchTerm || statusFilter !== 'all'
                      ? 'No matching sprouts'
                      : 'Select text to plant sprouts')
                  : ''}
              </motion.p>
            ) : (
              <div className="space-y-1">
                {filteredSprouts.map(sprout => (
                  <SproutRow
                    key={sprout.id}
                    sprout={sprout}
                    emoji={STATUS_EMOJI[sprout.status]}
                    isExpanded={isExpanded}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer hint when expanded */}
      {isExpanded && filteredSprouts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 border-t border-[var(--glass-border)] text-center"
        >
          <span className="text-xs text-[var(--glass-text-subtle)]">
            {filteredSprouts.length} sprout{filteredSprouts.length !== 1 ? 's' : ''}
            {statusFilter !== 'all' && ` (${statusFilter})`}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default GardenTray;
