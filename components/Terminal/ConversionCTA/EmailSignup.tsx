// EmailSignup - Newsletter/updates signup form
// Simple email capture for ongoing engagement

import React, { useState } from 'react';

interface EmailSignupProps {
  onSubmit: () => void;
  onClose: () => void;
}

const EmailSignup: React.FC<EmailSignupProps> = ({ onSubmit, onClose }) => {
  const [email, setEmail] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const interestOptions = [
    { id: 'research', label: 'Research updates' },
    { id: 'technical', label: 'Technical deep-dives' },
    { id: 'governance', label: 'Governance developments' },
    { id: 'events', label: 'Events & webinars' },
    { id: 'launch', label: 'Launch announcements' }
  ];

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);

    setTimeout(() => {
      onSubmit();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-grove-forest/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-grove-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-lg text-ink mb-2">You're In</h3>
        <p className="font-serif text-sm text-ink-muted">
          We'll keep you updated on Grove developments that matter to you.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="font-display text-lg text-ink mb-2">Stay Connected</h3>
      <p className="font-serif text-sm text-ink-muted mb-6">
        Get updates on Grove developments, research, and opportunities to get involved.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
        />

        {/* Interest selection */}
        <div className="space-y-2">
          <p className="text-xs font-sans font-medium text-ink-muted uppercase tracking-wide">
            I'm interested in (optional)
          </p>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleInterest(option.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-sans transition-colors ${
                  interests.includes(option.id)
                    ? 'bg-grove-forest text-white'
                    : 'bg-ink/5 text-ink-muted hover:bg-ink/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <p className="text-xs text-ink-muted font-serif">
          We respect your inbox. Updates are infrequent and always substantive.
          Unsubscribe anytime.
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-ink/20 rounded-lg font-sans text-sm text-ink-muted hover:bg-ink/5 transition-colors"
          >
            Not Now
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-grove-forest text-white rounded-lg font-sans text-sm hover:bg-grove-forest/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailSignup;
