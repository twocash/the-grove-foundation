// JourneyCompletion - Shows completion celebration and optional rating
// Displayed when user finishes all cards in a journey

import React, { useState } from 'react';

interface JourneyCompletionProps {
  journeyTitle: string;
  journeyId: string;
  personaId: string | null;
  completionTimeMinutes: number;
  onSubmit: (rating: number, feedback: string, sendToFoundation: boolean) => void;
  onSkip: () => void;
  showRating?: boolean;
  showFeedbackTransmission?: boolean;
}

const RATING_EMOJIS = [
  { value: 1, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '🙂', label: 'Good' },
  { value: 3, emoji: '😊', label: 'Great' },
  { value: 4, emoji: '🤩', label: 'Excellent' },
  { value: 5, emoji: '🤯', label: 'Mind-blown' }
];

const JourneyCompletion: React.FC<JourneyCompletionProps> = ({
  journeyTitle,
  journeyId,
  personaId,
  completionTimeMinutes,
  onSubmit,
  onSkip,
  showRating = true,
  showFeedbackTransmission = true
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showConsent, setShowConsent] = useState(false);

  const handleSubmit = (sendToFoundation: boolean) => {
    if (rating !== null) {
      onSubmit(rating, feedback, sendToFoundation);
    }
  };

  const handleContinue = () => {
    if (rating !== null && showFeedbackTransmission) {
      setShowConsent(true);
    } else if (rating !== null) {
      onSubmit(rating, feedback, false);
    } else {
      onSkip();
    }
  };

  // Consent screen for feedback transmission
  if (showConsent) {
    return (
      <div className="p-6 bg-white border border-ink/10 rounded-lg shadow-sm">
        <h3 className="font-display text-lg text-ink mb-4">
          Share Feedback with The Foundation?
        </h3>

        <p className="text-sm text-ink-muted mb-4">
          Your rating and feedback help us improve the experience for everyone.
        </p>

        <div className="bg-ink/[0.02] p-4 rounded-lg mb-4 text-sm">
          <div className="font-semibold text-ink mb-2">What we'll receive:</div>
          <ul className="text-ink-muted space-y-1">
            <li>• Your rating ({RATING_EMOJIS.find(e => e.value === rating)?.label})</li>
            {feedback && <li>• Your feedback text</li>}
            <li>• Which journey and persona</li>
            <li>• How long it took ({completionTimeMinutes} min)</li>
          </ul>

          <div className="font-semibold text-ink mt-4 mb-2">What we WON'T receive:</div>
          <ul className="text-ink-muted space-y-1">
            <li>• Your identity</li>
            <li>• Your queries or conversations</li>
            <li>• Your custom lens details</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => handleSubmit(true)}
            className="flex-1 px-4 py-2 bg-grove-forest text-white font-semibold rounded-lg hover:bg-grove-forest/90 transition-colors"
          >
            Send Anonymously
          </button>
          <button
            onClick={() => handleSubmit(false)}
            className="flex-1 px-4 py-2 bg-ink/5 text-ink font-semibold rounded-lg hover:bg-ink/10 transition-colors"
          >
            Keep Private
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-ink/10 rounded-lg shadow-sm">
      {/* Celebration Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="font-display text-xl text-ink">
          Journey Complete!
        </h3>
        <p className="text-sm text-ink-muted mt-1">
          {journeyTitle}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-ink/[0.02] p-4 rounded-lg mb-6 text-center">
        <p className="text-sm text-ink">
          You've explored this topic in depth. Time spent: {completionTimeMinutes} minutes
        </p>
      </div>

      {showRating && (
        <>
          {/* Rating Section */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-ink mb-3 text-center">
              How was this journey?
            </p>
            <div className="flex justify-center space-x-2">
              {RATING_EMOJIS.map(item => (
                <button
                  key={item.value}
                  onClick={() => setRating(item.value)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    rating === item.value
                      ? 'bg-grove-forest/10 ring-2 ring-grove-forest scale-110'
                      : 'bg-ink/[0.02] hover:bg-ink/5'
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[9px] text-ink-muted mt-1">{item.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="mb-6">
            <label className="block text-xs text-ink-muted mb-2">
              Want to share feedback? (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What resonated? What was confusing?"
              className="w-full px-3 py-2 border border-ink/10 rounded-lg text-sm focus:ring-2 focus:ring-grove-forest focus:border-grove-forest"
              rows={2}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={onSkip}
          className="flex-1 px-4 py-2 text-ink-muted font-semibold rounded-lg hover:bg-ink/5 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 px-4 py-2 bg-grove-forest text-white font-semibold rounded-lg hover:bg-grove-forest/90 transition-colors"
        >
          {rating !== null ? 'Submit & Continue' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default JourneyCompletion;
