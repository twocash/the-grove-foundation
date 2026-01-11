// src/surface/pages/ExplorePage.tsx
// Route handler for /explore
// Sprint: kinetic-experience-v1, kinetic-context-v1, sprout-research-v1

import React from 'react';
import { ExploreShell } from '../components/KineticStream';
import { EngagementProvider } from '../../core/engagement';
import { ResearchSproutProvider } from '../../explore/context/ResearchSproutContext';
import { ToastProvider } from '../../explore/context/ToastContext';

const ExplorePage: React.FC = () => {
  return (
    <EngagementProvider>
      <ResearchSproutProvider>
        <ToastProvider>
          <div className="min-h-screen bg-[var(--glass-void)]">
            <ExploreShell />
          </div>
        </ToastProvider>
      </ResearchSproutProvider>
    </EngagementProvider>
  );
};

export default ExplorePage;
