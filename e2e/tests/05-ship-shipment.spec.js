// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { snap } = require('../helpers/screenshots');
const { uniqueName } = require('../helpers/ui');
const { ensureDepot, createAndShipOutbound } = require('../helpers/flows');

test.describe('Flow 5: ship a shipment', () => {
  test('send an outbound shipment and verify shipped status and packing list', async ({ page }) => {
    const description = uniqueName('E2E shipment');
    await login(page, 'admin');
    await ensureDepot(page);

    const identifier = await createAndShipOutbound(page, {
      description,
      product: 'DM0002',
      quantity: 5,
    });
    expect(identifier).toBeTruthy();
    await snap(page, 'ship-shipment', '01-movement-shipped');

    // The stock movement show page reports the movement as shipped.
    await expect(page.getByText('Shipped').first()).toBeVisible();
    // The generated shipment name embeds the description with spaces stripped.
    await expect(page.getByText(description.replace(/\s+/g, '')).first()).toBeVisible();
    // Packing list shows the shipped line item and quantity.
    await expect(page.getByText('DM0002').first()).toBeVisible();

    // The shipment show page also reports the shipment as shipped.
    await page.getByRole('link', { name: `View Shipment ${identifier}` }).click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByText(/shipped/i).first()).toBeVisible();
    await expect(page.getByText('DM0002').first()).toBeVisible();
    await snap(page, 'ship-shipment', '02-shipment-page');
  });
});
