# Integrations verification — Grails 6.2.3 / Java 21 (Phase 1, step 1.5)

Manual verification checklist for framework-adjacent integrations after the Grails 6 / JDK 21
upgrade. Environment: local dev (`./gradlew bootRun`, JDK 21), MariaDB 10 in Docker
(`openboxes-db`), demo seed data (`docker/seed-demo-data.sql`), external config at
`~/.grails/openboxes-config.properties`.

Date verified: 2026-08-21.

## 1. Quartz jobs

All 12 jobs under `grails-app/jobs` enumerated and verified registered with the Quartz 2.3.2
scheduler (plugin `quartz:3.0.0`, `autoStartup: false` + explicit `scheduler.start()` in
`BootStrap`).

| Job | Registered | Executed | Evidence |
|---|---|---|---|
| AssignIdentifierJob | yes | yes (cron, every minute) | boot log `Scheduling job AssignIdentifierJob`; periodic execution log |
| CalculateHistoricalQuantityJob | yes (disabled by config) | n/a (`enabled: false`) | registered trigger-less; `shouldExecute` guard honored |
| DataCleaningJob | yes | yes (cron, every 5 min) | `Starting data cleaning job at Fri Aug 21 19:30:00 UTC 2026 ... Finished data cleaning job in 3 ms` |
| DataMigrationJob | yes | yes (on startup) | boot log execution |
| RefreshDemandDataJob | yes | yes (triggerNow at startup) | BootStrap `RefreshDemandDataJob.triggerNow()` completed |
| RefreshInventorySnapshotJob | yes | yes (manual trigger) | manual trigger via admin endpoints returned OK |
| RefreshOrderSummaryJob | yes | yes (triggerNow at startup) | boot log execution |
| RefreshProductAvailabilityJob | yes | yes (triggerNow at startup, forceRefresh) | boot log execution; product availability populated |
| RefreshStockoutDataJob | yes | yes (triggerNow at startup) | boot log execution |
| RefreshTransactionFactJob | yes | yes (manual: `report/refreshTransactionFact`) | `{"responseTime":"252 ms","results":null,"groovyVersion":"3.0.23"}` |
| SendStockAlertsJob | yes | yes (manual: `admin/triggerStockAlerts`) | executed; mail path exercised (disabled + MailHog) |
| UpdateExchangeRatesJob | yes (disabled by config) | n/a (`enabled: false`) | registered; guard honored |

No Quartz fixes required under the new stack.

## 2. Liquibase

- Full migration set from a clean DB: verified — first boot against an empty `openboxes`
  schema ran the complete changelog successfully and the app started.
- Incremental (no `dropAll`) against an existing seeded DB: verified — subsequent boots
  against the seeded DB ran with no re-executed changesets and no errors.
- Checksums: verified unchanged — no `validation failed`/checksum errors on any boot; no
  changelog files modified in this branch (`git diff` clean under `grails-app/migrations`).

## 3. Mail

- `grails.mail.enabled=false`: verified — `MailService` logs
  `email disabled: not sending email with subject ...` and returns cleanly; API
  `POST /api/admin/sendMail` responds success without sending.
- Local SMTP sink (MailHog on `localhost:1025`): verified — HTML mail
  (`[OpenBoxes] MailHogTest3`, `multipart/mixed`) and multipart mail with attachment
  (`[OpenBoxes] AttachTest5`) both delivered and visible in MailHog API. No javax/jakarta
  mail errors after fix (see Fixes below).
- Templates: shipment "shipped" and "received" notification templates render
  (`shipment/renderShippedEmail`, `shipment/renderReceivedEmail` → HTTP 200 HTML).

Fixes required:
- `external-config` plugin 2.0.0 was a silent no-op under Spring Boot 2.7 (its
  `SpringApplicationRunListener.environmentPrepared(ConfigurableEnvironment)` signature was
  removed in Boot 2.4+), so `~/.grails/openboxes-config.properties` was never loaded.
  Upgraded to `dk.glasius:external-config:4.0.0` (Grails 6 line of the same plugin) and
  removed the `classpath:META-INF/grails.build.info` entry from `grails.config.locations`
  (Micronaut rejects the `.info` extension; build info is still available via
  `grailsApplication.metadata` / `g:meta`, which do not read it from config locations).
- `com.sun.activation.registries.LogSupport` `NoClassDefFoundError` when sending mail:
  the JavaBeans Activation Framework implementation is no longer shipped with the JDK
  (removed in Java 11+) and the build excluded `com.sun.activation:jakarta.activation`.
  Added `com.sun.activation:jakarta.activation:1.2.2` (runtime impl required by
  `com.sun.mail:jakarta.mail:1.6.7`).

## 4. Reporting / document generation

Exercised against seeded shipment `907XFZ` / its requisition, location `Main Warehouse`:

| Endpoint | Result | Evidence |
|---|---|---|
| `report/refreshTransactionFact`, `report/buildFacts`, `report/buildDimensions` | OK | JSON `{"responseTime": ...}` |
| `report/printShippingReport` | OK | HTTP 200 HTML |
| `report/printPickListReport`, `report/printPaginatedPackingListReport` | OK | HTTP 200 HTML |
| `report/downloadShippingReport?format=docx` | OK | HTTP 200, valid `.docx` (docx4j) |
| `report/exportInventoryReport` (CSV) | OK | `Stock report - Main Warehouse.csv` |
| `report/exportDemandReport` (CSV) | OK | `Product Demand - Main Warehouse.csv` |
| `picklist/print` (GSP) | OK | HTTP 200 HTML |
| `picklist/renderPdf` | OK | HTTP 200 `application/pdf` (flying-saucer) |
| `shipment/exportPackingList` (Excel/POI) | OK | HTTP 200 `application/vnd.ms-excel`, `Shipment 907XFZ - Packing List.xls` |
| `doc4j/downloadPackingList` (Goods Receipt Note, Excel) | OK | HTTP 200 `application/vnd.ms-excel` |
| `api/deliveryNotes/<requisitionId>/printData` (delivery note) | OK | HTTP 200 JSON payload |
| `product/exportAsCsv` | OK | CSV download |
| `product/exportProducts` (selected products) | OK after fix | see Fixes below |
| `shipment/downloadPackingList` (legacy CSV) | pre-existing failure | raw SQL references `shipment_item.serial_number`, a column that no longer exists in the schema (query dates to 2010-era code); fails identically on the pre-upgrade stack — not an upgrade regression, left unchanged |
| `document/renderInvoiceTemplate` | n/a (data) | requires an `INVOICE_TEMPLATE` document on the shipment workflow, absent from seed data; error message is the pre-existing guard, not a stack failure |

Fixes required:
- `ProductController.exportProducts`: `productIds.toArray()` resolves to `Object[]` under
  Groovy 3 and no longer matches `ProductService.getProducts(String[])`; changed to
  `productIds as String[]`.

## 5. Parity oracles

- API snapshot suite: `npm run snapshots:verify` — 122/122 snapshots passing.
- Playwright UI suite: `npm run e2e` — all golden-path flows passing.

Run post-rebase onto latest `develop`; see PR description for logs.
