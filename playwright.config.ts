import { defineConfig, devices } from '@playwright/test';

// The dev server of this site: the published port 10103 plus one, as
// `vite.config.ts` fixes it with `strictPort`. Never Vite's stock 5173.
const DEV_SERVER_PORT = 10104;
const baseURL = `http://localhost:${DEV_SERVER_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // One server: the enumeration runs in the page, so there is nothing behind it.
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
    timeout: 120_000,
  },
});
