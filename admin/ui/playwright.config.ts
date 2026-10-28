import { defineConfig, devices } from '@playwright/test';

const PORT = 8788;
export const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  // Satu server bersama dengan satu basis data: uji berjalan berurutan.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium', testIgnore: /global\.setup\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } }, dependencies: ['setup'] },
  ],
  webServer: {
    command: 'npx tsx ui/e2e/stack.ts',
    cwd: `${import.meta.dirname}/..`,
    url: `${BASE_URL}/api/config`,
    reuseExistingServer: false,
    env: { PORT: String(PORT) },
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 60_000,
  },
});
