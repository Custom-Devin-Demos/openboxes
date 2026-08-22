/**
 * Bundles the root spec (openbox.yaml) with all per-domain fragments into a
 * single OpenAPI document at dist/openbox.bundled.json.
 *
 * Composition rules (see docs/migration/openapi-conventions.md):
 *  - Every file listed in openbox.yaml `x-fragments` (paths/<domain>.yaml) is
 *    a YAML map of `<path> -> PathItem`; all maps are merged into `paths`.
 *    Duplicate path keys across fragments are an error.
 *  - Every components/schemas/<domain>.yaml is a map of `<SchemaName> -> Schema`
 *    merged into components.schemas. Duplicate schema names are an error.
 *  - components/parameters.yaml and components/responses.yaml (shared) are
 *    merged into components.parameters / components.responses.
 *  - Fragments may only use document-internal refs ('#/components/...');
 *    unresolved refs are an error.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function loadYaml(relPath) {
  return yaml.load(fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8'));
}

function mergeInto(target, source, kind, sourceFile) {
  for (const [key, value] of Object.entries(source || {})) {
    if (key in target) {
      throw new Error(`Duplicate ${kind} '${key}' (from ${sourceFile})`);
    }
    target[key] = value;
  }
}

function collectRefs(node, out = []) {
  if (Array.isArray(node)) {
    node.forEach((n) => collectRefs(n, out));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === '$ref' && typeof v === 'string') out.push(v);
      else collectRefs(v, out);
    }
  }
  return out;
}

function resolvePointer(doc, pointer) {
  const parts = pointer.replace(/^#\//, '').split('/').map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  let node = doc;
  for (const part of parts) {
    if (node === null || typeof node !== 'object' || !(part in node)) return undefined;
    node = node[part];
  }
  return node;
}

function bundle() {
  const root = loadYaml('openbox.yaml');

  const fragments = root['x-fragments'] || [];
  root.paths = root.paths || {};
  for (const fragment of fragments) {
    if (!fs.existsSync(path.join(ROOT_DIR, fragment))) {
      throw new Error(`x-fragments entry not found on disk: ${fragment}`);
    }
    mergeInto(root.paths, loadYaml(fragment), 'path', fragment);
  }

  // Fail loudly when a fragment file exists but was not registered.
  const onDisk = fs.readdirSync(path.join(ROOT_DIR, 'paths')).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  for (const file of onDisk) {
    if (!fragments.includes(`paths/${file}`)) {
      throw new Error(`paths/${file} exists but is not listed in openbox.yaml x-fragments`);
    }
  }

  root.components = root.components || {};
  root.components.schemas = root.components.schemas || {};
  const schemaDir = path.join(ROOT_DIR, 'components', 'schemas');
  for (const file of fs.readdirSync(schemaDir).sort()) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
    mergeInto(root.components.schemas, loadYaml(path.join('components', 'schemas', file)), 'schema', `components/schemas/${file}`);
  }
  root.components.parameters = root.components.parameters || {};
  mergeInto(root.components.parameters, loadYaml('components/parameters.yaml'), 'parameter', 'components/parameters.yaml');
  root.components.responses = root.components.responses || {};
  mergeInto(root.components.responses, loadYaml('components/responses.yaml'), 'response', 'components/responses.yaml');

  delete root['x-fragments'];

  // Validate all $refs are document-internal and resolvable.
  for (const ref of collectRefs(root)) {
    if (!ref.startsWith('#/')) {
      throw new Error(`Only document-internal refs ('#/components/...') are allowed, found: ${ref}`);
    }
    if (resolvePointer(root, ref) === undefined) {
      throw new Error(`Unresolved $ref: ${ref}`);
    }
  }

  fs.mkdirSync(DIST_DIR, { recursive: true });
  const outFile = path.join(DIST_DIR, 'openbox.bundled.json');
  fs.writeFileSync(outFile, JSON.stringify(root, null, 2));
  const opCount = Object.values(root.paths).reduce(
    (n, item) => n + Object.keys(item).filter((k) => ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(k)).length,
    0
  );
  console.log(`Bundled ${fragments.length} fragment(s), ${Object.keys(root.paths).length} path(s), ${opCount} operation(s) -> ${path.relative(process.cwd(), outFile)}`);
  return root;
}

if (require.main === module) {
  try {
    bundle();
  } catch (e) {
    console.error(`Bundle failed: ${e.message}`);
    process.exit(1);
  }
}

module.exports = { bundle };
