// src/shared/inspector/surface/index.ts

export type {
  InspectorSurface,
  InspectorAction,
  ActionHandler,
  VersionInfo,
  ModelInfo
} from './types';

export { ReactInspectorSurface } from './ReactInspectorSurface';
export type { ReactInspectorSurfaceConfig } from './ReactInspectorSurface';

export {
  InspectorSurfaceProvider,
  useInspectorSurface
} from './context';
export type { InspectorSurfaceProviderProps } from './context';
