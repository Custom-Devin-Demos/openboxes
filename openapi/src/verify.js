/**
 * Contract-test runner: validates live responses from a running seeded
 * OpenBoxes app against the bundled OpenAPI spec.
 *
 *   npm run contracts:verify        (bundles, then runs this file)
 *
 * Behavior per operation in the bundled spec:
 *  - Operations carrying `x-contract-tests` run every listed case: the
 *    request is sent (path/query/body templates resolved against seeded
 *    fixtures — see fixtures.js) and the response is validated against the
 *    spec: status must be documented, content type must match, and the JSON
 *    body must satisfy the response schema (Ajv).
 *  - GET operations without `x-contract-tests` and without path parameters
 *    are auto-tested with a plain request expecting a documented status.
 *  - Mutating operations (post/put/patch/delete) without live cases are
 *    checked schema-only: every example / examples value found in the
 *    operation's requestBody and responses is validated against its schema.
 *    (Safe: no live mutation is performed unless a fragment opts in via
 *    x-contract-tests.)
 *
 * x-contract-tests case shape (all fields optional except none):
 *   - name: string                        label for reporting
 *   - params: { <pathParam>: template }   path parameter values; templates may
 *                                         use fixture placeholders like {categoryId}
 *   - query: string | object              query string (without '?') or map
 *   - body: object                        JSON request body (live mutation — use
 *                                         only for scratch data that the case
 *                                         itself cleans up, snapshots-style)
 *   - status: number                      expected HTTP status (default: any
 *                                         documented status; body validated
 *                                         against that status's schema)
 *   - skip: string                        reason to skip (reported, not run)
 *
 * Environment: OPENBOXES_BASE_URL / OPENBOXES_USERNAME / OPENBOXES_PASSWORD
 * (same defaults as the api-snapshots harness).
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const { request, login, chooseLocation } = require('./client');
const { resolveFixtures, applyFixtures } = require('./fixtures');
const { bundle } = require('./bundle');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

/**
 * Convert an OpenAPI 3.0 schema tree to a JSON-Schema draft-07 compatible
 * one for Ajv: `nullable: true` becomes a type union, and OpenAPI-only
 * keywords are dropped.
 */
function toJsonSchema(node) {
  if (Array.isArray(node)) return node.map(toJsonSchema);
  if (node === null || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (['nullable', 'discriminator', 'xml', 'externalDocs', 'example'].includes(k)) continue;
    out[k] = toJsonSchema(v);
  }
  if (node.nullable === true) {
    if (typeof out.type === 'string') {
      out.type = [out.type, 'null'];
    } else if (out.$ref || out.allOf || out.oneOf || out.anyOf) {
      return { anyOf: [{ type: 'null' }, out] };
    } else if (out.enum && !out.enum.includes(null)) {
      out.enum = [...out.enum, null];
    }
  }
  return out;
}

function buildAjv(spec) {
  const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
  addFormats(ajv);
  const schemas = spec.components?.schemas || {};
  for (const [name, schema] of Object.entries(schemas)) {
    ajv.addSchema(toJsonSchema(schema), `#/components/schemas/${name}`);
  }
  return ajv;
}

function resolveRef(spec, node) {
  while (node && node.$ref) {
    const parts = node.$ref.replace(/^#\//, '').split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
    node = parts.reduce((n, p) => (n === undefined ? undefined : n[p]), spec);
  }
  return node;
}

function formatQuery(query, fixtures) {
  if (!query) return '';
  if (typeof query === 'string') return '?' + applyFixtures(query, fixtures);
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) usp.append(k, applyFixtures(v, fixtures));
  return '?' + usp.toString();
}

function validateBody(ajv, spec, schema, body, label, failures) {
  const validate = ajv.compile(toJsonSchema(resolveRefsDeep(spec, schema)));
  if (!validate(body)) {
    const errors = (validate.errors || []).slice(0, 5)
      .map((e) => `    ${e.instancePath || '$'} ${e.message}`)
      .join('\n');
    failures.push(`${label}\n${errors}`);
    return false;
  }
  return true;
}

/** Inline document-internal refs so Ajv compiles standalone (handles cycles by depth cap). */
function resolveRefsDeep(spec, node, depth = 0) {
  if (depth > 50) throw new Error('Schema $ref nesting too deep (possible cycle)');
  if (Array.isArray(node)) return node.map((n) => resolveRefsDeep(spec, n, depth + 1));
  if (node === null || typeof node !== 'object') return node;
  if (node.$ref) return resolveRefsDeep(spec, resolveRef(spec, node), depth + 1);
  const out = {};
  for (const [k, v] of Object.entries(node)) out[k] = resolveRefsDeep(spec, v, depth + 1);
  return out;
}

function collectExamples(node, out = [], where = '') {
  // requestBody/response -> content -> mediaType -> { schema, example, examples }
  for (const [mediaType, media] of Object.entries(node?.content || {})) {
    if (!media.schema) continue;
    if (media.example !== undefined) out.push({ schema: media.schema, value: media.example, where: `${where} ${mediaType} example` });
    for (const [name, ex] of Object.entries(media.examples || {})) {
      if (ex && ex.value !== undefined) out.push({ schema: media.schema, value: ex.value, where: `${where} ${mediaType} examples.${name}` });
    }
  }
  return out;
}

async function runLiveCase(spec, ajv, method, pathTemplate, operation, testCase, fixtures, results) {
  const label = `${method.toUpperCase()} ${pathTemplate}${testCase.name ? ` [${testCase.name}]` : ''}`;
  if (testCase.skip) {
    results.skipped.push(`${label}: ${testCase.skip}`);
    return;
  }
  let resolvedPath = pathTemplate;
  for (const [param, template] of Object.entries(testCase.params || {})) {
    resolvedPath = resolvedPath.replace(`{${param}}`, applyFixtures(template, fixtures));
  }
  if (/\{\w+\}/.test(resolvedPath)) {
    results.failed.push(`${label}: unresolved path parameter(s) in ${resolvedPath} (add "params" to the x-contract-tests case)`);
    return;
  }
  resolvedPath += formatQuery(testCase.query, fixtures);

  let body;
  if (testCase.body !== undefined) {
    body = JSON.parse(applyFixtures(JSON.stringify(testCase.body), fixtures));
  }

  const response = await request(method.toUpperCase(), resolvedPath, body !== undefined ? { body } : {});

  const responses = operation.responses || {};
  const statusKey = testCase.status !== undefined
    ? String(testCase.status)
    : (responses[String(response.status)] ? String(response.status) : (responses.default ? 'default' : null));

  if (testCase.status !== undefined && response.status !== testCase.status) {
    results.failed.push(`${label}: expected HTTP ${testCase.status}, got ${response.status} (${response.text.slice(0, 200)})`);
    return;
  }
  if (!statusKey || !responses[statusKey]) {
    results.failed.push(`${label}: HTTP ${response.status} is not documented in the spec (documented: ${Object.keys(responses).join(', ')})`);
    return;
  }

  const responseSpec = resolveRef(spec, responses[statusKey]);
  const content = responseSpec.content || {};
  const mediaKeys = Object.keys(content);
  if (mediaKeys.length === 0) {
    results.passed.push(label); // No body documented (e.g. 204).
    return;
  }

  const media = content[response.contentType] || (response.contentType.startsWith('application/json') ? content['application/json'] : null);
  if (!media) {
    results.failed.push(`${label}: response content type '${response.contentType}' not documented (documented: ${mediaKeys.join(', ')})`);
    return;
  }
  if (!media.schema) {
    results.passed.push(label);
    return;
  }
  if (response.json === null) {
    results.failed.push(`${label}: expected JSON body but got: ${response.text.slice(0, 200)}`);
    return;
  }
  const failures = [];
  if (validateBody(ajv, spec, media.schema, response.json, `${label}: response body does not match schema for ${statusKey}`, failures)) {
    results.passed.push(label);
  } else {
    results.failed.push(...failures);
  }
}

function runSchemaOnlyChecks(spec, ajv, method, pathTemplate, operation, results) {
  const label = `${method.toUpperCase()} ${pathTemplate}`;
  const examples = [];
  if (operation.requestBody) collectExamples(resolveRef(spec, operation.requestBody), examples, 'requestBody');
  for (const [status, resp] of Object.entries(operation.responses || {})) {
    collectExamples(resolveRef(spec, resp), examples, `response ${status}`);
  }
  if (examples.length === 0) {
    results.skipped.push(`${label}: mutation endpoint with no x-contract-tests and no examples (schema-only check has nothing to validate — add examples)`);
    return;
  }
  const failures = [];
  let ok = true;
  for (const ex of examples) {
    ok = validateBody(ajv, spec, ex.schema, ex.value, `${label}: ${ex.where} does not match its schema`, failures) && ok;
  }
  if (ok) results.passed.push(`${label} (schema-only: ${examples.length} example(s))`);
  else results.failed.push(...failures);
}

async function main() {
  const spec = bundle();
  const ajv = buildAjv(spec);

  await login();
  const fixtures = await resolveFixtures();
  await chooseLocation(fixtures.facilityId);

  const results = { passed: [], failed: [], skipped: [] };

  for (const [pathTemplate, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;
      const cases = operation['x-contract-tests'];
      if (cases && cases.length) {
        for (const testCase of cases) {
          await runLiveCase(spec, ajv, method, pathTemplate, operation, testCase, fixtures, results);
        }
      } else if (method === 'get' && !/\{\w+\}/.test(pathTemplate)) {
        await runLiveCase(spec, ajv, method, pathTemplate, operation, {}, fixtures, results);
      } else if (method === 'get') {
        results.skipped.push(`GET ${pathTemplate}: has path parameters but no x-contract-tests (add a case with "params")`);
      } else {
        runSchemaOnlyChecks(spec, ajv, method, pathTemplate, operation, results);
      }
    }
  }

  for (const p of results.passed) console.log(`PASS ${p}`);
  for (const s of results.skipped) console.log(`SKIP ${s}`);
  for (const f of results.failed) console.error(`FAIL ${f}`);
  console.log(`\nContract tests: ${results.passed.length} passed, ${results.failed.length} failed, ${results.skipped.length} skipped`);
  if (results.failed.length > 0) process.exit(1);
  if (results.passed.length === 0) {
    console.error('No contract tests ran — is the spec empty?');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.stack || e.message);
  process.exit(1);
});
