---
name: testing-gsp-migration
description: How to verify GSP→React screen-migration batches in OpenBoxes (before/after screenshots, Playwright UI suite, API snapshot suite)
---

# Testing GSP→React migration batches (OpenBoxes)

## App boot
- DB: `docker start openboxes-db` (mariadb:10, openboxes/openboxes, root pw `root`).
- App: `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew bootRun` (Java 21 required since the Grails 6.2.3 upgrade; older branches pre-Grails-6 need Java 11 at `/usr/lib/jvm/java-11-openjdk-amd64`) (~4–8 min; poll `http://localhost:8080/openboxes/auth/login` for HTTP 200). Login admin:password.
- Seed demo data AFTER boot: `docker exec -i openboxes-db mysql -uopenboxes -popenboxes openboxes < docker/seed-demo-data.sql`.
- Wait for the literal `Grails application running` line in the boot log before seeding — HTTP 200 on /auth/login is NOT a reliable migrations-complete signal; seeding mid-migration breaks later FK changesets (e.g. `user_role.role_id → role.id`). The Liquibase changelog table is uppercase `DATABASECHANGELOG` post-upgrade.
- The seed can silently insert 0 rows if run immediately after boot: verify `select count(*) from product` = 8 and re-run the script once if 0 (it is insert-only and idempotent against duplicates).
- To kill the app reliably: `pkill -f GradleWrapperMain; pkill -f GradleDaemon` then verify with `pgrep -fa java` (a plain `pkill -f gradle` can kill your own shell and leave GradleDaemon alive holding port 8080).
- Before relaunching bootRun, verify ports 5005/8080 are free (`ss -tln | grep -E '5005|8080'`) — a leftover JVM causes a JDWP "Address already in use" bind failure and a silent BUILD FAILED.

## BEFORE/AFTER screenshots
- Save the branch's `e2e/shot.js` (it holds the batch's URL list), `git checkout develop`, boot, run it; then checkout the branch, reboot, run again.
- `shot.js` must be run from inside `e2e/` (copy it there if running a saved copy) so `@playwright/test` resolves; run `npm install && npx playwright install chromium` in `e2e/` first if needed.

## Playwright UI characterization suite (10 tests)
- `cd e2e && npx playwright test` — output lists “10 passed”.
- The suite is STATEFUL and expects freshly seeded demo data: re-run `docker/seed-demo-data.sql` immediately before the run, or Flow 3 (create requisition) may fail with a disabled “Submit request” button.
- Flow 3 is also FLAKY on a cold (freshly restarted) app even with a fresh DB: its "Needed Qty" fill can be wiped to 0 by a late QOH/availability re-render, leaving Submit disabled. It passes manually and in isolation. If Flow 3 is the only failure, re-run the full suite once the app is warm (second run typically gives 10/10) before treating it as a regression.

## API snapshot suite (122 snapshots)
- Requires a TRULY fresh DB: the seed script is insert-only and does not undo UI-suite mutations. Fastest reset without losing the container:
  `docker exec openboxes-db mysql -uroot -proot -e "DROP DATABASE openboxes; CREATE DATABASE openboxes DEFAULT CHARSET utf8; GRANT ALL ON openboxes.* TO 'openboxes'@'%';"`
  then restart `bootRun` (re-runs install migrations, ~6 min), seed demo data, then RESTART the app once more so the product-availability cache is rebuilt — otherwise ~9 inventory/dashboard snapshots fail with empty arrays.
- `cd api-snapshots && npm run snapshots:verify` (Node >= 18; no name filter exists — `snapshots:update` rewrites all, but only genuinely-changed files end up modified in git).
- When a batch adds `react.*` i18n keys, only `localizations-list` should fail. Re-record with `npm run snapshots:update`, then prove additivity by diffing key sets of `body.messages` (old via `git show HEAD:…`) — expect N added, 0 removed, 0 changed. The raw git diff looks huge because message ordering is nondeterministic.
- After running the UI suite, `git checkout -- e2e/screenshots` to drop screenshot churn.

## Shipment workflow / shipment item test data
- `ShipmentWorkflow.shipmentType` has `unique: true` (one workflow per shipment type) and all 5 seeded types are taken, so creating a workflow via UI fails with a "Bad request: unique" toast. Insert a temp type first: `insert into shipment_type (id,version,date_created,last_updated,name,sort_order) values ('qa-temp-type',0,now(),now(),'QA Temp Type',6);` — the create form's options endpoint reads the DB live (just reload the page). Delete the row when done.
- The split screen (`/shipmentItem/split/<id>`) preselects the item's current bin radio (from `binLocationSelected`), so the "no bin selected" validation error is unreachable via UI for seeded items; test the zero/invalid-quantity error instead.
- Shipment item ids for split tests: `select id,quantity from shipment_item where quantity>=2;` (E2E suites create them). Verify the split in DB by selecting all items with the same `shipment_id`.

## Requisition test data (for requisition/transfer screens)
- Demo seed contains NO requisitions; create them via SQL. `requisition_item.substitutable` is NOT NULL with no default — include `substitutable=0` or inserts fail. Copy column values from a UI-suite-created requisition item as a template.
- Transfer/issue only succeeds when the requisition's destination is a locally-managed location (Depot type, no manager). The UI suite creates "E2E Depot" which qualifies; its outbound requisition (PICKED, with picklist) is ideal for issuing via `/requisition/transfer/:id`.
- To exercise the double-issue validation error, SQL-flip the issued requisition back to `status='PICKED'`, reload transfer page, click Finish → red banner "Cannot create multiple outbound transaction"; restore `ISSUED` afterwards.
- DEFAULT-type redirect regression: `requisition.type` is usually NULL on seeded reqs (renders React); SQL-set `type='DEFAULT'` temporarily to verify redirect to stockMovement show, then restore NULL.

## CI (GitHub Actions) notes
- The backend integration tests can fail flakily in setup (`ApiSpec.createMainProduct` gets 500: FK violation on `product.category_id`) — a data race between specs, unrelated to the PR under test if the diff touches no backend domain logic. It recurs intermittently (different specs each run) on branches whose CI passed on identical code; develop's On Change runs pass. Retry the run before investigating further. All failed tests in an affected run share the identical createMainProduct stack trace; the mysql job only runs after the mariadb job passes, so a "mysql failed, mariadb passed" run means the flake struck on the second leg.
- `gh run rerun` fails with "Resource not accessible by integration"; closing/reopening the PR and empty commits do NOT retrigger `Test Pull Request` — only a push with a real file change does.
- Temp image-row workaround for the thumbnail 500 must use the post-Grails-5 `document` schema: columns are `content_type`/`file_contents` (the old `size`/`contents` columns are gone).
