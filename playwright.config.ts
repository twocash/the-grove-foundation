import { defineConfig } from '@playwright/test'

export default defineConfig({
  timeout: 30000,
  reporter: [
    ['html'],
    ['list'],
    ['./tests/reporters/health-reporter.ts', {
      baseUrl: process.env.HEALTH_API_URL || 'http://localhost:8080'
    }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'e2e',
      testDir: './tests/e2e',
    },
    {
      name: 'visual-qa',
      testDir: './tests/visual-qa',
    },
  ],
})
