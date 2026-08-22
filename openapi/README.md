# OpenBoxes OpenAPI spec & contract tests

OpenAPI 3.0.3 specification of the OpenBoxes REST API (`/openboxes/api/**`)
composed from per-domain fragments, plus a contract-test runner that validates
live responses from a running seeded app against the spec.

```bash
npm install                 # Node >= 18 (Node 20 recommended)
npm run contracts:lint      # bundle fragments + redocly lint
npm run contracts:verify    # bundle + live contract tests (app must be running & seeded)
```

Full conventions, layout, and the checklist for adding a new domain fragment:
[docs/migration/openapi-conventions.md](../docs/migration/openapi-conventions.md).
The Localization API (`paths/localization.yaml`) is the reference fragment.
