import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 300000,
  reporter: [['allure-playwright'], ['html']],
  use: {
    baseURL: 'http://31.97.61.59:6030',
    video: 'on',
    screenshot: 'on',
    trace: 'on-first-retry',
    headless: false,
    navigationTimeout: 30000,
    actionTimeout: 10000,
    viewport: { width: 1920, height: 945 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
