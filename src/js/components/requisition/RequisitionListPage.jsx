import React, { useCallback, useEffect, useState } from 'react';

import { REQUISITION_LIST } from 'api/urls';
import { REQUISITION_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Select from 'utils/Select';
import Translate from 'utils/Translate';

import { useRequisitionSelectFetch } from './requisition-utils';

const PAGE_SIZE = 10;

const initialFilters = {
  q: '',
  status: '',
  type: '',
  relatedToMe: false,
  requestedBy: null,
  createdBy: null,
  updatedBy: null,
  requestedDateRange: '',
  issuedDateRange: '',
};

const formatDate = (millis) => (millis ? new Date(millis).toLocaleDateString() : '');

const RequisitionListPage = () => {
  const { debouncedPeopleFetch } = useRequisitionSelectFetch();
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);

  useTranslation('requisition');

  const fetchList = useCallback((appliedFilters, appliedOffset) => {
    const params = {
      max: PAGE_SIZE,
      offset: appliedOffset,
    };
    if (appliedFilters.q) params.q = appliedFilters.q;
    if (appliedFilters.status) params.status = appliedFilters.status;
    if (appliedFilters.type) params.type = appliedFilters.type;
    if (appliedFilters.relatedToMe) params.relatedToMe = 'on';
    if (appliedFilters.requestedBy) params['requestedBy.id'] = appliedFilters.requestedBy.id;
    if (appliedFilters.createdBy) params['createdBy.id'] = appliedFilters.createdBy.id;
    if (appliedFilters.updatedBy) params['updatedBy.id'] = appliedFilters.updatedBy.id;
    if (appliedFilters.requestedDateRange) {
      params.requestedDateRange = appliedFilters.requestedDateRange;
    }
    if (appliedFilters.issuedDateRange) {
      params.issuedDateRange = appliedFilters.issuedDateRange;
    }
    apiClient.get(REQUISITION_LIST, { params })
      .then((response) => setData(response.data.data));
  }, []);

  useEffect(() => {
    fetchList(initialFilters, 0);
  }, [fetchList]);

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setOffset(0);
    fetchList(newFilters, 0);
  };

  const search = (event) => {
    event.preventDefault();
    applyFilters(filters);
  };

  const filterByStatus = (status, relatedToMe = false) => {
    applyFilters({ ...initialFilters, status, relatedToMe });
  };

  if (!data) {
    return null;
  }

  const totalCount = data.totalCount || 0;
  const statistics = data.statistics || {};

  return (
    <div className="d-flex list-page-main p-3" style={{ gap: '1rem' }}>
      <div style={{ minWidth: '220px' }}>
        <div className="box p-3 border rounded bg-white mb-3">
          <h3><Translate id="react.requisition.requisitions.label" defaultMessage="Requisitions" /></h3>
          <ul className="list-unstyled mb-0">
            <li>
              <button type="button" className="btn btn-link p-0" onClick={() => filterByStatus('', true)}>
                <Translate id="react.requisition.myRequisitions.label" defaultMessage="My requisitions" />
                {' '}
                (
                {statistics.MINE || 0}
                )
              </button>
            </li>
            <li>
              <button type="button" className="btn btn-link p-0" onClick={() => filterByStatus('')}>
                <Translate id="react.default.all.label" defaultMessage="All" />
                {' '}
                (
                {statistics.ALL || 0}
                )
              </button>
            </li>
            {(data.statusOptions || [])
              .filter((option) => statistics[option.id])
              .map((option) => (
                <li key={option.id}>
                  <button type="button" className="btn btn-link p-0" onClick={() => filterByStatus(option.id)}>
                    {option.label}
                    {' '}
                    (
                    {statistics[option.id]}
                    )
                  </button>
                </li>
              ))}
          </ul>
        </div>
      </div>
      <div className="flex-grow-1">
        <div className="box p-3 border rounded bg-white mb-3">
          <form onSubmit={search}>
            <div className="form-row align-items-end">
              <div className="col-md-3">
                <label htmlFor="requisition-search">
                  <Translate id="react.default.search.label" defaultMessage="Search" />
                </label>
                <input
                  id="requisition-search"
                  type="text"
                  className="form-control"
                  value={filters.q}
                  onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="requisition-status-filter">
                  <Translate id="react.requisition.status.label" defaultMessage="Status" />
                </label>
                <select
                  id="requisition-status-filter"
                  className="form-control"
                  value={filters.status}
                  onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                >
                  <option value="" aria-label="None" />
                  {(data.statusOptions || []).map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label htmlFor="requisition-type-filter">
                  <Translate id="react.requisition.requisitionType.label" defaultMessage="Requisition type" />
                </label>
                <select
                  id="requisition-type-filter"
                  className="form-control"
                  value={filters.type}
                  onChange={(event) => setFilters({ ...filters, type: event.target.value })}
                >
                  <option value="" aria-label="None" />
                  {(data.typeOptions || []).map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label htmlFor="requestedBy">
                  <Translate id="react.requisition.requestedBy.label" defaultMessage="Requested by" />
                </label>
                <Select
                  id="requestedBy"
                  async
                  loadOptions={debouncedPeopleFetch}
                  cache={false}
                  options={[]}
                  value={filters.requestedBy}
                  onChange={(value) => setFilters({ ...filters, requestedBy: value })}
                />
              </div>
              <div className="col-md-2 form-check mb-2">
                <input
                  id="relatedToMe"
                  type="checkbox"
                  className="form-check-input"
                  checked={filters.relatedToMe}
                  onChange={(event) => setFilters({
                    ...filters, relatedToMe: event.target.checked,
                  })}
                />
                <label className="form-check-label" htmlFor="relatedToMe">
                  <Translate id="react.requisition.relatedToMe.label" defaultMessage="Related to me" />
                </label>
              </div>
            </div>
            <div className="d-flex mt-2" style={{ gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                <Translate id="react.default.search.label" defaultMessage="Search" />
              </button>
              <a className="btn btn-outline-secondary" href={REQUISITION_URL.exportRequisitions()}>
                <Translate id="react.requisition.exportRequisitions.label" defaultMessage="Export requisitions" />
              </a>
              <a className="btn btn-outline-secondary" href={REQUISITION_URL.exportRequisitionItems()}>
                <Translate id="react.requisition.exportRequisitionItems.label" defaultMessage="Export requisition items" />
              </a>
            </div>
          </form>
        </div>
        <div className="box p-3 border rounded bg-white">
          {!data.requisitions?.length ? (
            <div className="text-center text-muted p-3">
              <Translate id="react.requisition.empty.label" defaultMessage="No requisitions match the specified criteria" />
            </div>
          ) : (
            <table className="table table-sm table-striped">
              <thead>
                <tr>
                  <th aria-label="Number of items" className="text-center">#</th>
                  <th aria-label="Status"><Translate id="react.requisition.status.label" defaultMessage="Status" /></th>
                  <th aria-label="Request number"><Translate id="react.requisition.requestNumber.label" defaultMessage="Request number" /></th>
                  <th aria-label="Requisition type"><Translate id="react.requisition.requisitionType.label" defaultMessage="Requisition type" /></th>
                  <th aria-label="Name"><Translate id="react.requisition.name.label" defaultMessage="Name" /></th>
                  <th aria-label="Requested by"><Translate id="react.requisition.requestedBy.label" defaultMessage="Requested by" /></th>
                  <th aria-label="Date requested"><Translate id="react.requisition.dateRequested.label" defaultMessage="Date requested" /></th>
                  <th aria-label="Date issued"><Translate id="react.requisition.dateIssued.label" defaultMessage="Date issued" /></th>
                </tr>
              </thead>
              <tbody>
                {data.requisitions.map((requisition) => (
                  <tr key={requisition.id}>
                    <td className="text-center">{requisition.numItems}</td>
                    <td>{requisition.statusLabel}</td>
                    <td>
                      <a href={REQUISITION_URL.show(requisition.id)}>{requisition.requestNumber}</a>
                    </td>
                    <td>{requisition.type}</td>
                    <td>
                      <a href={REQUISITION_URL.show(requisition.id)}>{requisition.name}</a>
                    </td>
                    <td>{requisition.requestedByName}</td>
                    <td>{formatDate(requisition.dateRequested)}</td>
                    <td>{formatDate(requisition.dateIssued)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted">
              {totalCount}
              {' '}
              <Translate id="react.requisition.requisitions.label" defaultMessage="Requisitions" />
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

export default RequisitionListPage;
