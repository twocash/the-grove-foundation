import React, { useState } from 'react';

const TIMELINE_EVENTS = [
  { time: '7:00 AM', event: 'Morning Briefing', type: 'Local', desc: 'Instant — no API call, no loading.', icon: '☀️' },
  { time: '9:15 AM', event: 'Research Initiated', type: 'Hybrid', desc: 'Agents coordinate in background.', icon: '🔍' },
  { time: '11:30 AM', event: 'Complex Analysis', type: 'Cloud', desc: 'Work visible in diary entries.', icon: '⚡' },
  { time: '2:00 PM', event: 'Follow-up Qs', type: 'Local', desc: 'Agents reference morning context.', icon: '💭' },
  { time: '4:45 PM', event: 'Synthesis', type: 'Hybrid', desc: 'Breakthrough insight injected.', icon: '🧬' },
  { time: '6:00 PM', event: 'Consolidation', type: 'Local', desc: 'Memory updated for tomorrow.', icon: '🌙' }
];

const ArchitectureDiagram: React.FC<{ onArtifactRequest: () => void }> = ({ onArtifactRequest }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  return (
    <div className="w-full max-w-4xl mx-auto">
      
      {/* TWO COLUMN CONCEPT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white p-8 rounded-sm shadow-sm border border-ink/5 hover:shadow-md transition-shadow">
          <div className="text-xs font-mono uppercase tracking-widest text-grove-clay mb-4">Local Compute</div>
          <h3 className="font-display font-bold text-2xl text-ink mb-2">The Constant Hum</h3>
          <ul className="space-y-3 font-serif text-sm text-ink/70 mt-4">
            <li className="flex items-center"><span className="mr-3 text-grove-forest">✓</span>Runs on your hardware</li>
            <li className="flex items-center"><span className="mr-3 text-grove-forest">✓</span>Free, always available</li>
            <li className="flex items-center"><span className="mr-3 text-grove-forest">✓</span>Voice, memory, planning</li>
            <li className="flex items-center"><span className="mr-3 text-grove-forest">✓</span>"The village stays alive"</li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-sm shadow-sm border border-ink/5 hover:shadow-md transition-shadow">
          <div className="text-xs font-mono uppercase tracking-widest text-grove-forest mb-4">Cloud API</div>
          <h3 className="font-display font-bold text-2xl text-ink mb-2">Breakthrough Moments</h3>
          <ul className="space-y-3 font-serif text-sm text-ink/70 mt-4">
            <li className="flex items-center"><span className="mr-3 text-grove-clay">⚡</span>Routes to frontier capability</li>
            <li className="flex items-center"><span className="mr-3 text-grove-clay">⚡</span>Costs credits, earns insight</li>
            <li className="flex items-center"><span className="mr-3 text-grove-clay">⚡</span>Synthesis, strategy, discovery</li>
            <li className="flex items-center"><span className="mr-3 text-grove-clay">⚡</span>"The village gets smarter"</li>
          </ul>
        </div>
      </div>

      {/* TIMELINE VISUALIZATION */}
      <div className="bg-paper-dark p-8 rounded-sm border border-ink/5 relative overflow-hidden">
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')]"></div>
        
        <h4 className="font-mono text-xs text-ink-muted uppercase tracking-widest mb-12 text-center relative z-10">Day-in-the-Life Routing</h4>
        
        <div className="relative z-10">
          {/* Vertical Line */}
          <div className="absolute left-8 top-4 bottom-4 w-px bg-ink/10 md:left-1/2 md:-ml-px"></div>

          <div className="space-y-10">
            {TIMELINE_EVENTS.map((item, index) => {
              const isLeft = index % 2 === 0;
              const isHovered = activeStep === index;
              
              return (
                <div 
                  key={index}
                  className={`relative flex items-center md:justify-between ${isLeft ? 'flex-row' : 'flex-row-reverse md:flex-row'}`}
                  onMouseEnter={() => setActiveStep(index)}
                  onMouseLeave={() => setActiveStep(null)}
                >
                  {/* Content Box */}
                  <div className={`ml-16 md:ml-0 md:w-[45%] ${isLeft ? 'md:text-right md:pr-10' : 'md:text-left md:pl-10 md:order-last'}`}>
                    <div className={`transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest mb-2 border 
                        ${item.type === 'Local' ? 'border-grove-forest/30 text-grove-forest bg-white' : 
                          item.type === 'Cloud' ? 'border-grove-clay/30 text-grove-clay bg-white' : 'border-ink/20 text-ink bg-white'}`}>
                        {item.type}
                      </span>
                      <h5 className="font-bold text-ink text-lg font-display mb-1">{item.event}</h5>
                      <p className="font-serif text-sm text-ink-muted leading-relaxed">{item.desc}</p>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className={`absolute left-8 md:left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-paper-dark flex items-center justify-center z-10 transition-all duration-300 shadow-sm
                    ${item.type === 'Local' ? 'bg-grove-forest' : item.type === 'Cloud' ? 'bg-grove-clay' : 'bg-ink'}
                    ${isHovered ? 'scale-125' : 'scale-100'}
                  `}>
                  </div>

                  {/* Time Label */}
                  <div className={`hidden md:block md:w-[45%] ${isLeft ? 'text-left pl-10 md:order-last' : 'text-right pr-10'}`}>
                    <span className="font-mono text-xs text-ink-muted">{item.time}</span>
                  </div>
                  
                  {/* Mobile Time Label */}
                  <div className="absolute left-16 -top-6 md:hidden">
                     <span className="font-mono text-xs text-ink-muted">{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
         <p className="font-serif italic text-ink/60 mb-6 max-w-2xl mx-auto">
           "The agent remembers the insight as their own. The infrastructure fades away."
         </p>
         <button 
           onClick={onArtifactRequest}
           className="text-xs font-mono text-ink-muted hover:text-grove-forest underline decoration-dotted underline-offset-4"
         >
           Generate Technical Routing Spec
         </button>
      </div>

    </div>
  );
};

export default ArchitectureDiagram;