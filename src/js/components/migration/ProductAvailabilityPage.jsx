import React, { useEffect, useState } from 'react';

import {
  MIGRATION_PRODUCT_AVAILABILITY,
  MIGRATION_PRODUCT_AVAILABILITY_CALCULATED,
  MIGRATION_PRODUCT_AVAILABILITY_COMPARE,
  MIGRATION_PRODUCT_AVAILABILITY_COUNT,
  MIGRATION_PRODUCT_AVAILABILITY_REFRESH,
} from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/admin/admin.scss';

const ProductAvailabilityPage = () => {
  useTranslation('default');
  const [rows, setRows] = useState(null);
  const [calculated, setCalculated] = useState({});
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    apiClient.get(MIGRATION_PRODUCT_AVAILABILITY)
      .then((response) => setRows(response.data.data));
  }, []);

  const fetchCount = (locationId) => {
    setCounts((prev) => ({ ...prev, [locationId]: 'Loading...' }));
    apiClient.get(MIGRATION_PRODUCT_AVAILABILITY_COUNT(locationId))
      .then((response) => setCounts((prev) => (
        { ...prev, [locationId]: response.data.data.count }
      )))
      .catch(() => setCounts((prev) => ({ ...prev, [locationId]: 'Error' })));
  };

  const fetchCalculated = (locationId) => {
    setCalculated((prev) => ({ ...prev, [locationId]: 'Loading...' }));
    apiClient.get(MIGRATION_PRODUCT_AVAILABILITY_CALCULATED(locationId))
      .then((response) => setCalculated((prev) => (
        { ...prev, [locationId]: response.data.data.count }
      )))
      .catch(() => setCalculated((prev) => ({ ...prev, [locationId]: 'Error' })));
  };

  const fetchAll = () => {
    rows?.forEach((row) => {
      fetchCount(row.locationId);
      fetchCalculated(row.locationId);
    });
  };

  const showCompare = (row, showAll) => {
    setDialog({ title: row.locationName, loading: true, rows: [] });
    apiClient.get(MIGRATION_PRODUCT_AVAILABILITY_COMPARE(row.locationId), {
      params: showAll ? { showAll: true } : {},
    })
      .then((response) => setDialog({
        title: row.locationName,
        loading: false,
        rows: response.data.data,
      }))
      .catch(() => setDialog(null));
  };

  const refresh = (row) => {
    setStatus('Starting migration...');
    apiClient.post(MIGRATION_PRODUCT_AVAILABILITY_REFRESH(row.locationId))
      .then(() => setStatus('Completed migration!'))
      .catch(() => setStatus('Error'));
  };

  return (
    <PageWrapper>
      <div className="admin-page">
        <div className="box m-3">
          <h2>
            <Translate id="react.migration.productAvailability.label" defaultMessage="Product Availability" />
          </h2>
          {status && <div className="tag tag-info">{status}</div>}
          <table>
            <thead>
              <tr>
                <th>Location</th>
                <th>Product Availability</th>
                <th>Calculated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((row) => (
                <tr className="prop" key={row.locationId}>
                  <td className="name">{row.locationName}</td>
                  <td className="value">
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => fetchCount(row.locationId)}
                    >
                      {counts[row.locationId] !== undefined
                        ? counts[row.locationId]
                        : row.productAvailabilityCount}
                    </button>
                  </td>
                  <td className="value">
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => fetchCalculated(row.locationId)}
                    >
                      {calculated[row.locationId] !== undefined ? calculated[row.locationId] : 'Fetch'}
                    </button>
                  </td>
                  <td>
                    <div className="button-group">
                      <button type="button" className="button mr-2" onClick={() => showCompare(row, false)}>show diff</button>
                      <button type="button" className="button mr-2" onClick={() => showCompare(row, true)}>show all</button>
                      <button type="button" className="button" onClick={() => refresh(row)}>refresh</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <button id="btn-fetch-all-indicators" type="button" className="button" onClick={fetchAll}>Fetch All</button>
          {dialog && (
            <div className="box m-3">
              <h3>{dialog.title}</h3>
              {dialog.loading ? <div>Loading...</div> : (
                <table>
                  <thead>
                    <tr>
                      <th>Product Code</th>
                      <th>Lot Number</th>
                      <th>Bin Location</th>
                      <th>Quantity (Product Availability)</th>
                      <th>Quantity (Transactions)</th>
                      <th>Included</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dialog.rows.map((row, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr className="prop" key={index}>
                        <td>{row.productCode}</td>
                        <td>{row.lotNumber}</td>
                        <td>{row.binLocation}</td>
                        <td>{`${row.quantityFromProductAvailability ?? ''}`}</td>
                        <td>{`${row.quantityFromTransactions ?? ''}`}</td>
                        <td>{row.includedInProductAvailability ? 'yes' : 'no'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button type="button" className="button" onClick={() => setDialog(null)}>Close</button>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default ProductAvailabilityPage;
