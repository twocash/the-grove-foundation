// src/surface/components/GroveObjectCard/JourneyContent.tsx

import React from 'react';
import { Journey } from '@core/schema/narrative';
import { Clock, Target } from 'lucide-react';

interface JourneyContentProps {
  journey: Journey;
}

export function JourneyContent({ journey }: JourneyContentProps) {
  return (
    <div className="space-y-2">
      {journey.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {journey.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {journey.estimatedMinutes} min
        </span>

        {journey.targetAha && (
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span className="truncate max-w-[150px]">{journey.targetAha}</span>
          </span>
        )}
      </div>
    </div>
  );
}
