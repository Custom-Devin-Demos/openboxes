/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import moment from 'moment';
import queryString from 'query-string';

import {
  CATEGORY_OPTIONS, CONSUMPTION_DEPOTS, CONSUMPTION_SHOW, TAG_OPTIONS,
} from 'api/urls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const formatNumber = (value, maxFractionDigits) => {
  if (value === null || value === undefined) {
    return '';
  }
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });
};

const ConsumptionShow = () => {
  useTranslation('consumption', 'default');

  const [depots, setDepots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [fromLocations, setFromLocations] = useState([]);
  const [fromDate, setFromDate] = useState(moment().subtract(6, 'months').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [includeQuantityOnHand, setIncludeQuantityOnHand] = useState(true);

  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const buildParams = (extraParams = {}) => ({
    fromLocations,
    fromDate: fromDate ? moment(fromDate).format('MM/DD/YYYY') : '',
    toDate: toDate ? moment(toDate).format('MM/DD/YYYY') : '',
    selectedCategories,
    selectedTags,
    includeQuantityOnHand,
    ...extraParams,
  });

  const runReport = () => {
    setLoading(true);
    setErrorMessage('');
    apiClient.get(CONSUMPTION_SHOW, { params: buildParams() })
      .then((response) => setRows(response.data.data))
      .catch((error) => {
        const message = error?.response?.data?.errorMessages?.join('; ')
          || error?.response?.data?.errorMessage;
        setErrorMessage(message || 'An unexpected error has occurred');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    apiClient.get(CONSUMPTION_DEPOTS).then((response) => setDepots(response.data.data));
    apiClient.get(CATEGORY_OPTIONS).then((response) => setCategories(response.data.data));
    apiClient.get(TAG_OPTIONS, { params: { hideNumbers: true } })
      .then((response) => setTags(response.data.data));
    // Legacy screen runs the report with default parameters on initial load
    runReport();
  }, []);

  const downloadCsv = () => {
    const params = queryString.stringify({ ...buildParams(), format: 'csv' });
    window.open(`${window.CONTEXT_PATH}/consumption/show?${params}`, '_blank');
  };

  const resetFilters = () => {
    setFromLocations([]);
    setFromDate(moment().subtract(6, 'months').format('YYYY-MM-DD'));
    setToDate(moment().format('YYYY-MM-DD'));
    setSelectedCategories([]);
    setSelectedTags([]);
    setIncludeQuantityOnHand(true);
    setRows(null);
  };

  const selectValues = (event) =>
    Array.from(event.target.selectedOptions).map((option) => option.value);

  return (
    <PageWrapper>
      <div className="p-3">
        <h1><Translate id="react.consumption.header.label" defaultMessage="Consumption" /></h1>
        <div className="row">
          <div className="col-md-3">
            <div className="border rounded p-3">
              <h5><Translate id="react.default.filters.label" defaultMessage="Filters" /></h5>
              <div className="form-group">
                <label htmlFor="show-from-locations">
                  <Translate id="react.consumption.fromLocations.label" defaultMessage="Origin(s)" />
                </label>
                <select
                  id="show-from-locations"
                  className="form-control"
                  multiple
                  value={fromLocations}
                  onChange={(e) => setFromLocations(selectValues(e))}
                >
                  {depots.map((depot) => (
                    <option key={depot.id} value={depot.id}>{depot.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="show-from-date">
                  <Translate id="react.consumption.fromDate.label" defaultMessage="From date" />
                </label>
                <input
                  id="show-from-date"
                  type="date"
                  className="form-control"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="show-to-date">
                  <Translate id="react.consumption.toDate.label" defaultMessage="To date" />
                </label>
                <input
                  id="show-to-date"
                  type="date"
                  className="form-control"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="show-categories">
                  <Translate id="react.consumption.categories.label" defaultMessage="Categories" />
                </label>
                <select
                  id="show-categories"
                  className="form-control"
                  multiple
                  value={selectedCategories}
                  onChange={(e) => setSelectedCategories(selectValues(e))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="show-tags">
                  <Translate id="react.consumption.tags.label" defaultMessage="Tags" />
                </label>
                <select
                  id="show-tags"
                  className="form-control"
                  multiple
                  value={selectedTags}
                  onChange={(e) => setSelectedTags(selectValues(e))}
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group form-check">
                <input
                  id="show-include-qoh"
                  type="checkbox"
                  className="form-check-input"
                  checked={includeQuantityOnHand}
                  onChange={(e) => setIncludeQuantityOnHand(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="show-include-qoh">
                  <Translate id="react.consumption.includeQuantityOnHand.label" defaultMessage="Include quantity on hand" />
                </label>
              </div>
              <button type="button" className="btn btn-primary btn-sm mr-2" onClick={runReport}>
                <Translate id="react.consumption.runReport.label" defaultMessage="Run Report" />
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm mr-2" onClick={downloadCsv}>
                <Translate id="react.default.button.download.label" defaultMessage="Download" />
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
                <Translate id="react.default.button.reset.label" defaultMessage="Reset" />
              </button>
            </div>
          </div>
          <div className="col-md-9">
            <div className="border rounded p-3">
              <h5>
                <Translate id="react.consumption.label" defaultMessage="Consumption" />
                {rows && (
                  <small className="ml-2">
                    (
                    {rows.length}
                    {' '}
                    <Translate id="react.default.resultsLowerCase.label" defaultMessage="results" />
                    )
                  </small>
                )}
              </h5>
              {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
              {loading && <Translate id="react.default.loading.label" defaultMessage="Loading..." />}
              {!loading && rows && (
                <div className="table-responsive">
                  <table className="table table-sm table-striped">
                    <thead>
                      <tr>
                        <th><Translate id="react.consumption.productCode.label" defaultMessage="Code" /></th>
                        <th><Translate id="react.consumption.product.label" defaultMessage="Product" /></th>
                        <th className="text-center"><Translate id="react.consumption.unitPrice.label" defaultMessage="Unit Price" /></th>
                        <th className="text-center"><Translate id="react.consumption.issued.label" defaultMessage="Issued" /></th>
                        <th className="text-center"><Translate id="react.consumption.consumed.label" defaultMessage="Consumed" /></th>
                        <th className="text-center"><Translate id="react.consumption.returned.label" defaultMessage="Returned" /></th>
                        <th className="text-center"><Translate id="react.consumption.total.label" defaultMessage="Total Consumption" /></th>
                        <th className="text-center"><Translate id="react.consumption.totalConsumptionValue.label" defaultMessage="Total Consumption Value" /></th>
                        <th className="text-center"><Translate id="react.consumption.monthly.label" defaultMessage="Monthly" /></th>
                        <th className="text-center"><Translate id="react.consumption.qoh.label" defaultMessage="QoH" /></th>
                        <th className="text-center"><Translate id="react.consumption.months.label" defaultMessage="Months remaining" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.productId}>
                          <td>
                            <a href={`${window.CONTEXT_PATH}/inventoryItem/showStockCard/${row.productId}`}>
                              {row.productCode}
                            </a>
                          </td>
                          <td>
                            <a href={`${window.CONTEXT_PATH}/inventoryItem/showStockCard/${row.productId}`}>
                              {row.productName}
                            </a>
                          </td>
                          <td className="text-center">{formatNumber(row.pricePerUnit, 2)}</td>
                          <td className="text-center">{row.issuedQuantity}</td>
                          <td className="text-center">{row.consumedQuantity}</td>
                          <td className="text-center">{row.returnedQuantity}</td>
                          <td className="text-center">{row.totalConsumptionQuantity}</td>
                          <td className="text-center">{formatNumber(row.totalConsumptionValue, 2)}</td>
                          <td className="text-center">{formatNumber(row.monthlyQuantity, 4)}</td>
                          <td className="text-center">{formatNumber(row.onHandQuantity, 0)}</td>
                          <td className="text-center">{formatNumber(row.numberOfMonthsRemaining, 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ConsumptionShow;
