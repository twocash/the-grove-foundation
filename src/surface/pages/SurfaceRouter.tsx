// src/surface/pages/SurfaceRouter.tsx
// Routes between Classic and Genesis landing experiences based on URL param or feature flag

import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';
import SurfacePage from './SurfacePage';
import GenesisPage from './GenesisPage';

type ExperienceType = 'classic' | 'genesis';

/**
 * SurfaceRouter determines which landing experience to show:
 * 1. URL param ?experience=genesis or ?experience=classic (highest priority)
 * 2. Feature flag 'genesis-landing' from Reality Tuner
 * 3. Default to 'classic'
 */
const SurfaceRouter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const genesisEnabled = useFeatureFlag('genesis-landing');

  const experience = useMemo((): ExperienceType => {
    // 1. Check URL param first (highest priority)
    const urlExperience = searchParams.get('experience');
    if (urlExperience === 'genesis') return 'genesis';
    if (urlExperience === 'classic') return 'classic';

    // 2. Fall back to feature flag
    if (genesisEnabled) return 'genesis';

    // 3. Default to classic
    return 'classic';
  }, [searchParams, genesisEnabled]);

  // Render the appropriate experience
  if (experience === 'genesis') {
    return <GenesisPage />;
  }

  return <SurfacePage />;
};

export default SurfaceRouter;
