import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Label } from 'recharts';

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
      <div className="bg-white border border-ink/10 p-4 shadow-xl rounded-sm font-sans text-xs text-ink">
        <p className="font-bold border-b border-ink/5 pb-2 mb-2 font-display text-base">{label}</p>
        <p className="text-grove-forest font-bold mb-1">Frontier: {fData.labelF} tasks</p>
        <p className="text-grove-clay font-bold mb-1">Local: {fData.labelL} tasks</p>
        <p className="text-ink-muted mt-2 italic border-t border-ink/5 pt-2">Gap: ~8x Constant</p>
      </div>
    );
  }
  return null;
};

const ThesisGraph: React.FC = () => {
  return (
    <div className="w-full bg-white border border-ink/5 p-8 rounded-sm shadow-sm relative overflow-hidden">
      {/* Background texture line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-grove-forest/10"></div>

      <div className="flex justify-between items-end mb-8">
        <div>
           <h3 className="font-display font-bold text-ink text-2xl">The Ratchet Pattern</h3>
           <p className="font-serif text-sm text-ink-muted italic mt-1">Projected Task Complexity Capability (Log Scale)</p>
        </div>
        <div className="hidden md:block text-right">
           <div className="text-3xl font-display font-bold text-grove-forest">8x</div>
           <div className="text-xs font-mono uppercase tracking-widest text-ink-muted">Constant Gap</div>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke="#1C1C1C" 
              fontFamily="JetBrains Mono" 
              fontSize={12} 
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              scale="log" 
              domain={['dataMin', 'dataMax']} 
              hide 
            />
            <Tooltip content={<CustomTooltip />} cursor={{stroke: '#E5E5E0', strokeWidth: 1}} />
            <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: '12px', paddingTop: '20px' }} />
            
            <ReferenceLine y={60} stroke="#E5E5E0" strokeDasharray="3 3">
              <Label value="Routine Cognition Threshold" position="insideBottomRight" className="text-xs font-sans text-ink-muted" fill="#8C8C8C" />
            </ReferenceLine>

            <Line 
              type="monotone" 
              dataKey="frontier" 
              name="Frontier (Cloud)" 
              stroke="#2F5C3B" 
              strokeWidth={2} 
              dot={{ r: 4, fill: '#2F5C3B', strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }} 
              animationDuration={2000}
            />
            <Line 
              type="monotone" 
              dataKey="local" 
              name="Local (Grove Node)" 
              stroke="#D95D39" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#D95D39', strokeWidth: 0 }} 
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              strokeDasharray="5 5"
              animationDuration={2000}
              animationBegin={500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ThesisGraph;