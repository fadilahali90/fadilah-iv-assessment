import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test folder
  testDir: './tests',

  // Execution settings
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // Default Playwright HTML report
  reporter: 'html',

  // Shared settings
  use: {
    // Base URL
    baseURL:
      'https://www.globalsqa.com/angularJs-protractor/BankingProject/#/login',

    // Browser settings
    headless: false,

    launchOptions: {
      slowMo: 300,
      args: ['--disable-popup-blocking'],
    },

    // Evidence settings
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});