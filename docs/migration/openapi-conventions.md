# OpenAPI spec & contract-test conventions

Phase 3, task 3.0 of the OpenBoxes modernization program.

The [`openapi/`](../../openapi/) directory holds the OpenAPI 3.0.3
specification of the OpenBoxes REST API (`/openboxes/api/**`) plus a
contract-test runner that validates live responses from a running seeded app
against the spec. It complements the api-snapshots parity oracle
([characterization-api.md](characterization-api.md)): snapshots freeze exact
payloads, the OpenAPI spec formalizes the *contract* (types, required fields,
statuses) that any future backend must honor.

## Layout

```
openapi/
├── openbox.yaml                  # root document (info, servers, security, tags,
│                                 #   x-fragments list — the only shared file)
├── paths/<domain>.yaml           # one fragment per domain: map of path -> PathItem
├── components/
│   ├── schemas/common.yaml       # shared schemas (ErrorResponse, PaginatedList)
│   ├── schemas/<domain>.yaml     # per-domain schemas: map of SchemaName -> Schema
│   ├── parameters.yaml           # shared parameters (max, offset, sort, order)
│   └── responses.yaml            # shared error responses (BadRequest ... ServerError)
├── src/                          # bundler + contract-test runner (Node >= 18)
├── redocly.yaml                  # lint ruleset
└── dist/openbox.bundled.json     # generated bundle (gitignored)
```

The bundler (`node src/bundle.js`, run automatically by both npm scripts)
merges every fragment listed in `openbox.yaml` `x-fragments` into `paths`, and
every `components/schemas/*.yaml` file into `components.schemas`, producing
`dist/openbox.bundled.json`. Duplicate paths/schema names across fragments are
a bundle error, as are non-document-internal `$ref`s and fragment files on
disk that are not registered in `x-fragments`.

Because each domain lives in its own fragment + schema file and touches the
shared root only by appending **one line** to `x-fragments` (plus one optional
`tags` entry), parallel sessions spec'ing different controllers do not
conflict.

## Running

Requires Node >= 18 (CI uses Node 20). Contract verification additionally
requires the seeded app running (see [baseline-setup.md](baseline-setup.md)
and [characterization-api.md](characterization-api.md) — same bring-up as the
api-snapshots harness).

```bash
cd openapi
npm install          # ajv, js-yaml, @redocly/cli
npm run contracts:lint      # bundle + redocly lint
npm run contracts:verify    # bundle + live contract tests
```

Environment: `OPENBOXES_BASE_URL` (default `http://localhost:8080/openboxes`),
`OPENBOXES_USERNAME`/`OPENBOXES_PASSWORD` (default `admin`/`password`) — same
variables and defaults as api-snapshots.

## Adding a new domain fragment (checklist for sibling sessions)

1. Create `openapi/paths/<domain>.yaml`: a YAML map of `<path> -> PathItem`
   (no `paths:` wrapper). Paths are app-relative and start with `/api/...`
   (the server URL `/openboxes` supplies the context root). Derive routes from
   `grails-app/controllers/org/pih/warehouse/UrlMappings.groovy` (note the
   generic `"/api/${resource}s"` REST mappings) and response shapes from the
   controller/service code and the committed `api-snapshots/snapshots/*.json`.
2. Create `openapi/components/schemas/<domain>.yaml`: a map of
   `SchemaName -> Schema`. Schema names are PascalCase and globally unique;
   prefix with the domain when generic (e.g. `ProductSearchResult`).
3. Register the fragment: append `  - paths/<domain>.yaml` to `x-fragments`
   in `openapi/openbox.yaml` (keep alphabetized) and add a `tags` entry for
   the domain. Do not edit anything else in the root file.
4. Conventions:
   - Every operation needs `operationId` (unique, camelCase), `summary`, and
     a domain `tag`.
   - Error responses `$ref` the shared components
     (`#/components/responses/NotFound` etc.); the JSON error body is
     `#/components/schemas/ErrorResponse`
     (`{errorCode, errorMessage[, cause][, errorMessages]}` as rendered by
     `ErrorsController`).
   - List endpoints returning `{data: [...], totalCount: n}` should use the
     shared pagination parameters
     (`#/components/parameters/maxParam|offsetParam|sortParam|orderParam`).
   - Auth is the global `sessionCookie` security scheme (JSESSIONID via
     `POST /api/login`); do not re-declare it per operation.
   - Use `nullable: true` for fields the API omits-or-nulls; only mark
     `required` the fields always present (check snapshots).
5. Contract tests:
   - GET operations without path parameters are auto-tested (plain request,
     documented status + schema validation).
   - GET operations **with** path parameters need an `x-contract-tests` list
     on the operation with `params` templates. Fixture placeholders resolved
     from seeded demo data: `{facilityId}`, `{supplierId}`, `{productId}`,
     `{productCode}`, `{categoryId}`, `{organizationId}` (see
     `openapi/src/fixtures.js` — same natural-key resolution as
     api-snapshots). Literal values are also fine (e.g. a known message code).
     Case fields: `name`, `params`, `query` (map or raw string), `body`,
     `status` (expected HTTP status), `skip` (reason string).
   - Mutating operations (post/put/patch/delete) are validated schema-only by
     default: give every requestBody and response an `example` (validated
     against its schema). Only add a live `x-contract-tests` case for a
     mutation if it creates scratch data and cleans up after itself
     (mirroring api-snapshots' mutating scenarios); never mutate seeded rows.
6. Verify: `npm run contracts:lint` and `npm run contracts:verify` (against a
   running seeded app) must pass with your fragment; `cd api-snapshots &&
   npm run snapshots:verify` must stay 122/122.

The Localization API (`paths/localization.yaml` +
`components/schemas/localization.yaml`) is the reference implementation of
all of the above.

## CI

`.github/workflows/api-contracts.yml` lints the spec on every PR touching
`openapi/**`, and runs the live contract tests with the same
MariaDB + seeded-demo-data + `bootRun` bring-up as the API-snapshots workflow.
The live job is `workflow_dispatch` + weekly (same rationale as
api-snapshots: app boot takes ~15–25 min); the lint job is a cheap per-PR
check.
