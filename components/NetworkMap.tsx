import React from 'react';

const NetworkMap: React.FC = () => {
  return (
    <div className="relative w-full h-[400px] bg-grove-dark rounded-xl overflow-hidden border border-grove-forest/20 shadow-inner">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-grove-forest via-grove-dark to-black"></div>
      
      {/* Abstract Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(26,51,42,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(26,51,42,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Nodes */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => {
           const top = Math.random() * 80 + 10;
           const left = Math.random() * 80 + 10;
           const delay = Math.random() * 2;
           return (
             <div 
               key={i} 
               className="absolute w-2 h-2 rounded-full bg-terminal-phosphor shadow-[0_0_10px_rgba(0,255,65,0.4)] animate-pulse"
               style={{ top: `${top}%`, left: `${left}%`, animationDelay: `${delay}s`, animationDuration: '3s' }}
             >
                {/* Connecting Lines (Fake) */}
                <div className="absolute top-1 left-1 w-24 h-[1px] bg-gradient-to-r from-terminal-phosphor/30 to-transparent origin-left rotate-[Math.random()*360]"></div>
             </div>
           )
        })}
        
        {/* Central Hub/Bright Spot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-terminal-phosphor/5 rounded-full blur-xl animate-pulse"></div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-mono text-terminal-phosphor/60 uppercase tracking-widest">
         <span>Network Activity: Active</span>
         <span>Nodes: 8,421</span>
         <span>Propagation: 94%</span>
      </div>
    </div>
  );
};

export default NetworkMap;