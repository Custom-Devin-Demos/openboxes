import React, { useCallback, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import queryString from 'query-string';
import { withRouter } from 'react-router-dom';

import {
  CONTEXT_PATH, DASHBOARD_URL, INVENTORY_ITEM_URL, INVENTORY_URL,
} from 'consts/applicationUrls';
import useTranslate from 'hooks/useTranslate';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import './inventoryLegacy.scss';

// The backend binds InventoryReportCommand dates using the legacy datepicker
// format (MM/dd/yyyy), so convert to/from the ISO format used by <input type="date">
const isoToLegacyDate = (iso) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : iso;
};

const legacyToIsoDate = (legacy) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(legacy);
  return match ? `${match[3]}-${match[1]}-${match[2]}` : legacy;
};

const EXPIRATION_STATUSES = [
  { value: 'within30Days', defaultMessage: 'Expiring within 30 days' },
  { value: 'within90Days', defaultMessage: 'Expiring within 90 days' },
  { value: 'within180Days', defaultMessage: 'Expiring within 180 days' },
  { value: 'within365Days', defaultMessage: 'Expiring within 365 days' },
  { value: 'greaterThan365Days', defaultMessage: 'Expires after 365 days' },
];

const ExpirationStockList = ({
  history,
  location,
  titleId,
  titleDefaultMessage,
  apiUrl,
  legacyUrl,
  showStatusFilter,
  noResultsMessageId,
  noResultsDefaultMessage,
}) => {
  useTranslation('inventory', 'product', 'default');
  const translate = useTranslate();

  const query = queryString.parse(location.search);
  const [data, setData] = useState(null);
  const [category, setCategory] = useState(query.category || '');
  const [status, setStatus] = useState(query.status || '');
  const [startDate, setStartDate] = useState(query.startDate ? legacyToIsoDate(query.startDate) : '');
  const [endDate, setEndDate] = useState(query.endDate ? legacyToIsoDate(query.endDate) : '');
  const [selectedItems, setSelectedItems] = useState([]);

  const fetchData = useCallback(() => {
    apiClient.get(apiUrl, { params: queryString.parse(location.search) })
      .then((response) => {
        setData(response.data);
        setSelectedItems([]);
      });
  }, [location.search, apiUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onFilter = (event) => {
    event.preventDefault();
    const params = {
      ...(category ? { category } : {}),
      ...(showStatusFilter && status ? { status } : {}),
      ...(startDate ? { startDate: isoToLegacyDate(startDate) } : {}),
      ...(endDate ? { endDate: isoToLegacyDate(endDate) } : {}),
    };
    history.push({ pathname: location.pathname, search: queryString.stringify(params) });
  };

  const toggleItem = (id) => {
    setSelectedItems((items) => (items.includes(id)
      ? items.filter((item) => item !== id)
      : [...items, id]));
  };

  const allIds = data?.data?.map((entry) => entry.inventoryItem?.id) || [];
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedItems.includes(id));

  const toggleAll = () => {
    setSelectedItems(allSelected ? [] : allIds);
  };

  const onAction = (action) => {
    if (!selectedItems.length) {
      // eslint-disable-next-line no-alert
      alert(translate(
        'react.inventory.selectAtLeastOneProduct.label',
        'Please select at least one product before choosing an action.',
      ));
      return;
    }
    const search = selectedItems.map((id) => `inventoryItem.id=${encodeURIComponent(id)}`).join('&');
    window.location = `${CONTEXT_PATH}/inventory/${action}?${search}`;
  };

  const csvHref = (withBinLocation) => queryString.stringifyUrl({
    url: legacyUrl,
    query: {
      format: 'csv',
      ...(query.category ? { category: query.category } : {}),
      ...(showStatusFilter && query.status ? { status: query.status } : {}),
      ...(withBinLocation ? { withBinLocation: true } : {}),
    },
  });

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <h2 className="mb-0">
            <Translate id={titleId} defaultMessage={titleDefaultMessage} />
          </h2>
          <div>
            <a className="btn btn-outline-secondary btn-sm mr-1" href={DASHBOARD_URL.base}>
              <Translate id="react.inventory.dashboard.label" defaultMessage="Dashboard" />
            </a>
            <a className="btn btn-outline-secondary btn-sm mr-1" href={INVENTORY_URL.browse()}>
              <Translate id="react.inventory.browse.label" defaultMessage="Browse inventory" />
            </a>
            <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => onAction('createOutboundTransfer')}>
              <Translate id="react.inventory.transferOut.label" defaultMessage="Transfer out" />
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => onAction('createExpired')}>
              <Translate id="react.inventory.markAsExpired.label" defaultMessage="Mark as expired" />
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm mr-1" onClick={() => onAction('createConsumed')}>
              <Translate id="react.inventory.markAsConsumed.label" defaultMessage="Mark as consumed" />
            </button>
            <a className="btn btn-outline-secondary btn-sm mr-1" href={csvHref(false)}>
              <Translate id="react.default.button.downloadAsCsv.label" defaultMessage="Download as CSV" />
            </a>
            <a className="btn btn-outline-secondary btn-sm" href={csvHref(true)}>
              <Translate id="react.inventory.downloadWithBinLocation.label" defaultMessage="Download with Bin Locations (.csv)" />
            </a>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="box p-3">
            <h2>
              <Translate id="react.default.filters.label" defaultMessage="Filters" />
            </h2>
            <form onSubmit={onFilter}>
              <div className="form-group">
                <label htmlFor="category">
                  <Translate id="react.inventory.category.label" defaultMessage="Category" />
                </label>
                <select
                  id="category"
                  name="category"
                  className="form-control"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">All</option>
                  {data?.categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              {showStatusFilter && (
                <div className="form-group">
                  <label htmlFor="status">
                    <Translate id="react.inventory.expiresWithin.label" defaultMessage="Expires within" />
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="form-control"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="">All</option>
                    {EXPIRATION_STATUSES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.defaultMessage}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="startDate">
                  <Translate id="react.inventory.expiresAfter.label" defaultMessage="Expires after" />
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">
                  <Translate id="react.inventory.expiresBefore.label" defaultMessage="Expires before" />
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                <Translate id="react.default.button.filter.label" defaultMessage="Filter" />
              </button>
            </form>
          </div>
        </div>
        <div className="col-md-9">
          <div className="box p-3">
            <h2>
              <Translate id={titleId} defaultMessage={titleDefaultMessage} />
              {` (${data?.data?.length || 0} `}
              <Translate id="react.default.results.label" defaultMessage="Results" />
              )
            </h2>
            <table className="table table-striped table-sm">
              <thead>
                <tr>
                  <th className="text-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>
                    <Translate id="react.inventory.productCode.label" defaultMessage="Code" />
                  </th>
                  <th>
                    <Translate id="react.inventory.product.label" defaultMessage="Product" />
                  </th>
                  <th>
                    <Translate id="react.inventory.category.label" defaultMessage="Category" />
                  </th>
                  <th>
                    <Translate id="react.inventory.lotNumber.label" defaultMessage="Lot number" />
                  </th>
                  <th className="text-center">
                    <Translate id="react.inventory.expires.label" defaultMessage="Expires" />
                  </th>
                  <th className="text-right">
                    <Translate id="react.inventory.quantity.label" defaultMessage="Quantity" />
                  </th>
                  <th>
                    <Translate id="react.inventory.unitOfMeasure.label" defaultMessage="Unit" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data && !data.data?.length && (
                  <tr>
                    <td colSpan={8} className="text-center">
                      <Translate id={noResultsMessageId} defaultMessage={noResultsDefaultMessage} />
                    </td>
                  </tr>
                )}
                {data?.data?.map((entry) => (
                  <tr key={entry.inventoryItem?.id}>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(entry.inventoryItem?.id)}
                        onChange={() => toggleItem(entry.inventoryItem?.id)}
                      />
                    </td>
                    <td>
                      <a href={INVENTORY_ITEM_URL.showStockCard(entry.inventoryItem?.product?.id)}>
                        {entry.inventoryItem?.product?.productCode}
                      </a>
                    </td>
                    <td>
                      <a href={INVENTORY_ITEM_URL.showStockCard(entry.inventoryItem?.product?.id)}>
                        {entry.inventoryItem?.product?.name}
                      </a>
                    </td>
                    <td>{entry.inventoryItem?.product?.category}</td>
                    <td>{entry.inventoryItem?.lotNumber}</td>
                    <td className="text-center">{entry.inventoryItem?.expirationDate}</td>
                    <td className="text-right">{entry.quantity}</td>
                    <td>{entry.inventoryItem?.product?.unitOfMeasure || 'EA'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default withRouter(ExpirationStockList);

ExpirationStockList.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
  titleId: PropTypes.string.isRequired,
  titleDefaultMessage: PropTypes.string.isRequired,
  apiUrl: PropTypes.string.isRequired,
  legacyUrl: PropTypes.string.isRequired,
  showStatusFilter: PropTypes.bool,
  noResultsMessageId: PropTypes.string.isRequired,
  noResultsDefaultMessage: PropTypes.string.isRequired,
};

ExpirationStockList.defaultProps = {
  showStatusFilter: false,
};
