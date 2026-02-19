import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    root: './src',
    env: { LOG_LEVEL: 'silent' },
  },
});
