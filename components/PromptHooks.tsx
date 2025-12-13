import React, { useState, useEffect } from 'react';
import { SectionId } from '../types';
import { SECTION_HOOKS } from '../constants';

interface PromptHooksProps {
  sectionId: SectionId;
  onHookClick: (data: { display: string; query: string }) => void;
  className?: string;
  variant?: 'light' | 'dark';
}

const PromptHooks: React.FC<PromptHooksProps> = ({ sectionId, onHookClick, className = '', variant = 'dark' }) => {
  const hooks = SECTION_HOOKS[sectionId];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!hooks || hooks.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % hooks.length);
    }, 6000); // Rotate every 6 seconds
    return () => clearInterval(interval);
  }, [hooks]);

  if (!hooks || hooks.length === 0) return null;

  const currentHook = hooks[activeIndex];
  
  const textColor = variant === 'light' ? 'text-white/80 hover:text-white' : 'text-ink/60 hover:text-grove-forest';
  const borderColor = variant === 'light' ? 'border-white/20 hover:border-white/40' : 'border-ink/10 hover:border-grove-forest/30';
  const iconColor = variant === 'light' ? 'text-grove-clay' : 'text-grove-clay';
  const dividerColor = variant === 'light' ? 'bg-white/20' : 'bg-ink/10';

  return (
    <div className={`flex justify-center ${className}`}>
      <button 
        onClick={() => onHookClick({ display: currentHook.text, query: currentHook.prompt })}
        className={`group relative flex items-center space-x-3 px-5 py-2.5 rounded-full border ${borderColor} bg-transparent transition-all duration-500`}
      >
        <span className={`text-[10px] font-mono uppercase tracking-widest ${iconColor}`}>
           Ask the Village
        </span>
        <span className={`w-px h-3 ${dividerColor}`}></span>
        <span className={`font-serif text-sm italic ${textColor} transition-colors text-left`}>
           {currentHook.text}
        </span>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] ml-2 text-grove-forest">
          →
        </span>
      </button>
    </div>
  );
};

export default PromptHooks;