// Page-level time-to-interactive smoke for OpenBoxes (Phase 4.3).
// Run from e2e/: node perf-timing.js
// Reuses the characterization suite's auth helper. Not a @playwright/test suite:
// plain script so we can time navigations precisely.
const { chromium } = require('@playwright/test');
const { login } = require('./helpers/auth');

const BASE = `${(process.env.BASE_URL || 'http://localhost:8080/openboxes').replace(/\/+$/, '')}/`;
const RUNS = Number(process.env.RUNS || 5);

// "Ready" = navigation complete + a page-specific element visible + network idle.
const PAGES = [
  { name: 'dashboard', path: 'dashboard/index', ready: '.dashboard-container, [data-testid="dashboard"], .page-item, canvas' },
  { name: 'product list', path: 'product/list', ready: 'table, .ReactTable, [data-testid="data-table"]' },
  { name: 'stock movement list (outbound)', path: 'stockMovement/list?direction=OUTBOUND', ready: 'table, .ReactTable, [data-testid="data-table"]' },
  { name: 'stock movement create', path: 'stockMovement/createOutbound', ready: 'form, .create-page, .panel-body' },
  { name: 'receiving (inbound list)', path: 'stockMovement/list?direction=INBOUND', ready: 'table, .ReactTable, [data-testid="data-table"]' },
  { name: 'order list', path: 'order/list', ready: 'table, .ReactTable, [data-testid="data-table"]' },
];

function stats(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const median = s[Math.floor(s.length / 2)];
  return { median, min: s[0], max: s[s.length - 1] };
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await login(page, 'admin');

  const results = [];
  for (const p of PAGES) {
    // warm-up visit (discarded): primes SPA bundle cache + server-side caches
    await page.goto(p.path, { waitUntil: 'load' }).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});

    const times = [];
    for (let i = 0; i < RUNS; i += 1) {
      await page.goto('about:blank');
      const t0 = Date.now();
      await page.goto(p.path, { waitUntil: 'load' });
      await page.locator(p.ready).first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
      times.push(Date.now() - t0);
    }
    const st = stats(times);
    results.push({ page: p.name, path: p.path, runs: times, ...st });
    console.log(`${p.name.padEnd(35)} median=${st.median}ms min=${st.min} max=${st.max} runs=[${times.join(', ')}]`);
  }
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
