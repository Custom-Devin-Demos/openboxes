// @ts-check
const { defineConfig } = require('@playwright/test');

/**
 * Playwright characterization suite for OpenBoxes golden paths.
 *
 * Environment variables:
 *   BASE_URL          - app root incl. context path (default: http://localhost:8080/openboxes)
 *   OB_ADMIN_USER     - admin username  (default: admin)
 *   OB_ADMIN_PASS     - admin password  (default: password)
 *   OB_MANAGER_USER   - non-admin username (default: manager)
 *   OB_MANAGER_PASS   - non-admin password (default: password)
 *
 * The suite runs serially with one worker: later flows reuse the app state
 * (e.g. putaway consumes stock received by the inbound flow) and the legacy
 * app is not safe for concurrent wizard sessions from one user.
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 300_000,
  expect: { timeout: 30_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  outputDir: './test-results',
  use: {
    // Ensure trailing slash so the context path (/openboxes) is preserved when
    // tests navigate to relative paths like 'auth/login'.
    baseURL: `${(process.env.BASE_URL || 'http://localhost:8080/openboxes').replace(/\/+$/, '')}/`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
});
