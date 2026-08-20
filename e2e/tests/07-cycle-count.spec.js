// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/auth');
const { snap } = require('../helpers/screenshots');
const { pickOption } = require('../helpers/ui');

const PRODUCT = 'DM0003';

/** Locate the table row containing the product on the current cycle-count tab. */
function productRow(page) {
  return page.locator('.rt-tr, [role="row"], tr').filter({ hasText: PRODUCT }).first();
}

/**
 * The cycle-count table uses custom-styled checkboxes whose action buttons
 * enable asynchronously; retry until the row is selected and the button is
 * actionable.
 */
async function selectRowAndAwait(page, row, buttonName) {
  const checkbox = row.locator('input[type="checkbox"]').first();
  const button = page.getByRole('button', { name: buttonName });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (!(await checkbox.isChecked().catch(() => false))) {
      await checkbox.click({ force: true });
    }
    await page.waitForTimeout(800);
    if ((await checkbox.isChecked().catch(() => false)) && (await button.isEnabled().catch(() => false))) {
      return button;
    }
  }
  throw new Error(`Could not select row and enable "${buttonName}"`);
}

/** Extract the quantity (last all-digit line) from a cycle-count table row. */
async function rowQuantity(row) {
  const lines = (await row.innerText()).split('\n').map((l) => l.trim());
  const digits = lines.filter((l) => /^\d+$/.test(l));
  return digits.length ? digits[digits.length - 1] : null;
}

test.describe('Flow 7: cycle count', () => {
  test('mark a product to count, record matching count and save', async ({ page }) => {
    await login(page, 'admin');

    // Idempotency: clear any leftover resolution for the product from a
    // previous interrupted run so it can be marked "to count" again.
    await page.goto('inventory/cycleCount?tab=TO_RESOLVE');
    await page.waitForLoadState('networkidle').catch(() => {});
    if (await productRow(page).count()) {
      const cancel = await selectRowAndAwait(page, productRow(page), 'Cancel count');
      await cancel.click();
      await page.getByRole('button', { name: 'Confirm' }).click();
      await expect(productRow(page)).toHaveCount(0);
    }

    // Reuse an existing "to count" entry if a previous run left one behind.
    await page.goto('inventory/cycleCount?tab=TO_COUNT');
    await page.waitForLoadState('networkidle').catch(() => {});
    if (!(await productRow(page).count())) {
      await page.goto('inventory/cycleCount?tab=ALL_PRODUCTS');
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(productRow(page)).toBeVisible();
      await snap(page, 'cycle-count', '01-all-products');
      const mark = await selectRowAndAwait(page, productRow(page), 'Mark as To Count');
      await mark.click();
      await expect(page).toHaveURL(/tab=TO_COUNT/);
    }

    // The product is queued to count with its current system quantity shown.
    const row = productRow(page);
    await expect(row).toBeVisible();
    await expect(row.getByText('To count')).toBeVisible();
    const quantity = await rowQuantity(row);
    expect(quantity).toBeTruthy();
    await snap(page, 'cycle-count', '02-to-count');

    const start = await selectRowAndAwait(page, row, 'Start count');
    await start.click();
    await expect(page).toHaveURL(/cycleCount\/count/);
    await expect(page.getByText(PRODUCT).first()).toBeVisible();

    // Record a count matching the system quantity (no discrepancy to resolve,
    // keeping the flow re-runnable without changing stock). The count form
    // re-renders asynchronously and can wipe early input, so set the fields
    // and verify they stuck before moving on.
    await page.waitForLoadState('networkidle').catch(() => {});
    const countInput = page.locator('input[type="number"]').first();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if ((await countInput.inputValue().catch(() => '')) !== String(quantity)) {
        await countInput.fill(String(quantity));
      }
      if (!(await page.getByText('Miss Administrator').first().isVisible().catch(() => false))) {
        await page.getByText('Select', { exact: true }).first().click();
        await pickOption(page, 'Miss Administrator');
      }
      await page.waitForTimeout(1000);
      if ((await countInput.inputValue().catch(() => '')) === String(quantity)) break;
    }
    await expect(countInput).toHaveValue(String(quantity));
    await snap(page, 'cycle-count', '03-count-form');
    await page.getByRole('button', { name: 'Next' }).click();

    // Review screen shows the recorded count before saving.
    await expect(page.getByText(PRODUCT).first()).toBeVisible();
    await expect(page.getByText('Miss Administrator').first()).toBeVisible();
    await expect(page.getByText(String(quantity)).first()).toBeVisible();
    await snap(page, 'cycle-count', '04-review');

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).toHaveURL(/inventory\/cycleCount\?tab=/);
    await snap(page, 'cycle-count', '05-saved');

    // A matching count completes the cycle count: the product leaves the
    // "to count" queue and its system quantity is unchanged.
    await page.goto('inventory/cycleCount?tab=TO_COUNT');
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.getByText('selected').first()).toBeVisible();
    await expect(productRow(page)).toHaveCount(0);

    await page.goto('inventory/cycleCount?tab=ALL_PRODUCTS');
    await page.waitForLoadState('networkidle').catch(() => {});
    const finalRow = productRow(page);
    await expect(finalRow).toBeVisible();
    expect(await rowQuantity(finalRow)).toBe(quantity);
    await snap(page, 'cycle-count', '06-all-products-after');
  });
});
