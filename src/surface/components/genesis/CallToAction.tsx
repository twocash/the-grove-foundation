// src/surface/components/genesis/CallToAction.tsx
// Screen 6: Call to Action - Convert interest to action
// DESIGN: Full viewport, centered, paper texture

import React from 'react';

interface CallToActionProps {
  onOpenTerminal?: () => void;
  onRequestAccess?: () => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  onOpenTerminal,
  onRequestAccess
}) => {
  const handleReadWhitePaper = () => {
    window.open('https://yummy-twig-79e.notion.site/The-Grove-A-World-Changing-Play-for-Distributed-Intelligence-2c7780a78eef80b6b4f7ceb3f3c94c73', '_blank');
  };

  const handleExploreTerminal = () => {
    if (onOpenTerminal) {
      onOpenTerminal();
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-paper relative">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-grain opacity-30 pointer-events-none" />

      {/* Content area - no scroll needed, fits in viewport */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Headline */}
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-grove-forest mb-6 tracking-tight">
            THE GROVE IS GROWING
          </h2>

          {/* Subhead */}
          <p className="font-serif text-lg md:text-xl text-ink mb-8 max-w-xl mx-auto">
            Join the first Gardeners shaping the future of personal AI.
          </p>

          {/* CTAs */}
          <div className="flex flex-col gap-3 items-center mb-6">
            {/* Primary CTA */}
            <button
              onClick={handleReadWhitePaper}
              className="px-8 py-3 bg-grove-forest text-white font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-ink transition-colors shadow-lg hover:shadow-xl"
            >
              Read the White Paper
            </button>

            {/* Divider */}
            <span className="font-serif text-ink-muted my-1">— or —</span>

            {/* Secondary CTA */}
            <button
              onClick={handleExploreTerminal}
              className="px-8 py-3 border border-grove-forest text-grove-forest font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-grove-forest hover:text-white transition-colors"
            >
              Explore the Terminal
            </button>
          </div>

          {/* Footer */}
          <div className="border-t border-ink/10 pt-6 mt-10">
            <p className="font-mono text-xs text-ink-muted tracking-wider">
              The Grove Foundation · Research Preview v0.11
            </p>
            <p className="font-mono text-xs text-ink-muted/70 tracking-wider mt-2">
              © 2025 The Grove Foundation
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
