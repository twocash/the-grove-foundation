// components/Terminal/TerminalFlow.tsx
// Flow state machine - interstitials, reveals, modals
// Sprint: Terminal Architecture Refactor v1.0

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { ArchetypeId, LensCandidate, UserInputs } from '../../types/lens';

// Components
import WelcomeInterstitial from './WelcomeInterstitial';
import CustomLensWizard from './CustomLensWizard';
import JourneyCompletion from './JourneyCompletion';
import { HelpModal, JourneysModal, StatsModal, GardenModal } from './Modals';
import { LensPicker } from '../../src/explore/LensPicker';
import SimulationReveal from './Reveals/SimulationReveal';
import CustomLensOffer from './Reveals/CustomLensOffer';
import { TerminatorModePrompt, TerminatorModeOverlay } from './Reveals/TerminatorMode';
import FounderStory from './Reveals/FounderStory';
import ConversionCTAPanel from './ConversionCTA';

// Types
import { TerminalFlowProps } from './types';

/**
 * TerminalFlow - Flow state machine for Terminal overlays
 *
 * Responsibilities:
 * - Render WelcomeInterstitial for first-time users
 * - Render LensPicker for lens selection
 * - Render CustomLensWizard for lens creation
 * - Render all Reveal overlays (simulation, founder story, etc.)
 * - Render modals (help, journeys, stats, garden)
 *
 * This component handles the "non-chat" UI states of the Terminal.
 */
const TerminalFlow: React.FC<TerminalFlowProps> = ({
  // Flow state visibility
  showWelcome,
  showLensPicker,
  showCustomLensWizard,

  // Reveal states
  showSimulationReveal,
  showCustomLensOffer,
  showTerminatorPrompt,
  showFounderStory,
  showConversionCTA,
  showJourneyCompletion,
  terminatorModeActive,

  // Modal states
  showHelpModal,
  showJourneysModal,
  showStatsModal,
  showGardenModal,

  // Data
  currentArchetypeId,
  activeLensData,
  enabledPersonas,
  customLenses,
  completedJourneyTitle,
  journeyStartTime,
  activeJourneyId,

  // Feature flags
  showCustomLensInPicker,
  showJourneyRatings,
  showFeedbackTransmission,

  // Handlers - Lens selection
  onLensSelect,
  onWelcomeLensSelect,
  onCreateCustomLens,
  onDeleteCustomLens,
  onCustomLensComplete,
  onCustomLensCancel,

  // Handlers - Reveals
  onSimulationContinue,
  onCustomLensOfferAccept,
  onCustomLensOfferDecline,
  onTerminatorAccept,
  onTerminatorDecline,
  onFounderStoryContinue,
  onConversionDismiss,
  onConversionCTAClick,

  // Handlers - Journey completion
  onJourneyCompletionSubmit,
  onJourneyCompletionSkip,

  // Handlers - Modals
  onCloseHelpModal,
  onCloseJourneysModal,
  onCloseStatsModal,
  onCloseGardenModal,
  onViewFullStats,

  // Handlers - LensPicker
  onLensPickerBack,
  onLensPickerAfterSelect,

  // URL lens support
  urlLensId
}) => {
  return (
    <>
      {/* ================================================================== */}
      {/* FLOW INTERSTITIALS (mutually exclusive with chat) */}
      {/* ================================================================== */}

      {showCustomLensWizard && (
        <CustomLensWizard
          onComplete={onCustomLensComplete}
          onCancel={onCustomLensCancel}
        />
      )}

      {showWelcome && !showCustomLensWizard && (
        <WelcomeInterstitial
          personas={enabledPersonas}
          customLenses={customLenses}
          onSelect={onWelcomeLensSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCustomLensInPicker}
        />
      )}

      {showLensPicker && !showWelcome && !showCustomLensWizard && (
        <LensPicker
          mode="compact"
          onBack={onLensPickerBack}
          onAfterSelect={onLensPickerAfterSelect}
        />
      )}

      {/* ================================================================== */}
      {/* REVEAL OVERLAYS (shown over chat) */}
      {/* ================================================================== */}

      {showSimulationReveal && currentArchetypeId && (
        <SimulationReveal
          archetypeId={currentArchetypeId}
          onContinue={onSimulationContinue}
        />
      )}

      {showCustomLensOffer && (
        <CustomLensOffer
          onAccept={onCustomLensOfferAccept}
          onDecline={onCustomLensOfferDecline}
        />
      )}

      {showTerminatorPrompt && (
        <TerminatorModePrompt
          onActivate={onTerminatorAccept}
          onDecline={onTerminatorDecline}
        />
      )}

      {terminatorModeActive && <TerminatorModeOverlay />}

      {showFounderStory && currentArchetypeId && (
        <FounderStory
          archetypeId={currentArchetypeId}
          onContinue={onFounderStoryContinue}
        />
      )}

      {showConversionCTA && currentArchetypeId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/30 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4">
            <ConversionCTAPanel
              archetypeId={currentArchetypeId}
              customLensName={activeLensData?.name}
              onCTAClick={onConversionCTAClick}
              onDismiss={onConversionDismiss}
            />
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODALS (shown over everything) */}
      {/* ================================================================== */}

      {showHelpModal && <HelpModal onClose={onCloseHelpModal} />}
      {showJourneysModal && <JourneysModal onClose={onCloseJourneysModal} />}
      {showStatsModal && <StatsModal onClose={onCloseStatsModal} />}
      {showGardenModal && (
        <GardenModal
          onClose={onCloseGardenModal}
          onViewFullStats={onViewFullStats}
        />
      )}
    </>
  );
};

export default TerminalFlow;
