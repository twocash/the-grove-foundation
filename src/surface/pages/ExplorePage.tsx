// src/surface/pages/ExplorePage.tsx
// Route handler for /explore
// Sprint: kinetic-experience-v1, kinetic-context-v1, sprout-research-v1, S1-SKIN-HybridEngine

import React from 'react';
import { ExploreShell } from '../components/KineticStream';
import { EngagementProvider } from '../../core/engagement';
import { ResearchSproutProvider } from '../../explore/context/ResearchSproutContext';
import { ResearchExecutionProvider } from '../../explore/context/ResearchExecutionContext';
import { ToastProvider } from '../../explore/context/ToastContext';
import { BedrockUIProvider } from '../../bedrock/context/BedrockUIContext';

// Default grove ID for MVP (public explore experience without accounts)
// TODO: Replace with actual grove ID from user session when Grove ID system is implemented
const DEFAULT_GROVE_ID = 'grove-public-explore';

const ExplorePage: React.FC = () => {
  return (
    <BedrockUIProvider>
      <EngagementProvider>
        <ResearchSproutProvider initialGroveId={DEFAULT_GROVE_ID}>
          <ResearchExecutionProvider>
            <ToastProvider>
              <div className="min-h-screen bg-[var(--glass-void)]">
                <ExploreShell />
              </div>
            </ToastProvider>
          </ResearchExecutionProvider>
        </ResearchSproutProvider>
      </EngagementProvider>
    </BedrockUIProvider>
  );
};

export default ExplorePage;
