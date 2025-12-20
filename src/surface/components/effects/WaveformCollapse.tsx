// src/surface/components/effects/WaveformCollapse.tsx
// Typewriter animation: un-type -> pause -> re-type
// v0.14: Reality Projector - tuning phase visual

import React, { useState, useEffect, useRef } from 'react';

// Tuning glyphs for generation indicator
const TUNING_GLYPHS = ['▓', '▒', '░', '▒'];

interface WaveformCollapseProps {
  text: string;
  trigger: any;
  className?: string;
  delay?: number;
  backspaceSpeed?: number;
  typeSpeed?: number;
  pauseDuration?: number;
  isGenerating?: boolean;  // v0.14: Show tuning animation during LLM generation
}

type Phase = 'idle' | 'collapsing' | 'observing' | 'forming';

export const WaveformCollapse: React.FC<WaveformCollapseProps> = ({
  text,
  trigger,
  className = '',
  delay = 0,
  backspaceSpeed = 15,
  typeSpeed = 40,
  pauseDuration = 400,
  isGenerating = false
}) => {
  const [display, setDisplay] = useState(text);
  const [phase, setPhase] = useState<Phase>('idle');
  const [targetText, setTargetText] = useState(text);
  const [tuningIndex, setTuningIndex] = useState(0);
  const previousTrigger = useRef(trigger);
  const isFirstRender = useRef(true);

  // Tuning glyph animation during generation
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setTuningIndex(prev => (prev + 1) % TUNING_GLYPHS.length);
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDisplay(text);
      setTargetText(text);
      return;
    }

    if (trigger !== previousTrigger.current) {
      previousTrigger.current = trigger;
      setTargetText(text);

      const timer = setTimeout(() => {
        setPhase('collapsing');
      }, delay);

      return () => clearTimeout(timer);
    } else if (text !== display && phase === 'idle') {
      setDisplay(text);
      setTargetText(text);
    }
  }, [trigger, text, delay]);

  useEffect(() => {
    if (phase === 'collapsing') {
      if (display.length > 0) {
        const timer = setTimeout(() => {
          setDisplay(prev => prev.slice(0, -1));
        }, backspaceSpeed);
        return () => clearTimeout(timer);
      } else {
        setPhase('observing');
      }
    }

    if (phase === 'observing') {
      const timer = setTimeout(() => {
        setPhase('forming');
      }, pauseDuration);
      return () => clearTimeout(timer);
    }

    if (phase === 'forming') {
      if (display.length < targetText.length) {
        const speed = typeSpeed + (Math.random() * typeSpeed * 0.5);
        const timer = setTimeout(() => {
          setDisplay(targetText.slice(0, display.length + 1));
        }, speed);
        return () => clearTimeout(timer);
      } else {
        setPhase('idle');
      }
    }
  }, [phase, display, targetText, backspaceSpeed, typeSpeed, pauseDuration]);

  const showCursor = phase !== 'idle' || isGenerating;

  return (
    <span className={className}>
      {display}
      {showCursor && (
        <span
          className="inline-block w-[0.5em] h-[1em] ml-0.5 align-middle text-grove-forest"
          aria-hidden="true"
        >
          {isGenerating ? TUNING_GLYPHS[tuningIndex] : '▌'}
        </span>
      )}
    </span>
  );
};

export default WaveformCollapse;
