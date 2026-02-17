import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/server.ts',
        'src/clients/**/*.ts',
        'src/types/**/*.ts',
        'src/types/**/*.d.ts'
      ],
      thresholds: {
        lines: 70,
        functions: 75,
        branches: 65,
        statements: 70
      }
    }
  }
})
