export { ObjectInspector } from './ObjectInspector';
export { VersionIndicator } from './VersionIndicator';
export { useVersionedObject } from './hooks/useVersionedObject';
export type { UseVersionedObjectResult, VersionMetadata } from './hooks/useVersionedObject';

// Surface exports
export {
  InspectorSurfaceProvider,
  useInspectorSurface,
  ReactInspectorSurface,
} from './surface';
export type {
  InspectorSurface,
  InspectorAction,
  ActionHandler,
  VersionInfo,
  ModelInfo,
  InspectorSurfaceProviderProps,
  ReactInspectorSurfaceConfig,
} from './surface';
