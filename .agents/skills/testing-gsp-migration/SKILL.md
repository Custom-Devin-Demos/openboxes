---
name: testing-gsp-migration
description: How to verify GSP→React screen-migration batches in OpenBoxes (before/after screenshots, Playwright UI suite, API snapshot suite)
---

# Testing GSP→React migration batches (OpenBoxes)

## App boot
- DB: `docker start openboxes-db` (mariadb:10, openboxes/openboxes, root pw `root`).
- App: `JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64 ./gradlew bootRun` (~4–8 min; poll `http://localhost:8080/openboxes/auth/login` for HTTP 200). Login admin:password.
- Seed demo data AFTER boot: `docker exec -i openboxes-db mysql -uopenboxes -popenboxes openboxes < docker/seed-demo-data.sql`.
- To kill the app reliably: `pkill -f GradleWrapperMain; pkill -f GradleDaemon` then verify with `pgrep -fa java` (a plain `pkill -f gradle` can kill your own shell and leave GradleDaemon alive holding port 8080).

## BEFORE/AFTER screenshots
- Save the branch's `e2e/shot.js` (it holds the batch's URL list), `git checkout develop`, boot, run it; then checkout the branch, reboot, run again.
- `shot.js` must be run from inside `e2e/` (copy it there if running a saved copy) so `@playwright/test` resolves; run `npm install && npx playwright install chromium` in `e2e/` first if needed.

## Playwright UI characterization suite (10 tests)
- `cd e2e && npx playwright test` — output lists “10 passed”.
- The suite is STATEFUL and expects freshly seeded demo data: re-run `docker/seed-demo-data.sql` immediately before the run, or Flow 3 (create requisition) may fail with a disabled “Submit request” button.

## API snapshot suite (122 snapshots)
- Requires a TRULY fresh DB: the seed script is insert-only and does not undo UI-suite mutations. Fastest reset without losing the container:
  `docker exec openboxes-db mysql -uroot -proot -e "DROP DATABASE openboxes; CREATE DATABASE openboxes DEFAULT CHARSET utf8; GRANT ALL ON openboxes.* TO 'openboxes'@'%';"`
  then restart `bootRun` (re-runs install migrations, ~6 min), seed demo data, then RESTART the app once more so the product-availability cache is rebuilt — otherwise ~9 inventory/dashboard snapshots fail with empty arrays.
- `cd api-snapshots && npm run snapshots:verify` (Node >= 18; no name filter exists — `snapshots:update` rewrites all, but only genuinely-changed files end up modified in git).
- When a batch adds `react.*` i18n keys, only `localizations-list` should fail. Re-record with `npm run snapshots:update`, then prove additivity by diffing key sets of `body.messages` (old via `git show HEAD:…`) — expect N added, 0 removed, 0 changed. The raw git diff looks huge because message ordering is nondeterministic.
- After running the UI suite, `git checkout -- e2e/screenshots` to drop screenshot churn.
