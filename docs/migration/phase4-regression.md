# Phase 4.1 — Full Characterization Regression (develop)

Full characterization run on current `develop` (`2b2322f51`, which includes
the Phase 4.4 GSP removal — 298 dead GSPs and 5 orphaned taglibs removed)
against a fresh, reseeded demo database (`docker/seed-demo-data.sql`,
8 products verified), followed by a manual browser regression sweep of the
migrated React screens. All suites and the sweep were re-run after rebasing
onto the post-GSP-removal develop, so results reflect the cutover state.

Stack: Grails 6.2.3 / Gradle 8.11.1 / Groovy 3.0.23 / Spring Boot 2.7.18 on
JDK 21; React 18 bundle built with Node 14.

## 1. Suite-by-suite results

| Suite | Command | Result |
|---|---|---|
| Playwright golden paths | `cd e2e && npm run e2e` | **10/10 passed** (Flow 3 needed the documented one-retry for the cold-app flake) |
| API snapshots | `cd api-snapshots && npm run snapshots:verify` (fresh reseeded DB) | **122 passed, 0 failed, 0 skipped** |
| OpenAPI lint | `cd openapi && npm run contracts:lint` | **passed** (58 warnings, no errors) |
| OpenAPI contracts | `cd openapi && npm run contracts:verify` | **747 passed, 0 failed, 58 skipped** (skips are the documented mutating/data-dependent operations) |
| Frontend unit tests | `npm test` | **35 suites / 213 tests passed** (6 suites / 9 tests skipped, 23 snapshots passed) |
| Frontend lint | `npm run eslint` | **0 errors** (4375 warnings, exit 0) |
| Backend build | `./gradlew assemble` | **BUILD SUCCESSFUL** |
| Backend integration tests | `./gradlew integrationTest` | **59 tests, 0 failed, 3 skipped** (see environment notes) |

## 2. Manual browser regression sweep

Playwright-driven sweep (admin login, Main Warehouse location) over 24 legacy
URLs — at least two screens per major module — checking HTTP status, final
route, rendered data, console errors, and page errors. All URLs returned
HTTP 200 and rendered the React screens with seeded data.

| Module | Screens checked | Result |
|---|---|---|
| Inventory | `/inventory/browse`, `/inventory/listExpiredStock`, `/inventory/listTransactions?product.id=…` | OK — 8 products with quantities; expired stock empty (expected); 7 transactions listed |
| Product catalog | `/product/list`, `/inventoryItem/showStockCard/…`, `/category/tree` | OK after fix R1 below — 8 products listed; stock card QoH/available 510; category tree renders |
| Requisitions / stock movements | `/requisition/list`, `/stockMovement/list`, `/stockMovement/show/…` | OK — 2 requisitions; `/stockMovement/list` redirects to `/dashboard` (existing route behavior); movement detail + packing list render |
| Shipments / receiving | `/shipment/list`, `/shipment/showDetails/…` | OK — pending shipment listed; showDetails redirects to `/stockMovement/show/…` and renders received shipment with packing list/receipts |
| Orders / invoicing | `/order/list`, `/order/show/…`, `/invoice/list`, `/invoice/show/…` | OK — order list applies default `PURCHASE_ORDER`+destination filters; order detail renders items; invoice detail renders header; invoice list empty per known caveat (header-only invoices are filtered by the `invoice_list` view) |
| Admin / config | `/admin/showSettings`, `/localization/list`, `/locationType/list` | OK after fix R2 below — settings render; localizations list empty (no custom localizations in seed); 10 location types listed |
| Reporting | `/report/showTransactionReport`, `/report/showBinLocationReport` | OK — transaction report renders parameters/metadata (0 rows until "Refresh Data" builds the fact table — pre-existing behavior); bin location report lists 11 stock rows |
| Users / locations | `/user/list`, `/user/show/…`, `/location/list`, `/location/edit/1` | OK — 2 users listed; user detail renders; location list applies default Depot filter and lists 2 depots; location edit loads |

Legacy URL routing checks: `/stockMovement/list` → `/dashboard`,
`/shipment/showDetails/<id>` → `/stockMovement/show/<id>`, `/order/list` and
`/invoice/list` and `/location/list` add their default filter query params —
all consistent with pre-migration behavior notes.

Post-GSP-removal checks (after the Phase 4.4 merge):

- All 24 sweep URLs re-checked — legacy URLs still route to the React screens
  with no console/page errors.
- Print/export flows still served by the retained GSP/legacy layer:
  `picklist/renderPdf/<id>` (200, `application/pdf`),
  `shipment/exportPackingList/<id>` (200, `application/vnd.ms-excel`),
  `report/exportBinLocation?...downloadFormat=csv` (200, `text/csv`),
  `order/print/<id>` (200, HTML print view).
- Fresh-seed note: workflow detail screens (`stockMovement/show`,
  `shipment/showDetails`, `order/show`, `invoice/show`) have no seed objects
  on a truly fresh DB — they were exercised against data created by the e2e
  flows. `invoice/*` additionally requires the supplemental `ROLE_INVOICE`
  (not granted to the seeded admin; e2e Flow 8 grants it via the user admin
  screen) — the RoleInterceptor redirect to `/errors/handleForbidden` without
  that role is pre-existing RBAC behavior, not a regression.

## 3. Regressions found (and fixed in this PR)

### R1 — `product/list` page error: `getGlAccountOptions is not a function`

- **Repro**: log in, open `/product/list`; browser console shows
  `TypeError: ....getGlAccountOptions is not a function` (page error). The GL
  Account filter cannot load its options.
- **Cause**: a GL-account API migration commit (`dd122ca3e`) rewrote
  `src/js/api/services/GlAccountApi.js` and dropped the pre-existing
  `getGlAccountOptions` method still used by `option-utils.jsx` (product list
  filters) and `ProductEditPage.jsx`.
- **Fix**: restored `getGlAccountOptions` (GET `/api/glAccountOptions`) in
  `GlAccountApi.js`.
- **Evidence**: after fix, sweep of `/product/list` reports no console/page
  errors and the page renders 8 products.

### R2 — `/admin/showSettings` fails to render (React error #31)

- **Repro**: open `/admin/showSettings`; blank content area and console shows
  `Minified React error #31 … object with keys {empty, present}`.
- **Cause**: `AdminApiController.settings` used
  `grailsApplication.metadata.getProperty('build.time', String)`, which under
  Grails 6 returns an Optional-like `{empty, present}` object when the key is
  unset (development runs have no packaged build time); the React settings page
  renders `buildDate` directly.
- **Fix**: use `getProperty('build.time')` so an unset build time serializes as
  null; OpenAPI schema (`openapi/components/schemas/admin.yaml`) updated to
  `type: string, nullable: true` for `buildDate`.
- **Evidence**: after fix, `/admin/showSettings` renders the full settings
  page with no console errors, and `contracts:verify` passes.

### R3 — locale ordering mutated after visiting product create/edit screens

- **Repro**: log in, call `GET /api/getAppContext` and note the
  `supportedLocales` order (config order: `ar, ach, de, en, …`); open the
  product create/edit screen (which calls `GET /api/productScreens/editData`);
  call `getAppContext` again — the order is now alphabetically sorted
  (`ach, ar, de, en, es, es_MX, fi, fr, ht, it, pt, zh`). This also flips the
  locale ordering shown in the footer/menu locale chooser and broke the
  `api-getAppContext` API snapshot when re-verified after the browser sweep.
- **Cause**: `ProductScreenApiController` (introduced in the product-catalog-2
  migration batch) used `supportedLocales?.sort()` — Groovy's mutating sort —
  on the shared `grailsApplication.config` list, permanently reordering it for
  the whole JVM.
- **Fix**: use the non-mutating `sort(false)` (same as
  `LocalizationApiController`).
- **Evidence**: after fix, `getAppContext` returns the config order before and
  after hitting `/api/productScreens/editData`, and `snapshots:verify` passes
  122/122 even after exercising product screens.

## 4. Known pre-existing caveats — confirmed unchanged

- **Obsolete shipment CSV SQL** (`shipment/downloadPackingList`): re-verified
  on this run — still HTTP 500 with
  `SQLSyntaxErrorException: Unknown column 'shipment_item.serial_number' in
  'SELECT'`, identical to the pre-upgrade behavior documented in
  `integrations-verification.md` — unchanged, not an upgrade regression.
- **Missing invoice-template seed data**
  (`document/renderInvoiceTemplate`): re-verified — the pre-existing guard
  errors are still hit (no `INVOICE_TEMPLATE` document exists in the seed;
  requesting without a valid `shipmentId` hits the "Unable to locate shipment"
  guard) — unchanged.
- **Document-upload GET failures**: the demo seed contains no `document` rows,
  so document download GETs cannot serve a file — same data-dependent
  limitation as in previous phases; no new failures surfaced by snapshots or
  contracts.
- **`productSupplier/show`**: the demo seed contains no `product_supplier`
  rows, so the detail screen cannot be exercised against real data (same as
  previous phases); the `productSuppliers-list` API snapshot passes unchanged.
- **Invoice list with header-only invoices**: `invoice_list` SQL view filters
  on invoice items, so header-only invoices don't appear in `/invoice/list`
  (characterized by e2e flow 8) — confirmed in the sweep, unchanged.
- **Transaction report requires fact-table refresh**: report shows 0 rows
  until "Refresh Data" is run — pre-existing behavior, unchanged.

## 5. Environment notes

- `integrationTest` has a known intermittent `ApiSpec` setup flake (HTTP 500
  during `createMainProduct` from a foreign-key race on `product.category_id`);
  per policy it is retried once before being treated as a real failure. The
  flake did not occur on this run.
- `integrationTest` must run without an external config file
  (`~/.grails/openboxes-config.properties`) that overrides `dataSource.url`:
  the override replaces the testcontainers `jdbc:tc:` URL in the `test`
  environment while `driverClassName` remains `ContainerDatabaseDriver`, which
  makes every spec fail with "Driver ... returned null for URL". This is a
  local-environment interaction, not a code regression.
- The e2e requisition flow (Flow 3) can be flaky on a cold app (late
  availability render resets Needed Qty); it passed on this run without
  retries.
