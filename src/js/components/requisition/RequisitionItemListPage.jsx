import React, { useCallback, useEffect, useState } from 'react';

import { REQUISITION_ITEM_LIST } from 'api/urls';
import { INVENTORY_ITEM_URL, REQUISITION_ITEM_URL, REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';

const PAGE_SIZE = 10;

const initialFilters = {
  dateRequestedFrom: '',
  dateRequestedTo: '',
  cancelReasonCode: [],
};

const buildQueryString = (appliedFilters) => {
  const query = new URLSearchParams();
  if (appliedFilters.dateRequestedFrom) {
    query.append('dateRequestedFrom', appliedFilters.dateRequestedFrom);
  }
  if (appliedFilters.dateRequestedTo) {
    query.append('dateRequestedTo', appliedFilters.dateRequestedTo);
  }
  appliedFilters.cancelReasonCode.forEach((code) => query.append('cancelReasonCode', code));
  return query.toString();
};

const RequisitionItemListPage = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);

  useTranslation('requisition');

  const fetchList = useCallback((appliedFilters, appliedOffset) => {
    const params = new URLSearchParams(buildQueryString(appliedFilters));
    params.append('max', PAGE_SIZE);
    params.append('offset', appliedOffset);
    apiClient.get(`${REQUISITION_ITEM_LIST}?${params.toString()}`)
      .then((response) => setData(response.data.data));
  }, []);

  useEffect(() => {
    fetchList(initialFilters, 0);
  }, [fetchList]);

  const search = (event) => {
    event.preventDefault();
    setOffset(0);
    fetchList(filters, 0);
  };

  const toggleReasonCode = (selectedOptions) => {
    const values = Array.from(selectedOptions)
      .filter((option) => option.selected)
      .map((option) => option.value);
    setFilters({ ...filters, cancelReasonCode: values });
  };

  if (!data) {
    return null;
  }

  const totalCount = data.totalCount || 0;
  const items = data.items || [];

  return (
    <div className="d-flex list-page-main p-3" style={{ gap: '1rem' }}>
      <div style={{ minWidth: '260px' }}>
        <div className="box p-3 border rounded bg-white">
          <h3><Translate id="react.default.filters.label" defaultMessage="Filters" /></h3>
          <form onSubmit={search}>
            <div className="form-group">
              <label htmlFor="dateRequestedFrom">
                <Translate id="react.requisition.dateRequestedBetween.label" defaultMessage="Date requested between" />
              </label>
              <input
                id="dateRequestedFrom"
                type="text"
                className="form-control mb-1"
                placeholder="MM/dd/yyyy"
                autoComplete="off"
                value={filters.dateRequestedFrom}
                onChange={(event) => setFilters({
                  ...filters, dateRequestedFrom: event.target.value,
                })}
              />
              <input
                id="dateRequestedTo"
                type="text"
                className="form-control"
                placeholder="MM/dd/yyyy"
                autoComplete="off"
                value={filters.dateRequestedTo}
                onChange={(event) => setFilters({
                  ...filters, dateRequestedTo: event.target.value,
                })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cancelReasonCode">
                <Translate id="react.requisition.reasonCode.label" defaultMessage="Reason code" />
              </label>
              <select
                id="cancelReasonCode"
                className="form-control"
                multiple
                value={filters.cancelReasonCode}
                onChange={(event) => toggleReasonCode(event.target.options)}
              >
                {(data.reasonCodes || []).map((reasonCode) => (
                  <option key={reasonCode.id} value={reasonCode.id}>{reasonCode.label}</option>
                ))}
              </select>
            </div>
            <hr />
            <button type="submit" className="btn btn-primary">
              <Translate id="react.default.button.search.label" defaultMessage="Search" />
            </button>
          </form>
        </div>
      </div>
      <div className="flex-grow-1">
        <div className="d-flex mb-2" style={{ gap: '0.5rem' }}>
          <a className="btn btn-outline-secondary" href={REQUISITION_ITEM_URL.list()}>
            <Translate id="react.requisitionItem.list.label" defaultMessage="List requisition items" />
          </a>
          <a className="btn btn-outline-secondary" href={REQUISITION_ITEM_URL.export(buildQueryString(filters))}>
            <Translate id="react.default.button.export.label" defaultMessage="Export" />
          </a>
        </div>
        <div className="box p-3 border rounded bg-white">
          <h2>
            <Translate id="react.requisitionItem.list.label" defaultMessage="List requisition items" />
            {' '}
            (
            {totalCount}
            )
          </h2>
          <table className="table table-sm table-striped">
            <thead>
              <tr>
                <th aria-label="Edit"> </th>
                <th aria-label="Requisition"><Translate id="react.requisitionItem.requisition.label" defaultMessage="Requisition" /></th>
                <th aria-label="Date requested"><Translate id="react.requisitionItem.dateRequested.label" defaultMessage="Date requested" /></th>
                <th aria-label="Product"><Translate id="react.requisition.product.label" defaultMessage="Product" /></th>
                <th aria-label="Product group"><Translate id="react.requisitionItem.productGroup.label" defaultMessage="Product group" /></th>
                <th aria-label="Cancel reason code"><Translate id="react.requisitionItem.cancelReasonCode.label" defaultMessage="Cancel reason code" /></th>
                <th aria-label="Cancel comments"><Translate id="react.requisitionItem.cancelComments.label" defaultMessage="Cancel comments" /></th>
                <th aria-label="Quantity approved"><Translate id="react.requisition.approved.label" defaultMessage="Quantity approved" /></th>
                <th aria-label="Quantity canceled"><Translate id="react.requisitionItem.quantityCanceled.label" defaultMessage="Quantity canceled" /></th>
                <th aria-label="Quantity requested"><Translate id="react.requisition.requested.label" defaultMessage="Quantity requested" /></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <a href={REQUISITION_ITEM_URL.edit(item.id)}>
                      <Translate id="react.default.button.edit.label" defaultMessage="Edit" />
                    </a>
                  </td>
                  <td>
                    <a href={REQUISITION_URL.show(item.requisitionId)}>
                      {item.requestNumber}
                      {' '}
                      {item.requisitionName}
                    </a>
                  </td>
                  <td>{item.dateRequested}</td>
                  <td>
                    <a href={INVENTORY_ITEM_URL.showStockCard(item.productId)}>
                      {item.productCode}
                      {' '}
                      {item.productName}
                    </a>
                  </td>
                  <td>{item.genericProductName}</td>
                  <td>{item.cancelReasonCode}</td>
                  <td>{item.cancelComments}</td>
                  <td>{item.quantityApproved}</td>
                  <td>{item.quantityCanceled}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">
              {totalCount}
              {' '}
              <Translate id="react.requisitionItem.items.label" defaultMessage="Requisition items" />
            </span>
            <div style={{ gap: '0.5rem' }} className="d-flex">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={offset === 0}
                onClick={() => {
                  const newOffset = Math.max(0, offset - PAGE_SIZE);
                  setOffset(newOffset);
                  fetchList(filters, newOffset);
                }}
              >
                <Translate id="react.default.button.previous.label" defaultMessage="Previous" />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={offset + PAGE_SIZE >= totalCount}
                onClick={() => {
                  const newOffset = offset + PAGE_SIZE;
                  setOffset(newOffset);
                  fetchList(filters, newOffset);
                }}
              >
                <Translate id="react.default.button.next.label" defaultMessage="Next" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitionItemListPage;
