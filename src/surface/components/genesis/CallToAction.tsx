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
    <section className="min-h-screen bg-paper py-24 px-6 flex flex-col items-center justify-center relative">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-grain opacity-30 pointer-events-none" />

      <div className="max-w-3xl mx-auto text-center relative z-10">
        {/* Headline */}
        <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-grove-forest mb-8 tracking-tight">
          THE GROVE IS GROWING
        </h2>

        {/* Subhead */}
        <p className="font-serif text-xl md:text-2xl text-ink mb-12 max-w-xl mx-auto">
          Join the first Gardeners shaping the future of personal AI.
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-4 items-center mb-8">
          {/* Primary CTA */}
          <button
            onClick={handleReadWhitePaper}
            className="px-10 py-4 bg-grove-forest text-white font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-ink transition-colors shadow-lg hover:shadow-xl"
          >
            Read the White Paper
          </button>

          {/* Divider */}
          <span className="font-serif text-ink-muted my-2">— or —</span>

          {/* Secondary CTA */}
          <button
            onClick={handleExploreTerminal}
            className="px-10 py-4 border border-grove-forest text-grove-forest font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-grove-forest hover:text-white transition-colors"
          >
            Explore the Terminal
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-ink/10 pt-8 mt-16">
          <p className="font-mono text-xs text-ink-muted tracking-wider">
            The Grove Foundation · Research Preview v0.11
          </p>
          <p className="font-mono text-xs text-ink-muted/70 tracking-wider mt-2">
            © 2025 The Grove Foundation
          </p>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
