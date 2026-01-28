// src/bedrock/primitives/BufferedInput.tsx
// Buffered input components that prevent race conditions with parent state
// Sprint: inspector-input-fix-v1
//
// Problem: When inputs are directly controlled by props that update async,
// rapid typing causes characters to be lost or duplicated as stale state
// overwrites user input.
//
// Solution: Buffer input state locally and sync to parent on:
// - blur (user leaves field)
// - debounced timeout (user pauses typing)
// - explicit save

import React, { useState, useEffect, useRef, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

interface BufferedInputProps {
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  debounceMs?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'email' | 'url' | 'password' | 'number';
  /** HTML input attributes for number inputs */
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

interface BufferedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  debounceMs?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}

// =============================================================================
// Shared Logic Hook
// =============================================================================

/**
 * Hook to manage buffered input state.
 *
 * - Maintains local state for immediate UI responsiveness
 * - Syncs to parent on blur or after debounce timeout
 * - Accepts new values from parent when not focused (external updates)
 */
function useBufferedInput(
  value: string,
  onChange: (value: string) => void,
  debounceMs = 300
) {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedRef = useRef(value);
  // S27-OT-FIX: Guard to prevent race condition on blur
  // When we sync on blur, parent prop hasn't updated yet - don't overwrite localValue
  const justSyncedOnBlurRef = useRef(false);

  // Sync from parent when:
  // 1. Not focused (user isn't editing)
  // 2. Value changed externally (not from our own onChange)
  // 3. Not immediately after we synced on blur (race condition guard)
  useEffect(() => {
    if (!isFocused && value !== lastSyncedRef.current) {
      // S27-OT-FIX: Skip this effect cycle if we just synced on blur
      // The parent prop is stale - it will catch up on next render
      if (justSyncedOnBlurRef.current) {
        justSyncedOnBlurRef.current = false;
        return;
      }
      setLocalValue(value);
      lastSyncedRef.current = value;
    }
  }, [value, isFocused]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (newValue: string) => {
      setLocalValue(newValue);

      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Schedule debounced sync to parent
      debounceRef.current = setTimeout(() => {
        if (newValue !== lastSyncedRef.current) {
          onChange(newValue);
          lastSyncedRef.current = newValue;
        }
      }, debounceMs);
    },
    [onChange, debounceMs]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Clear pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Sync to parent immediately on blur
    if (localValue !== lastSyncedRef.current) {
      onChange(localValue);
      lastSyncedRef.current = localValue;
      // S27-OT-FIX: Mark that we just synced - prevents race condition
      // where the effect sees stale parent prop and overwrites our change
      justSyncedOnBlurRef.current = true;
    }
  }, [localValue, onChange]);

  return {
    localValue,
    handleChange,
    handleFocus,
    handleBlur,
  };
}

// =============================================================================
// BufferedInput Component
// =============================================================================

/**
 * Input that buffers changes locally to prevent race conditions.
 *
 * Use this instead of controlled inputs when the parent updates state async.
 *
 * @example
 * <BufferedInput
 *   value={prompt.meta.title}
 *   onChange={(v) => patchMeta('title', v)}
 *   debounceMs={300}
 * />
 */
export function BufferedInput({
  value,
  onChange,
  onBlur,
  debounceMs = 300,
  disabled = false,
  placeholder,
  className = '',
  type = 'text',
  min,
  max,
  step,
}: BufferedInputProps) {
  // Convert number values to string for internal state
  const stringValue = typeof value === 'number' ? String(value) : value;
  const { localValue, handleChange, handleFocus, handleBlur } = useBufferedInput(
    stringValue,
    onChange,
    debounceMs
  );

  return (
    <input
      type={type}
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={handleFocus}
      onBlur={() => {
        handleBlur();
        onBlur?.();
      }}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      min={min}
      max={max}
      step={step}
    />
  );
}

// =============================================================================
// BufferedTextarea Component
// =============================================================================

/**
 * Textarea that buffers changes locally to prevent race conditions.
 *
 * Use this instead of controlled textareas when the parent updates state async.
 *
 * @example
 * <BufferedTextarea
 *   value={prompt.payload.executionPrompt}
 *   onChange={(v) => patchPayload('executionPrompt', v)}
 *   rows={8}
 *   debounceMs={300}
 * />
 */
export function BufferedTextarea({
  value,
  onChange,
  onBlur,
  debounceMs = 300,
  disabled = false,
  placeholder,
  className = '',
  rows = 3,
}: BufferedTextareaProps) {
  const { localValue, handleChange, handleFocus, handleBlur } = useBufferedInput(
    value,
    onChange,
    debounceMs
  );

  return (
    <textarea
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={handleFocus}
      onBlur={() => {
        handleBlur();
        onBlur?.();
      }}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      rows={rows}
    />
  );
}

export default BufferedInput;
