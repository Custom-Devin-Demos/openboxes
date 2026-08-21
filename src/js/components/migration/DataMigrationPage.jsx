import React, { useEffect, useState } from 'react';

import { MIGRATION_DATA_MIGRATION } from 'api/urls';
import { MIGRATION_URL, ORGANIZATION_URL, PRODUCT_SUPPLIER_URL } from 'consts/applicationUrls';
import useSpinner from 'hooks/useSpinner';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const DataMigrationPage = () => {
  useTranslation('default');
  const spinner = useSpinner();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    spinner.show();
    apiClient.get(MIGRATION_DATA_MIGRATION)
      .then((response) => setData(response.data.data))
      .finally(() => spinner.hide());
  }, []);

  const runAction = (url) => async () => {
    setStatus('Loading...');
    try {
      const response = await apiClient.get(url);
      setStatus(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
    } catch (error) {
      setStatus(error?.response?.data || 'Error');
    }
  };

  if (!data) {
    return <PageWrapper><div className="box m-3" /></PageWrapper>;
  }

  const recordStockTransactionSourcesMigrationEnabled = (
    data.amountOfMissingInventoryImportTransactionSources
      + data.amountOfMissingCycleCountTransactionSources
  ) === 0;

  const renderTransactionSourceCell = (amount, migrationUrl, allCreatedMessage, linkLabel) => {
    if (data.productInventoryTransactionInCurrentLocationCount) {
      return (
        <h1>
          <span className="font-weight-bold">Important:</span>
          {' '}
          trigger the product inventory transactions migration first, before proceeding
          with creating the missing transaction sources.
        </h1>
      );
    }
    if (amount) {
      return (
        <div className="button-group">
          <a className="button" target="_blank" rel="noopener noreferrer" href={migrationUrl}>
            {linkLabel}
          </a>
        </div>
      );
    }
    return <h1>{allCreatedMessage}</h1>;
  };

  const renderRecordStockCell = () => {
    if (!recordStockTransactionSourcesMigrationEnabled) {
      return (
        <h1>
          Please migrate all missing inventory import and cycle count transaction sources first.
        </h1>
      );
    }
    if (data.amountOfMissingRecordStockTransactionSources) {
      return (
        <a
          className="button"
          target="_blank"
          rel="noopener noreferrer"
          href={MIGRATION_URL.createMissingRecordStockTransactionSources()}
        >
          Migrate record stock and adjust inventory transactions for current location
        </a>
      );
    }
    return (
      <h1>
        All missing record stock and adjust inventory transaction sources have been created.
      </h1>
    );
  };

  return (
    <PageWrapper>
      <div className="admin-page">
        <div className="box m-3">
          <h2>
            <Translate id="react.migration.dataMigration.label" defaultMessage="Data Migration" />
          </h2>
          <div id="status">{status}</div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="prop">
                <td className="name">Organizations</td>
                <td className="value">{data.organizationCount}</td>
                <td>
                  <div className="button-group">
                    <a className="button" href={`${ORGANIZATION_URL.base}/index`}>List</a>
                    <button type="button" className="button" onClick={runAction(MIGRATION_URL.migrateOrganizations())}>Migrate</button>
                    <button type="button" className="button" onClick={runAction(MIGRATION_URL.deleteOrganizations())}>Delete</button>
                  </div>
                </td>
              </tr>
              <tr className="prop">
                <td className="name">Product Suppliers</td>
                <td className="value">{data.productSupplierCount}</td>
                <td>
                  <div className="button-group">
                    <a className="button" href={`${PRODUCT_SUPPLIER_URL.base}/index`}>List</a>
                    <button type="button" className="button" onClick={runAction(MIGRATION_URL.migrateProductSuppliers())}>Migrate</button>
                    <button type="button" className="button" onClick={runAction(MIGRATION_URL.deleteProductSuppliers())}>Delete</button>
                  </div>
                </td>
              </tr>
              <tr className="prop">
                <td className="name">Inventory transactions should be replaced by adjustments</td>
                <td className="value">{data.inventoryTransactionCount}</td>
                <td>
                  <div className="button-group">
                    <a
                      className="button"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`${MIGRATION_URL.nextInventoryTransaction()}?max=1`}
                    >
                      Next Product
                    </a>
                    <a
                      className="button"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={MIGRATION_URL.locationsWithInventoryTransactions()}
                    >
                      View All Locations
                    </a>
                    <a
                      className="button"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={MIGRATION_URL.downloadCurrentInventory()}
                    >
                      Download Inventory (.csv)
                    </a>
                    <a
                      className="button"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`${MIGRATION_URL.migrateInventoryTransactions()}?max=1&performMigration=false`}
                    >
                      Preview Migration
                    </a>
                    <a
                      className="button"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`${MIGRATION_URL.migrateInventoryTransactions()}?performMigration=true&format=json`}
                    >
                      Migrate Current Location
                    </a>
                    <a className="button" href={MIGRATION_URL.migrateAllInventoryTransactions()}>
                      Migrate All Locations
                    </a>
                  </div>
                </td>
              </tr>
              <tr className="prop">
                <td className="name">
                  Product Inventory transactions that should be replaced by Inventory
                  Baseline and Adjustment pair
                </td>
                <td className="value">
                  <h1>
                    {data.productInventoryTransactionCount}
                    {' (total), '}
                    {data.productInventoryTransactionInCurrentLocationCount}
                    {' (current location)'}
                  </h1>
                  <br />
                  <h1>
                    Products that have a product inventory transaction overlapping with
                    other type of transaction
                    {' '}
                    <b>PLEASE REVIEW THESE BEFORE (OR AFTER MIGRATION)</b>
                    :
                  </h1>
                  {data.overlappingTransactions?.length
                    ? data.overlappingTransactions.map((product) => (
                      <h1 key={product}>{product}</h1>
                    ))
                    : <h1>None</h1>}
                  <br />
                  <h1>
                    Products with old transaction:
                    {' '}
                    {(data.productsWithProductInventoryTransactionInCurrentLocation || [])
                      .join(', ') || 'None'}
                  </h1>
                </td>
                <td>
                  <div className="button-group">
                    <a
                      className="button"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={MIGRATION_URL.locationsWithProductInventoryTransactions()}
                    >
                      View All Locations with deprecated Product Inventory transaction
                    </a>
                    <a
                      className="button"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={MIGRATION_URL.downloadCurrentInventory()}
                    >
                      Download Inventory (.csv)
                    </a>
                    <a
                      className="button mt-3"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`${MIGRATION_URL.migrateProductInventoryTransactions()}?performMigration=false`}
                    >
                      <b>Preview</b>
                      {' '}
                      Migration for Current Location
                    </a>
                    <a
                      className="button my-3"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`${MIGRATION_URL.migrateProductInventoryTransactions()}?performMigration=true`}
                    >
                      <b>Migrate</b>
                      {' '}
                      Current Location
                    </a>
                  </div>
                  <h1>
                    <b>Warning!</b>
                    {' '}
                    Currently it takes about couple of minutes to migrate about ~1000
                    transactions. Results will be visible in the new tab after everything
                    is processed (for your convenience do not close it).
                    Do not trigger migration for the same location twice (ideally each
                    location should be processed one by one).
                    <br />
                    Preview displays all transaction entries within this location grouped
                    by product.
                  </h1>
                </td>
              </tr>
              <tr className="prop">
                <td className="name">Missing transaction sources for inventory import based transactions</td>
                <td>
                  Maximum amount of inventory import transactions without transaction source:
                  {' '}
                  <b>{data.amountOfMissingInventoryImportTransactionSources}</b>
                </td>
                <td>
                  {renderTransactionSourceCell(
                    data.amountOfMissingInventoryImportTransactionSources,
                    MIGRATION_URL.createMissingInventoryImportTransactionSources(),
                    'All missing inventory import transaction sources have been created.',
                    'Migrate inventory import transactions for current location',
                  )}
                </td>
              </tr>
              <tr className="prop">
                <td className="name">Missing transaction sources for cycle count based transactions</td>
                <td>
                  Maximum amount of cycle count transactions without transaction source:
                  {' '}
                  <b>{data.amountOfMissingCycleCountTransactionSources}</b>
                </td>
                <td>
                  {renderTransactionSourceCell(
                    data.amountOfMissingCycleCountTransactionSources,
                    MIGRATION_URL.createMissingCycleCountTransactionSources(),
                    'All missing cycle count transaction sources have been created.',
                    'Migrate cycle count transactions for current location',
                  )}
                </td>
              </tr>
              <tr className="prop">
                <td className="name">Missing transaction sources for record stock and adjust inventory based transactions</td>
                <td>
                  The amount of missing transaction sources for record stock and adjust
                  inventory based transactions:
                  {' '}
                  <b>{data.amountOfMissingRecordStockTransactionSources}</b>
                </td>
                <td>
                  <div className="button-group">
                    {renderRecordStockCell()}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default DataMigrationPage;
