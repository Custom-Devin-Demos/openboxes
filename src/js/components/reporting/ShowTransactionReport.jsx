/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import moment from 'moment';
import { useSelector } from 'react-redux';

import {
  REPORT_PRODUCT_AUTOSUGGEST,
  REPORT_TRANSACTION,
  REPORT_TRANSACTION_DETAILS,
  REPORT_TRANSACTION_METADATA,
} from 'api/urls';
import { CONTEXT_PATH, REPORT_URL } from 'consts/applicationUrls';
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

const DETAIL_COLUMNS = [
  { key: 'transactionDate', label: 'Date', translationId: 'react.default.date.label' },
  { key: 'transactionTime', label: 'Time', translationId: 'react.report.transaction.time.label' },
  { key: 'transactionTypeName', label: 'Type', translationId: 'react.report.transaction.type.label' },
  { key: 'transactionCode', label: 'Transaction Code', translationId: 'react.report.transaction.transactionCode.label' },
  { key: 'quantity', label: 'Quantity', translationId: 'react.default.quantity.label' },
  { key: 'balance', label: 'Balance', translationId: 'react.report.transaction.balance.label' },
];

const formatNumber = (value) => Number(value).toLocaleString('en-US');

const ShowTransactionReport = () => {
  useTranslation('report', 'default');

  const currentLocation = useSelector((state) => state.session.currentLocation);
  const isSuperuser = useSelector((state) => state.session.isSuperuser);

  const [locationOptions, setLocationOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [catalogOptions, setCatalogOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  const [locationId, setLocationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [includeCategoryChildren, setIncludeCategoryChildren] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [tags, setTags] = useState([]);
  const [catalogs, setCatalogs] = useState([]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const [detailsTitle, setDetailsTitle] = useState('');
  const [detailsRows, setDetailsRows] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    // Same location filter as the legacy g:selectLocation (MANAGE_INVENTORY)
    fetchLocations({ activityCodes: ['MANAGE_INVENTORY'] })
      .then((locations) => setLocationOptions(locations));
    fetchProductsCategories().then((options) => setCategoryOptions(options));
    fetchProductsCatalogs().then((options) => setCatalogOptions(options));
    fetchProductsTags().then((options) => setTagOptions(options));
    apiClient.get(REPORT_TRANSACTION_METADATA)
      .then((response) => setMetadata(response.data.data));
  }, []);

  // Legacy screen defaults location to the current warehouse
  useEffect(() => {
    if (currentLocation?.id && !locationId) {
      setLocationId(currentLocation.id);
    }
    // eslint-disable-next-line
  }, [currentLocation?.id]);

  const validate = () => {
    if (!endDate || !startDate || !locationId) {
      // eslint-disable-next-line no-alert
      alert('All fields are required');
      return false;
    }
    if (moment(startDate).isAfter(moment(endDate))) {
      // eslint-disable-next-line no-alert
      alert('Start date must occur before end date');
      return false;
    }
    if (moment(endDate).isAfter(moment(), 'day')) {
      // eslint-disable-next-line no-alert
      alert('End date must occur on or before today');
      return false;
    }
    return true;
  };

  const buildParams = () => {
    const searchParams = new URLSearchParams();
    searchParams.append('location.id', locationId);
    searchParams.append('startDate', moment(startDate).format('MM/DD/YYYY'));
    searchParams.append('endDate', moment(endDate).format('MM/DD/YYYY'));
    searchParams.append('category', category);
    selectedProducts.forEach((product) => {
      searchParams.append('products', product.id);
    });
    tags.forEach((tag) => {
      searchParams.append('tags', tag);
    });
    catalogs.forEach((catalog) => {
      searchParams.append('catalogs', catalog);
    });
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
    apiClient.post(REPORT_TRANSACTION, buildParams())
      .then((response) => setRows(response.data.aaData || []))
      .catch((error) => {
        const errorMessage = error?.response?.data?.errorMessage;
        // eslint-disable-next-line no-alert
        alert(`An unexpected error has occurred on the server. Please contact your system administrator.${errorMessage ? `\n\n${errorMessage}` : ''}`);
      })
      .finally(() => setLoading(false));
  };

  const onDownload = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    const searchParams = buildParams();
    searchParams.append('format', 'text/csv');
    window.location.href = `${CONTEXT_PATH}${REPORT_TRANSACTION}?${searchParams.toString()}`;
  };

  const onProductSearch = (value) => {
    setProductSearch(value);
    if (value?.length < 2) {
      setProductSuggestions([]);
      return;
    }
    apiClient.get(REPORT_PRODUCT_AUTOSUGGEST, { params: { term: value, skipQuantity: true } })
      .then((response) => setProductSuggestions((response.data || []).filter((it) => it.id)));
  };

  const addProduct = (product) => {
    if (!selectedProducts.some((it) => it.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setProductSearch('');
    setProductSuggestions([]);
  };

  const removeProduct = (id) => {
    setSelectedProducts(selectedProducts.filter((product) => product.id !== id));
  };

  const openDetails = (row) => {
    if (!row.Code || !row.Name) {
      return;
    }
    setDetailsTitle(`${row.Code} ${row.DisplayName || row.Name}`);
    setDetailsRows([]);
    setDetailsLoading(true);
    const searchParams = new URLSearchParams();
    searchParams.append('productCode', row.Code);
    searchParams.append('startDate', moment(startDate).format('MM/DD/YYYY'));
    searchParams.append('endDate', moment(endDate).format('MM/DD/YYYY'));
    apiClient.post(REPORT_TRANSACTION_DETAILS, searchParams)
      .then((response) => setDetailsRows(response.data.aaData || []))
      .finally(() => setDetailsLoading(false));
  };

  const closeDetails = () => {
    setDetailsRows(null);
    setDetailsTitle('');
  };

  const onRefreshTransactionFact = () => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure?');
    if (!confirmed) {
      return;
    }
    apiClient.get(REPORT_URL.refreshTransactionFact())
      .then(() => {
        // eslint-disable-next-line no-alert
        alert('Data has been refreshed');
      })
      .catch(() => {
        // eslint-disable-next-line no-alert
        alert('An error occurred while refreshing the data');
      })
      .finally(() => {
        window.location.reload();
      });
  };

  const renderAdjustments = (row) => {
    const adjustments = Number(row.Adjustments);
    if (adjustments < 0) {
      return formatNumber(0 - adjustments);
    }
    return formatNumber(adjustments);
  };

  const adjustmentsClass = (row) => {
    const adjustments = Number(row.Adjustments);
    if (adjustments > 0) {
      return 'credit';
    }
    if (adjustments < 0) {
      return 'debit';
    }
    return '';
  };

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="row">
        <div className="col-md-3">
          <div className="box p-3">
            <h2><Translate id="react.report.parameters.label" defaultMessage="Parameters" /></h2>
            <form onSubmit={onRun}>
              <div className="form-group">
                <label htmlFor="startDate">
                  <Translate id="react.report.startDate.label" defaultMessage="Start date" />
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="endDate">
                  <Translate id="react.report.endDate.label" defaultMessage="End date" />
                </label>
                <input
                  id="endDate"
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="locationId">
                  <Translate id="react.report.location.label" defaultMessage="Location" />
                </label>
                <select
                  id="locationId"
                  className="form-control"
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                >
                  <option value="" />
                  {locationOptions.map((location) => (
                    <option key={location.id} value={location.id}>{location.label}</option>
                  ))}
                </select>
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
                <label htmlFor="products-select">
                  <Translate id="react.report.product.label" defaultMessage="Product" />
                </label>
                <input
                  id="products-select"
                  type="text"
                  className="form-control"
                  autoComplete="off"
                  value={productSearch}
                  onChange={(event) => onProductSearch(event.target.value)}
                />
                {productSuggestions.length > 0 && (
                  <ul className="list-group" data-testid="product-suggestions">
                    {productSuggestions.map((product) => (
                      <li key={product.id} className="list-group-item p-1">
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0"
                          onClick={() => addProduct(product)}
                        >
                          {product.label || product.value}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {selectedProducts.length > 0 && (
                  <ul className="list-unstyled mt-1 mb-0" data-testid="selected-products">
                    {selectedProducts.map((product) => (
                      <li key={product.id}>
                        {product.label || product.value}
                        {' '}
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-danger"
                          onClick={() => removeProduct(product.id)}
                        >
                          &times;
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="tags">
                  <Translate id="react.report.tags.label" defaultMessage="Tag" />
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
                <label htmlFor="catalogs">
                  <Translate id="react.report.catalogs.label" defaultMessage="Formularies" />
                </label>
                <select
                  id="catalogs"
                  className="form-control"
                  multiple
                  value={catalogs}
                  onChange={(event) => setCatalogs(
                    Array.from(event.target.selectedOptions, (option) => option.value),
                  )}
                >
                  {catalogOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="text-center">
                <button type="submit" className="btn btn-primary mr-2 submit-button">
                  <Translate id="react.report.runReport.label" defaultMessage="Run Report" />
                </button>
                <button type="button" className="btn btn-secondary download-button" onClick={onDownload}>
                  <Translate id="react.report.downloadData.label" defaultMessage="Download Data" />
                </button>
              </div>
            </form>
          </div>
          <div className="box p-3 mt-3">
            <h2><Translate id="react.report.metadata.label" defaultMessage="Metadata" /></h2>
            <table className="table table-sm">
              <tbody>
                <tr>
                  <td><Translate id="react.report.products.label" defaultMessage="Products" /></td>
                  <td>{metadata ? formatNumber(metadata.productCount || 0) : ''}</td>
                </tr>
                <tr>
                  <td><Translate id="react.report.transactions.label" defaultMessage="Transactions" /></td>
                  <td>{metadata ? formatNumber(metadata.transactionCount || 0) : ''}</td>
                </tr>
                <tr>
                  <td><Translate id="react.report.transactions.minTransactionDate.label" defaultMessage="Earliest Transaction" /></td>
                  <td>{metadata?.minTransactionDate}</td>
                </tr>
                <tr>
                  <td><Translate id="react.report.transactions.maxTransactionDate.label" defaultMessage="Latest Transaction" /></td>
                  <td>{metadata?.maxTransactionDate}</td>
                </tr>
                <tr>
                  <td><Translate id="react.report.transactions.previousRefresh.label" defaultMessage="Previous Refresh" /></td>
                  <td>{metadata?.previousFireTime}</td>
                </tr>
                <tr>
                  <td><Translate id="react.report.transactions.nextRefresh.label" defaultMessage="Next Refresh" /></td>
                  <td>{metadata?.nextFireTime}</td>
                </tr>
              </tbody>
            </table>
            {isSuperuser && (
              <div className="text-center">
                <button
                  type="button"
                  id="refreshTransactionFact"
                  className="btn btn-secondary"
                  onClick={onRefreshTransactionFact}
                >
                  <Translate id="react.report.refreshData.label" defaultMessage="Refresh Data" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="col-md-9">
          <div className="box p-3">
            <h2>
              <Translate id="react.report.transactionReport.title" defaultMessage="Transaction Report" />
            </h2>
            {loading && <div className="loading"><Translate id="react.default.loading.label" defaultMessage="Loading..." /></div>}
            <table id="transactionReport" className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th><Translate id="react.report.transaction.code.label" defaultMessage="Code" /></th>
                  <th><Translate id="react.report.product.label" defaultMessage="Product" /></th>
                  <th><Translate id="react.report.category.label" defaultMessage="Category" /></th>
                  <th className="text-center"><Translate id="react.report.transaction.openingBalance.label" defaultMessage="Opening" /></th>
                  <th className="text-center"><Translate id="react.report.transaction.credits.label" defaultMessage="Credits" /></th>
                  <th className="text-center"><Translate id="react.report.transaction.debits.label" defaultMessage="Debits" /></th>
                  <th className="text-center"><Translate id="react.report.transaction.adjustments.label" defaultMessage="Adjustments" /></th>
                  <th className="text-center"><Translate id="react.report.transaction.closingBalance.label" defaultMessage="Closing" /></th>
                </tr>
              </thead>
              <tbody>
                {!rows.length && (
                  <tr>
                    <td colSpan={8} className="text-center">
                      <Translate id="react.report.noData.message" defaultMessage="No records found" />
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr
                    key={`${row.Code}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openDetails(row)}
                  >
                    <td>{row.Code}</td>
                    <td title={row.DisplayName ? row.Name : undefined}>
                      {row.DisplayName || row.Name}
                    </td>
                    <td>{row.Category}</td>
                    <td className="text-right">{formatNumber(row.Opening)}</td>
                    <td className={`text-right ${Number(row.Credits) > 0 ? 'credit' : ''}`}>{formatNumber(row.Credits)}</td>
                    <td className={`text-right ${Number(row.Debits) > 0 ? 'debit' : ''}`}>{formatNumber(row.Debits)}</td>
                    <td className={`text-right ${adjustmentsClass(row)}`}>{renderAdjustments(row)}</td>
                    <td className="text-right">{formatNumber(row.Closing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {detailsRows !== null && (
        <div
          className="modal d-block"
          role="dialog"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{detailsTitle}</h5>
                <button type="button" className="close" aria-label="Close" onClick={closeDetails}>
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {detailsLoading && <div className="loading"><Translate id="react.default.loading.label" defaultMessage="Loading..." /></div>}
                <table id="dialogDataTable" className="table table-striped table-bordered">
                  <thead>
                    <tr>
                      {DETAIL_COLUMNS.map((column) => (
                        <th key={column.key}>
                          <Translate id={column.translationId} defaultMessage={column.label} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!detailsRows.length && !detailsLoading && (
                      <tr>
                        <td colSpan={DETAIL_COLUMNS.length} className="text-center">
                          <Translate id="react.report.noData.message" defaultMessage="No records found" />
                        </td>
                      </tr>
                    )}
                    {detailsRows.map((row, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <tr key={`${row.transactionDate}-${row.transactionTime}-${index}`}>
                        {DETAIL_COLUMNS.map((column) => (
                          <td key={column.key}>{row[column.key]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default ShowTransactionReport;
