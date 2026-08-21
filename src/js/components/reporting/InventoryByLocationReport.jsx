/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import { REPORT_INVENTORY_BY_LOCATION } from 'api/urls';
import { DASHBOARD_URL, REPORT_URL } from 'consts/applicationUrls';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import { fetchLocations, fetchProductsCategories } from 'utils/option-utils';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import '../inventory/inventoryLegacy.scss';

const InventoryByLocationReport = () => {
  useTranslation('report', 'default');

  const [locationOptions, setLocationOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [includeSubcategories, setIncludeSubcategories] = useState(true);
  const [reportLocations, setReportLocations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [hasRun, setHasRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    // Same location filter as the legacy g:selectLocation (MANAGE_INVENTORY)
    fetchLocations({ activityCodes: ['MANAGE_INVENTORY'] })
      .then((locations) => setLocationOptions(locations));
    fetchProductsCategories()
      .then((categories) => setCategoryOptions(categories));
  }, []);

  const buildSearchParams = () => {
    const searchParams = new URLSearchParams();
    selectedLocations.forEach((id) => searchParams.append('locations', id));
    selectedCategories.forEach((id) => searchParams.append('categories', id));
    searchParams.append('includeSubcategories', includeSubcategories ? 'on' : '');
    return searchParams;
  };

  const onRun = (event) => {
    event.preventDefault();
    setLoading(true);
    setErrors([]);
    const searchParams = buildSearchParams();
    searchParams.append('actionButton', 'run');
    apiClient.get(`${REPORT_INVENTORY_BY_LOCATION}?${searchParams.toString()}`)
      .then((response) => {
        setReportLocations(response.data.data?.locations || []);
        setEntries(response.data.data?.entries || []);
        setHasRun(true);
      })
      .catch((error) => {
        setErrors(error?.response?.data?.errorMessages || ['An error occurred on the server.']);
      })
      .finally(() => setLoading(false));
  };

  const onDownload = (event) => {
    event.preventDefault();
    // Legacy CSV download stays on the original controller action
    const searchParams = buildSearchParams();
    searchParams.append('actionButton', 'download');
    window.location.href = `${REPORT_URL.showInventoryByLocationReport()}?${searchParams.toString()}`;
  };

  const onMultiSelectChange = (event, setter) => {
    setter(Array.from(event.target.selectedOptions, (option) => option.value));
  };

  return (
    <PageWrapper className="inventory-legacy-page">
      {!!errors.length && (
        <div className="alert alert-danger" role="alert" aria-label="error-message">
          <ul className="mb-0">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}
      <div className="mb-2">
        <a href={DASHBOARD_URL.base} className="btn btn-outline-secondary btn-sm">
          <Translate id="react.report.backToDashboard.label" defaultMessage="Back to Dashboard" />
        </a>
      </div>
      <div className="box p-3 mb-2">
        <Translate
          id="react.report.inventoryByLocation.instructions.label"
          defaultMessage="In the Inventory by Location report, you find information about the inventory across multiple depot locations. Use this summary and filters to find quantities available in stock of a specific product or group of products in multiple locations."
        />
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="box p-3">
            <h2><Translate id="react.report.parameters.label" defaultMessage="Parameters" /></h2>
            <form onSubmit={onRun}>
              <div className="form-group">
                <label htmlFor="locations">
                  <Translate id="react.report.locations.label" defaultMessage="Locations" />
                </label>
                <select
                  id="locations"
                  name="locations"
                  className="form-control"
                  multiple
                  value={selectedLocations}
                  onChange={(event) => onMultiSelectChange(event, setSelectedLocations)}
                >
                  {locationOptions.map((location) => (
                    <option key={location.id} value={location.id}>{location.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="categories">
                  <Translate id="react.report.category.label" defaultMessage="Category" />
                </label>
                <select
                  id="categories"
                  name="categories"
                  className="form-control"
                  multiple
                  value={selectedCategories}
                  onChange={(event) => onMultiSelectChange(event, setSelectedCategories)}
                >
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>{category.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group form-check">
                <label htmlFor="includeSubcategories" className="form-check-label">
                  <input
                    id="includeSubcategories"
                    name="includeSubcategories"
                    type="checkbox"
                    className="form-check-input"
                    checked={includeSubcategories}
                    onChange={(event) => setIncludeSubcategories(event.target.checked)}
                  />
                  <Translate
                    id="react.report.search.includeCategoryChildren.label"
                    defaultMessage="Include all products in all subcategories"
                  />
                </label>
              </div>
              <div className="text-center">
                <button type="submit" name="actionButton" value="run" className="btn btn-primary mr-2">
                  <Translate id="react.default.button.run.label" defaultMessage="Run" />
                </button>
                <button type="button" name="actionButton" value="download" className="btn btn-secondary" onClick={onDownload}>
                  <Translate id="react.default.button.download.label" defaultMessage="Download" />
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="col-md-9">
          <div className="box p-3">
            <h2>
              <Translate id="react.report.inventoryByLocationReport.label" defaultMessage="Inventory By Location Report" />
              {' '}
              <small>{`(${entries.length} results)`}</small>
            </h2>
            {loading && <div className="loading"><Translate id="react.default.loading.label" defaultMessage="Loading..." /></div>}
            <table className="table table-striped table-bordered">
              <thead>
                <tr>
                  <th><Translate id="react.report.productCode.label" defaultMessage="Code" /></th>
                  <th><Translate id="react.report.product.label" defaultMessage="Product" /></th>
                  <th><Translate id="react.report.productFamily.label" defaultMessage="Product Family" /></th>
                  <th><Translate id="react.report.category.label" defaultMessage="Category" /></th>
                  <th><Translate id="react.report.formularies.label" defaultMessage="Formularies" /></th>
                  <th><Translate id="react.report.tags.label" defaultMessage="Tags" /></th>
                  {reportLocations.map((location) => (
                    <th key={location.id} className="text-center">
                      <Translate id="react.report.qoh.label" defaultMessage="QoH" />
                      {' '}
                      {location.name}
                    </th>
                  ))}
                  <th className="text-center"><Translate id="react.report.totalQoH.label" defaultMessage="QoH Total" /></th>
                  <th className="text-center"><Translate id="react.report.totalAvailableToPromise.label" defaultMessage="Quantity Available Total" /></th>
                </tr>
              </thead>
              <tbody>
                {hasRun && !entries.length && (
                  <tr>
                    <td colSpan={8 + reportLocations.length} className="text-center">
                      <Translate id="react.report.noData.message" defaultMessage="No records found" />
                    </td>
                  </tr>
                )}
                {entries.map((entry) => (
                  <tr key={`${entry.productCode}`}>
                    <td>{entry.productCode}</td>
                    <td>{entry.productName}</td>
                    <td>{entry.productFamily}</td>
                    <td>{entry.category}</td>
                    <td>{entry.formularies}</td>
                    <td>{entry.tags}</td>
                    {reportLocations.map((location) => (
                      <td key={location.id} className="text-center">
                        {entry.quantityOnHandByLocation?.[location.id]}
                      </td>
                    ))}
                    <td className="text-center">{entry.totalQuantityOnHand}</td>
                    <td className="text-center">{entry.totalQuantityAvailableToPromise}</td>
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

export default InventoryByLocationReport;
