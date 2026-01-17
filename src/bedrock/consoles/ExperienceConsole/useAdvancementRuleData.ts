// src/bedrock/consoles/ExperienceConsole/useAdvancementRuleData.ts
// Data hook for Advancement Rules - wraps useGroveData for console factory compatibility
// Sprint: S7-SL-AutoAdvancement v1
//
// DEX Principle: Organic Scalability
// Data hook follows established pattern from useFeatureFlagsData (INSTANCE pattern)
// INSTANCE pattern: Many rules can be active simultaneously

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { GroveObject } from '@core/schema/grove-object';
import type { AdvancementRulePayload, AdvancementCriterion } from '@core/schema/advancement';
import { DEFAULT_ADVANCEMENT_RULE_PAYLOAD } from '@core/schema/advancement';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import { generateUUID } from '@core/versioning/utils';

// =============================================================================
// Default Object Factory
// =============================================================================

/**
 * Create a default Advancement Rule GroveObject
 * @param defaults - Optional payload defaults
 */
export function createDefaultAdvancementRule(
  defaults?: Partial<AdvancementRulePayload>
): GroveObject<AdvancementRulePayload> {
  const now = new Date().toISOString();
  const fromTier = defaults?.fromTier ?? 'seed';
  const toTier = defaults?.toTier ?? 'sprout';

  return {
    meta: {
      id: generateUUID(),
      type: 'advancement-rule',
      title: `${fromTier} → ${toTier}`,
      description: `Advancement rule from ${fromTier} to ${toTier}`,
      icon: 'trending_up',
      status: 'active', // Rules are active by default (Instance pattern)
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      ...DEFAULT_ADVANCEMENT_RULE_PAYLOAD,
      fromTier,
      toTier,
      ...defaults,
    },
  };
}

// =============================================================================
// Extended Result Type
// =============================================================================

/**
 * Extended result type with advancement rule specific helpers
 */
export interface AdvancementRuleDataResult extends CollectionDataResult<AdvancementRulePayload> {
  /** Rules that are enabled for batch evaluation */
  enabledRules: GroveObject<AdvancementRulePayload>[];
  /** Rules grouped by fromTier */
  rulesByFromTier: Record<string, GroveObject<AdvancementRulePayload>[]>;
  /** Get rules for a specific tier transition */
  getRulesForTransition: (fromTier: string, toTier: string) => GroveObject<AdvancementRulePayload>[];
  /** Toggle isEnabled with timestamp update */
  toggleEnabled: (id: string) => Promise<void>;
  /** Add a criterion to a rule */
  addCriterion: (id: string, criterion: AdvancementCriterion) => Promise<void>;
  /** Remove a criterion from a rule by index */
  removeCriterion: (id: string, index: number) => Promise<void>;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Advancement Rules in Experience Console
 *
 * Wraps useGroveData<AdvancementRulePayload>('advancement-rule') to provide:
 * - Standard CRUD operations via CollectionDataResult interface
 * - `enabledRules`: Rules where isEnabled=true
 * - `rulesByFromTier`: Rules grouped by source tier
 * - `getRulesForTransition(from, to)`: Find rules for specific transition
 * - `toggleEnabled(id)`: Toggle isEnabled flag
 * - `addCriterion(id, criterion)`: Add criterion to rule
 * - `removeCriterion(id, index)`: Remove criterion by index
 */
export function useAdvancementRuleData(): AdvancementRuleDataResult {
  const groveData = useGroveData<AdvancementRulePayload>('advancement-rule');

  // Computed: Rules that are enabled for batch evaluation
  const enabledRules = useMemo(() => {
    return groveData.objects.filter(
      (rule) => rule.payload.isEnabled && rule.meta.status === 'active'
    );
  }, [groveData.objects]);

  // Computed: Rules grouped by fromTier
  const rulesByFromTier = useMemo(() => {
    const grouped: Record<string, GroveObject<AdvancementRulePayload>[]> = {};

    for (const rule of groveData.objects) {
      if (rule.meta.status === 'active') {
        const tier = rule.payload.fromTier;
        if (!grouped[tier]) {
          grouped[tier] = [];
        }
        grouped[tier].push(rule);
      }
    }

    return grouped;
  }, [groveData.objects]);

  // Get rules for a specific tier transition
  const getRulesForTransition = useCallback(
    (fromTier: string, toTier: string) => {
      return groveData.objects.filter(
        (rule) =>
          rule.payload.fromTier === fromTier &&
          rule.payload.toTier === toTier &&
          rule.meta.status === 'active'
      );
    },
    [groveData.objects]
  );

  // Create with defaults
  const create = useCallback(
    async (defaults?: Partial<AdvancementRulePayload>) => {
      const newRule = createDefaultAdvancementRule(defaults);
      return groveData.create(newRule);
    },
    [groveData]
  );

  // Toggle isEnabled flag
  const toggleEnabled = useCallback(
    async (id: string) => {
      const rule = groveData.objects.find((r) => r.meta.id === id);
      if (!rule) {
        throw new Error(`Rule not found: ${id}`);
      }

      const now = new Date().toISOString();

      await groveData.update(id, [
        { op: 'replace', path: '/payload/isEnabled', value: !rule.payload.isEnabled },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      await groveData.refetch();
    },
    [groveData]
  );

  // Add a criterion to a rule
  const addCriterion = useCallback(
    async (id: string, criterion: AdvancementCriterion) => {
      const rule = groveData.objects.find((r) => r.meta.id === id);
      if (!rule) {
        throw new Error(`Rule not found: ${id}`);
      }

      const now = new Date().toISOString();
      const updatedCriteria = [...rule.payload.criteria, criterion];

      await groveData.update(id, [
        { op: 'replace', path: '/payload/criteria', value: updatedCriteria },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      await groveData.refetch();
    },
    [groveData]
  );

  // Remove a criterion by index
  const removeCriterion = useCallback(
    async (id: string, index: number) => {
      const rule = groveData.objects.find((r) => r.meta.id === id);
      if (!rule) {
        throw new Error(`Rule not found: ${id}`);
      }

      if (index < 0 || index >= rule.payload.criteria.length) {
        throw new Error(`Invalid criterion index: ${index}`);
      }

      const now = new Date().toISOString();
      const updatedCriteria = rule.payload.criteria.filter((_, i) => i !== index);

      await groveData.update(id, [
        { op: 'replace', path: '/payload/criteria', value: updatedCriteria },
        { op: 'replace', path: '/meta/updatedAt', value: now },
      ]);

      await groveData.refetch();
    },
    [groveData]
  );

  // Duplicate rule
  const duplicate = useCallback(
    async (object: GroveObject<AdvancementRulePayload>) => {
      const now = new Date().toISOString();

      const duplicated: GroveObject<AdvancementRulePayload> = {
        meta: {
          id: generateUUID(),
          type: 'advancement-rule',
          title: `${object.meta.title} (Copy)`,
          description: object.meta.description,
          icon: object.meta.icon,
          status: 'active',
          createdAt: now,
          updatedAt: now,
          tags: [...(object.meta.tags || [])],
        },
        payload: {
          ...object.payload,
          isEnabled: false, // Duplicates start disabled
        },
      };

      return groveData.create(duplicated);
    },
    [groveData]
  );

  return {
    // Standard CollectionDataResult
    objects: groveData.objects,
    loading: groveData.loading,
    error: groveData.error,
    refetch: groveData.refetch,
    create,
    update: groveData.update,
    remove: groveData.remove,
    duplicate,

    // Extended functionality
    enabledRules,
    rulesByFromTier,
    getRulesForTransition,
    toggleEnabled,
    addCriterion,
    removeCriterion,
  };
}

export default useAdvancementRuleData;
