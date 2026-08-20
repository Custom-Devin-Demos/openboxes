// @ts-check
const { test, expect } = require('@playwright/test');
const { login, logout, CREDENTIALS } = require('../helpers/auth');
const { snap } = require('../helpers/screenshots');

test.describe('Flow 1: login', () => {
  test('admin can log in and reach the dashboard', async ({ page }) => {
    await page.goto('auth/login');
    await snap(page, 'login', '01-login-page');
    await page.locator('#username').fill(CREDENTIALS.admin.username);
    await page.locator('#password').fill(CREDENTIALS.admin.password);
    await page.locator('#loginButton').click();
    await page.waitForLoadState('domcontentloaded');

    const chooser = page.getByTestId('location-chooser-modal');
    if (await chooser.isVisible().catch(() => false)) {
      await snap(page, 'login', '02-admin-location-chooser');
      await chooser.locator('a.element', { hasText: 'Main Warehouse' }).first().click();
    }

    // Dashboard (React SPA) with the logged-in user's menu.
    await expect(page).toHaveURL(/dashboard|openboxes/);
    await expect(page.locator('.navbar').first()).toBeVisible();
    await snap(page, 'login', '03-admin-dashboard');
    await logout(page);
  });

  test('non-admin (manager) can log in and reach the dashboard', async ({ page }) => {
    await login(page, 'manager');
    await expect(page.locator('.navbar').first()).toBeVisible();
    await snap(page, 'login', '04-manager-dashboard');
    await logout(page);
  });

  test('wrong password is rejected', async ({ page }) => {
    await page.goto('auth/login');
    await page.locator('#username').fill(CREDENTIALS.admin.username);
    await page.locator('#password').fill('definitely-wrong');
    await page.locator('#loginButton').click();
    // Stays on the login page with the form re-rendered.
    await expect(page.locator('#username')).toBeVisible();
    await expect(page).toHaveURL(/auth/);
    await snap(page, 'login', '05-rejected-login');
  });
});
