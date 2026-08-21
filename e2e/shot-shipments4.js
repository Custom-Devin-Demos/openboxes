// Screenshot capture helper for GSP -> React migration evidence (shipments-4).
// Usage: SHIPMENT_ITEM_ID=... SHIPMENT_WORKFLOW_ID=... node shot-shipments4.js <outputDir>
const { chromium } = require('@playwright/test');

const BASE = 'http://localhost:8080/openboxes';
const outDir = process.argv[2] || '/tmp/shots/before';
const shipmentItemId = process.env.SHIPMENT_ITEM_ID;
const shipmentWorkflowId = process.env.SHIPMENT_WORKFLOW_ID || '1';
const urls = [
  ['shipmentItem-split', `/shipmentItem/split/${shipmentItemId}`],
  ['shipmentWorkflow-list', '/shipmentWorkflow/list'],
  ['shipmentWorkflow-create', '/shipmentWorkflow/create'],
  ['shipmentWorkflow-edit', `/shipmentWorkflow/edit/${shipmentWorkflowId}`],
  ['shipmentWorkflow-show', `/shipmentWorkflow/show/${shipmentWorkflowId}`],
];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_BIN });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/auth/login`);
  await page.locator('#username').fill('admin');
  await page.locator('#password').fill('password');
  await page.locator('#loginButton').click();
  await page.waitForLoadState('domcontentloaded');
  async function dismissChooser() {
    const title = await page.title().catch(() => '');
    if (title !== 'Choose Location') return;
    const warehouse = page.locator('a', { hasText: 'Main Warehouse' }).first();
    if (await warehouse.isVisible().catch(() => false)) {
      await warehouse.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }
  }
  await dismissChooser();
  require('fs').mkdirSync(outDir, { recursive: true });
  for (const [name, path] of urls) {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    await dismissChooser();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${outDir}/${name}.png`, animations: 'disabled', timeout: 60000,
    });
    console.log('captured', name, page.url());
  }
  await browser.close();
})();
