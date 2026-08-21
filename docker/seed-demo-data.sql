-- Demo/seed data for LOCAL DEVELOPMENT ONLY.
--
-- The Liquibase install changelogs (grails-app/migrations/install/) seed the schema
-- with only the bare minimum (admin user, Main Warehouse, Main Supplier). This script
-- adds a manager user, product categories, sample products and baseline inventory in
-- the Main Warehouse so the app has meaningful data to test against.
--
-- Usage (run AFTER the app has booted once, i.e. after Liquibase migrations created the schema):
--   docker exec -i openboxes-db mysql -uopenboxes -popenboxes openboxes < docker/seed-demo-data.sql
-- Then restart the app (or wait for the RefreshProductAvailabilityJob) so the
-- product-availability cache picks up the new stock.
--
-- The script is idempotent: it uses INSERT IGNORE with fixed ids, so re-running it is safe.
-- This only INSERTS data; it makes no schema changes (schema is managed exclusively by Liquibase).

-- ============================ Manager user ============================
-- Auth accepts a plaintext password match for locally created users (see UserService.authenticate),
-- which is how the seeded admin user works as well.
INSERT IGNORE INTO person (id, version, date_created, last_updated, first_name, last_name, email, active)
VALUES ('seed-user-manager', 0, NOW(), NOW(), 'Mary', 'Manager', 'manager@openboxes.com', 1);

INSERT IGNORE INTO user (id, username, password, warehouse_id)
VALUES ('seed-user-manager', 'manager', 'password', '1');

INSERT IGNORE INTO user_role (user_id, role_id)
VALUES ('seed-user-manager', '2'); -- ROLE_MANAGER

-- ============================ Categories ============================
INSERT IGNORE INTO category (id, version, date_created, last_updated, name, is_root, sort_order)
VALUES ('seed-category-root', 0, NOW(), NOW(), 'Categories', 1, 0);

INSERT IGNORE INTO category (id, version, date_created, last_updated, name, parent_category_id, sort_order)
VALUES
  ('seed-category-medicines', 0, NOW(), NOW(), 'Medicines', 'seed-category-root', 1),
  ('seed-category-supplies',  0, NOW(), NOW(), 'Medical Supplies', 'seed-category-root', 2);

-- ============================ Products ============================
INSERT IGNORE INTO product (id, version, date_created, last_updated, name, product_code, category_id, product_type_id, active, cold_chain, lot_control, unit_of_measure)
VALUES
  ('seed-product-01', 0, NOW(), NOW(), 'Acetaminophen 325mg tablet',          'DM0001', 'seed-category-medicines', 'DEFAULT', 1, 0, 1, 'EA'),
  ('seed-product-02', 0, NOW(), NOW(), 'Amoxicillin 500mg capsule',           'DM0002', 'seed-category-medicines', 'DEFAULT', 1, 0, 1, 'EA'),
  ('seed-product-03', 0, NOW(), NOW(), 'Ibuprofen 200mg tablet',              'DM0003', 'seed-category-medicines', 'DEFAULT', 1, 0, 1, 'EA'),
  ('seed-product-04', 0, NOW(), NOW(), 'Oral rehydration salts sachet',       'DM0004', 'seed-category-medicines', 'DEFAULT', 1, 0, 1, 'EA'),
  ('seed-product-05', 0, NOW(), NOW(), 'Examination gloves, nitrile, medium', 'DS0001', 'seed-category-supplies',  'DEFAULT', 1, 0, 0, 'BX'),
  ('seed-product-06', 0, NOW(), NOW(), 'Syringe 5ml with needle',             'DS0002', 'seed-category-supplies',  'DEFAULT', 1, 0, 0, 'EA'),
  ('seed-product-07', 0, NOW(), NOW(), 'Gauze roll 10cm x 4m',                'DS0003', 'seed-category-supplies',  'DEFAULT', 1, 0, 0, 'EA'),
  ('seed-product-08', 0, NOW(), NOW(), 'Surgical face mask',                  'DS0004', 'seed-category-supplies',  'DEFAULT', 1, 0, 0, 'BX');

-- ============================ Inventory items (lots) ============================
INSERT IGNORE INTO inventory_item (id, version, date_created, last_updated, product_id, lot_number, expiration_date)
VALUES
  ('seed-invitem-01', 0, NOW(), NOW(), 'seed-product-01', 'LOT-ACE-001', DATE_ADD(NOW(), INTERVAL 2 YEAR)),
  ('seed-invitem-02', 0, NOW(), NOW(), 'seed-product-02', 'LOT-AMX-001', DATE_ADD(NOW(), INTERVAL 18 MONTH)),
  ('seed-invitem-03', 0, NOW(), NOW(), 'seed-product-03', 'LOT-IBU-001', DATE_ADD(NOW(), INTERVAL 3 YEAR)),
  ('seed-invitem-04', 0, NOW(), NOW(), 'seed-product-04', 'LOT-ORS-001', DATE_ADD(NOW(), INTERVAL 1 YEAR)),
  ('seed-invitem-05', 0, NOW(), NOW(), 'seed-product-05', NULL, NULL),
  ('seed-invitem-06', 0, NOW(), NOW(), 'seed-product-06', NULL, NULL),
  ('seed-invitem-07', 0, NOW(), NOW(), 'seed-product-07', NULL, NULL),
  ('seed-invitem-08', 0, NOW(), NOW(), 'seed-product-08', NULL, NULL);

-- ============================ Baseline inventory in Main Warehouse ============================
-- Transaction type 11 = "Product Inventory" (PRODUCT_INVENTORY): sets the baseline
-- quantity-on-hand per product. Inventory id 1 = Main Warehouse.
INSERT IGNORE INTO transaction (id, version, date_created, last_updated, inventory_id, transaction_type_id, transaction_date, comment)
VALUES ('seed-txn-baseline', 0, NOW(), NOW(), '1', '11', NOW(), 'Demo data baseline inventory');

INSERT IGNORE INTO transaction_entry (id, version, transaction_id, inventory_item_id, product_id, quantity, transaction_entries_idx)
VALUES
  ('seed-txnentry-01', 0, 'seed-txn-baseline', 'seed-invitem-01', 'seed-product-01', 500, 0),
  ('seed-txnentry-02', 0, 'seed-txn-baseline', 'seed-invitem-02', 'seed-product-02', 300, 1),
  ('seed-txnentry-03', 0, 'seed-txn-baseline', 'seed-invitem-03', 'seed-product-03', 400, 2),
  ('seed-txnentry-04', 0, 'seed-txn-baseline', 'seed-invitem-04', 'seed-product-04', 250, 3),
  ('seed-txnentry-05', 0, 'seed-txn-baseline', 'seed-invitem-05', 'seed-product-05', 100, 4),
  ('seed-txnentry-06', 0, 'seed-txn-baseline', 'seed-invitem-06', 'seed-product-06', 1000, 5),
  ('seed-txnentry-07', 0, 'seed-txn-baseline', 'seed-invitem-07', 'seed-product-07', 600, 6),
  ('seed-txnentry-08', 0, 'seed-txn-baseline', 'seed-invitem-08', 'seed-product-08', 200, 7);

-- ============================ GL account types ============================
-- Needed so the GL Account create/edit screens have GL Account Type options.
INSERT IGNORE INTO gl_account_type (id, date_created, last_updated, code, name, gl_account_type_code)
VALUES
  ('seed-glaccttype-01', NOW(), NOW(), 'ASSET', 'Asset', 'ASSET'),
  ('seed-glaccttype-02', NOW(), NOW(), 'EXPENSE', 'Expense', 'EXPENSE'),
  ('seed-glaccttype-03', NOW(), NOW(), 'REVENUE', 'Revenue', 'REVENUE');
