import React, { useState } from 'react';

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-grove-cream/90 backdrop-blur-md border-b border-grove-forest/10 py-3 px-6 flex justify-between items-center shadow-sm">
      <div className="flex items-center space-x-4">
        <button 
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-grove-forest text-grove-cream flex items-center justify-center hover:bg-grove-accent transition-colors"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          )}
        </button>
        <div className="flex flex-col">
           <span className="text-xs font-mono uppercase text-gray-500 tracking-wider">Deep Dive Briefing</span>
           <span className="font-display font-bold text-grove-forest text-sm">The Grove: Official Audio Summary</span>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-2">
         {/* Fake waveform */}
         {[...Array(10)].map((_, i) => (
             <div 
               key={i} 
               className={`w-1 bg-grove-forest/20 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
               style={{ 
                 height: isPlaying ? `${Math.random() * 24 + 8}px` : '4px',
                 animationDelay: `${i * 0.1}s`
               }}
             ></div>
         ))}
      </div>
    </div>
  );
};

export default AudioPlayer;