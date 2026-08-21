// Screenshot capture helper for GSP -> React migration evidence.
// Logs in as admin, visits the batch's legacy URLs, and saves full-page
// screenshots. Usage: node shot.js <outputDir>
const { chromium } = require('@playwright/test');

const BASE = 'http://localhost:8080/openboxes';
const outDir = process.argv[2] || '/tmp/shots/before';
const templateId = process.argv[3] || 'ff808081a024ca1801a024cafabe0000';
const urls = [
  ['requisitionTemplate-create', '/requisitionTemplate/create?type=STOCK'],
  ['requisitionTemplate-editHeader', `/requisitionTemplate/editHeader/${templateId}`],
  ['requisitionTemplate-edit', `/requisitionTemplate/edit/${templateId}`],
  ['requisitionTemplate-batch', `/requisitionTemplate/batch/${templateId}`],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/auth/login`);
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('password');
  await page.locator('#loginButton').click();
  await page.waitForLoadState('domcontentloaded');
  const chooser = page.getByTestId('location-chooser-modal');
  if (await chooser.isVisible().catch(() => false)) {
    await chooser.locator('a.element', { hasText: 'Main Warehouse' }).first().click();
    await page.waitForLoadState('domcontentloaded');
  }
  require('fs').mkdirSync(outDir, { recursive: true });
  for (const [name, path] of urls) {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true });
    console.log('captured', name, page.url());
  }
  await browser.close();
})();
