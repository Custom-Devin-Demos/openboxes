import React, { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import {
  INVENTORY_SNAPSHOT_FIND_BY_DATE_AND_LOCATION,
  INVENTORY_SNAPSHOT_REFRESH,
} from 'api/urls';
import { INVENTORY_SNAPSHOT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import '../inventory/inventoryLegacy.scss';

const PAGE_SIZES = [10, 25, 50, 100, 500, 1000, -1];

// Inventory snapshots for today are always generated against tomorrow's date
// so the date filter is initialized with tomorrow's date (as MM/DD/YYYY)
const tomorrowAsString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const month = `${tomorrow.getMonth() + 1}`.padStart(2, '0');
  const day = `${tomorrow.getDate()}`.padStart(2, '0');
  return `${month}/${day}/${tomorrow.getFullYear()}`;
};

const InventorySnapshotList = () => {
  useTranslation('inventory', 'default');

  const currentLocation = useSelector((state) => state.session.currentLocation);

  const [date, setDate] = useState(tomorrowAsString());
  const [allLocations, setAllLocations] = useState(false);
  const [message, setMessage] = useState('Choose a date using the datepicker.');
  const [messageType, setMessageType] = useState('success');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const errorMessage = (text) => {
    setMessageType('danger');
    setMessage(text);
  };

  const handleAjaxError = (error) => {
    const responseMessage = error?.response?.data?.errorMessage;
    if (responseMessage) {
      errorMessage(`An error occurred on the server.  Please contact your system administrator. ${responseMessage}`);
    } else {
      errorMessage('An unknown error occurred on the server.  Please contact your system administrator.');
    }
  };

  const fetchData = useCallback(() => {
    if (!currentLocation?.id) {
      return;
    }
    setLoading(true);
    apiClient.get(INVENTORY_SNAPSHOT_FIND_BY_DATE_AND_LOCATION, {
      params: { 'location.id': currentLocation.id, date },
    })
      .then((response) => {
        setRows(response.data.aaData || []);
        setPage(0);
      })
      .catch(handleAjaxError)
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [currentLocation?.id, date]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [currentLocation?.id]);

  const onReload = (event) => {
    event.preventDefault();
    fetchData();
  };

  const onDownload = (event) => {
    event.preventDefault();
    window.location.href = `${INVENTORY_SNAPSHOT_URL.download()}?date=${encodeURIComponent(date)}&location.id=${currentLocation?.id}`;
  };

  const onTriggerReindex = (event) => {
    event.preventDefault();
    if (!currentLocation?.id || !date) {
      // eslint-disable-next-line no-alert
      alert('Please choose a location and date.');
      return;
    }
    const params = { date };
    if (!allLocations) {
      params['location.id'] = currentLocation.id;
    }
    apiClient.get(INVENTORY_SNAPSHOT_REFRESH, { params })
      .then((response) => {
        setMessageType('success');
        setMessage(response.data.message);
      })
      .catch(handleAjaxError);
  };

  const effectivePageSize = pageSize === -1 ? (rows.length || 1) : pageSize;
  const pageCount = Math.max(Math.ceil(rows.length / effectivePageSize), 1);
  const pagedRows = rows.slice(page * effectivePageSize, (page + 1) * effectivePageSize);

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="row">
        <div className="col-md-3">
          <div className="box p-3">
            <form className="form-search" onSubmit={onReload}>
              <div className="form-group">
                <label htmlFor="locationid">
                  <Translate id="react.default.location.label" defaultMessage="Location" />
                </label>
                <div id="locationid">{currentLocation?.name}</div>
              </div>
              <div className="form-group">
                <label htmlFor="date">
                  <Translate id="react.default.date.label" defaultMessage="Date" />
                </label>
                <input
                  id="date"
                  name="date"
                  className="form-control"
                  placeholder="MM/DD/YYYY"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <hr />
              <div className="form-actions">
                <button id="refresh-btn" type="submit" className="btn btn-primary">
                  <Translate id="react.inventorySnapshot.reload.label" defaultMessage="Reload" />
                </button>
              </div>
            </form>
            <hr />
            <h2>
              <Translate id="react.inventorySnapshot.reindexing.label" defaultMessage="Re-indexing" />
            </h2>
            <p>
              <Translate
                id="react.inventorySnapshot.reindexing.message"
                defaultMessage="If data is stale or does not exist, you can run a background process that re-indexes the quantity on hand values for the current location and selected date."
              />
            </p>
            <div className="form-group">
              <label htmlFor="reindex-locations">
                <Translate id="react.default.location.label" defaultMessage="Location" />
              </label>
              <div id="reindex-locations" className="btn-group btn-group-toggle">
                <label htmlFor="allLocations" className={`btn btn-primary ${allLocations ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="location"
                    id="allLocations"
                    autoComplete="off"
                    checked={allLocations}
                    onChange={() => setAllLocations(true)}
                  />
                  {' All locations'}
                </label>
                <label htmlFor="currentLocation" className={`btn btn-primary ${!allLocations ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="location"
                    id="currentLocation"
                    autoComplete="off"
                    checked={!allLocations}
                    onChange={() => setAllLocations(false)}
                  />
                  {` ${currentLocation?.name || ''}`}
                </label>
              </div>
            </div>
            <div className="form-group">
              <button id="trigger-button" type="button" className="btn btn-default" onClick={onTriggerReindex}>
                <Translate id="react.inventorySnapshot.runReindexer.label" defaultMessage="Run Background Re-indexer" />
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-9">
          <div className="box p-3">
            <div id="message" className={`alert alert-${messageType}`}>{message}</div>
            <div className="button-bar pull-right float-right">
              <button id="download-button" type="button" className="btn btn-default" onClick={onDownload}>
                <Translate id="react.default.button.download.label" defaultMessage="Download" />
              </button>
            </div>
            <h1 className="title">
              <Translate id="react.inventorySnapshot.currentStock.label" defaultMessage="Current Stock" />
              {' '}
              <small className="font-weight-bold">{currentLocation?.name}</small>
            </h1>
            <div className="d-flex justify-content-between align-items-center">
              <span>{loading ? 'Loading...' : ''}</span>
              <div>
                <label htmlFor="pageSize" className="mr-1">
                  <Translate id="react.inventorySnapshot.resultsPerPage.label" defaultMessage="Results per page" />
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                >
                  {PAGE_SIZES.map((value) => (
                    <option key={value} value={value}>{value === -1 ? 'All' : value}</option>
                  ))}
                </select>
              </div>
            </div>
            <table id="dataTable" className="table table-striped table-bordered mt-2">
              <thead>
                <tr>
                  <th>
                    <Translate id="react.inventorySnapshot.location.label" defaultMessage="Location" />
                  </th>
                  <th>
                    <Translate id="react.inventorySnapshot.sku.label" defaultMessage="SKU" />
                  </th>
                  <th>
                    <Translate id="react.inventorySnapshot.product.label" defaultMessage="Product" />
                  </th>
                  <th>
                    <Translate id="react.inventorySnapshot.productGroup.label" defaultMessage="Product group" />
                  </th>
                  <th>
                    <Translate id="react.inventorySnapshot.category.label" defaultMessage="Category" />
                  </th>
                  <th>
                    <Translate id="react.inventorySnapshot.tags.label" defaultMessage="Tags" />
                  </th>
                  <th>
                    <Translate id="react.inventorySnapshot.qoh.label" defaultMessage="QoH" />
                  </th>
                  <th>
                    <Translate id="react.inventorySnapshot.uom.label" defaultMessage="UoM" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {!pagedRows.length && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      <Translate id="react.inventorySnapshot.noRecords.message" defaultMessage="No records found" />
                    </td>
                  </tr>
                )}
                {pagedRows.map((row, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={`${row.productCode}-${index}`}>
                    <td>{row.location}</td>
                    <td>{row.productCode}</td>
                    <td>{row.product}</td>
                    <td>{row.productGroup}</td>
                    <td>{row.category}</td>
                    <td>{row.tags}</td>
                    <td>{row.quantityOnHand}</td>
                    <td>{row.unitOfMeasure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-center">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm mr-2"
                disabled={page <= 0}
                onClick={() => setPage(page - 1)}
              >
                <Translate id="react.default.button.previous.label" defaultMessage="Previous" />
              </button>
              <span className="align-self-center mx-2">
                {`${page + 1} / ${pageCount}`}
              </span>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                <Translate id="react.default.button.next.label" defaultMessage="Next" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default InventorySnapshotList;
