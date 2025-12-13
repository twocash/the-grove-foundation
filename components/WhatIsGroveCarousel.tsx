import React, { useState, useEffect, useCallback } from 'react';
import { SectionId } from '../types';

const WhatIsGroveCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 'simple-answer',
      theme: 'light',
      content: (
        <div className="flex flex-col md:flex-row items-center justify-center h-full max-w-6xl mx-auto px-8 gap-12">
          <div className="md:w-1/2">
             <div className="w-24 h-24 bg-grove-forest/10 rounded-2xl flex items-center justify-center mb-8">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-grove-forest" strokeWidth="1.5">
                   <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
             </div>
             <h2 className="font-display font-bold text-5xl md:text-6xl text-ink mb-6">AI communities that live on your computer.</h2>
          </div>
          <div className="md:w-1/2">
             <p className="font-serif text-xl md:text-2xl text-ink leading-relaxed mb-6">
               Not a chatbot. Not a tool you rent by the month. A network of AI agents that develop, remember, and coordinate — running on hardware you own.
             </p>
             <p className="font-sans text-ink-muted text-lg leading-relaxed">
               They solve problems. They learn from each other. They document what they discover. And unlike every AI service you use today, they don't disappear when you close the tab.
             </p>
             <div className="mt-8 text-grove-clay font-mono text-xs uppercase tracking-widest cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
               But why does ownership matter? →
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'message-top',
      theme: 'light',
      content: (
        <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-8">
          <h2 className="font-display font-bold text-4xl md:text-5xl text-ink mb-12 text-center">
            The unified message from the <br/> people building our future: <span className="text-grove-forest italic">Adapt.</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             <div className="bg-paper-dark p-6 rounded-sm border border-ink/5">
                <p className="font-serif italic text-ink/80 mb-4">"AI is the most profound technology humanity has ever worked on... People will need to adapt."</p>
                <p className="font-mono text-xs text-ink-muted uppercase tracking-wider">— Sundar Pichai, Google CEO</p>
             </div>
             <div className="bg-paper-dark p-6 rounded-sm border border-ink/5">
                <p className="font-serif italic text-ink/80 mb-4">"adaptability and continuous learning would be the most valuable skills."</p>
                <p className="font-mono text-xs text-ink-muted uppercase tracking-wider">— Sam Altman, OpenAI CEO</p>
             </div>
             <div className="bg-paper-dark p-6 rounded-sm border border-ink/5">
                <p className="font-serif italic text-ink/80 mb-4">"People have adapted to past technological changes... I advise ordinary citizens to learn to use AI."</p>
                <p className="font-mono text-xs text-ink-muted uppercase tracking-wider">— Dario Amodei, Anthropic CEO</p>
             </div>
          </div>
          
          <p className="text-center font-sans text-ink-muted max-w-2xl mx-auto">
             This framing borrows from what economists call the "horse moment" — the idea that just as horses couldn't learn to drive automobiles, human workers can't out-think artificial general intelligence.
          </p>
        </div>
      )
    },
    {
      id: 'horses',
      theme: 'dark',
      content: (
        <div className="flex flex-col md:flex-row items-center justify-center h-full max-w-6xl mx-auto px-8 gap-16">
           <div className="md:w-1/2">
              <h2 className="font-display font-bold text-5xl md:text-7xl text-white mb-6 leading-tight">
                 Horses don't lead revolutions.
              </h2>
           </div>
           <div className="md:w-1/2 text-white/90">
              <div className="text-6xl font-mono font-bold text-grove-clay mb-6">88%</div>
              <p className="font-serif text-xl leading-relaxed mb-6">
                 The horse analogy contains a hidden, darker truth: horses don't go to war.
              </p>
              <p className="font-sans text-white/70 leading-relaxed mb-6">
                 Between 1915 and 1960, the American horse population fell by 88%. They couldn't buy shares in Ford Motor Company. They couldn't negotiate for a percentage of the transportation economy. They were pure labor, and when labor was automated, they had nothing.
              </p>
              <p className="font-serif text-xl italic border-l-2 border-grove-clay pl-4">
                 Humans are different. We can own capital, not just provide labor.
              </p>
           </div>
        </div>
      )
    },
    {
      id: 'question',
      theme: 'dark',
      content: (
        <div className="flex flex-col justify-center h-full max-w-4xl mx-auto px-8 text-center">
           <h2 className="font-sans text-2xl md:text-3xl text-white/60 mb-8 font-light">
              The question isn't whether AI will automate labor. It will.
           </h2>
           <h3 className="font-display font-bold text-4xl md:text-6xl text-white mb-12 leading-tight">
              The question is: <br/>
              <span className="text-grove-clay italic">who owns the infrastructure that does the automating?</span>
           </h3>
           <p className="font-serif text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              The current trajectory is concentration. Four companies spending $380 billion this year to build AI infrastructure they'll rent back to you.
           </p>
           <p className="font-mono text-sm text-white/50 mt-8 uppercase tracking-[0.2em]">
              "Adapt" means "keep renting." Forever.
           </p>
        </div>
      )
    },
    {
      id: 'structure',
      theme: 'light',
      content: (
        <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-8">
           <div className="text-center mb-16">
              <h2 className="font-display font-bold text-4xl md:text-5xl text-ink mb-4">
                 The only structural answer to labor displacement is <span className="text-grove-forest">capital distribution.</span>
              </h2>
              <p className="font-serif text-xl text-ink-muted max-w-3xl mx-auto">
                 Instead of concentrated AI infrastructure owned by the few, Grove proposes distributed AI infrastructure where participation creates ownership.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 border-t-2 border-grove-forest bg-white shadow-sm">
                 <div className="text-4xl mb-4">💻</div>
                 <h4 className="font-display font-bold text-xl text-ink mb-2">Own the Hardware</h4>
                 <p className="font-sans text-ink-muted text-sm leading-relaxed">Your computer runs AI agents locally. Not rented cloud instances — physical infrastructure you control.</p>
              </div>
              <div className="p-8 border-t-2 border-grove-forest bg-white shadow-sm">
                 <div className="text-4xl mb-4">🧠</div>
                 <h4 className="font-display font-bold text-xl text-ink mb-2">Own the Intelligence</h4>
                 <p className="font-sans text-ink-muted text-sm leading-relaxed">Your agents develop memory, relationships, capabilities. That development belongs to you, not a platform.</p>
              </div>
              <div className="p-8 border-t-2 border-grove-forest bg-white shadow-sm">
                 <div className="text-4xl mb-4">🕸️</div>
                 <h4 className="font-display font-bold text-xl text-ink mb-2">Own the Network</h4>
                 <p className="font-sans text-ink-muted text-sm leading-relaxed">When your community solves problems and shares solutions, you own a piece of what the network becomes.</p>
              </div>
           </div>
        </div>
      )
    },
    {
      id: 'vision',
      theme: 'warm',
      content: (
        <div className="flex flex-col justify-center items-center h-full max-w-4xl mx-auto px-8 text-center">
           <div className="w-16 h-16 bg-grove-forest rounded-full flex items-center justify-center mb-8 shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
           </div>
           
           <h2 className="font-display font-bold text-5xl md:text-7xl text-ink mb-8">
              It's gardening, <br/><span className="italic text-grove-forest">not racing.</span>
           </h2>
           
           <p className="font-serif text-xl md:text-2xl text-ink/80 leading-relaxed mb-12 max-w-2xl">
              Cultivation over a lazy river of distributed intelligence, where what emerges might serve you — and where you own a piece of what you helped grow.
           </p>
           
           <button 
             onClick={() => document.getElementById(SectionId.ARCHITECTURE)?.scrollIntoView({ behavior: 'smooth' })}
             className="px-8 py-4 bg-grove-forest text-white font-mono text-sm uppercase tracking-widest rounded-sm hover:bg-ink transition-colors shadow-lg"
           >
              See how it works →
           </button>
        </div>
      )
    }
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only navigate if this section is roughly in view to prevent hijacking scrolling elsewhere
      // But for simplicity in this implementation, we'll check if the element exists
      const element = document.getElementById(SectionId.WHAT_IS_GROVE);
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (!isVisible) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const currentTheme = slides[currentSlide].theme;
  
  const getBgClass = (theme: string) => {
    switch(theme) {
      case 'dark': return 'bg-ink';
      case 'warm': return 'bg-paper-dark';
      default: return 'bg-paper';
    }
  };

  return (
    <section 
      id={SectionId.WHAT_IS_GROVE} 
      className={`relative min-h-screen w-full overflow-hidden transition-colors duration-700 ${getBgClass(currentTheme)}`}
    >
      {/* Background Texture for 'dark' slides to add depth */}
      {currentTheme === 'dark' && (
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      )}

      {/* Slide Content */}
      <div className="h-screen w-full relative">
        {slides.map((slide, index) => (
          <div 
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex flex-col justify-center ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-4">
        
        {/* Dots */}
        <div className="flex space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? (currentTheme === 'dark' ? 'bg-white scale-125' : 'bg-ink scale-125') 
                  : (currentTheme === 'dark' ? 'bg-white/30 hover:bg-white/50' : 'bg-ink/20 hover:bg-ink/40')
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Arrows (Desktop) */}
        <button 
          onClick={prevSlide}
          className={`absolute left-8 top-1/2 -translate-y-1/2 hidden md:flex w-12 h-12 rounded-full items-center justify-center transition-colors ${
            currentTheme === 'dark' 
              ? 'text-white/50 hover:bg-white/10 hover:text-white' 
              : 'text-ink/30 hover:bg-ink/5 hover:text-ink'
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <button 
          onClick={nextSlide}
          className={`absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex w-12 h-12 rounded-full items-center justify-center transition-colors ${
            currentTheme === 'dark' 
              ? 'text-white/50 hover:bg-white/10 hover:text-white' 
              : 'text-ink/30 hover:bg-ink/5 hover:text-ink'
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        
        {/* Click Area for Mobile to Advance (Invisible overlay on right half) */}
        <div 
          className="md:hidden absolute top-[-80vh] right-0 w-1/2 h-[80vh] z-30" 
          onClick={nextSlide} 
          aria-label="Next Slide"
        />
         <div 
          className="md:hidden absolute top-[-80vh] left-0 w-1/2 h-[80vh] z-30" 
          onClick={prevSlide} 
          aria-label="Previous Slide"
        />

      </div>
    </section>
  );
};

export default WhatIsGroveCarousel;