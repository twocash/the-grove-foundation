// src/core/index.ts
// Main barrel export for the Core module
// The Core module contains pure TypeScript types, logic engines, and configuration
// It has NO React dependencies and can be used anywhere

// Schema (types)
export * from './schema';

// Engine (pure logic)
export * from './engine';

// Config (defaults and constants)
export * from './config';

// Transformers (v0.14: Reality Projector)
export * from './transformers';

// Cache (v0.14: Reality Projector)
export * from './cache';
