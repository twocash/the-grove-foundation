// src/surface/components/KineticStream/Stream/blocks/SystemObject.tsx
// System message display
// Sprint: kinetic-experience-v1

import React from 'react';
import type { SystemStreamItem } from '@core/schema/stream';

export interface SystemObjectProps {
  item: SystemStreamItem;
}

export const SystemObject: React.FC<SystemObjectProps> = ({ item }) => {
  return (
    <div
      className="text-center py-2 text-sm text-[var(--glass-text-subtle)]"
      data-testid="system-object"
    >
      {item.content}
    </div>
  );
};

export default SystemObject;
