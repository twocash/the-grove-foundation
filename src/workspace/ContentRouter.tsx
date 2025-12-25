// src/workspace/ContentRouter.tsx
// Center view switching based on navigation state

import { useWorkspaceUI } from './WorkspaceUIContext';
import { ExploreChat } from '../explore/ExploreChat';
import { LensPicker } from '../explore/LensPicker';
import { NodeGrid } from '../explore/NodeGrid';
import { JourneyList } from '../explore/JourneyList';
import { DiaryList } from '../explore/DiaryList';
import { ProjectDashboard } from '../explore/ProjectDashboard';
import { SproutGrid } from '../cultivate/SproutGrid';
import { VillageFeed } from '../village/VillageFeed';
import { CustomLensWizard } from '../../components/Terminal/CustomLensWizard';
import { useCustomLens } from '../../hooks/useCustomLens';
import { useEngagement, useLensState } from '@core/engagement';
import { MessageSquare, Code, Bot } from 'lucide-react';

// Coming Soon placeholder for "Do" section items
interface DoPlaceholderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

function DoPlaceholder({ title, description, icon, features }: DoPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-[var(--grove-text-dim)] mb-4">{icon}</div>
      <h2 className="text-xl font-semibold text-[var(--grove-text)] mb-2">{title}</h2>
      <p className="text-[var(--grove-text-muted)] mb-6 max-w-md">{description}</p>
      <div className="text-[var(--grove-text-dim)] text-sm">
        <p className="mb-2">Coming capabilities:</p>
        <ul className="list-disc list-inside text-left">
          {features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      </div>
      <div className="mt-8 px-4 py-2 border border-[var(--grove-border)] rounded text-[var(--grove-text-dim)] text-sm">
        Coming in Grove 1.0
      </div>
    </div>
  );
}

// Chat placeholder
function ChatPlaceholder() {
  return (
    <DoPlaceholder
      title="Chat"
      description="Your AI thinking partner for brainstorming, writing, and conversation."
      icon={<MessageSquare size={48} />}
      features={[
        "Brainstorm ideas without sending data to the cloud",
        "Draft and refine writing in your voice",
        "Explore topics through natural conversation",
      ]}
    />
  );
}

// Apps placeholder
function AppsPlaceholder() {
  return (
    <DoPlaceholder
      title="Apps"
      description="Build personal tools and widgets powered by local AI."
      icon={<Code size={48} />}
      features={[
        "Create custom dashboards and calculators",
        "Build automation scripts with natural language",
        "Design personal productivity tools",
      ]}
    />
  );
}

// Agents placeholder
function AgentsPlaceholder() {
  return (
    <DoPlaceholder
      title="Agents"
      description="Delegate tasks to AI agents that work on your behalf."
      icon={<Bot size={48} />}
      features={[
        "Research and summarize topics",
        "Monitor and alert on conditions",
        "Execute multi-step workflows",
      ]}
    />
  );
}

// Real components imported from:
// - NodeGrid: ../explore/NodeGrid
// - JourneyList: ../explore/JourneyList
// - LensPicker: ../explore/LensPicker
// - SproutGrid: ../cultivate/SproutGrid
// - VillageFeed: ../village/VillageFeed

// CommonsFeed placeholder - to be implemented in future sprint
function CommonsFeed() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="text-6xl mb-4">🌳</div>
      <h2 className="text-2xl font-semibold text-[var(--grove-text)] mb-2">Knowledge Commons</h2>
      <p className="text-[var(--grove-text-muted)] max-w-md">
        Insights that have been validated and shared across the network.
      </p>
      <p className="mt-4 text-sm text-[var(--grove-text-dim)]">Coming in Grove 1.0</p>
    </div>
  );
}

/**
 * Maps navigation path to view ID
 */
function pathToView(path: string[]): string {
  const key = path.join('.');

  const viewMap: Record<string, string> = {
    // Explore > Grove Project (field) > views
    'explore': 'terminal',  // Default if clicking Explore directly
    'explore.groveProject': 'project-dashboard',
    'explore.groveProject.terminal': 'terminal',
    'explore.groveProject.lenses': 'lens-picker',
    'explore.groveProject.journeys': 'journey-list',
    'explore.groveProject.nodes': 'node-grid',
    'explore.groveProject.diary': 'diary-list',
    'explore.groveProject.sprouts': 'sprout-grid',
    // Legacy paths (backward compatibility)
    'explore.nodes': 'node-grid',
    'explore.journeys': 'journey-list',
    'explore.lenses': 'lens-picker',
    // Do - Coming Soon placeholders
    'do.chat': 'chat-placeholder',
    'do.apps': 'apps-placeholder',
    'do.agents': 'agents-placeholder',
    // Cultivate
    'cultivate.mySprouts': 'sprout-grid',
    'cultivate.commons': 'commons-feed',
    // Village
    'village.feed': 'village-feed',
  };

  return viewMap[key] || 'terminal'; // Default to terminal
}

export function ContentRouter() {
  const { navigation, showCustomLensWizard, closeCustomLensWizard, openInspector } = useWorkspaceUI();
  const { saveCustomLens } = useCustomLens();
  const { actor } = useEngagement();
  const { selectLens } = useLensState({ actor });
  const viewId = pathToView(navigation.activePath);

  // Handle custom lens wizard completion
  const handleWizardComplete = async (candidate: Parameters<typeof saveCustomLens>[0], userInputs: Parameters<typeof saveCustomLens>[1]) => {
    const savedLens = await saveCustomLens(candidate, userInputs);
    selectLens(savedLens.id);
    closeCustomLensWizard();
    // Open inspector to show the new lens
    openInspector({ type: 'lens', lensId: savedLens.id });
  };

  // If wizard is open, show it instead of the normal view
  if (showCustomLensWizard) {
    return (
      <main className="flex-1 overflow-hidden bg-[var(--grove-surface)]">
        <CustomLensWizard
          onComplete={handleWizardComplete}
          onCancel={closeCustomLensWizard}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-hidden bg-[var(--grove-surface)]">
      {viewId === 'terminal' && <ExploreChat />}
      {viewId === 'project-dashboard' && <ProjectDashboard />}
      {viewId === 'node-grid' && <NodeGrid />}
      {viewId === 'journey-list' && <JourneyList />}
      {viewId === 'lens-picker' && <LensPickerWithWizard />}
      {viewId === 'diary-list' && <DiaryList />}
      {viewId === 'chat-placeholder' && <ChatPlaceholder />}
      {viewId === 'apps-placeholder' && <AppsPlaceholder />}
      {viewId === 'agents-placeholder' && <AgentsPlaceholder />}
      {viewId === 'sprout-grid' && <SproutGrid />}
      {viewId === 'commons-feed' && <CommonsFeed />}
      {viewId === 'village-feed' && <VillageFeed />}
    </main>
  );
}

// Wrapper to connect LensPicker to workspace context
function LensPickerWithWizard() {
  const { openCustomLensWizard } = useWorkspaceUI();
  return <LensPicker onCreateCustomLens={openCustomLensWizard} />;
}
