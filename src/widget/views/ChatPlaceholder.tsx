// src/widget/views/ChatPlaceholder.tsx
// Chat mode placeholder with coming soon messaging

import { useState } from 'react';

export function ChatPlaceholder() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      // TODO: Integrate with email capture backend
      console.log('Email submitted:', email);
      setSubmitted(true);
    }
  };

  return (
    <div className="chat-placeholder flex flex-col items-center justify-center h-full text-center p-8">
      <div className="max-w-lg">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-2xl font-semibold text-[var(--grove-text)] mb-2">
          Chat Mode
        </h2>
        <p className="text-[var(--grove-accent)] font-medium mb-4">
          Coming in Grove 1.0
        </p>

        <p className="text-[var(--grove-text-muted)] mb-6">
          Your AI assistant that runs on your machine.
        </p>

        <ul className="text-left text-[var(--grove-text-muted)] mb-8 space-y-2">
          <li className="flex items-center gap-2">
            <span className="text-[var(--grove-accent)]">•</span>
            Rewrite emails in your voice
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--grove-accent)]">•</span>
            Brainstorm without sending data to the cloud
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--grove-accent)]">•</span>
            Manage your calendar with natural language
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--grove-accent)]">•</span>
            Search your local files intelligently
          </li>
        </ul>

        <p className="text-[var(--grove-text-dim)] text-sm mb-6">
          Local-first. Cloud-capable. Yours.
        </p>

        {submitted ? (
          <div className="p-4 rounded-lg bg-[var(--grove-accent-muted)] text-[var(--grove-accent)]">
            Thanks! We'll notify you when Chat is available.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-2 rounded-lg bg-[var(--grove-surface)] border border-[var(--grove-border)] text-[var(--grove-text)] placeholder-[var(--grove-text-dim)] focus:border-[var(--grove-accent)] outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[var(--grove-accent)] text-[var(--grove-bg)] font-medium hover:opacity-90 transition-opacity"
            >
              Notify Me
            </button>
          </form>
        )}

        <p className="mt-6 text-[var(--grove-text-dim)] text-sm">
          For now, try <span className="text-[var(--grove-accent)]">/explore</span> to discover Grove's ideas.
        </p>
      </div>
    </div>
  );
}
