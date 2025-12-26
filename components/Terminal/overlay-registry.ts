// components/Terminal/overlay-registry.ts
// Declarative registry mapping overlay types to components and config
// Sprint: terminal-overlay-machine-v1

import { ComponentType } from 'react';
import { OverlayType } from './types';
import WelcomeInterstitial from './WelcomeInterstitial';
import { LensPicker } from '../../src/explore/LensPicker';
import { JourneyList } from '../../src/explore/JourneyList';
import { CustomLensWizard } from './CustomLensWizard';

export interface OverlayConfig {
  component: ComponentType<any>;
  props?: Record<string, unknown>;
  hideInput: boolean;
  analytics?: string;
}

export const OVERLAY_REGISTRY: Partial<Record<OverlayType, OverlayConfig>> = {
  'welcome': {
    component: WelcomeInterstitial,
    hideInput: true,
    analytics: 'terminal_welcome_shown'
  },
  'lens-picker': {
    component: LensPicker,
    props: { mode: 'compact' },
    hideInput: true,
    analytics: 'terminal_lens_picker_opened'
  },
  'journey-picker': {
    component: JourneyList,
    props: { mode: 'compact' },
    hideInput: true,
    analytics: 'terminal_journey_picker_opened'
  },
  'wizard': {
    component: CustomLensWizard,
    hideInput: true,
    analytics: 'terminal_wizard_started'
  }
};
