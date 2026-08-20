/**
 * Resolves fixture ids from the seeded demo data by *stable natural keys*
 * (names / codes), never by hard-coded database ids, so the harness works
 * against any re-seeded database.
 */

const { request } = require('./client');

async function resolveFixtures() {
  const fixtures = {};

  // Locations by name (seeded by install changelogs / seed-demo-data.sql)
  const locations = await request('GET', '/api/locations');
  const locationList = locations.json?.data || [];
  const byName = (name) => locationList.find((l) => l.name === name);
  fixtures.facilityId = byName('Main Warehouse')?.id;
  fixtures.supplierId = byName('Main Supplier')?.id;

  if (!fixtures.facilityId) {
    throw new Error('Fixture resolution failed: location "Main Warehouse" not found. Is demo data seeded?');
  }
  if (!fixtures.supplierId) {
    throw new Error('Fixture resolution failed: location "Main Supplier" not found. Is demo data seeded?');
  }

  // First product by product code (deterministic ordering)
  const products = await request('GET', '/api/products?max=100');
  const productList = products.json?.data || [];
  productList.sort((a, b) => (a.productCode || '').localeCompare(b.productCode || ''));
  fixtures.productId = productList[0]?.id;
  fixtures.productCode = productList[0]?.productCode;

  // First root category by name
  const categories = await request('GET', '/api/categories');
  const categoryList = categories.json?.data || [];
  categoryList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  fixtures.categoryId = categoryList[0]?.id;

  // First organization by name
  const organizations = await request('GET', '/api/organizations');
  const organizationList = organizations.json?.data || [];
  organizationList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  fixtures.organizationId = organizationList[0]?.id;

  return fixtures;
}

function applyFixtures(template, fixtures) {
  return template.replace(/\{(\w+)\}/g, (m, key) => {
    if (fixtures[key] === undefined || fixtures[key] === null) {
      throw new Error(`Unresolved fixture: ${key}`);
    }
    return encodeURIComponent(fixtures[key]);
  });
}

module.exports = { resolveFixtures, applyFixtures };
