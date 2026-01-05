// src/bedrock/consoles/PromptWorkshop/ProvenanceBadge.tsx
// Sprint: exploration-node-unification-v1

import type { PromptProvenance, ProvenanceType } from '@core/context-fields/types';

interface ProvenanceBadgeProps {
  provenance?: PromptProvenance;
  size?: 'sm' | 'md';
}

const PROVENANCE_CONFIG: Record<ProvenanceType, { icon: string; label: string; color: string }> = {
  authored: { icon: '✏️', label: 'Authored', color: '#526F8A' },
  extracted: { icon: '📄', label: 'Extracted', color: '#7EA16B' },
  generated: { icon: '🤖', label: 'Generated', color: '#E0A83B' },
  submitted: { icon: '👤', label: 'Submitted', color: '#9C7BC0' },
};

export function ProvenanceBadge({ provenance, size = 'sm' }: ProvenanceBadgeProps) {
  const type = provenance?.type ?? 'authored';
  const config = PROVENANCE_CONFIG[type];
  const showReview = provenance && type !== 'authored' && provenance.reviewStatus !== 'approved';

  return (
    <div className="flex items-center gap-1">
      <span
        className={size === 'sm' ? 'text-xs' : 'text-sm'}
        style={{ color: config.color }}
      >
        {config.icon} {config.label}
      </span>
      {showReview && (
        <span className="text-xs text-amber-500">
          {provenance!.reviewStatus === 'pending' ? '⏳' : '❌'}
        </span>
      )}
    </div>
  );
}

export default ProvenanceBadge;
