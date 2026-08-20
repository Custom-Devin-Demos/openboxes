/**
 * Mutating-endpoint scenarios: small, safe, self-contained create -> read ->
 * delete flows on scratch data. Each scenario cleans up after itself so seed
 * data is unchanged and the suite is re-runnable.
 *
 * The snapshot captures the normalized responses of each step.
 */

module.exports = [
  {
    name: 'scenario-locationGroup-create-read-delete',
    controller: 'LocationGroupApiController',
    async run({ request, normalize }) {
      const name = 'API Snapshot Scratch Location Group';
      const created = await request('POST', '/api/locationGroups', {
        body: { name },
      });
      const id = created.json?.data?.id;
      let read = null;
      let deleted = null;
      if (id) {
        read = await request('GET', `/api/locationGroups/${id}`);
        deleted = await request('DELETE', `/api/locationGroups/${id}`);
      }
      return {
        name: 'scenario-locationGroup-create-read-delete',
        controller: 'LocationGroupApiController',
        steps: {
          create: { status: created.status, body: normalize(created.json) },
          read: read && { status: read.status, body: normalize(read.json) },
          delete: deleted && { status: deleted.status, body: normalize(deleted.json) },
        },
      };
    },
  },
  {
    name: 'scenario-category-create-read-delete',
    controller: 'CategoryApiController',
    async run({ request, fixtures, normalize }) {
      const created = await request('POST', '/api/categories', {
        body: { name: 'API Snapshot Scratch Category', parentCategory: { id: fixtures.categoryId } },
      });
      const id = created.json?.data?.id ?? created.json?.id;
      let read = null;
      let deleted = null;
      if (id) {
        read = await request('GET', `/api/categories/${id}`);
        deleted = await request('DELETE', `/api/categories/${id}`);
      }
      return {
        name: 'scenario-category-create-read-delete',
        controller: 'CategoryApiController',
        steps: {
          create: { status: created.status, body: normalize(created.json) },
          read: read && { status: read.status, body: normalize(read.json) },
          delete: deleted && { status: deleted.status, body: normalize(deleted.json) },
        },
      };
    },
  },
];
