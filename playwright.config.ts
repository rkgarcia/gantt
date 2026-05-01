import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/playwright-output',
  snapshotDir: './tests/snapshots',
  reporter: [['list'], ['html', { outputFolder: 'tests/playwright-report', open: 'never' }]],

  use: {
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
