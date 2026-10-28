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
    // Cloudflare's published test site key: always passes; makes the contact form render in tests.
    env: { PUBLIC_TURNSTILE_SITEKEY: '1x00000000000000000000AA' },
    timeout: 120_000,
  },
});
