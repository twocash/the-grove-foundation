// src/surface/components/KineticStream/Stream/blocks/QueryObject.tsx
// User query display
// Sprint: kinetic-experience-v1

import React from 'react';
import type { QueryStreamItem } from '@core/schema/stream';

export interface QueryObjectProps {
  item: QueryStreamItem;
}

export const QueryObject: React.FC<QueryObjectProps> = ({ item }) => {
  return (
    <div className="flex justify-end" data-testid="query-object">
      <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-[var(--glass-elevated)] border border-[var(--neon-cyan)]/20 font-sans text-[13px]">
        {item.pivot && (
          <div className="text-xs text-[var(--neon-cyan)] mb-1 flex items-center gap-1">
            <span>→</span>
            <span>Exploring concept</span>
          </div>
        )}
        <p className="text-[var(--glass-text-primary)]">{item.content}</p>
      </div>
    </div>
  );
};

export default QueryObject;
