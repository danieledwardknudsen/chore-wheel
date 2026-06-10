import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local') });

const isCI = !!process.env['CI'];
const testDbUrl = process.env['DATABASE_URL_TEST']!;

// Dedicated port for the e2e server so it never collides with — or worse,
// reuses — a `pnpm dev` server pointed at the real database. The e2e server
// always runs against DATABASE_URL_TEST.
const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  globalSetup: './e2e/globalSetup.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `next dev --turbopack --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    // WEBAUTHN_ORIGIN must match the e2e port or the passkey origin check fails.
    // RP_ID stays "localhost" (host-only, port-agnostic).
    env: { DATABASE_URL: testDbUrl, WEBAUTHN_ORIGIN: baseURL },
  },
});
