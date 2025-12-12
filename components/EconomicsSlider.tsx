import React, { useState } from 'react';

const TAX_BRACKETS = [
  { stage: 'Genesis', rate: '30-40%', desc: 'Starting rate for new communities.' },
  { stage: 'Growth', rate: '15-25%', desc: 'Demonstrate consistent efficiency gains.' },
  { stage: 'Maturity', rate: '5-10%', desc: 'Sustained low-waste operation.' },
  { stage: 'Steady State', rate: '3-5%', desc: 'Floor rate — infrastructure costs only.' }
];

const EconomicsSlider: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(0); // 0 to 100

  // Interpolate values based on slider position (0 = Genesis, 100 = Steady State)
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
      <div className="bg-white p-8 rounded-xl border border-grove-forest/10 shadow-sm">
        <div className="flex justify-between items-center mb-8">
           <h3 className="font-display font-bold text-2xl text-grove-forest">The Shrinking Tax</h3>
           <div className="text-right">
             <div className="text-3xl font-bold text-terminal-highlight">{tax}</div>
             <div className="text-xs font-mono uppercase tracking-widest text-gray-500">{label} Rate</div>
           </div>
        </div>

        {/* Visual Bar Representation */}
        <div className="h-16 w-full bg-grove-forest/5 rounded-lg flex overflow-hidden mb-6 relative">
           {/* User Share */}
           <div className="h-full bg-grove-forest flex items-center justify-center text-grove-cream font-mono text-xs transition-all duration-300" style={{ width: `${100 - foundationShare}%` }}>
              Community Retained ({100 - foundationShare}%)
           </div>
           {/* Foundation Share */}
           <div className="h-full bg-orange-500/80 flex items-center justify-center text-white font-mono text-xs transition-all duration-300" style={{ width: `${foundationShare}%` }}>
              Tax
           </div>
        </div>

        <input 
          type="range" 
          min="0" 
          max="100" 
          value={sliderValue} 
          onChange={(e) => setSliderValue(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-terminal-highlight"
        />
        <div className="flex justify-between text-xs font-mono text-gray-400 mt-2">
          <span>GENESIS</span>
          <span>STEADY STATE</span>
        </div>

        <p className="mt-6 text-center font-serif italic text-gray-600">"{desc}"</p>
      </div>

      {/* VISUALIZATION 2: TAX BRACKET TABLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-grove-cream/50 p-6 rounded border border-grove-forest/5">
           <h4 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-4">Bracket Structure</h4>
           <div className="space-y-4">
             {TAX_BRACKETS.map((bracket, i) => (
               <div key={i} className="flex justify-between items-start border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                 <div>
                   <div className="font-bold text-grove-forest text-sm">{bracket.stage}</div>
                   <div className="text-xs text-gray-500">{bracket.desc}</div>
                 </div>
                 <div className="font-mono font-bold text-terminal-highlight text-sm">{bracket.rate}</div>
               </div>
             ))}
           </div>
         </div>

         {/* VISUALIZATION 3: THE THREE PATHS */}
         <div className="space-y-4">
            <h4 className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-4">Paths to Reduction</h4>
            
            <div className="flex items-start p-3 bg-white rounded shadow-sm border border-grove-forest/5 hover:border-grove-forest/20 transition-colors">
               <span className="text-xl mr-3">🧠</span>
               <div>
                 <h5 className="font-bold text-sm text-grove-forest">Agent Efficiency</h5>
                 <p className="text-xs text-gray-600">Agents accomplish more with local inference, reducing cloud calls.</p>
               </div>
            </div>
            
            <div className="flex items-start p-3 bg-white rounded shadow-sm border border-grove-forest/5 hover:border-grove-forest/20 transition-colors">
               <span className="text-xl mr-3">🌱</span>
               <div>
                 <h5 className="font-bold text-sm text-grove-forest">Gardener Upgrades</h5>
                 <p className="text-xs text-gray-600">Operators integrate improved models or optimize inference.</p>
               </div>
            </div>

            <div className="flex items-start p-3 bg-white rounded shadow-sm border border-grove-forest/5 hover:border-grove-forest/20 transition-colors">
               <span className="text-xl mr-3">🕸️</span>
               <div>
                 <h5 className="font-bold text-sm text-grove-forest">Knowledge Propagation</h5>
                 <p className="text-xs text-gray-600">Solutions spread through network, preventing redundant compute.</p>
               </div>
            </div>
         </div>
      </div>

      {/* SIDEBAR: WHY NOT CRYPTO */}
      <div className="text-center">
         <button 
           onClick={() => setShowCrypto(!showCrypto)}
           className="text-xs font-mono text-gray-400 hover:text-grove-forest underline decoration-dotted"
         >
           {showCrypto ? "Hide Note" : "Sidebar: Why not Crypto?"}
         </button>
         
         {showCrypto && (
           <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-gray-600 font-serif leading-relaxed max-w-lg mx-auto animate-fadeIn">
             <span className="font-bold">Credits purchase compute, not speculation.</span> They don't appreciate. They don't depreciate. 
             They're bought with real money, spent on real inference. This isn't a token launch in search of a use case.
           </div>
         )}
      </div>

    </div>
  );
};

export default EconomicsSlider;