import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4321' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4321/id/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
