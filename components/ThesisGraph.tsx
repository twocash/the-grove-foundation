import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Label } from 'recharts';

// Data from PRD:
// 2024: Frontier ~1hr (60m), Local ~8m
// 2025: Frontier ~4hr (240m), Local ~30m
// 2026: Frontier ~15hr (900m), Local ~2hr (120m)
// 2027: Frontier ~60hr (3600m), Local ~8hr (480m)
const data = [
  { year: '2024', frontier: 60, local: 8, labelF: '1hr', labelL: '8m' },
  { year: '2025', frontier: 240, local: 30, labelF: '4hr', labelL: '30m' },
  { year: '2026', frontier: 900, local: 120, labelF: '15hr', labelL: '2hr' },
  { year: '2027', frontier: 3600, local: 480, labelF: '60hr', labelL: '8hr' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fData = payload[0].payload;
    return (
      <div className="bg-terminal-bg border border-terminal-phosphor p-3 shadow-xl rounded font-mono text-xs text-grove-cream">
        <p className="font-bold border-b border-gray-700 pb-1 mb-1">{label}</p>
        <p className="text-terminal-phosphor">Frontier: {fData.labelF} tasks</p>
        <p className="text-grove-cream/80">Local: {fData.labelL} tasks</p>
        <p className="text-gray-500 mt-1 italic">Gap: ~8x Constant</p>
      </div>
    );
  }
  return null;
};

const ThesisGraph: React.FC = () => {
  return (
    <div className="w-full bg-white border border-grove-forest/10 p-6 md:p-8 rounded-lg shadow-sm">
      <div className="flex justify-between items-end mb-6">
        <div>
           <h3 className="font-display font-bold text-grove-forest text-xl md:text-2xl">The Ratchet Pattern</h3>
           <p className="font-serif text-sm text-gray-500 italic">Projected Task Complexity Capability (Log Scale)</p>
        </div>
        <div className="hidden md:block text-right">
           <div className="text-3xl font-display font-bold text-terminal-highlight">8x</div>
           <div className="text-xs font-mono uppercase tracking-widest text-gray-500">Constant Gap</div>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="year" 
              stroke="#1A332A" 
              fontFamily="JetBrains Mono" 
              fontSize={12} 
              tickMargin={10}
            />
            <YAxis 
              scale="log" 
              domain={['dataMin', 'dataMax']} 
              hide 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '12px', paddingTop: '20px' }} />
            
            {/* Threshold Lines */}
            <ReferenceLine y={60} stroke="#e5e7eb" strokeDasharray="3 3">
              <Label value="Routine Cognition" position="insideBottomRight" className="text-xs font-mono text-gray-400" />
            </ReferenceLine>

            <Line 
              type="monotone" 
              dataKey="frontier" 
              name="Frontier (Cloud)" 
              stroke="#1A332A" 
              strokeWidth={3} 
              dot={{ r: 6, fill: '#1A332A' }}
              activeDot={{ r: 8 }} 
              animationDuration={2000}
            />
            <Line 
              type="monotone" 
              dataKey="local" 
              name="Local (Grove Node)" 
              stroke="#FF5F15" 
              strokeWidth={3}
              dot={{ r: 6, fill: '#FF5F15' }} 
              strokeDasharray="0"
              animationDuration={2000}
              animationBegin={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
        <div>
           <div className="text-xs font-mono text-gray-500 uppercase">Doubling Time</div>
           <div className="font-bold text-grove-forest">7 Months</div>
        </div>
        <div>
           <div className="text-xs font-mono text-gray-500 uppercase">Local Lag</div>
           <div className="font-bold text-grove-forest">~21 Months</div>
        </div>
        <div>
           <div className="text-xs font-mono text-gray-500 uppercase">Gap Ratio</div>
           <div className="font-bold text-grove-forest">8x Constant</div>
        </div>
        <div>
           <div className="text-xs font-mono text-gray-500 uppercase">Trend Conf.</div>
           <div className="font-bold text-grove-forest">R² > 0.95</div>
        </div>
      </div>
    </div>
  );
};

export default ThesisGraph;