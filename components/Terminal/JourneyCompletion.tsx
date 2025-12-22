// JourneyCompletion - Shows completion celebration and optional rating
// v0.14: Updated for dark mode and inline rendering (not modal)

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
      <div className="p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm">
        <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-4">
          Share Feedback with The Foundation?
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Your rating and feedback help us improve the experience for everyone.
        </p>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-4 text-sm">
          <div className="font-semibold text-slate-900 dark:text-slate-100 mb-2">What we'll receive:</div>
          <ul className="text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Your rating ({RATING_EMOJIS.find(e => e.value === rating)?.label})</li>
            {feedback && <li>• Your feedback text</li>}
            <li>• Which journey and persona</li>
            <li>• How long it took ({completionTimeMinutes} min)</li>
          </ul>

          <div className="font-semibold text-slate-900 dark:text-slate-100 mt-4 mb-2">What we WON'T receive:</div>
          <ul className="text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Your identity</li>
            <li>• Your queries or conversations</li>
            <li>• Your custom lens details</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => handleSubmit(true)}
            className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Send Anonymously
          </button>
          <button
            onClick={() => handleSubmit(false)}
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Keep Private
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm">
      {/* Celebration Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="font-semibold text-xl text-slate-900 dark:text-slate-100">
          Journey Complete!
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          {journeyTitle}
        </p>
      </div>

      {/* Summary */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-6 text-center">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          You've explored this topic in depth. Time spent: {completionTimeMinutes} minutes
        </p>
      </div>

      {showRating && (
        <>
          {/* Rating Section */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 text-center">
              How was this journey?
            </p>
            <div className="flex justify-center space-x-2">
              {RATING_EMOJIS.map(item => (
                <button
                  key={item.value}
                  onClick={() => setRating(item.value)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    rating === item.value
                      ? 'bg-primary/10 ring-2 ring-primary scale-110'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">{item.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="mb-6">
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">
              Want to share feedback? (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What resonated? What was confusing?"
              className="w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-lg text-sm
                bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                focus:ring-2 focus:ring-primary focus:border-primary"
              rows={2}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={onSkip}
          className="flex-1 px-4 py-2 text-slate-500 dark:text-slate-400 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleContinue}
          className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          {rating !== null ? 'Submit & Continue' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default JourneyCompletion;
