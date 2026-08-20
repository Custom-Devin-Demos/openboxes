// @ts-check

/**
 * Shared low-level interaction helpers for the OpenBoxes React SPA
 * (react-select comboboxes, react-datepicker, ReactTable grids) and the
 * legacy GSP pages (Chosen-enhanced selects).
 */

/** Click a wizard form field (by its aria-label), type a query and pick a matching option. */
async function pickField(page, label, query, optionText) {
  const field = page.locator(`[data-testid="form-field"][aria-label="${label}"]`);
  // Click the select's input rather than the wrapper: the wrapper spans the
  // whole form row on some screens, so a center click can miss the control.
  await field.locator('input:visible').first().click();
  await page.keyboard.type(query);
  const option = page
    .locator('[class*="option"]')
    .filter({ hasText: optionText || query })
    .first();
  await option.click();
}

/** Pick an option from an already-open react-select menu. */
async function pickOption(page, optionText) {
  await page.locator('[class*="option"]').filter({ hasText: optionText }).first().click();
}

/**
 * Open a react-datepicker attached to a wizard form field and pick today.
 * Retries because some wizard steps re-render asynchronously and can wipe
 * values set too early.
 */
async function pickToday(page, label) {
  const input = page.locator(`[data-testid="form-field"][aria-label="${label}"] input`).first();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await input.click();
    await page.locator('[class*="day--today"]').first().click().catch(() => {});
    await page.keyboard.press('Escape');
    if ((await input.inputValue().catch(() => '')) !== '') return;
    await page.waitForTimeout(1000);
  }
  throw new Error(`Could not set today's date on "${label}"`);
}

/**
 * Set a Chosen-enhanced legacy <select> (the native element is hidden, so
 * Playwright's selectOption cannot be used).
 */
async function setChosenSelect(page, selectName, optionLabel) {
  await page.evaluate(
    ({ name, label }) => {
      const select = document.querySelector(`select[name="${name}"]`);
      if (!select) throw new Error(`select[name="${name}"] not found`);
      const option = [...select.options].find((o) => o.text === label);
      if (!option) throw new Error(`option "${label}" not found in ${name}`);
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    },
    { name: selectName, label: optionLabel },
  );
}

/** Unique, human-readable run marker so created records are identifiable per run. */
function uniqueName(prefix) {
  return `${prefix} ${Date.now()}`;
}

module.exports = { pickField, pickOption, pickToday, setChosenSelect, uniqueName };
