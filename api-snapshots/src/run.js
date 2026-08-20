/**
 * Snapshot runner.
 *
 *   node src/run.js update   — (re)record all snapshots under snapshots/
 *   node src/run.js verify   — compare live responses against committed snapshots
 *
 * Environment:
 *   OPENBOXES_BASE_URL (default http://localhost:8080/openboxes)
 *   OPENBOXES_USERNAME (default admin)
 *   OPENBOXES_PASSWORD (default password)
 */

const fs = require('fs');
const path = require('path');

const { request, login, chooseLocation } = require('./client');
const { resolveFixtures, applyFixtures } = require('./fixtures');
const { normalize, sortArraysDeep } = require('./normalize');
const endpoints = require('./endpoints');
const scenarios = require('./scenarios');

const SNAPSHOT_DIR = path.join(__dirname, '..', 'snapshots');
const UUID_RE = /[0-9a-f]{32}/g;

function normalizeText(text) {
  // Applied to non-JSON (CSV / plain-text) responses.
  return text
    .replace(UUID_RE, '<uuid>')
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?/g, '<date>')
    .replace(/\d{4}-\d{2}-\d{2}/g, '<date>');
}

function buildSnapshot(endpoint, response) {
  const snapshot = {
    name: endpoint.name,
    controller: endpoint.controller,
    request: { method: endpoint.method || 'GET', path: endpoint.path },
    status: response.status,
    contentType: response.contentType,
  };
  if (response.json !== null) {
    let body = normalize(response.json);
    if (endpoint.sortArrays) body = sortArraysDeep(body);
    snapshot.body = body;
  } else {
    snapshot.text = normalizeText(response.text).slice(0, 5000);
  }
  return snapshot;
}

function snapshotFile(name) {
  return path.join(SNAPSHOT_DIR, `${name}.json`);
}

function diffPaths(expected, actual, prefix = '$', out = [], limit = 10) {
  if (out.length >= limit) return out;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      out.push(`${prefix}: array length ${expected.length} != ${actual.length}`);
      return out;
    }
    for (let i = 0; i < expected.length; i++) diffPaths(expected[i], actual[i], `${prefix}[${i}]`, out, limit);
    return out;
  }
  if (expected !== null && actual !== null && typeof expected === 'object' && typeof actual === 'object' && !Array.isArray(expected) && !Array.isArray(actual)) {
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const k of keys) {
      if (!(k in expected)) out.push(`${prefix}.${k}: unexpected key`);
      else if (!(k in actual)) out.push(`${prefix}.${k}: missing key`);
      else diffPaths(expected[k], actual[k], `${prefix}.${k}`, out, limit);
      if (out.length >= limit) return out;
    }
    return out;
  }
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    out.push(`${prefix}: ${JSON.stringify(expected)} != ${JSON.stringify(actual)}`);
  }
  return out;
}

async function main() {
  const mode = process.argv[2];
  if (mode !== 'update' && mode !== 'verify') {
    console.error('Usage: node src/run.js <update|verify>');
    process.exit(2);
  }

  await login();
  const fixtures = await resolveFixtures();
  await chooseLocation(fixtures.facilityId);

  if (mode === 'update') fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const results = { passed: 0, failed: 0, updated: 0, skipped: 0, errors: [] };

  const captured = [];

  for (const endpoint of endpoints) {
    let response;
    let resolvedPath;
    try {
      resolvedPath = applyFixtures(endpoint.path, fixtures);
      response = await request(endpoint.method || 'GET', resolvedPath, endpoint.body ? { body: endpoint.body } : {});
    } catch (e) {
      results.skipped++;
      results.errors.push(`${endpoint.name}: SKIPPED (${e.message})`);
      continue;
    }
    captured.push({ endpoint, snapshot: buildSnapshot(endpoint, response) });
  }

  // Mutating scenarios (create -> read -> delete on scratch data)
  for (const scenario of scenarios) {
    try {
      const snapshot = await scenario.run({ request, fixtures, normalize, sortArraysDeep });
      captured.push({ endpoint: { name: scenario.name, controller: scenario.controller }, snapshot });
    } catch (e) {
      results.skipped++;
      results.errors.push(`${scenario.name}: SKIPPED (${e.message})`);
    }
  }

  for (const { endpoint, snapshot } of captured) {
    const file = snapshotFile(endpoint.name);
    if (mode === 'update') {
      fs.writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n');
      results.updated++;
      console.log(`UPDATED  ${endpoint.name} (HTTP ${snapshot.status})`);
    } else {
      if (!fs.existsSync(file)) {
        results.failed++;
        results.errors.push(`${endpoint.name}: no committed snapshot (run snapshots:update)`);
        console.log(`FAIL     ${endpoint.name} — snapshot file missing`);
        continue;
      }
      const expected = JSON.parse(fs.readFileSync(file, 'utf8'));
      const diffs = diffPaths(expected, snapshot);
      if (diffs.length === 0) {
        results.passed++;
        console.log(`PASS     ${endpoint.name}`);
      } else {
        results.failed++;
        console.log(`FAIL     ${endpoint.name}`);
        for (const d of diffs) console.log(`         ${d}`);
        results.errors.push(`${endpoint.name}: ${diffs.length}+ differences`);
      }
    }
  }

  console.log('');
  console.log(
    `Summary: ${mode === 'update' ? `${results.updated} updated` : `${results.passed} passed, ${results.failed} failed`}, ${results.skipped} skipped`
  );
  for (const e of results.errors) console.log(`  - ${e}`);

  if (mode === 'verify' && results.failed > 0) process.exit(1);
  if (results.skipped > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
