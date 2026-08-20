// @ts-check
const { expect } = require('@playwright/test');

const CREDENTIALS = {
  admin: {
    username: process.env.OB_ADMIN_USER || 'admin',
    password: process.env.OB_ADMIN_PASS || 'password',
  },
  manager: {
    username: process.env.OB_MANAGER_USER || 'manager',
    password: process.env.OB_MANAGER_PASS || 'password',
  },
};

const MAIN_WAREHOUSE = process.env.OB_WAREHOUSE || 'Main Warehouse';

/**
 * Log in through the legacy GSP login form and, if the location chooser is
 * shown, select the given warehouse. Ends on the dashboard.
 */
async function login(page, who = 'admin', warehouseName = MAIN_WAREHOUSE) {
  const { username, password } = CREDENTIALS[who];
  await page.goto('auth/login');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#loginButton').click();
  await page.waitForLoadState('domcontentloaded');

  // The location chooser appears when no location is active in the session.
  const chooser = page.getByTestId('location-chooser-modal');
  if (await chooser.isVisible().catch(() => false)) {
    await chooser.locator('a.element', { hasText: warehouseName }).first().click();
  }
  await expect(page.locator('.navbar, [data-testid="navbar"], nav').first()).toBeVisible();
}

async function logout(page) {
  await page.goto('auth/logout');
}

module.exports = { login, logout, CREDENTIALS, MAIN_WAREHOUSE };
