// src/surface/components/GroveObjectCard/GenericContent.tsx

import React from 'react';
import { GroveObjectMeta } from '@core/schema/grove-object';

interface GenericContentProps {
  meta: GroveObjectMeta;
}

export function GenericContent({ meta }: GenericContentProps) {
  return (
    <div className="space-y-2">
      {meta.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {meta.description}
        </p>
      )}

      <div className="text-xs text-slate-500 dark:text-slate-400">
        Type: {meta.type}
      </div>
    </div>
  );
}
