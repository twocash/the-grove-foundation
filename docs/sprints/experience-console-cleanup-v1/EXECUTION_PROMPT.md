# EXECUTION PROMPT: Experience Console Cleanup v1

**Sprint:** experience-console-cleanup-v1
**Type:** UX Polish
**Effort:** Small (4 stories)
**Start:** [timestamp]

---

## Context

This is a cleanup sprint addressing UX issues in the Experience Console that block the research pipeline:

1. **No default instances** — Research Agent and Writer Agent configs are registered but have no instances
2. **Modal-based +New** — Current flow requires modal, should be dropdown
3. **No empty state guidance** — Users see nothing when filtering to empty type

## Key Files

| File | Location | Purpose |
|------|----------|---------|
| `useUnifiedExperienceData.ts` | `src/bedrock/consoles/ExperienceConsole/` | Modify to create defaults |
| `console-factory.tsx` | `src/bedrock/patterns/` | Modify for dropdown +New |
| `ExperienceConsole.config.ts` | `src/bedrock/consoles/ExperienceConsole/` | Config already generates type list |
| `experience.types.ts` | `src/bedrock/types/` | Registry with SINGLETON types |

---

## Phase 1: Create Default Instances

### Goal
Create default instances for SINGLETON types (`research-agent-config`, `writer-agent-config`) on console initialization.

### Location
`src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts`

### Implementation

Add a `useEffect` to create defaults for SINGLETON types that don't have instances:

```typescript
// At top of file, add imports:
import { EXPERIENCE_TYPE_REGISTRY, getAllExperienceTypes } from '../../types/experience.types';
import { DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD } from '@core/schema/research-agent-config';
import { DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD } from '@core/schema/writer-agent-config';

// Inside useUnifiedExperienceData, after the data hooks but before return:

// =========================================================================
// Auto-create default instances for SINGLETON types
// Sprint: experience-console-cleanup-v1
// =========================================================================
const [defaultsCreated, setDefaultsCreated] = useState(false);

useEffect(() => {
  if (defaultsCreated || loading) return;

  // Find SINGLETON types that need default instances
  const singletonTypes = getAllExperienceTypes().filter(
    (t) => t.routePath === '/bedrock/experience' && !t.allowMultipleActive
  );

  const createDefaults = async () => {
    for (const typeDef of singletonTypes) {
      // Check if instance exists for this type
      const existingInstance = objects.find((o) => o.meta.type === typeDef.type);

      if (!existingInstance) {
        console.log(`[ExperienceConsole] Creating default instance for: ${typeDef.type}`);

        // Create based on type
        switch (typeDef.type) {
          case 'research-agent-config':
            await createTypedInstance('research-agent-config', {
              title: 'Research Agent Config',
              description: 'Default research execution configuration',
              payload: DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD,
            });
            break;
          case 'writer-agent-config':
            await createTypedInstance('writer-agent-config', {
              title: 'Writer Agent Config',
              description: 'Default document writing configuration',
              payload: DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
            });
            break;
        }
      }
    }
    setDefaultsCreated(true);
  };

  createDefaults();
}, [objects, loading, defaultsCreated]);
```

### Create Typed Instance Function

Add a new function to handle typed creation:

```typescript
// Add to the unified hook, after the duplicate callback:

// =========================================================================
// Create instance of a specific type
// Sprint: experience-console-cleanup-v1
// =========================================================================
const createTypedInstance = useCallback(async (
  type: string,
  defaults: { title: string; description: string; payload: unknown }
): Promise<GroveObject<UnifiedExperiencePayload>> => {
  switch (type) {
    case 'system-prompt':
      return systemPromptData.create(defaults.payload as Partial<SystemPromptPayload>) as Promise<GroveObject<UnifiedExperiencePayload>>;
    case 'feature-flag':
      return featureFlagData.create(defaults.payload as Partial<FeatureFlagPayload>) as Promise<GroveObject<UnifiedExperiencePayload>>;
    case 'research-agent-config':
      // Need to add useResearchAgentConfigData hook
      // For MVP: use groveDataProvider directly
      // TODO: Wire full data hook
      throw new Error('Research agent config creation requires data hook - implement in Phase 2');
    case 'writer-agent-config':
      // Need to add useWriterAgentConfigData hook
      // For MVP: use groveDataProvider directly
      // TODO: Wire full data hook
      throw new Error('Writer agent config creation requires data hook - implement in Phase 2');
    default:
      throw new Error(`Unknown experience type: ${type}`);
  }
}, [systemPromptData.create, featureFlagData.create]);
```

### Required Data Hooks

The full solution requires data hooks for the new types. Create these:

**File: `src/bedrock/consoles/ExperienceConsole/useResearchAgentConfigData.ts`**

```typescript
// src/bedrock/consoles/ExperienceConsole/useResearchAgentConfigData.ts
// Data hook for Research Agent Config objects
// Sprint: experience-console-cleanup-v1

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data/grove-data-provider';
import type { GroveObject } from '@core/schema/grove-object';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import { DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD } from '@core/schema/research-agent-config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '@core/data/grove-data-provider';

export interface ResearchAgentConfigDataResult extends CollectionDataResult<ResearchAgentConfigPayload> {}

export function useResearchAgentConfigData(): ResearchAgentConfigDataResult {
  const { objects: allObjects, loading, error, createObject, updateObject, deleteObject } = useGroveData();

  // Filter to research-agent-config type
  const objects = useMemo(() => {
    return allObjects.filter(
      (obj): obj is GroveObject<ResearchAgentConfigPayload> =>
        obj.meta.type === 'research-agent-config'
    );
  }, [allObjects]);

  const create = useCallback(async (
    defaults?: Partial<ResearchAgentConfigPayload>
  ): Promise<GroveObject<ResearchAgentConfigPayload>> => {
    const payload: ResearchAgentConfigPayload = {
      ...DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD,
      ...defaults,
    };

    return createObject({
      type: 'research-agent-config',
      title: 'Research Agent Config',
      description: 'Configure research execution behavior',
      payload,
    }) as Promise<GroveObject<ResearchAgentConfigPayload>>;
  }, [createObject]);

  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    return updateObject(id, operations);
  }, [updateObject]);

  const remove = useCallback(async (id: string) => {
    return deleteObject(id);
  }, [deleteObject]);

  const duplicate = useCallback(async (
    object: GroveObject<ResearchAgentConfigPayload>
  ): Promise<GroveObject<ResearchAgentConfigPayload>> => {
    return create({
      ...object.payload,
    });
  }, [create]);

  const refetch = useCallback(() => {
    // GroveDataProvider auto-syncs, no manual refetch needed
  }, []);

  return {
    objects,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
  };
}

export function createDefaultResearchAgentConfig(): Partial<ResearchAgentConfigPayload> {
  return { ...DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD };
}
```

**File: `src/bedrock/consoles/ExperienceConsole/useWriterAgentConfigData.ts`**

```typescript
// src/bedrock/consoles/ExperienceConsole/useWriterAgentConfigData.ts
// Data hook for Writer Agent Config objects
// Sprint: experience-console-cleanup-v1

import { useCallback, useMemo } from 'react';
import { useGroveData } from '@core/data/grove-data-provider';
import type { GroveObject } from '@core/schema/grove-object';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import { DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD } from '@core/schema/writer-agent-config';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '@core/data/grove-data-provider';

export interface WriterAgentConfigDataResult extends CollectionDataResult<WriterAgentConfigPayload> {}

export function useWriterAgentConfigData(): WriterAgentConfigDataResult {
  const { objects: allObjects, loading, error, createObject, updateObject, deleteObject } = useGroveData();

  // Filter to writer-agent-config type
  const objects = useMemo(() => {
    return allObjects.filter(
      (obj): obj is GroveObject<WriterAgentConfigPayload> =>
        obj.meta.type === 'writer-agent-config'
    );
  }, [allObjects]);

  const create = useCallback(async (
    defaults?: Partial<WriterAgentConfigPayload>
  ): Promise<GroveObject<WriterAgentConfigPayload>> => {
    const payload: WriterAgentConfigPayload = {
      ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
      ...defaults,
    };

    return createObject({
      type: 'writer-agent-config',
      title: 'Writer Agent Config',
      description: 'Configure document writing behavior',
      payload,
    }) as Promise<GroveObject<WriterAgentConfigPayload>>;
  }, [createObject]);

  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    return updateObject(id, operations);
  }, [updateObject]);

  const remove = useCallback(async (id: string) => {
    return deleteObject(id);
  }, [deleteObject]);

  const duplicate = useCallback(async (
    object: GroveObject<WriterAgentConfigPayload>
  ): Promise<GroveObject<WriterAgentConfigPayload>> => {
    return create({
      ...object.payload,
    });
  }, [create]);

  const refetch = useCallback(() => {
    // GroveDataProvider auto-syncs, no manual refetch needed
  }, []);

  return {
    objects,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
  };
}

export function createDefaultWriterAgentConfig(): Partial<WriterAgentConfigPayload> {
  return { ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD };
}
```

### Update Unified Hook

Update `useUnifiedExperienceData.ts` to include the new hooks:

```typescript
// Add imports
import { useResearchAgentConfigData } from './useResearchAgentConfigData';
import { useWriterAgentConfigData } from './useWriterAgentConfigData';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';

// Update UnifiedExperiencePayload union:
export type UnifiedExperiencePayload =
  | SystemPromptPayload
  | FeatureFlagPayload
  | ResearchAgentConfigPayload
  | WriterAgentConfigPayload;

// Inside hook, add data calls:
const researchAgentConfigData = useResearchAgentConfigData();
const writerAgentConfigData = useWriterAgentConfigData();

// Update objects merge:
const objects = useMemo(() => {
  return [
    ...systemPromptData.objects,
    ...featureFlagData.objects,
    ...researchAgentConfigData.objects,
    ...writerAgentConfigData.objects,
  ] as GroveObject<UnifiedExperiencePayload>[];
}, [
  systemPromptData.objects,
  featureFlagData.objects,
  researchAgentConfigData.objects,
  writerAgentConfigData.objects,
]);

// Update loading:
const loading = systemPromptData.loading || featureFlagData.loading ||
  researchAgentConfigData.loading || writerAgentConfigData.loading;

// Update error:
const error = systemPromptData.error || featureFlagData.error ||
  researchAgentConfigData.error || writerAgentConfigData.error;

// Update refetch:
const refetch = useCallback(() => {
  systemPromptData.refetch();
  featureFlagData.refetch();
  researchAgentConfigData.refetch();
  writerAgentConfigData.refetch();
}, [/* deps */]);

// Update switch statements in update/remove/duplicate to include new types
```

### Gate 1 Verification

```bash
npm run build
# Open Experience Console
# Filter by "Research Agent" type
# Verify: Default instance appears
# Filter by "Writer Agent" type
# Verify: Default instance appears
```

---

## Phase 2: +New Dropdown Menu

### Goal
Replace modal-based +New with inline dropdown menu.

### Location
`src/bedrock/patterns/console-factory.tsx`

### Current Implementation (lines 477-491)

```tsx
{config.primaryAction && (
  <GlassButton
    onClick={handleCreate}
    variant="primary"
    size="sm"
    disabled={loading}
  >
    {config.primaryAction.icon && (
      <span className="material-symbols-outlined text-lg">
        {config.primaryAction.icon}
      </span>
    )}
    {config.primaryAction.label}
  </GlassButton>
)}
```

### New Implementation

Create a dropdown component for type selection:

**File: `src/bedrock/components/CreateDropdown.tsx`**

```tsx
// src/bedrock/components/CreateDropdown.tsx
// Dropdown for selecting type when creating new objects
// Sprint: experience-console-cleanup-v1

import React, { useState, useRef, useEffect } from 'react';
import { GlassButton } from '../primitives/GlassButton';

export interface CreateDropdownOption {
  type: string;
  label: string;
  icon: string;
  color?: string;
}

export interface CreateDropdownProps {
  options: CreateDropdownOption[];
  onSelect: (type: string) => void;
  disabled?: boolean;
  label?: string;
}

export const CreateDropdown: React.FC<CreateDropdownProps> = ({
  options,
  onSelect,
  disabled = false,
  label = 'New',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSelect = (type: string) => {
    onSelect(type);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <GlassButton
        onClick={() => setIsOpen(!isOpen)}
        variant="primary"
        size="sm"
        disabled={disabled}
      >
        <span className="material-symbols-outlined text-lg">add</span>
        {label}
        <span className="material-symbols-outlined text-sm ml-1">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </GlassButton>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 min-w-[200px] rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] shadow-lg z-50 py-1">
          {options.map((option) => (
            <button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left hover:bg-[var(--glass-panel)] transition-colors"
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: option.color || 'var(--glass-text)' }}
              >
                {option.icon}
              </span>
              <span className="text-[var(--glass-text)]">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateDropdown;
```

### Update Console Factory

Modify `console-factory.tsx` to use the dropdown for polymorphic consoles:

```tsx
// Add import at top
import { CreateDropdown } from '../components/CreateDropdown';
import { getAllExperienceTypes } from '../types/experience.types';

// In the BedrockConsole component, add options computation:
const createOptions = useMemo(() => {
  // For Experience Console, get types from registry
  if (config.id === 'experience') {
    return getAllExperienceTypes()
      .filter((t) => t.routePath === '/bedrock/experience')
      .map((t) => ({
        type: t.type,
        label: t.label,
        icon: t.icon,
        color: t.color,
      }));
  }
  // For other consoles, single option (current behavior)
  return [];
}, [config.id]);

// Add typed create handler:
const handleCreateTyped = useCallback(async (type: string) => {
  // This requires the create function to accept type parameter
  // See Phase 1 createTypedInstance implementation
  const newObject = await create({ type } as any);
  setSelectedId(newObject.meta.id);
}, [create]);

// Replace the primaryAction rendering:
{config.primaryAction && (
  createOptions.length > 0 ? (
    <CreateDropdown
      options={createOptions}
      onSelect={handleCreateTyped}
      disabled={loading}
      label={config.primaryAction.label}
    />
  ) : (
    <GlassButton
      onClick={handleCreate}
      variant="primary"
      size="sm"
      disabled={loading}
    >
      {config.primaryAction.icon && (
        <span className="material-symbols-outlined text-lg">
          {config.primaryAction.icon}
        </span>
      )}
      {config.primaryAction.label}
    </GlassButton>
  )
)}
```

### Update Create Function Signature

The `create` function in `useUnifiedExperienceData.ts` needs to accept a type parameter:

```typescript
const create = useCallback(async (
  options?: { type?: string } & Partial<UnifiedExperiencePayload>
): Promise<GroveObject<UnifiedExperiencePayload>> => {
  const type = options?.type || 'system-prompt'; // Default for backwards compat

  switch (type) {
    case 'system-prompt':
      return systemPromptData.create(options as Partial<SystemPromptPayload>);
    case 'feature-flag':
      return featureFlagData.create(options as Partial<FeatureFlagPayload>);
    case 'research-agent-config':
      return researchAgentConfigData.create(options as Partial<ResearchAgentConfigPayload>);
    case 'writer-agent-config':
      return writerAgentConfigData.create(options as Partial<WriterAgentConfigPayload>);
    default:
      throw new Error(`Unknown experience type: ${type}`);
  }
}, [/* deps */]);
```

### Gate 2 Verification

```bash
npm run build
# Open Experience Console
# Click +New button
# Verify: Dropdown appears with all types
# Select "Feature Flag"
# Verify: New Feature Flag created and inspector opens
# Select "Research Agent"
# Verify: New Research Agent Config created
```

---

## Phase 3: Empty State Messaging

### Goal
Show helpful empty state when filtering to a type with no instances.

### Current Behavior
- Uses generic `NoItemsState` component
- Message: "No experience yet"

### Target Behavior
- Type-aware empty state
- Message: "No {Type Name} configs. Create one to get started."
- Create button for that specific type

### Location
`src/bedrock/patterns/console-factory.tsx` (lines 583-599)

### Implementation

Update the empty state rendering to be type-aware:

```tsx
// Inside the console factory render section, replace:
) : EmptyStateComponent ? (
  <EmptyStateComponent onCreate={handleCreate} />
) : (
  <NoItemsState
    title={`No ${config.title.toLowerCase()} yet`}
    description={`Create your first ${config.title.toLowerCase().slice(0, -1)} to get started.`}
    action={/* ... */}
  />
)

// With type-aware version:
) : EmptyStateComponent ? (
  <EmptyStateComponent onCreate={handleCreate} />
) : (
  <TypeAwareEmptyState
    config={config}
    activeTypeFilter={filters['meta.type'] as string | undefined}
    createOptions={createOptions}
    onCreateTyped={handleCreateTyped}
    onCreateDefault={handleCreate}
  />
)
```

**File: `src/bedrock/components/TypeAwareEmptyState.tsx`**

```tsx
// src/bedrock/components/TypeAwareEmptyState.tsx
// Type-aware empty state for polymorphic consoles
// Sprint: experience-console-cleanup-v1

import React from 'react';
import { NoItemsState } from './EmptyState';
import type { ConsoleConfig } from '../types/console.types';
import type { CreateDropdownOption } from './CreateDropdown';
import { getExperienceTypeDefinition, isExperienceObjectType } from '../types/experience.types';

export interface TypeAwareEmptyStateProps {
  config: ConsoleConfig;
  activeTypeFilter?: string;
  createOptions: CreateDropdownOption[];
  onCreateTyped: (type: string) => void;
  onCreateDefault: () => void;
}

export const TypeAwareEmptyState: React.FC<TypeAwareEmptyStateProps> = ({
  config,
  activeTypeFilter,
  createOptions,
  onCreateTyped,
  onCreateDefault,
}) => {
  // If filtering by a specific type, show type-specific empty state
  if (activeTypeFilter && isExperienceObjectType(activeTypeFilter)) {
    const typeDef = getExperienceTypeDefinition(activeTypeFilter);

    return (
      <NoItemsState
        title={`No ${typeDef.label} configs`}
        description={typeDef.description || `Create a ${typeDef.label} to configure this feature.`}
        action={{
          label: `Create ${typeDef.label}`,
          icon: 'add',
          onClick: () => onCreateTyped(activeTypeFilter),
        }}
      />
    );
  }

  // Default empty state (no type filter or unknown type)
  return (
    <NoItemsState
      title={`No ${config.title.toLowerCase()} yet`}
      description={`Create your first experience object to get started.`}
      action={
        config.primaryAction
          ? {
              label: config.primaryAction.label,
              icon: config.primaryAction.icon,
              onClick: onCreateDefault,
            }
          : undefined
      }
    />
  );
};

export default TypeAwareEmptyState;
```

### Gate 3 Verification

```bash
npm run build
# Open Experience Console
# Delete all Research Agent Configs (if any exist)
# Filter by "Research Agent" type
# Verify: Empty state shows "No Research Agent configs"
# Verify: Create button says "Create Research Agent"
# Click Create
# Verify: New instance created and visible
```

---

## Phase 4: Verification

### Build Gate

```bash
cd C:\GitHub\the-grove-foundation
npm run build
# Must pass with no errors
```

### Manual Verification Checklist

- [ ] Open Experience Console
- [ ] Default Research Agent Config exists
- [ ] Default Writer Agent Config exists
- [ ] +New button shows dropdown
- [ ] Dropdown lists all registered types
- [ ] Selecting type creates correct instance
- [ ] Inspector opens after creation
- [ ] Empty state shows when filtering to empty type
- [ ] Empty state Create button works
- [ ] Config changes persist after page reload

### Console Logging

Look for these logs in browser console:

```
[ExperienceConsole] Creating default instance for: research-agent-config
[ExperienceConsole] Creating default instance for: writer-agent-config
```

---

## Completion

### Files Created
- [ ] `src/bedrock/consoles/ExperienceConsole/useResearchAgentConfigData.ts`
- [ ] `src/bedrock/consoles/ExperienceConsole/useWriterAgentConfigData.ts`
- [ ] `src/bedrock/components/CreateDropdown.tsx`
- [ ] `src/bedrock/components/TypeAwareEmptyState.tsx`

### Files Modified
- [ ] `src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts`
- [ ] `src/bedrock/patterns/console-factory.tsx`

### Export Updates
- [ ] Export new hooks from `useUnifiedExperienceData.ts`
- [ ] Export new components from `components/index.ts` (if exists)

### Documentation
Update `docs/sprints/experience-console-cleanup-v1/REVIEW.html` with:
- Screenshots of dropdown
- Screenshots of empty state
- Screenshot of default configs

---

## Summary

| Phase | Focus | Key Changes |
|-------|-------|-------------|
| 1 | Default Instances | Add data hooks, auto-create SINGLETON defaults |
| 2 | +New Dropdown | Replace button with dropdown menu |
| 3 | Empty States | Type-aware messaging and actions |
| 4 | Verification | Build, test, document |

**Critical Pattern:** SINGLETON types (`allowMultipleActive: false`) get auto-created defaults. INSTANCE types (`allowMultipleActive: true`) do not.
