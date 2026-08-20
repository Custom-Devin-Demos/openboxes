# OpenBoxes API snapshot tests (characterization / parity oracle)

JSON snapshot tests for the legacy OpenBoxes REST API (`/openboxes/api/**`),
recorded against the seeded demo database. They are the **parity oracle** for
the backend modernization: every later backend change (Grails 3 → 4 → 5 → 6,
Java 8 → 21) must produce identical responses, or the diff must be explicitly
reviewed and the snapshots deliberately re-recorded.

Zero runtime dependencies — plain Node (>= 18).

## Prerequisites

1. Database running and seeded with demo data:

   ```bash
   docker start openboxes-db      # or: docker compose -f docker/docker-compose-dev.yml up -d
   docker exec -i openboxes-db mysql -uopenboxes -popenboxes openboxes < docker/seed-demo-data.sql
   ```

2. Application running (see `docs/migration/baseline-setup.md`):

   ```bash
   JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64 ./gradlew bootRun
   ```

   Note: the app must have been (re)started **after** the seed script was
   loaded so the product-availability cache reflects the seeded stock.

## Usage

```bash
cd api-snapshots

# Compare live responses against the committed snapshots (CI mode; exit != 0 on any diff)
npm run snapshots:verify

# Re-record all snapshots (only after an intentional, reviewed behavior change)
npm run snapshots:update
```

Configuration via environment variables:

| Variable             | Default                           |
|----------------------|-----------------------------------|
| `OPENBOXES_BASE_URL` | `http://localhost:8080/openboxes` |
| `OPENBOXES_USERNAME` | `admin`                           |
| `OPENBOXES_PASSWORD` | `password`                        |

## Layout

- `src/endpoints.js` — the endpoint inventory (one entry per snapshotted GET
  endpoint, grouped by controller, with fixture placeholders).
- `src/scenarios.js` — self-contained mutating scenarios
  (create → read → delete on scratch data; each cleans up after itself).
- `src/fixtures.js` — resolves ids from the seeded data by stable natural keys
  (never hard-coded database ids).
- `src/normalize.js` — normalization of volatile fields (all normalizations
  are documented in the file header and in
  `docs/migration/characterization-api.md`).
- `src/client.js` — session-cookie auth against `/api/login`.
- `src/run.js` — runner (update / verify modes).
- `snapshots/*.json` — committed baseline snapshots (one file per endpoint).

Snapshots intentionally include **error responses** (e.g. HTTP 400/404/500
from endpoints that require data absent from the seed, or from `NoopApiController`)
— error shape and status codes are part of the characterized API contract.

Coverage table (all 52 API controllers): `docs/migration/characterization-api.md`.
