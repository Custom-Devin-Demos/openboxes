/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import {
  INVENTORY_BROWSER_QOH_BY_PRODUCT_GROUP,
  INVENTORY_BROWSER_SUMMARY_BY_PRODUCT_GROUP,
} from 'api/urls';
import { INVENTORY_LEVEL_URL, PRODUCT_GROUP_URL, REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import '../inventory/inventoryLegacy.scss';

// Same status list as the legacy report/showInventoryReport.gsp sidebar
const STATUSES = [
  'OVERSTOCK',
  'IN_STOCK',
  'IDEAL_STOCK',
  'REORDER',
  'LOW_STOCK',
  'STOCK_OUT',
  'NOT_STOCKED',
  'INVALID',
];

// Matches enum.InventoryLevelStatus.* labels from messages.properties
const STATUS_LABELS = {
  OVERSTOCK: 'Overstock',
  IN_STOCK: 'In stock',
  IDEAL_STOCK: 'Ideal stock',
  REORDER: 'Reorder',
  LOW_STOCK: 'Low stock',
  STOCK_OUT: 'Out of stock',
  NOT_STOCKED: 'Not stocked',
  INVALID: 'Invalid',
};

// Row colors from the legacy fnRowCallback
const STATUS_COLORS = {
  IN_STOCK: 'green',
  NOT_STOCKED: 'grey',
  STOCK_OUT: 'red',
  LOW_STOCK: 'orange',
  REORDER: '#eed7b0',
  IDEAL_STOCK: 'green',
  OVERSTOCK: 'blue',
  INVALID: 'grey',
};

const PAGE_SIZES = [25, 50, 100, 500, 1000, -1];

const ShowInventoryReport = () => {
  useTranslation('report', 'default');

  const currentLocation = useSelector((state) => state.session.currentLocation);

  const [checkedStatuses, setCheckedStatuses] = useState([]);
  const [summary, setSummary] = useState({});
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(-1);
  const [page, setPage] = useState(0);

  const fetchItems = useCallback((statuses) => {
    setLoading(true);
    const searchParams = new URLSearchParams();
    searchParams.append('location.id', currentLocation?.id);
    if (statuses.length) {
      // Legacy DataTables serialized the checked statuses as a comma-joined "status[]" param
      searchParams.append('status[]', statuses.join(','));
    }
    apiClient.get(`${INVENTORY_BROWSER_QOH_BY_PRODUCT_GROUP}?${searchParams.toString()}`)
      .then((response) => {
        setItems(response.data.aaData || []);
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
    apiClient.get(INVENTORY_BROWSER_SUMMARY_BY_PRODUCT_GROUP, {
      params: { 'location.id': currentLocation.id },
    })
      .then((response) => setSummary(response.data || {}));
  }, [currentLocation?.id]);

  const toggleStatus = (status) => {
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

  const onExport = (event) => {
    event.preventDefault();
    const searchParams = new URLSearchParams();
    checkedStatuses.forEach((status) => searchParams.append('status', status));
    window.location.href = `${REPORT_URL.exportInventoryReport()}?${searchParams.toString()}`;
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
                <Translate id="react.report.inventoryReport.status.label" defaultMessage="Status" />
              </label>
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
                    <span>{STATUS_LABELS[status]}</span>
                  </label>
                  <span>
                    <span className="badge badge-default badge-pill" id={`badge-status-${status}`}>
                      {summary[status]?.numProductGroups}
                    </span>
                    {' '}
                    <span id={`badge-percentage-${status}`}>
                      {summary[status]?.percentage != null
                        ? `${Math.round(summary[status].percentage * 100)}%`
                        : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" id="refresh-btn" className="btn btn-primary mt-2 mr-2" onClick={onRefresh}>
              <Translate id="react.default.button.refresh.label" defaultMessage="Refresh" />
            </button>
            <button type="button" id="submit-btm" className="btn btn-secondary mt-2" onClick={onExport}>
              <Translate id="react.report.inventoryReport.export.label" defaultMessage="Export" />
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
                  <Translate id="react.report.inventoryReport.resultsPerPage.label" defaultMessage="Results per page" />
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
                  <th><Translate id="react.report.inventoryReport.status.label" defaultMessage="Status" /></th>
                  <th><Translate id="react.report.inventoryReport.name.label" defaultMessage="Name" /></th>
                  <th><Translate id="react.report.inventoryReport.productCodes.label" defaultMessage="Product codes" /></th>
                  <th className="text-right"><Translate id="react.report.inventoryReport.min.label" defaultMessage="Min" /></th>
                  <th className="text-right"><Translate id="react.report.inventoryReport.reorder.label" defaultMessage="Reorder" /></th>
                  <th className="text-right"><Translate id="react.report.inventoryReport.max.label" defaultMessage="Max" /></th>
                  <th className="text-right"><Translate id="react.report.inventoryReport.qoh.label" defaultMessage="QoH" /></th>
                  <th className="text-right"><Translate id="react.report.inventoryReport.totalValue.label" defaultMessage="Total Value" /></th>
                  <th><Translate id="react.report.inventoryReport.hasProductGroup.label" defaultMessage="Has Product Group" /></th>
                  <th><Translate id="react.report.inventoryReport.hasInventoryLevel.label" defaultMessage="Has Inventory Level" /></th>
                </tr>
              </thead>
              <tbody>
                {!pagedItems.length && (
                  <tr>
                    <td colSpan="10" className="text-center">
                      <Translate id="react.report.inventoryReport.noData.message" defaultMessage="No data available in table" />
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
                    <td style={{ width: '40%' }}>
                      {item.id
                        ? (
                          <a href={PRODUCT_GROUP_URL.edit(item.id)} target="_blank" rel="noopener noreferrer">
                            {item.name}
                          </a>
                        )
                        : item.name}
                    </td>
                    <td>{item.productCodes}</td>
                    <td className="text-right">
                      {item.inventoryLevelId
                        ? (
                          <a href={INVENTORY_LEVEL_URL.edit(item.inventoryLevelId)} target="_blank" rel="noopener noreferrer">
                            {item.minQuantity}
                          </a>
                        )
                        : item.minQuantity}
                    </td>
                    <td className="text-right">
                      {item.inventoryLevelId
                        ? (
                          <a href={INVENTORY_LEVEL_URL.edit(item.inventoryLevelId)} target="_blank" rel="noopener noreferrer">
                            {item.reorderQuantity}
                          </a>
                        )
                        : item.reorderQuantity}
                    </td>
                    <td className="text-right">
                      {item.inventoryLevelId
                        ? (
                          <a href={INVENTORY_LEVEL_URL.edit(item.inventoryLevelId)} target="_blank" rel="noopener noreferrer">
                            {item.maxQuantity}
                          </a>
                        )
                        : item.maxQuantity}
                    </td>
                    <td className="text-right">{item.onHandQuantity}</td>
                    <td className="text-right">{item.totalValue}</td>
                    <td>{String(item.hasProductGroup)}</td>
                    <td>{String(item.hasInventoryLevel)}</td>
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

export default ShowInventoryReport;
