import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: { '@': path.join(dir, 'src') },
  },
  test: {
    environment: 'node',
    setupFiles: [path.join(dir, 'vitest.setup.ts')],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
