// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { snap } = require('../helpers/screenshots');
const { pickField, pickOption, pickToday, uniqueName } = require('../helpers/ui');
const { ensureDepot, DEPOT_NAME } = require('../helpers/flows');

test.describe('Flow 4: create and progress an outbound stock movement', () => {
  test('create outbound movement, add item, pick and reach the send step', async ({ page }) => {
    const description = uniqueName('E2E outbound');
    await login(page, 'admin');
    await ensureDepot(page);

    await page.goto('stockMovement/createOutbound?direction=OUTBOUND');
    await snap(page, 'outbound', '01-create');

    await page.locator('#description').fill(description);
    await pickField(page, 'Destination', DEPOT_NAME);
    await pickField(page, 'Requested By', 'Manager');
    await pickToday(page, 'Date Requested');
    await page.locator('[data-testid="form-field"][aria-label="Request type"]').click();
    await pickOption(page, 'Adhoc');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(/createOutbound\/\w+/);
    await snap(page, 'outbound', '02-add-items');

    // Add DM0002 x 5 as the single line item.
    const row = page.locator('.rt-tr, [role="row"], tr').filter({ hasText: 'Delete' }).first();
    await row.locator('[class*="control"]').first().click();
    await page.keyboard.type('DM0002');
    await pickOption(page, 'DM0002');
    await page.locator('input[id*="quantityRequested"]').first().fill('5');
    await page.keyboard.press('Tab');
    await snap(page, 'outbound', '03-item-filled');

    await page.getByRole('button', { name: 'Next' }).click(); // -> edit
    await snap(page, 'outbound', '04-edit-step');
    await page.getByRole('button', { name: 'Next' }).click(); // -> pick

    // Pick step: line is auto-picked from the seeded lot with the requested quantity.
    await expect(page.getByText('DM0002').first()).toBeVisible();
    await expect(page.getByText('LOT-AMX-001').first()).toBeVisible();
    await snap(page, 'outbound', '05-pick-step');

    await page.getByRole('button', { name: 'Next' }).click(); // -> send
    await expect(page.getByRole('button', { name: 'Send shipment' })).toBeVisible();
    // Send step summarises origin and destination of the movement.
    await expect(page.getByText(DEPOT_NAME).first()).toBeVisible();
    await snap(page, 'outbound', '06-send-step');
  });
});
