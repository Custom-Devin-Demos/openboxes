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
| 0.1 | App running via Docker (MySQL + seed data); fix fork CI | PENDING | | | |
| 0.2 | Dead-screen audit: GSPs with no route/menu refs; live-screen inventory | PENDING | | | |
| 0.3 | Playwright golden-path characterization flows (login, receive stock, requisition, stock movement, ship, putaway, cycle count, invoice) | PENDING | | | Blocked by 0.1 |
| 0.4 | API snapshot tests: all 52 API controllers vs seeded data (parity oracle) | PENDING | | | Blocked by 0.1 |

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
