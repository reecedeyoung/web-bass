import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    globalSetup: './src/globalSetup.ts',
    testTimeout: 30_000,
    // Single worker: test files run serially, token cache shared across files,
    // and we avoid hammering Cognito with parallel InitiateAuth calls.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    reporters: ['verbose'],
  },
})
