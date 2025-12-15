// ShareFlow - Share lens or terminal experience
// Supports normal and discreet sharing modes

import React, { useState } from 'react';

interface ShareFlowProps {
  lensName?: string;
  isDiscreet?: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

const ShareFlow: React.FC<ShareFlowProps> = ({ lensName, isDiscreet = false, onSubmit, onClose }) => {
  const [shareMethod, setShareMethod] = useState<'link' | 'email' | null>(null);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Generate shareable link
  const getShareLink = () => {
    const baseUrl = window.location.origin;
    if (isDiscreet) {
      // Discreet link doesn't reveal it's about AI
      return `${baseUrl}/explore?ref=colleague`;
    }
    return `${baseUrl}?lens=${encodeURIComponent(lensName || 'custom')}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        <h3 className="font-display text-lg text-ink mb-2">Invitation Sent</h3>
        <p className="font-serif text-sm text-ink-muted">
          {isDiscreet
            ? "Your colleague will receive an intriguing invitation."
            : "They'll receive an invitation to explore the Grove."}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="font-display text-lg text-ink mb-2">
        {isDiscreet ? 'Share Discreetly' : 'Share the Grove'}
      </h3>
      <p className="font-serif text-sm text-ink-muted mb-6">
        {isDiscreet
          ? "Send an invitation that doesn't reveal the AI focus upfront."
          : lensName
            ? `Invite others to explore through the ${lensName} lens.`
            : "Share this experience with others who should see it."}
      </p>

      {/* Share method selection */}
      {!shareMethod && (
        <div className="space-y-3">
          <button
            onClick={() => setShareMethod('link')}
            className="w-full p-4 border border-ink/10 rounded-lg text-left hover:bg-ink/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-grove-forest/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-grove-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <p className="font-sans text-sm font-medium text-ink">Copy Link</p>
                <p className="font-serif text-xs text-ink-muted">Share via your preferred channel</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setShareMethod('email')}
            className="w-full p-4 border border-ink/10 rounded-lg text-left hover:bg-ink/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-grove-forest/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-grove-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-sans text-sm font-medium text-ink">Send via Email</p>
                <p className="font-serif text-xs text-ink-muted">We'll send an invitation on your behalf</p>
              </div>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Copy link view */}
      {shareMethod === 'link' && (
        <div className="space-y-4">
          <div className="p-3 bg-ink/5 rounded-lg">
            <p className="font-mono text-xs text-ink break-all">{getShareLink()}</p>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full px-4 py-3 bg-grove-forest text-white rounded-lg font-sans text-sm hover:bg-grove-forest/90 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Link
              </>
            )}
          </button>

          <button
            onClick={() => setShareMethod(null)}
            className="w-full py-2 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {/* Email form view */}
      {shareMethod === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Recipient's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />

          <textarea
            placeholder={isDiscreet
              ? "Add a personal note (optional) - we'll craft an intriguing invitation"
              : "Add a personal note (optional)"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest resize-none"
          />

          {isDiscreet && (
            <p className="text-xs text-ink-muted font-serif">
              The invitation will pique their curiosity without revealing the AI angle upfront.
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShareMethod(null)}
              className="flex-1 px-4 py-2 border border-ink/20 rounded-lg font-sans text-sm text-ink-muted hover:bg-ink/5 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-grove-forest text-white rounded-lg font-sans text-sm hover:bg-grove-forest/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShareFlow;
