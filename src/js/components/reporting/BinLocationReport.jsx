/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { CONSUMPTION_DEPOTS, JSON_GET_BIN_LOCATION_REPORT } from 'api/urls';
import { INVENTORY_ITEM_URL, REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const STATUSES = ['inStock', 'outOfStock'];

const rowStyle = (row) => {
  if (row.lotStatus === 'RECALLED') {
    return { backgroundColor: '#ffcccb' };
  }
  if (row.isOnHold) {
    return { backgroundColor: '#fca714' };
  }
  return {};
};

const BinLocationReport = () => {
  useTranslation('report', 'default');

  const currentLocation = useSelector((state) => state.session.currentLocation);

  const [depots, setDepots] = useState([]);
  const [location, setLocation] = useState(currentLocation?.id || '');
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient.get(CONSUMPTION_DEPOTS).then((response) => setDepots(response.data.data));
  }, []);

  const fetchData = useCallback((params) => {
    setLoading(true);
    setError(false);
    apiClient.get(JSON_GET_BIN_LOCATION_REPORT, { params })
      .then((response) => setData(response.data.aaData))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData({ 'location.id': currentLocation?.id || '', status: '' });
  }, [fetchData]);

  const runReport = () => fetchData({ 'location.id': location, status });

  const download = (downloadAction) => {
    const searchParams = new URLSearchParams();
    searchParams.append('location.id', location);
    searchParams.append('status', status);
    searchParams.append('downloadAction', downloadAction);
    window.location.href = `${REPORT_URL.base}/showBinLocationReport?${searchParams.toString()}`;
  };

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          <Translate id="react.report.binLocationReport.header.label" defaultMessage="Inventory Details Report" />
        </h1>
        <div className="border rounded p-3 mb-3">
          <Translate
            id="react.report.binLocationReport.instructions.label"
            defaultMessage='In the Inventory Details report, you find information about the stock at your location for all products of your inventory, including details of the lots in stock with their bin location. Use the filters to exclude "Out of Stock" products. Use this detailed view to find information on a specific product, with Quantities, Lot numbers, and Bin location details.'
          />
        </div>
        <div className="row">
          <div className="col-md-3">
            <div className="border rounded p-3">
              <h5><Translate id="react.default.filters.label" defaultMessage="Filters" /></h5>
              <div className="form-group">
                <label htmlFor="bin-location-report-location">
                  <Translate id="react.report.location.label" defaultMessage="Location" />
                </label>
                <select
                  id="bin-location-report-location"
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="" aria-label="none" />
                  {depots.map((depot) => (
                    <option key={depot.id} value={depot.id}>{depot.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="bin-location-report-status">
                  <Translate id="react.report.status.label" defaultMessage="Status" />
                </label>
                <select
                  id="bin-location-report-status"
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="" aria-label="all" />
                  {STATUSES.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>{statusOption}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn btn-primary btn-sm mr-2" onClick={runReport}>
                <Translate id="react.report.runReport.label" defaultMessage="Run Report" />
              </button>
              <div className="mt-2">
                <button type="button" className="btn btn-outline-secondary btn-sm mr-2" onClick={() => download('downloadStockReport')}>
                  <Translate id="react.report.downloadReport.label" defaultMessage="Download Report" />
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm mt-1" onClick={() => download('downloadStockMovement')}>
                  <Translate id="react.report.downloadStockMovement.label" defaultMessage="Download Stock Movement" />
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-9">
            <div className="border rounded p-3">
              <h5>
                <Translate id="react.report.binLocationReport.header.label" defaultMessage="Inventory Details Report" />
              </h5>
              {loading && <Translate id="react.default.loading.label" defaultMessage="Loading..." />}
              {error && (
                <div className="alert alert-danger">
                  <Translate id="react.default.errorOccurred.label" defaultMessage="An unexpected error has occurred" />
                </div>
              )}
              {!loading && !error && data && (
                <table className="table table-sm table-bordered">
                  <thead>
                    <tr>
                      <th><Translate id="react.report.status.label" defaultMessage="Status" /></th>
                      <th><Translate id="react.report.productCode.label" defaultMessage="Code" /></th>
                      <th><Translate id="react.report.product.label" defaultMessage="Product" /></th>
                      <th><Translate id="react.report.zone.label" defaultMessage="Zone" /></th>
                      <th><Translate id="react.report.binLocation.label" defaultMessage="Bin Location" /></th>
                      <th><Translate id="react.report.lotNumber.label" defaultMessage="Lot Number" /></th>
                      <th><Translate id="react.report.expirationDate.label" defaultMessage="Expiration Date" /></th>
                      <th className="text-right"><Translate id="react.report.quantityOnHand.label" defaultMessage="Quantity On Hand" /></th>
                      <th className="text-right"><Translate id="react.report.quantityAvailable.label" defaultMessage="Quantity Available" /></th>
                      <th><Translate id="react.report.unitOfMeasure.label" defaultMessage="UOM" /></th>
                      <th className="text-right"><Translate id="react.report.unitCost.label" defaultMessage="Unit Cost" /></th>
                      <th className="text-right"><Translate id="react.report.totalValue.label" defaultMessage="Total Value" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={`${row.id}-${index}`} style={rowStyle(row)}>
                        <td>{row.status}</td>
                        <td>
                          <a href={INVENTORY_ITEM_URL.showStockCard(row.id)}>{row.productCode}</a>
                        </td>
                        <td title={row.displayName ? row.productName : undefined}>
                          <a href={INVENTORY_ITEM_URL.showStockCard(row.id)}>
                            {row.displayName || row.productName}
                          </a>
                          {(row.handlingIcons || []).map((icon) => (
                            <i
                              key={icon.icon}
                              className={`fa ${icon.icon} ml-1`}
                              style={{ color: icon.color || 'inherit' }}
                            />
                          ))}
                        </td>
                        <td>{row.zone}</td>
                        <td>{row.binLocation}</td>
                        <td>{row.lotNumber}</td>
                        <td>{row.expirationDate}</td>
                        <td className="text-right">{row.quantity}</td>
                        <td className="text-right">{row.quantityAvailableToPromise}</td>
                        <td>{row.unitOfMeasure}</td>
                        <td className="text-right">{row.unitCost}</td>
                        <td className="text-right">{row.totalValue}</td>
                      </tr>
                    ))}
                    {!data.length && (
                      <tr>
                        <td colSpan={12}>
                          <Translate id="react.default.noResultsFound.label" defaultMessage="No results found" />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default BinLocationReport;
