# Phase 4.3 — Performance smoke: post-migration develop vs pre-migration baseline

Goal: catch gross performance regressions introduced by the platform migration
(Grails 3.3.16/Java 8 → Grails 6.2.3/Spring Boot 2.7.18/JDK 21) and the GSP→React
SPA migration, before cutover. This is a smoke, not a benchmark: dev-mode `bootRun`,
single VM, seeded demo dataset.

## Environment

| | |
|---|---|
| Host | Ubuntu 22.04 VM, 8 vCPU, 31 GB RAM, local Docker MariaDB 10 (`openboxes-db`) |
| Dataset | `docker/seed-demo-data.sql` (8 products, seeded inventory, demo locations) |
| Run mode | `./gradlew bootRun`, development environment, `-Xmx768m` app JVM (both revisions) |
| Current ("develop") | commit `a8b6e13de`, Grails 6.2.3 / Spring Boot 2.7.18 / JDK 21 (OpenJDK 21.0.11) |
| Baseline ("legacy") | commit `54993e2d8` (last pre-migration commit: Phase 0 harness merged, before PR #7 Java 8→11), Grails 3.3.16 / JDK 8, separate `openboxes_legacy` database |

Both apps were measured on the same VM, same DB container, sequentially (never
concurrently). Legacy was pointed at its own schema via
`~/.grails/openboxes-config.properties` (external config overrides `application.yml`
— note that editing only `application.yml` is NOT sufficient).

## Methodology

1. **Startup**: wall-clock from `./gradlew bootRun` invocation to the
   `Grails application running at http://localhost:8080/openboxes` log line, plus the
   Spring-reported `Started Application in N seconds`. Cold = empty DB (full Liquibase
   install); warm = seeded DB, warm Gradle daemon, compiled classes.
2. **API latency**: `docs/migration/perf/api_latency.py` — authenticates via
   `POST /api/login` (JSESSIONID), selects Main Warehouse
   (`GET /dashboard/chooseLocation/1`), then per endpoint issues 5 discarded warm-up
   requests followed by 25 timed requests (new TCP connection each; localhost).
   Reported: median / p95 / min / max in ms.
3. **Page timings**: `e2e/perf-timing.js` (plain Playwright script reusing the e2e
   harness `helpers/auth.js` login). Per page: 1 discarded warm-up navigation, then
   5 timed navigations from `about:blank`; a run is complete when `load` fired, a
   page-specific content selector is visible, and the network has been idle 500 ms
   (proxy for time-to-interactive). Run: `cd e2e && node perf-timing.js`.
4. **Memory**: after all API + page load runs (warmed JVM), `jcmd <pid> GC.run` then
   `jcmd <pid> GC.heap_info`, and RSS from `/proc/<pid>/status` (VmRSS).

## Results

### Startup

| Measurement | Legacy (Grails 3.3.16 / JDK 8) | Develop (Grails 6.2.3 / JDK 21) | Verdict |
|---|---|---|---|
| Cold boot, empty DB (Liquibase install), wall clock to ready | 93 s | ~473 s * | see note |
| Cold boot, Spring `Started Application` | 78.4 s | 35.3 s | OK (2.2× faster) |
| Warm restart (seeded DB), wall clock to ready | 70.8 s | 26.3 s / 38.6 s (2 samples) | **OK (~2× faster)** |
| Warm restart, Spring `Started Application` | 63.7 s | 16.3 s / 17.6 s | **OK (~3.7× faster)** |

\* develop's 473 s cold figure is dominated by a from-scratch Gradle 8 build
(dependency resolution, full Groovy compile, webpack production bundle) on a cold
daemon — not app startup. Legacy's cold run on a cold daemon similarly took 305 s.
With compiled classes in place, the JVM-level startup (Spring line) is the honest
comparison: develop starts ~2–3.7× faster.

### API latency (median / p95 over 25 warmed requests, ms)

| Endpoint | Legacy median | Legacy p95 | Develop median | Develop p95 | Verdict |
|---|---|---|---|---|---|
| `GET /api/products?max=10&offset=0` | 25.0 | 236.9 | 21.0 | 23.4 | OK |
| `GET /api/categories` | 9.7 | 14.6 | 12.6 | 15.0 | OK (noise) |
| `GET /api/stockMovements?direction=OUTBOUND&origin=1` | 11.9 | 14.8 | 11.9 | 15.2 | OK |
| `GET /api/products/search?name=Ibuprofen` | 7.0 | 10.3 | 9.1 | 11.2 | OK (noise) |
| `GET /api/stockCard/{id}/details?locationId=1` | n/a (404) † | — | 30.7 | 37.8 | OK (new) |
| `GET /api/stockCard/{id}/currentStock?locationId=1` | n/a (404) † | — | 18.3 | 20.9 | OK (new) |
| `GET /api/dashboard/inProgressShipments?locationId=1` | 7.1 | 10.4 | 6.2 | 8.5 | OK |
| `GET /api/dashboard/expirationSummary?locationId=1` | 7.0 | 9.1 | 6.2 | 7.6 | OK |
| `GET /api/dashboard/inventorySummary?locationId=1` | 5.7 | 7.2 | 7.0 | 8.8 | OK (noise) |
| `GET /api/dashboard/openStockRequests?locationId=1` | 6.4 | 8.9 | 7.0 | 9.1 | OK |

† The `/api/stockCard/*` routes were added during the migration (React stock card,
PR #15); no legacy equivalent — measured absolute against the p95 < 2 s sanity
threshold for detail endpoints, comfortably passed.

All develop endpoints are far under the p95 < 2 s sanity threshold for list
endpoints on seeded data. Legacy showed occasional 200–400 ms max outliers (dev-mode
class reloading / parallel-GC pauses) that develop (G1/JDK 21) does not exhibit.

### Page-level time-to-interactive (Playwright, median of 5 warmed runs, ms)

| Page | Legacy | Develop | Verdict |
|---|---|---|---|
| Dashboard (`dashboard/index`) | 1100 | 669 | OK (39% faster) |
| Product list (`product/list`) | 1069 | 689 | OK (36% faster) |
| Stock movement list — outbound (`stockMovement/list?direction=OUTBOUND`) | 1042 | 717 | OK (31% faster) |
| Stock movement create (`stockMovement/createOutbound`) | 874 | 689 | OK (21% faster) |
| Receiving — inbound list (`stockMovement/list?direction=INBOUND`) | 1014 | 701 | OK (31% faster) |
| Order list (`order/list`) | 628 | 690 | OK (within noise; +62 ms) |

The formerly-GSP pages (product list, order list, dashboard shell) are now SPA
routes; the uniform ~0.7 s develop numbers are dominated by the shared React bundle
parse + initial API fan-out, which the warm-up run's browser cache keeps constant.

### JVM memory footprint after warm-up (post `GC.run`)

| Metric | Legacy (JDK 8, ParallelGC) | Develop (JDK 21, G1) | Verdict |
|---|---|---|---|
| Process RSS | 1.53 GB | 1.17 GB | OK (−23%) |
| Heap used / committed | 651 MB / 768 MB (old gen 99% full) | 481 MB / 768 MB | OK |
| Metaspace used | 208 MB | 185 MB | OK |

Legacy's old gen sits at 99% of its 512 MB even after a forced full GC — it runs
near the heap ceiling in dev mode. Develop retains ~290 MB of headroom on the same
`-Xmx768m`.

## Verdict

| Area | Verdict |
|---|---|
| Startup time | **OK** — ~2× faster wall clock, ~3.7× faster JVM startup |
| API latency | **OK** — parity within noise on all shared endpoints; no endpoint near the 2 s p95 threshold; fewer tail outliers |
| Page time-to-interactive | **OK** — 5 of 6 pages 20–40% faster; order list within noise |
| JVM memory | **OK** — 23% lower RSS, large heap headroom vs legacy's near-full old gen |

**No gross regressions found. No blockers for cutover from a performance standpoint.**

### Hotspots / follow-ups (non-blocking)

- `GET /api/stockCard/{id}/details` is the slowest measured endpoint (median 31 ms
  on an 8-product dataset). It aggregates several queries; worth re-checking on a
  production-sized dataset (ties into Phase 4.2's production-shaped data work).
- These numbers are dev-mode (`bootRun`, no HTTP compression/CDN, TieredStopAtLevel=1
  for the app JVM under Gradle). A production WAR/container measurement would be a
  reasonable pre-cutover confirmation but was out of scope here.
- The seeded dataset is small (8 products); list-endpoint scaling was not exercised.

## Reproducing

```bash
docker start openboxes-db
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew bootRun   # wait for "Grails application running"
docker exec -i openboxes-db mysql -uopenboxes -popenboxes openboxes < docker/seed-demo-data.sql
python3 docs/migration/perf/api_latency.py                        # API latency table
cd e2e && npm install && npx playwright install chromium && node perf-timing.js   # page timings
jcmd $(pgrep -f 'grails.env=development' | head -1) GC.run
jcmd $(pgrep -f 'grails.env=development' | head -1) GC.heap_info  # heap; RSS via /proc/<pid>/status
```

For the legacy baseline: clone the repo to a separate directory (Gradle's jgit task
fails inside a git worktree), `git checkout 54993e2d8`, create an `openboxes_legacy`
schema, point `~/.grails/openboxes-config.properties` at it (external config
overrides `application.yml`), and boot with
`JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64 ./gradlew bootRun`. Restore the
config file afterwards.
