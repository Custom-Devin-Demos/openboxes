/**
 * Resolves fixture ids from the seeded demo data by *stable natural keys*
 * (names / codes), never hard-coded database ids — the same conventions as
 * the api-snapshots harness (docker/seed-demo-data.sql demo dataset).
 *
 * Available placeholders for x-contract-tests: {facilityId}, {supplierId},
 * {productId}, {productCode}, {categoryId}, {organizationId}.
 */

const { request } = require('./client');

async function resolveFixtures() {
  const fixtures = {};

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

  const products = await request('GET', '/api/products?max=100');
  const productList = products.json?.data || [];
  productList.sort((a, b) => (a.productCode || '').localeCompare(b.productCode || ''));
  fixtures.productId = productList[0]?.id;
  fixtures.productCode = productList[0]?.productCode;

  const categories = await request('GET', '/api/categories');
  const categoryList = categories.json?.data || [];
  categoryList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  fixtures.categoryId = categoryList[0]?.id;

  const organizations = await request('GET', '/api/organizations');
  const organizationList = organizations.json?.data || [];
  organizationList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  fixtures.organizationId = organizationList[0]?.id;

  return fixtures;
}

function applyFixtures(template, fixtures) {
  return String(template).replace(/\{(\w+)\}/g, (m, key) => {
    if (fixtures[key] === undefined || fixtures[key] === null) {
      throw new Error(`Unresolved fixture: ${key}`);
    }
    return encodeURIComponent(fixtures[key]);
  });
}

module.exports = { resolveFixtures, applyFixtures };
