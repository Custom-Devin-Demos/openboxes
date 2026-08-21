/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import moment from 'moment';
import { useSelector } from 'react-redux';

import {
  REPORT_REQUEST_DETAIL,
  REQUEST_REASON_CODE_OPTIONS,
} from 'api/urls';
import { CONTEXT_PATH } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import {
  fetchLocations,
  fetchProductsCatalogs,
  fetchProductsCategories,
  fetchProductsTags,
} from 'utils/option-utils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import '../inventory/inventoryLegacy.scss';

const COLUMNS = [
  { key: 'requestNumber', label: 'Request Number', translationId: 'react.report.requestDetail.requestNumber.label' },
  { key: 'dateRequested', label: 'Date Requested', translationId: 'react.report.requestDetail.dateRequested.label' },
  { key: 'dateIssued', label: 'Date Issued', translationId: 'react.report.requestDetail.dateIssued.label' },
  { key: 'origin', label: 'Origin', translationId: 'react.report.requestDetail.origin.label' },
  { key: 'destination', label: 'Destination', translationId: 'react.report.requestDetail.destination.label' },
  { key: 'productCode', label: 'Code', translationId: 'react.report.requestDetail.code.label' },
  { key: 'productName', label: 'Product', translationId: 'react.report.requestDetail.product.label' },
  { key: 'quantityRequested', label: 'Qty Requested', translationId: 'react.report.requestDetail.qtyRequested.label' },
  { key: 'quantityIssued', label: 'Qty Issued', translationId: 'react.report.requestDetail.qtyIssued.label' },
  { key: 'quantityDemand', label: 'Qty Demand', translationId: 'react.report.requestDetail.qtyDemand.label' },
  { key: 'reasonCode', label: 'Reason Code', translationId: 'react.report.requestDetail.reasonCode.label' },
  { key: 'reasonCodeClassification', label: 'Reason Code Classification', translationId: 'react.report.requestDetail.reasonCodeClassification.label' },
];

const RequestDetailReport = () => {
  useTranslation('report', 'default');

  const currentLocation = useSelector((state) => state.session.currentLocation);

  const [originOptions, setOriginOptions] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [catalogOptions, setCatalogOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [reasonCodeOptions, setReasonCodeOptions] = useState([]);

  const [origins, setOrigins] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [category, setCategory] = useState('');
  const [includeCategoryChildren, setIncludeCategoryChildren] = useState(true);
  const [catalogs, setCatalogs] = useState('');
  const [tags, setTags] = useState([]);
  const [reasonCode, setReasonCode] = useState('');
  const [destination, setDestination] = useState('');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Same location filter as the legacy g:selectLocation (MANAGE_INVENTORY)
    fetchLocations({ activityCodes: ['MANAGE_INVENTORY'] })
      .then((locations) => setOriginOptions(locations));
    fetchLocations({})
      .then((locations) => setDestinationOptions(locations));
    fetchProductsCategories().then((options) => setCategoryOptions(options));
    fetchProductsCatalogs().then((options) => setCatalogOptions(options));
    fetchProductsTags().then((options) => setTagOptions(options));
    apiClient.get(REQUEST_REASON_CODE_OPTIONS)
      .then((response) => setReasonCodeOptions(response.data.data || []));
  }, []);

  // Legacy controller defaults origin to the current warehouse
  useEffect(() => {
    if (currentLocation?.id && !origins.length) {
      setOrigins([currentLocation.id]);
    }
    // eslint-disable-next-line
  }, [currentLocation?.id]);

  const validate = () => {
    if (!origins.length || !startDate || !endDate) {
      setError('All report parameters fields are required');
      return false;
    }
    if (moment(startDate).isAfter(moment(endDate))) {
      setError('Start date must occur before end date');
      return false;
    }
    setError('');
    return true;
  };

  const buildParams = () => {
    const searchParams = new URLSearchParams();
    searchParams.append('destinationId', destination);
    searchParams.append('originId', origins.join(','));
    searchParams.append('startDate', moment(startDate).format('MM/DD/YYYY'));
    searchParams.append('endDate', moment(endDate).format('MM/DD/YYYY'));
    searchParams.append('productId', productSearch);
    searchParams.append('reasonCode', reasonCode);
    searchParams.append('category', category);
    searchParams.append('tags', tags.join(','));
    searchParams.append('catalogs', catalogs);
    if (includeCategoryChildren) {
      searchParams.append('includeCategoryChildren', 'on');
    }
    return searchParams;
  };

  const onRun = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    setLoading(true);
    apiClient.post(REPORT_REQUEST_DETAIL, buildParams())
      .then((response) => setItems(response.data.aaData || []))
      .catch(() => setError('An error occurred on the server. Please contact your system administrator.'))
      .finally(() => setLoading(false));
  };

  const onDownload = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    const searchParams = buildParams();
    searchParams.append('format', 'text/csv');
    window.location.href = `${CONTEXT_PATH}${REPORT_REQUEST_DETAIL}?${searchParams.toString()}`;
  };

  const totalDemand = items.reduce((acc, item) => acc + (item.quantityDemand || 0), 0);
  const monthsDifference = startDate && endDate
    ? moment(endDate).startOf('month').diff(moment(startDate).startOf('month'), 'months', true) + 1
    : 1;
  const averageMonthlyDemand = Math.round(totalDemand / monthsDifference);

  return (
    <PageWrapper className="inventory-legacy-page">
      {error && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">{error}</div>
      )}
      <div className="row">
        <div className="col-md-3">
          <div className="box p-3">
            <h2><Translate id="react.report.parameters.label" defaultMessage="Parameters" /></h2>
            <form onSubmit={onRun}>
              <div className="form-group">
                <label htmlFor="origin">
                  <Translate id="react.report.requestDetail.fulfillingLocation.label" defaultMessage="Fulfilling location" />
                </label>
                <select
                  id="origin"
                  className="form-control"
                  multiple
                  value={origins}
                  onChange={(event) => setOrigins(
                    Array.from(event.target.selectedOptions, (option) => option.value),
                  )}
                >
                  {originOptions.map((location) => (
                    <option key={location.id} value={location.id}>{location.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="startDate">
                  <Translate id="react.report.requestDetail.dateIssuedBetween.label" defaultMessage="Date Issued Between" />
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="form-control mb-1"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
                <input
                  id="endDate"
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
              <h2><Translate id="react.report.optionalFilters.label" defaultMessage="Optional Filters" /></h2>
              <div className="form-group">
                <label htmlFor="product">
                  <Translate id="react.report.requestDetail.product.label" defaultMessage="Product" />
                </label>
                <input
                  id="product"
                  type="text"
                  className="form-control"
                  placeholder="Product ID"
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">
                  <Translate id="react.report.category.label" defaultMessage="Category" />
                </label>
                <select
                  id="category"
                  className="form-control"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="" />
                  {categoryOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <label htmlFor="includeCategoryChildren" className="mt-1">
                  <input
                    id="includeCategoryChildren"
                    type="checkbox"
                    checked={includeCategoryChildren}
                    onChange={(event) => setIncludeCategoryChildren(event.target.checked)}
                  />
                  {' '}
                  <Translate
                    id="react.report.search.includeCategoryChildren.label"
                    defaultMessage="Include all products in all subcategories"
                  />
                </label>
              </div>
              <div className="form-group">
                <label htmlFor="catalogs">
                  <Translate id="react.report.catalogs.label" defaultMessage="Formularies" />
                </label>
                <select
                  id="catalogs"
                  className="form-control"
                  value={catalogs}
                  onChange={(event) => setCatalogs(event.target.value)}
                >
                  <option value="" />
                  {catalogOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="tags">
                  <Translate id="react.report.tags.label" defaultMessage="Tags" />
                </label>
                <select
                  id="tags"
                  className="form-control"
                  multiple
                  value={tags}
                  onChange={(event) => setTags(
                    Array.from(event.target.selectedOptions, (option) => option.value),
                  )}
                >
                  {tagOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reasonCode">
                  <Translate id="react.report.requestDetail.cancelReasonCode.label" defaultMessage="Reason Code" />
                </label>
                <select
                  id="reasonCode"
                  className="form-control"
                  value={reasonCode}
                  onChange={(event) => setReasonCode(event.target.value)}
                >
                  <option value="" />
                  {reasonCodeOptions.map((option) => (
                    <option key={option.id} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="destinationId">
                  <Translate id="react.report.requestDetail.destination.label" defaultMessage="Destination" />
                </label>
                <select
                  id="destinationId"
                  className="form-control"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                >
                  <option value="" />
                  {destinationOptions.map((location) => (
                    <option key={location.id} value={location.id}>{location.label}</option>
                  ))}
                </select>
              </div>
              <div className="text-center">
                <button type="submit" className="btn btn-primary mr-2">
                  <Translate id="react.report.runReport.label" defaultMessage="Run Report" />
                </button>
                <button type="button" className="btn btn-secondary" onClick={onDownload}>
                  <Translate id="react.report.downloadData.label" defaultMessage="Download Data" />
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="col-md-9">
          <div className="box p-3">
            <h2>
              <Translate id="react.report.listRequestItems.label" defaultMessage="List Completed Request Items" />
            </h2>
            {loading && <div className="loading"><Translate id="react.default.loading.label" defaultMessage="Loading..." /></div>}
            <table id="requestDetailReportTable" className="table table-striped table-bordered">
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th key={column.key} className="text-center">
                      <Translate id={column.translationId} defaultMessage={column.label} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!items.length && (
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center">
                      <Translate id="react.report.noData.message" defaultMessage="No records found" />
                    </td>
                  </tr>
                )}
                {items.map((item, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <tr key={`${item.requestNumber}-${item.productCode}-${index}`}>
                    {COLUMNS.map((column) => (
                      <td key={column.key}>{item[column.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={10} />
                  <th><Translate id="react.report.totalDemand.label" defaultMessage="Total Demand" /></th>
                  <th id="totalDemand">{items.length ? totalDemand : ''}</th>
                </tr>
                <tr>
                  <th colSpan={10} />
                  <th><Translate id="react.report.averageMonthlyDemand.label" defaultMessage="Average Monthly Demand" /></th>
                  <th id="averageMonthlyDemand">{items.length ? averageMonthlyDemand : ''}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default RequestDetailReport;
