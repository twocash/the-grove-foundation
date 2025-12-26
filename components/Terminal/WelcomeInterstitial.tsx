// WelcomeInterstitial - First-open experience for new Terminal users
// Sprint: route-selection-flow-v1 - Simplified to copy + CTA

import React from 'react';
import { useNavigate } from 'react-router-dom';

const WELCOME_COPY = `Welcome to The Grove.

You're inside the Terminal — engaging with your own personal AI. In this demo, we explore complex ideas through conversation. Everything written about The Grove Foundation is indexed here.

Choose a lens to shape how we explore the subject matter in a way most relevant to you. Each lens emphasizes different aspects of this groundbreaking initiative.`;

const WelcomeInterstitial: React.FC = () => {
  const navigate = useNavigate();

  const handleChooseLens = () => {
    navigate('/lenses?returnTo=/terminal&ctaLabel=Start%20Exploring');
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      {/* Welcome Copy */}
      <div className="max-w-xl text-center space-y-4 mb-8">
        {WELCOME_COPY.split('\n\n').map((paragraph, i) => (
          <p
            key={i}
            className={`font-serif text-sm leading-relaxed ${
              i === 0
                ? 'text-[var(--glass-text-primary)] font-medium'
                : 'text-[var(--glass-text-muted)]'
            }`}
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* CTA to Lenses */}
      <button
        onClick={handleChooseLens}
        className="glass-select-button glass-select-button--solid px-8 py-3 text-sm"
      >
        Choose Your Lens
      </button>
    </div>
  );
};

export default WelcomeInterstitial;
