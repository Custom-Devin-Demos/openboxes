// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { snap } = require('../helpers/screenshots');
const { pickField, pickOption, uniqueName } = require('../helpers/ui');
const { ensureDepot, DEPOT_NAME } = require('../helpers/flows');

test.describe('Flow 3: create requisition (stock request)', () => {
  test('create an adhoc stock request and submit it', async ({ page }) => {
    const description = uniqueName('E2E requisition');
    await login(page, 'admin');
    await ensureDepot(page);

    await page.goto('stockMovement/createRequest');
    await snap(page, 'create-requisition', '01-create-request');

    await page.locator('#description').fill(description);
    await pickField(page, 'Fulfilling location', DEPOT_NAME);
    await page.locator('[data-testid="form-field"][aria-label="Request type"]').click();
    await pickOption(page, 'Adhoc');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(/createRequest\/\w+/);
    await snap(page, 'create-requisition', '02-add-items');

    // Add one requested line item.
    await page.locator('[class*="control"]').first().click();
    await page.keyboard.type('DM0003');
    await pickOption(page, 'DM0003');
    await page.locator('[id="lineItems[0].quantityRequested"]').fill('4');
    await page.keyboard.press('Tab');
    await snap(page, 'create-requisition', '03-item-filled');

    await page.getByRole('button', { name: 'Submit request' }).click();

    // Submission confirms with the new requisition number and redirects to the list.
    const toast = page.getByText(/stock movement number \w+/);
    await expect(toast).toBeVisible();
    const toastText = (await toast.textContent()) || '';
    const identifier = (toastText.match(/stock movement number (\w+)/) || [])[1];
    expect(identifier).toBeTruthy();
    await snap(page, 'create-requisition', '04-submitted');

    // The requisition appears in the movement list as Pending with its identifier.
    const row = page.locator('.rt-tr, [role="row"], tr').filter({ hasText: description }).first();
    await expect(row).toBeVisible();
    await expect(row.getByText(identifier)).toBeVisible();
    await expect(row.getByText('Pending')).toBeVisible();
    await snap(page, 'create-requisition', '05-listed-pending');
  });
});
