// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { snap } = require('../helpers/screenshots');
const { uniqueName } = require('../helpers/ui');
const { createAndSendInbound, receiveShipment } = require('../helpers/flows');

test.describe('Flow 6: putaway', () => {
  test('receive stock into receiving bin then complete a putaway order', async ({ page }) => {
    const description = uniqueName('E2E putaway inbound');
    await login(page, 'admin');

    // Create our own pending putaway item: receive 10 x DS0001 into the
    // default receiving bin.
    await createAndSendInbound(page, { description, product: 'DS0001', quantity: 10 });
    await receiveShipment(page, { quantity: 10 });

    await page.goto('putAway/create');

    // Select the pending receiving-bin group and start the putaway. The
    // candidate list can take a while to load; the checkbox is custom-styled,
    // so click it directly.
    const group = page.getByRole('button', { name: /R-\w+/ }).first();
    await expect(group).toBeVisible({ timeout: 120_000 });
    await snap(page, 'putaway', '01-pending-items');
    await group.locator('input[type="checkbox"]').first().click({ force: true });
    const startButton = page.getByRole('button', { name: 'Start Putaway' }).first();
    await expect(startButton).toBeEnabled();
    await startButton.click();
    await expect(page).toHaveURL(/putAway\/create\/\w+/);

    // The started putaway shows its generated order number.
    const putawayNumber = page.getByText(/P-\w+/).first();
    await expect(putawayNumber).toBeVisible();
    const numberText = ((await putawayNumber.textContent()) || '').match(/P-\w+/)?.[0];
    expect(numberText).toBeTruthy();
    await snap(page, 'putaway', '02-putaway-started');

    await page.getByRole('button', { name: 'Next' }).click();
    await snap(page, 'putaway', '03-putaway-review');
    await page.getByRole('button', { name: 'Complete Putaway' }).last().click();
    // Confirm the dialog (bins are optional in this warehouse).
    await page.getByRole('button', { name: 'Yes' }).click();

    // Completion redirects to the putaway order show page.
    await expect(page.getByText('Putaway Order').first()).toBeVisible();
    await expect(page.getByText(numberText || 'P-').first()).toBeVisible();
    await snap(page, 'putaway', '04-putaway-completed');
  });
});
