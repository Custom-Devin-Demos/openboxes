// @ts-check
const { expect } = require('@playwright/test');
const { pickField, pickOption, pickToday } = require('./ui');

const DEPOT_NAME = process.env.OB_E2E_DEPOT || 'E2E Depot';

/**
 * Ensure a second Depot location exists so outbound movements and stock
 * requests have a destination/fulfilling location other than the main
 * warehouse. Idempotent: only creates the location on first run.
 *
 * The location list/edit screens are React (they fetch their data through
 * /api/locations/search), so this waits for the list data and drives the
 * React form fields rather than the legacy GSP inputs.
 */
async function ensureDepot(page) {
  const listResponse = page.waitForResponse((r) => r.url().includes('/api/locations/search'));
  await page.goto('location/list');
  await listResponse.catch(() => {});
  if (await page.locator(`text=${DEPOT_NAME}`).count()) return;

  await page.goto('location/edit');
  const nameInput = page
    .locator('[data-testid="form-field"][aria-label="Name"] input:visible')
    .first();
  const typeField = page.locator('[data-testid="form-field"][aria-label="Location Type"]');
  // The form re-initializes asynchronously after mount (location types load
  // and set the default type), so verify the values settled and retry when a
  // re-render wiped them.
  await expect(typeField).toContainText('Depot', { timeout: 15_000 });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!(await nameInput.inputValue().catch(() => ''))) {
      await nameInput.fill(DEPOT_NAME);
    }
    if (!(((await typeField.textContent().catch(() => '')) || '').includes('Depot'))) {
      await pickField(page, 'Location Type', 'Depot');
    }
    const orgField = page.locator('[data-testid="form-field"][aria-label="Organization"]');
    if (!(((await orgField.textContent().catch(() => '')) || '').includes('Main Organization'))) {
      await pickField(page, 'Organization', 'Main Organization');
    }
    await page.waitForTimeout(1000);
    if (!(await nameInput.inputValue().catch(() => ''))) continue;
    await page.locator('button:has-text("Save")').first().click();
    const saved = await page
      .waitForURL(/location\/edit\/\w+/, { timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (saved) return;
  }
  throw new Error('Could not create depot: location edit form kept resetting its fields');
}

/**
 * Ensure the admin user has the "Invoice user" supplemental role, which the
 * invoicing section requires on top of superuser. Idempotent; returns true
 * when the role was newly granted (callers must then re-login so the session
 * picks up the new role).
 */
async function ensureInvoiceRole(page) {
  await page.goto('user/edit/1');
  await page.locator('a[href="#authorization-tab"]').click();
  const choices = page.locator('.chosen-choices');
  await expect(choices.first()).toBeVisible();
  if (await page.locator('.chosen-choices li', { hasText: 'Invoice user' }).count()) {
    return false;
  }
  await page.locator('.chosen-choices input').first().click();
  await page.keyboard.type('Invoice');
  await page.locator('.chosen-results li.active-result', { hasText: 'Invoice user' }).first().click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.waitForLoadState('domcontentloaded');
  return true;
}

/**
 * Fill the SEND_SHIPMENT wizard step (shipment type + expected delivery date)
 * and click "Send shipment". The step re-renders asynchronously once shipment
 * data loads, which can wipe values set too early, so this verifies the
 * values right before sending and retries when they were reset.
 */
async function sendShipmentStep(page) {
  const typeField = page.locator('[data-testid="form-field"][aria-label="Shipment type"]');
  const dateInput = page
    .locator('[data-testid="form-field"][aria-label="Expected Delivery Date"] input')
    .first();
  const sendButton = page.getByRole('button', { name: 'Send shipment' });
  await expect(sendButton).toBeVisible();
  await page.waitForLoadState('networkidle').catch(() => {});

  for (let attempt = 0; attempt < 4; attempt += 1) {
    // The click may have gone through even when the detached-wait below timed
    // out (e.g. a slow re-render); if we already left the send step, be done.
    if (!(await sendButton.isVisible().catch(() => false))) return;
    if (!(((await typeField.textContent().catch(() => '')) || '').includes('Land'))) {
      await typeField.click();
      await pickOption(page, 'Land');
    }
    if (!(await dateInput.inputValue().catch(() => ''))) {
      await pickToday(page, 'Expected Delivery Date');
    }
    // Give any pending re-render a moment, then confirm nothing was wiped.
    await page.waitForTimeout(1000);
    if (!(((await typeField.textContent().catch(() => '')) || '').includes('Land'))) continue;
    if (!(await dateInput.inputValue().catch(() => ''))) continue;
    await sendButton.click();
    const sent = await sendButton
      .waitFor({ state: 'detached', timeout: 20_000 })
      .then(() => true)
      .catch(() => false);
    if (sent) return;
  }
  throw new Error('Could not send shipment: send step kept resetting its fields');
}

/**
 * Create an inbound stock movement from Main Supplier, add one line item and
 * send the shipment. Leaves the wizard on the SEND_SHIPMENT step with the
 * "Receive" link available. Returns the stock movement id from the URL.
 */
async function createAndSendInbound(page, { description, product, quantity }) {
  await page.goto('stockMovement/createInbound?direction=INBOUND');
  await page.locator('#description').fill(description);
  await pickField(page, 'Origin', 'Main Supplier');
  await pickField(page, 'Requested By', 'admin', 'Administrator');
  await pickToday(page, 'Date Requested');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/createInbound\/\w+/);
  const movementId = page.url().match(/createInbound\/(\w+)/)?.[1] ?? null;

  const row = page.locator('[data-testid="items-table"] .rt-tbody-v2 .rt-tr').first();
  const cells = row.locator('[data-testid="table-cell"]');
  await cells.nth(2).locator('[class*="control"]').first().click();
  await page.keyboard.type(product);
  await pickOption(page, product);
  await cells.nth(5).locator('input:visible').first().fill(String(quantity));
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/step=SEND_SHIPMENT/);
  await sendShipmentStep(page);
  await expect(page.getByRole('link', { name: 'Receive' })).toBeVisible();

  return movementId;
}

/**
 * From the SEND_SHIPMENT step of a sent inbound movement, open partial
 * receiving and receive the full quantity of the first line.
 */
async function receiveShipment(page, { quantity }) {
  await page.getByRole('link', { name: 'Receive' }).click();
  await expect(page).toHaveURL(/partialReceiving\/create\/\w+/);
  const input = page.locator('input[id$=".quantityReceiving"]').first();
  await input.fill(String(quantity));
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'Receive shipment' })).toBeEnabled();
  await page.getByRole('button', { name: 'Receive shipment' }).click();
  // Receiving completes back on the receiving screen; the shipment is now received.
  await expect(page.getByText(/received/i).first()).toBeVisible();
}

/**
 * Create an outbound stock movement to the e2e depot, progress it through
 * add items -> edit -> pick -> send, and ship it. Ends on the stock movement
 * show page. Returns the movement's identifier shown in the UI.
 */
async function createAndShipOutbound(page, { description, product, quantity }) {
  await page.goto('stockMovement/createOutbound?direction=OUTBOUND');
  await page.locator('#description').fill(description);
  await pickField(page, 'Destination', DEPOT_NAME);
  await pickField(page, 'Requested By', 'Manager');
  await pickToday(page, 'Date Requested');
  await page.locator('[data-testid="form-field"][aria-label="Request type"]').click();
  await pickOption(page, 'Adhoc');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/createOutbound\/\w+/);

  // Add items step: pick the product in the first editable row.
  const row = page.locator('.rt-tr, [role="row"], tr').filter({ hasText: 'Delete' }).first();
  await row.locator('[class*="control"]').first().click();
  await page.keyboard.type(product);
  await pickOption(page, product);
  await page.locator('input[id*="quantityRequested"]').first().fill(String(quantity));
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Next' }).click(); // -> edit
  await page.getByRole('button', { name: 'Next' }).click(); // -> pick

  // Pick step shows requested and picked quantities for the line.
  await expect(page.getByText(product).first()).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click(); // -> send

  await sendShipmentStep(page);
  await expect(page).toHaveURL(/stockMovement\/show\/\w+/);

  const requisitionLink = page.getByRole('link', { name: /View Requisition \w+/ });
  await expect(requisitionLink).toBeVisible();
  const text = (await requisitionLink.innerText()) || '';
  return text.match(/View Requisition\s+(\w+)/)?.[1] ?? null;
}

module.exports = {
  DEPOT_NAME,
  ensureDepot,
  ensureInvoiceRole,
  sendShipmentStep,
  createAndSendInbound,
  receiveShipment,
  createAndShipOutbound,
};
