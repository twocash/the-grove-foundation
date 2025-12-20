// src/surface/pages/SurfaceRouter.tsx
// Routes between Classic and Genesis landing experiences

import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';
import SurfacePage from './SurfacePage';
import GenesisPage from './GenesisPage';

type ExperienceType = 'classic' | 'genesis';

/**
 * SurfaceRouter determines which landing experience to show:
 * 1. URL param ?experience=genesis or ?experience=classic (highest priority)
 * 2. Feature flag 'genesis-landing' can DISABLE genesis (returns classic if false)
 * 3. Default to 'genesis' (v0.12e+)
 */
const SurfaceRouter: React.FC = () => {
  const [searchParams] = useSearchParams();
  const genesisEnabled = useFeatureFlag('genesis-landing');

  const experience = useMemo((): ExperienceType => {
    // 1. Check URL param first (allows testing either experience)
    const urlExperience = searchParams.get('experience');
    if (urlExperience === 'genesis') return 'genesis';
    if (urlExperience === 'classic') return 'classic';

    // 2. Check feature flag (allows disabling genesis via Reality Tuner)
    if (genesisEnabled === false) return 'classic';

    // 3. Default to genesis (v0.12e)
    return 'genesis';
  }, [searchParams, genesisEnabled]);

  if (experience === 'classic') {
    return <SurfacePage />;
  }

  return <GenesisPage />;
};

export default SurfaceRouter;
