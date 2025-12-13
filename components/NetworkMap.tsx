import React from 'react';

const NetworkMap: React.FC = () => {
  return (
    <div className="relative w-full h-[400px] bg-white rounded-sm overflow-hidden border border-ink/10 shadow-inner">
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.05)]"></div>
      
      {/* Abstract Grid - Light Ink */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(28,28,28,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(28,28,28,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Nodes */}
      <div className="absolute inset-0">
        {[...Array(16)].map((_, i) => {
           const top = Math.random() * 80 + 10;
           const left = Math.random() * 80 + 10;
           const delay = Math.random() * 2;
           return (
             <div 
               key={i} 
               className="absolute w-2 h-2 rounded-full bg-grove-forest shadow-[0_0_0_4px_rgba(47,92,59,0.1)] animate-pulse"
               style={{ top: `${top}%`, left: `${left}%`, animationDelay: `${delay}s`, animationDuration: '4s' }}
             >
                {/* Connecting Lines */}
                <div className="absolute top-1 left-1 w-24 h-[1px] bg-gradient-to-r from-grove-forest/20 to-transparent origin-left rotate-[Math.random()*360]"></div>
             </div>
           )
        })}
        
        {/* Central Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-grove-forest/5 rounded-full blur-2xl"></div>
      </div>

      <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[10px] font-mono text-ink-muted uppercase tracking-widest border-t border-ink/5 pt-2">
         <span>Network Status: Online</span>
         <span>Nodes: 8,421</span>
         <span>Propagation: 94%</span>
      </div>
    </div>
  );
};

export default NetworkMap;