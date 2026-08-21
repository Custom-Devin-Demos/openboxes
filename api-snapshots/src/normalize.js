/**
 * Normalization of volatile fields so that snapshots are stable across runs
 * and across re-seeded databases.
 *
 * Documented normalizations (see docs/migration/characterization-api.md):
 *
 * 1. Database-generated identifiers: OpenBoxes uses Hibernate "uuid" ids
 *    (32-char lowercase hex, e.g. ff8081817f7bc113017f7bc1e3a60001) as well
 *    as dashed UUIDs (e.g. product_availability ids regenerated on every
 *    refresh of the product-availability cache).
 *    Any string containing such an id is replaced with "<uuid>" (the id may be
 *    embedded in URLs). These ids differ every time the demo data is reseeded.
 * 2. Dates / timestamps: any string matching common date/timestamp formats
 *    produced by the app (ISO-8601, "yyyy-MM-dd HH:mm:ss", RFC-1123,
 *    "MM/dd/yyyy", "dd/MMM/yyyy hh:mm a", etc.) is replaced with "<date>".
 *    Epoch-millisecond numbers on keys that look like dates are replaced too.
 * 3. Volatile keys: values under keys that are inherently run-specific are
 *    replaced with "<volatile>" regardless of type:
 *    dateCreated, lastUpdated, dateImported, requestId, buildDate, buildNumber,
 *    branchName, revisionNumber, ipAddress, hostname, timestamp, serverName,
 *    time, responseTime, elapsedTime, productAvailabilityId, grailsVersion,
 *    appVersion (framework/app version strings change on every upgrade and are
 *    not part of the behavioral contract being characterized).
 * 4. Non-deterministic ordering: endpoints flagged with `sortArrays: true` in
 *    endpoints.js have all their JSON arrays sorted by the JSON serialization
 *    of the (already normalized) elements, because the underlying SQL has no
 *    stable ORDER BY.
 * 5. Unordered collections: values under keys listed in SORTED_ARRAY_KEYS
 *    (currently `roles`, which is backed by a java Set with no defined order)
 *    are sorted after normalization.
 * 6. Date-valued URL query parameters: dates embedded as MM/dd/yyyy query
 *    parameter values inside link/URL strings (e.g. dashboard indicator links
 *    like "...&createdAfter=08/16/2026&createdBefore=08/19/2026") are computed
 *    relative to the current date at request time, so they change every day.
 *    They are replaced with "=<date>" in place.
 * 7. Generated sequence numbers: strings on keys identifierKeys
 *    (identifier, movementNumber, orderNumber, invoiceNumber, shipmentNumber,
 *    requestNumber, transactionNumber) that look like generated identifiers
 *    (e.g. "AB12CD3E") are left as-is by default because the demo fixtures are
 *    deterministic; if they prove flaky they should be added here.
 */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{32}/g;

const DATE_RES = [
  /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/, // ISO-ish
  /^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2}(:\d{2})?)?$/, // MM/dd/yyyy
  /^\d{1,2}\/[A-Z][a-z]{2}\/\d{4}( \d{1,2}:\d{2} ?[AP]M)?$/, // dd/MMM/yyyy hh:mm a
  /^[A-Z][a-z]{2}, \d{1,2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2}/, // RFC-1123
  /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{2}:\d{2}:\d{2} [A-Z]+ \d{4}$/, // java Date.toString()
];

const VOLATILE_KEYS = new Set([
  'dateCreated',
  'lastUpdated',
  'dateImported',
  'requestId',
  'buildDate',
  'buildNumber',
  'branchName',
  'revisionNumber',
  'ipAddress',
  'hostname',
  'timestamp',
  'serverName',
  'time',
  'responseTime',
  'elapsedTime',
  // Hyphenated random UUID regenerated on every product-availability refresh
  // (not a GORM 32-hex id, so the <uuid> replacement does not catch it).
  'productAvailabilityId',
  // Framework/application version strings: change on every framework or app
  // version bump (e.g. Grails 3.3.16 -> 4.1.4) without any behavioral meaning
  // for the characterized API contract.
  'grailsVersion',
  'appVersion',
]);

const DATE_KEY_RE = /(date|Date|expirationDate|dateShipped|dateRequested)$/;

// MM/dd/yyyy dates used as URL query parameter values (always preceded by
// "="), e.g. dashboard links with createdAfter/createdBefore windows computed
// relative to "today".
const QUERY_PARAM_DATE_RE = /=\d{2}\/\d{2}\/\d{4}/g;

const SORTED_ARRAY_KEYS = new Set(['roles']);

function isDateString(value) {
  return DATE_RES.some((re) => re.test(value));
}

function normalizeValue(value, key) {
  if (typeof value === 'string') {
    if (isDateString(value)) return '<date>';
    if (QUERY_PARAM_DATE_RE.test(value)) {
      QUERY_PARAM_DATE_RE.lastIndex = 0;
      value = value.replace(QUERY_PARAM_DATE_RE, '=<date>');
    }
    if (UUID_RE.test(value)) {
      UUID_RE.lastIndex = 0;
      return value.replace(UUID_RE, '<uuid>');
    }
    return value;
  }
  if (typeof value === 'number' && key && DATE_KEY_RE.test(key) && value > 1e11) {
    return '<date>';
  }
  return value;
}

function normalize(node, key) {
  if (Array.isArray(node)) {
    const mapped = node.map((item) => normalize(item, key));
    if (key && SORTED_ARRAY_KEYS.has(key)) {
      mapped.sort((a, b) => {
        const sa = JSON.stringify(a);
        const sb = JSON.stringify(b);
        return sa < sb ? -1 : sa > sb ? 1 : 0;
      });
    }
    return mapped;
  }
  if (node !== null && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = VOLATILE_KEYS.has(k) && v !== null ? '<volatile>' : normalize(v, k);
    }
    return out;
  }
  return normalizeValue(node, key);
}

function sortArraysDeep(node) {
  if (Array.isArray(node)) {
    const mapped = node.map(sortArraysDeep);
    return mapped.sort((a, b) => {
      const sa = JSON.stringify(a);
      const sb = JSON.stringify(b);
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    });
  }
  if (node !== null && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = sortArraysDeep(v);
    return out;
  }
  return node;
}

module.exports = { normalize, sortArraysDeep };
