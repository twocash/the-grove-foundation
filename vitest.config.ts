import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@core': path.resolve(__dirname, './src/core'),
      '@surface': path.resolve(__dirname, './src/surface'),
      '@foundation': path.resolve(__dirname, './src/foundation'),
      '@explore': path.resolve(__dirname, './src/explore'),
      '@widget': path.resolve(__dirname, './src/widget'),
      '@garden': path.resolve(__dirname, './src/garden'),
      '@bedrock': path.resolve(__dirname, './src/bedrock'),
      '@data': path.resolve(__dirname, './src/data'),
    }
  }
})
