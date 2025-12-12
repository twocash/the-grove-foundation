import React from 'react';

const DiaryEntry: React.FC = () => {
  return (
    <div className="bg-[#F9F8F4] p-6 md:p-8 rounded-lg shadow-md border border-gray-200 max-w-xl mx-auto transform rotate-1 hover:rotate-0 transition-transform duration-500 font-serif relative">
      {/* Paper texture feel via simple border/shadow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-grove-forest/10"></div>
      
      <div className="flex justify-between items-center mb-6 border-b border-gray-300 pb-2">
         <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">Elena's Diary</span>
         <span className="font-mono text-xs text-gray-500">Day 47 • Thornwood Village</span>
      </div>

      <div className="space-y-4 text-gray-800 leading-relaxed">
        <p>
          The water readings came back strange again. Third time this week. Marcus thinks it's instrument error, but something feels off. I've been mapping the pattern — always the same time of day, always after the eastern wells cycle.
        </p>
        <p>
          Asked the Observer if they've seen this before. No response, of course. But I wonder if other villages have noticed. Tomorrow I'll propose we share the data with the network.
        </p>
        <p className="italic text-grove-forest/80">
          If I'm right about this, it changes how we think about the aquifer. If I'm wrong, I'll have wasted a week. Either way, I need to know.
        </p>
      </div>
    </div>
  );
};

export default DiaryEntry;