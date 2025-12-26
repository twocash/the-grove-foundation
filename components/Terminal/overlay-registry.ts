// components/Terminal/overlay-registry.ts
// Declarative registry mapping overlay types to components and config
// Sprint: terminal-overlay-machine-v1
// Sprint: terminal-kinetic-commands-v1 - Added command-palette and stats

import { ComponentType } from 'react';
import { OverlayType } from './types';
import WelcomeInterstitial from './WelcomeInterstitial';
import { LensPicker } from '../../src/explore/LensPicker';
import { JourneyList } from '../../src/explore/JourneyList';
import { CustomLensWizard } from './CustomLensWizard';
import { CommandPalette } from './CommandPalette';
import { StatsOverlay } from './StatsOverlay';
import GardenModal from './Modals/GardenModal';

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
  },
  'command-palette': {
    component: CommandPalette,
    hideInput: true,
    analytics: 'command_palette_opened'
  },
  'stats': {
    component: StatsOverlay,
    hideInput: false,
    analytics: 'stats_viewed'
  },
  'garden': {
    component: GardenModal,
    hideInput: false,
    analytics: 'garden_viewed'
  }
};
