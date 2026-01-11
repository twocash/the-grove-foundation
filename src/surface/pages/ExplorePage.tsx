// src/surface/pages/ExplorePage.tsx
// Route handler for /explore
// Sprint: kinetic-experience-v1, kinetic-context-v1, sprout-research-v1

import React from 'react';
import { ExploreShell } from '../components/KineticStream';
import { EngagementProvider } from '../../core/engagement';
import { ResearchSproutProvider } from '../../explore/context/ResearchSproutContext';

const ExplorePage: React.FC = () => {
  return (
    <EngagementProvider>
      <ResearchSproutProvider>
        <div className="min-h-screen bg-[var(--glass-void)]">
          <ExploreShell />
        </div>
      </ResearchSproutProvider>
    </EngagementProvider>
  );
};

export default ExplorePage;
