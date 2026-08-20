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
| 1.1 | Java 8→11 + dependency cleanup | PENDING | | | Blocked by Phase 0 |
| 1.2 | Grails 3→4 | PENDING | | | Blocked by 1.1 |
| 1.3 | Grails 4→5 | PENDING | | | Blocked by 1.2 |
| 1.4 | Grails 5→6 / Java 21 / javax→jakarta | PENDING | | | Blocked by 1.3 |
| 1.5 | Re-verify Quartz jobs, Liquibase, mail/reporting integrations | PENDING | | | Blocked by 1.4 |

## Phase 2 — UI: GSP → React (parallel module waves; can start after Phase 0)

| # | Task | Status | Session | PR | Notes |
|---|------|--------|---------|----|-------|
| 2.0 | Module batching plan (from 0.2 live-screen inventory) | PENDING | | | Coordinator task |
| 2.x | Module batches (3–6 related live screens each, incl. missing API endpoints) | PENDING | | | Populated after 0.2 |
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
