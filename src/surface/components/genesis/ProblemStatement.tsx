// src/surface/components/genesis/ProblemStatement.tsx
// Screen 2: The Problem - CEO quotes establishing stakes
// DESIGN: Paper card aesthetic, organic feel - NOT futuristic
// v0.12e: Added quotes prop interface for Chameleon (v0.13)

import React, { useEffect, useRef, useState } from 'react';
import { ActiveTree } from './ActiveTree';

// Quote interface (export for reuse in Chameleon)
export interface Quote {
  text: string;
  author: string;
  title: string;
}

// Default quotes (preserves current behavior)
const DEFAULT_QUOTES: Quote[] = [
  {
    text: "AI is the most profound technology humanity has ever worked on... People will need to adapt.",
    author: "SUNDAR PICHAI",
    title: "GOOGLE CEO"
  },
  {
    text: "This is the new version of [learning to code]... adaptability and continuous learning would be the most valuable skills.",
    author: "SAM ALTMAN",
    title: "OPENAI CEO"
  },
  {
    text: "People have adapted to past technological changes... I advise ordinary citizens to learn to use AI.",
    author: "DARIO AMODEI",
    title: "ANTHROPIC CEO"
  }
];

// Default tension text (v0.13)
const DEFAULT_TENSION = [
  "They're building the future of intelligence.",
  "And they're telling you to get comfortable being a guest in it."
];

interface ProblemStatementProps {
  className?: string;
  quotes?: Quote[];  // Optional - enables Chameleon in v0.13
  tension?: string[];  // v0.13: Dynamic tension text
  trigger?: any;  // v0.13: Triggers animation restart on lens change
  onScrollNext?: () => void;  // v0.15: Section-aware scroll
  variant?: 'full' | 'compressed';  // v0.16: Active Grove - layout variant
}

export const ProblemStatement: React.FC<ProblemStatementProps> = ({
  className = '',
  quotes = DEFAULT_QUOTES,
  tension = DEFAULT_TENSION,
  trigger,
  onScrollNext,
  variant = 'full'
}) => {
  // v0.16: Active Grove - variant support (full carousel implementation in Epic 4)
  const isCompressed = variant === 'compressed';
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [showTension, setShowTension] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tensionRef = useRef<HTMLDivElement>(null);

  // Auto-carousel state (Sprint: active-grove-v1 Fix #5)
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-advance carousel every 2.5 seconds
  useEffect(() => {
    if (!isCompressed) return;

    const interval = setInterval(() => {
      setActiveQuoteIndex(prev => (prev + 1) % quotes.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isCompressed, quotes.length]);

  // Scroll to active quote - HORIZONTAL ONLY (Fix #9)
  // Using scrollTo instead of scrollIntoView to prevent page jumps
  useEffect(() => {
    if (!isCompressed || !carouselRef.current) return;

    const container = carouselRef.current;
    const cards = container.children;
    const activeCard = cards[activeQuoteIndex] as HTMLElement;

    if (activeCard) {
      // Calculate horizontal scroll position to center the card
      const containerWidth = container.offsetWidth;
      const cardLeft = activeCard.offsetLeft;
      const cardWidth = activeCard.offsetWidth;
      const scrollTarget = cardLeft - (containerWidth / 2) + (cardWidth / 2);

      // Horizontal scroll only - prevents page jumps
      container.scrollTo({
        left: scrollTarget,
        behavior: 'smooth'
      });
    }
  }, [activeQuoteIndex, isCompressed]);

  // Reset and re-animate on content/trigger change
  // Skip observers in compressed mode - they're for full-page staggered reveal only
  useEffect(() => {
    // In compressed mode, show all content immediately (carousel handles visibility)
    if (isCompressed) {
      setVisibleCards(new Set(quotes.map((_, i) => i)));
      setShowTension(true);
      return;
    }

    setVisibleCards(new Set());  // Reset card visibility
    setShowTension(false);  // Reset tension visibility

    const observers: IntersectionObserver[] = [];

    // Reset refs array to match current quotes length
    cardRefs.current = cardRefs.current.slice(0, quotes.length);

    cardRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Staggered animation delay
              setTimeout(() => {
                setVisibleCards(prev => new Set([...prev, index]));
              }, index * 150);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(ref);
      observers.push(observer);
    });

    // Tension statement observer
    if (tensionRef.current) {
      const tensionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setShowTension(true);
              tensionObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      tensionObserver.observe(tensionRef.current);
      observers.push(tensionObserver);
    }

    return () => observers.forEach(obs => obs.disconnect());
  }, [quotes, trigger, isCompressed]); // Add isCompressed to dependencies

  return (
    <section className={`${isCompressed ? '' : 'min-h-screen'} bg-paper py-12 px-6 ${className}`}>
      <div className={`${isCompressed ? 'max-w-full' : 'max-w-4xl'} mx-auto`}>
        {/* Quote Cards - Full variant: stacked, Compressed variant: carousel */}
        {isCompressed ? (
          /* Compressed Carousel Layout - Light theme (Sprint: active-grove-v1 Fix #9) */
          <div className="mb-12 relative">
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            >
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className={`flex-shrink-0 w-[280px] bg-paper-dark border border-ink/10 p-5 rounded-lg shadow-sm snap-center transition-all duration-500 ${
                    index === activeQuoteIndex
                      ? 'opacity-100 scale-100 shadow-md'
                      : 'opacity-70 scale-[0.98]'
                  }`}
                >
                  <blockquote className="font-serif text-sm text-ink leading-relaxed mb-3">
                    "{quote.text}"
                  </blockquote>
                  <footer className="font-mono text-xs text-ink-muted font-medium tracking-wide">
                    — {quote.author}
                  </footer>
                </div>
              ))}
            </div>
            {/* Carousel Indicators - Clickable */}
            <div className="flex justify-center gap-2 mt-3">
              {quotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveQuoteIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeQuoteIndex
                      ? 'bg-grove-forest scale-125'
                      : 'bg-ink/30 hover:bg-ink/50'
                  }`}
                  aria-label={`Go to quote ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Full Layout - Original stacked cards */
          <div className="grid gap-6 md:gap-8 mb-16">
            {quotes.map((quote, index) => (
              <div
                key={index}
                ref={el => { cardRefs.current[index] = el; }}
                className={`bg-paper-dark border border-ink/5 p-6 md:p-8 rounded-sm shadow-sm hover:shadow-md transition-all duration-700 ${
                  visibleCards.has(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <blockquote className="font-serif text-lg md:text-xl text-ink leading-relaxed mb-4">
                  "{quote.text}"
                </blockquote>
                <footer className="font-mono text-xs tracking-wider text-ink-muted">
                  — {quote.author}, <span className="text-ink-muted/70">{quote.title}</span>
                </footer>
              </div>
            ))}
          </div>
        )}

        {/* Tension Statement - NOW DYNAMIC */}
        <div
          ref={tensionRef}
          className={`text-center max-w-2xl mx-auto transition-all duration-1000 ${
            showTension ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {tension.map((line, index) => (
            <p
              key={index}
              className={`font-serif ${isCompressed ? 'text-lg' : 'text-xl md:text-2xl'} text-ink leading-relaxed ${
                index === tension.length - 1 ? (isCompressed ? 'mb-4' : 'mb-8') : (isCompressed ? 'mb-2' : 'mb-4')
              }`}
            >
              {line}
            </p>
          ))}

          {/* The hook question - stays static */}
          <p className={`font-serif ${isCompressed ? 'text-xl' : 'text-2xl md:text-3xl'} text-grove-clay font-semibold`}>
            What if there was another way?
          </p>

          {/* Active Tree - always directional after content is visible */}
          <div className={`${isCompressed ? 'mt-6' : 'mt-12'} flex justify-center`}>
            <ActiveTree
              mode="directional"
              onClick={onScrollNext || (() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' }))}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemStatement;
