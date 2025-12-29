// src/surface/hooks/useMomentActions.ts
// Action execution hook with journey/lens wiring
// Sprint: moment-ui-integration-v1

import { useCallback } from 'react';
import type { MomentAction } from '@core/schema/moment';
import { useEngagement, useJourneyState, useLensState } from '@core/engagement';
import { getJourneyById } from '../../data/journeys';

export function useMomentActions() {
  const { actor } = useEngagement();
  const { startJourney } = useJourneyState({ actor });
  const { selectLens } = useLensState({ actor });

  const executeAction = useCallback((action: MomentAction): boolean => {
    console.log('[MomentActions] Executing action:', action.type, action);

    switch (action.type) {
      case 'startJourney':
        if (action.journeyId) {
          const journey = getJourneyById(action.journeyId);
          if (journey) {
            startJourney(journey);
            console.log('[MomentActions] Started journey:', journey.id);
            return true;
          }
          console.warn('[MomentActions] Journey not found:', action.journeyId);
        }
        break;

      case 'selectLens':
        if (action.lensId) {
          selectLens(action.lensId);
          console.log('[MomentActions] Selected lens:', action.lensId);
          return true;
        }
        break;

      case 'navigate':
        if (action.target) {
          // For internal navigation targets, emit events instead of window.location
          console.log('[MomentActions] Navigate to:', action.target);
          // TODO: Integrate with overlay state or router
          return true;
        }
        break;

      case 'emit':
        if (action.event) {
          console.log('[MomentActions] Would emit:', action.event, action.eventPayload);
          return true;
        }
        break;

      case 'accept':
      case 'dismiss':
        // These are handled by useMoments
        return true;

      default:
        console.warn('[MomentActions] Unknown action type:', action.type);
    }

    return false;
  }, [startJourney, selectLens]);

  return { executeAction };
}
