import React, { useCallback, useEffect, useState } from 'react';

import moment from 'moment';

import { CATEGORY_OPTIONS, CONSUMPTION_AGGREGATE, CONSUMPTION_DEPOTS } from 'api/urls';
import ConsumptionButtonBar from 'components/reporting/consumption/ConsumptionButtonBar';
import ConsumptionPivotTable from 'components/reporting/consumption/ConsumptionPivotTable';
import useTranslate from 'hooks/useTranslate';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const ConsumptionList = () => {
  useTranslation('consumption', 'default');
  const translate = useTranslate();

  const [depots, setDepots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient.get(CONSUMPTION_DEPOTS).then((response) => setDepots(response.data.data));
    apiClient.get(CATEGORY_OPTIONS).then((response) => setCategories(response.data.data));
  }, []);

  const fetchData = useCallback((params) => {
    setLoading(true);
    setError(false);
    apiClient.get(CONSUMPTION_AGGREGATE, { params })
      .then((response) => setData(response.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData({});
  }, [fetchData]);

  const formatDateParam = (date) => (date ? moment(date).format('MM/DD/YYYY') : '');

  const runReport = () => fetchData({
    location,
    category,
    startDate: formatDateParam(startDate),
    endDate: formatDateParam(endDate),
  });

  const clearFilters = () => {
    setLocation('');
    setCategory('');
    setStartDate('');
    setEndDate('');
    fetchData({});
  };

  return (
    <PageWrapper>
      <div className="p-3">
        <h1><Translate id="react.consumption.header.label" defaultMessage="Consumption" /></h1>
        <ConsumptionButtonBar />
        <div className="row">
          <div className="col-md-3">
            <div className="border rounded p-3">
              <h5><Translate id="react.default.filters.label" defaultMessage="Filters" /></h5>
              <div className="form-group">
                <label htmlFor="consumption-location">
                  <Translate id="react.consumption.location.label" defaultMessage="Location" />
                </label>
                <select
                  id="consumption-location"
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
                <label htmlFor="consumption-category">
                  <Translate id="react.consumption.category.label" defaultMessage="Category" />
                </label>
                <select
                  id="consumption-category"
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="" aria-label="none" />
                  {categories.map((categoryOption) => (
                    <option key={categoryOption.id} value={categoryOption.id}>
                      {categoryOption.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="consumption-start-date">
                  <Translate id="react.consumption.startDate.label" defaultMessage="Start date" />
                </label>
                <input
                  id="consumption-start-date"
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="consumption-end-date">
                  <Translate id="react.consumption.endDate.label" defaultMessage="End date" />
                </label>
                <input
                  id="consumption-end-date"
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-primary btn-sm mr-2" onClick={runReport}>
                <Translate id="react.default.button.view.label" defaultMessage="View" />
              </button>
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                <Translate id="react.default.button.clear.label" defaultMessage="Clear" />
              </button>
            </div>
          </div>
          <div className="col-md-9">
            <div className="border rounded p-3">
              <h5><Translate id="react.consumption.label" defaultMessage="Consumption" /></h5>
              {loading && <Translate id="react.default.loading.label" defaultMessage="Loading..." />}
              {error && (
                <div className="alert alert-danger">
                  <Translate id="react.default.errorOccurred.label" defaultMessage="An unexpected error has occurred" />
                </div>
              )}
              {!loading && !error && data && (
                <ConsumptionPivotTable
                  data={data}
                  rowAttributes={['productName']}
                  colAttributes={['year', 'month']}
                  valueAttribute="quantity"
                  rowLabel={translate('react.consumption.product.label', 'Product')}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ConsumptionList;
