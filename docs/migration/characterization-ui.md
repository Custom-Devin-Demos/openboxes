# UI Characterization Suite (Playwright golden paths)

The Playwright suite under [`e2e/`](../../e2e) records the behavior of the
**current legacy application** across its golden-path workflows. It is the UI
parity oracle for the modernization program: every later migration PR (Grails
upgrades, GSP→React rewrites) must keep this suite green to prove the user-facing
behavior is unchanged.

## Covered flows

| # | Spec | Flow | Key assertions |
|---|------|------|----------------|
| 1 | `01-login.spec.js` | Login (admin + non-admin `manager`), wrong password rejected | dashboard reached per user, login page re-shown on bad credentials |
| 2 | `02-receive-stock.spec.js` | Inbound stock movement + partial receiving screen | generated movement ID, requested quantity, received quantity, `Received` status in list |
| 3 | `03-create-requisition.spec.js` | Create requisition (adhoc stock request) | generated requisition ID, requested item/quantity, `Pending` status in list |
| 4 | `04-outbound-stock-movement.spec.js` | Create + progress outbound movement (add items → edit → pick) | picked lot number, item/quantity on the send step, destination |
| 5 | `05-ship-shipment.spec.js` | Ship a shipment | `Shipped` status, packing-list contents on the shipment page |
| 6 | `06-putaway.spec.js` | Putaway from receiving bin | generated `P-...` putaway number, completed putaway order |
| 7 | `07-cycle-count.spec.js` | Cycle count (mark to count → count → save) | counted quantity matches system quantity, product leaves the To Count queue, quantity unchanged |
| 8 | `08-invoice.spec.js` | Invoice create/view | generated invoice number, vendor, vendor invoice number, `Pending` status; legacy list behavior for header-only invoices |

Each flow asserts on **meaningful data outcomes** (quantities, statuses, record
IDs visible in the UI), not just page loads, and captures full-page baseline
screenshots per step under `e2e/screenshots/<flow>/` (stable filenames, so
re-runs refresh the same baselines). These screenshots are the "before" baseline
for later phases.

## How to run

Prerequisite: the legacy app is running with seeded demo data (see
[baseline-setup.md](baseline-setup.md)) — database up, demo data loaded, app at
`http://localhost:8080/openboxes`.

```bash
cd e2e
npm install                  # once; Node >= 18 (the app's Node 14 constraint applies only to the app bundle)
npx playwright install chromium   # once
npm run e2e
```

Useful variants: `npm run e2e:headed` (watch the browser), `npm run e2e:report`
(open the HTML report from the last run).

### Environment variables

| Variable | Default | Meaning |
|----------|---------|---------|
| `BASE_URL` | `http://localhost:8080/openboxes` | App base URL (the `/openboxes` context path is required) |
| `OB_ADMIN_USER` / `OB_ADMIN_PASS` | `admin` / `password` | Superuser credentials |
| `OB_MANAGER_USER` / `OB_MANAGER_PASS` | `manager` / `password` | Non-admin credentials (seeded by `docker/seed-demo-data.sql`) |
| `OB_WAREHOUSE` | `Main Warehouse` | Depot the tests log into |
| `OB_E2E_DEPOT` | `E2E Depot` | Destination depot the suite creates (once) for outbound flows |
| `SCREENSHOT_DIR` | `e2e/screenshots` | Where baseline screenshots are written |

### Determinism / re-runnability

The suite is re-runnable against the same database without manual cleanup:

- Flows that need records **create their own** (inbound/outbound movements,
  requisitions, invoices) with unique per-run names, and assert on the
  UI-generated identifiers.
- One-time setup is **idempotent**: the `E2E Depot` destination and the admin's
  `Invoice user` role are created only if missing.
- The cycle count records a count **matching** the system quantity (no
  discrepancy, no stock change) and cleans up leftover to-count/to-resolve
  state from interrupted runs.

## CI

`.github/workflows/e2e-characterization.yml` runs the suite on GitHub Actions
against a freshly booted legacy app (MariaDB service container → Liquibase
migrations → demo seed → restart → Playwright). It is **manual
(`workflow_dispatch`) for now**: a cold boot runs the full migration chain
(~5–10 min) plus the Gradle build and frontend bundle, making the job
~30–45 minutes — too slow to gate every PR while the suite is young. Run it
manually before and after migration-heavy changes; promote it to a
pull-request trigger once boot time is optimized (e.g. cached DB snapshot
after migrations).

The Playwright HTML report, traces and baseline screenshots are uploaded as
workflow artifacts (`e2e-characterization-artifacts`).

## How future PRs must use this suite

1. **Run the suite before your change** (or take the latest green run) to
   confirm a green baseline, and keep the produced `e2e/screenshots/` as the
   "before" reference.
2. **Run the suite after your change.** All 8 flows must pass unmodified.
   A failing flow means user-visible behavior changed — fix the regression
   rather than editing the test.
3. **If a behavior change is intentional** (e.g. a GSP page replaced by React),
   update the affected spec in the same PR, explain the difference in the PR
   description, and attach before/after screenshots from `e2e/screenshots/`.
4. New golden-path features added during modernization should get their own
   characterization spec here.

## Known caveats

- **Invoice line items**: the demo dataset has no purchase-order backed
  shipments, so invoices can only be created as headers (no items). The legacy
  `invoice_list` SQL view filters on invoice items, so header-only invoices do
  not appear in the invoice list — flow 8 characterizes exactly this behavior
  (create + view work; list shows "No invoices match the given criteria").
- **Serial execution**: flows share seeded stock, so the suite runs with one
  worker (`workers: 1`); do not parallelize without isolating data.
- The putaway list can take >30 s to load pending items; the spec waits up to
  120 s.
