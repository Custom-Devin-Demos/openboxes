import React, { useEffect, useState } from 'react';

import moment from 'moment';
import { useSelector } from 'react-redux';

import {
  CATALOG_OPTIONS,
  CATEGORY_OPTIONS,
  CONSUMPTION_DEPOTS,
  TAG_OPTIONS,
} from 'api/urls';
import { REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

const getSelectedValues = (event) => Array.from(event.target.selectedOptions)
  .map((option) => option.value)
  .filter(Boolean);

const ForecastReport = () => {
  useTranslation('report', 'default');

  const currentLocation = useSelector((state) => state.session.currentLocation);

  const [depots, setDepots] = useState([]);
  const [categories, setCategories] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [tags, setTags] = useState([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [replenishmentPeriodDays, setReplenishmentPeriodDays] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    apiClient.get(CONSUMPTION_DEPOTS).then((response) => setDepots(response.data.data));
    apiClient.get(CATEGORY_OPTIONS).then((response) => setCategories(response.data.data));
    apiClient.get(CATALOG_OPTIONS).then((response) => setCatalogs(response.data.data));
    apiClient.get(TAG_OPTIONS).then((response) => setTags(response.data.data));
  }, []);

  const formatDateParam = (date) => (date ? moment(date).format('MM/DD/YYYY') : '');

  const download = () => {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', formatDateParam(startDate));
    searchParams.append('endDate', formatDateParam(endDate));
    searchParams.append('replenishmentPeriodDays', replenishmentPeriodDays);
    searchParams.append('leadTimeDays', leadTimeDays);
    selectedLocations.forEach((value) => searchParams.append('locations', value));
    selectedCategories.forEach((value) => searchParams.append('category', value));
    selectedTags.forEach((value) => searchParams.append('tags', value));
    selectedCatalogs.forEach((value) => searchParams.append('catalogs', value));
    searchParams.append('format', 'text/csv');
    searchParams.append('print', 'true');
    window.location.href = `${REPORT_URL.base}/showForecastReport?${searchParams.toString()}`;
  };

  return (
    <PageWrapper>
      <div className="p-3">
        <h1>
          <Translate id="react.report.forecastReport.header.label" defaultMessage="Forecast Report" />
        </h1>
        <div className="row">
          <div className="col-md-4">
            <div className="border rounded p-3">
              <h5><Translate id="react.report.parameters.label" defaultMessage="Parameters" /></h5>
              <div className="form-group">
                <label htmlFor="forecast-origin">
                  <Translate id="react.report.location.label" defaultMessage="Location" />
                </label>
                <input
                  id="forecast-origin"
                  type="text"
                  className="form-control"
                  value={currentLocation?.name || ''}
                  disabled
                />
              </div>
              <div className="form-group">
                <label htmlFor="forecast-start-date">
                  <Translate id="react.report.demandDateRange.label" defaultMessage="Demand date range" />
                </label>
                <input
                  id="forecast-start-date"
                  type="date"
                  className="form-control mb-1"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  id="forecast-end-date"
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="forecast-replenishment-period">
                  <Translate id="react.report.orderPeriod.label" defaultMessage="Order period (days)" />
                </label>
                <input
                  id="forecast-replenishment-period"
                  type="text"
                  className="form-control"
                  value={replenishmentPeriodDays}
                  onChange={(e) => setReplenishmentPeriodDays(e.target.value)}
                />
                <small className="text-muted">
                  <Translate id="react.report.orderPeriod.optional.label" defaultMessage="Optional" />
                </small>
              </div>
              <div className="form-group">
                <label htmlFor="forecast-lead-time">
                  <Translate id="react.report.leadTime.label" defaultMessage="Lead time (days)" />
                </label>
                <input
                  id="forecast-lead-time"
                  type="text"
                  className="form-control"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                />
                <small className="text-muted">
                  <Translate id="react.report.leadTime.optional.label" defaultMessage="Optional" />
                </small>
              </div>
              <h5>
                <Translate id="react.report.optionalFilters.label" defaultMessage="Optional Filters" />
              </h5>
              <div className="form-group">
                <label htmlFor="forecast-locations">
                  <Translate id="react.report.demandDestination.label" defaultMessage="Demand Destination" />
                </label>
                <select
                  id="forecast-locations"
                  className="form-control"
                  multiple
                  value={selectedLocations}
                  onChange={(e) => setSelectedLocations(getSelectedValues(e))}
                >
                  {depots.map((depot) => (
                    <option key={depot.id} value={depot.id}>{depot.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="forecast-categories">
                  <Translate id="react.report.category.label" defaultMessage="Category" />
                </label>
                <select
                  id="forecast-categories"
                  className="form-control"
                  multiple
                  value={selectedCategories}
                  onChange={(e) => setSelectedCategories(getSelectedValues(e))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="forecast-catalogs">
                  <Translate id="react.report.formularies.label" defaultMessage="Formularies" />
                </label>
                <select
                  id="forecast-catalogs"
                  className="form-control"
                  multiple
                  value={selectedCatalogs}
                  onChange={(e) => setSelectedCatalogs(getSelectedValues(e))}
                >
                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>{catalog.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="forecast-tags">
                  <Translate id="react.report.tag.label" defaultMessage="Tag" />
                </label>
                <select
                  id="forecast-tags"
                  className="form-control"
                  multiple
                  value={selectedTags}
                  onChange={(e) => setSelectedTags(getSelectedValues(e))}
                >
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.label}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={download}>
                <Translate id="react.default.button.download.label" defaultMessage="Download" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ForecastReport;
