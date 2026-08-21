import React, { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import {
  INVENTORY_BROWSER_QOH_BY_PRODUCT_GROUP,
  INVENTORY_BROWSER_SUMMARY_BY_PRODUCT_GROUP,
} from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import '../inventory/inventoryLegacy.scss';

const STATUSES = [
  'ALL',
  'OVERSTOCK',
  'IN_STOCK',
  'IDEAL_STOCK',
  'REORDER',
  'LOW_STOCK',
  'STOCK_OUT',
  'NOT_STOCKED',
  'INVALID',
];

// Matches enum.InventoryLevelStatus.* labels and colors from messages.properties
const STATUS_LABELS = {
  ALL: { label: 'All statuses' },
  OVERSTOCK: { label: 'Overstock', color: 'blue' },
  IN_STOCK: { label: 'In stock', color: 'green' },
  IDEAL_STOCK: { label: 'Ideal stock', color: 'green' },
  REORDER: { label: 'Reorder', color: 'orange' },
  LOW_STOCK: { label: 'Low stock', color: 'orange' },
  STOCK_OUT: { label: 'Out of stock', color: 'red' },
  NOT_STOCKED: { label: 'Not stocked', color: '#aaa' },
  INVALID: { label: 'Invalid', color: '#aaa' },
};

const STATUS_COLORS = {
  IN_STOCK: 'green',
  NOT_STOCKED: 'grey',
  STOCK_OUT: 'red',
  LOW_STOCK: 'orange',
  REORDER: 'yellow',
  IDEAL_STOCK: 'green',
  OVERSTOCK: 'blue',
  INVALID: 'grey',
};

const PAGE_SIZES = [5, 10, 25, 50, 100, 500, 1000, -1];

const InventoryBrowserList = () => {
  useTranslation('inventory', 'default');

  const currentLocation = useSelector((state) => state.session.currentLocation);

  const [checkedStatuses, setCheckedStatuses] = useState([]);
  const [summary, setSummary] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [processingTime, setProcessingTime] = useState('');
  const [totalValueFormatted, setTotalValueFormatted] = useState('0.00');
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const fetchItems = useCallback((statuses) => {
    setLoading(true);
    const searchParams = new URLSearchParams();
    searchParams.append('location.id', currentLocation?.id);
    if (statuses.length) {
      searchParams.append('status[]', statuses.join(','));
    }
    apiClient.get(`${INVENTORY_BROWSER_QOH_BY_PRODUCT_GROUP}?${searchParams.toString()}`)
      .then((response) => {
        setItems(response.data.aaData || []);
        setProcessingTime(response.data.processingTime || '');
        setTotalValueFormatted(response.data.totalValueFormatted || '0.00');
        setPage(0);
      })
      .finally(() => setLoading(false));
  }, [currentLocation?.id]);

  useEffect(() => {
    if (!currentLocation?.id) {
      return;
    }
    fetchItems(checkedStatuses);
    // eslint-disable-next-line
  }, [currentLocation?.id]);

  useEffect(() => {
    if (!currentLocation?.id) {
      return;
    }
    setSummaryLoading(true);
    apiClient.get(INVENTORY_BROWSER_SUMMARY_BY_PRODUCT_GROUP, {
      params: { 'location.id': currentLocation.id },
    })
      .then((response) => setSummary(response.data || {}))
      .finally(() => setSummaryLoading(false));
  }, [currentLocation?.id]);

  const toggleStatus = (status) => {
    if (status === 'ALL') {
      setCheckedStatuses(
        checkedStatuses.includes('ALL') ? [] : [...STATUSES],
      );
      return;
    }
    setCheckedStatuses(
      checkedStatuses.includes(status)
        ? checkedStatuses.filter((it) => it !== status)
        : [...checkedStatuses, status],
    );
  };

  const onRefresh = (event) => {
    event.preventDefault();
    fetchItems(checkedStatuses);
  };

  const effectivePageSize = pageSize === -1 ? (items.length || 1) : pageSize;
  const pageCount = Math.max(Math.ceil(items.length / effectivePageSize), 1);
  const pagedItems = items.slice(page * effectivePageSize, (page + 1) * effectivePageSize);

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="row">
        <div className="col-md-3">
          <div className="box p-3">
            <div className="form-group">
              <label htmlFor="status-filters">
                <Translate id="react.inventoryBrowser.status.label" defaultMessage="Status" />
              </label>
              {summaryLoading && <span className="spinner ml-1">...</span>}
            </div>
            <ul id="status-filters" className="list-group">
              {STATUSES.map((status) => (
                <li key={status} className="list-group-item d-flex justify-content-between">
                  <label htmlFor={`status-${status}`} title={status} className="mb-0">
                    <input
                      id={`status-${status}`}
                      type="checkbox"
                      className="status-filter"
                      value={status}
                      checked={checkedStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                    />
                    {' '}
                    <span style={{ color: STATUS_LABELS[status].color }}>
                      {STATUS_LABELS[status].label}
                    </span>
                  </label>
                  <span className="badge badge-default badge-pill">
                    {summary[status]?.numProductGroups}
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary mt-2" onClick={onRefresh}>
              <Translate id="react.default.button.refresh.label" defaultMessage="Refresh" />
            </button>
          </div>
        </div>
        <div className="col-md-9">
          <div className="box p-3">
            <h2>{currentLocation?.name}</h2>
            <div className="d-flex justify-content-between align-items-center">
              <span>{loading ? 'Loading...' : ''}</span>
              <div>
                <label htmlFor="pageSize" className="mr-1">
                  <Translate id="react.inventoryBrowser.resultsPerPage.label" defaultMessage="Results per page" />
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
                    <Translate id="react.inventoryBrowser.status.label" defaultMessage="Status" />
                  </th>
                  <th>
                    <Translate id="react.inventoryBrowser.productCode.label" defaultMessage="Product Code" />
                  </th>
                  <th>
                    <Translate id="react.inventoryBrowser.name.label" defaultMessage="Name" />
                  </th>
                  <th className="text-right">
                    <Translate id="react.inventoryBrowser.minimum.label" defaultMessage="Minimum" />
                  </th>
                  <th className="text-right">
                    <Translate id="react.inventoryBrowser.reorder.label" defaultMessage="Reorder" />
                  </th>
                  <th className="text-right">
                    <Translate id="react.inventoryBrowser.maximum.label" defaultMessage="Maximum" />
                  </th>
                  <th className="text-right">
                    <Translate id="react.inventoryBrowser.qoh.label" defaultMessage="QoH" />
                  </th>
                  <th className="text-right">
                    <Translate id="react.inventoryBrowser.unitPrice.label" defaultMessage="Unit Price" />
                  </th>
                  <th className="text-right">
                    <Translate id="react.inventoryBrowser.total.label" defaultMessage="Total" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {!pagedItems.length && (
                  <tr>
                    <td colSpan="9" className="text-center">
                      <Translate id="react.inventoryBrowser.noData.message" defaultMessage="No data available in table" />
                    </td>
                  </tr>
                )}
                {pagedItems.map((item, index) => (
                  <tr
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${item.id || item.name}-${index}`}
                    style={{ color: STATUS_COLORS[item.status] }}
                  >
                    <td>{item.status}</td>
                    <td>{item.productCodes}</td>
                    <td style={{ width: '50%' }}>{item.name}</td>
                    <td className="text-right">{item.minQuantity}</td>
                    <td className="text-right">{item.reorderQuantity}</td>
                    <td className="text-right">{item.maxQuantity}</td>
                    <td className="text-right">{item.onHandQuantity}</td>
                    <td className="text-right">{item.unitPriceFormatted}</td>
                    <td className="text-right">{item.totalValueFormatted}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="9">
                    <span id="processingTime">{processingTime}</span>
                    {' '}
                    <span id="totalValue">
                      {`Total value of selected items $${totalValueFormatted}`}
                    </span>
                  </td>
                </tr>
              </tfoot>
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

export default InventoryBrowserList;
