import React, { useState, useEffect, useMemo } from 'react';
import Terminal from './components/Terminal';
import ThesisGraph from './components/ThesisGraph';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import EconomicsSlider from './components/EconomicsSlider';
import NetworkMap from './components/NetworkMap';
import AudioPlayer from './components/AudioPlayer';
import WhatIsGroveCarousel from './components/WhatIsGroveCarousel';
import PromptHooks from './components/PromptHooks';
import { SectionId, TerminalState } from './types';
import { INITIAL_TERMINAL_MESSAGE, CTA_VARIANTS } from './constants';
import { trackPromptHookClicked } from './utils/funnelAnalytics';
import { getSessionId, selectVariant } from './utils/abTesting';
import AdminAudioConsole from './components/AdminAudioConsole';
import AdminRAGConsole from './components/AdminRAGConsole';
// V2 Narrative Console with 3-column layout
import { NarrativeConsole as AdminNarrativeConsole, FeatureFlagPanel, TopicHubPanel, EngagementConsole } from './components/Admin';
import { NarrativeSchemaV2, GlobalSettings, FeatureFlag, TopicHub, DEFAULT_FEATURE_FLAGS, DEFAULT_TOPIC_HUBS, DEFAULT_GLOBAL_SETTINGS, isV2Schema, isV1Schema, nodeToCard } from './data/narratives-schema';
import { DEFAULT_PERSONAS } from './data/default-personas';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdmin(true);
    }
  }, []);


  const [activeSection, setActiveSection] = useState<SectionId>(SectionId.STAKES);
  const [externalQuery, setExternalQuery] = useState<{ nodeId?: string; display: string; query: string } | null>(null);

  const [terminalState, setTerminalState] = useState<TerminalState>({
    isOpen: false, // Default closed for cleaner first impression
    messages: [
      { id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }
    ],
    isLoading: false
  });

  // Select CTA variants deterministically per session
  const ctaVariants = useMemo(() => {
    const sessionId = getSessionId();
    return {
      readResearch: selectVariant(CTA_VARIANTS.readResearch.variants, sessionId, CTA_VARIANTS.readResearch.id),
      openTerminal: selectVariant(CTA_VARIANTS.openTerminal.variants, sessionId, CTA_VARIANTS.openTerminal.id)
    };
  }, []);

  // Intersection Observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        });
      },
      { threshold: 0.2 }
    );

    Object.values(SectionId).forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handlePromptHook = (data: { nodeId?: string; display: string; query: string }, sectionId?: SectionId) => {
    trackPromptHookClicked({
      sectionId: sectionId || 'unknown',
      hookText: data.display,
      nodeId: data.nodeId
    });
    setTerminalState(prev => ({ ...prev, isOpen: true }));
    setExternalQuery(data);
  };

  const AdminDashboard = () => {
    const [tab, setTab] = useState<'audio' | 'rag' | 'narrative' | 'flags' | 'hubs' | 'engagement'>('narrative');
    const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
    const [flagsLoading, setFlagsLoading] = useState(true);
    const [flagsSaving, setFlagsSaving] = useState(false);
    const [flagsStatus, setFlagsStatus] = useState('');

    // Load schema for flags and hubs tabs
    useEffect(() => {
      if (tab === 'flags' || tab === 'hubs') {
        loadSchema();
      }
    }, [tab]);

    const loadSchema = async () => {
      setFlagsLoading(true);
      try {
        const res = await fetch('/api/narrative');
        const data = await res.json();

        let finalSchema: NarrativeSchemaV2;
        if (isV2Schema(data)) {
          finalSchema = data;
        } else if (isV1Schema(data)) {
          const cards: Record<string, any> = {};
          for (const [id, node] of Object.entries(data.nodes as Record<string, any>)) {
            cards[id] = nodeToCard(node);
          }
          finalSchema = {
            version: "2.0",
            globalSettings: DEFAULT_GLOBAL_SETTINGS,
            personas: DEFAULT_PERSONAS,
            cards
          };
        } else {
          finalSchema = {
            version: "2.0",
            globalSettings: DEFAULT_GLOBAL_SETTINGS,
            personas: DEFAULT_PERSONAS,
            cards: {}
          };
        }

        // Ensure featureFlags exist
        if (!finalSchema.globalSettings.featureFlags) {
          finalSchema.globalSettings.featureFlags = DEFAULT_FEATURE_FLAGS;
        }

        // Ensure topicHubs exist
        if (!finalSchema.globalSettings.topicHubs) {
          finalSchema.globalSettings.topicHubs = DEFAULT_TOPIC_HUBS;
        }

        setSchema(finalSchema);
      } catch (err) {
        console.error('Failed to load schema:', err);
        setFlagsStatus('Error loading flags');
      } finally {
        setFlagsLoading(false);
      }
    };

    const handleFlagToggle = (flagId: string, enabled: boolean) => {
      if (!schema) return;

      const updatedFlags = schema.globalSettings.featureFlags.map(flag =>
        flag.id === flagId ? { ...flag, enabled } : flag
      );

      setSchema({
        ...schema,
        globalSettings: {
          ...schema.globalSettings,
          featureFlags: updatedFlags
        }
      });
    };

    const handleTopicHubsUpdate = (hubs: TopicHub[]) => {
      if (!schema) return;
      setSchema({
        ...schema,
        globalSettings: {
          ...schema.globalSettings,
          topicHubs: hubs
        }
      });
    };

    const saveFlagsToProduction = async () => {
      if (!schema) return;
      setFlagsSaving(true);
      setFlagsStatus('Saving...');

      try {
        const res = await fetch('/api/admin/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schema)
        });
        const data = await res.json();

        if (data.success) {
          setFlagsStatus('Saved to Production');
          setTimeout(() => setFlagsStatus(''), 3000);
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        setFlagsStatus('Error: ' + err.message);
      } finally {
        setFlagsSaving(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 p-12 font-sans text-gray-900">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-3xl">Antigravity Console</h1>
            <p className="text-gray-500 text-sm mt-1">Project Control Plane</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setTab('narrative')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${tab === 'narrative' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Narrative Engine
            </button>
            <button
              onClick={() => setTab('flags')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${tab === 'flags' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Flags
            </button>
            <button
              onClick={() => setTab('hubs')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${tab === 'hubs' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Topic Hubs
            </button>
            <button
              onClick={() => setTab('audio')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${tab === 'audio' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Audio Studio
            </button>
            <button
              onClick={() => setTab('rag')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${tab === 'rag' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Knowledge Base
            </button>
            <button
              onClick={() => setTab('engagement')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${tab === 'engagement' ? 'bg-white shadow text-black' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Engagement
            </button>
          </div>
        </header>

        {tab === 'narrative' && <AdminNarrativeConsole />}
        {tab === 'flags' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Feature Flags</h2>
                <p className="text-xs text-gray-500">Control Terminal behavior without code deployment</p>
              </div>
              <div className="flex items-center space-x-3">
                {flagsStatus && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    flagsStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {flagsStatus}
                  </span>
                )}
                <button
                  onClick={saveFlagsToProduction}
                  disabled={flagsSaving || flagsLoading}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {flagsSaving ? 'Saving...' : 'Save to Production'}
                </button>
              </div>
            </div>
            {flagsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading feature flags...</div>
            ) : schema ? (
              <FeatureFlagPanel
                flags={schema.globalSettings.featureFlags || DEFAULT_FEATURE_FLAGS}
                onToggle={handleFlagToggle}
              />
            ) : (
              <div className="p-8 text-center text-gray-500">Failed to load flags</div>
            )}
          </div>
        )}
        {tab === 'hubs' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Topic Hubs</h2>
                <p className="text-xs text-gray-500">Route specific queries to curated knowledge sources</p>
              </div>
              <div className="flex items-center space-x-3">
                {flagsStatus && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    flagsStatus.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {flagsStatus}
                  </span>
                )}
                <button
                  onClick={saveFlagsToProduction}
                  disabled={flagsSaving || flagsLoading}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {flagsSaving ? 'Saving...' : 'Save to Production'}
                </button>
              </div>
            </div>
            {flagsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading topic hubs...</div>
            ) : schema ? (
              <div className="h-[600px]">
                <TopicHubPanel
                  hubs={schema.globalSettings.topicHubs || DEFAULT_TOPIC_HUBS}
                  onUpdate={handleTopicHubsUpdate}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">Failed to load hubs</div>
            )}
          </div>
        )}
        {tab === 'audio' && <AdminAudioConsole />}
        {tab === 'rag' && <AdminRAGConsole />}
        {tab === 'engagement' && <EngagementConsole />}
      </div>
    );
  };

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="bg-paper min-h-screen">

      <AudioPlayer />
      <Terminal
        activeSection={activeSection}
        terminalState={terminalState}
        setTerminalState={setTerminalState}
        externalQuery={externalQuery}
        onQueryHandled={() => setExternalQuery(null)}
      />

      {/* SECTION 1: THE STAKES (HERO) - Updated to 'Paper' aesthetic */}
      <section id={SectionId.STAKES} className="min-h-screen flex flex-col justify-center items-center text-center py-24 px-6 bg-paper relative overflow-hidden bg-grain">

        <div className="content-z relative z-10 max-w-4xl mx-auto">
          <div className="mb-6">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-grove-clay border-b border-grove-clay/30 pb-1">
              Research Preview v0.09
            </span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl font-bold mb-8 leading-[0.9] text-ink tracking-tight">
            The $380 Billion Bet<br />
            <span className="italic text-grove-forest">Against Ownership.</span>
          </h1>

          <div className="w-16 h-1 bg-ink/10 mx-auto mb-10"></div>

          <p className="font-serif text-xl md:text-2xl text-ink leading-relaxed max-w-2xl mx-auto mb-8">
            Four companies are spending $380 billion this year on AI infrastructure. Not to sell you AI. To <span className="font-semibold border-b border-ink/20">rent it to you—forever</span>.
          </p>

          <p className="font-sans text-ink-muted text-lg max-w-xl mx-auto mb-6">
            They're building the mainframes of the 2020s. Massive, centralized, and designed so you'll never stop paying.
          </p>

          <p className="font-sans text-ink-muted text-lg max-w-xl mx-auto mb-16">
            But capability doesn't stay locked up. It propagates. What costs $1,000 today costs $10 in eighteen months. The question isn't whether AI becomes cheap and local. The question is who builds the infrastructure to capture that shift.
          </p>

          <div className="space-y-6">
            <button
              onClick={() => document.getElementById(SectionId.RATCHET)?.scrollIntoView({ behavior: 'smooth' })}
              className="group flex items-center space-x-3 mx-auto px-8 py-3 bg-white border border-ink/10 rounded-full shadow-sm hover:shadow-md hover:border-grove-forest/30 transition-all duration-300"
            >
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink group-hover:text-grove-forest transition-colors">See the flaw</span>
              <svg className="w-4 h-4 text-ink-muted group-hover:text-grove-forest group-hover:translate-y-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
            </button>
            <PromptHooks sectionId={SectionId.STAKES} onHookClick={(data) => handlePromptHook(data, SectionId.STAKES)} />
          </div>

        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 md:px-12 bg-grain">

        {/* SECTION 2: THE RATCHET */}
        <section id={SectionId.RATCHET} className="min-h-screen py-24 flex flex-col justify-center max-w-5xl mx-auto content-z">
          <div className="mb-16 border-l-2 border-grove-forest pl-8">
            <span className="font-mono text-ink-muted uppercase tracking-widest text-xs block mb-3">01. The Insight</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-ink mb-6 leading-tight">
              They're Building <span className="italic text-ink-muted">Mainframes.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              <div className="md:col-span-8">
                <p className="font-serif text-lg text-ink/80 leading-relaxed mb-4">
                  Today's smart money assumes that, with enough capital, the frontier stays out of reach — that whoever controls the biggest data centers controls AI. They're building moats.
                </p>
                <p className="font-serif text-lg text-ink/80 leading-relaxed mb-4">
                  But AI capability doesn't stay locked up. It actually propagates.
                </p>
                <p className="font-serif text-lg text-ink/80 leading-relaxed mb-4">
                  AI capability doubles every seven months. Local hardware follows the same curve — with a 21-month lag. This gap between "frontier" and "local" capability stays constant at roughly 8x at a fraction of the cost, and provides a sovereign ownership model. Plus, the absolute capability of local hardware keeps rising.
                </p>
                <p className="font-serif text-lg text-ink/80 leading-relaxed mb-4">
                  In 21 months, what required a data center runs on hardware you own. The question isn't whether this will happen — the data shows it already is happening. The question is who builds the infrastructure to systematically harness this phenomenon.
                </p>
                <p className="font-serif text-lg text-ink leading-relaxed font-bold">
                  That's the bet. Not against AI — a bet that distributed, sovereign AI will emerge triumphant.
                </p>
              </div>
            </div>
          </div>

          <ThesisGraph />

          <div className="mt-16 text-center space-y-6">
            <button onClick={() => document.getElementById(SectionId.WHAT_IS_GROVE)?.scrollIntoView({ behavior: 'smooth' })} className="text-ink text-sm font-bold font-mono uppercase tracking-wider hover:text-grove-forest transition-colors flex items-center justify-center space-x-2 mx-auto border-b border-transparent hover:border-grove-forest pb-1">
              <span>See the solution</span>
            </button>
            <PromptHooks sectionId={SectionId.RATCHET} onHookClick={(data) => handlePromptHook(data, SectionId.RATCHET)} />
          </div>
        </section>

        {/* SECTION 3: WHAT IS THE GROVE (CAROUSEL) */}
        <WhatIsGroveCarousel onPromptHook={(data) => handlePromptHook(data, SectionId.WHAT_IS_GROVE)} />

        {/* SECTION 4: ARCHITECTURE */}
        <section id={SectionId.ARCHITECTURE} className="min-h-screen py-24 flex flex-col justify-center border-t border-ink/5 max-w-5xl mx-auto content-z">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <span className="font-mono text-ink-muted uppercase tracking-widest text-xs block mb-4">02. The Architecture</span>
            <h2 className="font-display text-4xl font-bold text-ink mb-8">Your thinking. Your hardware. Your history.</h2>
            <div className="font-serif text-lg text-ink/80 mb-12 space-y-6">
              <p>
                Every conversation you've had with ChatGPT lives on someone else's servers. Every question, every document, every half-formed idea—owned by a company that could change its terms tomorrow.
              </p>
              <p className="font-bold text-grove-forest text-xl font-display italic">
                You're not a user. You're a tenant.
              </p>
              <p>
                Grove inverts this. Routine thinking runs locally, on hardware you own. Your agents know your history because that history lives with you.
              </p>
              <p>
                Cloud capability is available when needed—for complex synthesis, for breakthrough moments. But the expensive insight becomes durable local memory. Capability transfers. Over time, you need the cloud less.
              </p>
            </div>
            <PromptHooks sectionId={SectionId.ARCHITECTURE} onHookClick={(data) => handlePromptHook(data, SectionId.ARCHITECTURE)} />
          </div>

          <ArchitectureDiagram onArtifactRequest={(data) => handlePromptHook(data, SectionId.ARCHITECTURE)} />

        </section>

        {/* SECTION 5: ECONOMICS */}
        <section id={SectionId.ECONOMICS} className="min-h-screen py-24 flex flex-col justify-center border-t border-ink/5 max-w-5xl mx-auto content-z">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <span className="font-mono text-ink-muted uppercase tracking-widest text-xs block mb-4">03. The Economics</span>
            <h2 className="font-display text-4xl font-bold text-ink mb-6">A business model that shrinks.</h2>
            <p className="font-serif text-lg text-ink/80 leading-relaxed mb-4">
              Traditional platforms grow by extracting more from users. Grove inverts this.
            </p>
            <p className="font-serif text-lg text-ink/80 leading-relaxed mb-4">
              New communities need more cloud help—so they pay a higher efficiency tax (30-40%). As communities demonstrate they can accomplish more with less cloud support, the tax shrinks. Mature communities pay 3-5%.
            </p>
            <p className="font-serif text-lg text-ink font-bold leading-relaxed mb-6">
              The Foundation's revenue decreases as the network succeeds. That's the point.
            </p>
            <p className="font-sans text-lg text-grove-clay font-medium italic mb-8">
              "Progressive taxation in reverse. You pay more when you cost more. You pay less as you develop."
            </p>
            <PromptHooks sectionId={SectionId.ECONOMICS} onHookClick={(data) => handlePromptHook(data, SectionId.ECONOMICS)} />
          </div>

          <EconomicsSlider />

        </section>

        {/* SECTION 6: DIFFERENTIATION */}
        <section id={SectionId.DIFFERENTIATION} className="min-h-screen py-24 flex flex-col justify-center border-t border-ink/5 content-z">
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center mb-16">
              <span className="font-mono text-ink-muted uppercase tracking-widest text-xs block mb-4">04. The Difference</span>
              <h2 className="font-display text-5xl font-bold text-ink mb-8">Tool vs. Staff</h2>
              <PromptHooks sectionId={SectionId.DIFFERENTIATION} onHookClick={(data) => handlePromptHook(data, SectionId.DIFFERENTIATION)} />
            </div>

            {/* SPLIT SCREEN CONTRAST */}
            <div className="flex flex-col md:flex-row bg-white shadow-xl rounded-sm border border-ink/5 overflow-hidden mb-16 h-auto md:h-[500px]">
              {/* Left: Renters */}
              <div className="flex-1 bg-paper-dark p-8 md:p-12 flex flex-col justify-center border-r border-ink/5">
                <h3 className="font-display font-bold text-xl text-ink-muted mb-8 uppercase tracking-widest">Existing AI</h3>
                <ul className="space-y-8">
                  <li className="flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink/20 mr-4 group-hover:bg-ink/50 transition-colors"></span>
                    <span className="font-sans text-lg text-ink-muted">Stateless & Forgetting</span>
                  </li>
                  <li className="flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink/20 mr-4 group-hover:bg-ink/50 transition-colors"></span>
                    <span className="font-sans text-lg text-ink-muted">Rented Access</span>
                  </li>
                  <li className="flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink/20 mr-4 group-hover:bg-ink/50 transition-colors"></span>
                    <span className="font-sans text-lg text-ink-muted">Isolated Instance</span>
                  </li>
                  <li className="flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink/20 mr-4 group-hover:bg-ink/50 transition-colors"></span>
                    <span className="font-sans text-lg text-ink-muted">Static Capability</span>
                  </li>
                </ul>
              </div>

              {/* Right: Owners */}
              <div className="flex-1 bg-grove-forest p-8 md:p-12 flex flex-col justify-center relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <svg width="240" height="240" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>

                <h3 className="font-display font-bold text-xl text-white mb-8 uppercase tracking-widest border-b border-white/20 pb-2 inline-block w-fit">The Grove</h3>
                <ul className="space-y-8 relative z-10">
                  <li className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-white mr-4 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></span>
                    <span className="font-serif text-2xl text-white">Persistent Memory</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-white mr-4 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></span>
                    <span className="font-serif text-2xl text-white">Owned Infrastructure</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-white mr-4 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></span>
                    <span className="font-serif text-2xl text-white">Networked Intelligence</span>
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-white mr-4 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></span>
                    <span className="font-serif text-2xl text-white">Learning Civilization</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Pull Quote Block */}
            <div className="bg-white p-10 rounded-sm border border-ink/5 shadow-lg max-w-4xl mx-auto text-center relative">
              <span className="absolute top-4 left-6 text-6xl text-ink/5 font-serif">“</span>
              <p className="font-serif italic text-xl md:text-2xl text-ink leading-relaxed relative z-10">
                Day one, ChatGPT is magically more capable. Day one, The Grove is more persistent, more personal (and most importantly) all yours. But the Grove closes the gap, ratcheting ever forward, thousands of communities sharing the fruits of the Knowledge Commons — not because The Grove gets funding, but because capability propagates.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: THE NETWORK */}
        <section id={SectionId.NETWORK} className="min-h-screen py-24 flex flex-col justify-center border-t border-ink/5 content-z">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-16">
              <div className="lg:col-span-5">
                <span className="font-mono text-ink-muted uppercase tracking-widest text-xs block mb-4">05. The Network</span>
                <h2 className="font-display text-4xl font-bold text-ink mb-6">A civilization that learns.</h2>
                <p className="font-serif text-lg text-ink/80 leading-relaxed mb-6">
                  Your Grove connects to other Groves. When an agent community solves a problem, the solution can propagate. Attribution flows back to the source.
                </p>
                <p className="font-serif text-lg text-ink/80 leading-relaxed mb-6">
                  This is the part that's hard to copy. Not the local inference—that's commodity. Not the hybrid architecture—that's engineering. The network of communities developing genuine capability and sharing what works.
                </p>
                <PromptHooks sectionId={SectionId.NETWORK} onHookClick={(data) => handlePromptHook(data, SectionId.NETWORK)} className="justify-start" />
              </div>
              <div className="lg:col-span-7">
                <NetworkMap />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              {/* Elena Vignette */}
              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-6 text-center">Documented Breakthroughs</h4>
                <div className="bg-paper-dark p-8 rounded-sm border border-ink/5">
                  <p className="font-serif text-ink/80 leading-relaxed mb-4">
                    Elena stared at the simulation logs. The agent communities had been underperforming for weeks—until yesterday.
                  </p>
                  <p className="font-serif text-ink/80 leading-relaxed mb-4">
                    "They changed the reward structure themselves," she muttered.
                  </p>
                  <p className="font-serif text-ink/80 leading-relaxed mb-4">
                    The breakthrough wasn't in the agents' behavior. It was in how they'd learned to <em>evaluate</em> behavior. One community had stopped optimizing for the metric Elena designed and started optimizing for something emergent—a composite that weighted collaboration, efficiency, and novelty in ways she hadn't anticipated.
                  </p>
                  <p className="font-serif text-ink/80 leading-relaxed mb-4">
                    She pulled up the paper she'd bookmarked months ago. The researchers had shown that optimal incentives aren't designed—they're discovered through observed outcomes. The Grove wasn't supposed to work this way yet. But the agents had figured it out themselves.
                  </p>
                  <p className="font-serif text-ink font-semibold leading-relaxed">
                    Elena smiled. The cobra wouldn't bite today.
                  </p>
                  <p className="font-mono text-xs text-ink-muted mt-6">
                    Research: <a
                      href="https://www.nature.com/articles/s41467-025-66009-y"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-grove-forest transition-colors"
                    >
                      Lu et al., "Discovery of the reward function for embodied RL agents," Nature Communications (2025)
                    </a>
                  </p>
                </div>
              </div>

              {/* Three Layers */}
              <div className="space-y-4 pt-8">
                <h4 className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2">The Layers</h4>

                <div className="bg-white border border-ink/10 p-6 rounded-sm shadow-sm hover:border-grove-forest/30 transition-colors">
                  <h5 className="font-bold font-display text-ink mb-2">1. Your Village</h5>
                  <p className="text-sm font-sans text-ink-muted leading-relaxed">~100 agents with distinct personalities. They coordinate. They develop. They document their experiences.</p>
                </div>

                <div className="bg-white border border-ink/10 p-6 rounded-sm shadow-sm hover:border-grove-forest/30 transition-colors">
                  <h5 className="font-bold font-display text-ink mb-2">2. The Knowledge Commons</h5>
                  <p className="text-sm font-sans text-ink-muted leading-relaxed">When your village solves a problem, you share it. Attribution flows back. Credit compounds.</p>
                </div>

                <div className="bg-white border border-ink/10 p-6 rounded-sm shadow-sm hover:border-grove-forest/30 transition-colors">
                  <h5 className="font-bold font-display text-ink mb-2">3. Collective Intelligence</h5>
                  <p className="text-sm font-sans text-ink-muted leading-relaxed">Distributed communities collaborate on challenges none could solve alone. The civilization gets smarter.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: GET INVOLVED */}
        <section id={SectionId.GET_INVOLVED} className="min-h-screen py-24 flex flex-col justify-center border-t border-ink/5 content-z">
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center mb-16">
              <span className="font-mono text-ink-muted uppercase tracking-widest text-xs block mb-4">06. Get Involved</span>
              <h2 className="font-display text-5xl font-bold text-ink mb-6">The Terminal is open.</h2>
              <p className="font-serif text-xl text-ink/70 max-w-2xl mx-auto mb-4">
                Grove is in active development. The research is public. The architecture is documented. And you can explore everything here.
              </p>
              <p className="font-serif text-lg text-ink/60 max-w-2xl mx-auto mb-8">
                This isn't a waitlist. The Terminal has access to the complete white paper, technical deep dives, and advisory council analysis. Ask anything. The map will emerge.
              </p>
              <PromptHooks sectionId={SectionId.GET_INVOLVED} onHookClick={(data) => handlePromptHook(data, SectionId.GET_INVOLVED)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">

              {/* Path 1: Research */}
              <div className="bg-white p-8 rounded-sm border border-ink/10 hover:shadow-xl transition-all group">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">📄</div>
                <h3 className="font-display font-bold text-xl text-ink mb-2">Read the Research</h3>
                <p className="font-sans text-sm text-ink-muted mb-6">The complete white paper, technical deep dives, and advisory council analysis.</p>
                <div className="flex space-x-4">
                  <a href="https://yummy-twig-79e.notion.site/The-Grove-A-World-Changing-Play-for-Distributed-Intelligence-2c7780a78eef80b6b4f7ceb3f3c94c73" target="_blank" rel="noreferrer" className="px-4 py-2 border border-ink/10 bg-paper hover:bg-white text-ink text-xs font-mono uppercase tracking-wider rounded-sm transition-colors" data-variant-id={ctaVariants.readResearch.id}>
                    {ctaVariants.readResearch.text}
                  </a>
                </div>
              </div>

              {/* Path 2: Terminal */}
              <div className="bg-white p-8 rounded-sm border border-ink/10 hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-grove-forest/5 rounded-bl-full"></div>
                <div className="text-3xl mb-4 text-grove-forest">{">_"}</div>
                <h3 className="font-display font-bold text-xl text-ink mb-2">Query the Terminal</h3>
                <p className="font-sans text-sm text-ink-muted mb-6">Ask questions about architecture or economics. The AI assistant has access to everything.</p>
                <button
                  onClick={() => setTerminalState(prev => ({ ...prev, isOpen: true }))}
                  className="px-4 py-2 bg-grove-forest text-white text-xs font-mono uppercase tracking-wider hover:bg-ink transition-colors rounded-sm"
                  data-variant-id={ctaVariants.openTerminal.id}
                >
                  {ctaVariants.openTerminal.text}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-ink/10 pt-12 text-center">
              <p className="font-mono text-xs text-ink-muted mb-2">The Grove Research Preview v0.09</p>
              <p className="font-serif text-sm text-ink/50">© 2025 The Grove Foundation</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;