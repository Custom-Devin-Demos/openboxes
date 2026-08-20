# API characterization tests (parity oracle)

Phase 0, task 0.4 of the OpenBoxes modernization program.

The harness in [`api-snapshots/`](../../api-snapshots/README.md) records JSON
snapshots of the REST API (`/openboxes/api/**`) against the seeded demo
database. These committed snapshots are the **parity oracle**: every later
backend change (Grails 3 → 4 → 5 → 6, Java 8 → 21) must produce identical
responses, or the diff must be explicitly reviewed and the snapshots
deliberately re-recorded via update mode.

## Running

Prerequisites: MariaDB container running with demo data seeded, application
running (see [`baseline-setup.md`](baseline-setup.md)). Then:

```bash
cd api-snapshots
npm run snapshots:verify   # compare live responses against committed snapshots
npm run snapshots:update   # re-record snapshots (intentional changes only)
```

No npm install is needed (zero dependencies; Node >= 18 required).

Current baseline: **122 snapshots** (120 GET endpoints + 2 mutating
scenarios), recorded against Grails 3.3.16 / Java 8 with
`docker/seed-demo-data.sql` loaded.

## Normalizations

Responses are normalized before snapshotting/comparison (implemented and
documented in `api-snapshots/src/normalize.js`):

1. **Generated ids**: 32-char lowercase hex ids (GORM UUID ids) are replaced
   with `<uuid>` everywhere (keys are stable natural keys where possible).
2. **Dates/timestamps**: strings matching known date formats (ISO,
   `MM/dd/yyyy`, `dd/MMM/yyyy hh:mm a`, RFC-1123, java `Date.toString()`) are
   replaced with `<date>`; epoch-millisecond numbers on date-named keys too.
3. **Volatile keys**: values of `dateCreated`, `lastUpdated`, `dateImported`,
   `requestId`, `buildDate`, `buildNumber`, `branchName`, `revisionNumber`,
   `ipAddress`, `hostname`, `timestamp`, `serverName`, `time`,
   `responseTime`, `elapsedTime` are replaced with `<volatile>`.
4. **Non-deterministic ordering**: endpoints flagged `sortArrays: true` in
   `src/endpoints.js` have all arrays sorted (underlying SQL has no stable
   `ORDER BY`); additionally, arrays under the key `roles` are always sorted
   (backed by a java `Set` with no defined iteration order).

Snapshots also capture HTTP status and content type. **Error responses are
snapshotted deliberately** (HTTP 400/404/500 from endpoints whose required
data is absent from the seed, and `NoopApiController`'s intentional error) —
error shapes are part of the characterized contract.

## CI workflow

`.github/workflows/api-snapshots.yml` is **`workflow_dispatch` (manual) only**.
Decision: booting the legacy Grails 3 app in CI requires a full Gradle/Grails
build plus Liquibase migrations against a fresh MariaDB (~15–25 min before the
first request can be served), which is prohibitive as a per-PR check during
Phase 0. The workflow provisions MariaDB, seeds demo data, boots the app, and
runs `snapshots:verify`; run it manually before/after each migration milestone.

## Coverage table

All 52 `*ApiController.groovy` classes are listed. "Snapshotted endpoints"
names refer to files in `api-snapshots/snapshots/`.

| Controller | Snapshotted endpoints | Gaps / reasons not snapshotted |
|---|---|---|
| ApiController | api-status, api-getAppContext, api-getMenuConfig, api-getRequestTypes, api-supportLinks, api-resettingInstanceCommand | `login`/`logout` exercised implicitly by harness auth; `chooseLocation` exercised during setup |
| AttributeApiController | attributes-list | — |
| BaseApiController | — | Abstract base class; no routes of its own |
| BaseDomainApiController | — | Abstract base class (generic CRUD inherited by domain controllers); exercised via subclasses |
| BinLocationApiController | binLocations-list | — |
| CategoryApiController | categories-list, categories-read, scenario-category-create-read-delete | — |
| CombineShipmentApiController | — | `read` requires an existing inbound shipment order absent from seed data |
| CombinedShipmentItemApiController | combinedShipmentItems-orderNumberOptions, combinedShipmentItems-getProductsInOrders | POST `addItemsToShipment` mutates orders/shipments not present in seed |
| CycleCountApiController | cycleCounts-candidates, cycleCounts-pendingRequests, cycleCounts-list, cycleCounts-detailsReport, cycleCounts-summaryReport | Mutating start/submit/review flows require multi-step state on real counts |
| DashboardApiController | 33 endpoints (dashboard-config, dashboard-subdashboardKeys, all indicator/number/table data endpoints) | — |
| FulfillmentApiController | — | POST-only (`validate`/`save` packing-list import); requires an existing stock movement |
| GenericApiController | generic-product-list, generic-location-list, generic-product-read | Generic create/update/delete exercised via the two mutating scenarios |
| HelpScoutApiController | helpscout-configuration | — |
| IndicatorApiController | indicators-productsInventoried, indicators-inventoryAccuracy, indicators-inventoryShrinkage | — |
| InternalLocationApiController | internalLocations-list, internalLocations-search, internalLocations-receiving | — |
| InventoryApiController | inventories-reorderReport, inventories-expirationHistoryReport | POST CSV import mutates inventory (not safely re-runnable) |
| InventoryLevelApiController | inventoryLevels-list | — |
| InventoryTransactionSummaryApiController | inventoryTransactionsSummary | — |
| InvoiceApiController | invoices-list, invoices-statusOptions, invoices-typeCodes | `read`/items require an existing invoice absent from seed |
| LoadDataApiController | loadData-listOfDemoData | Demo-data load endpoints mutate the database wholesale |
| LocalizationApiController | localizations-list | — |
| LocationApiController | locations-list, locations-read, locations-locationTypes, locations-supportedActivities | POST create/update covered pattern-wise by scenarios on simpler domains |
| LocationGroupApiController | locationGroups-list, scenario-locationGroup-create-read-delete | — |
| NoopApiController | noops-list | Intentionally throws; snapshot characterizes the 500 error shape |
| OrganizationApiController | organizations-list, organizations-read | — |
| PackListApiController | — | Export/import of pack lists requires an existing stock movement with packable items |
| PartialReceivingApiController | partialReceiving-list | `read`/`update` require an existing inbound shipment id |
| PersonApiController | persons-list | — |
| PicklistApiController | — | DELETE-only (`clearPicklist`); requires an existing picklist on a requisition |
| PrepaymentInvoiceApiController | — | POST-only (`updateItems`); requires an existing prepayment invoice |
| PrepaymentInvoiceItemApiController | — | PUT/DELETE-only; requires existing prepayment invoice items |
| ProductApiController | products-list, products-read, products-search, products-availableItems, products-getLatestInventoryCountDate, products-lotNumbersWithExpirationDate | — |
| ProductClassificationApiController | productClassifications-list | — |
| ProductPackageApiController | — | POST-only create; product packages cannot be deleted via API (no cleanup path) |
| ProductSupplierApiController | productSuppliers-list | Mutations require complex product-supplier command objects |
| ProductSupplierAttributeApiController | — | POST-only batch attribute update on existing product suppliers |
| ProductSupplierPreferenceApiController | — | POST/PUT/DELETE-only; preference lifecycle tied to existing product suppliers |
| ProductsConfigurationApiController | productsConfiguration-categoriesCount, productsConfiguration-categoryOptions, productsConfiguration-productOptions, productsConfiguration-downloadCategories | Import endpoints mutate category tree wholesale |
| PurchaseOrderApiController | purchaseOrders-list, purchaseOrders-statusOptions | `rollback`/`delete` mutate order state irreversibly |
| PutawayApiController | putaways-list | POST create/update requires pending inbound stock in receiving bins |
| PutawayItemApiController | — | DELETE-only (`removingItem`); requires an existing putaway item |
| ReasonCodeApiController | reasonCodes-list | — |
| RecordStockApiController | — | POST-only; records inventory transactions (would alter stock baseline) |
| ReplenishmentApiController | replenishments-requirements, replenishments-statusOptions | Create/complete flows mutate transfer orders |
| SelectOptionsApiController | 11 endpoints (all option lists) | — |
| StockAdjustmentApiController | — | POST-only; creates adjustment transactions (would alter stock baseline) |
| StockMovementApiController | stockMovements-list-inbound, stockMovements-list-outbound, stockMovements-requisitionStatusCodes, stockMovements-pendingRequisitionItems, stockMovements-shippedItems | `read` and workflow mutations require an existing stock movement absent from seed |
| StockMovementItemApiController | — | All actions require an existing stock movement (absent from seed); list/read return 404 without one |
| StockTransferApiController | stockTransfers-list, stockTransfers-statusOptions, stockTransfers-candidates | Create/update require completable transfer state |
| StocklistApiController | stocklists-list | Clone/publish/unpublish mutate requisition templates |
| StocklistItemApiController | stocklistItems-availableStocklists | CRUD requires an existing stocklist for the test product |
| UnitOfMeasureApiController | unitOfMeasure-currencies, unitOfMeasure-uomOptions | — |

**Coverage: 52/52 controllers addressed; 37 controllers with ≥1 snapshot
(120 GET endpoints + 2 mutating scenarios = 122 snapshots); 15 controllers
documented as not snapshotted** (2 abstract base classes and 13 whose only
actions are mutating operations requiring pre-existing transactional data not
present in the demo seed and/or with no safe cleanup path — snapshotting them
would break seed re-runnability).
