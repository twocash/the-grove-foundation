import React, { useState, useEffect } from 'react';
import Terminal from './components/Terminal';
import ThesisGraph from './components/ThesisGraph';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import EconomicsSlider from './components/EconomicsSlider';
import NetworkMap from './components/NetworkMap';
import DiaryEntry from './components/DiaryEntry';
import AudioPlayer from './components/AudioPlayer';
import { SectionId, TerminalState } from './types';
import { INITIAL_TERMINAL_MESSAGE } from './constants';
import { generateArtifact } from './services/geminiService';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionId>(SectionId.STAKES);
  
  const [terminalState, setTerminalState] = useState<TerminalState>({
    isOpen: false,
    messages: [
      { id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }
    ],
    isLoading: false
  });

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

  const handleArtifactRequest = async () => {
    setTerminalState(prev => ({ ...prev, isOpen: true, isLoading: true }));
    const reqId = Date.now().toString();
    setTerminalState(prev => ({
        ...prev,
        messages: [...prev.messages, { id: reqId, role: 'user', text: "Generate System Specification for a Local Node." }]
    }));

    const artifact = await generateArtifact(
        "Generate a JSON specification for a Grove Local Node using Raspberry Pi 5 specs and local Llama 3. Include specific Distributed Systems choices from the whitepaper.", 
        "Architecture Section"
    );

    const respId = (Date.now() + 1).toString();
    setTerminalState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, { id: respId, role: 'model', text: artifact }]
    }));
  };

  return (
    <div className="bg-grove-cream min-h-screen selection:bg-grove-forest selection:text-grove-cream">
      
      <AudioPlayer />
      <Terminal 
        activeSection={activeSection} 
        terminalState={terminalState} 
        setTerminalState={setTerminalState} 
      />

      {/* SECTION 1: THE STAKES (HERO) */}
      <section id={SectionId.STAKES} className="min-h-screen flex flex-col justify-center items-center text-center py-20 px-6 bg-grove-dark text-grove-cream relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="relative z-10 max-w-4xl">
          <h1 className="font-display text-6xl md:text-8xl font-bold mb-8 leading-tight tracking-tight">
            The $380 Billion <br/> <span className="text-terminal-highlight">Bet Against You</span>
          </h1>
          <p className="font-serif text-xl md:text-2xl text-grove-light/80 italic max-w-2xl mx-auto mb-12 leading-relaxed">
            Microsoft, Google, Amazon, and Meta are spending $380 billion this year to build AI infrastructure designed to be rented, not owned.
          </p>
          <p className="font-serif text-lg text-grove-light/60 max-w-xl mx-auto mb-12">
             They're building a world where AI is a utility you pay for monthly — forever. But their bet has a flaw.
          </p>
          
          <button 
            onClick={() => document.getElementById(SectionId.RATCHET)?.scrollIntoView({ behavior: 'smooth' })} 
            className="group flex items-center space-x-2 mx-auto px-8 py-4 border border-grove-cream/20 rounded-full hover:bg-grove-cream hover:text-grove-dark transition-all duration-300"
          >
            <span className="font-mono text-sm uppercase tracking-widest">See the flaw</span>
            <svg className="w-4 h-4 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
          </button>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 md:px-12">
        
        {/* SECTION 2: THE RATCHET */}
        <section id={SectionId.RATCHET} className="min-h-screen py-24 flex flex-col justify-center max-w-5xl mx-auto">
          <div className="mb-12">
             <span className="font-mono text-gray-500 uppercase tracking-widest text-sm block mb-4">01. The Insight</span>
             <h2 className="font-display text-4xl md:text-5xl font-bold text-grove-forest mb-8 leading-tight">
               The Gap Never Closes. <br/>The Floor Keeps Rising.
             </h2>
             
             <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
               <div className="md:col-span-7">
                 <p className="font-serif text-lg text-gray-700 leading-relaxed mb-6">
                   The smart money assumes the frontier stays out of reach. But the data tells a different story.
                 </p>
                 <p className="font-serif text-lg text-gray-700 leading-relaxed mb-6">
                   AI capability doubles every 7 months. Local hardware follows the same curve — with a 21-month lag. The gap between frontier and local stays constant at roughly 8x. 
                 </p>
                 <p className="font-serif text-lg text-gray-700 leading-relaxed font-bold">
                   But the absolute capability of local hardware rises to meet "routine cognition."
                 </p>
               </div>
               <div className="md:col-span-5 border-l-4 border-grove-forest pl-6 py-2">
                 <p className="font-serif text-xl italic text-grove-forest leading-relaxed">
                   "Today's miracle is tomorrow's commodity. The Ratchet is the pattern. The Grove is the infrastructure designed to capture it."
                 </p>
               </div>
             </div>
          </div>
          
          <ThesisGraph />

          <div className="mt-12 text-center">
             <p className="font-mono text-sm text-gray-500 mb-4">The Grove doesn't fight the Ratchet. The Grove captures it.</p>
             <button onClick={() => document.getElementById(SectionId.ARCHITECTURE)?.scrollIntoView({ behavior: 'smooth' })} className="text-grove-forest font-bold hover:text-terminal-highlight transition-colors flex items-center justify-center space-x-2 mx-auto">
                <span>See how it works</span>
                <span>→</span>
             </button>
          </div>
        </section>

        {/* SECTION 3: ARCHITECTURE */}
        <section id={SectionId.ARCHITECTURE} className="min-h-screen py-24 flex flex-col justify-center border-t border-grove-forest/10 max-w-5xl mx-auto">
          <div className="mb-12 text-center max-w-3xl mx-auto">
             <span className="font-mono text-gray-500 uppercase tracking-widest text-sm block mb-4">02. The Architecture</span>
             <h2 className="font-display text-4xl font-bold text-grove-forest mb-6">What Changes When AI Is Staff, Not Software</h2>
             <div className="font-serif text-lg text-gray-700 mb-12 space-y-6">
                <p>
                   Every conversation you've ever had with ChatGPT lives on someone else's servers. Every question you've asked Claude, every document you've uploaded, every half-formed idea you've explored — it belongs to a company that could change its terms, raise its prices, or disappear tomorrow.
                </p>
                <p className="font-bold text-grove-forest text-xl">
                   You're not a user. You're a tenant.
                </p>
                <p>
                   The Grove inverts this. Routine thinking runs locally, on hardware you own. Your agents know your history because that history lives with you — not in a data center you'll never see. Breakthrough moments still route to frontier capability when they're worth it. But the foundation is yours.
                </p>
             </div>
          </div>

          <ArchitectureDiagram onArtifactRequest={handleArtifactRequest} />
          
          <div className="text-center mt-12">
             <p className="font-mono text-xs text-gray-500 mb-2">The architecture works because it's designed to change.</p>
             <button onClick={() => document.getElementById(SectionId.ECONOMICS)?.scrollIntoView({ behavior: 'smooth' })} className="text-grove-forest font-bold hover:text-terminal-highlight transition-colors">
               See the economics →
             </button>
          </div>
        </section>

        {/* SECTION 4: ECONOMICS */}
        <section id={SectionId.ECONOMICS} className="min-h-screen py-24 flex flex-col justify-center border-t border-grove-forest/10 max-w-5xl mx-auto">
          <div className="mb-12 text-center max-w-3xl mx-auto">
             <span className="font-mono text-gray-500 uppercase tracking-widest text-sm block mb-4">03. The Economics</span>
             <h2 className="font-display text-4xl font-bold text-grove-forest mb-6">A Business Model Designed to Disappear</h2>
             <p className="font-serif text-lg text-gray-700 leading-relaxed mb-6">
               Traditional platforms monetize through extraction. The Grove inverts this. The Foundation funds infrastructure by taxing inefficiency — and the tax shrinks as communities mature.
             </p>
             <p className="font-display font-bold text-xl text-grove-forest italic">
               "Progressive taxation in reverse. You pay more when you cost more. You pay less as you develop."
             </p>
          </div>
          
          <EconomicsSlider />

          <div className="text-center mt-16">
             <button onClick={() => document.getElementById(SectionId.DIFFERENTIATION)?.scrollIntoView({ behavior: 'smooth' })} className="text-grove-forest font-bold hover:text-terminal-highlight transition-colors">
               See the difference →
             </button>
          </div>
        </section>

        {/* SECTION 5: DIFFERENTIATION (The Split Screen) */}
        <section id={SectionId.DIFFERENTIATION} className="min-h-screen py-24 flex flex-col justify-center border-t border-grove-forest/10">
          <div className="max-w-5xl mx-auto w-full">
             <div className="text-center mb-16">
               <span className="font-mono text-gray-500 uppercase tracking-widest text-sm block mb-4">04. The Difference</span>
               <h2 className="font-display text-5xl font-bold text-grove-forest">Tool vs. Staff</h2>
             </div>

             {/* SPLIT SCREEN CONTRAST */}
             <div className="flex flex-col md:flex-row shadow-2xl rounded-xl overflow-hidden mb-16 h-auto md:h-[500px]">
                {/* Left: Renters */}
                <div className="flex-1 bg-gray-100 p-8 md:p-12 flex flex-col justify-center border-r border-gray-200">
                   <h3 className="font-mono font-bold text-xl text-gray-400 mb-8 uppercase tracking-wider">Existing AI</h3>
                   <ul className="space-y-6">
                     <li className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-gray-300 mr-4"></span>
                       <span className="font-serif text-xl text-gray-500">Stateless & Forgetting</span>
                     </li>
                     <li className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-gray-300 mr-4"></span>
                       <span className="font-serif text-xl text-gray-500">Rented Access</span>
                     </li>
                     <li className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-gray-300 mr-4"></span>
                       <span className="font-serif text-xl text-gray-500">Isolated Instance</span>
                     </li>
                     <li className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-gray-300 mr-4"></span>
                       <span className="font-serif text-xl text-gray-500">Static Capability</span>
                     </li>
                   </ul>
                </div>

                {/* Right: Owners */}
                <div className="flex-1 bg-grove-forest p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                   {/* Background texture */}
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                   </div>
                   
                   <h3 className="font-mono font-bold text-xl text-terminal-phosphor mb-8 uppercase tracking-wider">The Grove</h3>
                   <ul className="space-y-6">
                     <li className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-terminal-phosphor mr-4 shadow-[0_0_8px_#00FF41]"></span>
                       <span className="font-serif text-xl text-grove-cream font-medium">Persistent Memory</span>
                     </li>
                     <li className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-terminal-phosphor mr-4 shadow-[0_0_8px_#00FF41]"></span>
                       <span className="font-serif text-xl text-grove-cream font-medium">Owned Infrastructure</span>
                     </li>
                     <li className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-terminal-phosphor mr-4 shadow-[0_0_8px_#00FF41]"></span>
                       <span className="font-serif text-xl text-grove-cream font-medium">Networked Intelligence</span>
                     </li>
                     <li className="flex items-center">
                       <span className="w-2 h-2 rounded-full bg-terminal-phosphor mr-4 shadow-[0_0_8px_#00FF41]"></span>
                       <span className="font-serif text-xl text-grove-cream font-medium">Learning Civilization</span>
                     </li>
                   </ul>
                </div>
             </div>

             {/* Pull Quote Block */}
             <div className="bg-grove-forest p-10 rounded-lg text-center max-w-4xl mx-auto shadow-xl">
                <p className="font-serif italic text-xl md:text-2xl text-grove-cream leading-relaxed opacity-90">
                  "Day one, ChatGPT is more capable. Day one, The Grove is more persistent, more personal, more yours. And the gap closes — not because The Grove gets funding, but because capability propagates."
                </p>
             </div>

             <div className="text-center mt-12">
               <button onClick={() => document.getElementById(SectionId.NETWORK)?.scrollIntoView({ behavior: 'smooth' })} className="text-grove-forest font-bold hover:text-terminal-highlight transition-colors">
                  Meet the network →
               </button>
             </div>
          </div>
        </section>

        {/* SECTION 6: THE NETWORK */}
        <section id={SectionId.NETWORK} className="min-h-screen py-24 flex flex-col justify-center border-t border-grove-forest/10">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
               <div className="lg:col-span-5">
                  <span className="font-mono text-gray-500 uppercase tracking-widest text-sm block mb-4">05. The Network</span>
                  <h2 className="font-display text-4xl font-bold text-grove-forest mb-6">A Civilization That Learns</h2>
                  <p className="font-serif text-lg text-gray-700 leading-relaxed mb-6">
                    Your instance of The Grove connects to other instances. When an agent community solves a problem, the solution propagates. 
                  </p>
                  <p className="font-serif text-lg text-gray-700 leading-relaxed">
                    This is the part that's hard to copy. Not the local inference. Not the hybrid architecture. The network of communities developing genuine capability, sharing what works, and creating something none of them could build alone.
                  </p>
               </div>
               <div className="lg:col-span-7">
                  <NetworkMap />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
               {/* Diary Entry */}
               <div>
                 <h4 className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-6 text-center">Documented Breakthroughs</h4>
                 <DiaryEntry />
               </div>

               {/* Three Layers */}
               <div className="space-y-4 pt-8">
                  <h4 className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-2">The Layers</h4>
                  
                  <div className="border border-grove-forest/10 p-5 rounded hover:bg-white transition-colors">
                     <h5 className="font-bold text-grove-forest mb-2">1. Your Village</h5>
                     <p className="text-sm font-serif text-gray-600">~100 agents with distinct personalities. They coordinate. They develop. They document their experiences.</p>
                  </div>

                  <div className="border border-grove-forest/10 p-5 rounded hover:bg-white transition-colors bg-white shadow-sm">
                     <h5 className="font-bold text-grove-forest mb-2">2. The Knowledge Commons</h5>
                     <p className="text-sm font-serif text-gray-600">When your village solves a problem, you share it. Attribution flows back. Credit compounds.</p>
                  </div>

                  <div className="border border-grove-forest/10 p-5 rounded hover:bg-white transition-colors">
                     <h5 className="font-bold text-grove-forest mb-2">3. Collective Intelligence</h5>
                     <p className="text-sm font-serif text-gray-600">Distributed communities collaborate on challenges none could solve alone. The civilization gets smarter.</p>
                  </div>
               </div>
            </div>
            
            <div className="text-center mt-20">
               <button onClick={() => document.getElementById(SectionId.GET_INVOLVED)?.scrollIntoView({ behavior: 'smooth' })} className="text-grove-forest font-bold hover:text-terminal-highlight transition-colors">
                  Join the network →
               </button>
            </div>
          </div>
        </section>

        {/* SECTION 7: GET INVOLVED (Replaces Wiki) */}
        <section id={SectionId.GET_INVOLVED} className="min-h-screen py-24 flex flex-col justify-center border-t border-grove-forest/10">
          <div className="max-w-5xl mx-auto w-full">
             <div className="text-center mb-16">
               <span className="font-mono text-gray-500 uppercase tracking-widest text-sm block mb-4">06. Get Involved</span>
               <h2 className="font-display text-5xl font-bold text-grove-forest mb-6">Join the Network</h2>
               <p className="font-serif text-xl text-gray-600 max-w-2xl mx-auto">
                 The Grove is in active development. The research is public. The code will be open. The question is what role you want to play.
               </p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                
                {/* Path 1: Research */}
                <div className="bg-white p-8 rounded-xl border border-grove-forest/10 hover:shadow-lg transition-shadow">
                   <div className="text-3xl mb-4">📄</div>
                   <h3 className="font-display font-bold text-xl text-grove-forest mb-2">Read the Research</h3>
                   <p className="font-serif text-sm text-gray-600 mb-6">The complete white paper, technical deep dives, and advisory council analysis.</p>
                   <div className="flex space-x-4">
                     <button className="px-4 py-2 bg-grove-forest text-grove-cream text-xs font-mono uppercase tracking-wider hover:bg-grove-accent rounded">
                       Download PDF
                     </button>
                     <a href="https://yummy-twig-79e.notion.site/The-Grove-A-World-Changing-Play-for-Distributed-Intelligence-2c7780a78eef80b6b4f7ceb3f3c94c73" target="_blank" rel="noreferrer" className="px-4 py-2 border border-grove-forest/20 text-grove-forest text-xs font-mono uppercase tracking-wider hover:bg-gray-50 rounded">
                       View Notion
                     </a>
                   </div>
                </div>

                {/* Path 2: Terminal */}
                <div className="bg-terminal-bg p-8 rounded-xl border border-terminal-border hover:shadow-[0_0_20px_rgba(0,255,65,0.1)] transition-shadow group">
                   <div className="text-3xl mb-4 text-terminal-phosphor">>_</div>
                   <h3 className="font-display font-bold text-xl text-grove-cream mb-2">Query the Terminal</h3>
                   <p className="font-serif text-sm text-gray-400 mb-6">Ask questions about architecture or economics. The AI assistant has access to everything.</p>
                   <button 
                     onClick={() => setTerminalState(prev => ({ ...prev, isOpen: true }))}
                     className="px-4 py-2 border border-terminal-phosphor text-terminal-phosphor text-xs font-mono uppercase tracking-wider hover:bg-terminal-phosphor hover:text-terminal-bg rounded transition-colors"
                   >
                     Open Terminal
                   </button>
                </div>

                {/* Path 3: Waitlist */}
                <div className="bg-white p-8 rounded-xl border border-grove-forest/10 hover:shadow-lg transition-shadow">
                   <div className="text-3xl mb-4">⏳</div>
                   <h3 className="font-display font-bold text-xl text-grove-forest mb-2">Join Waitlist</h3>
                   <p className="font-serif text-sm text-gray-600 mb-6">Be notified when The Grove enters public beta. Early participants help shape the network.</p>
                   <div className="flex">
                      <input type="email" placeholder="email@address.com" className="bg-gray-50 border border-gray-200 px-3 py-2 text-sm rounded-l focus:outline-none focus:border-grove-forest w-full" />
                      <button className="bg-grove-forest text-grove-cream px-4 py-2 text-xs font-mono uppercase rounded-r hover:bg-grove-accent">Join</button>
                   </div>
                </div>

                {/* Path 4: Updates */}
                <div className="bg-white p-8 rounded-xl border border-grove-forest/10 hover:shadow-lg transition-shadow">
                   <div className="text-3xl mb-4">📡</div>
                   <h3 className="font-display font-bold text-xl text-grove-forest mb-2">Follow Development</h3>
                   <p className="font-serif text-sm text-gray-600 mb-6">Updates on progress, technical decisions, and lessons learned. No spam.</p>
                   <button className="px-4 py-2 border border-grove-forest/20 text-grove-forest text-xs font-mono uppercase tracking-wider hover:bg-gray-50 rounded w-full">
                     Subscribe to Newsletter
                   </button>
                </div>
             </div>

             {/* Footer */}
             <div className="border-t border-grove-forest/10 pt-12 text-center">
               <p className="font-mono text-xs text-gray-400 mb-2">The Grove Research Preview v2.1</p>
               <p className="font-serif text-sm text-grove-forest/60">© 2025 The Grove Foundation</p>
               <p className="font-serif text-sm text-grove-forest/40 mt-1 italic">Jim Calhoun, Independent Researcher</p>
             </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default App;