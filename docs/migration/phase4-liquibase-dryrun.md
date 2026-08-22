# Phase 4.2 — Liquibase dry-run on production-shaped data

Verifies that the Liquibase migration path of the modernized backend
(Grails 6.2.3 / JDK 21, database-migration plugin 5.0.0) is safe for both fresh
installs and in-place upgrades of production-shaped databases (databases created
by an old OpenBoxes version and upgraded in place — schema changes outside
Liquibase are forbidden).

**Verdict: GO** — see [Recommendation](#recommendation).

## Environment

| Component | Value |
|-----------|-------|
| Current code | `develop` @ `a8b6e13de` (Grails 6.2.3, JDK 21) |
| Legacy baseline | commit `1cb3d4eb4` — last commit before the Java 8→11 upgrade (PR #7); Grails 3.3.16 / JDK 8 |
| Database server | `openboxes-db` Docker container, MariaDB 10.11.18 (`mariadb:10`, per `docker/docker-compose-dev.yml`) |
| App config | `~/.grails/openboxes-config.properties` (`dataSource.url` switched per scenario) |
| Seed data | `docker/seed-demo-data.sql` (data-only, idempotent) |

Note: `grails-app/migrations/` is byte-identical between the legacy baseline and
current `develop` (`git diff 1cb3d4eb4 develop -- grails-app/migrations` is empty).
The modernization deliberately made no changelog edits, so the upgrade path is
expected to apply zero new changesets — this run proves the new Liquibase engine
(5.x, bundled with database-migration 5.0.0) accepts the existing
`DATABASECHANGELOG` produced by the old engine without checksum drift.

## 1. Fresh-install path (empty DB → current develop)

Procedure:

```bash
# empty database `openboxes` (no tables), config pointing at it
cd ~/repos/openboxes   # develop @ a8b6e13de
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew bootRun
# after boot:
docker exec -i openboxes-db mysql -uopenboxes -popenboxes openboxes < docker/seed-demo-data.sql
```

Results:

- All changesets applied cleanly; BootStrap logged `All migrations ran successfully!`.
- `DATABASECHANGELOG`: **983 rows** — 966 `EXECUTED`, 17 `MARK_RAN` (preconditions
  intentionally marking legacy changesets as run on fresh installs).
- Warnings: **1** Liquibase warning —
  `Due to mariadb SQL limitations, setNullable will lose primary key/autoincrement/not null/comment settings…`
  (informational; emitted because the dev container is MariaDB. Production MySQL 8
  does not hit this code path. No changeset failed.)
- App boots, `GET /openboxes/auth/login` → 200, `admin:password` login → 302 to home.
- Seed script loads cleanly: 8 products, 8 inventory items, 8 transaction entries, 2 users.

## 2. Upgrade path (legacy schema+data → current develop)

Procedure:

```bash
# 2a. Build a legacy database with the pre-migration application
docker exec openboxes-db mysql -uroot -proot \
  -e "CREATE DATABASE openboxes_legacy DEFAULT CHARSET utf8; GRANT ALL ON openboxes_legacy.* TO 'openboxes'@'%';"
git clone ~/repos/openboxes ~/openboxes-legacy && cd ~/openboxes-legacy && git checkout 1cb3d4eb4
# point ~/.grails/openboxes-config.properties at openboxes_legacy, then:
JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64 ./gradlew bootRun     # legacy Grails 3.3.16 boot
docker exec -i openboxes-db mysql -uopenboxes -popenboxes openboxes_legacy < docker/seed-demo-data.sql
# verify legacy login works, snapshot DATABASECHANGELOG + row counts, stop the app

# 2b. Point CURRENT develop at the legacy database and boot
cd ~/repos/openboxes
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew bootRun
```

Results:

- Legacy boot created the same **983** changelog rows (966 `EXECUTED` / 17 `MARK_RAN`),
  as expected since the changelogs are identical.
- Current develop boot against that database:
  - **Changesets applied: 52**, all of them the documented `runAlways` view
    rebuilds — 51 from `views/changelog.xml` plus `views/drop-all-views.xml::1633402273161-1`.
    **Zero** non-view changesets ran.
  - **No checksum errors** and no checksum drift: the `(id, filename, md5sum)`
    set in `DATABASECHANGELOG` before vs after the upgrade boot is identical
    (only `orderexecuted`/timestamps of the runAlways rows changed).
  - **No destructive DDL** from Liquibase. (The boot log does contain
    `DROP TABLE IF EXISTS product_demand_details_tmp / order_summary_mv_temp / …` —
    these come from the Quartz materialized-view refresh jobs
    (`DataService`), which rebuild reporting cache tables at runtime; they are
    not Liquibase changesets and do not touch transactional data.)
  - App boots; `admin:password` login → 302 to home.
  - Row-count spot check (before legacy shutdown vs after develop upgrade boot) — identical:

    | table | before | after |
    |-------|--------|-------|
    | product | 8 | 8 |
    | inventory_item | 8 | 8 |
    | shipment | 0 | 0 |
    | requisition | 0 | 0 |
    | transaction_entry | 8 | 8 |
    | user | 2 | 2 |

    (`shipment`/`requisition` are 0 because the dev seed script does not create
    transactional documents; product/inventory/transaction tables carry the data
    signal here.)

## 3. Incremental / idempotency check

Booted current develop a **second** time against the same upgraded database:

- Changesets applied: **52** — again only the runAlways view rebuilds + drop-all-views.
  Zero other changesets.
- No checksum errors; `DATABASECHANGELOG` `(id, filename, md5sum)` set unchanged
  between first and second boot.
- App boots and serves login (200/302) after the second boot.

## 4. API snapshots against the upgraded database

With current develop running against the **upgraded** `openboxes_legacy`
database (not a freshly reseeded one):

```bash
cd api-snapshots && npm run snapshots:verify
```

Result: **122 passed, 0 failed, 0 skipped** — no data-dependent snapshot
differences. (The seed script had been loaded before the upgrade boots, so the
product-availability cache was already warm.)

## Issues found

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | Liquibase `setNullable` warning on MariaDB (fresh install only) | Info | Dev-container artifact (MariaDB vs production MySQL 8); no changeset failed. Re-verify once against MySQL 8 during cutover rehearsal if production runs MySQL. |
| 2 | 52 runAlways view changesets re-run on every boot | Info (expected) | Documented behavior of `views/changelog.xml` + `views/drop-all-views.xml`; adds a few seconds per boot; views are rebuilt transactionally before Quartz starts. |

No blocking or destructive issues found.

## Recommendation

**GO.** The Liquibase path is safe for production-shaped databases:

- Fresh install: 983 changesets apply cleanly end-to-end on an empty database.
- In-place upgrade from the pre-modernization baseline: zero new changesets, zero
  checksum mismatches (the Liquibase 5.x engine accepts the legacy
  `DATABASECHANGELOG` as-is), no destructive DDL, data intact, app healthy,
  full API snapshot parity (122/122).
- Repeated boots are idempotent (only documented runAlways view rebuilds).

Cutover caveat: this dry run used the dev MariaDB 10.11 container. If production
runs MySQL 8, repeat steps 2–3 once against a MySQL 8 instance (or a masked
production dump) during the cutover rehearsal; no issues are expected since the
changelogs are unchanged and CI integration tests already run on MySQL 8
Testcontainers.
