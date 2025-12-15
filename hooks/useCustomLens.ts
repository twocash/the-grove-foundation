// useCustomLens - Hook for managing custom lenses with encrypted storage
// All user inputs are encrypted client-side before storage

import { useState, useEffect, useCallback } from 'react';
import {
  CustomLens,
  LensCandidate,
  UserInputs,
  StoredCustomLenses,
  ArchetypeId
} from '../types/lens';
import { encryptObject, decryptObject, isEncryptionSupported } from '../utils/encryption';
import { PersonaColor } from '../data/narratives-schema';

const CUSTOM_LENS_STORAGE_KEY = 'grove-custom-lenses';

interface UseCustomLensReturn {
  // Data
  customLenses: CustomLens[];
  isLoading: boolean;
  error: string | null;

  // CRUD operations
  saveCustomLens: (
    candidate: LensCandidate,
    userInputs: UserInputs
  ) => Promise<CustomLens>;
  deleteCustomLens: (id: string) => Promise<void>;
  updateCustomLensUsage: (id: string) => Promise<void>;
  incrementJourneysCompleted: (id: string) => Promise<void>;

  // Queries
  getCustomLens: (id: string) => CustomLens | undefined;
  hasCustomLenses: boolean;

  // Utilities
  canUseEncryption: boolean;
  clearAllCustomLenses: () => Promise<void>;
}

/**
 * Generate a unique ID for custom lenses
 */
function generateLensId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get a color for custom lenses that's visually distinct
 * Cycles through colors to avoid repetition
 */
function getCustomLensColor(existingLenses: CustomLens[]): PersonaColor {
  // Use purple as primary custom lens color, but allow variety
  const colors: PersonaColor[] = ['violet', 'emerald', 'amber', 'blue', 'rose'];
  const existingColors = existingLenses.map(l => l.color);

  // Find first color not in use, or default to violet
  return colors.find(c => !existingColors.includes(c)) || 'violet';
}

export function useCustomLens(): UseCustomLensReturn {
  const [customLenses, setCustomLenses] = useState<CustomLens[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canUseEncryption = isEncryptionSupported();

  // Load custom lenses from localStorage on mount
  useEffect(() => {
    loadCustomLenses();
  }, []);

  async function loadCustomLenses(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const stored = localStorage.getItem(CUSTOM_LENS_STORAGE_KEY);

      if (!stored) {
        setCustomLenses([]);
        return;
      }

      // The outer storage container is not encrypted, just the userInputs inside each lens
      const parsed: StoredCustomLenses = JSON.parse(stored);

      if (parsed.version !== '1.0' || !Array.isArray(parsed.lenses)) {
        console.warn('Invalid custom lens storage format, resetting');
        setCustomLenses([]);
        return;
      }

      setCustomLenses(parsed.lenses);
    } catch (err) {
      console.error('Failed to load custom lenses:', err);
      setError('Failed to load your custom lenses');
      setCustomLenses([]);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Persist custom lenses to localStorage
   */
  async function persistLenses(lenses: CustomLens[]): Promise<void> {
    const toStore: StoredCustomLenses = {
      version: '1.0',
      lenses,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(CUSTOM_LENS_STORAGE_KEY, JSON.stringify(toStore));
  }

  /**
   * Save a new custom lens from a selected candidate
   */
  const saveCustomLens = useCallback(async (
    candidate: LensCandidate,
    userInputs: UserInputs
  ): Promise<CustomLens> => {
    if (!canUseEncryption) {
      throw new Error('Encryption not supported in this browser');
    }

    // Encrypt user inputs before storage
    const encryptedInputs = await encryptObject(userInputs);

    const newLens: CustomLens = {
      id: generateLensId(),
      publicLabel: candidate.publicLabel,
      description: candidate.description,
      icon: 'Sparkles',  // Custom lenses use Sparkles icon
      color: getCustomLensColor(customLenses),
      enabled: true,
      isCustom: true,

      // Narrative configuration from candidate
      toneGuidance: candidate.toneGuidance,
      narrativeStyle: candidate.narrativeStyle,
      arcEmphasis: candidate.arcEmphasis,
      openingPhase: candidate.openingPhase,
      defaultThreadLength: 5,  // Default for custom lenses

      // Journey configuration (empty for custom lenses - uses archetype defaults)
      entryPoints: [],
      suggestedThread: [],

      // Custom lens specific fields
      userInputs: encryptedInputs,
      archetypeMapping: candidate.archetypeMapping,
      createdAt: new Date().toISOString(),
      journeysCompleted: 0
    };

    const updated = [...customLenses, newLens];
    await persistLenses(updated);
    setCustomLenses(updated);

    return newLens;
  }, [customLenses, canUseEncryption]);

  /**
   * Delete a custom lens
   */
  const deleteCustomLens = useCallback(async (id: string): Promise<void> => {
    const updated = customLenses.filter(l => l.id !== id);
    await persistLenses(updated);
    setCustomLenses(updated);
  }, [customLenses]);

  /**
   * Update the lastUsedAt timestamp for a lens
   */
  const updateCustomLensUsage = useCallback(async (id: string): Promise<void> => {
    const updated = customLenses.map(lens =>
      lens.id === id
        ? { ...lens, lastUsedAt: new Date().toISOString() }
        : lens
    );
    await persistLenses(updated);
    setCustomLenses(updated);
  }, [customLenses]);

  /**
   * Increment the journeys completed counter
   */
  const incrementJourneysCompleted = useCallback(async (id: string): Promise<void> => {
    const updated = customLenses.map(lens =>
      lens.id === id
        ? { ...lens, journeysCompleted: lens.journeysCompleted + 1 }
        : lens
    );
    await persistLenses(updated);
    setCustomLenses(updated);
  }, [customLenses]);

  /**
   * Get a specific custom lens by ID
   */
  const getCustomLens = useCallback((id: string): CustomLens | undefined => {
    return customLenses.find(l => l.id === id);
  }, [customLenses]);

  /**
   * Clear all custom lenses (useful for testing or user-initiated reset)
   */
  const clearAllCustomLenses = useCallback(async (): Promise<void> => {
    localStorage.removeItem(CUSTOM_LENS_STORAGE_KEY);
    setCustomLenses([]);
  }, []);

  return {
    customLenses,
    isLoading,
    error,
    saveCustomLens,
    deleteCustomLens,
    updateCustomLensUsage,
    incrementJourneysCompleted,
    getCustomLens,
    hasCustomLenses: customLenses.length > 0,
    canUseEncryption,
    clearAllCustomLenses
  };
}

export default useCustomLens;
