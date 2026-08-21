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
| 1.3 | Grails 4→5 | MERGED | [7d1a20b8](https://app.devin.ai/sessions/7d1a20b8bc00418ebf43153dbe5b3e57) | [#31](https://github.com/Custom-Devin-Demos/openboxes/pull/31) | Grails 5.3.6/Gradle 7.6.4/Groovy 3.0.11/GORM 7.3.1/Boot 2.7.9/Java 11; full verification: assemble, bootRun+login, Liquibase clean+seeded, Quartz, unit 1430/0, snapshots 122/122, Playwright 10/10, CI 4/4 |
| 1.4 | Grails 5→6 / Java 21 / javax→jakarta | MERGED | [06d3d9e7](https://app.devin.ai/sessions/06d3d9e7f6da44399929a4ce3b0fa265) | [#48](https://github.com/Custom-Devin-Demos/openboxes/pull/48) | Grails 6.2.3/Gradle 8.11.1/GORM 8.1.2/Boot 2.7.18/JDK 21; snapshots 122/122, Playwright 10/10, CI 4/4; jakarta deferred to Grails 7 (documented) |
| 1.5 | Re-verify Quartz jobs, Liquibase, mail/reporting integrations | MERGED | [abeaccde](https://app.devin.ai/sessions/abeaccde2b2441639a3955786e5c954c) | [#58](https://github.com/Custom-Devin-Demos/openboxes/pull/58) | Quartz 12 jobs OK; Liquibase clean+incremental+checksums OK; mail fixed (external-config 4.0.0, jakarta.activation 1.2.2); Groovy 3 String[] export fix; snapshots 122/122, Playwright 10/10, CI 4/4; pre-existing downloadPackingList CSV + invoice-template caveats documented. PHASE 1 COMPLETE |

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
| 2-locations-orgs-3 | locations-orgs-3 batch | MERGED | [5b7a039a](https://app.devin.ai/sessions/5b7a039a2dbc40cc932bbb36940d4b3f) | [#37](https://github.com/Custom-Devin-Demos/openboxes/pull/37) | 6 locationType/organization screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-orders-2 | orders-2 batch | MERGED | [069bdfbe](https://app.devin.ai/sessions/069bdfbe6144460285dc6a0eefd16eed) | [#34](https://github.com/Custom-Devin-Demos/openboxes/pull/34) | 6 order/orderAdjustmentType screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-product-catalog-3 | product-catalog-3 batch | MERGED | [1ee0331c](https://app.devin.ai/sessions/1ee0331c4eff4e2ba88d6db52887937c) | [#28](https://github.com/Custom-Devin-Demos/openboxes/pull/28) | 6 product/productAssociation screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-requisitions-2 | requisitions-2 batch | MERGED | [bc704178](https://app.devin.ai/sessions/bc704178b05d48cd9caf35b449b4bd67) | [#33](https://github.com/Custom-Devin-Demos/openboxes/pull/33) | 6 requisition screens (list/editHeader/review/pick/printDraft/process); post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-shipments-2 | shipments-2 batch | MERGED | [fc279a04](https://app.devin.ai/sessions/fc279a04d2dd4c608c378f9fa6224f02) | [#36](https://github.com/Custom-Devin-Demos/openboxes/pull/36) | 5 shipment screens (list/showDetails/send/receive/packingList); post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-stock-card-2 | stock-card-2 batch | MERGED | [eaf21e00](https://app.devin.ai/sessions/eaf21e0024bb481abde71dd75ddea3ba) | [#29](https://github.com/Custom-Devin-Demos/openboxes/pull/29) | transaction log + 4 inventoryLevel screens; snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-users-security-2 | users-security-2 batch | MERGED | [c7adc1fd](https://app.devin.ai/sessions/c7adc1fd5a45445ab4a0a35e3ff7b6a9) | [#35](https://github.com/Custom-Devin-Demos/openboxes/pull/35) | 5 role/user screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
- 2026-08-20: Phase 2 wave 3 spawned (10 batches). #25 finishing final rebase; P1.3 Grails 4->5 in progress.
- 2026-08-20: PR #25 (finance-config-3) merged. PHASE 2 WAVE 2 COMPLETE (10/10 batches merged). Wave 3 running; P1.3 Grails 4->5 in progress.
- 2026-08-20: PRs #29 (stock-card-2) and #32 (inventory-3) merged (authoritatively confirmed). PRs #27/#28/#30 conflict after those merges; rebases requested.
- 2026-08-20: P1.3 Grails 4->5 PR #31 open (Grails 5.3.6 / Gradle 7.6.4 / Groovy 3.0.11 / Boot 2.7.9); mysql backend-test CI failing — under investigation. Hold merge until wave 3 fully merged, then rebase + re-verify.
- 2026-08-20: PR #30 (admin-config-2) merged after rebase (authoritatively confirmed). #27/#28 still rebasing; may need to pick up #30 too.
- 2026-08-20: PR #27 (finance-config-4) merged after rebase (authoritatively confirmed).
- 2026-08-20: PR #28 (product-catalog-3) merged after second rebase (localizations-list.json union; authoritatively confirmed, CI 4/4).
- 2026-08-20: PR #34 (orders-2) open but conflicts with develop after #27/#30; rebase requested. Note: only pr-formatter ran on its first push — child asked to confirm all 4 checks trigger post-rebase.
- 2026-08-20: PR #34 (orders-2) merged after rebase (authoritatively confirmed, CI 4/4). Root cause of missing CI checks: GitHub skips pull_request runs on unmergeable PRs.
- 2026-08-20: PR #35 (users-security-2) open; conflicts after sibling merges (#27/#28/#30/#34); rebase requested.
- 2026-08-20: PR #33 (requisitions-2) merged (authoritatively confirmed, CI 4/4, post-rebase 122/122 + 10/10). PR #35 re-conflicted on localizations-list.json; final rebase requested.
- 2026-08-20: PR #35 (users-security-2) merged after final rebase incl. #33 (authoritatively confirmed, CI 4/4, post-rebase 122/122). Wave 3: 8/10 merged; locations-orgs-3 and shipments-2 remaining.
- 2026-08-20: PR #36 (shipments-2) merged (authoritatively confirmed, CI 4/4, post-rebase 122/122 + 10/10). Wave 3: 9/10 merged; locations-orgs-3 remaining.
- 2026-08-20: PR #37 (locations-orgs-3) open; conflicts after #35/#36 merges (localizations-list.json); rebase requested — last wave-3 batch.
- 2026-08-20: PR #37 (locations-orgs-3) merged after rebase (authoritatively confirmed, CI 4/4, post-rebase 122/122 + 10/10). PHASE 2 WAVE 3 COMPLETE (10/10 batches merged). P1.3 child signaled for final rebase of PR #31.

## Phase 2 — Wave 4 (spawned 2026-08-20)

| Batch | Scope | Status | Session | PR | Evidence |
|---|---|---|---|---|---|
| 2-admin-config-3 | admin-config-3 batch | MERGED | [ffbf2f28](https://app.devin.ai/sessions/ffbf2f28bca84576a6f819d2a86236bd) | [#43](https://github.com/Custom-Devin-Demos/openboxes/pull/43) | 6 localization/migration screens; post-rebase (incl. Grails 5) snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-inventory-4 | inventory-4 batch | MERGED | [368aac74](https://app.devin.ai/sessions/368aac744aa84ffc8bc3aa826e8f186f) | [#46](https://github.com/Custom-Devin-Demos/openboxes/pull/46) | 4 inventoryBrowser/inventorySnapshot screens (no new APIs); post-rebase snapshots 122/122, Playwright 10/10, CI 4/4; pre-existing getSummaryByProductGroup 500 (empty thumbnail list) documented, parity kept |
| 2-locations-orgs-5 | locations-orgs-5 batch | MERGED | [3f0943a8](https://app.devin.ai/sessions/3f0943a8d94b436fa5a75ada4ecc72a0) | [#44](https://github.com/Custom-Devin-Demos/openboxes/pull/44) | 6 partyRole/partyType screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4; earlier mysql8 CI failure proven flaky (local integrationTest 59/59 + CI re-run green) |
| 2-print-documents-1 | print-documents-1 batch | MERGED | [5ceccbad](https://app.devin.ai/sessions/5ceccbadf1384574ac260dacbdfa9766) | [#45](https://github.com/Custom-Devin-Demos/openboxes/pull/45) | 4 deliveryNote/document screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-product-catalog-5 | product-catalog-5 batch | MERGED | [9ebf1ea3](https://app.devin.ai/sessions/9ebf1ea32cb14502bbef64c3dccfb9c4) | [#42](https://github.com/Custom-Devin-Demos/openboxes/pull/42) | 6 productGroup/productComponent/productSupplier screens; post-rebase (incl. Grails 5) snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-reporting-1 | reporting-1 batch | MERGED | [a21481c1](https://app.devin.ai/sessions/a21481c174704fbc9a6894baec940bdb) | [#47](https://github.com/Custom-Devin-Demos/openboxes/pull/47) | 5 consumption/person/packing-list screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4; origin-filter 400 bug found+fixed in E2E |
| 2-requisitions-3 | requisitions-3 batch | MERGED | [f1f8813c](https://app.devin.ai/sessions/f1f8813c57e5486d89417f0605a04c94) | [#40](https://github.com/Custom-Devin-Demos/openboxes/pull/40) | 4 requisition/requisitionItem screens + GORM dirty-checking fix; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-shipments-3 | shipments-3 batch | MERGED | [362dc951](https://app.devin.ai/sessions/362dc95100fd44989c3a701907b71e1a) | [#38](https://github.com/Custom-Devin-Demos/openboxes/pull/38) | 5 shipmentItem screens; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4; pre-existing lot/expiration persistence quirk documented (legacy-identical) |
| 2-stocklists-1 | stocklists-1 batch | MERGED | [4c56a395](https://app.devin.ai/sessions/4c56a395ee15486595dea4441e32315c) | [#39](https://github.com/Custom-Devin-Demos/openboxes/pull/39) | 4 requisitionTemplate screens; post-rebase (incl. Grails 5) snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-users-security-3 | users-security-3 batch | MERGED | [4ec20085](https://app.devin.ai/sessions/4ec2008545fe4f3d938f00b940906626) | [#41](https://github.com/Custom-Devin-Demos/openboxes/pull/41) | 4 user screens + Groovy 3 fix (IndicatorDataService size()); post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
- 2026-08-20: Phase 2 wave 4 spawned (10 batches). Remaining after wave 4: 19 batches (admin-config-4, dashboard-auth, errors-misc, mobile-1/2, picking, print-documents-2, product-catalog-6/7/8, receiving, reporting-2/3/4, shipment-workflow, shipments-4, stock-movements, stock-transfers, stocklists-2).
## Phase 2 — Wave 5 (spawned 2026-08-20)

| Batch | Scope | Status | Session | PR | Evidence |
|---|---|---|---|---|---|
| 2-admin-config-4 | admin-config-4 batch | MERGED | [041912f2](https://app.devin.ai/sessions/041912f26500423eb7c43aa324380801) | [#49](https://github.com/Custom-Devin-Demos/openboxes/pull/49) | 5 migration/quartz screens; new /api/migration/* + /api/jobs/* (superuser-only rules kept); post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-picking | picking batch | MERGED | [e9a223ad](https://app.devin.ai/sessions/e9a223ad7c4a4b929b8d5d7b90699d62) | [#50](https://github.com/Custom-Devin-Demos/openboxes/pull/50) | 3 picklist/replenishment print views; /api/picklists|replenishments printData endpoints; print layout/page-break/toolbar parity; post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; no i18n changes |
| 2-print-documents-2 | print-documents-2 batch | MERGED | [0877fa23](https://app.devin.ai/sessions/0877fa23fb7f476f85e045d65a48378c) | [#55](https://github.com/Custom-Devin-Demos/openboxes/pull/55) | 4 document/GRN print screens; GET /api/documents + /api/goodsReceiptNotes/{id}/printData; post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; localization union verified (27 added/0 removed/0 changed); pre-existing document/upload GET 500 documented |
| 2-product-catalog-6 | product-catalog-6 batch | MERGED | [e632af0d](https://app.devin.ai/sessions/e632af0d37594179abe3905a3ebf1a06) | [#52](https://github.com/Custom-Devin-Demos/openboxes/pull/52) | 6 productSupplier/productType screens; new ProductTypeApiController + /api/productSuppliers/$id/details; post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; merged localization union verified (39 added, #55's 27 keys preserved); pre-existing productSupplier/show GSP 500 documented |
| 2-product-catalog-7 | product-catalog-7 batch | MERGED | [d2416979](https://app.devin.ai/sessions/d2416979721b4f27a9058c2f86ecf6a0) | [#56](https://github.com/Custom-Devin-Demos/openboxes/pull/56) | 6 productType/tag/uomConversion screens; /api/productTypes/{id} + /api/tags CRUD + /api/unitOfMeasureConversions; rebased additively over #52 (superset kept); post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; localization union verified (32 added/0 removed/0 changed) |
| 2-receiving | receiving batch | MERGED | [4a653a78](https://app.devin.ai/sessions/4a653a786b034b85833923f00bd8b085) | [#59](https://github.com/Custom-Devin-Demos/openboxes/pull/59) | partialReceiving (already React host) + receiveOrderWorkflow → 3-step React wizard (4 /api/receiveOrder endpoints, webflow semantics preserved); 2 minimal OrderService fixes for non-webflow scope; post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; localization union verified (30 added/0 removed/0 changed); child found+fixed order_shipment linkage bug in e2e |
| 2-reporting-2 | reporting-2 batch | MERGED | [1bfcce2f](https://app.devin.ai/sessions/1bfcce2fe6e84839afe4582f714a365c) | [#51](https://github.com/Custom-Devin-Demos/openboxes/pull/51) | 5 report print/detail screens; /api/shipments/$id/pickListReport|shippingReport + /api/reports/cycleCountReport; post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; no i18n changes; fixed pre-existing cycle-count 500 (LazyInitializationException from gpars detached proxies, repro'd on develop) |
| 2-reporting-3 | reporting-3 batch | MERGED | [a6c52d52](https://app.devin.ai/sessions/a6c52d5207a944faac49b6aa46d5f5d4) | [#53](https://github.com/Custom-Devin-Demos/openboxes/pull/53) | 5 report detail screens; /api/reports/inventoryByLocationReport + /api/shipmentOptions + /api/requestReasonCodeOptions; CSV/PDF export branches preserved server-side; post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; no i18n changes; child fixed status-filter param bug found in e2e |
| 2-shipments-4 | shipments-4 batch | MERGED | [9bd39418](https://app.devin.ai/sessions/9bd3941821b24dfba3d244b458ab4c98) | [#57](https://github.com/Custom-Devin-Demos/openboxes/pull/57) | shipmentItem/split + 4 shipmentWorkflow screens; /api/shipmentItems/$id/split + ShipmentWorkflowApiController CRUD; post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; localization union verified (22 added/0 removed/0 changed) |
| 2-stocklists-2 | stocklists-2 batch | MERGED | [d0f1323f](https://app.devin.ai/sessions/d0f1323f227641a9a754c059ba0abf7c) | [#54](https://github.com/Custom-Devin-Demos/openboxes/pull/54) | 4 requisitionTemplate/stocklist screens; sendMailContext/sendMail + /api/stocklists/location endpoints (same legacy message codes); post-rebase (JDK 21) snapshots 122/122, Playwright 10/10, CI 4/4; localization union verified (13 added/0 removed/0 changed); child found+fixed InventoryLevel min/max bug during e2e testing |

- 2026-08-20: Wave 5: PRs #50 (picking), #52 (product-catalog-6), #54 (stocklists-2) merged (authoritatively confirmed, CI 4/4 each, clean merges, additive localization unions verified incl. cross-branch union with #55 keys). Wave 5 at 5/10 merged.
- 2026-08-20: Wave 5: PR #49 (admin-config-4) and PR #55 (print-documents-2) merged (authoritatively confirmed, CI 4/4 each, clean merges; #55 localization union verified 27/0/0). 8 wave-5 batches still in progress.
- 2026-08-20: P1.4 ACCEPTED — PR #48 merged (authoritatively confirmed, CI 4/4, clean rebase onto post-wave-4 develop): Grails 6.2.3 / grails-gradle-plugin 6.2.4 / Gradle 8.11.1 / Groovy 3.0.23 / GORM 8.1.2 / Spring Boot 2.7.18 / JDK 21 (bytecode 17). Evidence: assemble+bootRun on JDK 21, Liquibase clean (983 changesets) + seeded boot, admin login, Quartz registration, snapshots 122/122, Playwright 10/10. javax→jakarta deferred to Grails 7/Spring Boot 3 (documented in PR: Grails 6 stays on javax servlet stack). Wave-5 children notified to rebase and use JDK 21.
- 2026-08-20: Phase 2 wave 5 spawned (10 batches). Remaining after wave 5: 9 batches (dashboard-auth, errors-misc, mobile-1/2, product-catalog-8, reporting-4, shipment-workflow, stock-movements, stock-transfers).
- 2026-08-20: PR #46 (inventory-4) merged (authoritatively confirmed, CI 4/4, clean merge, additive union verified: 28 keys added / 0 removed / 0 changed). PHASE 2 WAVE 4 COMPLETE (10/10 merged). P1.4 PR #48 final rebase + re-verification requested.
- 2026-08-20: PR #44 (locations-orgs-5) merged (authoritatively confirmed, CI 4/4, clean merge, post-rebase 122/122 + 10/10, additive localization union verified). #46 is the last wave-4 PR; final rebase requested.
- 2026-08-20: PR #45 (print-documents-1) merged (authoritatively confirmed, CI 4/4, post-rebase 122/122 + 10/10). Wave 4 at 8/10 merged; #44/#46 doing final rebases.
- 2026-08-20: PR #40 (requisitions-3) merged (authoritatively confirmed, CI 4/4, post-rebase 122/122 + 10/10, additive conflict resolution verified). #44/#45/#46 rebasing onto newest develop tip.
- 2026-08-20: PR #47 (reporting-1) merged (authoritatively confirmed, CI 4/4, clean merge, post-rebase 122/122 + 10/10). #40 (requisitions-3) re-conflicted; rebase requested.
- 2026-08-20: PR #38 (shipments-3) merged (authoritatively confirmed, CI 4/4, post-rebase 122/122 + 10/10). #44/#45/#46 re-conflicted after #38; rebases requested (#44 also has a mysql CI failure to fix). P1.4 child opened PR #48 (Grails 6.2.3 / Gradle 8.11.1 / JDK 21); will review after wave 4 completes and require rebase.
- 2026-08-20: PRs #39 (stocklists-1) and #41 (users-security-3) merged (authoritatively confirmed, CI 4/4, post-rebase-on-Grails-5 122/122 + 10/10). #45 re-conflicted on i18n/localizations; rebase requested.
- 2026-08-20: PRs #42 (product-catalog-5) and #43 (admin-config-3) merged (authoritatively confirmed, CI 4/4, post-rebase-on-Grails-5 122/122 + 10/10). #38/#39 rebasing onto Grails 5 develop; #41 monitoring CI.
- 2026-08-20: PR #31 (P1.3 Grails 4→5) MERGED (authoritatively confirmed; rebased onto wave-3-complete develop; CI 4/4; full verification incl. Liquibase clean+seeded, Quartz, 122/122, 10/10). PHASE 1.3 ACCEPTED. P1.4 (Grails 5→6 / Java 21 / jakarta) child spawned (06d3d9e7).
- 2026-08-20: Wave 5: PR #51 (reporting-2) merged (CI 4/4, clean merge, no i18n changes; includes fix for pre-existing cycle-count 500 reproduced on develop). Wave 5 at 6/10 merged. #56 (product-catalog-7) and #57 (shipments-4) open with green CI but conflicting with develop — children rebasing additively.
- 2026-08-20: Wave 5: PR #57 (shipments-4) merged post-rebase (CI 4/4, clean merge, localization union 22 added/0 removed/0 changed). Wave 5 at 7/10 merged.
- 2026-08-20: P1.5 (#58) merged — PHASE 1 (backend upgrades) COMPLETE: Java 21 / Grails 6.2.3 / Boot 2.7.18 with all integrations re-verified (Quartz, Liquibase, mail, reporting). Pre-existing caveats documented in docs/migration/integrations-verification.md.
- 2026-08-20: Wave 5: PRs #56 (product-catalog-7, rebased additively over #52) and #53 (reporting-3) merged (CI 4/4 each, clean merges, localization unions verified: #56 32 added/0 removed, #53 no i18n changes). Wave 5 at 9/10 merged; only receiving (#59) remains, child rebasing.

## Phase 2 — wave 6 (final 9 batches, spawned 2026-08-20)

| # | Task | Status | Session | PR | Notes |
|---|---|---|---|---|---|
| 2-dashboard-auth | dashboard-auth batch | MERGED | [0a087765](https://app.devin.ai/sessions/0a087765e4e342e59ae0f9b5ea176a48) | [#68](https://github.com/Custom-Devin-Demos/openboxes/pull/68) | auth/login+signup+chooseLocation migrated; common/react.gsp preserved as SPA host; megamenu via /api/getMenuConfig with permission filtering; anonymous /api/loginContext + /api/signupContext; all 3 login flows re-verified; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4 |
| 2-errors-misc | errors-misc batch | IN_PROGRESS | [5f96b368](https://app.devin.ai/sessions/5f96b368c1574241ba1c350ec02c945b) | — | 5 error pages (status codes preserved) |
| 2-mobile-1 | mobile-1 batch | IN_PROGRESS | [8663f28c](https://app.devin.ai/sessions/8663f28c912844519d84bbe7e1de14ed) | — | mobile login/chooseLocation/index/error |
| 2-mobile-2 | mobile-2 batch | MERGED | [a6fbe255](https://app.devin.ai/sessions/a6fbe255040e452a9a067fad7be0200f) | [#61](https://github.com/Custom-Devin-Demos/openboxes/pull/61) | 4 mobile screens (menu/productList/productDetails/outboundList); /api/mobile/productSummaries[/id] + /api/mobile/outboundItems; additive menuBar action keeps header for mobile-1; post-rebase (incl. #59) snapshots 122/122, Playwright 10/10, CI 4/4; localization union verified (12 added/0 removed/0 changed) |
| 2-product-catalog-8 | product-catalog-8 batch | MERGED | [4db11c99](https://app.devin.ai/sessions/4db11c99507542808c32c2d3931da794) | [#60](https://github.com/Custom-Devin-Demos/openboxes/pull/60) | uomConversion list/edit; /api/unitOfMeasureConversions CRUD; rebased twice over #59/#61 additively; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4; localization union verified (8 added/0 removed/0 changed) |
| 2-reporting-4 | reporting-4 batch | MERGED | [9aea9c11](https://app.devin.ai/sessions/9aea9c118fec4a60be67fc20d25fab70) | [#64](https://github.com/Custom-Devin-Demos/openboxes/pull/64) | showTransactionReport + 4 transactionEntry screens; /api/reports/transactionReportMetadata + /api/transactionEntries CRUD; report calc/CSV export unchanged server-side; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4; no i18n changes |
| 2-shipment-workflow | shipment-workflow batch | IN_PROGRESS | [48c116e0](https://app.devin.ai/sessions/48c116e04d5b40f0b2534f56e03693a8) | — | createShipmentWorkflow 5-step webflow |
| 2-stock-movements | stock-movements batch | IN_PROGRESS | [a73c93a9](https://app.devin.ai/sessions/a73c93a9ffa54d4bbd341b78eadec84e) | — | stockMovement list/show/addComment/addDocument |
| 2-stock-transfers | stock-transfers batch | MERGED | [36e97af6](https://app.devin.ai/sessions/36e97af6efc749e49705ae20932ae48f) | [#65](https://github.com/Custom-Devin-Demos/openboxes/pull/65) | returns/show + stockTransfer list/show/print; 3 new API endpoints; print zone-order/page-break/columns preserved; post-rebase snapshots 122/122, Playwright 10/10, CI 4/4; child fixed STOCK_TRANSFER_URL.list() crash; noted deviation: React disables Edit on COMPLETED transfers (GSP showed enabled link) |

- 2026-08-20: Phase 2 wave 6 spawned (final 9 batches). After wave 6 + receiving (#59), all 58 Phase 2 batches will be complete.
- 2026-08-20: Wave 5 COMPLETE (10/10 merged): PR #59 (receiving) merged post-rebase (CI 4/4, clean merge, localization union 30 added/0 removed/0 changed).
