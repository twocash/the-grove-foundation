// LoadingIndicator - Animated ASCII loading messages
// Cycles through configurable messages while waiting for AI response

import React, { useState, useEffect } from 'react';
import { DEFAULT_LOADING_MESSAGES } from '../../data/narratives-schema';

interface LoadingIndicatorProps {
  messages?: string[];
  intervalMs?: number; // How often to change messages (default: 2000ms)
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  messages = DEFAULT_LOADING_MESSAGES,
  intervalMs = 2000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Cycle through messages
  useEffect(() => {
    if (messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [messages.length, intervalMs]);

  // Animate dots
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 400);

    return () => clearInterval(dotInterval);
  }, []);

  const currentMessage = messages[currentIndex] || 'thinking...';
  // Remove trailing dots from message since we animate them
  const cleanMessage = currentMessage.replace(/\.+$/, '');

  return (
    <div className="flex items-center space-x-2 text-ink-muted">
      <span className="font-mono text-xs italic">
        {cleanMessage}<span className="inline-block w-6 text-left">{dots}</span>
      </span>
    </div>
  );
};

export default LoadingIndicator;
