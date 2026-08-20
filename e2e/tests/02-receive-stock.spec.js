// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { snap } = require('../helpers/screenshots');
const { uniqueName } = require('../helpers/ui');
const { createAndSendInbound, receiveShipment } = require('../helpers/flows');

test.describe('Flow 2: receive stock (inbound stock movement + partial receiving)', () => {
  test('create inbound movement, send it and receive the full quantity', async ({ page }) => {
    const description = uniqueName('E2E inbound');
    await login(page, 'admin');

    await page.goto('stockMovement/createInbound?direction=INBOUND');
    await snap(page, 'receive-stock', '01-create-inbound');

    const movementId = await createAndSendInbound(page, {
      description,
      product: 'DM0001',
      quantity: 10,
    });
    expect(movementId).toBeTruthy();
    await snap(page, 'receive-stock', '02-shipment-sent');

    await receiveShipment(page, { quantity: 10 });
    await snap(page, 'receive-stock', '03-shipment-received');

    // The inbound list shows the movement with a Received status.
    await page.goto('stockMovement/list?direction=INBOUND');
    const row = page.locator('.rt-tr, [role="row"], tr').filter({ hasText: description }).first();
    await expect(row).toBeVisible();
    await expect(row.getByText('Received')).toBeVisible();
    await snap(page, 'receive-stock', '04-inbound-list-received');
  });
});
