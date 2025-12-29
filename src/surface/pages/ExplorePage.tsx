// src/surface/pages/ExplorePage.tsx
// Route handler for /explore
// Sprint: kinetic-experience-v1, kinetic-context-v1

import React from 'react';
import { ExploreShell } from '../components/KineticStream';
import { EngagementProvider } from '../../core/engagement';

const ExplorePage: React.FC = () => {
  return (
    <EngagementProvider>
      <div className="min-h-screen bg-[var(--glass-void)]">
        <ExploreShell />
      </div>
    </EngagementProvider>
  );
};

export default ExplorePage;
