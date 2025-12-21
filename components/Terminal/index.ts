// Terminal components barrel export
// V2.2: Added TerminalPill for minimize-to-pill functionality (v0.12)
// V2.3: Added LensGrid and WelcomeInterstitial for welcome/switching split (v0.12d)
// V2.4: Added CommandInput and Modals for command palette (v0.16)
export { default as LensPicker } from './LensPicker';
export { default as LensGrid } from './LensGrid';
export { default as WelcomeInterstitial } from './WelcomeInterstitial';
export { default as LensBadge } from './LensBadge';
export { default as CustomLensWizard } from './CustomLensWizard';
export { default as JourneyCard } from './JourneyCard';
export { default as JourneyCompletion } from './JourneyCompletion';
export { default as JourneyNav } from './JourneyNav';
export { default as LoadingIndicator } from './LoadingIndicator';
export { default as TerminalPill } from './TerminalPill';
export { default as TerminalHeader } from './TerminalHeader';
export { default as TerminalControls } from './TerminalControls';
export { default as SuggestionChip } from './SuggestionChip';

// Command Palette components (v0.16)
export { CommandInput, commandRegistry, useCommandParser } from './CommandInput';
export type { Command, CommandContext, CommandResult } from './CommandInput';
export { HelpModal, JourneysModal, StatsModal } from './Modals';
