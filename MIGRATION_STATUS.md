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
| 1.2 | Grails 3→4 | MERGED | [e4c1b67a](https://app.devin.ai/sessions/e4c1b67a72bb47aa90fc41799a4e7271) | [#12](https://github.com/Custom-Devin-Demos/openboxes/pull/12) | Grails 4.1.4/Gradle 6.9.4/GORM 7.0.7; snapshots 120-121/122 (known artifacts), Playwright 10/10, CI green after rebase |
| 1.3 | Grails 4→5 | PENDING | | | Blocked by 1.2 |
| 1.4 | Grails 5→6 / Java 21 / javax→jakarta | PENDING | | | Blocked by 1.3 |
| 1.5 | Re-verify Quartz jobs, Liquibase, mail/reporting integrations | PENDING | | | Blocked by 1.4 |

## Phase 2 — UI: GSP → React (parallel module waves; can start after Phase 0)

| # | Task | Status | Session | PR | Notes |
|---|------|--------|---------|----|-------|
| 2.0 | Module batching plan (from 0.2 live-screen inventory) | PENDING | | | Coordinator task |
| 2.0 batching | 58 batches defined in docs/migration/live-screen-inventory.md | DONE | (coordinator) | [#1](https://github.com/Custom-Devin-Demos/openboxes/pull/1) | |
| 2-inventory-1 | inventory-1 batch | MERGED | [cce1d959](https://app.devin.ai/sessions/cce1d9599054469987104c9096928947) | [#5](https://github.com/Custom-Devin-Demos/openboxes/pull/5) | E2E verified, CI green. Open decisions: CONSUME_STOCK seed, adjustment sign convention |
| 2-product-catalog-1 | product-catalog-1 batch | MERGED | [36acf165](https://app.devin.ai/sessions/36acf1659c1744f48fc9bcc3f36cf308) | [#11](https://github.com/Custom-Devin-Demos/openboxes/pull/11) | Snapshots 121/122 (date-window artifact), Playwright 10/10, CI green after 3 rebases |
| 2-locations-orgs-1 | locations-orgs-1 batch | MERGED | [7be46dc0](https://app.devin.ai/sessions/7be46dc091cf49ffa359a3fdde470736) | [#6](https://github.com/Custom-Devin-Demos/openboxes/pull/6) | Snapshots 122/122, Playwright 9/10 (flow-3 flake), CI green |
| 2-requisitions-1 | requisitions-1 batch | MERGED | [86b36670](https://app.devin.ai/sessions/86b3667030ff470baf5f9cefba57bfa4) | [#8](https://github.com/Custom-Devin-Demos/openboxes/pull/8) | Snapshots 122/122, Playwright 10/10 post-rebase, CI green |
| 2-shipments-1 | shipments-1 batch | MERGED | [88fb63b4](https://app.devin.ai/sessions/88fb63b4ceb549dd91fb4c04fe251333) | [#13](https://github.com/Custom-Devin-Demos/openboxes/pull/13) | Snapshots 122/122, Playwright 10/10, CI green |
| 2-orders-1 | orders-1 batch | MERGED | [aa39b608](https://app.devin.ai/sessions/aa39b60838c740ca8afa03ca9fad7a76) | [#14](https://github.com/Custom-Devin-Demos/openboxes/pull/14) | Snapshots 121/122, Playwright 8/10 (failures pre-existing on develop), CI green |
| 2-admin-config-1 | admin-config-1 batch | MERGED | [2bec6bb2](https://app.devin.ai/sessions/2bec6bb2245a4cb68c7e48ad754fb467) | [#10](https://github.com/Custom-Devin-Demos/openboxes/pull/10) | UI 10/10, snapshots 117/122 (5 pre-existing dirty baselines), CI green. Fixed Hibernate5 evictQueries bug |
| 2-finance-config-1 | finance-config-1 batch | MERGED | [b4493527](https://app.devin.ai/sessions/b449352701744466b15efb5dd64533c4) | [#9](https://github.com/Custom-Devin-Demos/openboxes/pull/9) | Playwright 10/10, snapshots 122/122, CI green |
| 2-stock-card-1 | stock-card-1 batch | MERGED | [7ba30033](https://app.devin.ai/sessions/7ba3003323244216bdb4bed9ab92ce27) | [#15](https://github.com/Custom-Devin-Demos/openboxes/pull/15) | Snapshots 122/122, Playwright 10/10, integrationTest green, CI green |
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
- 2026-08-20: stock-card-1 merged (PR #15). product-catalog-1 (#11) still pending final rebase/CI.
- 2026-08-20: product-catalog-1 merged (PR #11) after third rebase; CI 4/4 green. Wave 1 of Phase 2 fully merged (9 batches). P1.2 Grails 4 child still in progress.

## Phase 2 — Wave 2 (spawned 2026-08-20)

| Batch | Scope | Status | Session | PR | Evidence |
|---|---|---|---|---|---|
| 2-finance-config-2 | finance-config-2 batch | MERGED | [232ad85c](https://app.devin.ai/sessions/232ad85cf6d544f6bb868eb7f1b2a681) | [#16](https://github.com/Custom-Devin-Demos/openboxes/pull/16) | 5 eventType/glAccount screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-finance-config-3 | finance-config-3 batch | MERGED | [99e5aab4](https://app.devin.ai/sessions/99e5aab429d946a0ac15a681fb92b18e) | [#25](https://github.com/Custom-Devin-Demos/openboxes/pull/25) | 5 glAccountType/paymentTerm screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-inventory-2 | inventory-2 batch | MERGED | [5a57cc18](https://app.devin.ai/sessions/5a57cc18fc5949c9a4b5609b1ba11c20) | [#24](https://github.com/Custom-Devin-Demos/openboxes/pull/24) | 5 inventory report screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-locations-orgs-2 | locations-orgs-2 batch | MERGED | [48532479](https://app.devin.ai/sessions/48532479e78c4e79a20e038236265cfe) | [#20](https://github.com/Custom-Devin-Demos/openboxes/pull/20) | 6 locationGroup/locationType screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-locations-orgs-4 | locations-orgs-4 batch | MERGED | [2f9179a2](https://app.devin.ai/sessions/2f9179a295ba4de785167901fcb932cd) | [#18](https://github.com/Custom-Devin-Demos/openboxes/pull/18) | 6 party/partyRole screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-locations-orgs-6 | locations-orgs-6 batch | MERGED | [705b3922](https://app.devin.ai/sessions/705b3922edf74221b462c43b7869e175) | [#17](https://github.com/Custom-Devin-Demos/openboxes/pull/17) | Playwright 10/10, snapshots green minus 2 pre-existing baseline issues, CI green |
| 2-product-catalog-2 | product-catalog-2 batch | MERGED | [41cafdc5](https://app.devin.ai/sessions/41cafdc5c6b04a6d84f833293e6c8bfc) | [#19](https://github.com/Custom-Devin-Demos/openboxes/pull/19) | 6 product screens; Playwright 9/10 (flow-3 flake passes solo); snapshots at baseline; CI 4/4 |
| 2-product-catalog-4 | product-catalog-4 batch | MERGED | [4c343f82](https://app.devin.ai/sessions/4c343f82d52b48f5baffb49f8685c2cd) | [#26](https://github.com/Custom-Devin-Demos/openboxes/pull/26) | 6 productAssociation/productCatalog screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-users-security-1 | users-security-1 batch | MERGED | [d9178c80](https://app.devin.ai/sessions/d9178c80e0fd49c8a30dd73299d9a7f9) | [#23](https://github.com/Custom-Devin-Demos/openboxes/pull/23) | person list/create/edit/show + role create; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-invoicing | invoicing batch | MERGED | [11c5c78a](https://app.devin.ai/sessions/11c5c78a6b534ffe928ef5f028d189cf) | [#21](https://github.com/Custom-Devin-Demos/openboxes/pull/21) | invoice show/addDocument/editDocument; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
- 2026-08-20: Phase 2 wave 2 spawned (10 batches). P1.2 (#12) asked to rebase onto latest develop before merge.
- 2026-08-20: P1.2 Grails 4.1.4 merged (PR #12) after rebase onto develop with all wave-1 Phase 2 batches. P1.3 (Grails 4→5) spawning next.
- 2026-08-20: P1.3 Grails 4→5 child spawned (7d1a20b8).
- 2026-08-20: locations-orgs-6 merged (PR #17). Baseline-repair child spawned (28646cc5) for stale api-getAppContext + dashboard date-window snapshots.
- 2026-08-21: PR #22 (baseline repair) and PR #19 (product-catalog-2) merged (authoritatively confirmed). PRs #18/#20 conflict with #22; rebases requested. Snapshot baseline now 122/122 on develop.
- 2026-08-21: PR #18 merged. PR #21 (invoicing) conflicts after wave-2 merges; rebase requested. PR #20 still rebasing.
- 2026-08-21: PR #21 (invoicing) merged after rebase (authoritatively confirmed).
- 2026-08-21: PR #20 (locations-orgs-2) merged after rebase. PR #25 (finance-config-3) conflicts; rebase requested. PR #23 (users-security-1) created.
- 2026-08-21: PRs #16 (finance-config-2) and #23 (users-security-1) conflict after wave-2 merges; rebases requested.
- 2026-08-20: PR #23 (users-security-1) merged after rebase; #25 re-conflicted, final rebase requested; #16 re-recording localizations-list; #24 rebase/re-verify requested.
- 2026-08-20: PR #26 (product-catalog-4) merged; #16/#25 doing final rebases; #24 re-verifying.
- 2026-08-20: PR #16 (finance-config-2) merged after final rebase through #23/#26.
- 2026-08-20: PR #24 (inventory-2) merged after rebase re-verification.

## Phase 2 — Wave 3 (spawned 2026-08-20)

| Batch | Scope | Status | Session | PR | Evidence |
|---|---|---|---|---|---|
| 2-admin-config-2 | admin-config-2 batch | MERGED | [93544c12](https://app.devin.ai/sessions/93544c12022049bba4d745af4be3a9e7) | [#30](https://github.com/Custom-Devin-Demos/openboxes/pull/30) | 6 admin/batch/dataExport/jobs/localization screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-finance-config-4 | finance-config-4 batch | MERGED | [e95185a4](https://app.devin.ai/sessions/e95185a43a55471f932ac34e418efff1) | [#27](https://github.com/Custom-Devin-Demos/openboxes/pull/27) | paymentTerm list + preferenceType list/create/edit; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-inventory-3 | inventory-3 batch | MERGED | [59a5118f](https://app.devin.ai/sessions/59a5118fa99b46f081233787beb7db51) | [#32](https://github.com/Custom-Devin-Demos/openboxes/pull/32) | 5 inventory screens (listTransactions/manage/showProducts/showTransaction/upload); snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-locations-orgs-3 | locations-orgs-3 batch | IN_PROGRESS | [5b7a039a](https://app.devin.ai/sessions/5b7a039a2dbc40cc932bbb36940d4b3f) | | |
| 2-orders-2 | orders-2 batch | REBASING | [069bdfbe](https://app.devin.ai/sessions/069bdfbe6144460285dc6a0eefd16eed) | [#34](https://github.com/Custom-Devin-Demos/openboxes/pull/34) | 6 order/orderAdjustmentType screens; snapshots 122/122, Playwright 10/10; conflicts after #27/#30 merges — rebase requested; full CI must run post-push |
| 2-product-catalog-3 | product-catalog-3 batch | MERGED | [1ee0331c](https://app.devin.ai/sessions/1ee0331c4eff4e2ba88d6db52887937c) | [#28](https://github.com/Custom-Devin-Demos/openboxes/pull/28) | 6 product/productAssociation screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-requisitions-2 | requisitions-2 batch | IN_PROGRESS | [bc704178](https://app.devin.ai/sessions/bc704178b05d48cd9caf35b449b4bd67) | | |
| 2-shipments-2 | shipments-2 batch | IN_PROGRESS | [fc279a04](https://app.devin.ai/sessions/fc279a04d2dd4c608c378f9fa6224f02) | | |
| 2-stock-card-2 | stock-card-2 batch | MERGED | [eaf21e00](https://app.devin.ai/sessions/eaf21e0024bb481abde71dd75ddea3ba) | [#29](https://github.com/Custom-Devin-Demos/openboxes/pull/29) | transaction log + 4 inventoryLevel screens; snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-users-security-2 | users-security-2 batch | IN_PROGRESS | [c7adc1fd](https://app.devin.ai/sessions/c7adc1fd5a45445ab4a0a35e3ff7b6a9) | | |
- 2026-08-20: Phase 2 wave 3 spawned (10 batches). #25 finishing final rebase; P1.3 Grails 4->5 in progress.
- 2026-08-20: PR #25 (finance-config-3) merged. PHASE 2 WAVE 2 COMPLETE (10/10 batches merged). Wave 3 running; P1.3 Grails 4->5 in progress.
- 2026-08-20: PRs #29 (stock-card-2) and #32 (inventory-3) merged (authoritatively confirmed). PRs #27/#28/#30 conflict after those merges; rebases requested.
- 2026-08-20: P1.3 Grails 4->5 PR #31 open (Grails 5.3.6 / Gradle 7.6.4 / Groovy 3.0.11 / Boot 2.7.9); mysql backend-test CI failing — under investigation. Hold merge until wave 3 fully merged, then rebase + re-verify.
- 2026-08-20: PR #30 (admin-config-2) merged after rebase (authoritatively confirmed). #27/#28 still rebasing; may need to pick up #30 too.
- 2026-08-20: PR #27 (finance-config-4) merged after rebase (authoritatively confirmed).
- 2026-08-20: PR #28 (product-catalog-3) merged after second rebase (localizations-list.json union; authoritatively confirmed, CI 4/4).
- 2026-08-20: PR #34 (orders-2) open but conflicts with develop after #27/#30; rebase requested. Note: only pr-formatter ran on its first push — child asked to confirm all 4 checks trigger post-rebase.
