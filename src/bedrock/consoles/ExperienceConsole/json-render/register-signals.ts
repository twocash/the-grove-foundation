// src/bedrock/consoles/ExperienceConsole/json-render/register-signals.ts
// Sprint: S19-BD-JsonRenderFactory
// Registers signals catalog components with the global registry
//
// Usage: Import this file once at app startup to register all signals components
//   import '@bedrock/consoles/ExperienceConsole/json-render/register-signals';

import { registerCatalog } from '@bedrock/json-render';
import { SignalsCatalog } from './signals-catalog';
import { SignalsRegistry } from './signals-registry';

// Register all signals components with the global registry
registerCatalog(SignalsCatalog, SignalsRegistry);
