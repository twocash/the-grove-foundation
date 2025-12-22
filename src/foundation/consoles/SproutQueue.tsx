// src/foundation/consoles/SproutQueue.tsx
// Sprout moderation queue console - placeholder for Phase 5

import { EmptyState } from '../../shared/feedback';

export default function SproutQueue() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Sprout Queue
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Review and moderate community-submitted insights
        </p>
      </div>

      <EmptyState
        icon="eco"
        title="Coming Soon"
        description="The Sprout Queue moderation workflow is under development. Check back for community-submitted insights."
        iconColor="text-primary"
      />
    </div>
  );
}
