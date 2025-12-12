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
        <div className="bg-grove-forest text-grove-cream p-8 rounded-lg shadow-lg border border-grove-forest/20">
          <div className="text-xs font-mono uppercase tracking-widest opacity-50 mb-4">Local Compute</div>
          <h3 className="font-display font-bold text-2xl mb-2">The Constant Hum</h3>
          <ul className="space-y-2 font-serif text-sm opacity-80">
            <li className="flex items-center"><span className="mr-2">✓</span>Runs on your hardware</li>
            <li className="flex items-center"><span className="mr-2">✓</span>Free, always available</li>
            <li className="flex items-center"><span className="mr-2">✓</span>Voice, memory, planning</li>
            <li className="flex items-center"><span className="mr-2">✓</span>"The village stays alive"</li>
          </ul>
        </div>

        <div className="bg-white text-grove-forest p-8 rounded-lg shadow-lg border border-grove-forest/10">
          <div className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Cloud API</div>
          <h3 className="font-display font-bold text-2xl mb-2">Breakthrough Moments</h3>
          <ul className="space-y-2 font-serif text-sm text-gray-600">
            <li className="flex items-center"><span className="mr-2 text-terminal-highlight">⚡</span>Routes to frontier capability</li>
            <li className="flex items-center"><span className="mr-2 text-terminal-highlight">⚡</span>Costs credits, earns insight</li>
            <li className="flex items-center"><span className="mr-2 text-terminal-highlight">⚡</span>Synthesis, strategy, discovery</li>
            <li className="flex items-center"><span className="mr-2 text-terminal-highlight">⚡</span>"The village gets smarter"</li>
          </ul>
        </div>
      </div>

      {/* TIMELINE VISUALIZATION */}
      <div className="bg-grove-cream/50 p-8 rounded-xl border border-grove-forest/5">
        <h4 className="font-mono text-sm text-gray-500 uppercase tracking-widest mb-8 text-center">Day-in-the-Life Routing</h4>
        
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gradient-to-b from-grove-forest/10 via-grove-forest/30 to-grove-forest/10 md:left-1/2 md:-ml-px"></div>

          <div className="space-y-8">
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
                  <div className={`ml-16 md:ml-0 md:w-[45%] ${isLeft ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8 md:order-last'}`}>
                    <div className={`transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}>
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider mb-1 
                        ${item.type === 'Local' ? 'bg-grove-forest/10 text-grove-forest' : 
                          item.type === 'Cloud' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                        {item.type}
                      </span>
                      <h5 className="font-bold text-grove-forest text-lg">{item.event}</h5>
                      <p className="font-serif text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className={`absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-4 border-grove-cream flex items-center justify-center z-10 transition-colors duration-300
                    ${item.type === 'Local' ? 'bg-grove-forest' : item.type === 'Cloud' ? 'bg-blue-600' : 'bg-orange-500'}
                  `}>
                    <span className="text-xs text-white">{item.icon}</span>
                  </div>

                  {/* Time Label (Opposite Side) */}
                  <div className={`hidden md:block md:w-[45%] ${isLeft ? 'text-left pl-8 md:order-last' : 'text-right pr-8'}`}>
                    <span className="font-mono text-xs text-gray-400">{item.time}</span>
                  </div>
                  
                  {/* Mobile Time Label */}
                  <div className="absolute left-16 -top-5 md:hidden">
                     <span className="font-mono text-xs text-gray-400">{item.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
         <p className="font-serif italic text-gray-600 mb-6 max-w-2xl mx-auto">
           "The agent remembers the insight as their own. The infrastructure fades away."
         </p>
         <button 
           onClick={onArtifactRequest}
           className="text-xs font-mono text-grove-forest/60 hover:text-grove-forest underline decoration-dotted underline-offset-4"
         >
           Generate Technical Routing Spec
         </button>
      </div>

    </div>
  );
};

export default ArchitectureDiagram;