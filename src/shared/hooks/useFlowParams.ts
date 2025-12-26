// src/shared/hooks/useFlowParams.ts
// Hook for parsing flow params from URL
// Sprint: route-selection-flow-v1

import { useSearchParams } from 'react-router-dom';

export interface FlowParams {
  returnTo: string | null;
  ctaLabel: string;
  isInFlow: boolean;
}

export function useFlowParams(): FlowParams {
  const [searchParams] = useSearchParams();

  const returnTo = searchParams.get('returnTo');
  const ctaLabel = searchParams.get('ctaLabel') || 'Continue';

  return {
    returnTo,
    ctaLabel,
    isInFlow: !!returnTo,
  };
}
