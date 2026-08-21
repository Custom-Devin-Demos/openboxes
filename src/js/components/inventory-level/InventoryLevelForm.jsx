import React, { useEffect, useState } from 'react';

import queryString from 'query-string';
import { useLocation, useParams } from 'react-router-dom';

import InventoryLevelApi from 'api/services/InventoryLevelApi';
import notification from 'components/Layout/notifications/notification';
import { CONTEXT_PATH, INVENTORY_LEVEL_URL } from 'consts/applicationUrls';
import NotificationType from 'consts/notificationTypes';
import useTranslation from 'hooks/useTranslation';
import apiClient from 'utils/apiClient';
import Translate from 'utils/Translate';
import PageWrapper from 'wrappers/PageWrapper';

import 'components/inventory/inventoryLegacy.scss';

const TABS = ['target', 'replenishment', 'receiving', 'forecasting'];

const InventoryLevelForm = () => {
  useTranslation('inventoryLevel', 'inventory', 'product', 'default');

  const { id } = useParams();
  const location = useLocation();
  const parsedQuery = queryString.parse(location.search);

  const [context, setContext] = useState(null);
  const [activeTab, setActiveTab] = useState('target');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productOptions, setProductOptions] = useState([]);
  const [values, setValues] = useState({
    status: '',
    'product.id': parsedQuery['product.id'] || '',
    internalLocation: '',
    abcClass: '',
    comments: '',
    minQuantity: '',
    reorderQuantity: '',
    maxQuantity: '',
    expectedLeadTimeDays: '',
    replenishmentPeriodDays: '',
    replenishmentLocation: '',
    preferredBinLocation: '',
    forecastQuantity: '',
    forecastPeriodDays: '',
  });

  const isEdit = Boolean(id);

  useEffect(() => {
    InventoryLevelApi.getFormContext(id, {
      params: { 'product.id': parsedQuery['product.id'] },
    }).then((response) => {
      setContext(response.data);
      const { inventoryLevel } = response.data;
      if (inventoryLevel) {
        setValues((previous) => ({
          ...previous,
          status: inventoryLevel.status || '',
          'product.id': inventoryLevel.product?.id || '',
          internalLocation: inventoryLevel.internalLocation?.id || '',
          abcClass: inventoryLevel.abcClass || '',
          comments: inventoryLevel.comments || '',
          minQuantity: inventoryLevel.minQuantity != null ? inventoryLevel.minQuantity : '',
          reorderQuantity: inventoryLevel.reorderQuantity != null ? inventoryLevel.reorderQuantity : '',
          maxQuantity: inventoryLevel.maxQuantity != null ? inventoryLevel.maxQuantity : '',
          expectedLeadTimeDays: inventoryLevel.expectedLeadTimeDays != null ? inventoryLevel.expectedLeadTimeDays : '',
          replenishmentPeriodDays: inventoryLevel.replenishmentPeriodDays != null ? inventoryLevel.replenishmentPeriodDays : '',
          replenishmentLocation: inventoryLevel.replenishmentLocation?.id || '',
          preferredBinLocation: inventoryLevel.preferredBinLocation?.id || '',
          forecastQuantity: inventoryLevel.forecastQuantity != null ? inventoryLevel.forecastQuantity : '',
          forecastPeriodDays: inventoryLevel.forecastPeriodDays != null ? inventoryLevel.forecastPeriodDays : '',
        }));
      }
    });
  }, [id]);

  const setValue = (name, value) => setValues((previous) => ({ ...previous, [name]: value }));

  const searchProducts = async (term) => {
    setProductSearchTerm(term);
    if (term?.length > 2) {
      const response = await apiClient.get(`${CONTEXT_PATH}/json/findProductByName`, {
        params: { term },
      });
      setProductOptions(response.data || []);
    } else {
      setProductOptions([]);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessages([]);
    const payload = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      payload.append(key, value);
    });
    payload.append('location.id', context?.location?.id || '');
    const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    try {
      let response;
      if (isEdit) {
        payload.append('id', id);
        payload.append('version', context?.inventoryLevel?.version);
        response = await InventoryLevelApi.update(id, payload, config);
      } else {
        response = await InventoryLevelApi.create(payload, config);
      }
      notification(NotificationType.SUCCESS)({ message: response.data?.message });
      if (parsedQuery.redirectUrl) {
        window.location.href = parsedQuery.redirectUrl;
      } else {
        window.location.href = `${CONTEXT_PATH}/product/edit/${response.data?.productId}`;
      }
    } catch (error) {
      setErrorMessages(error?.response?.data?.errorMessages || ['An error occurred']);
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure?')) {
      return;
    }
    try {
      const response = await InventoryLevelApi.remove(id);
      notification(NotificationType.SUCCESS)({ message: response.data?.message });
      window.location.href = `${CONTEXT_PATH}/product/edit/${response.data?.productId}`;
    } catch (error) {
      setErrorMessages(error?.response?.data?.errorMessages || ['Could not delete inventory level']);
    }
  };

  const product = context?.product;

  return (
    <PageWrapper className="inventory-legacy-page">
      <div className="box p-3">
        <div className="d-flex justify-content-between align-items-center">
          <h2>
            {isEdit
              ? <Translate id="react.inventoryLevel.edit.label" defaultMessage="Edit Inventory Level" />
              : <Translate id="react.inventoryLevel.create.label" defaultMessage="Create Inventory Level" />}
          </h2>
          <div>
            <a className="btn btn-outline-secondary btn-sm mr-2" href={INVENTORY_LEVEL_URL.list()}>
              <Translate id="react.inventoryLevel.list.label" defaultMessage="List Inventory Levels" />
            </a>
            <a className="btn btn-outline-secondary btn-sm" href={INVENTORY_LEVEL_URL.create()}>
              <Translate id="react.inventoryLevel.add.label" defaultMessage="Add Inventory Level" />
            </a>
          </div>
        </div>
        {errorMessages.length > 0 && (
          <div className="alert alert-danger">
            <ul className="mb-0">
              {errorMessages.map((message) => <li key={message}>{message}</li>)}
            </ul>
          </div>
        )}
        <form onSubmit={onSubmit}>
          <ul className="nav nav-tabs mb-3">
            {TABS.map((tab) => (
              <li className="nav-item" key={tab}>
                <button
                  type="button"
                  className={`nav-link btn btn-link ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  <Translate id={`react.inventoryLevel.${tab}.label`} defaultMessage={tab.charAt(0).toUpperCase() + tab.slice(1)} />
                </button>
              </li>
            ))}
          </ul>
          {activeTab === 'target' && (
            <div>
              <div className="form-group row">
                <label htmlFor="status" className="col-sm-3 col-form-label">
                  <Translate id="react.inventoryLevel.status.label" defaultMessage="Status" />
                </label>
                <div className="col-sm-6">
                  <select
                    id="status"
                    className="form-control"
                    value={values.status}
                    onChange={(event) => setValue('status', event.target.value)}
                  >
                    <option value="">
                      Choose status
                    </option>
                    {context?.statusOptions?.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="productSearch" className="col-sm-3 col-form-label">
                  <Translate id="react.inventory.product.label" defaultMessage="Product" />
                </label>
                <div className="col-sm-6">
                  {product ? (
                    <span className="form-control-plaintext">
                      {product.displayName || product.name}
                    </span>
                  ) : (
                    <>
                      <input
                        id="productSearch"
                        type="text"
                        className="form-control"
                        placeholder="Choose product"
                        value={productSearchTerm}
                        onChange={(event) => searchProducts(event.target.value)}
                      />
                      {productOptions.length > 0 && (
                        <select
                          aria-label="Product options"
                          className="form-control mt-1"
                          value={values['product.id']}
                          onChange={(event) => setValue('product.id', event.target.value)}
                        >
                          <option value="" aria-label="None" />
                          {productOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label || option.value}
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="location" className="col-sm-3 col-form-label">
                  <Translate id="react.inventoryLevel.location.label" defaultMessage="Location" />
                </label>
                <div className="col-sm-6">
                  <input id="location" type="text" className="form-control" value={context?.location?.name || ''} disabled />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="internalLocation" className="col-sm-3 col-form-label">
                  <Translate id="react.inventoryLevel.binLocation.label" defaultMessage="Bin Location" />
                </label>
                <div className="col-sm-6">
                  <select
                    id="internalLocation"
                    className="form-control"
                    value={values.internalLocation}
                    onChange={(event) => setValue('internalLocation', event.target.value)}
                  >
                    <option value="">Optional</option>
                    {context?.binLocations?.map((bin) => (
                      <option key={bin.id} value={bin.id}>{bin.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="abcClass" className="col-sm-3 col-form-label">
                  <Translate id="react.inventoryLevel.abcClass.label" defaultMessage="ABC Analysis Class" />
                </label>
                <div className="col-sm-6">
                  <input
                    id="abcClass"
                    type="text"
                    className="form-control"
                    value={values.abcClass}
                    onChange={(event) => setValue('abcClass', event.target.value)}
                  />
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="comments" className="col-sm-3 col-form-label">
                  <Translate id="react.inventoryLevel.comments.label" defaultMessage="Comments" />
                </label>
                <div className="col-sm-6">
                  <textarea
                    id="comments"
                    className="form-control"
                    rows="5"
                    value={values.comments}
                    onChange={(event) => setValue('comments', event.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'replenishment' && (
            <div>
              {[
                ['minQuantity', 'Min Quantity'],
                ['reorderQuantity', 'Reorder Quantity'],
                ['maxQuantity', 'Max Quantity'],
                ['expectedLeadTimeDays', 'Expected Lead Time Days'],
                ['replenishmentPeriodDays', 'Replenishment Period Days'],
              ].map(([field, label]) => (
                <div className="form-group row" key={field}>
                  <label htmlFor={field} className="col-sm-3 col-form-label">
                    <Translate id={`react.inventoryLevel.${field}.label`} defaultMessage={label} />
                  </label>
                  <div className="col-sm-6">
                    <input
                      id={field}
                      type="text"
                      className="form-control"
                      value={values[field]}
                      onChange={(event) => setValue(field, event.target.value)}
                    />
                  </div>
                </div>
              ))}
              <div className="form-group row">
                <label htmlFor="replenishmentLocation" className="col-sm-3 col-form-label">
                  <Translate id="react.inventoryLevel.replenishmentLocation.label" defaultMessage="Default Replenishment Source" />
                </label>
                <div className="col-sm-6">
                  <select
                    id="replenishmentLocation"
                    className="form-control"
                    value={values.replenishmentLocation}
                    onChange={(event) => setValue('replenishmentLocation', event.target.value)}
                  >
                    <option value="" aria-label="None" />
                    {context?.binLocations?.map((bin) => (
                      <option key={bin.id} value={bin.id}>{bin.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'receiving' && (
            <div className="form-group row">
              <label htmlFor="preferredBinLocation" className="col-sm-3 col-form-label">
                <Translate id="react.inventoryLevel.preferredBinLocation.label" defaultMessage="Default Putaway Location" />
              </label>
              <div className="col-sm-6">
                <select
                  id="preferredBinLocation"
                  className="form-control"
                  value={values.preferredBinLocation}
                  disabled={Boolean(values.internalLocation)}
                  onChange={(event) => setValue('preferredBinLocation', event.target.value)}
                >
                  <option value="" aria-label="None" />
                  {context?.binLocations?.map((bin) => (
                    <option key={bin.id} value={bin.id}>{bin.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {activeTab === 'forecasting' && (
            <div>
              <div className="form-group row">
                <label htmlFor="forecastQuantity" className="col-sm-3 col-form-label">
                  <Translate id="react.inventoryLevel.forecastQuantity.label" defaultMessage="Forecast Quantity" />
                </label>
                <div className="col-sm-6 form-inline">
                  <input
                    id="forecastQuantity"
                    type="text"
                    className="form-control mr-2"
                    value={values.forecastQuantity}
                    onChange={(event) => setValue('forecastQuantity', event.target.value)}
                  />
                  {product?.unitOfMeasure || <Translate id="react.default.each.label" defaultMessage="EA" />}
                </div>
              </div>
              <div className="form-group row">
                <label htmlFor="forecastPeriodDays" className="col-sm-3 col-form-label">
                  <Translate id="react.inventoryLevel.forecastPeriodDays.label" defaultMessage="Forecast Period Days" />
                </label>
                <div className="col-sm-6 form-inline">
                  <input
                    id="forecastPeriodDays"
                    type="text"
                    className="form-control mr-2"
                    value={values.forecastPeriodDays}
                    onChange={(event) => setValue('forecastPeriodDays', event.target.value)}
                  />
                  <Translate id="react.default.days.label" defaultMessage="days" />
                </div>
              </div>
            </div>
          )}
          <div className="mt-3">
            <button type="submit" className="btn btn-primary btn-sm mr-2" disabled={submitting}>
              {isEdit
                ? <Translate id="react.default.button.update.label" defaultMessage="Update" />
                : <Translate id="react.default.button.create.label" defaultMessage="Create" />}
            </button>
            {isEdit && (
              <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
                <Translate id="react.default.button.delete.label" defaultMessage="Delete" />
              </button>
            )}
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default InventoryLevelForm;
