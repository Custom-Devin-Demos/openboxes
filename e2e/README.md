# OpenBoxes UI Characterization Suite

Playwright golden-path tests recorded against the legacy application — the UI
parity oracle for the modernization program.

Quick start (app running with seeded demo data, see
[docs/migration/baseline-setup.md](../docs/migration/baseline-setup.md)):

```bash
npm install
npx playwright install chromium
npm run e2e
```

Full documentation — covered flows, environment variables, CI, and how
migration PRs must use this suite:
[docs/migration/characterization-ui.md](../docs/migration/characterization-ui.md)
