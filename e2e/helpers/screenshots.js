// @ts-check
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR
  || path.join(__dirname, '..', 'screenshots');

/**
 * Capture a full-page baseline screenshot for a flow step.
 * Files are named `<flow>/<step>.png`; steps should carry their own ordering
 * prefix (e.g. `01-login-page`) so re-runs overwrite the same baseline files.
 */
async function snap(page, flow, step) {
  const dir = path.join(SCREENSHOT_DIR, flow);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${step}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

module.exports = { snap, SCREENSHOT_DIR };
