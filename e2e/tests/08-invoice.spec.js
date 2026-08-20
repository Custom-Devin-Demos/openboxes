// @ts-check
const { test, expect } = require('@playwright/test');
const { login, logout } = require('../helpers/auth');
const { snap } = require('../helpers/screenshots');
const { pickField, pickOption, pickToday, uniqueName } = require('../helpers/ui');
const { ensureInvoiceRole } = require('../helpers/flows');

test.describe('Flow 8: invoice (create/view)', () => {
  test('create an invoice for the supplier organization and view it', async ({ page }) => {
    const vendorInvoiceNumber = uniqueName('E2E-VINV').replace(/\s+/g, '-');
    await login(page, 'admin');

    // Invoicing needs the "Invoice user" supplemental role on top of
    // superuser; grant it once through the user admin screen.
    if (await ensureInvoiceRole(page)) {
      await logout(page);
      await login(page, 'admin');
    }

    await page.goto('invoice/create');
    await expect(page).toHaveURL(/invoice\/create/);
    await snap(page, 'invoice', '01-create-form');

    await pickField(page, 'Vendor', 'Supplier', 'Supplier Organization');
    await page
      .locator('[data-testid="form-field"][aria-label="Vendor Invoice Number"] input')
      .fill(vendorInvoiceNumber);
    await pickToday(page, 'Invoice Date');
    await page.locator('[data-testid="form-field"][aria-label="Currency"]').click();
    await pickOption(page, 'US Dollar');
    await snap(page, 'invoice', '02-form-filled');

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page).toHaveURL(/invoice\/create\/\w+/);

    // The generated invoice number is shown in the wizard header.
    const header = page.getByText(/Invoice \| \w+/).first();
    await expect(header).toBeVisible();
    const invoiceNumber = ((await header.textContent()) || '').match(/Invoice \| (\w+)/)?.[1];
    expect(invoiceNumber).toBeTruthy();
    await snap(page, 'invoice', '03-add-items');

    // Note: invoice line items can only be pulled from purchase-order backed
    // shipments, which the demo dataset does not contain; the characterization
    // covers invoice header create + view.
    await page.getByText('Save and exit').click();
    await expect(page).toHaveURL(/invoice\/show\/\w+/);

    // Show page: invoice number, vendor, vendor invoice number and Pending status.
    await expect(page.getByText(invoiceNumber || '').first()).toBeVisible();
    await expect(page.getByText('Supplier Organization').first()).toBeVisible();
    await expect(page.getByText(vendorInvoiceNumber).first()).toBeVisible();
    await expect(page.getByText('Pending').first()).toBeVisible();
    await expect(page.getByText('Purchase Invoice').first()).toBeVisible();
    await snap(page, 'invoice', '04-invoice-show');

    // Legacy behavior: the invoice list is backed by the `invoice_list` SQL
    // view, which filters on invoice items — header-only invoices (the only
    // kind the demo dataset supports, having no purchase-order backed
    // shipments) do not appear even when searched by number.
    await page.goto('invoice/list');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.getByPlaceholder(/Search by invoice number/).fill(invoiceNumber || '');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('No invoices match the given criteria')).toBeVisible();
    await snap(page, 'invoice', '05-invoice-list');
  });
});
