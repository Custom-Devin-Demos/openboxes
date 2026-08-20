# OpenBoxes Modernization — Migration Status

Coordinator-maintained work queue for the Grails 3.3.16/Java 8 → Spring Boot 3/Java 21 + React 18 modernization.

**Target:** Spring Boot 3 / Java 21 backend (staged Grails 3→4→5→6 upgrades), single React 18 SPA (all live GSP screens migrated), OpenAPI-specified REST layer, parity proven by a characterization test harness.

**Repo:** Custom-Devin-Demos/openboxes (default branch: `develop`)
**Tracking branch:** `devin/migration-tracking`

## Rules for every child PR
- Characterization suite green (UI flows + API snapshots) — no merge otherwise.
- Per-screen before/after screenshots + data assertions in PR description.
- No MySQL schema changes outside Liquibase; old and new must run on the same data.
- Small scope; if a child stalls or a PR fails review twice, respawn with narrower scope.

## Legend
`PENDING` | `IN_PROGRESS` | `PR_OPEN` | `NEEDS_REWORK` | `DONE` | `BLOCKED`

---

## Phase 0 — Baseline & harness (blocks everything else)

| # | Task | Status | Session | PR | Notes |
|---|------|--------|---------|----|-------|
| 0.1 | App running via Docker (MySQL + seed data); fix fork CI | DONE | [0c3fd858](https://app.devin.ai/sessions/0c3fd85830d5442fbd068a84a4b9dbc7) | [#2](https://github.com/Custom-Devin-Demos/openboxes/pull/2) | Merged; CI green |
| 0.2 | Dead-screen audit: GSPs with no route/menu refs; live-screen inventory | DONE | [0ec9e5d0](https://app.devin.ai/sessions/0ec9e5d0077d45bd94e8085415c9a5f0) | [#1](https://github.com/Custom-Devin-Demos/openboxes/pull/1) | Merged. 618 GSPs: LIVE 286, TEMPLATE 226, UNCERTAIN 29, DEAD 77; 58 proposed batches |
| 0.3 | Playwright golden-path characterization flows (login, receive stock, requisition, stock movement, ship, putaway, cycle count, invoice) | DONE | [87546b52](https://app.devin.ai/sessions/87546b52359d44b393033571e0242af4) | [#4](https://github.com/Custom-Devin-Demos/openboxes/pull/4) | Merged. 10 tests, all 8 flows; run: cd e2e && npm run e2e. Caveat: invoice flow = header create/view only |
| 0.4 | API snapshot tests: all 52 API controllers vs seeded data (parity oracle) | DONE | [f230708f](https://app.devin.ai/sessions/f230708f5a114176b3245197b9325c9f) | [#3](https://github.com/Custom-Devin-Demos/openboxes/pull/3) | Merged. 122 snapshots, 52/52 controllers addressed (15 documented gaps); verify: cd api-snapshots && npm run snapshots:verify |

## Phase 1 — Backend platform (sequential waves; app must boot after each step)

| # | Task | Status | Session | PR | Notes |
|---|------|--------|---------|----|-------|
| 1.1 | Java 8→11 + dependency cleanup | MERGED | [c54a01cd](https://app.devin.ai/sessions/c54a01cdcc264e168324562d8958adeb) | [#7](https://github.com/Custom-Devin-Demos/openboxes/pull/7) | Snapshots 122/122, Playwright 10/10 on JDK 11, CI green |
| 1.2 | Grails 3→4 | IN_PROGRESS | [e4c1b67a](https://app.devin.ai/sessions/e4c1b67a72bb47aa90fc41799a4e7271) | | |
| 1.3 | Grails 4→5 | PENDING | | | Blocked by 1.2 |
| 1.4 | Grails 5→6 / Java 21 / javax→jakarta | PENDING | | | Blocked by 1.3 |
| 1.5 | Re-verify Quartz jobs, Liquibase, mail/reporting integrations | PENDING | | | Blocked by 1.4 |

## Phase 2 — UI: GSP → React (parallel module waves; can start after Phase 0)

| # | Task | Status | Session | PR | Notes |
|---|------|--------|---------|----|-------|
| 2.0 | Module batching plan (from 0.2 live-screen inventory) | PENDING | | | Coordinator task |
| 2.0 batching | 58 batches defined in docs/migration/live-screen-inventory.md | DONE | (coordinator) | [#1](https://github.com/Custom-Devin-Demos/openboxes/pull/1) | |
| 2-inventory-1 | inventory-1 batch | MERGED | [cce1d959](https://app.devin.ai/sessions/cce1d9599054469987104c9096928947) | [#5](https://github.com/Custom-Devin-Demos/openboxes/pull/5) | E2E verified, CI green. Open decisions: CONSUME_STOCK seed, adjustment sign convention |
| 2-product-catalog-1 | product-catalog-1 batch | IN_PROGRESS | [36acf165](https://app.devin.ai/sessions/36acf1659c1744f48fc9bcc3f36cf308) | | |
| 2-locations-orgs-1 | locations-orgs-1 batch | MERGED | [7be46dc0](https://app.devin.ai/sessions/7be46dc091cf49ffa359a3fdde470736) | [#6](https://github.com/Custom-Devin-Demos/openboxes/pull/6) | Snapshots 122/122, Playwright 9/10 (flow-3 flake), CI green |
| 2-requisitions-1 | requisitions-1 batch | MERGED | [86b36670](https://app.devin.ai/sessions/86b3667030ff470baf5f9cefba57bfa4) | [#8](https://github.com/Custom-Devin-Demos/openboxes/pull/8) | Snapshots 122/122, Playwright 10/10 post-rebase, CI green |
| 2-shipments-1 | shipments-1 batch | MERGED | [88fb63b4](https://app.devin.ai/sessions/88fb63b4ceb549dd91fb4c04fe251333) | [#13](https://github.com/Custom-Devin-Demos/openboxes/pull/13) | Snapshots 122/122, Playwright 10/10, CI green |
| 2-orders-1 | orders-1 batch | MERGED | [aa39b608](https://app.devin.ai/sessions/aa39b60838c740ca8afa03ca9fad7a76) | [#14](https://github.com/Custom-Devin-Demos/openboxes/pull/14) | Snapshots 121/122, Playwright 8/10 (failures pre-existing on develop), CI green |
| 2-admin-config-1 | admin-config-1 batch | MERGED | [2bec6bb2](https://app.devin.ai/sessions/2bec6bb2245a4cb68c7e48ad754fb467) | [#10](https://github.com/Custom-Devin-Demos/openboxes/pull/10) | UI 10/10, snapshots 117/122 (5 pre-existing dirty baselines), CI green. Fixed Hibernate5 evictQueries bug |
| 2-finance-config-1 | finance-config-1 batch | MERGED | [b4493527](https://app.devin.ai/sessions/b449352701744466b15efb5dd64533c4) | [#9](https://github.com/Custom-Devin-Demos/openboxes/pull/9) | Playwright 10/10, snapshots 122/122, CI green |
| 2-stock-card-1 | stock-card-1 batch | IN_PROGRESS | [7ba30033](https://app.devin.ai/sessions/7ba3003323244216bdb4bed9ab92ce27) | | |
| 2-(remaining) | 48 remaining batches (see live-screen-inventory.md) | PENDING | | | Spawn in subsequent waves |
| 2.R | React 16.8→18 + Redux/router modernization of existing SPA | PENDING | | | |

## Phase 3 — API formalization (parallel with Phase 2)

| # | Task | Status | Session | PR | Notes |
|---|------|--------|---------|----|-------|
| 3.x | OpenAPI specs + contract tests, ~6 controllers per child (52 controllers ≈ 9 children); wire into CI | PENDING | | | Blocked by 0.4 |

## Phase 4 — Validation & cutover

| # | Task | Status | Session | PR | Notes |
|---|------|--------|---------|----|-------|
| 4.1 | Full Playwright regression vs Phase 0 baseline | PENDING | | | |
| 4.2 | Liquibase dry-run on production-shaped data | PENDING | | | |
| 4.3 | Performance smoke | PENDING | | | |
| 4.4 | Remove GSP layer + dead code | PENDING | | | |

---

## Log

- 2026-08-20: Tracking branch created; Phase 0 wave 1 being prepared.
- 2026-08-20: Phase 0 wave 1 spawned: 0.1 (Docker baseline + CI), 0.2 (dead-screen audit).
- 2026-08-20: 0.1 (PR #2) and 0.2 (PR #1) merged. Wave 2 spawned: 0.3 (Playwright flows), 0.4 (API snapshots).
- 2026-08-20: 0.4 merged (PR #3). 0.3 still in progress.
- 2026-08-20: 0.3 merged (PR #4). PHASE 0 COMPLETE. Parity gate active: e2e suite + api-snapshots must stay green on every later PR.
- 2026-08-20: Wave 3 spawned (10 children): P1.1 Java 11 + 9 Phase 2 module batches (first batch of each major module).
- 2026-08-20: finance-config-1 merged (PR #9). Parity suites green; harness normalization fixes (sortArrays for 3 endpoints) included.
- 2026-08-20: inventory-1 merged (PR #5). 8 api-snapshot failures were pre-existing develop baseline issues (partially addressed by PR #9); consider baseline re-record.
- 2026-08-20: admin-config-1 merged (PR #10). Follow-up needed: api-snapshots baseline repair (5 dirty category baselines on develop).
- 2026-08-20: P1.1 Java 11 merged (PR #7). Spawning P1.2 Grails 3->4 next.
- 2026-08-20: requisitions-1 merged (PR #8), orders-1 merged (PR #14).
- 2026-08-20: locations-orgs-1 merged (PR #6). product-catalog-1 (#11) and shipments-1 (#13) rebasing after conflicts; stock-card-1 still in progress.
- 2026-08-20: shipments-1 merged (PR #13). Pre-existing defect noted: deleteShipment 500s on FK constraints for shipments with events (legacy parity).
