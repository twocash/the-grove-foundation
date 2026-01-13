// src/explore/components/PositionCard.tsx
// Prominent thesis/position statement display
// Sprint: results-display-v1
//
// DEX: Declarative Sovereignty
// Position display is data-driven - renders any thesis statement from ResearchDocument.

interface PositionCardProps {
  /** The position/thesis statement */
  position: string;
  /** Confidence score (0-1) */
  confidenceScore?: number;
  /** Document status */
  status?: 'complete' | 'partial' | 'insufficient-evidence';
}

/**
 * PositionCard - Prominent thesis statement display
 *
 * Features:
 * - Large quote block with gradient background
 * - Confidence score badge in corner
 * - Rounded corners with subtle border
 */
export function PositionCard({
  position,
  confidenceScore,
  status = 'complete',
}: PositionCardProps) {
  return (
    <div className="relative p-6 rounded-xl
                    bg-gradient-to-br from-purple-50 to-blue-50
                    dark:from-purple-900/20 dark:to-blue-900/20
                    border border-purple-200/50 dark:border-purple-800/30
                    shadow-sm">
      {/* Quote icon */}
      <span className="absolute top-4 left-4 text-4xl text-purple-200 dark:text-purple-800/50
                       font-serif leading-none select-none">
        "
      </span>

      {/* Position text */}
      <blockquote className="relative z-10 pl-6 pr-4">
        <p className="text-lg font-medium leading-relaxed
                      text-slate-800 dark:text-slate-200
                      italic">
          {position}
        </p>
      </blockquote>

      {/* Confidence badge */}
      {confidenceScore !== undefined && (
        <div className="absolute top-4 right-4">
          <ConfidenceBadge score={confidenceScore} status={status} />
        </div>
      )}

      {/* Closing quote */}
      <span className="absolute bottom-2 right-6 text-4xl text-purple-200 dark:text-purple-800/50
                       font-serif leading-none select-none rotate-180">
        "
      </span>
    </div>
  );
}

/**
 * ConfidenceBadge - Visual indicator of confidence level
 */
interface ConfidenceBadgeProps {
  score: number;
  status: 'complete' | 'partial' | 'insufficient-evidence';
}

export function ConfidenceBadge({ score, status }: ConfidenceBadgeProps) {
  // Determine confidence level
  const getConfidenceLevel = (): {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  } => {
    if (status === 'insufficient-evidence') {
      return {
        label: 'Insufficient',
        color: 'text-slate-500 dark:text-slate-400',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        borderColor: 'border-slate-200 dark:border-slate-700',
      };
    }

    if (score >= 0.8) {
      return {
        label: 'High Confidence',
        color: 'text-green-700 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800/50',
      };
    }

    if (score >= 0.5) {
      return {
        label: 'Medium Confidence',
        color: 'text-yellow-700 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
        borderColor: 'border-yellow-200 dark:border-yellow-800/50',
      };
    }

    return {
      label: 'Low Confidence',
      color: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
      borderColor: 'border-red-200 dark:border-red-800/50',
    };
  };

  const { label, color, bgColor, borderColor } = getConfidenceLevel();
  const percentage = Math.round(score * 100);

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full
                     ${bgColor} ${color} border ${borderColor}
                     text-xs font-medium`}>
      {/* Icon based on level */}
      <span className="material-symbols-outlined text-sm">
        {status === 'insufficient-evidence'
          ? 'help_outline'
          : score >= 0.8
            ? 'verified'
            : score >= 0.5
              ? 'info'
              : 'warning'}
      </span>

      {/* Label */}
      <span>{label}</span>

      {/* Percentage (only for valid scores) */}
      {status !== 'insufficient-evidence' && (
        <span className="opacity-70">({percentage}%)</span>
      )}
    </div>
  );
}

export default PositionCard;
