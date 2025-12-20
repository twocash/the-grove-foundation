import React, { useState } from 'react';

const TAX_BRACKETS = [
  { stage: 'Genesis', rate: '30-40%', desc: 'Starting rate for new communities.' },
  { stage: 'Growth', rate: '15-25%', desc: 'Demonstrate consistent efficiency gains.' },
  { stage: 'Maturity', rate: '5-10%', desc: 'Sustained low-waste operation.' },
  { stage: 'Steady State', rate: '3-5%', desc: 'Floor rate — infrastructure costs only.' }
];

const EconomicsSlider: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const getStageInfo = (val: number) => {
    if (val < 25) return { 
      label: 'Genesis', 
      tax: '35%', 
      foundationShare: 35,
      desc: 'New communities need heavy cloud access while local capabilities develop.' 
    };
    if (val < 50) return { 
      label: 'Growth', 
      tax: '20%', 
      foundationShare: 20,
      desc: 'As efficiency improves, the rate drops. You pay less as you develop.' 
    };
    if (val < 75) return { 
      label: 'Maturity', 
      tax: '8%', 
      foundationShare: 8,
      desc: 'Sustained low-waste operation means minimal contribution.' 
    };
    return { 
      label: 'Steady State', 
      tax: '4%', 
      foundationShare: 4,
      desc: 'Floor rate. The Foundation collects less because the network needs less.' 
    };
  };

  const { label, tax, foundationShare, desc } = getStageInfo(sliderValue);
  const [showCrypto, setShowCrypto] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-16">
      
      {/* VISUALIZATION 1: SHRINKING TAX SLIDER */}
      <div className="bg-white p-10 rounded-sm border border-ink/5 shadow-sm">
        <div className="flex justify-between items-center mb-8">
           <h3 className="font-display font-bold text-2xl text-ink">The Shrinking Tax</h3>
           <div className="text-right">
             <div className="text-3xl font-bold text-grove-clay font-display">{tax}</div>
             <div className="text-xs font-mono uppercase tracking-widest text-ink-muted">{label} Rate</div>
           </div>
        </div>

        {/* Visual Bar Representation */}
        <div className="h-16 w-full bg-paper rounded-sm flex overflow-hidden mb-6 relative border border-ink/5">
           {/* User Share */}
           <div className="h-full bg-grove-forest flex items-center justify-center text-white font-mono text-xs transition-all duration-300" style={{ width: `${100 - foundationShare}%` }}>
              Community Retained ({100 - foundationShare}%)
           </div>
           {/* Foundation Share */}
           <div className="h-full bg-grove-clay flex items-center justify-center text-white font-mono text-xs transition-all duration-300" style={{ width: `${foundationShare}%` }}>
              Tax
           </div>
        </div>

        <div className="relative">
          {!hasInteracted && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-mono text-grove-clay animate-pulse">
              ↔ Drag to explore
            </div>
          )}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => {
              setSliderValue(parseInt(e.target.value));
              if (!hasInteracted) setHasInteracted(true);
            }}
            className={`w-full h-2 bg-ink/10 rounded-lg appearance-none cursor-pointer accent-grove-clay transition-all ${
              !hasInteracted ? 'animate-pulse ring-2 ring-grove-clay/30 ring-offset-2' : ''
            }`}
          />
        </div>
        <div className="flex justify-between text-xs font-mono text-ink-muted mt-3">
          <span>GENESIS</span>
          <span>STEADY STATE</span>
        </div>

        <p className="mt-8 text-center font-serif italic text-ink/70">"{desc}"</p>
      </div>

      {/* VISUALIZATION 2: TAX BRACKET TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-paper-dark p-6 rounded-sm border border-ink/5">
           <h4 className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-4">Bracket Structure</h4>
           <div className="space-y-4">
             {TAX_BRACKETS.map((bracket, i) => (
               <div key={i} className="flex justify-between items-start border-b border-ink/5 pb-3 last:border-0 last:pb-0">
                 <div>
                   <div className="font-bold text-ink text-sm font-display">{bracket.stage}</div>
                   <div className="text-xs text-ink-muted font-serif">{bracket.desc}</div>
                 </div>
                 <div className="font-mono font-bold text-grove-clay text-sm">{bracket.rate}</div>
               </div>
             ))}
           </div>
         </div>

         {/* VISUALIZATION 3: THE THREE PATHS */}
         <div className="space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-4">Paths to Reduction</h4>
            
            <div className="flex items-start p-4 bg-white rounded-sm shadow-sm border border-ink/5 hover:border-grove-forest/20 transition-colors">
               <span className="text-xl mr-3 text-grove-forest">🧠</span>
               <div>
                 <h5 className="font-bold text-sm text-ink font-display">Agent Efficiency</h5>
                 <p className="text-xs text-ink-muted mt-1 font-serif">Agents accomplish more with local inference, reducing cloud calls.</p>
               </div>
            </div>
            
            <div className="flex items-start p-4 bg-white rounded-sm shadow-sm border border-ink/5 hover:border-grove-forest/20 transition-colors">
               <span className="text-xl mr-3 text-grove-forest">🌱</span>
               <div>
                 <h5 className="font-bold text-sm text-ink font-display">Gardener Upgrades</h5>
                 <p className="text-xs text-ink-muted mt-1 font-serif">Operators integrate improved models or optimize inference.</p>
               </div>
            </div>

            <div className="flex items-start p-4 bg-white rounded-sm shadow-sm border border-ink/5 hover:border-grove-forest/20 transition-colors">
               <span className="text-xl mr-3 text-grove-forest">🕸️</span>
               <div>
                 <h5 className="font-bold text-sm text-ink font-display">Knowledge Propagation</h5>
                 <p className="text-xs text-ink-muted mt-1 font-serif">Solutions spread through network, preventing redundant compute.</p>
               </div>
            </div>
         </div>
      </div>

      {/* SIDEBAR: WHY NOT CRYPTO */}
      <div className="text-center">
         <button 
           onClick={() => setShowCrypto(!showCrypto)}
           className="text-xs font-mono text-ink-muted hover:text-grove-forest underline decoration-dotted"
         >
           {showCrypto ? "Hide Note" : "Sidebar: Why not Crypto?"}
         </button>
         
         {showCrypto && (
           <div className="mt-4 p-6 bg-paper-dark rounded-sm text-xs text-ink font-serif leading-relaxed max-w-lg mx-auto animate-fadeIn border border-ink/5">
             <span className="font-bold text-grove-forest">Credits purchase compute, not speculation.</span> They don't appreciate. They don't depreciate. 
             They're bought with real money, spent on real inference. This isn't a token launch in search of a use case.
           </div>
         )}
      </div>

    </div>
  );
};

export default EconomicsSlider;